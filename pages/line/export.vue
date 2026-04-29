<template>
    <view class="page-container">
        <!-- 顶部导航栏 -->
        <u-navbar title="电力数据导出" :bgColor="themeColor" titleStyle="color: #ffffff; font-weight: bold; font-size: 34rpx;"
            leftIconColor="#ffffff" :autoBack="true" placeholder></u-navbar>

        <scroll-view scroll-y class="content-container">
            <view class="form-content">

                <!-- 当前线路 -->
                <view class="form-group" v-if="lineName">
                    <view class="label">线路：</view>
                    <view class="input-row border-bottom">
                        <text class="value-text">{{ lineName }}</text>
                    </view>
                </view>

                <!-- 保存到 -->
                <view class="form-group">
                    <view class="label">保存到：</view>
                    <view class="input-row border-bottom">
                        <text class="value-text">{{ savePath }}</text>
                        <u-icon name="folder" color="#f3b34c" size="64rpx"></u-icon>
                    </view>
                </view>

                <!-- 文件名 -->
                <view class="form-group">
                    <view class="label">文件名：</view>
                    <view class="input-row border-bottom">
                        <input class="value-input" type="text" v-model="fileName" placeholder="请输入文件名" />
                        <text class="suffix">.xlsx</text>
                    </view>
                </view>

                <!-- 照片选项 -->
                <view class="form-group">
                    <view class="label">照片选项</view>
                    <view class="radio-card">
                        <view class="radio-item" @click="selectOption(0)" hover-class="radio-item-hover"
                            :hover-stay-time="150">
                            <view class="radio-icon-wrapper">
                                <view class="radio-icon" :class="{ active: photoOption === 0 }">
                                    <view class="radio-inner" v-if="photoOption === 0"></view>
                                </view>
                            </view>
                            <view class="radio-text">
                                <text class="radio-title">不导出照片</text>
                                <text class="radio-desc">速度更快</text>
                            </view>
                        </view>

                        <view class="radio-item" @click="selectOption(1)" hover-class="radio-item-hover"
                            :hover-stay-time="150">
                            <view class="radio-icon-wrapper">
                                <view class="radio-icon" :class="{ active: photoOption === 1 }">
                                    <view class="radio-inner" v-if="photoOption === 1"></view>
                                </view>
                            </view>
                            <view class="radio-text">
                                <text class="radio-title">导出照片</text>
                                <text class="radio-desc">花费大量时间，且复制照片将占用一定的存储空间</text>
                            </view>
                        </view>
                    </view>
                </view>

            </view>
        </scroll-view>

        <!-- 底部按钮区域 -->
        <view class="bottom-bar">
            <view class="submit-btn" :style="{ backgroundColor: themeColor }" @click="handleExport"
                hover-class="submit-btn-hover">
                开始导出
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { themeColor } from '@/static/themeColor.js';
import { exportLine } from '@/utils/exportLine.js';

// 由 LineList 跳转时传入
let lineId: string | number = '';
const lineName = ref('');

// 表单数据
// 默认显示给用户看的"友好路径"
const savePath = ref('手机存储/Download/线路核查导出');
// 真实绝对路径(写文件用),与上面对应
const baseDir = '/storage/emulated/0/Download/线路核查导出';

const fileName = ref('');
const photoOption = ref(0); // 0: 不导出, 1: 导出

