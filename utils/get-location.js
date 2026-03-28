// utils/get-location.js
import { DEBUG_ENABLED, debugLocation } from './debug-location.js'

/**
 * uni.getLocation 的包装器
 * 如果设置了假定位，直接返回假坐标，不走 GPS
 * 参数与 uni.getLocation 完全一致
 */
export function getLocation(options = {}) {
    if (DEBUG_ENABLED && debugLocation.lat !== null && debugLocation.lng !== null) {
        console.log('[DEBUG] 使用假定位:', debugLocation.lat, debugLocation.lng)
        const result = {
            latitude: debugLocation.lat,
            longitude: debugLocation.lng,
            accuracy: 1,
            altitude: 0,
            horizontalAccuracy: 1,
            verticalAccuracy: 0,
            speed: -1
        }
        if (typeof options.success === 'function') {
            setTimeout(() => options.success(result), 50)
        }
        return
    }

    uni.getLocation(options)
}