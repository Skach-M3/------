<template>
  <view class="content">
    <!-- 自定义顶部导航栏 -->
    <view class="custom-nav">
      <view class="nav-left" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="nav-title">线路采集</view>
      <view class="nav-right"></view>
    </view>

    <!-- 地图容器 -->
    <view id="map" class="map-container" :prop="mapConfig" :change:prop="mapModule.updateMapConfig"
      :devicesProp="devicesProp" :change:devicesProp="mapModule.onDevicesChange" :debugMarker="debugMarkerProp"
      :change:debugMarker="mapModule.onDebugMarkerChange" :showNamesProp="showDeviceNames"
      :change:showNamesProp="mapModule.onShowNamesChange"></view>

    <!-- 右侧悬浮工具栏 -->
    <view class="right-tools" v-show="!isMovingDevice">
      <!-- 组1：功能菜单 -->
      <view class="tool-group">
        <view class="tool-item" @click="toast('数据')">
          <text class="icon">📋</text>
          <text class="text">数据</text>
        </view>
        <view class="tool-item" @click="toast('搜索')">
          <text class="icon">🔍</text>
          <text class="text">搜索</text>
        </view>
        <view class="tool-item" @click="toggleDeviceNames">
          <view class="icon-eye-wrap">
            <text class="icon">👁</text>
            <!-- 关闭时叠加一条斜线 -->
            <view v-if="!showDeviceNames" class="eye-slash"></view>
          </view>
          <text class="text">名称</text>
        </view>
      </view>

      <!-- 组2：地图控制 -->
      <view class="tool-group">
        <view class="tool-item" @click="toggleLayer">
          <text class="icon">🗺️</text>
          <text class="text">图层</text>
        </view>
        <view class="tool-item" @click="locateUser">
          <text class="icon">📍</text>
          <text class="text">定位</text>
        </view>
      </view>

      <!-- 组3：缩放控制 -->
      <view class="tool-group">
        <view class="tool-item zoom-btn" @click="zoomIn">
          <text class="icon">+</text>
        </view>
        <view class="tool-item zoom-btn" @click="zoomOut">
          <text class="icon">-</text>
        </view>
      </view>
    </view>

    <!-- 底部中间悬浮加号及展开菜单，当设备面板出现时隐藏 -->
    <view class="bottom-fab-wrapper" v-show="!showDevicePanel && !isMovingDevice">
      <!-- 展开的子按钮 -->
      <view class="fab-menu">
        <view class="fab-sub-item" v-for="(item, index) in fabItems" :key="index" :style="getFabItemStyle(index)"
          @click="handleFabClick(item)">
          <text class="sub-text">{{ item.name }}</text>
        </view>
      </view>

      <!-- 主按钮 -->
      <view class="fab-main" @click="toggleFab">
        <text class="fab-main-icon" :class="{ 'is-open': isFabOpen }">+</text>
      </view>
    </view>

    <!-- 底部设备信息面板 -->
    <view class="device-panel-wrapper" v-if="showDevicePanel && !isMovingDevice">
      <!-- 左上角切换按钮 -->
      <view class="panel-switch-btns">
        <view class="switch-btn" @click="prevDevice">
          <text class="arrow-icon">&lt;</text>
        </view>
        <view class="switch-btn" @click="nextDevice">
          <text class="arrow-icon">&gt;</text>
        </view>
      </view>

      <!-- 白色主面板 -->
      <view class="device-panel">
        <!-- 上半部分：信息区 -->
        <view class="panel-info">
          <view class="info-title">{{ currentDeviceInfo.name || '未知设备' }}</view>
          <view class="info-desc">距离：{{ currentDeviceInfo.distance || '未知' }}</view>
          <view class="info-desc">经纬度：{{ currentDeviceInfo.lng }}, {{ currentDeviceInfo.lat }}</view>
        </view>

        <!-- 下半部分：操作区 -->
        <view class="panel-actions">
          <view class="action-item" @click="handleNavigate">导航</view>
          <view class="action-item" @click="handleDetails">详情</view>
          <view class="action-item no-border" @click="handleMove">移动</view>
        </view>
      </view>
    </view>

    <!-- 移动设备时的底部操作按钮 -->
    <view class="move-actions-wrapper" v-if="isMovingDevice">
      <view class="move-btn cancel-btn" @click="cancelMove">
        <text>取消</text>
      </view>
      <view class="move-btn confirm-btn" @click="confirmMove">
        <text>确定</text>
      </view>
    </view>

    <!-- DEBUG START -->
    <view v-if="DEBUG_ENABLED" style="position:fixed;right:16px;bottom:160px;z-index:9999;">
      <!-- 小虫子按钮 -->
      <view @click="debugPanelOpen = !debugPanelOpen"
        style="width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;">
        <text style="font-size:22px;">🐛</text>
      </view>

      <!-- 展开面板 -->
      <view v-if="debugPanelOpen"
        style="position:absolute;bottom:52px;right:0;width:220px;background:rgba(0,0,0,0.8);border-radius:8px;padding:12px;">
        <text style="color:#0f0;font-size:13px;font-weight:bold;">调试假定位</text>

        <!-- 当前假坐标显示 -->
        <view style="margin-top:8px;">
          <text v-if="debugLocation.lat != null" style="color:#fff;font-size:12px;">
            纬度: {{ debugLocation.lat.toFixed(6) }}
          </text>
          <text v-if="debugLocation.lng != null" style="color:#fff;font-size:12px;margin-top:2px;">
            经度: {{ debugLocation.lng.toFixed(6) }}
          </text>
          <text v-if="debugLocation.lat == null" style="color:#999;font-size:12px;">
            未设置，请点击地图选点
          </text>
        </view>

        <!-- 选点模式开关 -->
        <view @click="debugLocation.picking = !debugLocation.picking"
          style="margin-top:10px;padding:6px 0;border-radius:4px;text-align:center;"
          :style="{ background: debugLocation.picking ? '#ff5722' : '#2979ff' }">
          <text style="color:#fff;font-size:13px;">
            {{ debugLocation.picking ? '🔴 选点中...点地图' : '📍 点图定位' }}
          </text>
        </view>

        <!-- 清除按钮 -->
        <view v-if="debugLocation.lat != null" @click="onClearDebugLocation"
          style="margin-top:8px;padding:6px 0;border-radius:4px;text-align:center;background:#666;">
          <text style="color:#fff;font-size:13px;">🗑️ 清除假坐标</text>
        </view>
      </view>
    </view>
    <!-- DEBUG END -->
  </view>