// 接收路由参数 + 设置默认文件名
onLoad((options: any) => {
    lineId = options?.id || '';
    lineName.value = decodeURIComponent(options?.name || '');

    const now = new Date();
    const stamp =
        `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}` +
        `_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    // 默认: 线路名_时间戳;若没传线路名,只用时间戳
    fileName.value = lineName.value
        ? `${lineName.value}_${stamp}`
        : stamp;
});

const selectOption = (index: number) => {
    photoOption.value = index;
};

// 申请存储权限(Android)
const requestStoragePermission = (): Promise<boolean> => {
    return new Promise((resolve) => {
        // @ts-ignore
        if (typeof plus === 'undefined' || plus.os.name !== 'Android') return resolve(true);
        // @ts-ignore
        plus.android.requestPermissions(
            ['android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.READ_EXTERNAL_STORAGE'],
            (e: any) => resolve(e.granted.length > 0),
            () => resolve(false)
        );
    });
};

// 点击开始导出
const handleExport = async () => {
    // 校验
    if (!lineId) {
        return uni.showToast({ title: '缺少线路ID', icon: 'none' });
    }
    const trimmedName = (fileName.value || '').trim();
    if (!trimmedName) {
        return uni.showToast({ title: '请输入文件名', icon: 'none' });
    }

    // 权限
    const granted = await requestStoragePermission();
    if (!granted) {
        return uni.showModal({
            title: '提示',
            content: '请开启存储权限后重试',
            showCancel: false
        });
    }

    uni.showLoading({
        title: photoOption.value === 1 ? '导出中(含照片)...' : '导出中...',
        mask: true
    });

    try {
        const { displayPath, dirPath } = await exportLine(lineId, {
            fileName: trimmedName,
            includePhotos: photoOption.value === 1,
            baseDir
        });

        uni.hideLoading();

        uni.showModal({
            title: '导出成功',
            content: `文件已保存至:\n${displayPath}\n\n打开"文件管理"或微信"选择文件"即可找到`,
            confirmText: '复制路径',
            cancelText: '知道了',
            success: (res) => {
                if (res.confirm) {
                    uni.setClipboardData({
                        data: dirPath,
                        success: () => uni.showToast({ title: '路径已复制' })
                    });
                }
            }
        });
    } catch (e: any) {
        uni.hideLoading();
        console.error('[export] 失败', e);
        uni.showModal({
            title: '导出失败',
            content: String(e && e.message || e),
            showCancel: false
        });
    }
};
</script>

<style lang="scss" scoped>
.page-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f5f6f8; // 保持与之前页面一致的背景色，如需纯白可改为 #ffffff
}

.content-container {
    flex: 1;
    overflow: hidden;
}

.form-content {
    padding: 40rpx 30rpx 160rpx;
    background-color: #ffffff;
    box-sizing: border-box;
    min-height: 100%;
}

.form-group {
    margin-bottom: 50rpx;

    .label {
        font-size: 30rpx;
        color: #666666;
        margin-bottom: 20rpx;
    }

    .input-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 16rpx;

        &.border-bottom {
            border-bottom: 2rpx solid #dcdcdc; // 底部绿/灰线，根据截图偏向浅灰色或浅绿色
        }

        .value-text {
            font-size: 36rpx;
            color: #333333;
            flex: 1;
        }

        .value-input {
            font-size: 36rpx;
            color: #333333;
            flex: 1;
        }

        .suffix {
            font-size: 34rpx;
            color: #333333;
            margin-left: 10rpx;
        }
    }
}

/* 照片选项卡片 */
.radio-card {
    border: 2rpx solid #e0e0e0;
    border-radius: 16rpx;
    padding: 10rpx 0;
}

.radio-item {
    display: flex;
    align-items: flex-start;
    padding: 24rpx 30rpx;
    transition: background-color 0.2s;

    .radio-icon-wrapper {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 20rpx;
        flex-shrink: 0;
        transition: background-color 0.2s;
    }

    .radio-icon {
        width: 40rpx;
        height: 40rpx;
        border-radius: 50%;
        border: 3rpx solid #999999;
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        transition: border-color 0.2s;

        &.active {
            border-color: #00897b; // 选中时的深绿色边框
        }

        .radio-inner {
            width: 20rpx;
            height: 20rpx;
            border-radius: 50%;
            background-color: #00897b; // 选中时的实心圆
        }
    }

    .radio-text {
        display: flex;
        flex-direction: column;
        flex: 1;
        margin-top: 4rpx;

        .radio-title {
            font-size: 32rpx;
            color: #333333;
            margin-bottom: 8rpx;
        }

        .radio-desc {
            font-size: 24rpx;
            color: #999999;
            line-height: 1.4;
        }
    }
}

/* 点击时的交互反馈类 */
.radio-item-hover {
    .radio-icon-wrapper {
        background-color: #e0f2f1; // 仅在点击瞬间出现浅绿色光晕
    }
}

/* 底部按钮区域 */
.bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #ffffff;
    padding: 20rpx 40rpx;
    padding-bottom: calc(20rpx + env(safe-area-inset-bottom));

    .submit-btn {
        height: 90rpx;
        border-radius: 12rpx;
        background-color: #67c23a;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #ffffff;
        font-size: 34rpx;
        font-weight: 500;
        transition: opacity 0.2s;
    }

    .submit-btn-hover {
        opacity: 0.8;
    }
}
</style>