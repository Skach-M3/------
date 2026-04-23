const TOKEN_KEY = 'TOKEN';
const LOGIN_TIME_KEY = 'LOGIN_TIME';
const TOKEN_EXPIRE = 24 * 60 * 60 * 1000; // 24小时

/**
 * 保存 token，并记录登录时间
 */
export function setToken(token) {
    uni.setStorageSync(TOKEN_KEY, token);
    uni.setStorageSync(LOGIN_TIME_KEY, Date.now());
}

/**
 * 获取 token
 */
export function getToken() {
    return uni.getStorageSync(TOKEN_KEY) || '';
}

/**
 * 清除 token
 */
export function clearToken() {
    uni.removeStorageSync(TOKEN_KEY);
    uni.removeStorageSync(LOGIN_TIME_KEY);
}

/**
 * 判断 token 是否有效（存在 + 未过期）
 */
export function isTokenValid() {
    const token = getToken();
    if (!token) return false;

    const loginTime = uni.getStorageSync(LOGIN_TIME_KEY);
    if (!loginTime) return false;

    return Date.now() - loginTime < TOKEN_EXPIRE;
}