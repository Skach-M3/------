import { clearToken, getToken } from '@/utils/auth.js';

const LOGIN_URL = '/pages/login/login';
const logoutHandlers = [];

let isForcingLogout = false;

export function registerForceLogoutHandler(handler) {
    if (typeof handler !== 'function') return () => {};
    logoutHandlers.push(handler);
    return () => {
        const index = logoutHandlers.indexOf(handler);
        if (index > -1) logoutHandlers.splice(index, 1);
    };
}

export function forceLogout(reason) {
    if (isForcingLogout && !getToken()) return;

    isForcingLogout = true;
    logoutHandlers.forEach((handler) => {
        try {
            handler();
        } catch (err) {
            console.warn('[session] logout handler failed:', err);
        }
    });

    clearToken();
    uni.removeStorageSync('userInfo');
    uni.hideLoading();

    const goLogin = () => {
        uni.reLaunch({
            url: LOGIN_URL,
            complete: () => {
                isForcingLogout = false;
            }
        });
    };

    uni.showModal({
        title: '提示',
        content: reason || '登录已过期，请重新登录',
        showCancel: false,
        confirmText: '去登录',
        success: goLogin,
        fail: goLogin
    });
}
