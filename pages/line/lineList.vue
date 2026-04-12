<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <u-navbar title="线路" :bgColor="themeColor" titleStyle="color: #ffffff; font-weight: bold; font-size: 34rpx;"
      leftIconColor="#ffffff" :autoBack="true" placeholder></u-navbar>

    <!-- 搜索区域 -->
    <view class="search-wrapper">
      <view class="search-box">
        <u-icon name="search" size="44rpx" color="#999999"></u-icon>
        <input class="search-input" type="text" v-model="keyword" placeholder="按名字搜索线路"
          placeholder-class="search-placeholder" @input="handleSearch" />
      </view>
    </view>

    <!-- 列表区域 -->
    <scroll-view scroll-y class="list-container">
      <view class="list-content">
        <!-- 空状态 -->
        <view class="empty-tip" v-if="lineList.length === 0">
          <text class="empty-text">暂无线路，请点击底部按钮新建</text>
        </view>

        <view class="card-item" v-for="(item, index) in lineList" :key="item.id">
          <!-- 卡片上半部分：信息 -->
          <view class="card-header">
            <view class="header-left">
              <view class="tag" :style="{ color: themeColor, backgroundColor: themeColorLight }">线路</view>
              <text class="title">{{ item.name }}</text>
            </view>
            <text class="date">{{ item.created_date }}</text>
          </view>

          <!-- 卡片中间：详细信息 -->
          <view class="card-info">
            <text class="info-text" v-if="item.station">变电站：{{ item.station }}</text>
            <text class="info-text" v-if="item.recorder">采录人：{{ item.recorder }}</text>
          </view>

          <!-- 卡片下半部分：操作按钮 -->
          <view class="card-actions">
            <view class="action-btn btn-delete" @click="handleDelete(item)">删除</view>
            <view class="action-btn btn-edit" @click="handleEdit(item)">编辑</view>
            <view class="action-btn btn-collect" @click="handleCollect(item)">进入采集</view>
          </view>
        </view>
      </view>
      <!-- 底部占位 -->
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
import { onShow } from '@dcloudio/uni-app';
import { lineDAO } from '@/dao/lineDAO';
import { themeColor, themeColorLight } from '@/static/themeColor.js';

// 搜索关键词
const keyword = ref('');

// 列表数据
const lineList = ref<any[]>([]);

// 加载数据
const loadLines = async () => {
  try {
    let result;
    if (keyword.value.trim()) {
      result = await lineDAO.findByKeyword(keyword.value.trim());
    } else {
      result = await lineDAO.findAll();
    }
    lineList.value = result || [];
  } catch (e) {
    console.error('加载线路失败:', e);
    lineList.value = [];
  }
};

// 搜索
let searchTimer: any = null;
const handleSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadLines();
  }, 300);
};

// 每次页面显示时刷新（新建/编辑返回后自动刷新）
onShow(() => {
  loadLines();
});

// 进入采集 → 跳转地图页
const handleCollect = (item: any) => {
  uni.navigateTo({ url: `/pages/index/map?lineId=${item.id}&lineName=${encodeURIComponent(item.name)}` });
};

// 编辑
const handleEdit = (item: any) => {
  uni.navigateTo({ url: `/pages/line/edit?id=${item.id}` });
};

// 删除
const handleDelete = (item: any) => {
  uni.showModal({
    title: '确认删除',
    content: `确定删除线路「${item.name}」吗？`,
    confirmText: '取消',
    cancelText: '确定',
    success: async (res) => {
      if (res.cancel) {
        // 点的是左边的"删除"
        try {
          await lineDAO.deleteById(item.id);
          uni.showToast({ title: '已删除', icon: 'success' });
          loadLines();
        } catch (e) {
          console.error('删除失败:', e);
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
};

// 新建
const handleCreate = () => {
  uni.navigateTo({ url: '/pages/line/edit' });
};
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f6f8;
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
  border-bottom: 2rpx solid #eeeeee;

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

/* 空状态 */
.empty-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 120rpx 0;

  .empty-text {
    font-size: 28rpx;
    color: #999999;
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
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;

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

  .card-info {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-bottom: 24rpx;
    padding-left: 8rpx;

    .info-text {
      font-size: 26rpx;
      color: #666666;
    }
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 20rpx;

    .action-btn {
      font-size: 26rpx;
      padding: 12rpx 30rpx;
      border-radius: 8rpx;
      font-weight: 500;

      &.btn-collect {
        background-color: #fff3e8;
        color: #ff8c00;
      }

      &.btn-edit {
        background-color: #f5f5f5;
        color: #333333;
      }

      &.btn-delete {
        background-color: #fff0f0;
        color: #e74c3c;
      }
    }
  }
}

.bottom-spacer {
  height: 140rpx;
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