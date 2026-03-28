// dao/deviceDAO.js
/**
 * 设备数据访问对象
 * 封装 t_device 表的增删改查，页面层不再直接写 SQL
 */
import { dbHelper } from '../db/dbHelper.js'
import { generateId } from '../utils/common.js'

const deviceDAO = {

    /**
     * 插入一条设备记录
     * @param {Object} device - 设备数据（不含 id、时间戳）
     * @returns {string} 新生成的设备 ID
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
     * @param {string} id - 设备 ID
     * @param {Object} fields - 需要更新的字段
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
     * @param {string} id
     * @returns {Object|null}
     */
    async findById(id) {
        const sql = 'SELECT * FROM t_device WHERE id = ?'
        return await dbHelper.selectOne(sql, [id])
    },

    /**
     * 查询指定线路 + 设备类型 + 父设备下，排序号最大的一条记录
     * 用于新建时确定 prevId 和 sortOrder
     * @param {string} lineId
     * @param {string} deviceType
     * @param {string} parentId - 无父设备时传空字符串
     * @returns {Object|null}
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
     * 用于子设备列表展示
     * @param {string} lineId
     * @param {string} deviceType
     * @param {string} parentId
     * @returns {Array}
     */
    async findByParent(lineId, deviceType, parentId) {
        const sql = `SELECT * FROM t_device
      WHERE line_id = ? AND device_type = ? AND parent_id = ?
      ORDER BY sort_order ASC`
        return await dbHelper.select(sql, [lineId, deviceType, parentId || ''])
    },

    /**
     * 查询指定线路下某类型的全部设备（按排序号升序）
     * 用于主设备列表展示（如线路下所有杆塔）
     * @param {string} lineId
     * @param {string} deviceType
     * @returns {Array}
     */
    async findByLine(lineId, deviceType) {
        const sql = `SELECT * FROM t_device
      WHERE line_id = ? AND device_type = ?
      ORDER BY sort_order ASC`
        return await dbHelper.select(sql, [lineId, deviceType])
    },

    /**
     * 删除设备（同时级联删除其子设备）
     * @param {string} id
     */
    async deleteWithChildren(id) {
        // 先删子设备
        await dbHelper.execute(
            'DELETE FROM t_device WHERE parent_id = ?', [id]
        )
        // 再删自身
        await dbHelper.execute(
            'DELETE FROM t_device WHERE id = ?', [id]
        )
    }
}

export default deviceDAO