</template>

<!-- 1. 逻辑层 -->
<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import deviceDAO from '@/dao/deviceDAO.js';
import { getLocation } from '@/utils/get-location.js'
// DEBUG START
import { DEBUG_ENABLED, debugLocation, setDebugLocation, clearDebugLocation } from '@/utils/debug-location.js'
const debugPanelOpen = ref(false)
const debugMarkerProp = ref(null)

function onMapClickDebug(e) {
  if (!debugLocation.picking) return
  setDebugLocation(e.lat, e.lng)
  debugLocation.picking = false
  // 通知 RenderJS 画标记
  debugMarkerProp.value = { lat: e.lat, lng: e.lng, action: 'set', id: Date.now() }
  console.log('[DEBUG] 假定位已设置:', e.lat, e.lng)
}

function onClearDebugLocation() {
  clearDebugLocation()
  // 通知 RenderJS 移除标记
  debugMarkerProp.value = { action: 'clear', id: Date.now() }
}
// DEBUG END

// 用户当前真实位置（独立于 mapConfig.center）
const userLocation = ref({ lat: 0, lng: 0 });

// Haversine 公式计算两点距离，返回格式化字符串
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): string => {
  const R = 6371000; // 地球半径（米）
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  if (distance < 1000) {
    return distance.toFixed(0) + 'm';
  }
  return (distance / 1000).toFixed(2) + 'km';
};

// 设备列表面板
const showDevicePanel = ref(false);
// 当前选中的设备信息
const currentDeviceInfo = ref({
  id: '',
  name: '',
  distance: '',
  lng: '',
  lat: '',
  deviceType: ''
});

// 接收 RenderJS 传来的设备点击事件
const onDeviceClick = (deviceInfo) => {
  // 直接更新数据，如果面板已打开，视图会无缝更新；如果未打开，则显示面板
  currentDeviceInfo.value = deviceInfo;
  showDevicePanel.value = true;
};

const isMovingDevice = ref(false)
// 取消按钮点击事件
const cancelMove = () => {
  // 1. 隐藏底部操作按钮
  isMovingDevice.value = false;
  showDevicePanel.value = false;

  // 2. 其他取消逻辑（例如：恢复设备原来的位置、退出移动模式等）
  console.log('已取消移动');
}

// 确定按钮点击事件
const confirmMove = () => {
  // 1. 隐藏底部操作按钮
  isMovingDevice.value = false;
  showDevicePanel.value = false;

  // 2. 其他确定逻辑（例如：更新保存设备的新位置）
  console.log('已确定移动');
}

// 面板相关的预留操作方法
const prevDevice = () => {
  console.log('点击了上一个设备');
  // TODO: 实现切换上一个设备的逻辑
};

const nextDevice = () => {
  console.log('点击了下一个设备');
  // TODO: 实现切换下一个设备的逻辑
};

