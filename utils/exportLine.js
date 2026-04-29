// utils/exportLine.js
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { lineDAO } from '@/dao/lineDAO.js'
import deviceDAO from '@/dao/deviceDAO.js'
import { getSchema } from '@/schema/index.js'

/** Sheet 排列顺序 */
const SHEET_ORDER = [
    'substation',          // 变电站
    '__line__',            // 线路（占位，下方会单独插入）
    'pole',                // 杆塔
    'cable_turning_point', // 电缆拐点
    'pole_switchgear',     // 柱上开关 / 附属设备
    'transformer',         // 变压器
    'meter',               // 计量
    'station_room',        // 站房
    'switchgear',          // 开关柜
    'issue',               // 问题
]

/* ============================================================ */
/*                          主入口                              */
/* ============================================================ */
/**
 * 导出一条线路的全部数据
 * @param {number|string} lineId
 * @param {Object} [options]
 * @param {string} [options.fileName]      自定义文件名(不含扩展名),同时作为子目录名
 * @param {boolean} [options.includePhotos=true]  是否打包照片 zip
 * @param {string} [options.baseDir]       保存根目录绝对路径
 * @returns {Promise<{excelPath:string, zipPath:string, dirPath:string, displayPath:string}>}
 */
/** 主入口加日志 */
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
    // 用户传入的 fileName 优先;否则用 线路名_时间
    const finalFileName = fileName
        ? sanitizeFilename(fileName)
        : `${safeLineName}_${stamp}`

    // 子目录与文件同名,便于一眼对应
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
        const zip = new JSZip()
        const usedNames = new Set()
        const total = photoFiles.length
        let okCount = 0, idx = 0
        for (const pf of photoFiles) {
            idx++
            if (idx % 5 === 0 || idx === total) {
                uni.showLoading({ title: `打包照片 ${idx}/${total}`, mask: true })
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
                const data = await readFileAsArrayBuffer(pf.srcPath)
                zip.file(name, data)
                okCount++
            } catch (e) {
                console.warn('[export] 读取照片失败,跳过:', pf.srcPath, e)
            }
        }
        console.log('[export] 12. 照片读取完成,成功=', okCount)

        // ✅ 改用 base64,JSZip 必定支持
        const zipB64 = await zip.generateAsync({
            type: 'base64',
            compression: 'STORE'
        })
        console.log('[export] 13. zip 生成完成,base64 长度=', zipB64.length)

        zipAbs = `${absDir}/${finalFileName}_照片.zip`

        // ✅ 用 Android 原生写盘
        await writeBase64ToFileAbs(zipAbs, zipB64)
        console.log('[export] 14. zip 写入完成')

        // 校验
        try {
            const realSize = await getFileSizeAbs(zipAbs)
            console.log('[export] 14.1 落盘 zip 实际大小=', realSize)
        } catch (e) {
            console.warn('[export] 校验落盘大小失败', e)
        }
    } else if (!includePhotos) {
        console.log('[export] 11. 用户选择不导出照片,跳过 zip')
    }

    // 计算用户友好显示路径
    const displayPath = baseDir.replace(/^\/storage\/emulated\/0\//, '手机存储/') + '/' + folderName

    const result = {
        dirPath: absDir,
        excelPath: excelAbs,
        zipPath: zipAbs,
        displayPath
    }
    console.log('[export] 15. 全部完成', result)
    return result
}

/* ============================================================ */
/*                         Sheet 构建                            */
/* ============================================================ */

/** 线路 sheet */
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

