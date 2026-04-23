<template>
    <view class="page-container">
        <!-- 顶部主题色大色块 -->
        <view class="top-background">
            <!-- 占位状态栏高度，防止内容顶到手机时间/电量 -->
            <view class="status-bar"></view>
            <view class="header-text">
                <text class="welcome-title">欢迎登录</text>
                <text class="welcome-subtitle">电力设备采集系统</text>
            </view>
        </view>

        <!-- 悬浮登录卡片 -->
        <view class="login-card-wrapper">
            <view class="login-card">
                <!-- Logo 区域 -->
                <view class="logo-box">
                    <image class="logo" src="/static/logo.svg" mode="aspectFit"></image>
                </view>

                <!-- 表单区域 -->
                <view class="form-section">

                    <!-- 手机号输入框 -->
                    <view class="input-wrapper">
                        <view class="input-group" :class="{ 'has-error': phoneError }">
                            <view class="icon-box">
                                <!-- 专业手机 SVG 图标 -->
                                <image class="input-icon"
                                    src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23006567' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='5' y='2' width='14' height='20' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='12' y1='18' x2='12.01' y2='18'%3E%3C/line%3E%3C/svg%3E">
                                </image>
                            </view>
                            <input class="input-field" type="number" v-model="phone" placeholder="请输入手机号" maxlength="11"
                                placeholder-class="placeholder-style" @blur="handlePhoneBlur"
                                @input="clearPhoneError" />
                        </view>
                        <!-- 手机号错误提示 -->
                        <text v-if="phoneError" class="error-text">{{ phoneError }}</text>
                    </view>

                    <!-- 密码输入框 -->
                    <view class="input-wrapper">
                        <view class="input-group">
                            <view class="icon-box">
                                <!-- 专业锁 SVG 图标 -->
                                <image class="input-icon"
                                    src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23006567' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='11' width='18' height='11' rx='2' ry='2'%3E%3C/rect%3E%3Cpath d='M7 11V7a5 5 0 0 1 10 0v4'%3E%3C/path%3E%3C/svg%3E">
                                </image>
                            </view>
                            <input class="input-field" :type="showPassword ? 'text' : 'password'" v-model="password"
                                placeholder="请输入密码" placeholder-class="placeholder-style" />

                            <!-- 密码显示/隐藏切换按钮 -->
                            <view class="icon-box right-icon" @click="showPassword = !showPassword">
                                <!-- 睁眼图标 (显示密码) -->
                                <image v-if="showPassword" class="input-icon"
                                    src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23006567' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'%3E%3C/path%3E%3Ccircle cx='12' cy='12' r='3'%3E%3C/circle%3E%3C/svg%3E">
                                </image>
                                <!-- 闭眼图标 (隐藏密码) -->
                                <image v-else class="input-icon"
                                    src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a0aab5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z'/%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3Cline x1='3' y1='3' x2='21' y2='21'/%3E%3C/svg%3E">
                                </image>
                            </view>
                        </view>

                    </view>

                    <!-- 登录按钮 -->
                    <button class="login-btn" hover-class="login-btn-hover" @click="handleLogin">
                        登 录
                    </button>

                </view>
            </view>
        </view>

        <!-- 底部版权 -->
        <view class="footer">
            <text class="footer-text">© 2026 电力设备采集系统 v1.0</text>
        </view>
    </view>
</template>

<script setup>
import { ref } from 'vue'
import { loginApi } from '@/api/auth.js'
import { setToken } from '@/utils/auth.js'
import { getDeviceId } from '@/utils/device.js'

const phone = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false) // 控制密码显示隐藏的状态
const phoneError = ref('')

// 手机号输入框失焦时立即校验
const handlePhoneBlur = () => {
    if (!phone.value) {
        phoneError.value = '手机号不能为空'
    } else if (!/^1[3-9]\d{9}$/.test(phone.value)) {
        phoneError.value = '手机号格式不正确'
    } else {
        phoneError.value = ''
    }
}

// 重新输入时清除报错
const clearPhoneError = () => {
    if (phoneError.value) {
        phoneError.value = ''
    }
}

