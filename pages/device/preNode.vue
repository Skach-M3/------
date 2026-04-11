<template>
    <view class="page">
        <!-- 顶部固定区域 -->
        <view class="header">
            <!-- 搜索框 -->
            <view class="search-row">
                <input class="search-input" v-model="keyword" placeholder="搜索设备名称..."
                    placeholder-class="search-placeholder" />
            </view>

            <!-- 筛选行：设备类型 -->
            <scroll-view scroll-x class="filter-row" :show-scrollbar="false">
                <view class="filter-list">
                    <view v-for="(item, index) in availableTypes" :key="index" class="filter-tag"
                        :class="{ 'active': selectedType === item.value }"
                        :style="selectedType === item.value ? { backgroundColor: themeColor, borderColor: themeColor, color: '#fff' } : {}"
                        @click="selectType(item.value)">
                        {{ item.label }}
                    </view>
                </view>
            </scroll-view>
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
            selectedType: '', // 当前选中的设备类型，空字符串表示全部
            availableTypes: [], // 动态提取的所有设备类型
            deviceList: [], // 原始设备列表
            themeColor,
            themeColorLight
        }
    },

    computed: {
        /**
         * 过滤后的列表
         * 1. 排除当前正在编辑的设备（防止循环引用）
         * 2. 根据搜索关键字模糊匹配设备名称
         * 3. 根据选中的设备类型进行筛选
         */
        filteredList() {
            let list = this.deviceList;

            // 1. 排除当前正在编辑的设备
            if (this.deviceId) {
                list = list
                    .filter(d => d.id !== this.deviceId)
                    .map(d => ({
                        ...d,
                        children: (d.children || []).filter(c => c.id !== this.deviceId)
                    }));
            }

            // 如果没有关键字且没有选择类型，直接返回全部
            if (!this.keyword && !this.selectedType) {
                return list.map(d => ({
                    ...d,
                    displayChildren: d.children || []
                }));
            }

            const lowerKw = this.keyword.toLowerCase();
            const targetType = this.selectedType;

            return list.map(d => {
                const dType = d.deviceLabel || d.device_type;

                // 判断主设备是否符合条件
                const matchParentKw = !lowerKw || (d.name && d.name.toLowerCase().includes(lowerKw));
                const matchParentType = !targetType || dType === targetType;
                const matchParent = matchParentKw && matchParentType;

                // 判断子设备是否符合条件
                const matchedChildren = (d.children || []).filter(c => {
                    const cType = c.deviceLabel || c.device_type;
                    const matchChildKw = !lowerKw || (c.name && c.name.toLowerCase().includes(lowerKw));
                    const matchChildType = !targetType || cType === targetType;
                    return matchChildKw && matchChildType;
                });

                // 如果主设备符合，或者有子设备符合
                if (matchParent || matchedChildren.length > 0) {
                    return {
                        ...d,
                        // 如果有匹配的子设备，自动展开；否则保持原有展开状态
                        expanded: matchedChildren.length > 0 ? true : d.expanded,
                        // 如果主设备符合且子设备不符合，显示所有子设备；如果有子设备符合，只显示符合的子设备
                        displayChildren: matchParent && matchedChildren.length === 0 && !targetType
                            ? (d.children || [])
                            : (matchedChildren.length > 0 ? matchedChildren : (matchParent ? d.children || [] : []))
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
                const mainDevices = await deviceDAO.findAllAvailablePreNodes(this.lineId);
                this.deviceList = mainDevices.map(d => ({
                    ...d,
                    expanded: false
                }));

                // 动态提取所有设备类型（包含主设备和子设备）
                this.extractDeviceTypes(mainDevices);
            } catch (e) {
                console.error('加载可用上级节点失败:', e);
                uni.showToast({ title: '加载失败', icon: 'none' });
            }
        },

        // 提取并去重所有的设备类型
        extractDeviceTypes(devices) {
            const typesSet = new Set();
            devices.forEach(d => {
                if (d.deviceLabel || d.device_type) {
                    typesSet.add(d.deviceLabel || d.device_type);
                }
                if (d.children && d.children.length > 0) {
                    d.children.forEach(c => {
                        if (c.deviceLabel || c.device_type) {
                            typesSet.add(c.deviceLabel || c.device_type);
                        }
                    });
                }
            });

            // 构建供筛选的数组
            this.availableTypes = [
                { label: '全部', value: '' },
                ...Array.from(typesSet).map(type => ({ label: type, value: type }))
            ];
        },

        // 切换设备类型筛选
        selectType(typeValue) {
            this.selectedType = typeValue;
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
    padding: 20rpx 0;
    /* 调整 padding 适应全宽滚动 */
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    z-index: 10;
    flex-shrink: 0;
}

.search-row {
    width: 100%;
    padding: 0 30rpx;
    box-sizing: border-box;
    margin-bottom: 20rpx;
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

/* 筛选行样式 */
.filter-row {
    width: 100%;
    white-space: nowrap;
}

.filter-list {
    display: inline-flex;
    padding: 0 30rpx;
}

.filter-tag {
    display: inline-block;
    padding: 10rpx 24rpx;
    margin-right: 20rpx;
    font-size: 26rpx;
    color: #666;
    background-color: #f5f7fa;
    border: 1rpx solid #e4e7ed;
    border-radius: 30rpx;
    transition: all 0.2s ease;
}

.filter-tag:last-child {
    margin-right: 0;
}

.filter-tag.active {
    /* 激活状态的背景色和边框色由内联样式动态注入，这里设置默认激活文字颜色 */
    color: #ffffff;
    font-weight: bold;
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

.expand-arrow {
    width: 24rpx;
    height: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease;
}

.expand-arrow.expanded {
    transform: rotateX(180deg);
}

.expand-arrow::after {
    content: '';
    width: 14rpx;
    height: 14rpx;
    border-right: 4rpx solid #999;
    border-bottom: 4rpx solid #999;
    transform: rotate(45deg);
    margin-bottom: 6rpx;
}

/* 子设备列表 */
.child-list {
    background-color: #fafafa;
    border-top: 1rpx solid #eee;
}

.child-item {
    padding: 24rpx 30rpx 24rpx 30rpx;
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