const handleNavigate = () => {
  const info = currentDeviceInfo.value;
  const lat = info.lat;
  const lng = info.lng;
  const name = encodeURIComponent(info.name || '目标位置');

  if (!lat || !lng || (lat === '0.000000' && lng === '0.000000')) {
    uni.showToast({ title: '设备坐标无效', icon: 'none' });
    return;
  }

  // #ifdef APP-PLUS
  const platform = uni.getSystemInfoSync().platform;
  let url = '';

  if (platform === 'android') {
    // t=2 表示步行导航，dev=1 表示传入 WGS84 坐标
    url = `androidamap://route/plan/?sourceApplication=lineCollect&dlat=${lat}&dlon=${lng}&dname=${name}&dev=1&t=2`;
  } else {
    url = `iosamap://path?sourceApplication=lineCollect&dlat=${lat}&dlon=${lng}&dname=${name}&dev=1&t=2`;
  }

  plus.runtime.openURL(url, function (err) {
    uni.showModal({
      title: '提示',
      content: '未检测到高德地图，是否前往下载？',
      success: (res) => {
        if (res.confirm) {
          if (platform === 'android') {
            plus.runtime.openURL('https://mobile.amap.com/');
          } else {
            plus.runtime.openURL('https://apps.apple.com/cn/app/id461703208');
          }
        }
      }
    });
  });
  // #endif

  // #ifdef H5
  const webUrl = `https://uri.amap.com/navigation?to=${lng},${lat},${name}&mode=walk&coordinate=wgs84`;
  window.open(webUrl);
  // #endif
};

const handleDetails = () => {
  const info = currentDeviceInfo.value;
  console.log(info);
  const url = `/pages/device/edit?lineId=${lineId.value}&lineName=${encodeURIComponent(lineName.value)}&deviceType=${info.deviceType}&lat=${info.lat}&lng=${info.lng}&deviceId=${info.id}`;

  uni.navigateTo({
    url,
    fail: (err) => {
      console.error('跳转失败:', err);
      uni.showToast({ title: '页面跳转失败', icon: 'none' });
    }
  });
};

const handleMove = () => {
  console.log('点击了移动', currentDeviceInfo.value);
  isMovingDevice.value = true;
};

interface MapConfig {
  center: [number, number];
  zoom: number;
  layerType: 'vec' | 'img';
  actionId: number;
  actionType: string;
}

// 响应式数据
const mapConfig = reactive<MapConfig>({
  center: [29.5630, 106.5516], // 重庆（默认兜底）
  zoom: 13,
  layerType: 'img',
  actionId: 0,
  actionType: 'init'
});

// 设备列表，独立 prop 传递给 RenderJS，避免与 mapConfig 变更批处理冲突
const devicesProp = ref<any[]>([]);

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 提示占位
const toast = (name: string) => {
  uni.showToast({ title: `点击了: ${name}`, icon: 'none' });
};

// 名称显示开关，默认显示
const showDeviceNames = ref(true);

const toggleDeviceNames = () => {
  showDeviceNames.value = !showDeviceNames.value;
};

// === 核心功能：获取定位 ===
const locateUser = () => {
  uni.showLoading({ title: '定位中...' });
  getLocation({
    type: 'wgs84',
    success: (res) => {
      uni.hideLoading();
      userLocation.value = { lat: res.latitude, lng: res.longitude };
      mapConfig.center = [res.latitude, res.longitude];
      mapConfig.zoom = 16;
      mapConfig.actionType = 'locate';
      mapConfig.actionId++;
    },
    fail: () => {
      uni.hideLoading();
      uni.showToast({ title: '获取定位失败', icon: 'none' });
    }
  });
};

const zoomIn = () => {
  if (mapConfig.zoom < 18) {
    mapConfig.zoom++;
    mapConfig.actionType = 'zoom';
    mapConfig.actionId++;
  }
};

const zoomOut = () => {
  if (mapConfig.zoom > 3) {
    mapConfig.zoom--;
    mapConfig.actionType = 'zoom';
    mapConfig.actionId++;
  }
};

const toggleLayer = () => {
  mapConfig.layerType = mapConfig.layerType === 'vec' ? 'img' : 'vec';
  mapConfig.actionType = 'layer';
  mapConfig.actionId++;
};

const handleMapMessage = (data: any) => {
  if (!data) return;

  if (data.type === 'deviceClick') {
    // 如果正在移动设备，忽略其他设备的点击
    if (isMovingDevice.value) return;
    // 点击了设备图标
    console.log('点击了设备:', data.device);
    const device = data.device;

    // 确定当前参考坐标（优先使用调试假定位）
    let refLat: number, refLng: number;
    if (DEBUG_ENABLED && debugLocation.lat !== null && debugLocation.lng !== null) {
      refLat = debugLocation.lat;
      refLng = debugLocation.lng;
    } else {
      refLat = userLocation.value.lat;
      refLng = userLocation.value.lng;
    }

    // 计算距离
    const dist = (refLat !== 0 || refLng !== 0)
      ? calculateDistance(refLat, refLng, device.lat, device.lng)
      : '未定位';

    currentDeviceInfo.value = {
      id: device.id || '',
      name: device.name || '未知设备',
      distance: dist,
      lng: Number(device.lng).toFixed(6),
      lat: Number(device.lat).toFixed(6),
      deviceType: device.device_type || ''
    };
    showDevicePanel.value = true;
  } else if (data.type === 'click') {
    console.log(`点击坐标: ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`);
    // 点击地图时，关闭设备列表面板
    showDevicePanel.value = false;
    if (isFabOpen.value) {
      isFabOpen.value = false;
    }
    // DEBUG START
    onMapClickDebug({ lat: data.lat, lng: data.lng })
    // DEBUG END
  }
  // DEBUG START
  if (data.type === 'debugDrag') {
    setDebugLocation(data.lat, data.lng)
    console.log('[DEBUG] 拖拽更新坐标:', data.lat, data.lng)
  }
  // DEBUG END
};

