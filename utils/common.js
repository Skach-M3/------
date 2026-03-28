// utils/common.js

/**
 * 生成唯一 ID（时间戳 + 随机字符串）
 * @param {number} [randomLen=16] - 随机部分的字符长度
 * @returns {string}
 */
export function generateId(randomLen = 16) {
    const timestamp = Date.now().toString(36)
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let random = ''
    for (let i = 0; i < randomLen; i++) {
        random += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return timestamp + random
}