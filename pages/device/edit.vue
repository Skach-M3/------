<template>
  <view class="page">

    <!-- 上级节点选择卡片 -->
    <view v-if="showPreNodeSelect" class="card">
      <view class="card-header">
        <text class="card-title">{{ currentSchema.preNodeFieldName || '上级节点' }}</text>
      </view>
      <view class="form-item">
        <picker :range="preNodeOptions" range-key="label" :value="preNodeIndex" @change="onPreNodeChange"
          :disabled="!hasAvailablePreNodes">
          <view class="picker-box" :class="{ 'picker-disabled': !hasAvailablePreNodes }">
            <text :class="prevId ? 'picker-text' : 'picker-placeholder'">
              {{ hasAvailablePreNodes ? (preNodeDisplay || ('请选择' + (currentSchema.preNodeFieldName || '上级节点'))) :
                '无可选上级节点' }}
            </text>
            <text class="picker-arrow" v-if="hasAvailablePreNodes">›</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- 属性表单卡片 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">{{ currentSchema.label }}信息</text>
      </view>
      <schema-form ref="formRef" :schema="currentSchema" v-model="attributes" :lineName="lineName"
        :parentName="parentName" />
    </view>

    <!-- 子设备入口（主设备已保存 且 schema 定义了 children 时显示） -->
    <view v-if="showChildren" class="card">
      <view class="card-header">
        <text class="card-title">关联设备</text>
      </view>

      <!-- 按子设备类型分组 -->
      <view v-for="child in currentSchema.children" :key="child.deviceType" class="child-group">
        <!-- 子设备类型标题 + 添加按钮 -->
        <view class="child-group-header">
          <text class="child-group-title">{{ child.label }}</text>
          <view class="child-add-link" @click="goAddChild(child.deviceType)">
            <text class="child-add-icon">+</text>
            <text class="child-add-text">添加</text>
          </view>
        </view>

        <!-- 该类型下已有的子设备列表 -->
        <view v-if="childDevicesMap[child.deviceType] && childDevicesMap[child.deviceType].length > 0">
          <view v-for="item in childDevicesMap[child.deviceType]" :key="item.id" class="child-item"
            @click="goEditChild(item)" @longpress="confirmDeleteChild(item, child.label)">
            <view class="child-item-info">
              <text class="child-item-name">{{ item.name || '未命名' }}</text>
              <text class="child-item-desc">点击编辑 · 长按删除</text>
            </view>
            <text class="child-item-arrow">›</text>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-else class="child-empty">
          <text class="child-empty-text">暂无{{ child.label }}，点击上方添加</text>
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
      lineName: '',
      deviceType: '',
      deviceId: '',
      parentId: '',

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
      currentSchema: { label: '', fields: [], children: [] },

      // 子设备列表，按 deviceType 分组
      childDevicesMap: {},
      subType: '',
      parentName: '',

      // 上级节点选择
      preNodeOptions: [],
      preNodeIndex: 0,
      preNodeDisplay: ''

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
    },
    /** 上级节点选择是否显示：当前设备类型允许编辑上级节点 */
    showPreNodeSelect() {
      return this.currentSchema.isPreNodeEditable === true
    },
    /** 是否有可选上级节点：排除"无上级节点"空选项后还有其他选项 */
    hasAvailablePreNodes() {
      return this.preNodeOptions.length > 1
    }
  },

  onLoad(query) {
    this.lineId = query.lineId || ''
    this.lineName = query.lineName ? decodeURIComponent(query.lineName) : ''
    this.deviceType = query.deviceType || 'pole'
    this.deviceId = query.deviceId || ''
    this.parentId = query.parentId || ''
    // 接收子类型和父设备名称
    this.subType = query.subType ? decodeURIComponent(query.subType) : ''
    this.parentName = query.parentName ? decodeURIComponent(query.parentName) : ''
    console.log('deviceType:', this.deviceType, 'schema:', getSchema(this.deviceType))

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

  // ★ 新增：每次页面显示时刷新子设备列表（从子设备编辑页返回时触发）
  onShow() {
    if (this.deviceId && this.currentSchema.children?.length > 0) {
      this.loadChildDevices()
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

        // 加载上级节点选项
        await this.loadPreNodeOptions()

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
          if (lastDevice.name) {
            this.parentName = lastDevice.name
          }
        } else {
          this.prevId = ''
          this.sortOrder = 1
        }

        this.attributes = {}

        // 加载上级节点选项
        await this.loadPreNodeOptions()

        this.$nextTick(() => {
          if (this.$refs.formRef) {
            this.$refs.formRef.initDefaults()
          }
          // 等 initDefaults 的 emit 生效后再同步坐标
          this.$nextTick(() => {
            // ★ 在默认值初始化之后，再覆盖写入子类型相关字段
            this.applySubTypeDefaults()
            // 自动生成设备名称
            this.generateDeviceName()
            this.syncCoordsToAttributes()
            this.calcSpanLength()
          })
        })
      } catch (e) {
        console.error('初始化新设备失败:', e)
      }
    },

    /**
     * 自动生成设备名称
     * 格式：线路名#用户自定义(杆塔)
     * 用户自定义部分：自动填入上级节点名称，最后一位+1
     */
    generateDeviceName() {
      const nameField = this.currentSchema.nameField
      if (!nameField) return
      if (!this.lineName) return

      let suffix = ''

      // 根据设备类型应用不同的命名规则
      switch (this.deviceType) {
        case 'pole':
          // 杆塔的命名规则
          if (this.parentName) {
            // 如果上级节点名称包含"#"，提取第一个"#"后面的全部内容
            const hashIndex = this.parentName.indexOf('#')
            if (hashIndex !== -1) {
              suffix = this.parentName.substring(hashIndex + 1)
            } else {
              suffix = this.parentName
            }
            const match = suffix.match(/(\d+)$/)
            if (match) {
              const numStr = match[1]
              const nextNum = parseInt(numStr, 10) + 1
              // 保持原有位数，如 "004" → "005"，"009" → "010"
              const nextStr = String(nextNum).padStart(numStr.length, '0')
              suffix = suffix.slice(0, -numStr.length) + nextStr
            }
          }
          break

        case 'cable':
          // 电缆拐点的命名规则
          suffix = `C${this.sortOrder}`
          break

        case 'transformer':
          // 变压器的命名规则
          suffix = `T${this.sortOrder}`
          break

        default:
          // 默认规则
          if (this.parentName) {
            const hashIndex = this.parentName.indexOf('#')
            if (hashIndex !== -1) {
              suffix = this.parentName.substring(hashIndex + 1)
            } else {
              suffix = this.parentName
            }
          }
      }

      this.attributes = {
        ...this.attributes,
        [nameField]: this.lineName + '#' + suffix
      }
    },

    incrementTrailingNumber(name) {
      const match = name.match(/(\d+)$/)
      if (match) {
        const numStr = match[1]
        const nextNum = parseInt(numStr, 10) + 1
        const nextStr = String(nextNum).padStart(numStr.length, '0')
        return name.slice(0, -numStr.length) + nextStr
      }
      return name
    },

    /* ========== ★ 子设备加载 ========== */

    /** 按类型分组加载子设备 */
    async loadChildDevices() {
      const children = this.currentSchema.children || []
      const map = {}
      for (const child of children) {
        try {
          const list = await deviceDAO.findByParent(
            this.lineId,
            child.deviceType,
            this.deviceId
          )
          map[child.deviceType] = list
        } catch (e) {
          console.error(`加载子设备[${child.deviceType}]失败:`, e)
          map[child.deviceType] = []
        }
      }
      this.childDevicesMap = map
    },

    // 根据 subType 自动填入分类和名称
    applySubTypeDefaults() {
      if (!this.subType || !this.currentSchema.subTypeField) return

      // 填入分类字段
      this.$set(this.attributes, this.currentSchema.subTypeField, this.subType)

      // 自动拼接名称 = 父设备名 + 子类型名
      if (this.parentName && this.currentSchema.nameField) {
        this.$set(this.attributes, this.currentSchema.nameField, this.parentName + this.subType)
      }
    },

    /** 加载上级节点选项 */
    async loadPreNodeOptions() {
      try {
        const availableNodes = await deviceDAO.findAvailablePreNodes(this.lineId)
        console.log("可选上级节点", availableNodes);


        // 过滤掉当前编辑的设备（编辑模式）
        const filteredNodes = this.deviceId
          ? availableNodes.filter(node => node.id !== this.deviceId)
          : availableNodes

        // 转换为选项格式
        this.preNodeOptions = filteredNodes.map(node => ({
          id: node.id,
          label: node.name || '未命名',
          deviceType: node.device_type
        }))

        // 添加一个空选项
        this.preNodeOptions.unshift({
          id: '',
          label: '无上级节点',
          deviceType: ''
        })

        // 设置当前选中的上级节点
        this.updatePreNodeDisplay()
      } catch (e) {
        console.error('加载上级节点选项失败:', e)
      }
    },

    /** 更新上级节点显示 */
    updatePreNodeDisplay() {
      if (!this.prevId) {
        this.preNodeIndex = 0
        this.preNodeDisplay = ''
        return
      }

      const index = this.preNodeOptions.findIndex(opt => opt.id === this.prevId)
      if (index >= 0) {
        this.preNodeIndex = index
        this.preNodeDisplay = this.preNodeOptions[index].label
        // 同步 parentName，确保 generateDeviceName 用到正确的名称
        this.parentName = this.preNodeOptions[index].label
      } else {
        this.preNodeIndex = 0
        this.preNodeDisplay = ''
      }
    },

    /** 上级节点选择变化处理 */
    onPreNodeChange(e) {
      const index = e.detail.value
      const selected = this.preNodeOptions[index]

      if (selected) {
        this.prevId = selected.id
        this.preNodeDisplay = selected.label
        this.parentName = selected.label || ''

        // 如果选择了上级节点，加载其坐标用于档距计算
        if (selected.id) {
          deviceDAO.findById(selected.id).then(prevDevice => {
            if (prevDevice) {
              this.prevLongitude = prevDevice.longitude || ''
              this.prevLatitude = prevDevice.latitude || ''
              this.calcSpanLength()
            }
          }).catch(e => {
            console.warn('加载上级设备坐标失败:', e)
          })
        } else {
          this.prevLongitude = ''
          this.prevLatitude = ''
          this.calcSpanLength()
        }

        // 重新生成设备名称
        this.generateDeviceName()
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
          uni.showToast({ title: '保存成功', icon: 'success' })
          // setTimeout(() => { uni.navigateBack() }, 800)
        } else {
          const newId = await deviceDAO.insert(deviceData)
          this.deviceId = newId
          uni.showToast({ title: '保存成功', icon: 'success' })

          // ★ 新增判断：如果有子设备类型，保存后留在当前页，加载子设备区域
          if (this.currentSchema.children?.length > 0) {
            // 更新标题为编辑模式
            uni.setNavigationBarTitle({
              title: '编辑' + this.currentSchema.label
            })
            this.loadChildDevices()
            // 不 navigateBack，让用户继续添加子设备
          } else {
            setTimeout(() => { uni.navigateBack() }, 800)
          }
        }
      } catch (e) {
        console.error('保存失败:', e)
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    },

    /* ========== 子设备跳转 ========== */

    /** 添加子设备 —— 跳转到同一个 edit 页面 */
    goAddChild(childType) {
      const childSchema = getSchema(childType)
      const parentName = this.attributes[this.currentSchema.nameField] || ''

      if (childSchema.subTypes && childSchema.subTypes.length > 0) {
        // 有子类型 → 弹出 ActionSheet 让用户选
        const itemList = childSchema.subTypes.map(st => st.label)

        uni.showActionSheet({
          title: '请选择设备类型',
          itemList,
          success: (res) => {
            const subType = childSchema.subTypes[res.tapIndex].value
            uni.navigateTo({
              url: `/pages/device/edit?lineId=${this.lineId}`
                + `&deviceType=${childType}`
                + `&parentId=${this.deviceId}`
                + `&subType=${encodeURIComponent(subType)}`
                + `&parentName=${encodeURIComponent(parentName)}`
            })
          }
        })
      } else {
        // 无子类型 → 直接跳转（兼容其他设备）
        uni.navigateTo({
          url: `/pages/device/edit?lineId=${this.lineId}`
            + `&deviceType=${childType}`
            + `&parentId=${this.deviceId}`
            + `&parentName=${encodeURIComponent(parentName)}`
        })
      }
    },

    /** 编辑已有子设备 */
    goEditChild(item) {
      const url = `/pages/device/edit?lineId=${this.lineId}&deviceType=${item.device_type}&deviceId=${item.id}`
      uni.navigateTo({ url })
    },

    /** ★ 新增：长按删除子设备 */
    confirmDeleteChild(item, label) {
      uni.showModal({
        title: '删除确认',
        content: `确定删除「${item.name || label}」吗？此操作不可恢复。`,
        confirmColor: '#e64340',
        success: async (res) => {
          if (res.confirm) {
            try {
              await deviceDAO.deleteWithChildren(item.id)
              await this.loadChildDevices()
              uni.showToast({ title: '已删除', icon: 'success' })
            } catch (e) {
              console.error('删除子设备失败:', e)
              uni.showToast({ title: '删除失败', icon: 'none' })
            }
          }
        }
      })
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

/* ---- 子设备分组 ---- */
.child-group {
  margin-bottom: 24rpx;
}

.child-group:last-child {
  margin-bottom: 0;
}

.child-group-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.child-group-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #555;
}

