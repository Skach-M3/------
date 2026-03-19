import { dbHelper } from '../db/dbHelper'

export const deviceDAO = {
    insert(device) {
        const sql = `INSERT INTO t_device 
      (id, task_id, device_type, name, longitude, latitude, parent_id, attributes, photos, status, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
        const params = [
            device.id, device.taskId, device.deviceType, device.name,
            device.longitude, device.latitude, device.parentId,
            JSON.stringify(device.attributes),
            JSON.stringify(device.photos),
            device.status, device.createdAt, device.updatedAt
        ]
        return dbHelper.execute(sql, params)
    },

    update(device) {
        const sql = `UPDATE t_device SET 
      name=?, longitude=?, latitude=?, parent_id=?, 
      attributes=?, photos=?, status=?, updated_at=?
      WHERE id=?`
        const params = [
            device.name, device.longitude, device.latitude, device.parentId,
            JSON.stringify(device.attributes),
            JSON.stringify(device.photos),
            device.status, device.updatedAt, device.id
        ]
        return dbHelper.execute(sql, params)
    },

    findByTaskId(taskId) {
        return dbHelper.select(
            'SELECT * FROM t_device WHERE task_id=? AND status=? ORDER BY created_at DESC',
            [taskId, 'saved']
        )
    },

    findLastSavedDevice(taskId) {
        return dbHelper.selectOne(
            'SELECT * FROM t_device WHERE task_id=? AND status=? ORDER BY created_at DESC LIMIT 1',
            [taskId, 'saved']
        )
    },

    findDraft(taskId) {
        return dbHelper.selectOne(
            'SELECT * FROM t_device WHERE task_id=? AND status=? LIMIT 1',
            [taskId, 'draft']
        )
    }
}