import { checkAuthApi } from '@/api/auth.js';
import {
    getToken,
    setToken,
    setLastAuthTime,
    isWithinAuthGrace,
    getAuthGraceRemaining,
    AUTH_VALID_DURATION
} from '@/utils/auth.js';
import { forceLogout, registerForceLogoutHandler } from '@/utils/session.js';

let timer = null;
let checkingPromise = null;

const LOGIN_URL = '/pages/login/login';
const ONE_HOUR = 60 * 60 * 1000;
const TEN_MIN = 10 * 60 * 1000;

registerForceLogoutHandler(() => {
    stopAuthTimer();
});

const updateUserInfo = (res) => {
    if (!res) return;

    if (res.token) setToken(res.token);

    const prev = uni.getStorageSync('userInfo') || {};
    uni.setStorageSync('userInfo', {
        ...prev,
        ...(res.name ? { name: res.name } : {}),
        ...(res.phone ? { phone: res.phone } : {}),
        ...(res.expireTime ? { expireTime: res.expireTime } : {}),
        ...(res.remainingSeconds !== undefined ? { remainingSeconds: res.remainingSeconds } : {})
    });
};

const notifyGraceRemaining = () => {
    const remainMs = getAuthGraceRemaining();
    if (remainMs <= 0 || remainMs >= ONE_HOUR) return;

    const remainMin = Math.max(1, Math.ceil(remainMs / 60000));
    const content = `离线可用时长：${remainMin} 分钟，请尽快联网打开 app`;

    if (remainMs <= TEN_MIN) {
        uni.showModal({
            title: '提示',
            content,
            showCancel: false,
            confirmText: '知道了'
        });
        return;
    }

    uni.showToast({
        title: content,
        icon: 'none',
        duration: 3000
    });
};

const isRejectedByServer = (err) => {
    return err && [400, 401, 403, 419].includes(Number(err.statusCode));
};

const runCheckAuth = async ({ silent = false } = {}) => {
    if (!getToken()) {
        uni.reLaunch({ url: LOGIN_URL });
        return false;
    }

    try {
        console.log('[authGuard] checkAuth -> token:', getToken());
        const res = await checkAuthApi();
        console.log('[authGuard] checkAuth <- response:', res);

        setLastAuthTime(Date.now());
        updateUserInfo(res);
        restartAuthTimer();
        return true;
    } catch (err) {
        if (isRejectedByServer(err)) {
            console.info('[authGuard] token rejected by server:', err.statusCode);
            forceLogout('授权已失效，请重新登录');
            return false;
        }

        console.warn('[authGuard] check failed (network or server error):', err);
        if (!isWithinAuthGrace()) {
            forceLogout('登录已过期，请重新登录');
            return false;
        }

        if (!silent) notifyGraceRemaining();
        restartAuthTimer();
        return true;
    }
};

export const checkAuth = ({ silent = false } = {}) => {
    if (checkingPromise) return checkingPromise;

    checkingPromise = runCheckAuth({ silent }).finally(() => {
        checkingPromise = null;
    });

    return checkingPromise;
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
