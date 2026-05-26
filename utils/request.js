import { getToken } from '@/utils/auth.js';
import { forceLogout } from '@/utils/session.js';

const BASE_URL = 'http://8.163.33.20';

const AUTH_STATUS_CODES = [401, 403, 419];
const AUTH_ERROR_CODES = ['401', '403', '419', 'TOKEN_EXPIRED', 'TOKEN_INVALID', 'UNAUTHORIZED', 'AUTH_EXPIRED'];

const getResponseMessage = (data, statusCode) => {
    return data?.error || data?.message || data?.msg || `请求失败(${statusCode})`;
};

const isAuthFailureMessage = (message) => {
    if (!message) return false;
    return /token|expired|expire|unauthorized|authorization|未授权|授权|过期|失效|请登录|重新登录/i.test(String(message));
};

const isAuthFailure = (statusCode, data, options) => {
    if (options.authRequest && data?.token) return false;

    if (AUTH_STATUS_CODES.includes(statusCode)) return true;

    const code = data?.code ?? data?.status ?? data?.statusCode ?? data?.errorCode;
    if (AUTH_ERROR_CODES.includes(String(code).toUpperCase())) return true;

    const message = getResponseMessage(data || {}, statusCode);
    if (statusCode === 400 && (options.authRequest || isAuthFailureMessage(message))) return true;
    if (statusCode === 200 && isAuthFailureMessage(message) && (options.authRequest || code !== undefined)) return true;

    return false;
};

const getLogoutMessage = (message) => {
    if (/expired|expire|过期/i.test(String(message))) return '登录已过期，请重新登录';
    if (/unauthorized|authorization|未授权|授权|失效/i.test(String(message))) return '授权已失效，请重新登录';
    return '登录已过期，请重新登录';
};

export function request(options) {
    return new Promise((resolve, reject) => {
        uni.request({
            url: BASE_URL + options.url,
            method: options.method || 'GET',
            data: options.data || {},
            header: {
                'Content-Type': 'application/json',
                ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
                ...(options.header || {})
            },
            timeout: 15000,
            success: (res) => {
                const data = res.data || {};
                const msg = getResponseMessage(data, res.statusCode);

                if (isAuthFailure(res.statusCode, data, options)) {
                    if (!options.skipAuthLogout && getToken()) {
                        forceLogout(getLogoutMessage(msg));
                    }
                    reject({
                        statusCode: res.statusCode,
                        message: msg,
                        data: res.data
                    });
                    return;
                }

                if (res.statusCode === 200 || (options.authRequest && data.token)) {
                    resolve(res.data);
                } else {
                    reject({
                        statusCode: res.statusCode,
                        message: msg,
                        data: res.data
                    });
                }
            },
            fail: (err) => {
                let msg = '网络异常，请检查网络连接';
                if (err.errMsg && err.errMsg.indexOf('timeout') > -1) {
                    msg = '请求超时，请重试';
                }
                reject({ statusCode: -1, message: msg, data: null });
            }
        });
    });
}
