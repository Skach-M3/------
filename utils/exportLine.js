// utils/exportLine.js
import * as XLSX from 'xlsx'
import { lineDAO } from '@/dao/lineDAO.js'
import deviceDAO from '@/dao/deviceDAO.js'
import { getSchema } from '@/schema/index.js'

/** Sheet 排列顺序 */
const SHEET_ORDER = [
    'substation',
    '__line__',
    'pole',
    'cable_turning_point',
    'pole_switchgear',
    'transformer',
    'meter',
    'station_room',
    'switchgear',
    'issue',
]

/* ============================================================ */
/*                          主入口                              */
/* ============================================================ */
export async function exportLine(lineId, options = {}) {
    const {
        fileName,
        includePhotos = true,
        baseDir = '/storage/emulated/0/Download/线路核查导出'
    } = options

    console.log('[export] 1. 开始,lineId=', lineId, 'options=', options)

    const line = await lineDAO.findById(lineId)
    console.log('[export] 2. 线路=', line)
    if (!line) throw new Error('线路不存在')

    const allDevices = await deviceDAO.findAllByLine(lineId)
    console.log('[export] 3. 设备数=', allDevices.length)

    const idNameMap = {}
    allDevices.forEach(d => { idNameMap[d.id] = d.name || '' })

    const grouped = {}
    allDevices.forEach(d => {
        if (!grouped[d.device_type]) grouped[d.device_type] = []
        grouped[d.device_type].push(d)
    })
    console.log('[export] 4. 分组=', Object.keys(grouped).map(k => `${k}:${grouped[k].length}`))

    const wb = XLSX.utils.book_new()
    const photoFiles = []

    for (const type of SHEET_ORDER) {
        if (type === '__line__') { addLineSheet(wb, line); continue }
        if (!grouped[type]) continue
        const schema = getSchema(type)
        if (!schema) { delete grouped[type]; continue }
        addDeviceSheet(wb, schema, grouped[type], line, idNameMap, photoFiles)
        delete grouped[type]
    }
    Object.keys(grouped).forEach(type => {
        const schema = getSchema(type)
        if (!schema) return
        addDeviceSheet(wb, schema, grouped[type], line, idNameMap, photoFiles)
    })
    console.log('[export] 5. workbook 构建完成,照片数=', photoFiles.length)

    const excelBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    console.log('[export] 6. excel buffer 生成,size=', excelBuf.byteLength)

    // === 文件名/目录名 ===
    const stamp = formatDateTimeForDir(Date.now())
    const safeLineName = sanitizeFilename(line.name || '线路')
    const finalFileName = fileName
        ? sanitizeFilename(fileName)
        : `${safeLineName}_${stamp}`

    const folderName = finalFileName
    const absDir = `${baseDir}/${folderName}`

    console.log('[export] 7. 准备创建目录', absDir)
    mkdirsAbs(absDir)
    console.log('[export] 8. 目录创建完成')

    const excelAbs = `${absDir}/${finalFileName}.xlsx`
    console.log('[export] 9. 准备写 excel', excelAbs)
    await writeBinaryFileAbs(excelAbs, excelBuf)
    console.log('[export] 10. excel 写入完成')

    let zipAbs = ''
    if (includePhotos && photoFiles.length > 0) {
        console.log('[export] 11. 开始打包 zip,共', photoFiles.length, '张')
        zipAbs = `${absDir}/${finalFileName}_照片.zip`
        try {
            const okCount = await packPhotosToPublicZip(photoFiles, finalFileName, zipAbs)
            console.log('[export] 12. 照片打包完成,成功=', okCount)
        } catch (e) {
            console.error('[export] 照片打包失败', e)
            zipAbs = ''
            throw e
        }
        notifyMediaScan(zipAbs)
        try {
            const realSize = await getFileSizeAbs(zipAbs)
            console.log('[export] 13. 落盘 zip 实际大小=', realSize)
        } catch (e) { /* ignore */ }
    } else if (!includePhotos) {
        console.log('[export] 11. 用户选择不导出照片,跳过 zip')
    }

    const displayPath = baseDir.replace(/^\/storage\/emulated\/0\//, '手机存储/') + '/' + folderName

    const result = {
        dirPath: absDir,
        excelPath: excelAbs,
        zipPath: zipAbs,
        displayPath
    }
    console.log('[export] 14. 全部完成', result)
    return result
}

/* ============================================================ */
/*               照片打包(全程沙盒,最后 Java 拷出)             */
/* ============================================================ */
/**
 * 流程:
 *   1) _doc/__export_stage__/<folderName>/  作为沙盒暂存目录
 *   2) 用 plus.io.copyTo 将每张照片(也在沙盒)按目标名复制进暂存
 *   3) plus.zip.compress(暂存目录, _doc/__export_stage__/<folderName>.zip)
 *   4) 用 Java FileChannel 把沙盒 zip 拷到公共 Download 目录
 *   5) 清理沙盒里的暂存目录与 zip
 */
async function packPhotosToPublicZip(photoFiles, finalFileName, destZipAbs) {
    // 1) 创建/重置沙盒暂存目录
    const docEntry = await resolveURLPromise('_doc/')
    const stageRoot = await getOrCreateDirEntry(docEntry, '__export_stage__')

    // 旧目录残留先清掉
    try {
        const old = await getDirIfExists(stageRoot, finalFileName)
        if (old) await removeRecursivelyEntry(old)
    } catch (_) { }
    const stageDir = await getOrCreateDirEntry(stageRoot, finalFileName)

    // 同样把可能残留的旧 zip 删掉
    const stageRelDir = `_doc/__export_stage__/${finalFileName}`
    const sandboxZipRel = `_doc/__export_stage__/${finalFileName}.zip`
    try {
        const oldZip = await resolveURLPromise(sandboxZipRel)
        await new Promise((res, rej) => oldZip.remove(res, rej))
    } catch (_) { }

    // 2) 逐张拷入暂存,处理重名
    const usedNames = new Set()
    const total = photoFiles.length
    let okCount = 0, idx = 0
    for (const pf of photoFiles) {
        idx++
        if (idx % 5 === 0 || idx === total) {
            uni.showLoading({ title: `准备照片 ${idx}/${total}`, mask: true })
        }
        let name = pf.exportName
        if (usedNames.has(name)) {
            const dot = name.lastIndexOf('.')
            const base = dot > 0 ? name.substring(0, dot) : name
            const ext = dot > 0 ? name.substring(dot) : ''
            let i = 2
            while (usedNames.has(`${base}(${i})${ext}`)) i++
            name = `${base}(${i})${ext}`
        }
        usedNames.add(name)

        try {
            await copyOnePhotoToSandbox(pf.srcPath, stageDir, stageRelDir, name)
            okCount++
        } catch (e) {
            console.warn('[export] 拷贝照片失败,跳过:', pf.srcPath, e && e.message || e)
        }
    }

    if (okCount === 0) {
        try { await removeRecursivelyEntry(stageDir) } catch (_) { }
        throw new Error('所有照片均拷贝失败')
    }

    // 3) 沙盒内压缩
    uni.showLoading({ title: '正在压缩照片...', mask: true })
    await compressPromise(stageRelDir, sandboxZipRel)
    console.log('[export]    plus.zip.compress 完成 ->', sandboxZipRel)

    // 4) 沙盒 zip → 公共目录(Java IO)
    const sandboxZipAbs = sandboxRelToAbs(sandboxZipRel)
    console.log('[export]    Java 拷贝', sandboxZipAbs, '->', destZipAbs)
    await javaCopyFile(sandboxZipAbs, destZipAbs)

    // 5) 清理沙盒
    try { await removeRecursivelyEntry(stageDir) } catch (e) { console.warn('[export] 清理 stage 失败', e) }
    try {
        const zipEntry = await resolveURLPromise(sandboxZipRel)
        await new Promise((res, rej) => zipEntry.remove(res, rej))
    } catch (_) { }

    return okCount
}

/** 单张照片拷入沙盒暂存(优先 plus.io.copyTo,失败回落 Java IO) */
async function copyOnePhotoToSandbox(srcPath, stageDirEntry, stageRelDir, destName) {
    // 先走 plus.io —— 沙盒到沙盒最稳
    try {
        const srcEntry = await resolveURLPromise(srcPath)
        await copyToPromise(srcEntry, stageDirEntry, destName)
        return
    } catch (e1) {
        // 兜底:Java IO 直接读源、写到沙盒目录
        try {
            const srcAbs = anyPathToAbs(srcPath)
            const destAbs = `${sandboxRelToAbs(stageRelDir)}/${destName}`
            await javaCopyFile(srcAbs, destAbs)
            return
        } catch (e2) {
            throw new Error('copyTo 失败:' + (e1 && e1.message || JSON.stringify(e1)) +
                ' | java 兜底失败:' + (e2 && e2.message || e2))
        }
    }
}

/* ============================================================ */
/*                         Sheet 构建                            */
/* ============================================================ */

function addLineSheet(wb, line) {
    const aoa = [
        ['所属变电站', '线路名称', '归属单位', '采录人', '创建日期'],
        [
            line.station || '',
            line.name || '',
            line.unit || '',
            line.recorder || '',
            line.created_date || ''
        ]
    ]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    XLSX.utils.book_append_sheet(wb, ws, '线路')
}

function addDeviceSheet(wb, schema, devices, line, idNameMap, photoFiles) {
    const sortedFields = (schema.fields || [])
        .slice()
        .sort((a, b) => (a.exportOrder || 9999) - (b.exportOrder || 9999))

    const isChildDevice = devices.some(d => d.parent_id && d.parent_id !== '')
    const isTopLevel = schema.deviceType === 'substation'

    const preNodeLabel = schema.preNodeFieldName ||
        (isChildDevice ? '所属设备' : '上级节点')

    let maxPhotos = (schema.photoSlots || []).length
    devices.forEach(d => {
        const attrs = parseAttrs(d.attributes)
        const extra = (attrs._extraPhotoSlots || []).length
        const total = (schema.photoSlots || []).length + extra
        if (total > maxPhotos) maxPhotos = total
    })

    const headers = []
    if (!isTopLevel) {
        if (!isChildDevice) headers.push('所属线路')
        headers.push(preNodeLabel)
    }
    sortedFields.forEach(f => headers.push(f.exportLabel || f.label || f.key))
    for (let i = 0; i < maxPhotos; i++) headers.push('照片')

    const rows = [headers]
    devices.forEach(d => {
        const attrs = parseAttrs(d.attributes)
        const row = []

        if (!isTopLevel) {
            if (!isChildDevice) row.push(line.name || '')
            let preName = ''
            if (d.parent_id) preName = idNameMap[d.parent_id] || ''
            else if (d.prev_id) preName = idNameMap[d.prev_id] || ''
            row.push(preName)
        }

        sortedFields.forEach(f => {
            row.push(formatFieldValue(f, attrs[f.key], d))
        })

        const photoNames = collectPhotoNames(d, schema, attrs, photoFiles)
        photoNames.forEach(n => row.push(n))
        for (let i = photoNames.length; i < maxPhotos; i++) row.push('')

        rows.push(row)
    })

    const ws = XLSX.utils.aoa_to_sheet(rows)
    const sheetName = sanitizeSheetName(schema.label || schema.deviceType)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
}

function formatFieldValue(field, value, device) {
    if (field.type === 'auto-calc') {
        if (value === undefined || value === null || value === '') {
            if (field.key === 'longitude') return device.longitude || ''
            if (field.key === 'latitude') return device.latitude || ''
        }
    }
    if (value === undefined || value === null || value === '') return ''
    if (Array.isArray(value)) return value.join('、')
    return String(value)
}

function collectPhotoNames(device, schema, attrs, photoFiles) {
    const photos = attrs._photos || {}
    const extraSlots = attrs._extraPhotoSlots || []
    const result = []

    const dateStr = formatDate(device.updated_at || device.created_at || Date.now())
    const deviceName = sanitizeFilename(device.name || '未命名')

        ; (schema.photoSlots || []).forEach(slot => {
            const path = photos[slot.key]
            if (path) {
                const ext = getFileExt(path) || 'jpg'
                const name = `${deviceName}+${slot.label}+${dateStr}.${ext}`
                result.push(name)
                photoFiles.push({ exportName: name, srcPath: path })
            } else {
                result.push('')
            }
        })

    extraSlots.forEach(slot => {
        const path = photos[slot.key]
        if (path) {
            const ext = getFileExt(path) || 'jpg'
            const name = `${deviceName}+${slot.label}+${dateStr}.${ext}`
            result.push(name)
            photoFiles.push({ exportName: name, srcPath: path })
        }
    })

    return result
}

/* ============================================================ */
/*                          工具函数                             */
/* ============================================================ */

function parseAttrs(raw) {
    if (!raw) return {}
    if (typeof raw === 'string') {
        try { return JSON.parse(raw) } catch (e) { return {} }
    }
    return raw
}

function sanitizeFilename(name) {
    return String(name).replace(/[\\/:*?"<>|]/g, '_').trim() || '未命名'
}

function sanitizeSheetName(name) {
    return String(name).replace(/[\\/?*\[\]:]/g, '_').substring(0, 31)
}

function formatDate(ts) {
    const d = new Date(typeof ts === 'number' ? ts : Date.now())
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function formatDateTimeForDir(ts) {
    const d = new Date(ts)
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`
}

function getFileExt(path) {
    const m = String(path).match(/\.([a-zA-Z0-9]+)(\?|$)/)
    return m ? m[1].toLowerCase() : ''
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
    }
    return btoa(binary)
}

/** 沙盒相对路径(_doc/...)→ 绝对路径 */
function sandboxRelToAbs(rel) {
    const url = plus.io.convertLocalFileSystemURL(rel) || ''
    return String(url).replace(/^file:\/\//, '')
}

/** 任意路径(_doc/、file://、/storage/...)→ 绝对路径,给 Java 用 */
function anyPathToAbs(p) {
    if (!p) return p
    let s = String(p)
    if (s.charAt(0) === '/') return s
    if (/^file:\/\//.test(s)) return s.replace(/^file:\/\//, '')
    // 视为 _doc/ _downloads/ 等虚拟路径
    return sandboxRelToAbs(s)
}

/** 通知系统媒体扫描 */
function notifyMediaScan(absPath) {
    try {
        if (plus.os.name !== 'Android') return
        const File = plus.android.importClass('java.io.File')
        const Intent = plus.android.importClass('android.content.Intent')
        const Uri = plus.android.importClass('android.net.Uri')
        const main = plus.android.runtimeMainActivity()
        const file = new File(absPath)
        const intent = new Intent('android.intent.action.MEDIA_SCANNER_SCAN_FILE')
        intent.setData(Uri.fromFile(file))
        main.sendBroadcast(intent)
    } catch (e) { /* 忽略 */ }
}

/* ============================================================ */
/*                        plus.io Promise                       */
/* ============================================================ */

function resolveURLPromise(url) {
    return new Promise((resolve, reject) => {
        plus.io.resolveLocalFileSystemURL(url,
            resolve,
            (e) => reject(new Error('resolve失败 ' + url + ':' + (e && e.message || JSON.stringify(e))))
        )
    })
}

function getOrCreateDirEntry(parentEntry, name) {
    return new Promise((resolve, reject) => {
        parentEntry.getDirectory(name, { create: true, exclusive: false },
            resolve,
            (e) => reject(new Error('getDirectory失败 ' + name + ':' + (e && e.message || JSON.stringify(e))))
        )
    })
}

function getDirIfExists(parentEntry, name) {
    return new Promise((resolve) => {
        parentEntry.getDirectory(name, { create: false, exclusive: false },
            resolve,
            () => resolve(null)
        )
    })
}

function copyToPromise(srcEntry, destDirEntry, newName) {
    return new Promise((resolve, reject) => {
        srcEntry.copyTo(destDirEntry, newName,
            resolve,
            (e) => reject(new Error('copyTo失败:' + (e && e.message || JSON.stringify(e))))
        )
    })
}

function removeRecursivelyEntry(dirEntry) {
    return new Promise((resolve, reject) => {
        dirEntry.removeRecursively(resolve, reject)
    })
}

/** plus.zip.compress —— 注意 src/zipfile 必须是沙盒(_doc/、_downloads/ 等) */
function compressPromise(srcRel, zipRel) {
    return new Promise((resolve, reject) => {
        try {
            plus.zip.compress(srcRel, zipRel,
                () => resolve(zipRel),
                (e) => reject(new Error('plus.zip.compress 失败:' + (e && e.message || JSON.stringify(e))))
            )
        } catch (err) {
            reject(new Error('plus.zip.compress 异常:' + (err && err.message || err)))
        }
    })
}

/** 读绝对路径文件大小 */
function getFileSizeAbs(absPath) {
    return new Promise((resolve, reject) => {
        let url = absPath
        if (url.charAt(0) === '/') url = 'file://' + url
        plus.io.resolveLocalFileSystemURL(url,
            (entry) => entry.file(f => resolve(f.size), reject),
            reject)
    })
}

/* ============================================================ */
/*                       Android 原生 IO                        */
/* ============================================================ */

/** 用 Java File 递归创建目录 */
function mkdirsAbs(absPath) {
    if (plus.os.name !== 'Android') return
    const File = plus.android.importClass('java.io.File')
    const dir = new File(absPath)
    if (!dir.exists()) {
        const ok = dir.mkdirs()
        if (!ok) throw new Error('创建目录失败:' + absPath)
    }
}

/** 写 Excel:ArrayBuffer → Java byte[] → 公共目录文件 */
function writeBinaryFileAbs(absPath, arrayBuffer) {
    return new Promise((resolve, reject) => {
        try {
            if (plus.os.name !== 'Android') {
                return reject(new Error('当前实现仅支持 Android'))
            }
            const File = plus.android.importClass('java.io.File')
            const FileOutputStream = plus.android.importClass('java.io.FileOutputStream')
            const Base64 = plus.android.importClass('android.util.Base64')

            const file = new File(absPath)
            const parent = file.getParentFile()
            if (parent && !parent.exists()) parent.mkdirs()

            const b64 = arrayBufferToBase64(arrayBuffer)
            const bytes = Base64.decode(b64, 0)

            const fos = new FileOutputStream(file)
            fos.write(bytes)
            fos.flush()
            fos.close()

            notifyMediaScan(absPath)
            resolve(absPath)
        } catch (e) {
            reject(new Error('写文件异常:' + (e && e.message || e)))
        }
    })
}

/**
 * Java IO 拷贝(沙盒 → 公共目录,或反向均可)
 * 优先 android.os.FileUtils.copy (API 29+,Android 10+ 必有)
 * 退路 1: java.nio.file.Files.copy (API 26+)
 * 退路 2: importClass 注入 FileChannel,再 transferTo
 * 退路 3: 流式 read/write(单字节,极慢,仅小文件兜底)
 */
function javaCopyFile(srcAbs, destAbs) {
    return new Promise((resolve, reject) => {
        if (plus.os.name !== 'Android') {
            return reject(new Error('javaCopyFile 仅支持 Android'))
        }
        let fis = null, fos = null
        try {
            const File = plus.android.importClass('java.io.File')
            const FileInputStream = plus.android.importClass('java.io.FileInputStream')
            const FileOutputStream = plus.android.importClass('java.io.FileOutputStream')

            const srcFile = new File(srcAbs)
            if (!srcFile.exists()) {
                return reject(new Error('源文件不存在:' + srcAbs))
            }
            const destFile = new File(destAbs)
            const parent = destFile.getParentFile()
            if (parent && !parent.exists()) parent.mkdirs()
            if (destFile.exists()) destFile['delete']()

            fis = new FileInputStream(srcFile)
            fos = new FileOutputStream(destFile)

            let copied = false
            let lastErr = null

            // ===== 方式 1: android.os.FileUtils.copy (Android 10+ 推荐) =====
            try {
                const FileUtils = plus.android.importClass('android.os.FileUtils')
                if (FileUtils && FileUtils.copy) {
                    FileUtils.copy(fis, fos)
                    copied = true
                    console.log('[export]    javaCopyFile: 用 FileUtils.copy 完成')
                }
            } catch (e1) {
                lastErr = e1
                console.warn('[export]    FileUtils.copy 失败,尝试退路', e1 && e1.message || e1)
            }

            // ===== 方式 2: java.nio.file.Files.copy (API 26+) =====
            if (!copied) {
                try {
                    const Files = plus.android.importClass('java.nio.file.Files')
                    // Files.copy(InputStream, Path, CopyOption...) — 但路径/可变参不好搞
                    // 改用 Files.copy(InputStream, OutputStream) 不存在;
                    // 用 srcFile.toPath() + 目标 OutputStream
                    const srcPath = srcFile.toPath()
                    plus.android.importClass(srcPath)
                    Files.copy(srcPath, fos)
                    copied = true
                    console.log('[export]    javaCopyFile: 用 Files.copy 完成')
                } catch (e2) {
                    lastErr = e2
                    console.warn('[export]    Files.copy 失败,尝试退路', e2 && e2.message || e2)
                }
            }

            // ===== 方式 3: FileChannel.transferTo,但要 importClass 注入方法 =====
            if (!copied) {
                try {
                    const inCh = fis.getChannel()
                    plus.android.importClass(inCh)   // 关键:把方法注入到这个对象
                    const outCh = fos.getChannel()
                    plus.android.importClass(outCh)
                    const size = inCh.size()
                    let transferred = 0
                    const CHUNK = 8 * 1024 * 1024
                    while (transferred < size) {
                        const remain = size - transferred
                        const cnt = remain > CHUNK ? CHUNK : remain
                        const n = inCh.transferTo(transferred, cnt, outCh)
                        if (n <= 0) break
                        transferred += n
                    }
                    try { outCh.close() } catch (_) { }
                    try { inCh.close() } catch (_) { }
                    copied = true
                    console.log('[export]    javaCopyFile: 用 FileChannel.transferTo 完成')
                } catch (e3) {
                    lastErr = e3
                    console.warn('[export]    FileChannel 失败,尝试最后退路', e3 && e3.message || e3)
                }
            }

            // ===== 方式 4: 流式逐字节(极慢,仅兜底) =====
            if (!copied) {
                try {
                    let b
                    while ((b = fis.read()) !== -1) {
                        fos.write(b)
                    }
                    copied = true
                    console.log('[export]    javaCopyFile: 用 单字节流 完成(慢)')
                } catch (e4) {
                    lastErr = e4
                }
            }

            try { fos.flush() } catch (_) { }
            try { fos.close() } catch (_) { }
            try { fis.close() } catch (_) { }

            if (!copied) {
                return reject(new Error('Java 拷贝失败,所有方式均失败:' +
                    (lastErr && lastErr.message || lastErr)))
            }
            resolve(destAbs)
        } catch (e) {
            try { if (fos) fos.close() } catch (_) { }
            try { if (fis) fis.close() } catch (_) { }
            reject(new Error('Java 拷贝失败:' + (e && e.message || e)))
        }
    })
}