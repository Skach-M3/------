import { lineDAO } from '@/dao/lineDAO.js'
import deviceDAO from '@/dao/deviceDAO.js'
import { dbHelper } from '@/db/dbHelper.js'
import { getSchema } from '@/schema/index.js'

const DEFAULT_BASE_DIR = '/storage/emulated/0/Download/线路核查导出'
const MAX_RECOVERY_DEVICE_ROWS = 5000

export async function exportLineDiagnostic(lineId, options = {}) {
    const {
        fileName,
        baseDir = DEFAULT_BASE_DIR,
        maxRecoveryDeviceRows = MAX_RECOVERY_DEVICE_ROWS
    } = options

    const steps = []
    const runtime = getRuntimeInfo()
    const startedAt = new Date().toISOString()
    const finalFileName = sanitizeFilename(fileName || `线路_${formatDateTimeForDir(Date.now())}`)
    const absDir = `${baseDir}/${finalFileName}`
    const probeAbs = `${absDir}/${finalFileName}_诊断探针.json`
    const summaryAbs = `${absDir}/${finalFileName}_诊断摘要.json`
    const selectedDevicesAbs = `${absDir}/${finalFileName}_当前线路设备原始数据.json`
    const recoveryDevicesAbs = `${absDir}/${finalFileName}_全库设备恢复数据.json`

    mkdirsAbs(absDir)
    await writeTextFileAbs(probeAbs, JSON.stringify({
        codeMarker: 'line-diagnostic-v2-split-files',
        exportedAt: startedAt,
        lineId,
        runtime,
        exportTarget: {
            baseDir,
            folderName: finalFileName,
            probePath: probeAbs,
            summaryPath: summaryAbs,
            selectedDevicesPath: selectedDevicesAbs,
            recoveryDevicesPath: recoveryDevicesAbs
        }
    }, null, 2))

    const lineByDao = await runDiagnosticStep(steps, 'lineDAO.findById', () => lineDAO.findById(lineId))
    const devicesByDao = await runDiagnosticStep(steps, 'deviceDAO.findAllByLine', () => deviceDAO.findAllByLine(lineId))
    const allLinesByDao = await runDiagnosticStep(steps, 'lineDAO.findAll', () => lineDAO.findAll())

    const sqliteMaster = await runSqlStep(steps, 'sqlite_master', `
        SELECT type, name, tbl_name, sql
        FROM sqlite_master
        WHERE type IN ('table', 'index')
        ORDER BY type, name
    `)
    const lineColumns = await runSqlStep(steps, 'PRAGMA table_info(t_line)', 'PRAGMA table_info(t_line)')
    const deviceColumns = await runSqlStep(steps, 'PRAGMA table_info(t_device)', 'PRAGMA table_info(t_device)')
    const lineCountRows = await runSqlStep(steps, 't_line count', 'SELECT COUNT(*) AS count FROM t_line')
    const deviceCountRows = await runSqlStep(steps, 't_device count', 'SELECT COUNT(*) AS count FROM t_device')
    const selectedLineBySql = await runSqlStep(steps, 'selected line by id', 'SELECT * FROM t_line WHERE id = ? LIMIT 1', [lineId])
    const selectedLineByCastSql = await runSqlStep(steps, 'selected line by CAST(id AS TEXT)', 'SELECT * FROM t_line WHERE CAST(id AS TEXT) = ? LIMIT 1', [String(lineId)])
    const allLinesBySql = await runSqlStep(steps, 'all lines', 'SELECT * FROM t_line ORDER BY id DESC')
    const devicesBySql = await runSqlStep(steps, 'devices by line_id', `
        SELECT *
        FROM t_device
        WHERE line_id = ?
        ORDER BY sort_order ASC, created_at ASC
    `, [lineId])
    const devicesByCastSql = await runSqlStep(steps, 'devices by CAST(line_id AS TEXT)', `
        SELECT *
        FROM t_device
        WHERE CAST(line_id AS TEXT) = ?
        ORDER BY sort_order ASC, created_at ASC
    `, [String(lineId)])
    const deviceCountByLine = await runSqlStep(steps, 'device count by line_id', `
        SELECT line_id, COUNT(*) AS count
        FROM t_device
        GROUP BY line_id
        ORDER BY count DESC, line_id ASC
    `)
    const deviceCountByType = await runSqlStep(steps, 'device count by type', `
        SELECT device_type, COUNT(*) AS count
        FROM t_device
        GROUP BY device_type
        ORDER BY count DESC, device_type ASC
    `)
    const recoveryDevices = await runSqlStep(steps, 'all devices recovery sample', `
        SELECT *
        FROM t_device
        ORDER BY line_id ASC, sort_order ASC, created_at ASC
        LIMIT ?
    `, [maxRecoveryDeviceRows])

    const line = pickFirstRecord(lineByDao) ||
        pickFirstRecord(selectedLineBySql) ||
        pickFirstRecord(selectedLineByCastSql) ||
        null
    const devices = pickBestDeviceRows(devicesByDao, devicesBySql, devicesByCastSql)
    const allLines = pickArray(allLinesBySql).length ? pickArray(allLinesBySql) : pickArray(allLinesByDao)
    const allRecoveryDevices = pickArray(recoveryDevices)

    const summaryPayload = {
        codeMarker: 'line-diagnostic-v2-split-files',
        exportedAt: startedAt,
        lineId,
        runtime,
        exportTarget: {
            baseDir,
            folderName: finalFileName,
            probePath: probeAbs,
            summaryPath: summaryAbs,
            selectedDevicesPath: selectedDevicesAbs,
            recoveryDevicesPath: recoveryDevicesAbs
        },
        summary: {
            lineTableCount: getCountValue(lineCountRows),
            deviceTableCount: getCountValue(deviceCountRows),
            allLineCount: allLines.length,
            selectedLineExists: !!line,
            selectedLineDeviceCount: devices.length,
            recoveryDeviceRowCount: allRecoveryDevices.length,
            recoveryDeviceRowsTruncated: allRecoveryDevices.length >= Number(maxRecoveryDeviceRows || MAX_RECOVERY_DEVICE_ROWS),
            possibleLineIdMismatch: devices.length === 0 && allRecoveryDevices.length > 0,
            deviceTypeSummary: buildDeviceTypeSummary(devices),
            attributeSummary: buildAttributeSummary(devices),
            expectedSheetNames: buildExpectedSheetNames(devices)
        },
        diagnostics: {
            steps,
            sqliteMaster: pickArray(sqliteMaster),
            lineColumns: pickArray(lineColumns),
            deviceColumns: pickArray(deviceColumns),
            deviceCountByLine: pickArray(deviceCountByLine),
            deviceCountByType: pickArray(deviceCountByType),
            daoResultSizes: {
                lineByDao: getResultSize(lineByDao),
                devicesByDao: getResultSize(devicesByDao),
                allLinesByDao: getResultSize(allLinesByDao)
            },
            sqlResultSizes: {
                selectedLineBySql: getResultSize(selectedLineBySql),
                selectedLineByCastSql: getResultSize(selectedLineByCastSql),
                devicesBySql: getResultSize(devicesBySql),
                devicesByCastSql: getResultSize(devicesByCastSql),
                allLinesBySql: getResultSize(allLinesBySql),
                recoveryDevices: getResultSize(recoveryDevices)
            }
        },
        line,
        lineReadVariants: {
            dao: lineByDao,
            sqlById: pickFirstRecord(selectedLineBySql),
            sqlByCastId: pickFirstRecord(selectedLineByCastSql)
        },
        deviceReadVariantSamples: buildDeviceReadVariantSamples(devicesByDao, devicesBySql, devicesByCastSql),
        allLines: allLines.map(item => ({
            id: item.id,
            station: item.station,
            name: item.name,
            unit: item.unit,
            recorder: item.recorder,
            created_date: item.created_date
        })),
        selectedDeviceSample: devices.slice(0, 20),
        recoveryDeviceSample: allRecoveryDevices.slice(0, 20)
    }

    const writeResults = []
    writeResults.push(await writeFileStep(summaryAbs, () => writeTextFileAbs(summaryAbs, JSON.stringify(summaryPayload, null, 2))))
    writeResults.push(await writeFileStep(selectedDevicesAbs, () => writeJsonArrayFileAbs(selectedDevicesAbs, devices)))
    writeResults.push(await writeFileStep(recoveryDevicesAbs, () => writeJsonArrayFileAbs(recoveryDevicesAbs, allRecoveryDevices)))

    summaryPayload.exportWriteResults = writeResults
    await writeFileStep(summaryAbs, () => writeTextFileAbs(summaryAbs, JSON.stringify(summaryPayload, null, 2)))

    notifyMediaScan(probeAbs)
    notifyMediaScan(summaryAbs)
    notifyMediaScan(selectedDevicesAbs)
    notifyMediaScan(recoveryDevicesAbs)

    return {
        dirPath: absDir,
        diagnosticPath: summaryAbs,
        diagnosticPaths: {
            probePath: probeAbs,
            summaryPath: summaryAbs,
            selectedDevicesPath: selectedDevicesAbs,
            recoveryDevicesPath: recoveryDevicesAbs
        },
        displayPath: baseDir.replace(/^\/storage\/emulated\/0\//, '手机存储/') + '/' + finalFileName
    }
}

async function runDiagnosticStep(steps, name, fn) {
    try {
        const result = await fn()
        steps.push({
            name,
            ok: true,
            rowCount: getResultSize(result)
        })
        return result
    } catch (e) {
        const error = normalizeError(e)
        steps.push({
            name,
            ok: false,
            error
        })
        console.warn('[diagnostic-export] step failed:', name, error)
        return {
            __diagnosticError: error
        }
    }
}

async function runSqlStep(steps, name, sql, params = []) {
    return runDiagnosticStep(steps, name, () => dbHelper.select(sql, params))
}

function pickFirstRecord(result) {
    if (Array.isArray(result)) return result[0] || null
    if (result && !result.__diagnosticError) return result
    return null
}

function pickArray(result) {
    return Array.isArray(result) ? result : []
}

function pickBestDeviceRows(...results) {
    const arrays = results.map(pickArray)
    return arrays.sort((a, b) => b.length - a.length)[0] || []
}

function getResultSize(result) {
    if (Array.isArray(result)) return result.length
    if (result && result.__diagnosticError) return 0
    if (result) return 1
    return 0
}

function getCountValue(result) {
    const row = pickArray(result)[0]
    return row ? Number(row.count || row['COUNT(*)'] || 0) : 0
}

function normalizeError(e) {
    return {
        message: e && e.message ? e.message : String(e),
        code: e && e.code !== undefined ? e.code : '',
        detail: safeStringify(e)
    }
}

function safeStringify(value) {
    try {
        return JSON.stringify(value)
    } catch (_) {
        return String(value)
    }
}

function buildDeviceTypeSummary(devices) {
    const summary = {}
    devices.forEach(device => {
        const type = device.device_type || ''
        if (!summary[type]) {
            const schema = getSchema(type)
            summary[type] = {
                count: 0,
                schemaLabel: schema && schema.label ? schema.label : '',
                hasSchemaFields: !!(schema && schema.fields && schema.fields.length)
            }
        }
        summary[type].count++
    })
    return summary
}

function buildAttributeSummary(devices) {
    let parseErrorCount = 0
    const parseErrors = []

    devices.forEach(device => {
        if (!device.attributes || typeof device.attributes !== 'string') return
        try {
            JSON.parse(device.attributes)
        } catch (e) {
            parseErrorCount++
            parseErrors.push({
                id: device.id,
                name: device.name,
                device_type: device.device_type,
                message: e && e.message ? e.message : String(e)
            })
        }
    })

    return {
        parseErrorCount,
        parseErrors
    }
}

function buildExpectedSheetNames(devices) {
    const names = ['线路']
    const used = {}

    devices.forEach(device => {
        const schema = getSchema(device.device_type)
        const rawName = schema && schema.label ? schema.label : (device.device_type || '未知设备')
        const sheetName = sanitizeSheetName(rawName)
        if (!used[sheetName]) {
            used[sheetName] = true
            names.push(sheetName)
        }
    })

    return names
}

function buildDeviceReadVariantSamples(devicesByDao, devicesBySql, devicesByCastSql) {
    return {
        dao: pickArray(devicesByDao).slice(0, 20),
        sqlByLineId: pickArray(devicesBySql).slice(0, 20),
        sqlByCastLineId: pickArray(devicesByCastSql).slice(0, 20)
    }
}

function getRuntimeInfo() {
    const info = {
        platform: '',
        osName: '',
        osVersion: '',
        deviceModel: '',
        deviceVendor: '',
        appid: '',
        appVersion: '',
        appVersionCode: ''
    }

    try {
        info.platform = uni.getSystemInfoSync().platform || ''
    } catch (_) { }

    try {
        if (typeof plus === 'undefined') return info
        info.osName = plus.os && plus.os.name || ''
        info.osVersion = plus.os && plus.os.version || ''
        info.deviceModel = plus.device && plus.device.model || ''
        info.deviceVendor = plus.device && plus.device.vendor || ''
        info.appid = plus.runtime && plus.runtime.appid || ''
        info.appVersion = plus.runtime && plus.runtime.version || ''
        info.appVersionCode = plus.runtime && (plus.runtime.versionCode || plus.runtime.innerVersion || '') || ''
    } catch (_) { }

    return info
}

function sanitizeFilename(name) {
    return String(name).replace(/[\\/:*?"<>|]/g, '_').trim() || '未命名'
}

function sanitizeSheetName(name) {
    return String(name).replace(/[\\/?*\[\]:]/g, '_').substring(0, 31)
}

function formatDateTimeForDir(ts) {
    const d = new Date(ts)
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`
}

function mkdirsAbs(absPath) {
    if (typeof plus === 'undefined' || plus.os.name !== 'Android') {
        throw new Error('诊断数据导出仅支持 Android App 环境')
    }
    const File = plus.android.importClass('java.io.File')
    const dir = new File(absPath)
    if (!dir.exists()) {
        const ok = dir.mkdirs()
        if (!ok) throw new Error('创建目录失败:' + absPath)
    }
}

function writeTextFileAbs(absPath, text) {
    return new Promise((resolve, reject) => {
        let writer = null
        let fos = null
        try {
            if (typeof plus === 'undefined' || plus.os.name !== 'Android') {
                return reject(new Error('诊断数据导出仅支持 Android App 环境'))
            }
            const File = plus.android.importClass('java.io.File')
            const FileOutputStream = plus.android.importClass('java.io.FileOutputStream')
            const OutputStreamWriter = plus.android.importClass('java.io.OutputStreamWriter')
            const BufferedWriter = plus.android.importClass('java.io.BufferedWriter')

            const file = new File(absPath)
            const parent = file.getParentFile()
            if (parent && !parent.exists()) parent.mkdirs()

            if (file.exists()) file['delete']()

            fos = new FileOutputStream(file)
            writer = new BufferedWriter(new OutputStreamWriter(fos, 'UTF-8'))
            writer.write(String(text))
            writer.flush()
            writer.close()
            writer = null
            fos = null

            const size = Number(file.length() || 0)
            if (size <= 0) {
                return reject(new Error('诊断文件写入后仍为 0B:' + absPath))
            }
            resolve(absPath)
        } catch (e) {
            try { if (writer) writer.close() } catch (_) { }
            try { if (fos) fos.close() } catch (_) { }
            reject(new Error('写入诊断文件失败:' + (e && e.message || e)))
        }
    })
}

async function writeFileStep(absPath, writer) {
    try {
        await writer()
        return {
            path: absPath,
            ok: true,
            size: getFileSizeAbs(absPath)
        }
    } catch (e) {
        return {
            path: absPath,
            ok: false,
            size: getFileSizeAbs(absPath),
            error: normalizeError(e)
        }
    }
}

function writeJsonArrayFileAbs(absPath, rows) {
    return new Promise((resolve, reject) => {
        let writer = null
        let fos = null
        try {
            if (typeof plus === 'undefined' || plus.os.name !== 'Android') {
                return reject(new Error('诊断数据导出仅支持 Android App 环境'))
            }
            const File = plus.android.importClass('java.io.File')
            const FileOutputStream = plus.android.importClass('java.io.FileOutputStream')
            const OutputStreamWriter = plus.android.importClass('java.io.OutputStreamWriter')
            const BufferedWriter = plus.android.importClass('java.io.BufferedWriter')

            const file = new File(absPath)
            const parent = file.getParentFile()
            if (parent && !parent.exists()) parent.mkdirs()
            if (file.exists()) file['delete']()

            fos = new FileOutputStream(file)
            writer = new BufferedWriter(new OutputStreamWriter(fos, 'UTF-8'))
            writer.write('[\n')
            const list = Array.isArray(rows) ? rows : []
            for (let i = 0; i < list.length; i++) {
                if (i > 0) writer.write(',\n')
                writer.write(JSON.stringify(list[i]))
                if (i > 0 && i % 50 === 0) writer.flush()
            }
            writer.write('\n]\n')
            writer.flush()
            writer.close()
            writer = null
            fos = null

            const size = Number(file.length() || 0)
            if (size <= 0) {
                return reject(new Error('诊断数组文件写入后仍为 0B:' + absPath))
            }
            resolve(absPath)
        } catch (e) {
            try { if (writer) writer.close() } catch (_) { }
            try { if (fos) fos.close() } catch (_) { }
            reject(new Error('写入诊断数组文件失败:' + (e && e.message || e)))
        }
    })
}

function getFileSizeAbs(absPath) {
    try {
        if (typeof plus === 'undefined' || plus.os.name !== 'Android') return -1
        const File = plus.android.importClass('java.io.File')
        const file = new File(absPath)
        return Number(file.exists() ? file.length() : -1)
    } catch (_) {
        return -1
    }
}

function notifyMediaScan(absPath) {
    try {
        if (typeof plus === 'undefined' || plus.os.name !== 'Android') return
        const File = plus.android.importClass('java.io.File')
        const Intent = plus.android.importClass('android.content.Intent')
        const Uri = plus.android.importClass('android.net.Uri')
        const main = plus.android.runtimeMainActivity()
        const file = new File(absPath)
        const intent = new Intent('android.intent.action.MEDIA_SCANNER_SCAN_FILE')
        intent.setData(Uri.fromFile(file))
        main.sendBroadcast(intent)
    } catch (_) { }
}
