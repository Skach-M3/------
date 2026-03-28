<template>
  <view class="page">

    <!-- 属性表单卡片 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">{{ currentSchema.label }}信息</text>
      </view>
      <schema-form ref="formRef" :schema="currentSchema" v-model="attributes" />
    </view>

    <!-- 子设备入口（主设备已保存 且 schema 定义了 children 时显示） -->
    <view v-if="showChildren" class="card">
      <view class="card-header">
        <text class="card-title">关联设备</text>
      </view>
      <view class="children-btns">
        <view v-for="child in currentSchema.children" :key="child.deviceType" class="child-btn"
          @click="goAddChild(child)">
          <text class="child-btn-icon">+</text>
          <text class="child-btn-text">添加{{ child.label }}</text>
        </view>
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <view class="bottom-bar">
      <button class="save-btn" @click="onSave">保存</button>
    </view>

  </view>
</template>

<script>
import SchemaForm from '@/components/SchemaForm.vue'
import { getSchema } from '@/schema/index.js'
import deviceDAO from '@/dao/deviceDAO.js'

export default {
  components: { SchemaForm },

  data() {
    return {
      // 路由参数
      lineId: '',
      deviceType: '',
      deviceId: '',   // 非空表示编辑模式
      parentId: '',    // 子设备的父设备 ID

      // 链表 & 排序
      prevId: '',
      sortOrder: 1,

      // 定位
      longitude: '',
      latitude: '',
      prevLongitude: '',
      prevLatitude: '',

      // 表单数据
      attributes: {},

      // 当前 schema 定义
      currentSchema: { label: '', fields: [], children: [] }
    }
  },

  computed: {
    /** 子设备入口是否显示：需要主设备已保存（有 ID）且 schema 声明了 children */
    showChildren() {
      return !!(
        this.deviceId &&
        this.currentSchema.children &&
        this.currentSchema.children.length > 0
      )
    }
  },

  onLoad(query) {
    this.lineId = query.lineId || ''
    this.deviceType = query.deviceType || 'pole'
    this.deviceId = query.deviceId || ''
    this.parentId = query.parentId || ''

    // 接收地图页传来的坐标（WGS84），作为预填值
    if (query.lat) this.latitude = query.lat
    if (query.lng) this.longitude = query.lng

    // 根据设备类型获取对应的 schema
    this.currentSchema = getSchema(this.deviceType)

    // 动态设置页面标题
    uni.setNavigationBarTitle({
      title: (this.deviceId ? '编辑' : '新增') + this.currentSchema.label
    })

    if (this.deviceId) {
      this.loadDevice()
    } else {
      this.initNewDevice()
    }
  },

  methods: {
    /* ========== 数据加载 ========== */

    /** 编辑模式：从数据库加载已有设备 */
    async loadDevice() {
      try {
        const device = await deviceDAO.findById(this.deviceId)
        if (!device) {
          uni.showToast({ title: '设备不存在', icon: 'none' })
          return
        }
        this.longitude = device.longitude || ''
        this.latitude = device.latitude || ''
        this.parentId = device.parent_id || ''
        this.prevId = device.prev_id || ''
        this.sortOrder = device.sort_order || 1
        this.attributes = device.attributes
          ? (typeof device.attributes === 'string'
            ? JSON.parse(device.attributes)
            : device.attributes)
          : {}

        // 加载上一个设备的坐标，用于档距计算
        if (this.prevId) {
          try {
            const prevDevice = await deviceDAO.findById(this.prevId)
            if (prevDevice) {
              this.prevLongitude = prevDevice.longitude || ''
              this.prevLatitude = prevDevice.latitude || ''
            }
          } catch (e) {
            console.warn('加载上一设备失败:', e)
          }
        }

        // 将坐标同步到表单属性并计算档距
        this.syncCoordsToAttributes()
        this.calcSpanLength()
      } catch (e) {
        console.error('加载设备失败:', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },

    /**
     * 新建模式：
     * 1. 查询同类型同父级下的最后一条记录，确定 prevId 和 sortOrder
     * 2. 初始化空 attributes 并填入 schema 中定义的默认值
     */
    async initNewDevice() {
      try {
        const lastDevice = await deviceDAO.findLastDevice(
          this.lineId,
          this.deviceType,
          this.parentId
        )
        if (lastDevice) {
          this.prevId = lastDevice.id
          this.sortOrder = (lastDevice.sort_order || 0) + 1
          this.prevLongitude = lastDevice.longitude || ''
          this.prevLatitude = lastDevice.latitude || ''
        } else {
          this.prevId = ''
          this.sortOrder = 1
        }

        this.attributes = {}

        this.$nextTick(() => {
          if (this.$refs.formRef) {
            this.$refs.formRef.initDefaults()
          }
          // 等 initDefaults 的 emit 生效后再同步坐标
          this.$nextTick(() => {
            this.syncCoordsToAttributes()
            this.calcSpanLength()
          })
        })
      } catch (e) {
        console.error('初始化新设备失败:', e)
      }
    },

    /* ========== 定位 ========== */

    getLocation() {
      uni.getLocation({
        type: 'wgs84',
        success: (res) => {
          this.longitude = res.longitude.toFixed(6)
          this.latitude = res.latitude.toFixed(6)
          this.syncCoordsToAttributes()
          this.calcSpanLength()
          uni.showToast({ title: '定位成功', icon: 'success' })
        },
        fail: (err) => {
          console.error('定位失败:', err)
          uni.showToast({ title: '定位失败，请检查权限', icon: 'none' })
        }
      })
    },

    /** 将经纬度同步到表单 attributes（供 schema 中 auto-calc 字段显示） */
    syncCoordsToAttributes() {
      this.attributes = {
        ...this.attributes,
        longitude: this.longitude,
        latitude: this.latitude
      }
    },

    /** 计算档距：当前设备与上一设备之间的直线距离（米） */
    calcSpanLength() {
      if (!this.longitude || !this.latitude || !this.prevLongitude || !this.prevLatitude) {
        return
      }
      const dist = this.haversineDistance(
        parseFloat(this.prevLatitude),
        parseFloat(this.prevLongitude),
        parseFloat(this.latitude),
        parseFloat(this.longitude)
      )
      this.attributes = {
        ...this.attributes,
        span_length: dist.toFixed(2)
      }
    },

    /**
     * Haversine 公式计算两点间球面距离（米）
     */
    haversineDistance(lat1, lon1, lat2, lon2) {
      const R = 6371000
      const toRad = (deg) => deg * Math.PI / 180
      const dLat = toRad(lat2 - lat1)
      const dLon = toRad(lon2 - lon1)
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    },

    /* ========== 保存 ========== */

    async onSave() {
      // 1. 表单校验
      const errors = this.$refs.formRef.validate()
      if (errors.length > 0) {
        uni.showToast({ title: errors[0], icon: 'none' })
        return
      }

      // 2. 从 schema.nameField 提取设备名称，用于列表展示
      const nameField = this.currentSchema.nameField
      const name = (nameField && this.attributes[nameField])
        ? String(this.attributes[nameField])
        : this.currentSchema.label

      // 3. 组装设备数据
      const deviceData = {
        line_id: this.lineId,
        device_type: this.deviceType,
        parent_id: this.parentId,
        prev_id: this.prevId,
        name: name,
        longitude: this.longitude,
        latitude: this.latitude,
        sort_order: this.sortOrder,
        attributes: JSON.stringify(this.attributes)
      }

      // 4. 写入数据库
      try {
        if (this.deviceId) {
          await deviceDAO.update(this.deviceId, deviceData)
        } else {
          const newId = await deviceDAO.insert(deviceData)
          this.deviceId = newId
          // 保存成功后 showChildren 会自动变为 true（如果 schema 有 children）
        }
        uni.showToast({ title: '保存成功', icon: 'success' })
        // 延迟返回，让用户看到提示
        setTimeout(() => { uni.navigateBack() }, 800)
      } catch (e) {
        console.error('保存失败:', e)
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    },

    /* ========== 子设备跳转 ========== */

    goAddChild(child) {
      const url = `/pages/device/edit?lineId=${this.lineId}&deviceType=${child.deviceType}&parentId=${this.deviceId}`
      uni.navigateTo({ url })
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f6f7;
  padding: 20rpx;
  padding-bottom: 140rpx;
  padding-top: calc(var(--status-bar-height) + 10rpx);
}

/* ---- 卡片 ---- */
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.card-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

/* ---- 子设备入口 ---- */
.children-btns {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 20rpx;
}

.child-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 32rpx;
  border: 1rpx dashed #2979ff;
  border-radius: 12rpx;
  background: #f0f7ff;
}

.child-btn-icon {
  font-size: 36rpx;
  color: #2979ff;
  margin-right: 8rpx;
  font-weight: bold;
}

.child-btn-text {
  font-size: 28rpx;
  color: #2979ff;
}

/* ---- 底部保存栏 ---- */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.save-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: #2979ff;
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 12rpx;
  border: none;
  padding: 0;
  margin: 0;
}

.save-btn::after {
  border: none;
}
</style>