<template>
  <view class="page">

    <!-- 上级节点选择卡片 -->
    <view v-if="showPreNodeSelect" class="card">
      <view class="card-header">
        <text class="card-title">{{ currentSchema.preNodeFieldName || '上级节点' }}</text>
      </view>
      <view class="form-item">
        <view class="pre-node-picker">
          <view class="picker-content" @click="goToPreNodeSelect">
            <view v-if="prevId" class="pre-node-info">
              <view class="icon-box" :style="{ backgroundColor: themeColor }">
                <image class="device-icon" :src="getPreNodeIcon()" mode="aspectFit"></image>
              </view>
              <view class="pre-node-content">
                <text class="pre-node-type">{{ getPreNodeDeviceLabel() }}</text>
                <text class="pre-node-name">{{ preNodeDisplay }}</text>
              </view>
            </view>
            <text v-else class="picker-placeholder">
              {{ '请选择' + (currentSchema.preNodeFieldName || '上级节点') }}
            </text>
          </view>
          <view class="picker-actions">
            <view v-if="prevId" class="clear-btn" @click.stop="clearPreNode">
              <text class="clear-icon">×</text>
            </view>
            <text class="picker-arrow">›</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 属性表单卡片 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">{{ currentSchema.label }}</text>
        <view v-if="showCopyFromParent" class="copy-btn" @click="handleCopyFromParent">
          <text class="copy-btn-text">复制上级节点信息</text>
        </view>
      </view>
      <schema-form ref="formRef" :schema="currentSchema" v-model="attributes" :lineName="lineName"
        :parentName="parentName" :photos="photos" @take-photo="onTakePhoto" @preview-photo="onPreviewPhoto"
        @delete-photo="onDeletePhoto" />
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
  <!-- 水印画布 -->
  <canvas canvas-id="watermarkCanvas"
    :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px', position: 'fixed', left: '-9999px' }"></canvas>
</template>

<script>
import SchemaForm from '@/components/SchemaForm.vue'
import { getSchema } from '@/schema/index.js'
import deviceDAO from '@/dao/deviceDAO.js'
import { haversineDistance } from '@/utils/common';
import { themeColor } from '@/static/themeColor.js'
import { getPinSvgUri } from '@/static/device_svgs.js';
import { TIANDITU_KEY } from '@/utils/getKey.js';

