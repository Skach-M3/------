<!-- pages/device/edit.vue -->
<template>
  <view class="page">
    <!-- 标题栏 -->
    <view class="header">
      <text class="header-title">{{ currentSchema ? currentSchema.label : '加载中...' }}</text>
    </view>

    <!-- 表单区域 -->
    <view v-if="currentSchema" class="form-wrap">
      <SchemaForm
        ref="formRef"
        :schema="currentSchema"
        :modelValue="attributes"
        @update:modelValue="attributes = $event"
      />

      <!-- 坐标显示 -->
      <view class="coord-section">
        <text class="coord-label">当前坐标</text>
        <text class="coord-value">
          {{ longitude ? (longitude + ', ' + latitude) : '尚未定位' }}
        </text>
        <button size="mini" type="default" @tap="getLocation" style="margin-top: 10rpx;">
          获取定位
        </button>
      </view>

      <!-- 保存按钮 -->
      <button class="save-btn" type="primary" @tap="save">
        保存
      </button>
    </view>

    <!-- Schema 未找到 -->
    <view v-else style="padding: 40rpx; text-align: center;">
      <text>未找到设备类型 Schema: {{ deviceType }}</text>
    </view>
  </view>
</template>

<script>
// 引入 Schema
import '@/schema/pole.js'
import { getSchema } from '@/schema/registry.js'
import { dbHelper } from '@/db/dbHelper.js'
import SchemaForm from '@/components/SchemaForm.vue'

export default {
  components: { SchemaForm },
  data() {
    return {
      taskId: '',
      deviceType: '',
      deviceId: '',
      currentSchema: null,
      attributes: {},
      longitude: 0,
      latitude: 0
    }
  },
  async onLoad(query) {
    console.log('== edit.vue onLoad ==', JSON.stringify(query))
    this.taskId = query.taskId || ''
    this.deviceType = query.deviceType || ''

    // 获取 Schema
    this.currentSchema = getSchema(this.deviceType)
    console.log('== currentSchema ==', this.currentSchema ? this.currentSchema.label : 'NULL')

    // 如果传了 deviceId，说明是编辑模式，加载已有数据
      if (query.deviceId) {
        this.deviceId = query.deviceId
        const row = await dbHelper.selectOne(
          'SELECT * FROM t_device WHERE id=?',
          [query.deviceId]
        )
        if (row) {
          this.attributes = JSON.parse(row.attributes || '{}')
          this.longitude = row.longitude
          this.latitude = row.latitude
          console.log('=== 回显数据 ===', this.attributes)
        }
      }
  },

  methods: {
    async loadDevice(id) {
      try {
        const row = await dbHelper.selectOne(
          'SELECT * FROM t_device WHERE id=?', [id]
        )
        if (row) {
          this.attributes = JSON.parse(row.attributes || '{}')
          this.longitude = row.longitude || 0
          this.latitude = row.latitude || 0
          console.log('== 回显数据 ==', JSON.stringify(this.attributes))
        }
      } catch (e) {
        console.error('加载设备失败', e)
      }
    },

    getLocation() {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.longitude = res.longitude
          this.latitude = res.latitude
          uni.showToast({ title: '定位成功', icon: 'success' })
        },
        fail: (err) => {
          console.error('定位失败', err)
          uni.showToast({ title: '定位失败', icon: 'none' })
        }
      })
    },

    async save() {
      // 1. 表单验证
      const valid = this.$refs.formRef.validate()
      if (!valid) {
        uni.showToast({ title: '请填写必填项', icon: 'none' })
        return
      }

      console.log('== 准备保存 ==')
      console.log('deviceType:', this.deviceType)
      console.log('attributes:', JSON.stringify(this.attributes))

      const now = Date.now()

      try {
        if (this.deviceId) {
          // 更新
          await dbHelper.execute(
            `UPDATE t_device SET
              attributes=?, longitude=?, latitude=?, updated_at=?, status=?
             WHERE id=?`,
            [
              JSON.stringify(this.attributes),
              this.longitude,
              this.latitude,
              now,
              'saved',
              this.deviceId
            ]
          )
        } else {
          // 新增
          this.deviceId = 'dev_' + now
          await dbHelper.execute(
            `INSERT INTO t_device
              (id, task_id, device_type, name, longitude, latitude, parent_id, attributes, photos, status, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              this.deviceId,
              this.taskId,
              this.deviceType,
              this.attributes.pole_number || this.currentSchema.label,
              this.longitude,
              this.latitude,
              '',
              JSON.stringify(this.attributes),
              '[]',
              'saved',
              now,
              now
            ]
          )
        }

        uni.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1000)

      } catch (e) {
        console.error('保存失败', e)
        uni.showToast({ title: '保存失败: ' + (e.message || ''), icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}
.header {
  background: #2979ff;
  padding: 30rpx;
  padding-top: 80rpx;
}
.header-title {
  color: #fff;
  font-size: 36rpx;
  font-weight: bold;
}
.form-wrap {
  padding: 20rpx;
}
.coord-section {
  background: #fff;
  border-radius: 10rpx;
  padding: 24rpx;
  margin: 20rpx;
}
.coord-label {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}
.coord-value {
  font-size: 26rpx;
  color: #666;
  margin-top: 10rpx;
  display: block;
}
.save-btn {
  margin: 40rpx 20rpx;
}
</style>