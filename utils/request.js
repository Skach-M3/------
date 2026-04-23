const BASE_URL = 'http://8.163.33.20';

export function request(options) {
    return new Promise((resolve, reject) => {
        uni.request({
            url: BASE_URL + options.url,
            method: options.method || 'GET',
            data: options.data || {},
            header: {
                'Content-Type': 'application/json',
                ...(options.header || {})
            },
            timeout: 15000,
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data);
                } else {
                    // 兼容多种错误字段：error / message / msg
                    const data = res.data || {};
                    const msg = data.error || data.message || data.msg || `请求失败(${res.statusCode})`;
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