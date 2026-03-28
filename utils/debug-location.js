// utils/debug-location.js
// ============================================
//   🔧 调试假定位模块
//   上线前将 DEBUG_ENABLED 改为 false 即可
//   或直接删除所有 // DEBUG START ~ // DEBUG END 区块
// ============================================

// 编译时决定，production 构建会让整段代码被 tree-shaking 掉
export const DEBUG_ENABLED = process.env.NODE_ENV === 'development'

import { reactive } from 'vue'

export const debugLocation = reactive({
    lat: null,
    lng: null,
    picking: false
})

export function setDebugLocation(lat, lng) {
    if (!DEBUG_ENABLED) return
    debugLocation.lat = lat
    debugLocation.lng = lng
}

export function clearDebugLocation() {
    debugLocation.lat = null
    debugLocation.lng = null
    debugLocation.picking = false
}