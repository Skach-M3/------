// dao/deviceDAO.js
/**
 * 设备数据访问对象
 * 封装 t_device 表的增删改查，页面层不再直接写 SQL
 */
import { getSchema } from '@/schema/index.js'
import { dbHelper } from '../db/dbHelper.js'
import { generateId } from '../utils/common.js'

const deviceDAO = {

    /**
     * 插入一条设备记录
     */
    async insert(device) {
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

        await dbHelper.execute(sql, params)
        return id
    },

    /**
     * 更新设备记录
     */
    async update(id, fields) {
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

        await dbHelper.execute(sql, params)
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
    async findLastDevice(lineId, deviceType, parentId) {
        const sql = `SELECT * FROM t_device
      WHERE line_id = ? AND device_type = ? AND parent_id = ?
      ORDER BY sort_order DESC
      LIMIT 1`
        return await dbHelper.selectOne(sql, [lineId, deviceType, parentId || ''])
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

    // ← 新增：查询线路下所有设备（不区分类型），用于地图绘制
    /**
     * 查询指定线路下所有设备（按 sort_order、created_at 升序）
     * 用于地图页绘制设备标记和连线
     * @param {string} lineId
     * @returns {Array}
     */
    async findAllByLine(lineId) {
        const sql = `SELECT * FROM t_device
      WHERE line_id = ?
      ORDER BY sort_order ASC, created_at ASC`
        return await dbHelper.select(sql, [lineId])
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
     * 删除设备（同时级联删除其子设备）
     */
    async deleteWithChildren(id) {
        await dbHelper.execute(
            'DELETE FROM t_device WHERE parent_id = ?', [id]
        )
        await dbHelper.execute(
            'DELETE FROM t_device WHERE id = ?', [id]
        )
    }
}

export default deviceDAO