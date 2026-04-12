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


/**
     * Haversine 公式计算两点间球面距离（米）
     * 
     */
export function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000
    const toRad = (deg) => deg * Math.PI / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}