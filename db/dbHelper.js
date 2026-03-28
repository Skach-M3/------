// db/dbHelper.js
let dbName = 'collector'
let dbPath = '_doc/collector.db'

// 转义值，防止 SQL 注入 & 类型处理
function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'number') return String(val)
  // 字符串：把内部的单引号替换为两个单引号
  return "'" + String(val).replace(/'/g, "''") + "'"
}

// 把 SQL 中的 ? 替换为实际值
function buildSql(sql, params = []) {
  let i = 0
  return sql.replace(/\?/g, () => {
    return escapeValue(params[i++])
  })
}

export const dbHelper = {
  open() {
    plus.sqlite.openDatabase({
      name: dbName,
      path: dbPath
    })
  },

  execute(sql, params = []) {
    const finalSql = buildSql(sql, params)
    console.log('== 执行SQL ==', finalSql)
    return new Promise((resolve, reject) => {
      plus.sqlite.executeSql({
        name: dbName,
        sql: finalSql,
        success(res) {
          resolve(res)
        },
        fail(err) {
          console.error('SQL执行失败:', sql)
          console.error('错误详情:', JSON.stringify(err, null, 2))
          // 如果 err 有 message 属性
          console.error('err.message:', err.message)
          console.error('err.code:', err.code)
          reject(err)
        }
      })
    })
  },

  select(sql, params = []) {
    const finalSql = buildSql(sql, params)
    console.log('== 查询SQL ==', finalSql)
    return new Promise((resolve, reject) => {
      plus.sqlite.selectSql({
        name: dbName,
        sql: finalSql,
        success(res) {
          resolve(res)
        },
        fail(err) {
          console.error('SQL查询失败:', finalSql, err)
          reject(err)
        }
      })
    })
  },

  selectOne(sql, params = []) {
    return this.select(sql, params).then(rows => rows[0] || null)
  }
}