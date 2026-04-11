<template>
    <view class="page">
        <!-- 顶部固定区域 -->
        <view class="header">
            <!-- 搜索框 -->
            <view class="search-row">
                <input class="search-input" v-model="keyword" placeholder="搜索设备名称..."
                    placeholder-class="search-placeholder" />
            </view>
        </view>

        <!-- 主内容：设备列表 -->
        <scroll-view scroll-y class="list-container">
            <view v-if="filteredList.length === 0" class="empty-state">
                <text>暂无可用设备</text>
            </view>

            <view v-for="item in filteredList" :key="item.id" class="list-group">
                <!-- 主设备行 -->
                <view class="main-item" @click="selectDevice(item)">
                    <!-- 左侧：图标 -->
                    <view class="icon-box" :style="{ backgroundColor: themeColor }">
                        <image class="device-icon" :src="getIcon(item.device_type)" mode="aspectFit"></image>
                    </view>

                    <!-- 中间：类型与名称 -->
                    <view class="item-content">
                        <text class="device-type">{{ item.deviceLabel || item.device_type }}</text>
                        <text class="device-name">{{ item.name || '未命名' }}</text>
                    </view>

                    <!-- 右侧：展开/收起按钮（仅当有子设备时显示） -->
                    <view v-if="item.displayChildren && item.displayChildren.length > 0" class="expand-btn"
                        @click.stop="toggleExpand(item)">
                        <view class="expand-arrow" :class="{ 'expanded': item.expanded }"></view>
                    </view>
                </view>

                <!-- 子设备下拉菜单 -->
                <view v-show="item.expanded" class="child-list">
                    <view v-for="child in item.displayChildren" :key="child.id" class="child-item"
                        @click="selectDevice(child)">
                        <view class="child-content">
                            <text class="child-type">{{ child.deviceLabel || child.device_type }}</text>
                            <text class="child-name">{{ child.name || '未命名' }}</text>
                        </view>
                    </view>
                </view>
            </view>
        </scroll-view>
    </view>
</template>

<script>
import deviceDAO from '@/dao/deviceDAO.js'
import { themeColor, themeColorLight } from '@/static/themeColor.js'
import { getPinSvgUri } from '@/static/device_svgs.js'

export default {
    data() {
        return {
            lineId: '',
            lineName: '',
            deviceId: '', // 当前编辑的设备ID，用于排除
            keyword: '',
            deviceList: [], // 原始设备列表
            themeColor,
            themeColorLight
        }
    },

    computed: {
        /**
         * 过滤后的列表
         * 1. 排除当前正在编辑的设备（防止循环引用）
         * 2. 根据搜索关键字模糊匹配设备名称（匹配主设备或子设备）
         */
        filteredList() {
            let list = this.deviceList;

            // 用 map 生成新对象，不修改 deviceList 原始数据
            if (this.deviceId) {
                list = list
                    .filter(d => d.id !== this.deviceId)
                    .map(d => ({
                        ...d,
                        children: (d.children || []).filter(c => c.id !== this.deviceId)
                    }));
            }

            if (!this.keyword) {
                return list.map(d => ({
                    ...d,
                    displayChildren: d.children || []
                }));
            }

            const lowerKw = this.keyword.toLowerCase();

            return list.map(d => {
                const matchParent = d.name && d.name.toLowerCase().includes(lowerKw);
                const matchedChildren = (d.children || []).filter(c =>
                    c.name && c.name.toLowerCase().includes(lowerKw)
                );

                if (matchParent || matchedChildren.length > 0) {
                    return {
                        ...d,
                        expanded: matchedChildren.length > 0 ? true : d.expanded,
                        displayChildren: matchParent ? (d.children || []) : matchedChildren
                    };
                }
                return null;
            }).filter(Boolean);
        }
    },

    onLoad(query) {
        this.lineId = query.lineId || '';
        this.lineName = query.lineName ? decodeURIComponent(query.lineName) : '';
        this.deviceId = query.deviceId || '';

        this.loadData();
    },

    methods: {
        async loadData() {
            try {
                // DAO 已返回结构化的主设备列表（含 children），直接初始化 expanded 即可
                const mainDevices = await deviceDAO.findAllAvailablePreNodes(this.lineId);
                this.deviceList = mainDevices.map(d => ({
                    ...d,
                    expanded: false
                }));
            } catch (e) {
                console.error('加载可用上级节点失败:', e);
                uni.showToast({ title: '加载失败', icon: 'none' });
            }
        },

        getIcon(deviceType) {
            return getPinSvgUri(deviceType);
        },

        toggleExpand(item) {
            const original = this.deviceList.find(d => d.id === item.id);
            if (original) {
                original.expanded = !original.expanded;
            }
        },

        selectDevice(device) {
            const eventChannel = this.getOpenerEventChannel();
            if (eventChannel && eventChannel.emit) {
                eventChannel.emit('selectPreNode', {
                    id: device.id,
                    name: device.name,
                    device_type: device.device_type
                });
            }
            uni.navigateBack();
        }
    }
}
</script>

