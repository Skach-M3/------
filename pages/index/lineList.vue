<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <u-navbar
      title="线路"
      :bgColor="themeColor"
      titleStyle="color: #ffffff; font-weight: bold; font-size: 34rpx;"
      leftIconColor="#ffffff"
      :autoBack="true"
      placeholder
    ></u-navbar>

    <!-- 搜索区域 -->
    <view class="search-wrapper">
      <view class="search-box">
        <u-icon name="search" size="44rpx" color="#999999"></u-icon>
        <input
          class="search-input"
          type="text"
          v-model="keyword"
          placeholder="按名字搜索线路"
          placeholder-class="search-placeholder"
        />
      </view>
    </view>

    <!-- 列表区域 -->
    <scroll-view scroll-y class="list-container">
      <view class="list-content">
        <view class="card-item" v-for="(item, index) in lineList" :key="index">
          <!-- 卡片上半部分：信息 -->
          <view class="card-header">
            <view class="header-left">
              <view class="tag" :style="{ color: themeColor, backgroundColor: themeColorLight }">线路</view>
              <text class="title">{{ item.name }}</text>
            </view>
            <text class="date">{{ item.date }}</text>
          </view>
          
          <!-- 卡片下半部分：操作按钮 -->
          <view class="card-actions">
            <view class="action-btn btn-collect" @click="handleCollect(item)">进入采集</view>
            <view class="action-btn btn-edit" @click="handleEdit(item)">编辑</view>
          </view>
        </view>
      </view>
      <!-- 底部占位，防止被固定按钮遮挡 -->
      <view class="bottom-spacer"></view>
    </scroll-view>

    <!-- 底部新建按钮 -->
    <view class="bottom-bar">
      <view class="submit-btn" :style="{ backgroundColor: themeColor }" @click="handleCreate">
        新建线路
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 主题色配置
const themeColor = '#006567';
const themeColorLight = 'rgba(0, 101, 103, 0.1)'; // 主题色透明度10%作为背景

// 搜索关键词
const keyword = ref('');

// 模拟数据类型定义
interface LineItem {
  id: number;
  name: string;
  date: string;
}

// 模拟列表数据
const lineList = ref<LineItem[]>([
  { id: 1, name: '10KV奥体145线[12km]', date: '2026-03-04' },
  { id: 2, name: '10KV奥体145线[12km]', date: '2026-03-04' },
  { id: 3, name: '10KV奥体145线[12km]', date: '2026-03-04' },
  { id: 4, name: '10KV奥体145线[12km]', date: '2026-03-04' },
]);

// 操作方法
const handleCollect = (item: LineItem) => {
  console.log('进入采集', item);
  // uni.navigateTo({ url: `/pages/collect/index?id=${item.id}` })
};

const handleEdit = (item: LineItem) => {
  console.log('编辑', item);
};

const handleCreate = () => {
  console.log('新建线路');
};
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f6f8; // 整体浅灰色背景
}

/* 搜索区域 */
.search-wrapper {
  background-color: #ffffff;
  padding: 20rpx 30rpx;
}

.search-box {
  display: flex;
  align-items: center;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #eeeeee; // 底部边框
  
  .search-input {
    flex: 1;
    margin-left: 16rpx;
    font-size: 30rpx;
    color: #333333;
  }
  
  .search-placeholder {
    color: #cccccc;
  }
}

/* 列表区域 */
.list-container {
  flex: 1;
  overflow: hidden;
}

.list-content {
  padding: 30rpx;
}

.card-item {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04); // 微弱的阴影
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    
    .header-left {
      display: flex;
      align-items: center;
      flex: 1;
      
      .tag {
        font-size: 24rpx;
        padding: 4rpx 16rpx;
        border-radius: 20rpx;
        margin-right: 16rpx;
        font-weight: 500;
      }
      
      .title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
        flex: 1;
        /* 超出省略号 */
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    
    .date {
      font-size: 26rpx;
      color: #999999;
      margin-left: 20rpx;
    }
  }
  
  .card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 20rpx; // 按钮间距
    
    .action-btn {
      font-size: 26rpx;
      padding: 12rpx 30rpx;
      border-radius: 8rpx;
      font-weight: 500;
      
      &.btn-collect {
        background-color: #fff3e8; // 浅橙色背景
        color: #ff8c00; // 橙色文字
      }
      
      &.btn-edit {
        background-color: #f5f5f5; // 浅灰色背景
        color: #333333;
      }
    }
  }
}

.bottom-spacer {
  height: 140rpx; // 留出底部按钮的空间
}

/* 底部按钮区域 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  padding: 20rpx 40rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); // 适配底部安全区
  box-shadow: 0 -4rpx 10rpx rgba(0, 0, 0, 0.03);
  
  .submit-btn {
    height: 88rpx;
    border-radius: 44rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #ffffff;
    font-size: 32rpx;
    font-weight: 500;
  }
}
</style>