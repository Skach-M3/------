<template>
    <view class="page-container">
        <!-- 顶部用户信息区（渐变背景） -->
        <view class="header-wrap">
            <view class="header-bg"></view>

            <!-- 1. 动态状态栏占位：确保内容不会钻进刘海里 -->
            <view :style="{ height: statusBarHeight + 'px' }"></view>

            <!-- 2. 额外留白：代替原本原生导航栏的高度，让头像不至于紧贴着状态栏 -->
            <view style="height: 20px;"></view>

            <!-- 用户卡片 -->
            <view class="user-card">
                <view class="avatar-box">
                    <image class="avatar-img" src="/static/app封面.png" mode="aspectFit"></image>
                </view>
                <view class="user-info">
                    <text class="user-name">{{ userName }}</text>
                    <view class="user-tag">
                        <text class="tag-text">现场作业员</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 主体内容区 -->
        <view class="content-section">
            <!-- 设置列表 -->
            <view class="settings-list">
                <view class="list-item">
                    <view class="item-left">
                        <view class="item-icon icon-version">
                            <u-icon name="setting" color="#fff" size="16"></u-icon>
                        </view>
                        <text class="item-label">当前版本</text>
                    </view>
                    <text class="item-value">{{ version }}</text>
                </view>
            </view>

            <!-- 退出登录按钮 -->
            <view class="logout-btn" @click="handleLogout">
                <u-icon name="close-circle" color="#e53935" size="18"></u-icon>
                <text class="logout-text">退出登录</text>
            </view>
        </view>

        <!-- 底部功能栏 -->
        <view class="tab-bar">
            <view class="tab-item" @click="switchTab('home')">
                <u-icon name="home" color="#999999" size="24"></u-icon>
                <text class="tab-text">首页</text>
            </view>
            <view class="tab-item" @click="switchTab('stat')">
                <u-icon name="grid" color="#999999" size="24"></u-icon>
                <text class="tab-text">统计</text>
            </view>
            <view class="tab-item active">
                <u-icon name="account" color="#006567" size="24"></u-icon>
                <text class="tab-text">我的</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { clearToken } from '@/utils/auth.js';
import { stopAuthTimer } from '@/utils/authGuard.js';

const version = ref<string>('v1.0.0');
const userName = ref<string>('用户');

// 动态获取系统状态栏高度 (兼容各端)
const systemInfo = uni.getSystemInfoSync();
const statusBarHeight = ref<number>(systemInfo.statusBarHeight || 44);

onShow(() => {
    uni.hideTabBar();
});

// 退出登录
const handleLogout = () => {
    uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        confirmText: '取消',
        cancelText: '确定',
        success: (res) => {
            if (!res.cancel) return;

            // 1. 停止鉴权定时器，避免退出后还触发无意义的 checkAuth
            stopAuthTimer();

            // 2. 清除 token 和鉴权锚点（LAST_AUTH_TIME）
            //    使用 auth.js 的封装，保证 key 名称统一（TOKEN，大写）
            clearToken();

            // 3. 清除用户信息缓存
            //    说明：其他业务离线数据（线路、设备、未上传草稿等）不清，
            //    避免现场未同步的作业数据丢失
            uni.removeStorageSync('userInfo');

            // 4. 提示并跳转登录页
            uni.showToast({
                title: '已退出登录',
                icon: 'success',
                duration: 800
            });
            setTimeout(() => {
                uni.reLaunch({ url: '/pages/login/login' });
            }, 800);
        }
    });
};

// 底部导航切换
const switchTab = (type: string) => {
    if (type === 'home') {
        uni.switchTab({ url: '/pages/index/index' });
    } else if (type === 'stat') {
        uni.showToast({ title: '统计页开发中', icon: 'none' });
    }
};
</script>

<style lang="scss" scoped>
.page-container {
    height: 100vh;
    background-color: #f5f6f8;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* ========== 顶部用户信息区 ========== */
.header-wrap {
    position: relative;
    flex-shrink: 0;
    /* 修改1：减小底部 padding，从 80px 改为 40px，让背景变短 */
    padding: 0 20px 40px;
}

.header-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    /* 自动填满整个 header-wrap 的高度 */
    background: linear-gradient(135deg, #006567 0%, #008a8d 60%, #00a3a6 100%);
    border-bottom-left-radius: 30px;
    border-bottom-right-radius: 30px;
    z-index: 0;

    &::before,
    &::after {
        content: '';
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
    }

    &::before {
        width: 140px;
        height: 140px;
        top: -40px;
        right: -40px;
    }

    &::after {
        width: 80px;
        height: 80px;
        bottom: 20px;
        left: -20px;
    }
}

.user-card {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    padding: 0 5px;
    /* 修改2：删除了 margin-top: 80px; 这是导致背景过大的主要原因 */

    .avatar-box {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background-color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        flex-shrink: 0;

        .avatar-img {
            width: 42px;
            height: 42px;
        }
    }

    .user-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;

        .user-name {
            font-size: 20px;
            font-weight: bold;
            color: #ffffff;
            margin-bottom: 8px;
        }

        .user-tag {
            align-self: flex-start;
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 12px;
            border-radius: 12px;

            .tag-text {
                font-size: 11px;
                color: #ffffff;
            }
        }
    }
}

/* ========== 主体内容 ========== */
.content-section {
    flex: 1;
    padding: 0 15px 15px;
    margin-top: 20px;
    position: relative;
    z-index: 3;
    overflow-y: auto;
}

/* 列表和按钮样式保持不变... */
.settings-list {
    background-color: #ffffff;
    border-radius: 12px;
    margin-bottom: 16px;

    .list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;

        .item-left {
            display: flex;
            align-items: center;

            .item-icon {
                width: 32px;
                height: 32px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;

                &.icon-version {
                    background: linear-gradient(135deg, #9c27b0, #ba68c8);
                }
            }

            .item-label {
                font-size: 15px;
                color: #333333;
            }
        }

        .item-value {
            font-size: 14px;
            color: #999999;
        }
    }
}

.logout-btn {
    width: 100%;
    background-color: #ffffff;
    border-radius: 12px;
    padding: 16px 0;
    display: flex;
    justify-content: center;
    align-items: center;

    .logout-text {
        font-size: 15px;
        color: #e53935;
        margin-left: 6px;
    }
}

/* 底部功能栏保持不变... */
.tab-bar {
    flex-shrink: 0;
    display: flex;
    justify-content: space-around;
    align-items: center;
    background-color: #ffffff;
    height: 60px;
    padding-bottom: env(safe-area-inset-bottom);

    .tab-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #999999;
        flex: 1;

        &.active {
            color: #006567;
        }

        .tab-text {
            font-size: 12px;
            margin-top: 4px;
        }
    }
}
</style>