/** 设备 sheet */
function addDeviceSheet(wb, schema, devices, line, idNameMap, photoFiles) {
    // 1) 字段排序
    const sortedFields = (schema.fields || [])
        .slice()
        .sort((a, b) => (a.exportOrder || 9999) - (b.exportOrder || 9999))

    // 2) 是否子设备:本组内有任何一条 parent_id 非空
    const isChildDevice = devices.some(d => d.parent_id && d.parent_id !== '')
    // 是否顶级设备(变电站这种,既无 prev_id 也无 parent_id)
    const isTopLevel = schema.deviceType === 'substation'

    // 3) 上级/所属节点列名
    const preNodeLabel = schema.preNodeFieldName ||
        (isChildDevice ? '所属设备' : '上级节点')

    // 4) 计算最大照片列数
    let maxPhotos = (schema.photoSlots || []).length
    devices.forEach(d => {
        const attrs = parseAttrs(d.attributes)
        const extra = (attrs._extraPhotoSlots || []).length
        const total = (schema.photoSlots || []).length + extra
        if (total > maxPhotos) maxPhotos = total
    })

    // 5) 表头
    const headers = []
    if (!isTopLevel) {
        if (!isChildDevice) headers.push('所属线路')
        headers.push(preNodeLabel)
    }
    sortedFields.forEach(f => headers.push(f.exportLabel || f.label || f.key))
    for (let i = 0; i < maxPhotos; i++) headers.push('照片')

    // 6) 数据行
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
    // sheet 名最长 31 字符,且不能含 /\?*[]:
    const sheetName = sanitizeSheetName(schema.label || schema.deviceType)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
}