<style scoped>
page {
    background-color: #f5f7fa;
    height: 100%;
}

.page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background-color: #f5f7fa;
}

/* 顶部固定区域 */
.header {
    background-color: #ffffff;
    padding: 20rpx 30rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    z-index: 10;
    flex-shrink: 0;
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
}

.title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
}

.tag {
    font-size: 24rpx;
    padding: 6rpx 16rpx;
    border-radius: 8rpx;
    font-weight: 500;
}

.search-row {
    width: 100%;
}

.search-input {
    width: 100%;
    height: 70rpx;
    background-color: #f0f2f5;
    border-radius: 35rpx;
    padding: 0 30rpx;
    font-size: 28rpx;
    box-sizing: border-box;
}

.search-placeholder {
    color: #999;
}

/* 列表区域 */
.list-container {
    flex: 1;
    height: 0;
    padding: 20rpx;
    box-sizing: border-box;
}

.empty-state {
    text-align: center;
    padding: 100rpx 0;
    color: #999;
    font-size: 28rpx;
}

.list-group {
    background-color: #ffffff;
    border-radius: 12rpx;
    margin-bottom: 20rpx;
    overflow: hidden;
}

/* 主设备行 */
.main-item {
    display: flex;
    align-items: center;
    padding: 24rpx 30rpx;
    position: relative;
}

.main-item:active {
    background-color: #f9f9f9;
}

.icon-box {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 20rpx;
    flex-shrink: 0;
}

.device-icon {
    width: 36rpx;
    height: 36rpx;
}

.item-content {
    flex: 1;
    display: flex;
    align-items: center;
    overflow: hidden;
}

.device-type {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-right: 16rpx;
    flex-shrink: 0;
}

.device-name {
    font-size: 28rpx;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.expand-btn {
    padding: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 外层容器：固定尺寸，纯粹负责翻转动画 */
.expand-arrow {
    width: 24rpx;
    height: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease;
    /* 动画加在容器上 */
}

/* 展开时：沿 X 轴进行 3D 上下翻转。效果最干净利落，完全没有画圆弧的甩动感 */
.expand-arrow.expanded {
    transform: rotateX(180deg);
}

/* 内层伪元素：纯粹负责绘制静态的折角 */
.expand-arrow::after {
    content: '';
    width: 14rpx;
    height: 14rpx;
    border-right: 4rpx solid #999;
    border-bottom: 4rpx solid #999;
    transform: rotate(45deg);
    /* 固定为向下的折角 */
    /* 视觉重心微调：因为折角的线条在右下，视觉偏下，所以用 margin 往上推一点点，使其完美居中 */
    margin-bottom: 6rpx;
}

/* 子设备列表 */
.child-list {
    background-color: #fafafa;
    border-top: 1rpx solid #eee;
}

.child-item {
    padding: 24rpx 30rpx 24rpx 30rpx;
    /* 左侧留出主设备图标的缩进 */
    border-bottom: 1rpx solid #f0f0f0;
}

.child-item:last-child {
    border-bottom: none;
}

.child-item:active {
    background-color: #f0f0f0;
}

.child-content {
    display: flex;
    align-items: center;
}

.child-type {
    font-size: 28rpx;
    font-weight: bold;
    color: #444;
    margin-right: 16rpx;
    flex-shrink: 0;
}

.child-name {
    font-size: 26rpx;
    color: #777;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>