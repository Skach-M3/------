// dao/deviceDAO.js
import { dbHelper } from '../db/dbHelper'

export const deviceDAO = {
    insert(device) {
        const sql = `INSERT INTO t_device 
      (id, line_id, device_type, name, longitude, latitude, prev_id, parent_id, sort_order, attributes, photos, status, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        const params = [
            device.id,
            device.lineId,
            device.deviceType,
            device.name,
            device.longitude,
            device.latitude,
            device.prevId || null,
            device.parentId || null,
            device.sortOrder || 0,
            JSON.stringify(device.attributes || {}),
            JSON.stringify(device.photos || {}),
            device.status || 'draft',
            device.createdAt,
            device.updatedAt
        ]
        return dbHelper.execute(sql, params)
    },

    update(device) {
        const sql = `UPDATE t_device SET 
      name=?, longitude=?, latitude=?, prev_id=?, parent_id=?,
      sort_order=?, attributes=?, photos=?, status=?, updated_at=?
      WHERE id=?`
        const params = [
            device.name,
            device.longitude,
            device.latitude,
            device.prevId || null,
            device.parentId || null,
            device.sortOrder || 0,
            JSON.stringify(device.attributes || {}),
            JSON.stringify(device.photos || {}),
            device.status,
            device.updatedAt,
            device.id
        ]
        return dbHelper.execute(sql, params)
    },

    // 线路下所有主设备（parent_id 为空 = 非子设备），按排序正序
    findByLineId(lineId) {
        return dbHelper.select(
            `SELECT * FROM t_device WHERE line_id=? AND (parent_id IS NULL OR parent_id='') AND status='saved' ORDER BY sort_order ASC`,
            [lineId]
        )
    },

    // 某设备下的子设备
    findChildren(parentId) {
        return dbHelper.select(
            `SELECT * FROM t_device WHERE parent_id=? AND status='saved' ORDER BY sort_order ASC`,
            [parentId]
        )
    },

    // 线路下最后一个主设备（用于自动设置 prev_id）
    findLastDevice(lineId) {
        return dbHelper.selectOne(
            `SELECT * FROM t_device WHERE line_id=? AND (parent_id IS NULL OR parent_id='') AND status='saved' ORDER BY sort_order DESC LIMIT 1`,
            [lineId]
        )
    },

    // 线路下当前最大排序号
    getMaxSortOrder(lineId) {
        return dbHelper.selectOne(
            `SELECT MAX(sort_order) as maxOrder FROM t_device WHERE line_id=? AND (parent_id IS NULL OR parent_id='')`,
            [lineId]
        ).then(row => (row && row.maxOrder) || 0)
    },

    findById(id) {
        return dbHelper.selectOne('SELECT * FROM t_device WHERE id=?', [id])
    },

    // 删除设备及其所有子设备
    async deleteById(id) {
        await dbHelper.execute('DELETE FROM t_device WHERE parent_id=?', [id])
        await dbHelper.execute('DELETE FROM t_device WHERE id=?', [id])
    },

    // 线路下全部设备（含子设备），用于导出
    findAllByLineId(lineId) {
        return dbHelper.select(
            `SELECT * FROM t_device WHERE line_id=? AND status='saved' ORDER BY sort_order ASC, created_at ASC`,
            [lineId]
        )
    }
}