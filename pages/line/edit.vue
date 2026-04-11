<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <u-navbar :title="isEdit ? '编辑线路' : '新建线路'" :bgColor="themeColor"
      titleStyle="color: #ffffff; font-weight: bold; font-size: 34rpx;" leftIconColor="#ffffff" :autoBack="true"
      placeholder></u-navbar>

    <!-- 表单区域 -->
    <scroll-view scroll-y class="form-container">
      <view class="form-card">

        <view class="form-item">
          <text class="form-label required">线路名称</text>
          <input class="form-input" v-model="formData.name" placeholder="请输入线路名称"
            placeholder-class="input-placeholder" />
        </view>

        <view class="form-item">
          <text class="form-label">所属变电站</text>
          <input class="form-input" v-model="formData.station" placeholder="请输入所属变电站"
            placeholder-class="input-placeholder" />
        </view>

        <view class="form-item">
          <text class="form-label">归属单位</text>
          <input class="form-input" v-model="formData.unit" placeholder="请输入归属单位"
            placeholder-class="input-placeholder" />
        </view>

        <view class="form-item">
          <text class="form-label">采录人</text>
          <input class="form-input" v-model="formData.recorder" placeholder="请输入采录人"
            placeholder-class="input-placeholder" />
        </view>

        <view class="form-item">
          <text class="form-label">创建日期</text>
          <picker mode="date" :value="formData.createdDate" @change="onDateChange">
            <view class="form-input picker-input">
              <text :class="formData.createdDate ? 'picker-value' : 'picker-placeholder'">
                {{ formData.createdDate || '请选择日期' }}
              </text>
              <text class="picker-arrow">▸</text>
            </view>
          </picker>
        </view>

      </view>
      <view class="bottom-spacer"></view>
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="bottom-bar">
      <view class="submit-btn" :style="{ backgroundColor: themeColor }" @click="handleSave">
        保存
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { lineDAO } from '@/dao/lineDAO';
import { themeColor } from '@/static/themeColor.js';

const isEdit = ref(false);
const lineId = ref<number | null>(null);

const formData = reactive({
  station: '',
  name: '',
  unit: '',
  recorder: '',
  createdDate: ''
});

// 获取今天日期 yyyy-MM-dd
const getToday = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// 日期选择回调
const onDateChange = (e: any) => {
  formData.createdDate = e.detail.value;
};

// 页面加载
onLoad((options: any) => {
  if (options && options.id) {
    isEdit.value = true;
    lineId.value = Number(options.id);
    loadLine(lineId.value);
  } else {
    // 新建模式，默认填入今天日期
    formData.createdDate = getToday();
  }
});

// 加载线路数据（编辑模式）
const loadLine = async (id: number) => {
  try {
    const line = await lineDAO.findById(id);
    if (line) {
      formData.station = line.station || '';
      formData.name = line.name || '';
      formData.unit = line.unit || '';
      formData.recorder = line.recorder || '';
      formData.createdDate = line.created_date || '';
    }
  } catch (e) {
    console.error('加载线路数据失败:', e);
    uni.showToast({ title: '加载失败', icon: 'none' });
  }
};

// 保存
const handleSave = async () => {
  if (!formData.name.trim()) {
    uni.showToast({ title: '请输入线路名称', icon: 'none' });
    return;
  }

  try {
    const data = {
      id: lineId.value,
      station: formData.station.trim(),
      name: formData.name.trim(),
      unit: formData.unit.trim(),
      recorder: formData.recorder.trim(),
      createdDate: formData.createdDate
    };

    if (isEdit.value) {
      await lineDAO.update(data);
      uni.showToast({ title: '修改成功', icon: 'success' });
    } else {
      await lineDAO.insert(data);
      uni.showToast({ title: '新建成功', icon: 'success' });
    }

    setTimeout(() => {
      uni.navigateBack();
    }, 500);
  } catch (e) {
    console.error('保存失败:', e);
    uni.showToast({ title: '保存失败', icon: 'none' });
  }
};
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f6f8;
}

.form-container {
  flex: 1;
  overflow: hidden;
}

.form-card {
  margin: 30rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 10rpx 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.form-item {
  padding: 28rpx 0;
  border-bottom: 2rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  .form-label {
    display: block;
    font-size: 28rpx;
    color: #666666;
    margin-bottom: 16rpx;

    &.required::before {
      content: '*';
      color: #e74c3c;
      margin-right: 6rpx;
    }
  }

  .form-input {
    width: 100%;
    font-size: 30rpx;
    color: #333333;
    padding: 8rpx 0;
  }
}

.input-placeholder {
  color: #cccccc;
}

/* 日期选择器样式 */
.picker-input {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .picker-value {
    color: #333333;
    font-size: 30rpx;
  }

  .picker-placeholder {
    color: #cccccc;
    font-size: 30rpx;
  }

  .picker-arrow {
    color: #cccccc;
    font-size: 28rpx;
  }
}

.bottom-spacer {
  height: 140rpx;
}

/* 底部按钮 */
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