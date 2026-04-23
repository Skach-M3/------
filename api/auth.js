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