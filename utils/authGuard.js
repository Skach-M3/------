// utils/authGuard.js
import { checkAuthApi } from '@/api/auth.js';
import {
    getToken,
    clearToken,
    setLastAuthTime,
    isWithinAuthGrace,
    getAuthGraceRemaining,
    AUTH_VALID_DURATION
} from '@/utils/auth.js';

let timer = null;
let isChecking = false;

const forceLogout = (reason) => {
    stopAuthTimer();
    clearToken();
    uni.hideLoading();
    uni.showModal({
        title: '提示',
        content: reason || '登录已过期，请重新登录',
        showCancel: false,
        confirmText: '去登录',
        success: () => {
            uni.reLaunch({ url: '/pages/login/login' });
        }
    });
};

export const checkAuth = async ({ silent = false } = {}) => {
    if (!getToken()) {
        uni.reLaunch({ url: '/pages/login/login' });
        return false;
    }
    if (isChecking) return true;
    isChecking = true;

    try {
        await checkAuthApi();
        // ✅ 鉴权成功：刷新锚点
        setLastAuthTime(Date.now());
        restartAuthTimer();
        return true;
    } catch (err) {
        // 1.后端明确拒绝:400(未授权)/ 403(禁止访问) → token 已失效,直接登出
        if (err && (err.statusCode === 400 || err.statusCode === 403)) {
            console.info('[authGuard] token rejected by server:', err.statusCode);
            forceLogout('授权已失效,请重新登录');
            return false;
        }
        // 2.其它情况(网络异常 / 服务端 5xx / 超时等):走离线宽限期逻辑
        console.warn('[authGuard] check failed (network or server error):', err);

        if (!silent) {
            const remainMs = getAuthGraceRemaining();
            const ONE_HOUR = 60 * 60 * 1000;
            const TEN_MIN = 10 * 60 * 1000;

            // 仅在剩余不足 1 小时时提醒
            if (remainMs > 0 && remainMs < ONE_HOUR) {
                const remainMin = Math.max(1, Math.ceil(remainMs / 60000));
                const content = `离线可用时长:${remainMin} 分钟,请尽快联网打开 app`;

                if (remainMs <= TEN_MIN) {
                    // 最后 10 分钟:强制用户确认
                    uni.showModal({
                        title: '提示',
                        content,
                        showCancel: false,
                        confirmText: '知道了'
                    });
                } else {
                    // 10 分钟 ~ 1 小时:轻提示,不打断操作
                    uni.showToast({
                        title: content,
                        icon: 'none',
                        duration: 3000
                    });
                }
            }
        }
        restartAuthTimer();
        return true;
    } finally {
        isChecking = false;
    }
};

export const restartAuthTimer = () => {
    stopAuthTimer();
    timer = setTimeout(() => {
        checkAuth({ silent: false });
    }, AUTH_VALID_DURATION);
};

export const stopAuthTimer = () => {
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
};