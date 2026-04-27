import { request } from '@/utils/request.js';

/**
 * APP 登录
 * @param {Object} data { phone, password, deviceId }
 */
export function loginApi(data) {
    return request({
        url: '/api/auth/login/app',
        method: 'POST',
        data
    });
}

// 鉴权检查（200 有效 / 401 无效）
export const checkAuthApi = () =>
    request({ url: '/api/auth/check', method: 'GET' })