.child-add-link {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.child-add-icon {
  font-size: 32rpx;
  color: #2979ff;
  font-weight: bold;
  margin-right: 4rpx;
}

.child-add-text {
  font-size: 26rpx;
  color: #2979ff;
}

/* ---- 子设备列表项 ---- */
.child-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 16rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}

.child-item:active {
  background: #eef1f5;
}

.child-item-info {
  display: flex;
  flex-direction: column;
}

.child-item-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 4rpx;
}

.child-item-desc {
  font-size: 22rpx;
  color: #bbb;
}

.child-item-arrow {
  font-size: 36rpx;
  color: #ccc;
}

/* ---- 空状态 ---- */
.child-empty {
  padding: 24rpx;
  text-align: center;
  background: #fafafa;
  border-radius: 12rpx;
  border: 1rpx dashed #ddd;
}

.child-empty-text {
  font-size: 24rpx;
  color: #bbb;
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

/* ---- 上级节点选择器 ---- */
.form-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.picker-box {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 72rpx;
  border: 1rpx solid #dcdfe6;
  border-radius: 8rpx;
  padding: 0 20rpx;
  background: #fff;
}

.picker-text {
  font-size: 28rpx;
  color: #333;
}

.picker-placeholder {
  font-size: 28rpx;
  color: #c0c4cc;
}

.picker-disabled {
  background: #f5f7fa;
  border-color: #e4e7ed;
}

.picker-disabled .picker-text,
.picker-disabled .picker-placeholder {
  color: #c0c4cc;
}

.picker-arrow {
  font-size: 32rpx;
  color: #c0c4cc;
}
</style>