// === 底部悬浮菜单逻辑 ===
const isFabOpen = ref(false);

const fabItems = [
  { name: '变电站', deviceType: 'substation' },
  { name: '杆塔', deviceType: 'pole' },
  { name: '电缆拐点', deviceType: 'cable' },
  { name: '变压器', deviceType: 'transformer' },
  { name: '计量信息', deviceType: 'meter' },
  { name: '站房', deviceType: 'station' }
];

const toggleFab = () => {
  isFabOpen.value = !isFabOpen.value;
};

const getFabItemStyle = (index: number) => {
  if (!isFabOpen.value) {
    return {
      transform: 'translate(0, 0) scale(0.5)',
      opacity: 0,
      pointerEvents: 'none'
    };
  }

  const total = fabItems.length;
  const angle = (Math.PI / (total - 1)) * index;
  const radius = 110;

  const x = -Math.cos(angle) * radius;
  const y = -Math.sin(angle) * radius;

  return {
    transform: `translate(${x}px, ${y}px) scale(1)`,
    opacity: 1,
    pointerEvents: 'auto'
  };
};

// ← 修改：跳转到设备编辑页
const handleFabClick = (item: any) => {
  isFabOpen.value = false;
  // DEBUG START — 优先使用假定位坐标
  let lat, lng;
  if (DEBUG_ENABLED && debugLocation.lat !== null && debugLocation.lng !== null) {
    lat = debugLocation.lat;
    lng = debugLocation.lng;
    console.log('[DEBUG] 新建设备使用假定位:', lat, lng);
  } else {
    lat = mapConfig.center[0];
    lng = mapConfig.center[1];
  }
  // DEBUG END
  const url = `/pages/device/edit?lineId=${lineId.value}&lineName=${encodeURIComponent(lineName.value)}&deviceType=${item.deviceType}&lat=${Number(lat).toFixed(6)}&lng=${Number(lng).toFixed(6)}`;

  uni.navigateTo({
    url,
    fail: (err) => {
      console.error('跳转失败:', err);
      uni.showToast({ title: '页面跳转失败', icon: 'none' });
    }
  });
};

const loadDevices = async () => {
  try {
    const devices = await deviceDAO.findAllByLine(lineId.value);
    // 直接赋值给独立 ref，触发 renderjs 的 onDevicesChange
    devicesProp.value = devices || [];
  } catch (e) {
    console.error('加载设备列表失败:', e);
  }
};

const lineId = ref('');
const lineName = ref('');

onLoad((options) => {
  if (options && options.lineId) {
    lineId.value = options.lineId;
  }
  if (options && options.lineName) {
    lineName.value = decodeURIComponent(options.lineName);
  }

  uni.$on('map-message', handleMapMessage);
  uni.showLoading({ title: '定位中...' });
  getLocation({
    type: 'wgs84',
    success: (res) => {
      uni.hideLoading();
      userLocation.value = { lat: res.latitude, lng: res.longitude };
      mapConfig.center = [res.latitude, res.longitude];
      mapConfig.zoom = 16;
      mapConfig.actionType = 'initLocate';
      mapConfig.actionId++;
    },
    fail: () => {
      uni.hideLoading();
      uni.showToast({ title: '获取定位失败', icon: 'none' });
    }
  });
});

// ← 新增：每次页面显示时重新加载设备（包括从编辑页返回时）
onShow(() => {
  loadDevices();
});

onUnmounted(() => {
  uni.$off('map-message', handleMapMessage);
});
</script>

<!-- 2. 中转层 -->
<script lang="ts">
export default {
  methods: {
    receiveRenderData(data: any) {
      uni.$emit('map-message', data);
    }
  }
}
</script>

