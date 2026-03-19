import { dbHelper } from '../db/dbHelper'

export const lineDAO = {
    insert(line) {
        const sql = `INSERT INTO t_line (station, name, unit, recorder, created_date)
      VALUES (?,?,?,?,?)`
        const params = [
            line.station || '',
            line.name || '',
            line.unit || '',
            line.recorder || '',
            line.createdDate || ''
        ]
        return dbHelper.execute(sql, params)
    },

    update(line) {
        const sql = `UPDATE t_line SET station=?, name=?, unit=?, recorder=?, created_date=? WHERE id=?`
        const params = [
            line.station || '',
            line.name || '',
            line.unit || '',
            line.recorder || '',
            line.createdDate || '',
            line.id
        ]
        return dbHelper.execute(sql, params)
    },

    deleteById(id) {
        return dbHelper.execute('DELETE FROM t_line WHERE id=?', [id])
    },

    findAll() {
        return dbHelper.select('SELECT * FROM t_line ORDER BY id DESC')
    },

    findByKeyword(keyword) {
        return dbHelper.select(
            'SELECT * FROM t_line WHERE name LIKE ? ORDER BY id DESC',
            [`%${keyword}%`]
        )
    },

    findById(id) {
        return dbHelper.selectOne('SELECT * FROM t_line WHERE id=?', [id])
    }
}