export default {
  components: { SchemaForm },

  WATERMARK_CACHE_TTL: 60000,      // 60s
  WATERMARK_WAIT_TIMEOUT: 800,     // 拍照时最长等待

  data() {
    return {
      watermarkInfo: null,        // { lat, lon, address, fetchedAt }
      watermarkInfoPromise: null, // 正在进行中的预取 Promise（防重复）
      canvasWidth: 0,
      canvasHeight: 0,
      TIANDITU_KEY,
      // 路由参数
      lineId: '',
      lineName: '',
      deviceType: '',
      deviceId: '',
      parentId: '',

      // 上级节点缓存（用于复制判断）
      prevDeviceType: '',
      prevDeviceAttributes: null,

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
      preNodeDisplay: '',
      themeColor,

      // 照片数据，结构：{ slotKey: filePath }
      photos: {}

    }
  },

  computed: {
    /** 子设备入口是否显示：需要主设备已保存（有 ID）且 schema 声明了 children */
    showChildren() {
      return !!(
        this.currentSchema.children &&
        this.currentSchema.children.length > 0
      )
    },
    /** 上级节点选择是否显示：当前设备类型允许编辑上级节点 */
    showPreNodeSelect() {
      return this.currentSchema.isPreNodeEditable === true
    },

    showCopyFromParent() {
      return !!(
        this.prevId &&
        this.prevDeviceType &&
        this.prevDeviceType === this.deviceType
      )
    },
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
    this.prefetchWatermarkInfo();
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

        const attrs = device.attributes
          ? (typeof device.attributes === 'string'
            ? JSON.parse(device.attributes)
            : device.attributes)
          : {}

        // 从 attributes 中提取照片数据和自定义槽位，不污染表单字段
        if (attrs._photos) {
          this.photos = attrs._photos
          delete attrs._photos
        } else {
          this.photos = {}
        }

        const extraSlots = attrs._extraPhotoSlots || []
        delete attrs._extraPhotoSlots

        this.attributes = attrs

        // 恢复自定义槽位到 SchemaForm
        this.$nextTick(() => {
          if (this.$refs.formRef && extraSlots.length > 0) {
            this.$refs.formRef.extraPhotoSlots = extraSlots
          }
        })

        // 加载上一个设备的坐标，用于档距计算
        if (this.prevId) {
          try {
            const prevDevice = await deviceDAO.findById(this.prevId)
            if (prevDevice) {
              this.prevLongitude = prevDevice.longitude || ''
              this.prevLatitude = prevDevice.latitude || ''
              this.prevDeviceType = prevDevice.device_type || ''
            }
          } catch (e) {
            console.warn('加载上一设备失败:', e)
          }
        }

        // 加载上级节点显示名称
        await this.loadPreNodeDisplay()

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
     * 1. 查询最后一条新建记录，确定 prevId 和 sortOrder
     * 2. 初始化空 attributes 并填入 schema 中定义的默认值
     */
    async initNewDevice() {
      try {
        const lastDevice = await deviceDAO.findLastAvailablePreNode(
          this.lineId
        )
        if (lastDevice) {
          this.prevId = lastDevice.id
          this.prevDeviceType = lastDevice.device_type || ''
          this.sortOrder = (lastDevice.sort_order || 0) + 1
          this.prevLongitude = lastDevice.longitude || ''
          this.prevLatitude = lastDevice.latitude || ''
          // 仅在没有从路由接收 parentName 时，才用上一条记录的名字
          if (lastDevice.name && !this.parentName) {
            this.parentName = lastDevice.name
          }
        } else {
          this.prevId = ''
          this.prevDeviceType = ''
          this.sortOrder = 1
        }

        this.attributes = {}
        this.photos = {}  // 重置照片

        // 加载上级节点显示名称
        await this.loadPreNodeDisplay()

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
     * 杆塔命名规则：
     *   - 如果父节点名字最后一个字是"杆"，取"杆"字前的数字（忽略空格）+1
     *   - 如果最后一个字不是"杆"，直接填入父节点名字
     */
    generateDeviceName() {
      const nameField = this.currentSchema.nameField
      if (!nameField) return
      if (!this.lineName) return

      let suffix = ''

      // 根据设备类型应用不同的命名规则
      switch (this.deviceType) {
        case 'pole':
          if (this.parentName) {
            const sourceName = String(this.parentName).trim()

            // 规则1：末尾有"杆"字 → 提取杆前的数字 +1，保留"杆"
            const matchWithPole = sourceName.match(/^(.*?)(\d+)\s*杆$/)
            // 规则2：末尾无"杆"但以数字结尾 → 提取末尾数字 +1
            const matchWithNum = sourceName.match(/^(.*?)(\d+)$/)

            if (matchWithPole) {
              const prefix = matchWithPole[1]
              const numStr = matchWithPole[2]
              const nextNum = parseInt(numStr, 10) + 1
              const nextStr = String(nextNum).padStart(numStr.length, '0')
              suffix = `${prefix}${nextStr}杆`
            } else if (matchWithNum) {
              const prefix = matchWithNum[1]
              const numStr = matchWithNum[2]
              const nextNum = parseInt(numStr, 10) + 1
              const nextStr = String(nextNum).padStart(numStr.length, '0')
              suffix = `${prefix}${nextStr}`
            } else {
              // 两种规则都不匹配，直接沿用父节点名称
              suffix = sourceName
            }
          } else {
            suffix = this.lineName
          }

          const finalName = suffix.startsWith(this.lineName)
            ? suffix
            : `${this.lineName}${suffix}`

          this.attributes = {
            ...this.attributes,
            [nameField]: finalName
          }
          break
        case 'cable_turning_point':
          // 电缆拐点的命名规则
          suffix = ``
          this.attributes = {
            ...this.attributes,
            [nameField]: this.lineName + '' + suffix
          }
          break

        case 'transformer':
          // 变压器的命名规则
          suffix = ``
          this.attributes = {
            ...this.attributes,
            [nameField]: this.lineName + '' + suffix
          }
          break

        case 'substation':
          // 变电站的命名规则
          suffix = ``
          this.attributes = {
            ...this.attributes,
            [nameField]: this.lineName + '' + suffix
          }
          break

        case 'meter':
          // 计量信息的命名规则，不命名，只用电表资产号
          this.attributes = {
            ...this.attributes,
            [nameField]: ''
          }
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

    /* ========== 照片处理 ========== */

    /** 拍照（未拍照点击 / 重新拍照） */
    async onTakePhoto({ key, label }) {
      try {
        // 1. 调用相机
        const chooseRes = await new Promise((resolve, reject) => {
          uni.chooseImage({
            count: 1,
            sourceType: ['camera'],
            success: resolve,
            fail: reject
          })
        })
        const tempFilePath = chooseRes.tempFilePaths[0]

        // 2. 获取位置信息（优先用缓存）和当前时间
        const [locationInfo, dateTime] = await Promise.all([
          this.getWatermarkInfoForShot(),
          this.getCurrentDateTime()
        ])

        // 3. 给图片添加水印
        const watermarkedPath = await this.addWatermark(tempFilePath, locationInfo, dateTime)

        // 4. 保存到持久化存储
        const saveRes = await new Promise((resolve, reject) => {
          uni.saveFile({
            tempFilePath: watermarkedPath,
            success: resolve,
            fail: reject
          })
        })

        const savedPath = saveRes.savedFilePath

        // 5. 如果是重新拍照，先删除旧文件
        const oldPath = this.photos[key]
        if (oldPath) {
          this.tryRemoveFile(oldPath)
        }

        // 6. 更新照片数据
        this.photos = { ...this.photos, [key]: savedPath }

        uni.showToast({ title: '拍照成功', icon: 'success' })
      } catch (e) {
        // 用户取消拍照，不提示
        if (e && e.errMsg && e.errMsg.indexOf('cancel') > -1) return
        console.error('拍照或添加水印失败:', e)
        // uni.showToast({ title: '拍照失败', icon: 'none' })
      }
    },

    /** 给图片添加水印核心方法（带防闪退缩放与延时绘制） */
    async addWatermark(imagePath, locationInfo, dateTime) {
      return new Promise((resolve, reject) => {
        uni.getImageInfo({
          src: imagePath,
          success: (image) => {
            // 1. 计算缩放比例，防止图片过大导致 Canvas 崩溃变白
            const MAX_SIZE = 1280; // 设定最大边长
            let targetWidth = image.width;
            let targetHeight = image.height;

            if (targetWidth > MAX_SIZE || targetHeight > MAX_SIZE) {
              if (targetWidth > targetHeight) {
                targetHeight = Math.round((targetHeight * MAX_SIZE) / targetWidth);
                targetWidth = MAX_SIZE;
              } else {
                targetWidth = Math.round((targetWidth * MAX_SIZE) / targetHeight);
                targetHeight = MAX_SIZE;
              }
            }

            // 2. 更新 Canvas 尺寸
            this.canvasWidth = targetWidth;
            this.canvasHeight = targetHeight;

            // 3. 必须给原生 Canvas 组件一点时间来响应尺寸变化
            setTimeout(() => {
              const ctx = uni.createCanvasContext('watermarkCanvas', this);

              // 绘制原图（使用缩放后的尺寸）
              ctx.drawImage(imagePath, 0, 0, targetWidth, targetHeight);

              // 4. 设置水印样式
              // 根据缩放后的宽度自适应字体大小，保证水印清晰且比例协调
              const fontSize = Math.max(targetWidth / 30, 14);
              const padding = fontSize;
              ctx.setFontSize(fontSize);
              ctx.setFillStyle('white');
              ctx.setTextBaseline('bottom');

              // 添加黑色阴影，保证在白色背景（如天空、白墙）下依然清晰可见
              ctx.setShadow(2, 2, 4, 'rgba(0, 0, 0, 0.8)');

              // 准备水印文本
              const textLine1 = `时间：${dateTime}`;
              const textLine2 = `经纬度：${locationInfo.lon}, ${locationInfo.lat}`;
              const textLine3 = `地点：${locationInfo.address}`;

              // 绘制文本 (从左下角往上排)
              ctx.fillText(textLine3, padding, targetHeight - padding);
              ctx.fillText(textLine2, padding, targetHeight - padding - fontSize * 1.5);
              ctx.fillText(textLine1, padding, targetHeight - padding - fontSize * 3);

              // 5. 渲染并导出
              ctx.draw(false, () => {
                // 绘制完成后稍微延时，确保底层渲染完毕，避免导出白图
                setTimeout(() => {
                  uni.canvasToTempFilePath({
                    canvasId: 'watermarkCanvas',
                    destWidth: targetWidth,
                    destHeight: targetHeight,
                    success: (res) => {
                      resolve(res.tempFilePath);
                    },
                    fail: (err) => {
                      console.error('导出水印图片失败', err);
                      reject(err);
                    }
                  }, this);
                }, 30); // 30ms 延时
              });
            }, 100); // 100ms 等待 Canvas 尺寸更新
          },
          fail: (err) => {
            console.error('获取图片信息失败', err);
            reject(err);
          }
        });
      });
    },

    /** 获取位置及逆地理编码 */
    getLocationAndAddress() {
      return new Promise((resolve) => {
        const defaultLoc = { lat: '未知', lon: '未知', address: '地址解析失败' }

        uni.getLocation({
          type: 'wgs84',
          success: (res) => {
            const lat = res.latitude
            const lon = res.longitude

            // 调用天地图逆地理编码
            const postStr = encodeURIComponent(JSON.stringify({ lon, lat, ver: 1 }))
            const url = `https://api.tianditu.gov.cn/geocoder?postStr=${postStr}&type=geocode&tk=${this.TIANDITU_KEY}`

            uni.request({
              url: url,
              method: 'GET',
              success: (geoRes) => {
                if (geoRes.data && geoRes.data.result) {
                  resolve({
                    lat: lat.toFixed(6),
                    lon: lon.toFixed(6),
                    address: geoRes.data.result.formatted_address || '未知详细地址'
                  })
                } else {
                  resolve({ lat: lat.toFixed(6), lon: lon.toFixed(6), address: '地址解析失败' })
                }
              },
              fail: () => {
                resolve({ lat: lat.toFixed(6), lon: lon.toFixed(6), address: '网络错误，地址解析失败' })
              }
            })
          },
          fail: (err) => {
            console.warn('获取定位失败:', err)
            resolve(defaultLoc)
          }
        })
      })
    },

    /** 预取定位+逆地理编码并缓存，重复调用会复用进行中的 Promise */
    prefetchWatermarkInfo() {
      if (this.watermarkInfoPromise) {
        return this.watermarkInfoPromise
      }

      const promise = this.getLocationAndAddress().then((info) => {
        this.watermarkInfo = {
          ...info,
          fetchedAt: Date.now()
        }
        this.watermarkInfoPromise = null
        return this.watermarkInfo
      }).catch((e) => {
        this.watermarkInfoPromise = null
        throw e
      })

      this.watermarkInfoPromise = promise
      return promise
    },

    /** 拍照时取水印信息：缓存有效直接用，否则触发预取并限时等待 */
    getWatermarkInfoForShot() {
      const TTL = this.$options.WATERMARK_CACHE_TTL
      const TIMEOUT = this.$options.WATERMARK_WAIT_TIMEOUT
      const info = this.watermarkInfo
      const now = Date.now()

      // 缓存有效，直接返回
      if (info && (now - info.fetchedAt) < TTL) {
        return Promise.resolve(info)
      }

      // 缓存过期或不存在 → 触发预取（已在进行则复用）
      const pending = this.watermarkInfoPromise || this.prefetchWatermarkInfo()

      // 限时等待，超时用降级值
      return new Promise((resolve) => {
        let done = false
        const timer = setTimeout(() => {
          if (done) return
          done = true
          resolve(info || { lat: '未知', lon: '未知', address: '地址解析失败' })
        }, TIMEOUT)

        pending.then((res) => {
          if (done) return
          done = true
          clearTimeout(timer)
          resolve(res)
        }).catch(() => {
          if (done) return
          done = true
          clearTimeout(timer)
          resolve(info || { lat: '未知', lon: '未知', address: '地址解析失败' })
        })
      })
    },

    /** 获取当前格式化时间 */
    getCurrentDateTime() {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },

    /** 查看照片 */
    onPreviewPhoto({ key, filePath }) {
      uni.previewImage({
        urls: [filePath],
        current: filePath
      })
    },

    /** 删除照片 */
    onDeletePhoto({ key }) {
      const filePath = this.photos[key]
      if (filePath) {
        this.tryRemoveFile(filePath)
      }

      const newPhotos = { ...this.photos }
      delete newPhotos[key]
      this.photos = newPhotos

      uni.showToast({ title: '已删除', icon: 'success' })
    },

    /**
     * 安全删除已保存文件（忽略"路径不存在"等错误）
     */
    tryRemoveFile(filePath) {
      if (!filePath) return
      uni.removeSavedFile({
        filePath,
        fail: (e) => {
          // 路径不存在、已删除等情况，静默忽略
          console.warn('删除文件忽略:', e.errMsg || e)
        }
      })
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
      this.attributes = {
        ...this.attributes,
        [this.currentSchema.subTypeField]: this.subType
      }

      // 自动拼接名称 = 父设备名 + 子类型名
      if (this.parentName && this.currentSchema.nameField) {
        this.attributes = {
          ...this.attributes,
          [this.currentSchema.nameField]: this.parentName + this.subType
        }
      }
    },

    /** 跳转到上级节点选择页面 */
    goToPreNodeSelect() {
      uni.navigateTo({
        url: `/pages/device/preNode?lineId=${this.lineId}&lineName=${encodeURIComponent(this.lineName)}&deviceId=${this.deviceId}&isPreNodeSelect=true`,
        events: {
          selectPreNode: (data) => {
            this.handlePreNodeSelected(data)
          }
        }
      })
    },

    /** 处理从 preNode.vue 返回的上级节点选择结果 */
    async handlePreNodeSelected(data) {
      if (!data) return

      this.prevId = data.id
      this.preNodeDisplay = data.name || ''
      this.prevDeviceType = data.device_type || ''
      this.parentName = data.name || ''

      // 如果选择了上级节点，加载其坐标用于档距计算
      if (data.id) {
        try {
          const prevDevice = await deviceDAO.findById(data.id)
          if (prevDevice) {
            this.prevLongitude = prevDevice.longitude || ''
            this.prevLatitude = prevDevice.latitude || ''
            // 缓存上级节点类型和属性
            this.prevDeviceType = prevDevice.device_type || ''
            this.prevDeviceType = prevDevice.device_type || ''
            const attrs = prevDevice.attributes
              ? (typeof prevDevice.attributes === 'string'
                ? JSON.parse(prevDevice.attributes)
                : prevDevice.attributes)
              : {}
            this.prevDeviceAttributes = attrs
            this.calcSpanLength()
          }
        } catch (e) {
          console.warn('加载上级设备坐标失败:', e)
        }
      } else {
        this.prevLongitude = ''
        this.prevLatitude = ''
        this.prevDeviceType = ''
        this.prevDeviceType = ''
        this.prevDeviceAttributes = null
        this.calcSpanLength()
      }

      // 如果是上级节点为同类型，重新生成名字
      if (this.prevDeviceType === this.currentSchema.deviceType) {
        this.generateDeviceName()
      }
    },

    /** 清除上级节点 */
    clearPreNode() {
      this.prevId = ''
      this.preNodeDisplay = ''
      this.prevDeviceType = ''
      this.parentName = ''
      this.prevLongitude = ''
      this.prevLatitude = ''
      this.prevDeviceAttributes = null
      this.calcSpanLength()
    },

    /** 获取上级节点图标 */
    getPreNodeIcon() {
      return getPinSvgUri(this.prevDeviceType)
    },

    /** 获取上级节点设备类型标签 */
    getPreNodeDeviceLabel() {
      const schema = getSchema(this.prevDeviceType)
      return schema ? schema.label : this.prevDeviceType
    },

    /** 加载上级节点显示名称 */
    async loadPreNodeDisplay() {
      if (!this.prevId) {
        this.preNodeDisplay = ''
        this.prevDeviceType = ''
        this.prevDeviceType = ''
        this.prevDeviceAttributes = null
        return
      }
      try {
        const device = await deviceDAO.findById(this.prevId)
        if (device) {
          this.preNodeDisplay = device.name || '未命名'
          this.prevDeviceType = device.device_type || ''
          if (!this.parentName) {
            this.parentName = device.name || ''
          }
          this.prevDeviceType = device.device_type || ''
          const attrs = device.attributes
            ? (typeof device.attributes === 'string'
              ? JSON.parse(device.attributes)
              : device.attributes)
            : {}
          this.prevDeviceAttributes = attrs
        }
      } catch (e) {
        console.error('加载上级节点名称失败:', e)
      }
    },

    /** 从上级节点复制 isCopyable 字段值 */
    async handleCopyFromParent() {
      const copyableKeys = (this.currentSchema.fields || [])
        .filter(f => f.isCopyable)
        .map(f => f.key)

      if (copyableKeys.length === 0) {
        uni.showToast({ title: '没有可复制的字段', icon: 'none' })
        return
      }

      // 优先用缓存，缓存失效则重新加载
      let parentAttrs = this.prevDeviceAttributes
      if (!parentAttrs) {
        try {
          const prevDevice = await deviceDAO.findById(this.prevId)
          if (!prevDevice) {
            uni.showToast({ title: '上级节点不存在', icon: 'none' })
            return
          }
          parentAttrs = prevDevice.attributes
            ? (typeof prevDevice.attributes === 'string'
              ? JSON.parse(prevDevice.attributes)
              : prevDevice.attributes)
            : {}
          this.prevDeviceAttributes = parentAttrs
        } catch (e) {
          uni.showToast({ title: '加载上级节点失败', icon: 'none' })
          return
        }
      }

      const newAttrs = { ...this.attributes }

      copyableKeys.forEach(key => {
        const val = parentAttrs[key]
        // 数组字段深拷贝，其余直接赋值（undefined 则写入空字符串）
        if (Array.isArray(val)) {
          newAttrs[key] = [...val]
        } else {
          newAttrs[key] = val !== undefined ? val : ''
        }
      })

      this.attributes = newAttrs
      uni.showToast({ title: `复制成功`, icon: 'success' })
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
      const dist = haversineDistance(
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

    /* ========== 保存 ========== */

    async onSave(options = {}) {
      const { stayAfterSave = false, successText = '保存成功' } = options

      // 1. 表单校验
      const errors = this.$refs.formRef.validate()
      if (errors.length > 0) {
        uni.showToast({ title: errors[0], icon: 'none' })
        return false
      }

      // 2. 从 schema.nameField 提取设备名称
      const nameField = this.currentSchema.nameField
      const name = (nameField && this.attributes[nameField])
        ? String(this.attributes[nameField])
        : this.currentSchema.label

      // 3. 组装 attributes，注入照片数据和自定义槽位
      const attrsToSave = { ...this.attributes }

      if (Object.keys(this.photos).length > 0) {
        attrsToSave._photos = this.photos
      }

      const extraSlots = this.$refs.formRef ? this.$refs.formRef.extraPhotoSlots : []
      if (extraSlots.length > 0) {
        attrsToSave._extraPhotoSlots = extraSlots
      }

      // 4. 组装设备数据
      const deviceData = {
        line_id: this.lineId,
        device_type: this.deviceType,
        parent_id: this.parentId,
        prev_id: this.prevId,
        name: name,
        longitude: this.longitude,
        latitude: this.latitude,
        sort_order: this.sortOrder,
        attributes: JSON.stringify(attrsToSave)
      }

      // 5. 写入数据库
      try {
        if (this.deviceId) {
          await deviceDAO.update(this.deviceId, deviceData)
          // uni.showToast({ title: successText, icon: 'none' })
          if (!stayAfterSave) {
            setTimeout(() => { uni.navigateBack() }, 500)
          }
          return true
        } else {
          const newId = await deviceDAO.insert(deviceData)
          this.deviceId = newId
          uni.showToast({ title: successText, icon: 'none' })

          if (this.currentSchema.children?.length > 0) {
            uni.setNavigationBarTitle({
              title: '编辑' + this.currentSchema.label
            })
            await this.loadChildDevices()
          }

          if (!stayAfterSave) {
            setTimeout(() => { uni.navigateBack() }, 500)
          }
          return true
        }
      } catch (e) {
        console.error('保存失败:', e)
        uni.showToast({ title: '保存失败', icon: 'none' })
        return false
      }
    },

    /* ========== 子设备跳转 ========== */

    /** 添加子设备 —— 跳转到同一个 edit 页面 */
    async goAddChild(childType) {
      // 无父节点ID时：先调用 onSave（含校验），失败则不允许添加子节点
      if (!this.deviceId) {
        const ok = await this.onSave({
          stayAfterSave: true,
          successText: '父节点已自动保存'
        })
        if (!ok) return
      }

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

    /** 长按删除子设备 */
    confirmDeleteChild(item, label) {
      uni.showModal({
        title: '删除确认',
        content: `确定删除「${item.name || label}」吗？此操作不可恢复。`,
        confirmText: '取消',
        cancelText: '确定',
        confirmColor: '#999999',
        cancelColor: '#e64340',
        success: async (res) => {
          if (res.cancel) {
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

/* ---- 复制上级节点按钮 ---- */
.copy-btn {
  padding: 8rpx 20rpx;
  background: #eef3ff;
  border-radius: 8rpx;
  border: 1rpx solid #2979ff;
}

.copy-btn-text {
  font-size: 24rpx;
  color: #2979ff;
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
  z-index: 10;
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

.pre-node-picker {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: 72rpx;
  border: 1rpx solid #dcdfe6;
  border-radius: 8rpx;
  padding: 16rpx 20rpx;
  background: #fff;
  flex-wrap: wrap;
}

.picker-content {
  flex: 1;
  min-width: 0;
}

.picker-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.clear-btn {
  margin-right: 12rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.clear-btn:active {
  background: #e0e0e0;
}

.clear-icon {
  font-size: 24rpx;
  color: #999;
  font-weight: bold;
}

.pre-node-info {
  display: flex;
  align-items: center;
  flex: 1;
  margin-right: 16rpx;
}

.icon-box {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.device-icon {
  width: 30rpx;
  height: 30rpx;
}

.pre-node-content {
  flex: 1;
  min-width: 0;
}

.pre-node-type {
  font-size: 24rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 4rpx;
  display: block;
}

.pre-node-name {
  font-size: 22rpx;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-text {
  font-size: 28rpx;
  color: #333;
}

.picker-placeholder {
  font-size: 28rpx;
  color: #c0c4cc;
  flex: 1;
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
  flex-shrink: 0;
}
</style>