<!-- 3. 视图层 (RenderJS) -->
<script module="mapModule" lang="renderjs">
export default {
  data() {
    return {
      map: null,
      layers: {},
      locationMarker: null,
      deviceLayerGroup: null,   // ← 新增：设备图层组
      pendingDevices: null,     // ← 新增：地图未就绪时暂存设备数据
      tdtKey: 'a30fe8f02deafbdc08192aa8f81c0044',
      pendingConfig: null,
      showNames: true,
      debugMarker: null // DEBUG
    }
  },
  mounted() {
    // ← 新增：注入设备标记和标签的自定义样式
    const style = document.createElement('style');
    style.textContent = `
      .device-marker-wrapper {
      background: transparent !important;
      border: none !important;
      overflow: visible !important;
      }
    `;
    document.head.appendChild(style);

    const getRealPath = (path) => {
      // #ifdef APP-PLUS
      return plus.io.convertLocalFileSystemURL('_www' + path);
      // #endif
      // #ifdef H5
      return path;
      // #endif
    };

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = getRealPath('/static/leaflet/leaflet.css');
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = getRealPath('/static/leaflet/leaflet.js');
    script.onload = () => {
      this.initMap();
    };
    document.head.appendChild(script);
  },
  methods: {
    initMap() {
      if (!window.L || !this.tdtKey) return;

      const initialCenter = (this.pendingConfig && this.pendingConfig.center)
        ? this.pendingConfig.center
        : [29.5630, 106.5516];
      const initialZoom = (this.pendingConfig && this.pendingConfig.zoom)
        ? this.pendingConfig.zoom
        : 13;

      this.map = L.map('map', {
        zoomControl: false,
        attributionControl: false
      }).setView(initialCenter, initialZoom);

      this.updateLayers((this.pendingConfig && this.pendingConfig.layerType) || 'img');

      this.map.on('click', (e) => {
        this.$ownerInstance.callMethod('receiveRenderData', {
          type: 'click',
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      });

      if (this.pendingConfig) {
        if (this.pendingConfig.actionType === 'initLocate' || this.pendingConfig.actionType === 'locate') {
          this.drawLocationMarker(this.pendingConfig.center);
        }
        this.pendingConfig = null;
      }

      // ← 新增：地图初始化完成后，绘制已暂存的设备数据
      if (this.pendingDevices) {
        this.drawDevices(this.pendingDevices);
        this.pendingDevices = null;
      }
    },

    applyConfig(config) {
      if (!this.map || !config) return;

      if (config.actionType === 'initLocate') {
        this.map.setView(config.center, config.zoom);
        this.drawLocationMarker(config.center);
      }
      else if (config.actionType === 'locate') {
        this.map.flyTo(config.center, config.zoom);
        this.drawLocationMarker(config.center);
      }
      else if (config.actionType === 'zoom') {
        this.map.setZoom(config.zoom);
      }
      else if (config.actionType === 'layer') {
        this.updateLayers(config.layerType);
      }
    },

    updateMapConfig(newValue, oldValue) {
      if (!newValue) return;

      if (!this.map) {
        this.pendingConfig = {
          center: newValue.center ? [newValue.center[0], newValue.center[1]] : null,
          zoom: newValue.zoom,
          layerType: newValue.layerType,
          actionId: newValue.actionId,
          actionType: newValue.actionType
        };
        return;
      }

      this.applyConfig(newValue);
    },

    /** 设备数据变化时触发（独立 prop 通道） */
    onDevicesChange(newValue) {
      if (this.map) {
      this.drawDevices(newValue || []);
      } else {
      this.pendingDevices = newValue;
      }
    },

    drawLocationMarker(center) {
      if (this.locationMarker) {
        this.map.removeLayer(this.locationMarker);
      }
      this.locationMarker = L.circleMarker(center, {
        color: '#fff',
        fillColor: '#2A85FF',
        fillOpacity: 1,
        radius: 8,
        weight: 2
      }).addTo(this.map);

      L.circleMarker(center, {
        color: '#2A85FF',
        fillColor: '#2A85FF',
        fillOpacity: 0.2,
        radius: 15,
        weight: 0
      }).addTo(this.map);
    },

    onShowNamesChange(newValue) {
      this.showNames = newValue;
      // 拿到当前设备数据重新绘制
      if (this.map && this.deviceLayerGroup) {
        // 遍历所有 marker，切换名称 span 的显示
        this.deviceLayerGroup.eachLayer(function(layer) {
          if (layer.getElement) {
            var el = layer.getElement();
            if (el) {
              var nameSpan = el.querySelector('.device-name-label');
              if (nameSpan) {
                nameSpan.style.display = newValue ? 'inline' : 'none';
              }
            }
          }
        });
      }
    },

    /**
    * 绘制设备标记和连线
    * Marker 样式：倒水滴状定位针 + 内嵌居中 SVG 图标 + 右侧名称标签
    */
    drawDevices(devices) {
      // 清除旧图层
      if (this.deviceLayerGroup) {
        this.map.removeLayer(this.deviceLayerGroup);
        this.deviceLayerGroup = null;
      }
      if (!devices || devices.length === 0) return;
    
      this.deviceLayerGroup = L.layerGroup().addTo(this.map);
      var self = this; // 保存 this 引用
      
      // 构建设备ID到设备对象的映射，用于快速查找
      var deviceMap = {};
      var topLevelDevices = [];
    
      for (var i = 0; i < devices.length; i++) { 
        var device=devices[i];
        var lat=parseFloat(device.latitude);
        var lng=parseFloat(device.longitude); 
        
        if (isNaN(lat) || isNaN(lng) || (lat===0 && lng===0)) continue;
        var latlng=[lat,lng];
        var displayName=device.name || '未命名' ;
        var svgHtml=this.getDeviceSvg(device.device_type);
        var color='#3bbffb';
        // 倒水滴气泡容器 + 右侧文字
        var html = ''
          + '<div style="display:flex;align-items:flex-start;pointer-events:auto;">'
          +  '<div style="'
          +   'position:relative;'
          +   'width:28px;height:28px;'
          +   'display:flex;align-items:center;justify-content:center;'
          +   'flex-shrink:0;'
          +  '">' 
          +   '<!-- 倒水滴背景 -->'
          +   '<div style="'
          +    'position:absolute;top:0;left:0;width:100%;height:100%;'
          +    'background:' + color + ';'
          +    'border-radius:50% 50% 50% 0;'
          +    'transform:rotate(-45deg);'
          +    'box-shadow:-2px 2px 4px rgba(0,0,0,0.3);'
          +   '"></div>'
          +   '<!-- 居中图标 -->'
          +   '<div style="'
          +    'position:relative;z-index:1;'
          +    'width:16px;height:16px;'
          +    'display:flex;align-items:center;justify-content:center;'
          +   '">' 
          +    svgHtml
          +   '</div>'
          +  '</div>'
          // 右侧文字
          + '<span class="device-name-label" style="'
          +  'display:' + (self.showNames ? 'inline' : 'none') + ';'
          +  'margin-left:6px;margin-top:4px;'
          +  'white-space:nowrap;'
          +  'color:#fff;font-size:12px;font-weight:bold;'
          +  'text-shadow:'
          +   '-1px -1px 0 #333,'
          +   ' 1px -1px 0 #333,'
          +   '-1px  1px 0 #333,'
          +   ' 1px  1px 0 #333;'
          +  '">' + displayName + '</span>'
          + '</div>';
        var icon=L.divIcon({ 
          className: 'device-marker-wrapper',
          html: html,
          iconSize: [28, 34], // 整体尺寸缩小
          iconAnchor: [14, 34] // 锚点对准水滴最底部的尖端
        });

        // 将 marker 存为变量，并绑定点击事件
        var marker = L.marker(latlng, { icon: icon }).addTo(this.deviceLayerGroup);

        // 用 IIFE 捕获当前循环变量的值，避免闭包引用最后一次迭代
        ;(function(capturedId, capturedName, capturedLat, capturedLng, capturedType) {
          // 绑定点击事件，通过已有的 receiveRenderData 统一发送给逻辑层
          marker.on('click', function(e) {
            // 阻止事件冒泡到地图底图上（防止触发地图的空白点击）
            if (e.originalEvent) {
              L.DomEvent.stopPropagation(e.originalEvent);
            }
            self.$ownerInstance.callMethod('receiveRenderData', {
              type: 'deviceClick',
              device: {
                id: capturedId,
                name: capturedName,
                lat: capturedLat,
                lng: capturedLng,
                device_type: capturedType
              }
            });
          });
        })(device.id,displayName, lat, lng, device.device_type);
        
        // 构建设备映射表，用于后续连线
        deviceMap[device.id] = {
          id: device.id,
          latlng: latlng,
          prev_id: device.prev_id,
          parent_id: device.parent_id
        };
        
        // 仅顶层设备参与连线
        if (!device.parent_id || device.parent_id === '') {
          topLevelDevices.push(deviceMap[device.id]);
        }
      }

      // 基于 prev_id 连接顶层设备，支持分支线路
      for (var j = 0; j < topLevelDevices.length; j++) {
        var currentDevice = topLevelDevices[j];
        
        // 如果设备有 prev_id，则连接到前一个设备
        if (currentDevice.prev_id && currentDevice.prev_id !== '' && deviceMap[currentDevice.prev_id]) {
          var prevDevice = deviceMap[currentDevice.prev_id];
          
          // 绘制连线
          L.polyline([prevDevice.latlng, currentDevice.latlng], {
            color: '#03da6b',
            weight: 2,
            opacity: 1
          }).addTo(this.deviceLayerGroup);
        }
      }
    },
    
    /**
    * 根据设备类型返回对应的 SVG 图标 HTML
    * 可自行替换各类型的 path 数据
    */
    getDeviceSvg(deviceType) {
      var svgs = {
        'pole':
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 162 148" width="16" height="16">'
            + '<path fill="#fff" d="'
          + 'M150,90.9C144.1,114.3,130.1,130.5,108.5,139.7C97.5,144.3,85.9,145.9,73.7,144.3'
          + 'C61.5,142.7,50.6,138.6,41,131.4C25.1,119.7,15.7,104.1,12.9,84.3'
          + 'C10.1,65.1,14.9,47.7,26.4,32.7C37.8,17.7,53.3,8.4,72.7,5.8'
          + 'C91.4,3.4,108.1,7.7,123.1,18.6C138.9,30.2,148.4,45.7,151.2,65.5'
          + 'C152.4,74,151.8,82.2,150,90.9'
          + 'M104.5,55.1C99.4,61,94.2,67,88.7,73.4C100.6,86.3,112.4,99.1,124.3,112'
          + 'C145.6,88.7,141,51.4,121.9,36.4C116.2,42.4,110.6,48.5,104.5,55.1'
          + 'M32.1,48.7C21.4,70.8,24.2,94.5,39.9,111.8C51.4,99.1,63,86.4,75,73.2'
          + 'C63.9,60.8,52.9,48.5,41.3,35.5C38.1,40,35.3,44,32.1,48.7'
          + 'M52.1,113.7C50.7,115.5,49.4,117.3,48,119C63.1,134.4,97.9,136.3,116.2,119.2'
          + 'C110.7,112.8,105.2,106.4,99.6,100.1C93.9,93.8,88,87.5,81.8,80.8'
          + 'C72,91.6,62.3,102.3,52.1,113.7'
          + 'M89,57.5C97.3,48,105.6,38.5,113.9,28.9C95.9,14.7,64.7,15.9,50.1,29.3'
          + 'C60.6,41.3,71.1,53.3,81.9,65.8C84.5,62.7,86.5,60.4,89,57.5z" />'
            + '</svg>',
        'transformer':
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none">'
          + '<circle cx="9" cy="12" r="5" stroke="#fff" stroke-width="1.5" />'
          + '<circle cx="15" cy="12" r="5" stroke="#fff" stroke-width="1.5" />'
          + '</svg>',
        'substation':
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none">'
          + '<rect x="4" y="9" width="16" height="11" rx="1" stroke="#fff" stroke-width="1.5" />'
          + '<path d="M4 9l8-5 8 5" stroke="#fff" stroke-width="1.5" stroke-linejoin="round" />'
          + '<path d="M13 12l-2 3.5h3l-2 3.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />'
          + '</svg>',
        'cable':
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none">'
          + '<circle cx="12" cy="12" r="3" fill="#fff" />'
          + '<path d="M4 12h5M15 12h5M12 4v5M12 15v5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" />'
          + '</svg>',
        'meter':
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none">'
          + '<circle cx="12" cy="13" r="8" stroke="#fff" stroke-width="1.5" />'
          + '<path d="M12 13l4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" />'
          + '<circle cx="12" cy="13" r="1.5" fill="#fff" />'
          + '</svg>',
        'station':
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none">'
          + '<path d="M3 12l9-7 9 7" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />'
          + '<rect x="5" y="12" width="14" height="8" stroke="#fff" stroke-width="1.5" />'
          + '<rect x="9" y="15" width="6" height="5" stroke="#fff" stroke-width="1.5" />'
          + '</svg>'
      };
      return svgs[deviceType]
        || '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="6" fill="#fff" /></svg>';
    },

    updateLayers(type) {
      if (!this.map) return;
      if (this.layers.base) this.map.removeLayer(this.layers.base);
      if (this.layers.label) this.map.removeLayer(this.layers.label);

      const tk = this.tdtKey;
      let layerUrl = type === 'vec' 
        ? `https://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`
        : `https://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`;
      
      let labelUrl = type === 'vec'
        ? `https://t0.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`
        : `https://t0.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`;

      this.layers.base = L.tileLayer(layerUrl, { maxZoom: 18 }).addTo(this.map);
      this.layers.label = L.tileLayer(labelUrl, { maxZoom: 18 }).addTo(this.map);
    },
    // DEBUG START
    onDebugMarkerChange(newValue) {
      if (!newValue) return
      if (!this.map) return
      if (newValue.action === 'set') {
        this.drawDebugMarker(newValue.lat, newValue.lng)
      } else if (newValue.action === 'clear') {
        this.removeDebugMarker()
      }
    },
    
    drawDebugMarker(lat, lng) {
      if (this.debugMarker) {
        this.map.removeLayer(this.debugMarker)
      }
    
      var crossHtml = ''
        + '<div style="position:relative;width:40px;height:40px;">'
        + '<div style="position:absolute;top:50%;left:0;width:100%;height:2px;background:red;transform:translateY(-50%);"></div>'
        + '<div style="position:absolute;left:50%;top:0;height:100%;width:2px;background:red;transform:translateX(-50%);"></div>'
        + '<div style="position:absolute;top:50%;left:50%;width:14px;height:14px;border:2px solid red;border-radius:50%;transform:translate(-50%,-50%);background:rgba(255,0,0,0.15);"></div>'
        + '</div>';
      
      var icon = L.divIcon({
        className: '',
        html: crossHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      
      this.debugMarker = L.marker([lat, lng], {
        icon: icon,
        draggable: true,
        zIndexOffset: 9999
      }).addTo(this.map);
      
      var self = this;
      this.debugMarker.on('dragend', function (e) {
        var pos = e.target.getLatLng();
        self.$ownerInstance.callMethod('receiveRenderData', {
          type: 'debugDrag',
          lat: pos.lat,
          lng: pos.lng
        });
      });
    },
    
    removeDebugMarker() {
      if (this.debugMarker) {
        this.map.removeLayer(this.debugMarker);
        this.debugMarker = null;
      }
    }
    // DEBUG END
  }
}
</script>

<style scoped>
.content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.custom-nav {
  height: 44px;
  padding-top: var(--status-bar-height, 44px);
  background-color: #006567;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 15px;
  padding-right: 15px;
  z-index: 999;
}

.nav-left {
  width: 40px;
}

.back-icon {
  color: #fff;
  font-size: 24px;
  font-weight: 300;
}

.nav-title {
  color: #fff;
  font-size: 18px;
  font-weight: 500;
}

.nav-right {
  width: 40px;
}

.map-container {
  flex: 1;
  width: 100%;
  background-color: #f5f5f5;
}

.right-tools {
  position: absolute;
  right: 15px;
  top: 120px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 900;
}

.tool-group {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 8px;
  border-bottom: 1px solid #f0f0f0;
}

.tool-item:last-child {
  border-bottom: none;
}

.tool-item:active {
  background-color: #f5f5f5;
}

.tool-item .icon {
  font-size: 18px;
  margin-bottom: 2px;
  color: #333;
}

.tool-item .text {
  font-size: 10px;
  color: #666;
}

.icon-eye-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eye-slash {
  position: absolute;
  width: 4rpx;
  height: 120%;
  background-color: #ff4444;
  transform: rotate(45deg);
  border-radius: 2rpx;
}

.zoom-btn {
  padding: 8px 12px;
}

.zoom-btn .icon {
  font-size: 22px;
  margin-bottom: 0;
  color: #333;
  font-weight: 300;
}

.bottom-fab-wrapper {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 950;
  display: flex;
  justify-content: center;
  align-items: center;
}

.fab-main {
  width: 60px;
  height: 60px;
  background-color: #ffffff;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
}

.fab-main:active {
  background-color: #f9f9f9;
}

.fab-main-icon {
  font-size: 32px;
  color: #666;
  font-weight: 300;
  transition: transform 0.3s ease;
}

.fab-main-icon.is-open {
  transform: rotate(45deg);
}

.fab-menu {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1;
}

.fab-sub-item {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 50px;
  margin-top: -25px;
  margin-left: -25px;
  background-color: #ffffff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.fab-sub-item:active {
  background-color: #f0f0f0;
}

.sub-text {
  font-size: 10px;
  color: #333;
  text-align: center;
  line-height: 1.2;
  padding: 0 4px;
}

/* --- 底部设备面板样式 --- */
.device-panel-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 999;
  /* 确保弹窗层级最高 */
}

/* 左上角悬浮切换按钮 */
.panel-switch-btns {
  position: absolute;
  top: -40px;
  /* 悬浮在主面板上方 */
  left: 20px;
  display: flex;
  gap: 10px;
}

.switch-btn {
  width: 36px;
  height: 36px;
  background-color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.arrow-icon {
  font-size: 16px;
  color: #333333;
  font-weight: bold;
}

/* 白色主面板 */
.device-panel {
  background-color: #ffffff;
  border-radius: 16px 16px 0 0;
  /* 顶部圆角 */
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

/* 上半部分：信息区 */
.panel-info {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-title {
  font-size: 18px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 4px;
}

.info-desc {
  font-size: 14px;
  color: #666666;
}

/* 下半部分：操作区 */
.panel-actions {
  display: flex;
  flex-direction: row;
  border-top: 1px solid #eeeeee;
  /* 顶部水平分割线 */
  height: 50px;
}

.action-item {
  flex: 1;
  /* 均分三个区域 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: #007aff;
  /* 主题蓝，可根据你的UI调整 */
  border-right: 1px solid #eeeeee;
  /* 右侧垂直分割线 */
}

/* 最后一个按钮去掉右侧分割线 */
.action-item.no-border {
  border-right: none;
}

/* 移动设备时的底部操作按钮容器 */
.move-actions-wrapper {
  position: fixed;
  bottom: 60px;
  /* 和底部保持一定距离 */
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  /* 水平居中 */
  align-items: center;
  gap: 40px;
  /* 两个按钮之间的间距 */
  z-index: 999;
}

/* 按钮基础样式 */
.move-btn {
  width: 120px;
  height: 44px;
  border-radius: 22px;
  /* 圆角矩形 */
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

/* 取消按钮 */
.cancel-btn {
  background-color: #ffffff;
  color: #333333;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* 确定按钮 */
.confirm-btn {
  background-color: #2A85FF;
  color: #ffffff;
  box-shadow: 0 2px 10px rgba(42, 133, 255, 0.3);
}
</style>