const TOKEN_KEY = 'TOKEN';
const LAST_AUTH_TIME_KEY = 'LAST_AUTH_TIME';

// 离线宽限期：12 小时
export const AUTH_VALID_DURATION = 12 * 60 * 60 * 1000;

/**
 * 保存 token
 * 登录成功本身视为一次鉴权成功，同步写入 LAST_AUTH_TIME
 */
export function setToken(token) {
    uni.setStorageSync(TOKEN_KEY, token);
    uni.setStorageSync(LAST_AUTH_TIME_KEY, Date.now());
}

/**
 * 获取 token
 */
export function getToken() {
    return uni.getStorageSync(TOKEN_KEY) || '';
}

/**
 * 清除 token 和鉴权锚点
 */
export function clearToken() {
    uni.removeStorageSync(TOKEN_KEY);
    uni.removeStorageSync(LAST_AUTH_TIME_KEY);
}

/**
 * 判断 token 是否有效（仅判断存在性，过期由 checkAuth 负责）
 */
export function isTokenValid() {
    return !!getToken();
}

/**
 * 写入最后一次成功鉴权时间（联网 /api/auth/check 200 时调用）
 */
export function setLastAuthTime(t) {
    uni.setStorageSync(LAST_AUTH_TIME_KEY, t || Date.now());
}

/**
 * 获取最后一次成功鉴权时间
 */
export function getLastAuthTime() {
    return uni.getStorageSync(LAST_AUTH_TIME_KEY) || 0;
}

/**
 * 是否仍在离线宽限期内（距上次成功鉴权 < 12h）
 * 用于网络异常时决定是否允许继续离线作业
 */
export function isWithinAuthGrace() {
    const last = getLastAuthTime();
    if (!last) return false;
    return Date.now() - last < AUTH_VALID_DURATION;
}

/**
 * 距宽限期结束的剩余毫秒数（≤0 表示已超期）
 */
export function getAuthGraceRemaining() {
    const last = getLastAuthTime();
    if (!last) return 0;
    return AUTH_VALID_DURATION - (Date.now() - last);
}