// services/deviceService.ts（关键片段）

export const deviceService = {
  /**
   * 保存设备数据（带事务保护）
   * 表单页每次填写关键字段后自动触发暂存，而非仅在点击"保存"时才写入。
   */
  async saveDevice(data: DeviceFormData): Promise<number> {
    const db = getDb()

    try {
      // 开启事务
      await db.executeSql('BEGIN TRANSACTION')

      // 1. 写入/更新设备记录
      let deviceId: number
      if (data.id) {
        await deviceDao.update(data.id, data)
        deviceId = data.id
      } else {
        deviceId = await deviceDao.insert(data)
      }

      // 2. 处理照片关联
      for (const photo of data.photos) {
        if (!photo.id) {
          await photoDao.insert({ ...photo, deviceId })
        }
      }

      // 3. 更新任务设备计数
      const count = await deviceDao.countByTaskId(data.taskId)
      await taskDao.updateDeviceCount(data.taskId, count)

      // 提交事务
      await db.executeSql('COMMIT')
      return deviceId
    } catch (e) {
      await db.executeSql('ROLLBACK')
      throw e
    }
  },

  /**
   * 自动暂存（防闪退丢失数据）
   * 在表单页使用 watchDebounced 监听 formData 变化，
   * 每 3 秒自动调用此方法将当前表单数据暂存到 t_operation_log。
   */
  async autoSaveDraft(taskId: number, deviceType: string, formData: Record<string, any>): Promise<void> {
    await db.executeSql(
      `INSERT OR REPLACE INTO t_operation_log (task_id, action, data_snapshot, created_at)
       VALUES (?, 'draft', ?, datetime('now','localtime'))`,
      [taskId, JSON.stringify({ deviceType, formData })]
    )
  },

  /** 恢复未保存的草稿 */
  async recoverDraft(taskId: number): Promise<any | null> {
    const rows = await db.selectSql(
      `SELECT * FROM t_operation_log WHERE task_id = ? AND action = 'draft' 
       ORDER BY created_at DESC LIMIT 1`,
      [taskId]
    )
    if (rows.length > 0) {
      return JSON.parse(rows[0].data_snapshot)
    }
    return null
  }
}