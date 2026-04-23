const DEVICE_ID_KEY = 'DEVICE_ID';

/**
 * 生成 UUID（兜底用）
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * 获取设备唯一ID，格式：ANDROID-xxxxxxxxxxxxxxxx
 * 优先读取 Android ID（卸载重装不变）
 */
export function getDeviceId() {
    return new Promise((resolve) => {
        // 1. 先读缓存
        const cached = uni.getStorageSync(DEVICE_ID_KEY);
        if (cached) {
            resolve(cached);
            return;
        }

        let deviceId = '';

        // #ifdef APP-PLUS
        try {
            const main = plus.android.runtimeMainActivity();
            const Secure = plus.android.importClass('android.provider.Settings$Secure');
            const androidId = plus.android.invoke(
                Secure,
                'getString',
                main.getContentResolver(),
                'android_id'
            );
            if (androidId && androidId !== '9774d56d682e549c') {
                // 9774d56d682e549c 是部分老设备 bug 值，过滤掉
                deviceId = 'ANDROID-' + androidId;
            }
        } catch (e) {
            console.error('获取 Android ID 失败：', e);
        }
        // #endif

        // 2. 兜底：用 UUID（卸载重装会变，仅极少数设备走到这里）
        if (!deviceId) {
            deviceId = 'ANDROID-' + generateUUID().replace(/-/g, '');
        }

        uni.setStorageSync(DEVICE_ID_KEY, deviceId);
        resolve(deviceId);
    });
}