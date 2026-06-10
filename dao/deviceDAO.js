// dao/deviceDAO.js
/**
 * 设备数据访问对象
 * 封装 t_device 表的增删改查，页面层不再直接写 SQL
 */
import { getSchema } from '@/schema/index.js'
import { dbHelper } from '../db/dbHelper.js'
import { generateId, haversineDistance } from '../utils/common.js'

const DAO_PERF_ENABLED = true
const DAO_PERF_PREFIX = '[MAP_PERF]'
let daoPerfSeq = 0

function daoPerfNow() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        return performance.now()
    }
    return Date.now()
}

function roundDaoPerfMs(value) {
    return Math.round(value * 100) / 100
}

function nextDaoTraceId(op) {
    daoPerfSeq += 1
    return `dao-${op}-${Date.now().toString(36)}-${daoPerfSeq}`
}

function daoPerfErrorMessage(error) {
    return error && error.message ? error.message : String(error)
}

function daoPerfLog(event, detail = {}) {
    if (!DAO_PERF_ENABLED) return

    const payload = {
        event,
        layer: 'dao',
        module: 'dao/deviceDAO.js',
        at: new Date().toISOString(),
        ...detail
    }

    try {
        console.log(DAO_PERF_PREFIX, JSON.stringify(payload))
    } catch (e) {
        console.log(DAO_PERF_PREFIX, payload)
    }
}

function summarizeDeviceForPerf(device = {}) {
    device = device || {}
    return {
        deviceId: device.id || '',
        lineId: device.line_id || '',
        deviceType: device.device_type || '',
        parentId: device.parent_id || '',
        prevId: device.prev_id || ''
    }
}

function parseAttributes(raw) {
    if (!raw) return {}
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw)
        } catch (e) {
            return {}
        }
    }
    return raw && typeof raw === 'object' ? { ...raw } : {}
}

function getDistanceFields(deviceType) {
    const schema = getSchema(deviceType)
    if (!schema || !Array.isArray(schema.fields)) return []
    return schema.fields.filter(field => field && field.calcType === 'distance_from_prev')
}

function hasValidCoordinate(longitude, latitude) {
    const lng = Number(longitude)
    const lat = Number(latitude)
    return Number.isFinite(lng) && Number.isFinite(lat)
}

function calcDistanceFromPrev(device, prevDevice) {
    if (!device || !prevDevice) return null
    if (!hasValidCoordinate(device.longitude, device.latitude)) return null
    if (!hasValidCoordinate(prevDevice.longitude, prevDevice.latitude)) return null

    return haversineDistance(
        Number(prevDevice.latitude),
        Number(prevDevice.longitude),
        Number(device.latitude),
        Number(device.longitude)
    ).toFixed(2)
}

async function updateDeviceAttributes(id, attrs, now) {
    await dbHelper.execute(
        `UPDATE t_device SET
            attributes = ?,
            sync_status = 0,
            updated_at = ?
        WHERE id = ?`,
        [JSON.stringify(attrs), now, id]
    )
}