const handleLogin = async () => {
    if (loading.value) return

    // 1. 表单校验
    handlePhoneBlur() // 点击登录时主动触发一次校验
    if (phoneError.value) return // 如果有错误提示，直接拦截
    if (!password.value) {
        return uni.showToast({ title: '请输入密码', icon: 'none' })
    }

    loading.value = true
    uni.showLoading({ title: '登录中...', mask: true })

    try {
        // 2. 获取设备唯一ID
        const deviceId = await getDeviceId()
        console.log('deviceId:', deviceId)

        // 3. 调用登录接口
        const res = await loginApi({
            phone: phone.value.trim(),
            password: password.value,
            deviceId
        })

        uni.hideLoading()

        // 4. 处理返回结果
        if (res && res.token) {
            setToken(res.token)
            uni.showToast({ title: '登录成功', icon: 'success', duration: 800 })
            setTimeout(() => {
                uni.reLaunch({ url: '/pages/index/index' })
            }, 800)
        } else {
            uni.showToast({
                title: (res && (res.message || res.msg)) || '登录失败',
                icon: 'none'
            })
        }
    } catch (err) {
        uni.hideLoading()
        console.error('登录异常：', err)

        // 错误信息映射表（按后端实际返回扩展）
        const errMap = {
            'User not found': '用户不存在',
            'Invalid password': '密码错误',
            'Account is unauthorized': '账号未授权',
            'Account expired': '账号已过期',
            'deviceId required': '设备id无效',
            'Device mismatch. Please contact admin to reset.': '设备不匹配，请联系管理员重置',
            'Device not match': '该账号已绑定其他设备，请联系管理员',
            'Device mismatch': '该账号已绑定其他设备，请联系管理员'
        }
        const friendlyMsg = errMap[err.message] || err.message || '登录失败'

        uni.showToast({
            title: friendlyMsg,
            icon: 'none',
            duration: 2500
        })
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
/* 页面整体背景：采用淡灰蓝色，显得干净且有质感 */
.page-container {
    min-height: 100vh;
    background-color: #f4f6f8;
    position: relative;
    display: flex;
    flex-direction: column;
}

/* 顶部主题色大色块 */
.top-background {
    width: 100%;
    height: 460rpx;
    background-color: #006567;
    /* 底部做一点轻微的圆角，过渡更柔和 */
    border-bottom-left-radius: 40rpx;
    border-bottom-right-radius: 40rpx;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
}

/* 适配自定义导航栏的状态栏高度 */
.status-bar {
    height: var(--status-bar-height);
    width: 100%;
}

.header-text {
    padding: 60rpx 50rpx 0;
}

.welcome-title {
    display: block;
    font-size: 52rpx;
    font-weight: bold;
    color: #ffffff;
    margin-bottom: 16rpx;
    letter-spacing: 2rpx;
}

.welcome-subtitle {
    display: block;
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
    letter-spacing: 2rpx;
}

/* 悬浮卡片外层 */
.login-card-wrapper {
    position: relative;
    z-index: 1;
    /* 这里的 padding-top 计算了状态栏高度 + 色块高度的一部分，让卡片悬浮在色块交界处 */
    padding-top: calc(var(--status-bar-height) + 240rpx);
    padding-left: 40rpx;
    padding-right: 40rpx;
}

/* 登录卡片本体 */
.login-card {
    background-color: #ffffff;
    border-radius: 24rpx;
    padding: 60rpx 40rpx;
    /* 添加柔和的阴影，增强悬浮立体感 */
    box-shadow: 0 12rpx 40rpx rgba(0, 101, 103, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* Logo 样式 */
.logo-box {
    margin-bottom: 60rpx;
    width: 160rpx;
    height: 160rpx;
    background-color: #f8fbfb;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    /* 给 Logo 加个淡淡的内圈背景，显得更精致 */
    border: 2rpx solid rgba(0, 101, 103, 0.1);
}

.logo {
    width: 100rpx;
    height: 100rpx;
}

/* 表单区域 */
.form-section {
    width: 100%;
}

/* 输入框外层包装，用于定位错误提示 */
.input-wrapper {
    position: relative;
    margin-bottom: 40rpx;
}

/* 覆盖原有的 margin-bottom，转移到 wrapper 上 */
.input-group {
    display: flex;
    align-items: center;
    background-color: #f8f9fa;
    border-radius: 12rpx;
    padding: 0 30rpx;
    height: 100rpx;
    border: 2rpx solid transparent;
    transition: all 0.3s ease;
}

/* 错误状态下的边框标红 */
.input-group.has-error {
    border-color: #ff4d4f;
    background-color: #fff0f0;
}

/* 错误提示文字 */
.error-text {
    position: absolute;
    left: 10rpx;
    bottom: -36rpx;
    font-size: 24rpx;
    color: #ff4d4f;
}

.input-group {
    display: flex;
    align-items: center;
    background-color: #f8f9fa;
    border-radius: 12rpx;
    padding: 0 30rpx;
    height: 100rpx;
    margin-bottom: 40rpx;
    border: 2rpx solid transparent;
    transition: all 0.3s ease;
}

/* 聚焦时的边框高亮 */
.input-group:focus-within {
    border-color: #006567;
    background-color: #ffffff;
    box-shadow: 0 0 0 4rpx rgba(0, 101, 103, 0.1);
}

.icon-box {
    margin-right: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 右侧图标特殊处理：取消右边距，增加左边距，并增加点击区域 */
.right-icon {
    margin-right: 0;
    margin-left: 20rpx;
    padding: 10rpx;
    /* 增加点击热区 */
}

.input-icon {
    width: 40rpx;
    height: 40rpx;
}

.input-field {
    flex: 1;
    height: 100%;
    font-size: 30rpx;
    color: #333333;
}

:deep(.placeholder-style) {
    color: #a0aab5;
    font-size: 28rpx;
}

/* 按钮样式 */
.login-btn {
    margin-top: 60rpx;
    width: 100%;
    height: 96rpx;
    line-height: 96rpx;
    background-color: #006567;
    color: #ffffff;
    font-size: 34rpx;
    font-weight: bold;
    border-radius: 12rpx;
    border: none;
    /* 按钮也加上微弱阴影 */
    box-shadow: 0 8rpx 20rpx rgba(0, 101, 103, 0.2);
}

.login-btn-hover {
    background-color: #004d4f;
    transform: translateY(2rpx);
    box-shadow: 0 4rpx 10rpx rgba(0, 101, 103, 0.2);
}

.login-btn::after {
    border: none;
}

/* 底部版权 */
.footer {
    margin-top: auto;
    margin-bottom: 60rpx;
    text-align: center;
    position: relative;
    z-index: 1;
}

.footer-text {
    font-size: 24rpx;
    color: #99a3ad;
}
</style>