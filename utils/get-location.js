// utils/get-location.js
import { DEBUG_ENABLED, debugLocation } from './debug-location.js'

/**
 * uni.getLocation 的包装器
 * 如果设置了假定位，直接返回假坐标，不走 GPS
 * 默认 10 秒超时，避免原生定位偶发无回调导致页面 loading 卡住
 * 参数与 uni.getLocation 完全一致
 */
export function getLocation(options = {}) {
    const customTimeout = Number(options.timeout)
    const timeout = Number.isFinite(customTimeout) && customTimeout > 0 ? customTimeout : 10000
    let finished = false
    let timer = null

    const finish = (callbackName, result) => {
        if (finished) return
        finished = true
        if (timer) {
            clearTimeout(timer)
            timer = null
        }
        try {
            if (typeof options[callbackName] === 'function') {
                options[callbackName](result)
            }
        } finally {
            if (typeof options.complete === 'function') {
                options.complete(result)
            }
        }
    }

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
        setTimeout(() => finish('success', result), 50)
        return
    }

    timer = setTimeout(() => {
        finish('fail', {
            errMsg: `getLocation:fail timeout after ${timeout}ms`
        })
    }, timeout)

    const requestOptions = {
        ...options,
        success: (res) => finish('success', res),
        fail: (err) => finish('fail', err)
    }
    delete requestOptions.complete

    uni.getLocation(requestOptions)
}
