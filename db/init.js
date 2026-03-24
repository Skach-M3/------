//db/init.js
import { dbHelper } from './dbHelper'

export async function initDatabase() {
  plus.sqlite.openDatabase({
    name: 'collector',
    path: '_doc/collector.db'
  })

  // 线路表
  await dbHelper.execute(`
    CREATE TABLE IF NOT EXISTS t_line (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      station       TEXT DEFAULT '',
      name          TEXT DEFAULT '',
      unit          TEXT DEFAULT '',
      recorder      TEXT DEFAULT '',
      created_date  TEXT DEFAULT ''
    )
  `)

  // 设备表（通用）
  await dbHelper.execute(`
    CREATE TABLE IF NOT EXISTS t_device (
      id          TEXT PRIMARY KEY,
      line_id     INTEGER NOT NULL,
      device_type TEXT NOT NULL,
      name        TEXT,
      longitude   REAL,
      latitude    REAL,
      prev_id     TEXT,
      parent_id   TEXT,
      sort_order  INTEGER DEFAULT 0,
      attributes  TEXT DEFAULT '{}',
      photos      TEXT DEFAULT '{}',
      status      TEXT DEFAULT 'draft',
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    )
  `)

  // 索引：按线路查设备是最常见的查询
  await dbHelper.execute(`
    CREATE INDEX IF NOT EXISTS idx_device_line ON t_device(line_id)
  `)
  await dbHelper.execute(`
    CREATE INDEX IF NOT EXISTS idx_device_parent ON t_device(parent_id)
  `)

  console.log('=== 数据库初始化完成 ===')
}