import { dbHelper } from './dbHelper'

export async function initDatabase() {
  // 先打开数据库
  plus.sqlite.openDatabase({
    name: 'collector',
    path: '_doc/collector.db'
  })

  // 建表
  await dbHelper.execute(`
    CREATE TABLE IF NOT EXISTS t_task (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL,
      line_name   TEXT,
      area_name   TEXT,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL,
      status      TEXT DEFAULT 'active'
    )
  `)

  await dbHelper.execute(`
    CREATE TABLE IF NOT EXISTS t_device (
      id          TEXT PRIMARY KEY,
      task_id     TEXT NOT NULL,
      device_type TEXT NOT NULL,
      name        TEXT,
      longitude   REAL,
      latitude    REAL,
      parent_id   TEXT,
      attributes  TEXT DEFAULT '{}',
      photos      TEXT DEFAULT '[]',
      status      TEXT DEFAULT 'draft',
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    )
  `)

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

  console.log('=== 数据库初始化完成 ===')
}