/** 字段值格式化 */
function formatFieldValue(field, value, device) {
    // auto-calc 经纬度,若 attributes 内为空,回退到 device 主字段
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

/** 收集照片文件名,同时把待打包文件加入 photoFiles */
function collectPhotoNames(device, schema, attrs, photoFiles) {
    const photos = attrs._photos || {}
    const extraSlots = attrs._extraPhotoSlots || []
    const result = []

    const dateStr = formatDate(device.updated_at || device.created_at || Date.now())
    const deviceName = sanitizeFilename(device.name || '未命名')

        // 内置槽位
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

    // 自定义槽位
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

/* ============================================================ */
/*                      文件系统 (plus.io)                       */
/* ============================================================ */

/** 包装 plus.io.resolveLocalFileSystemURL 为 Promise，附超时 */
function resolveURL(url, timeout = 8000) {
    return new Promise((resolve, reject) => {
        let done = false
        const t = setTimeout(() => {
            if (done) return
            done = true
            reject(new Error(`resolveLocalFileSystemURL 超时: ${url}`))
        }, timeout)
        plus.io.resolveLocalFileSystemURL(url,
            (entry) => { if (done) return; done = true; clearTimeout(t); resolve(entry) },
            (err) => { if (done) return; done = true; clearTimeout(t); reject(new Error(`resolve失败 ${url}: ${err && err.message || JSON.stringify(err)}`)) }
        )
    })
}

/** 创建/获取目录 */
function getDir(parentEntry, name) {
    return new Promise((resolve, reject) => {
        parentEntry.getDirectory(name, { create: true, exclusive: false },
            resolve,
            (err) => reject(new Error(`getDirectory失败 ${name}: ${err && err.message || JSON.stringify(err)}`))
        )
    })
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

/* ============================================================ */
/*                  读取本地文件 → ArrayBuffer                    */
/* ============================================================ */

/**
 * 通用文件读取:支持 _doc/、_downloads/、file://、/storage/、/sdcard/ 等
 * 通过 readAsDataURL 拿 base64,再转 ArrayBuffer,绕开二进制桥接的坑
 */
function readFileAsArrayBuffer(path) {
    return new Promise((resolve, reject) => {
        if (!path) return reject(new Error('路径为空'))

        // 统一一下 file:// 前缀(plus.io 不一定接受)
        let url = String(path)
        // 注意:_doc/ _downloads/ 等虚拟路径必须保留,不要前缀斜杠

        const timer = setTimeout(() => {
            reject(new Error('读取超时:' + url))
        }, 30000)

        plus.io.resolveLocalFileSystemURL(url, (entry) => {
            entry.file((file) => {
                const reader = new plus.io.FileReader()
                reader.onloadend = (e) => {
                    clearTimeout(timer)
                    try {
                        const dataUrl = e.target.result || ''
                        // dataUrl 形如:data:image/png;base64,iVBORw0KGgo...
                        const idx = dataUrl.indexOf('base64,')
                        if (idx < 0) {
                            return reject(new Error('readAsDataURL 返回格式异常'))
                        }
                        const b64 = dataUrl.substring(idx + 7)
                        resolve(base64ToArrayBuffer(b64))
                    } catch (err) {
                        reject(new Error('解析 dataURL 失败:' + (err && err.message || err)))
                    }
                }
                reader.onerror = (e) => {
                    clearTimeout(timer)
                    reject(new Error('FileReader 错误:' + JSON.stringify(e)))
                }
                // 关键:用 DataURL 而不是 ArrayBuffer
                reader.readAsDataURL(file)
            }, (err) => {
                clearTimeout(timer)
                reject(new Error('entry.file 失败:' + JSON.stringify(err)))
            })
        }, (err) => {
            clearTimeout(timer)
            reject(new Error('resolve 失败 ' + url + ':' + JSON.stringify(err)))
        })
    })
}

/** base64 → ArrayBuffer (大文件分块,避免 atob 一次性过大) */
function base64ToArrayBuffer(b64) {
    const binary = atob(b64)
    const len = binary.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
    return bytes.buffer
}


/* ============================================================ */
/*           Android 绝对路径写文件(Java File API)              */
/* ============================================================ */

/** 用 Java File 递归创建目录(同步) */
function mkdirsAbs(absPath) {
    if (plus.os.name !== 'Android') {
        // iOS 简化处理:写文件时父目录会自动 create
        return
    }
    const File = plus.android.importClass('java.io.File')
    const dir = new File(absPath)
    if (!dir.exists()) {
        const ok = dir.mkdirs()
        if (!ok) throw new Error('创建目录失败:' + absPath)
    }
}

/** 用绝对路径写二进制文件(通过 base64 → Java byte[],避免有符号字节问题) */
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
            // 父目录确保存在
            const parent = file.getParentFile()
            if (parent && !parent.exists()) parent.mkdirs()

            // ArrayBuffer → base64 字符串(走 JS 端,不经过 java 桥的字节)
            const b64 = arrayBufferToBase64(arrayBuffer)
            // 在 Java 端解码为 byte[](Base64.DEFAULT = 0)
            const bytes = Base64.decode(b64, 0)

            const fos = new FileOutputStream(file)
            fos.write(bytes)
            fos.flush()
            fos.close()

            // 通知媒体扫描,文件管理器/微信立即可见
            try {
                const Intent = plus.android.importClass('android.content.Intent')
                const Uri = plus.android.importClass('android.net.Uri')
                const main = plus.android.runtimeMainActivity()
                const intent = new Intent('android.intent.action.MEDIA_SCANNER_SCAN_FILE')
                intent.setData(Uri.fromFile(file))
                main.sendBroadcast(intent)
            } catch (e) { /* 忽略 */ }

            resolve(absPath)
        } catch (e) {
            reject(new Error('写文件异常:' + (e && e.message || e)))
        }
    })
}

/**
 * 把 base64 字符串以二进制形式写到绝对路径
 * Android: 用 android.util.Base64 + java.io.FileOutputStream,稳定且零拷贝开销
 */
function writeBase64ToFileAbs(absPath, base64) {
    return new Promise((resolve, reject) => {
        if (plus.os.name !== 'Android') {
            return reject(new Error('writeBase64ToFileAbs 当前仅实现 Android'))
        }
        let fos = null
        try {
            const File = plus.android.importClass('java.io.File')
            const FileOutputStream = plus.android.importClass('java.io.FileOutputStream')
            const Base64 = plus.android.importClass('android.util.Base64')

            // 确保父目录存在
            const file = new File(absPath)
            const parent = file.getParentFile()
            if (parent && !parent.exists()) parent.mkdirs()
            if (file.exists()) file['delete']()   // delete 是关键字,用方括号写法

            // Base64.DEFAULT = 0
            const bytes = Base64.decode(base64, 0)
            fos = new FileOutputStream(absPath)
            fos.write(bytes)
            fos.flush()
            resolve(absPath)
        } catch (e) {
            reject(new Error('原生写入失败:' + (e && e.message || e)))
        } finally {
            try { if (fos) fos.close() } catch (_) { }
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