const deviceDAO = {

    /**
     * 插入一条设备记录
     */
    async insert(device) {
        const traceId = nextDaoTraceId('insert')
        const perfStart = daoPerfNow()
        daoPerfLog('dao.insert.start', {
            traceId,
            ...summarizeDeviceForPerf(device)
        })

        const id = generateId()
        const now = Date.now()

        const sql = `INSERT INTO t_device (
      id, line_id, device_type, parent_id, prev_id,
      name, longitude, latitude, sort_order, attributes,
      sync_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`

        const params = [
            id,
            device.line_id || '',
            device.device_type || '',
            device.parent_id || '',
            device.prev_id || '',
            device.name || '',
            device.longitude || '',
            device.latitude || '',
            device.sort_order || 1,
            device.attributes || '{}',
            now,
            now
        ]

        try {
            await dbHelper.execute(sql, params)
            daoPerfLog('dao.insert.finish', {
                traceId,
                ...summarizeDeviceForPerf(device),
                deviceId: id,
                durationMs: roundDaoPerfMs(daoPerfNow() - perfStart)
            })
            return id
        } catch (e) {
            daoPerfLog('dao.insert.error', {
                traceId,
                deviceId: id,
                durationMs: roundDaoPerfMs(daoPerfNow() - perfStart),
                message: daoPerfErrorMessage(e)
            })
            throw e
        }
    },

    /**
     * 更新设备记录
     */
    async update(id, fields) {
        const traceId = nextDaoTraceId('update')
        const perfStart = daoPerfNow()
        daoPerfLog('dao.update.start', {
            traceId,
            ...summarizeDeviceForPerf(fields),
            deviceId: id
        })

        const now = Date.now()

        const sql = `UPDATE t_device SET
      line_id = ?,
      device_type = ?,
      parent_id = ?,
      prev_id = ?,
      name = ?,
      longitude = ?,
      latitude = ?,
      sort_order = ?,
      attributes = ?,
      sync_status = 0,
      updated_at = ?
    WHERE id = ?`

        const params = [
            fields.line_id || '',
            fields.device_type || '',
            fields.parent_id || '',
            fields.prev_id || '',
            fields.name || '',
            fields.longitude || '',
            fields.latitude || '',
            fields.sort_order || 1,
            fields.attributes || '{}',
            now,
            id
        ]

        try {
            await dbHelper.execute(sql, params)
            daoPerfLog('dao.update.finish', {
                traceId,
                ...summarizeDeviceForPerf(fields),
                deviceId: id,
                durationMs: roundDaoPerfMs(daoPerfNow() - perfStart)
            })
        } catch (e) {
            daoPerfLog('dao.update.error', {
                traceId,
                deviceId: id,
                durationMs: roundDaoPerfMs(daoPerfNow() - perfStart),
                message: daoPerfErrorMessage(e)
            })
            throw e
        }
    },

    /**
     * 仅更新设备的经纬度坐标
     * @param {string} id 设备ID
     * @param {string} longitude 经度
     * @param {string} latitude 纬度
     */
    async updateCoordinates(id, longitude, latitude) {
        const traceId = nextDaoTraceId('updateCoordinates')
        const perfStart = daoPerfNow()
        daoPerfLog('dao.updateCoordinates.start', {
            traceId,
            deviceId: id,
            longitude,
            latitude
        })

        const now = Date.now()
        const findStart = daoPerfNow()
        const device = await this.findById(id)
        const findDeviceMs = roundDaoPerfMs(daoPerfNow() - findStart)
        if (!device) {
            daoPerfLog('dao.updateCoordinates.finish', {
                traceId,
                deviceId: id,
                notFound: true,
                findDeviceMs,
                durationMs: roundDaoPerfMs(daoPerfNow() - perfStart)
            })
            return
        }

        const beginStart = daoPerfNow()
        await dbHelper.execute('BEGIN TRANSACTION')
        const beginTransactionMs = roundDaoPerfMs(daoPerfNow() - beginStart)
        let prevLookupMs = 0
        let updateCurrentMs = 0
        let nextQueryMs = 0
        let nextDistanceUpdateMs = 0
        let nextDistanceUpdateCount = 0
        let nextDevicesCount = 0
        let commitMs = 0
        let rollbackMs = 0

        try {
            const attrs = parseAttributes(device.attributes)
            const updatedDevice = {
                ...device,
                longitude,
                latitude
            }

            attrs.longitude = longitude
            attrs.latitude = latitude

            const distanceFields = getDistanceFields(device.device_type)
            if (distanceFields.length > 0 && device.prev_id) {
                const prevLookupStart = daoPerfNow()
                const prevDevice = await this.findById(device.prev_id)
                prevLookupMs = roundDaoPerfMs(daoPerfNow() - prevLookupStart)
                const distance = calcDistanceFromPrev(updatedDevice, prevDevice)
                if (distance !== null) {
                    distanceFields.forEach(field => {
                        attrs[field.key] = distance
                    })
                }
            }

            const sql = `UPDATE t_device SET
            longitude = ?,
            latitude = ?,
            attributes = ?,
            sync_status = 0,
            updated_at = ?
        WHERE id = ?`
            const updateCurrentStart = daoPerfNow()
            await dbHelper.execute(sql, [longitude, latitude, JSON.stringify(attrs), now, id])
            updateCurrentMs = roundDaoPerfMs(daoPerfNow() - updateCurrentStart)

            const nextQueryStart = daoPerfNow()
            const nextDevices = await dbHelper.select(
                'SELECT * FROM t_device WHERE prev_id = ?',
                [id]
            )
            nextQueryMs = roundDaoPerfMs(daoPerfNow() - nextQueryStart)
            nextDevicesCount = nextDevices.length

            for (const nextDevice of nextDevices) {
                const nextDistanceFields = getDistanceFields(nextDevice.device_type)
                if (nextDistanceFields.length === 0) continue

                const distance = calcDistanceFromPrev(nextDevice, updatedDevice)
                if (distance === null) continue

                const nextAttrs = parseAttributes(nextDevice.attributes)
                nextDistanceFields.forEach(field => {
                    nextAttrs[field.key] = distance
                })

                const nextUpdateStart = daoPerfNow()
                await updateDeviceAttributes(nextDevice.id, nextAttrs, now)
                nextDistanceUpdateMs += daoPerfNow() - nextUpdateStart
                nextDistanceUpdateCount++
            }

            const commitStart = daoPerfNow()
            await dbHelper.execute('COMMIT')
            commitMs = roundDaoPerfMs(daoPerfNow() - commitStart)
            daoPerfLog('dao.updateCoordinates.finish', {
                traceId,
                deviceId: id,
                lineId: device.line_id || '',
                deviceType: device.device_type || '',
                findDeviceMs,
                beginTransactionMs,
                prevLookupMs,
                updateCurrentMs,
                nextQueryMs,
                nextDevicesCount,
                nextDistanceUpdateCount,
                nextDistanceUpdateMs: roundDaoPerfMs(nextDistanceUpdateMs),
                commitMs,
                durationMs: roundDaoPerfMs(daoPerfNow() - perfStart)
            })
        } catch (e) {
            const rollbackStart = daoPerfNow()
            await dbHelper.execute('ROLLBACK')
            rollbackMs = roundDaoPerfMs(daoPerfNow() - rollbackStart)
            daoPerfLog('dao.updateCoordinates.error', {
                traceId,
                deviceId: id,
                findDeviceMs,
                beginTransactionMs,
                prevLookupMs,
                updateCurrentMs,
                nextQueryMs,
                nextDevicesCount,
                nextDistanceUpdateCount,
                nextDistanceUpdateMs: roundDaoPerfMs(nextDistanceUpdateMs),
                rollbackMs,
                durationMs: roundDaoPerfMs(daoPerfNow() - perfStart),
                message: daoPerfErrorMessage(e)
            })
            throw e
        }
    },

    /**
     * 根据 ID 查询单条设备
     */
    async findById(id) {
        const sql = 'SELECT * FROM t_device WHERE id = ?'
        return await dbHelper.selectOne(sql, [id])
    },

    /**
     * 查询指定线路 + 设备类型 + 父设备下，排序号最大的一条记录
     */
    async findLastDeviceByType(lineId, deviceType, parentId) {
        const sql = `SELECT * FROM t_device
      WHERE line_id = ? AND device_type = ? AND parent_id = ?
      ORDER BY sort_order DESC
      LIMIT 1`
        return await dbHelper.selectOne(sql, [lineId, deviceType, parentId || ''])
    },

    /**
     * 查询指定线路下，最后新建的可以被选为上级节点的设备记录
     * 如果最新设备不能作为上级节点，会继续往下找，直到找到为止
     */
    async findLastAvailablePreNode(lineId) {
        const sql = `SELECT * FROM t_device
      WHERE line_id = ?
      ORDER BY created_at DESC`
        const allDevices = await dbHelper.select(sql, [lineId])

        // 遍历所有设备，按创建时间降序，找到第一个可以作为上级节点的设备
        for (const device of allDevices) {
            const schema = getSchema(device.device_type)
            const isChildDevice = device.parent_id && device.parent_id !== ''
            if (schema && schema.isAvailablePreNode === true && !isChildDevice) {
                return device
            }
        }

        return null
    },

    /**
     * 查询指定父设备下某类型的全部子设备（按排序号升序）
     */
    async findByParent(lineId, deviceType, parentId) {
        const sql = `SELECT * FROM t_device
      WHERE line_id = ? AND device_type = ? AND parent_id = ?
      ORDER BY sort_order ASC`
        return await dbHelper.select(sql, [lineId, deviceType, parentId || ''])
    },

    /**
     * 查询指定线路下某类型的全部设备（按排序号升序）
     */
    async findByLine(lineId, deviceType) {
        const sql = `SELECT * FROM t_device
      WHERE line_id = ? AND device_type = ?
      ORDER BY sort_order ASC`
        return await dbHelper.select(sql, [lineId, deviceType])
    },

    /**
     * 查询指定线路下所有设备，并将子设备放在父设备的 children 属性中
     * @param {string} lineId
     * @returns {Array} 主设备列表，每个主设备包含 children 属性
     */
    async findAllByLineWithChildren(lineId) {
        const sql = `SELECT * FROM t_device
      WHERE line_id = ?
      ORDER BY created_at DESC`
        const allDevices = await dbHelper.select(sql, [lineId])
        // 分离主设备和子设备
        const mainDevices = []
        const childDevicesMap = {} // key: parent_id, value: 子设备数组
        allDevices.forEach(device => {
            const schema = getSchema(device.device_type)
            const isChildDevice = device.parent_id && device.parent_id !== ''
            if (isChildDevice) {
                // 子设备
                if (!childDevicesMap[device.parent_id]) {
                    childDevicesMap[device.parent_id] = []
                }
                childDevicesMap[device.parent_id].push({
                    ...device,
                    deviceLabel: schema ? schema.label : device.device_type
                })
            } else {
                // 主设备
                mainDevices.push({
                    ...device,
                    deviceLabel: schema ? schema.label : device.device_type,
                    icon: schema ? schema.icon : ''
                })
            }
        })
        // 将子设备附加到对应的主设备
        mainDevices.forEach(device => {
            device.children = childDevicesMap[device.id] || []
        })
        return mainDevices
    },


    // ← 新增：查询线路下所有设备（不区分类型），用于地图绘制
    /**
     * 查询指定线路下所有设备（按 sort_order、created_at 升序）
     * 用于地图页绘制设备标记和连线
     * @param {string} lineId
     * @returns {Array}
     */
    async findAllByLine(lineId) {
        const traceId = nextDaoTraceId('findAllByLine')
        const perfStart = daoPerfNow()
        daoPerfLog('dao.findAllByLine.start', {
            traceId,
            lineId
        })

        const sql = `SELECT * FROM t_device
      WHERE line_id = ?
      ORDER BY sort_order ASC, created_at ASC`
        try {
            const devices = await dbHelper.select(sql, [lineId])
            daoPerfLog('dao.findAllByLine.finish', {
                traceId,
                lineId,
                durationMs: roundDaoPerfMs(daoPerfNow() - perfStart),
                totalDevices: devices.length
            })
            return devices
        } catch (e) {
            daoPerfLog('dao.findAllByLine.error', {
                traceId,
                lineId,
                durationMs: roundDaoPerfMs(daoPerfNow() - perfStart),
                message: daoPerfErrorMessage(e)
            })
            throw e
        }
    },

    /**
     * 查询指定线路下所有可作为上级节点的设备
     * 用于设备编辑页面的上级节点选择
     * @param {string} lineId
     * @returns {Array}
     */
    async findAvailablePreNodes(lineId) {
        const sql = `SELECT * FROM t_device
      WHERE line_id = ?
      ORDER BY sort_order ASC, created_at ASC`
        const allDevices = await dbHelper.select(sql, [lineId])
        console.log("所有设备", allDevices);

        // 过滤出isAvailablePreNode为true且不是子设备的设备
        // 子设备的判断标准：parent_id 不为空
        return allDevices.filter(device => {
            const schema = getSchema(device.device_type)
            const isChildDevice = device.parent_id && device.parent_id !== ''
            return schema && schema.isAvailablePreNode === true && !isChildDevice
        })
    },

    /**
     * 查询指定线路下所有可作为上级节点的设备（包括子设备）
     * 用于上级节点选择列表页
     * @param {string} lineId
     * @returns {Array} 主设备列表，每个主设备包含 children 属性
     */
    async findAllAvailablePreNodes(lineId) {
        const sql = `SELECT * FROM t_device
      WHERE line_id = ?
      ORDER BY created_at DESC`
        const allDevices = await dbHelper.select(sql, [lineId])

        // 过滤出所有 isAvailablePreNode 为 true 的设备
        const availableDevices = allDevices.filter(device => {
            const schema = getSchema(device.device_type)
            return schema && schema.isAvailablePreNode === true
        })

        // 分离主设备和子设备
        const mainDevices = []
        const childDevicesMap = {} // key: parent_id, value: 子设备数组

        availableDevices.forEach(device => {
            const schema = getSchema(device.device_type)
            const isChildDevice = device.parent_id && device.parent_id !== ''

            if (isChildDevice) {
                // 子设备
                if (!childDevicesMap[device.parent_id]) {
                    childDevicesMap[device.parent_id] = []
                }
                childDevicesMap[device.parent_id].push({
                    ...device,
                    deviceLabel: schema.label
                })
            } else {
                // 主设备
                mainDevices.push({
                    ...device,
                    deviceLabel: schema.label,
                    icon: schema.icon
                })
            }
        })

        // 将子设备附加到对应的主设备
        mainDevices.forEach(device => {
            device.children = childDevicesMap[device.id] || []
        })

        return mainDevices
    },

    /**
     * 删除设备及其子设备，并清空所有指向它们的 prev_id（断开连线）
     * @param {string} id 设备ID
     */
    async deleteWithChildrenAndBreak(id) {
        const traceId = nextDaoTraceId('deleteWithChildrenAndBreak')
        const perfStart = daoPerfNow()
        daoPerfLog('dao.deleteWithChildrenAndBreak.start', {
            traceId,
            deviceId: id
        })

        // 1. 查询所有子设备ID
        try {
            const childSelectStart = daoPerfNow()
            const children = await dbHelper.select(
                'SELECT id FROM t_device WHERE parent_id = ?', [id]
            )
            const childSelectMs = roundDaoPerfMs(daoPerfNow() - childSelectStart)
            const deletedIds = [id, ...children.map(c => c.id)]

            // 2. 将所有 prev_id 指向这些被删除设备的记录，prev_id 置空 → 连线断开
            const now = Date.now()
            const placeholders = deletedIds.map(() => '?').join(',')
            const brokenPrevSelectStart = daoPerfNow()
            const brokenPrevRows = await dbHelper.select(
                `SELECT id FROM t_device WHERE prev_id IN (${placeholders})`,
                deletedIds
            )
            const brokenPrevSelectMs = roundDaoPerfMs(daoPerfNow() - brokenPrevSelectStart)
            const deletedIdSet = new Set(deletedIds.map(item => String(item)))
            const brokenPrevIds = brokenPrevRows
                .map(row => row.id)
                .filter(rowId => !deletedIdSet.has(String(rowId)))
            const breakPrevStart = daoPerfNow()
            await dbHelper.execute(
                `UPDATE t_device
         SET prev_id = '', sync_status = 0, updated_at = ?
         WHERE prev_id IN (${placeholders})`,
                [now, ...deletedIds]
            )
            const breakPrevMs = roundDaoPerfMs(daoPerfNow() - breakPrevStart)

            // 3. 删除子设备
            const deleteChildrenStart = daoPerfNow()
            await dbHelper.execute('DELETE FROM t_device WHERE parent_id = ?', [id])
            const deleteChildrenMs = roundDaoPerfMs(daoPerfNow() - deleteChildrenStart)
            // 4. 删除自身
            const deleteSelfStart = daoPerfNow()
            await dbHelper.execute('DELETE FROM t_device WHERE id = ?', [id])
            const deleteSelfMs = roundDaoPerfMs(daoPerfNow() - deleteSelfStart)

            daoPerfLog('dao.deleteWithChildrenAndBreak.finish', {
                traceId,
                deviceId: id,
                childCount: children.length,
                deletedIdCount: deletedIds.length,
                brokenPrevCount: brokenPrevIds.length,
                childSelectMs,
                brokenPrevSelectMs,
                breakPrevMs,
                deleteChildrenMs,
                deleteSelfMs,
                durationMs: roundDaoPerfMs(daoPerfNow() - perfStart)
            })
            return {
                deletedIds,
                brokenPrevIds,
                childCount: children.length,
                deletedIdCount: deletedIds.length,
                brokenPrevCount: brokenPrevIds.length
            }
        } catch (e) {
            daoPerfLog('dao.deleteWithChildrenAndBreak.error', {
                traceId,
                deviceId: id,
                durationMs: roundDaoPerfMs(daoPerfNow() - perfStart),
                message: daoPerfErrorMessage(e)
            })
            throw e
        }
    },

    /**
     * 删除设备（同时级联删除其子设备）
     */
    async deleteWithChildren(id) {
        const traceId = nextDaoTraceId('deleteWithChildren')
        const perfStart = daoPerfNow()
        daoPerfLog('dao.deleteWithChildren.start', {
            traceId,
            deviceId: id
        })

        try {
            const deleteChildrenStart = daoPerfNow()
            await dbHelper.execute(
                'DELETE FROM t_device WHERE parent_id = ?', [id]
            )
            const deleteChildrenMs = roundDaoPerfMs(daoPerfNow() - deleteChildrenStart)
            const deleteSelfStart = daoPerfNow()
            await dbHelper.execute(
                'DELETE FROM t_device WHERE id = ?', [id]
            )
            const deleteSelfMs = roundDaoPerfMs(daoPerfNow() - deleteSelfStart)
            daoPerfLog('dao.deleteWithChildren.finish', {
                traceId,
                deviceId: id,
                deleteChildrenMs,
                deleteSelfMs,
                durationMs: roundDaoPerfMs(daoPerfNow() - perfStart)
            })
        } catch (e) {
            daoPerfLog('dao.deleteWithChildren.error', {
                traceId,
                deviceId: id,
                durationMs: roundDaoPerfMs(daoPerfNow() - perfStart),
                message: daoPerfErrorMessage(e)
            })
            throw e
        }
    },

    /**
     * 修改线路名称后，批量更新该线路下所有以旧线路名前缀开头的设备名称
     * 处理 name 格式为 "{lineName}{suffix}"（无 #）
     * 使用 LIKE ... ESCAPE '\\'，避免 oldLineName 中的 % / _ / \ 被当成通配符
     *
     * @param {string} lineId
     * @param {string} oldLineName
     * @param {string} newLineName
     */
    async updateNamePrefixByLine(lineId, oldLineName, newLineName) {
        if (!oldLineName || oldLineName === newLineName) return

        const now = Date.now()
        const oldPrefix = oldLineName
        const newPrefix = newLineName

        // 转义 LIKE 特殊字符：\、%、_
        const escapeLike = (s) =>
            String(s).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')

        const likePattern = escapeLike(oldPrefix) + '%'

        // 仅替换“开头前缀”，不会误替换中间同名片段
        const sql = `UPDATE t_device
        SET
            name        = ? || SUBSTR(name, LENGTH(?) + 1),
            sync_status = 0,
            updated_at  = ?
        WHERE line_id = ?
          AND name LIKE ? ESCAPE '\\'`

        await dbHelper.execute(sql, [newPrefix, oldPrefix, now, lineId, likePattern])
    }
}

export default deviceDAO
