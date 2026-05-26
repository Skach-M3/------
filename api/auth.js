import { request } from '@/utils/request.js';

/**
 * APP 登录
 * @param {Object} data { phone, password, deviceId }
 */
export function loginApi(data) {
    return request({
        url: '/api/auth/login/app',
        method: 'POST',
        data,
        skipAuthLogout: true
    });
}

// 鉴权检查：后端会在响应中返回新 token，用于刷新本地 token 有效期。
export const checkAuthApi = () =>
    request({ url: '/api/auth/check', method: 'GET', authRequest: true });
