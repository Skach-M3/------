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
      :devicePerfTraceProp="devicePerfTraceProp" :change:devicePerfTraceProp="mapModule.onDevicePerfTraceChange"
      :devicesProp="devicesProp" :change:devicesProp="mapModule.onDevicesChange" :debugMarker="debugMarkerProp"
      :change:debugMarker="mapModule.onDebugMarkerChange" :showNamesProp="showDeviceNames"
      :change:showNamesProp="mapModule.onShowNamesChange" :movingDeviceIdProp="movingDeviceIdProp"
      :change:movingDeviceIdProp="mapModule.onMovingDeviceIdChange" :confirmMoveProp="confirmMoveProp"
      :change:confirmMoveProp="mapModule.onConfirmMoveChange" :blinkDeviceIdProp="blinkDeviceIdProp"
      :change:blinkDeviceIdProp="mapModule.onBlinkDeviceIdChange" :selectedDeviceIdProp="selectedDeviceIdProp"
      :change:selectedDeviceIdProp="mapModule.onSelectedDeviceIdChange" :markerDisplayConfigProp="markerDisplayConfig"
      :change:markerDisplayConfigProp="mapModule.onMarkerDisplayConfigChange" :devicePatchProp="devicePatchProp"
      :change:devicePatchProp="mapModule.onDevicePatchChange"></view>

    <!-- 移动模式 - 中心设备标记 -->
    <view v-if="isMovingDevice" class="move-center-pin">
      <!-- 落点脉冲环 -->
      <view class="move-pin-pulse"
        :style="{ borderColor: movingDeviceColor ? `rgba(${movingDeviceColor.r}, ${movingDeviceColor.g}, ${movingDeviceColor.b}, 0.8)` : 'rgba(59, 191, 251, 0.8)' }">
      </view>
      <!-- 落点圆点 -->
      <view class="move-pin-dot"
        :style="{ background: movingDeviceColor ? `rgb(${movingDeviceColor.r}, ${movingDeviceColor.g}, ${movingDeviceColor.b})` : '#3bbffb' }">
      </view>
      <!-- 标记主体：水滴 + 名称 -->
      <view class="move-pin-body">
        <view class="move-pin-head">
          <view class="move-pin-teardrop"
            :style="{ background: movingDeviceColor ? `rgb(${movingDeviceColor.r}, ${movingDeviceColor.g}, ${movingDeviceColor.b})` : '#3bbffb' }">
          </view>
          <image v-if="movingDeviceIconUri" :src="movingDeviceIconUri" class="move-pin-icon" mode="aspectFit" />
        </view>
        <text class="move-pin-name">{{ movingDeviceOriginal?.name || '' }}</text>
      </view>
    </view>

    <!-- 右侧悬浮工具栏 -->
    <view class="right-tools" v-show="!isMovingDevice">
      <!-- 组1：功能菜单 -->
      <view class="tool-group">
        <view class="tool-item" @click="goToDeviceSearch">
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
      <!-- <view class="panel-switch-btns">
        <view class="switch-btn" @click="prevDevice">
          <text class="arrow-icon">&lt;</text>
        </view>
        <view class="switch-btn" @click="nextDevice">
          <text class="arrow-icon">&gt;</text>
        </view>
      </view> -->

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
          <view class="action-item" @click="handleMove">移动</view>
          <view class="action-item no-border delete-action" @click="handleDelete">删除</view>
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
import { ref, reactive, computed, onUnmounted } from 'vue';
import { onLoad, onShow, onHide } from '@dcloudio/uni-app';
import deviceDAO from '@/dao/deviceDAO.js';
import { getLocation } from '@/utils/get-location.js'
import { getPinSvgUri } from '@/static/device_svgs.js';
import { DEBUG_ENABLED, debugLocation, setDebugLocation, clearDebugLocation } from '@/utils/debug-location.js'

const MAP_PERF_ENABLED = true;
const MAP_PERF_PREFIX = '[MAP_PERF]';
let mapPerfSeq = 0;
let pendingDevicesDirtyReason = 'initial';

const perfNow = () => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
};

const roundPerfMs = (value: number) => Math.round(value * 100) / 100;

const nextMapPerfTraceId = (op: string) => {
  mapPerfSeq += 1;
  return `${op}-${Date.now().toString(36)}-${mapPerfSeq}`;
};

const mapPerfLog = (event: string, detail: Record<string, any> = {}) => {
  if (!MAP_PERF_ENABLED) return;

  const payload = {
    event,
    layer: 'logic',
    page: 'pages/index/map.vue',
    at: new Date().toISOString(),
    ...detail
  };

  try {
    console.log(MAP_PERF_PREFIX, JSON.stringify(payload));
  } catch (err) {
    console.log(MAP_PERF_PREFIX, payload);
  }
};

const getDevicePerfStats = (devices: any[] = []) => {
  const stats = {
    totalDevices: devices.length,
    validCoordDevices: 0,
    invalidCoordDevices: 0,
    topLevelDevices: 0,
    childDevices: 0,
    linkedDevices: 0
  };

  devices.forEach((device: any) => {
    const lat = Number(device?.latitude);
    const lng = Number(device?.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
      stats.validCoordDevices++;
    } else {
      stats.invalidCoordDevices++;
    }

    if (device?.parent_id) {
      stats.childDevices++;
    } else {
      stats.topLevelDevices++;
    }

    if (device?.prev_id) {
      stats.linkedDevices++;
    }
  });

  return stats;
};

const buildDeviceIdSet = (devices: any[] = []) => {
  const ids = new Set<string>();
  devices.forEach((device: any) => {
    if (device && device.id !== undefined && device.id !== null) {
      ids.add(String(device.id));
    }
  });
  return ids;
};

const normalizeDeviceSignatureValue = (value: any) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }
  return String(value);
};

const getMapDeviceSignature = (device: any) => {
  if (!device) return '';
  return JSON.stringify({
    line_id: normalizeDeviceSignatureValue(device.line_id),
    device_type: normalizeDeviceSignatureValue(device.device_type),
    parent_id: normalizeDeviceSignatureValue(device.parent_id),
    prev_id: normalizeDeviceSignatureValue(device.prev_id),
    name: normalizeDeviceSignatureValue(device.name),
    longitude: normalizeDeviceSignatureValue(device.longitude),
    latitude: normalizeDeviceSignatureValue(device.latitude),
    sort_order: normalizeDeviceSignatureValue(device.sort_order),
    attributes: normalizeDeviceSignatureValue(device.attributes)
  });
};

const diffDeviceLists = (previousDevices: any[] = [], nextDevices: any[] = []) => {
  const previousIds = buildDeviceIdSet(previousDevices);
  const nextIds = buildDeviceIdSet(nextDevices);
  const previousById = new Map<string, any>();
  const addedDevices: any[] = [];
  const updatedDevices: any[] = [];
  const removedIds: string[] = [];

  previousDevices.forEach((device: any) => {
    if (device && device.id !== undefined && device.id !== null) {
      previousById.set(String(device.id), device);
    }
  });

  nextDevices.forEach((device: any) => {
    if (device && !previousIds.has(String(device.id))) {
      addedDevices.push(device);
      return;
    }

    const previousDevice = device ? previousById.get(String(device.id)) : null;
    if (previousDevice && getMapDeviceSignature(previousDevice) !== getMapDeviceSignature(device)) {
      updatedDevices.push(device);
    }
  });

  previousDevices.forEach((device: any) => {
    const id = device && device.id !== undefined && device.id !== null ? String(device.id) : '';
    if (id && !nextIds.has(id)) {
      removedIds.push(id);
    }
  });

  return {
    addedDevices,
    updatedDevices,
    removedIds
  };
};

// DEBUG START
const debugPanelOpen = ref(false)
const debugMarkerProp = ref(null)
const selectedDeviceIdProp = ref('')

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
const isMovingDevice = ref(false);

// ========== 持续定位 ==========
const isMapPageVisible = ref(false);
const isInitialLocating = ref(false);
const isLocationWatchStarted = ref(false);
let locationWatchToken = 0;

const handleLocationChange = (res: any) => {
  if (!res || typeof res.latitude !== 'number' || typeof res.longitude !== 'number') return;
  if (isMovingDevice.value) return;

  userLocation.value = { lat: res.latitude, lng: res.longitude };
  // Update only the blue location marker; do not recenter the map view.
  mapConfig.center = [res.latitude, res.longitude];
  mapConfig.actionType = 'updateLocation';
  mapConfig.actionId++;
};

const startLocationWatch = () => {
  stopLocationWatch(); // 防止重复监听
  const uniApi = uni as any;
  const token = ++locationWatchToken;

  if (typeof uniApi.startLocationUpdate !== 'function' || typeof uniApi.onLocationChange !== 'function') {
    console.warn('当前平台不支持前台持续定位');
    return;
  }

  uniApi.startLocationUpdate({
    type: 'wgs84',
    success: () => {
      if (token !== locationWatchToken || !isMapPageVisible.value) {
        if (typeof uniApi.stopLocationUpdate === 'function') {
          uniApi.stopLocationUpdate();
        }
        return;
      }
      uniApi.onLocationChange(handleLocationChange);
      isLocationWatchStarted.value = true;
    },
    fail: (err) => {
      console.warn('开启前台持续定位失败:', err);
      isLocationWatchStarted.value = false;
    }
  });
};

const stopLocationWatch = () => {
  const uniApi = uni as any;
  locationWatchToken++;

  if (typeof uniApi.offLocationChange === 'function') {
    uniApi.offLocationChange(handleLocationChange);
  }

  if (isLocationWatchStarted.value && typeof uniApi.stopLocationUpdate === 'function') {
    uniApi.stopLocationUpdate({
      fail: (err) => {
        console.warn('停止前台持续定位失败:', err);
      }
    });
  }

  isLocationWatchStarted.value = false;
};

const pauseLocationWatchForMove = () => {
  stopLocationWatch();
};

const resumeLocationWatchAfterMove = () => {
  if (isMapPageVisible.value && !isInitialLocating.value && !isMovingDevice.value) {
    startLocationWatch();
  }
};

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

const confirmMoveProp = ref(0);
const devicePatchProp = ref<any>(null);
const devicePerfTraceProp = ref<any>(null);
// 触发地图上设备名称闪烁
const blinkDeviceIdProp = ref<{ id: string; ts: number } | null>(null);

const movingDeviceOriginal = ref<{
  id: string;
  lat: number;
  lng: number;
  name: string;
  deviceType: string;
} | null>(null);
const movingDeviceIdProp = ref('');
const movedDeviceCoordinateOverrides = new Map<string, { lat: number; lng: number }>();

const sendDevicePatch = (patch: any) => {
  const traceId = patch.traceId || nextMapPerfTraceId(`patch-${patch.type || 'device'}`);
  const patchWithMeta = {
    ...patch,
    traceId,
    ts: Date.now()
  };
  devicePatchProp.value = patchWithMeta;
  mapPerfLog('logic.devicePatch.sent', {
    traceId,
    patchType: patchWithMeta.type || '',
    deviceId: patchWithMeta.id || ''
  });
};

const getCurrentReferenceLocation = () => {
  if (DEBUG_ENABLED && debugLocation.lat !== null && debugLocation.lng !== null) {
    return { lat: debugLocation.lat, lng: debugLocation.lng };
  }
  return { lat: userLocation.value.lat, lng: userLocation.value.lng };
};

const withMovedDeviceCoordinateOverride = (device: any) => {
  if (!device) return device;
  const override = movedDeviceCoordinateOverrides.get(String(device.id));
  if (!override) return device;
  return {
    ...device,
    latitude: String(override.lat),
    longitude: String(override.lng)
  };
};

const updateMovedDeviceLocalCache = (deviceId: string, lat: number, lng: number) => {
  movedDeviceCoordinateOverrides.set(String(deviceId), { lat, lng });

  if (String(currentDeviceInfo.value.id) === String(deviceId)) {
    const refLoc = getCurrentReferenceLocation();
    const dist = (refLoc.lat !== 0 || refLoc.lng !== 0)
      ? calculateDistance(refLoc.lat, refLoc.lng, lat, lng)
      : '未定位';

    currentDeviceInfo.value = {
      ...currentDeviceInfo.value,
      distance: dist,
      lng: lng.toFixed(8),
      lat: lat.toFixed(8)
    };
  }
};

// 取消按钮点击事件
const cancelMove = () => {
  // 退出移动模式
  isMovingDevice.value = false;
  showDevicePanel.value = false;

  // 通知 RenderJS 恢复显示设备 marker 和连线
  movingDeviceIdProp.value = '';

  // 飞回设备原位置
  if (movingDeviceOriginal.value) {
    mapConfig.center = [movingDeviceOriginal.value.lat, movingDeviceOriginal.value.lng];
    mapConfig.actionType = 'flyTo';
    mapConfig.actionId++;
  }

  movingDeviceOriginal.value = null;
  resumeLocationWatchAfterMove();
};
// 确定按钮点击事件
const confirmMove = () => {
  if (!movingDeviceOriginal.value) return;
  // 触发 RenderJS 获取当前地图中心坐标
  confirmMoveProp.value = Date.now();
};

const onConfirmMoveResult = async (centerData: { lat: number; lng: number }) => {
  if (!movingDeviceOriginal.value) return;

  const deviceId = movingDeviceOriginal.value.id;
  const newLng = centerData.lng;
  const newLat = centerData.lat;
  const traceId = nextMapPerfTraceId('moveDevice');
  const opStart = perfNow();

  mapPerfLog('logic.move.start', {
    traceId,
    deviceId,
    fromLat: movingDeviceOriginal.value.lat,
    fromLng: movingDeviceOriginal.value.lng,
    toLat: newLat,
    toLng: newLng
  });

  try {
    const daoStart = perfNow();
    await deviceDAO.updateCoordinates(deviceId, String(newLng), String(newLat));
    mapPerfLog('logic.move.dao.finish', {
      traceId,
      deviceId,
      durationMs: roundPerfMs(perfNow() - daoStart)
    });

    uni.showToast({ title: '设备移动成功', icon: 'success' });

    // 只更新当前移动设备及其相邻连线，避免全量重绘造成卡顿
    updateMovedDeviceLocalCache(deviceId, newLat, newLng);
    sendDevicePatch({
      type: 'move',
      traceId,
      id: deviceId,
      lat: newLat,
      lng: newLng
    });
    exitMoveMode();
    mapPerfLog('logic.move.finish', {
      traceId,
      deviceId,
      durationMs: roundPerfMs(perfNow() - opStart)
    });

  } catch (err) {
    mapPerfLog('logic.move.error', {
      traceId,
      deviceId,
      durationMs: roundPerfMs(perfNow() - opStart),
      message: err && (err as any).message ? (err as any).message : String(err)
    });
    console.error('更新设备坐标失败', err);
    uni.showToast({ title: '保存失败，请重试', icon: 'none' });
  }
};

/** 退出移动模式 */
const exitMoveMode = () => {
  isMovingDevice.value = false;
  showDevicePanel.value = false;
  movingDeviceIdProp.value = '';
  movingDeviceOriginal.value = null;
  resumeLocationWatchAfterMove();
};

// 面板相关的预留操作方法
// 抽取公共方法：选中一个设备并飞过去
const selectDevice = (device: any) => {
  const displayDevice = withMovedDeviceCoordinateOverride(device);
  const lat = parseFloat(displayDevice.latitude);
  const lng = parseFloat(displayDevice.longitude);

  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
    uni.showToast({ title: '该设备坐标无效', icon: 'none' });
    return;
  }

  // 计算距离
  let refLat: number, refLng: number;
  if (DEBUG_ENABLED && debugLocation.lat !== null && debugLocation.lng !== null) {
    refLat = debugLocation.lat;
    refLng = debugLocation.lng;
  } else {
    refLat = userLocation.value.lat;
    refLng = userLocation.value.lng;
  }

  const dist = (refLat !== 0 || refLng !== 0)
    ? calculateDistance(refLat, refLng, lat, lng)
    : '未定位';

  currentDeviceInfo.value = {
    id: displayDevice.id || '',
    name: displayDevice.name || '未知设备',
    distance: dist,
    lng: lng.toFixed(8),
    lat: lat.toFixed(8),
    deviceType: displayDevice.device_type || ''
  };

  // 飞到该设备位置
  mapConfig.center = [lat, lng];
  mapConfig.actionType = 'flyTo';
  mapConfig.actionId++;
};

const prevDevice = () => {
  const devices = devicesCache;
  if (!devices || devices.length === 0) return;

  const currentIndex = devices.findIndex(
    (d: any) => String(d.id) === String(currentDeviceInfo.value.id)
  );

  if (currentIndex <= 0) {
    uni.showToast({ title: '已经是第一个设备了', icon: 'none' });
    return;
  }

  selectDevice(devices[currentIndex - 1]);
};

const nextDevice = () => {
  const devices = devicesCache;
  if (!devices || devices.length === 0) return;

  const currentIndex = devices.findIndex(
    (d: any) => String(d.id) === String(currentDeviceInfo.value.id)
  );

  if (currentIndex === -1 || currentIndex >= devices.length - 1) {
    uni.showToast({ title: '已经是最后一个设备了', icon: 'none' });
    return;
  }

  selectDevice(devices[currentIndex + 1]);
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

  // 构建三种地图的 URL
  const mapList = [
    {
      name: '高德地图',
      url: platform === 'android'
        ? `androidamap://route/plan/?sourceApplication=lineCollect&dlat=${lat}&dlon=${lng}&dname=${name}&dev=1&t=2`
        : `iosamap://path?sourceApplication=lineCollect&dlat=${lat}&dlon=${lng}&dname=${name}&dev=1&t=2`,
      downloadUrl: platform === 'android'
        ? 'https://mobile.amap.com/'
        : 'https://apps.apple.com/cn/app/id461703208'
    },
    {
      name: '百度地图',
      url: `baidumap://map/direction?destination=latlng:${lat},${lng}|name:${name}&coord_type=wgs84&mode=walking&src=lineCollect`,
      downloadUrl: platform === 'android'
        ? 'https://map.baidu.com/zt/client/index/'
        : 'https://apps.apple.com/cn/app/id452186370'
    }
  ];

  uni.showActionSheet({
    itemList: mapList.map(m => m.name),
    success: (res) => {
      const selected = mapList[res.tapIndex];
      plus.runtime.openURL(selected.url, function () {
        uni.showModal({
          title: '提示',
          content: `未检测到${selected.name}，是否前往下载？`,
          confirmText: '取消',
          cancelText: '去下载',
          confirmColor: '#999999',
          cancelColor: '#007aff',
          success: (modalRes) => {
            if (modalRes.cancel) {
              // 点的是左边的"去下载"
              plus.runtime.openURL(selected.downloadUrl);
            }
          }
        });
      });
    }
  });
  // #endif

  // #ifdef H5
  const h5MapList = [
    { name: '高德地图', url: `https://uri.amap.com/navigation?to=${lng},${lat},${name}&mode=walk&coordinate=wgs84` },
    { name: '百度地图', url: `https://api.map.baidu.com/direction?destination=latlng:${lat},${lng}|name:${name}&coord_type=wgs84&mode=walking&output=html&src=lineCollect` }
  ];

  uni.showActionSheet({
    itemList: h5MapList.map(m => m.name),
    success: (res) => {
      window.open(h5MapList[res.tapIndex].url);
    }
  });
  // #endif
};

const handleDetails = () => {
  const info = currentDeviceInfo.value;
  let url;
  if (info.deviceType === 'station') {
    url = `/pages/device/edit_Station?lineId=${lineId.value}&lineName=${encodeURIComponent(lineName.value)}&deviceType=${info.deviceType}&lat=${Number(info.lat).toFixed(8)}&lng=${Number(info.lng).toFixed(8)}&deviceId=${info.id}`;
  } else {
    url = `/pages/device/edit?lineId=${lineId.value}&lineName=${encodeURIComponent(lineName.value)}&deviceType=${info.deviceType}&lat=${Number(info.lat).toFixed(8)}&lng=${Number(info.lng).toFixed(8)}&deviceId=${info.id}`;
  }

  markDevicesDirty(`edit:${info.deviceType || 'unknown'}`);

  uni.navigateTo({
    url,
    fail: (err) => {
      console.error('跳转失败:', err);
      uni.showToast({ title: '页面跳转失败', icon: 'none' });
    }
  });
};

const handleMove = () => {
  const info = currentDeviceInfo.value;
  const lat = parseFloat(info.lat);
  const lng = parseFloat(info.lng);

  if (!info.id || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
    uni.showToast({ title: '设备坐标无效', icon: 'none' });
    return;
  }

  // 保存原始设备信息，供取消时飞回
  movingDeviceOriginal.value = {
    id: info.id,
    lat,
    lng,
    name: info.name,
    deviceType: info.deviceType
  };

  pauseLocationWatchForMove();

  // 进入移动模式
  isMovingDevice.value = true;

  // 通知 RenderJS 隐藏该设备的 marker 和连线
  movingDeviceIdProp.value = info.id;

  // 飞到设备位置（十字准星对准）
  mapConfig.center = [lat, lng];
  mapConfig.actionType = 'flyTo';
  mapConfig.actionId++;
};

const syncDeletedDevicesCache = (deleteResult: any, traceId = '') => {
  const deletedIds = new Set((deleteResult?.deletedIds || []).map((id: any) => String(id)));
  const brokenPrevIds = new Set((deleteResult?.brokenPrevIds || []).map((id: any) => String(id)));

  devicesCache = devicesCache
    .filter((device: any) => !deletedIds.has(String(device.id)))
    .map((device: any) => {
      if (!brokenPrevIds.has(String(device.id))) return device;
      return {
        ...device,
        prev_id: ''
      };
    });

  mapPerfLog('logic.delete.cacheSync.finish', {
    traceId,
    deletedIdCount: deletedIds.size,
    brokenPrevCount: brokenPrevIds.size,
    currentTotalDevices: devicesCache.length
  });
};

const handleDelete = () => {
  const info = currentDeviceInfo.value;
  if (!info.id) {
    uni.showToast({ title: '设备信息异常', icon: 'none' });
    return;
  }

  uni.showModal({
    title: '确认删除',
    content: `确定要删除设备"${info.name || '未知设备'}"及其子设备吗？`,
    confirmText: '取消',
    cancelText: '确定',
    cancelColor: '#ff4d4f',
    confirmColor: '#666666',
    success: async (res) => {
      if (!res.cancel) return;
      const traceId = nextMapPerfTraceId('deleteDevice');
      const opStart = perfNow();
      mapPerfLog('logic.delete.start', {
        traceId,
        deviceId: info.id,
        deviceName: info.name,
        beforeTotalDevices: devicesCache.length
      });
      try {
        uni.showLoading({ title: '删除中...' });
        const daoStart = perfNow();
        const deleteResult = await deviceDAO.deleteWithChildrenAndBreak(info.id);
        mapPerfLog('logic.delete.dao.finish', {
          traceId,
          deviceId: info.id,
          durationMs: roundPerfMs(perfNow() - daoStart),
          deletedIdCount: deleteResult?.deletedIdCount || 0,
          brokenPrevCount: deleteResult?.brokenPrevCount || 0
        });

        // 关闭面板 & 清除选中态
        showDevicePanel.value = false;
        selectedDeviceIdProp.value = '';
        currentDeviceInfo.value = {
          id: '', name: '', distance: '', lng: '', lat: '', deviceType: ''
        };

        syncDeletedDevicesCache(deleteResult || { deletedIds: [info.id], brokenPrevIds: [] }, traceId);
        sendDevicePatch({
          type: 'delete',
          traceId,
          id: info.id,
          deletedIds: deleteResult?.deletedIds || [info.id],
          brokenPrevIds: deleteResult?.brokenPrevIds || []
        });
        markDevicesDirty('delete-patch');
        uni.hideLoading();
        uni.showToast({ title: '删除成功', icon: 'success' });
        mapPerfLog('logic.delete.finish', {
          traceId,
          deviceId: info.id,
          patchSent: true,
          currentTotalDevices: devicesCache.length,
          durationMs: roundPerfMs(perfNow() - opStart)
        });
      } catch (err) {
        uni.hideLoading();
        mapPerfLog('logic.delete.error', {
          traceId,
          deviceId: info.id,
          durationMs: roundPerfMs(perfNow() - opStart),
          message: err && (err as any).message ? (err as any).message : String(err)
        });
        console.error('删除设备失败:', err);
        uni.showToast({ title: '删除失败，请重试', icon: 'none' });
      }
    }
  });
};

/** 根据设备类型生成 SVG data URI，用于移动模式中心标记 */
const movingDeviceIconUri = computed(() => {
  if (!movingDeviceOriginal.value) return '';
  return getPinSvgUri(movingDeviceOriginal.value.deviceType);
});

/** 计算移动设备的颜色（杆塔有子设备时为绿色，否则为蓝色） */
const movingDeviceColor = computed(() => {
  if (!movingDeviceOriginal.value) return null;
  const device = movingDeviceOriginal.value;
  if (device.deviceType === 'pole') {
    // 检查是否有子设备
    const hasChildren = devicesCache.some(d => d.parent_id === device.id);
    return hasChildren ? { r: 3, g: 218, b: 107 } : { r: 59, g: 191, b: 251 };
  } else {
    // 其他设备类型默认蓝色
    return { r: 59, g: 191, b: 251 };
  }
});

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
let devicesCache: any[] = [];

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

const lineId = ref('');
const lineName = ref('');

// 名称显示开关，默认显示
const showDeviceNames = ref(true);

// 标记显示配置
const markerDisplayConfig = {
  maxVisibleCount: 40,
  fullDisplayZoom: 16,
  endpointOnlyZoom: 11,
  scaleBaseZoom: 13,
  minScale: 0.35,
  maxScale: 1,
  moveMaxVisibleCount: 24,
  keepSpanLabelsInMove: true
};


/** 跳转到节点搜索页面 */
const goToDeviceSearch = () => {
  uni.navigateTo({
    url: `/pages/device/preNode?lineId=${lineId.value}&lineName=${encodeURIComponent(lineName.value)}`,
    events: {
      selectDevice: (device: any) => {
        searchDevice(device)
      }
    }
  })
};

const searchDevice = (device: any) => {
  // 1. 在已加载的设备列表中查找含坐标的完整设备记录
  const devices = devicesCache;
  const found = devices.find((d: any) => String(d.id) === String(device.id));

  if (!found) {
    uni.showToast({ title: '地图上未找到该设备', icon: 'none' });
    return;
  }

  // 2. 复用 selectDevice：计算距离、更新面板信息、flyTo
  selectDevice(found);
  showDevicePanel.value = true;

  // 3. 通知 RenderJS 对该设备名称执行红色闪烁 5 次
  //    用 ts 保证每次搜索同一设备时 prop 也会变化，从而触发 watch
  blinkDeviceIdProp.value = { id: String(device.id), ts: Date.now() };
};


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
  if (mapConfig.zoom < 25) {
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
    const device = data.device;
    selectedDeviceIdProp.value = String(data.device?.id || '');

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
      lng: Number(device.lng).toFixed(8),
      lat: Number(device.lat).toFixed(8),
      deviceType: device.device_type || ''
    };
    showDevicePanel.value = true;
  } else if (data.type === 'click') {
    // 移动模式下忽略地图空白点击
    if (isMovingDevice.value) return;
    // 点击地图时，清空选中设备
    selectedDeviceIdProp.value = '';
    // 点击地图时，关闭设备列表面板
    showDevicePanel.value = false;
    if (isFabOpen.value) {
      isFabOpen.value = false;
    }
    // DEBUG START
    onMapClickDebug({ lat: data.lat, lng: data.lng })
    // DEBUG END
  } else if (data.type === 'confirmMoveResult') {
    // 新增：处理移动确认结果
    onConfirmMoveResult({ lat: data.lat, lng: data.lng });
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
  { name: '电缆拐点', deviceType: 'cable_turning_point' },
  { name: '变压器', deviceType: 'transformer' },
  { name: '计量信息', deviceType: 'meter' },
  { name: '站房', deviceType: 'station' },
  { name: '问题', deviceType: 'question' }
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

// 跳转到设备编辑页
const handleFabClick = (item: any) => {
  isFabOpen.value = false;
  // DEBUG START — 优先使用假定位坐标
  let lat, lng;
  if (DEBUG_ENABLED && debugLocation.lat !== null && debugLocation.lng !== null) {
    lat = debugLocation.lat;
    lng = debugLocation.lng;
  } else {
    lat = mapConfig.center[0];
    lng = mapConfig.center[1];
    const randomizeLast2 = (coord: number): number => {
      const str = coord.toFixed(8);
      const rand = String(Math.floor(Math.random() * 100)).padStart(2, '0');
      return parseFloat(str.slice(0, -2) + rand);
    };
    lat = randomizeLast2(lat);
    lng = randomizeLast2(lng);
  }
  // DEBUG END
  // 站房单独处理
  let url;
  if (item.deviceType === 'station') {
    url = `/pages/device/edit_Station?lineId=${lineId.value}&lineName=${encodeURIComponent(lineName.value)}&deviceType=${item.deviceType}&lat=${Number(lat).toFixed(8)}&lng=${Number(lng).toFixed(8)}`;
  } else {
    url = `/pages/device/edit?lineId=${lineId.value}&lineName=${encodeURIComponent(lineName.value)}&deviceType=${item.deviceType}&lat=${Number(lat).toFixed(8)}&lng=${Number(lng).toFixed(8)}`;
  }


  markDevicesDirty(`add:${item.deviceType || 'unknown'}`);

  uni.navigateTo({
    url,
    fail: (err) => {
      console.error('跳转失败:', err);
      uni.showToast({ title: '页面跳转失败', icon: 'none' });
    }
  });
};

const loadDevices = async (reason = 'manual', traceId = '') => {
  const resolvedTraceId = traceId || nextMapPerfTraceId('loadDevices');
  const loadStart = perfNow();
  const beforeStats = getDevicePerfStats(devicesCache || []);
  mapPerfLog('logic.loadDevices.start', {
    traceId: resolvedTraceId,
    reason,
    lineId: lineId.value,
    beforeTotalDevices: beforeStats.totalDevices
  });

  try {
    const daoStart = perfNow();
    const devices = await deviceDAO.findAllByLine(lineId.value);
    const daoDurationMs = roundPerfMs(perfNow() - daoStart);
    const nextDevices = devices || [];
    const nextStats = getDevicePerfStats(nextDevices);
    mapPerfLog('logic.loadDevices.dao.finish', {
      traceId: resolvedTraceId,
      reason,
      lineId: lineId.value,
      durationMs: daoDurationMs,
      ...nextStats
    });

    // 直接赋值给独立 ref，触发 renderjs 的 onDevicesChange
    const assignStart = perfNow();
    const tracePayload = {
      traceId: resolvedTraceId,
      reason,
      op: 'loadDevices',
      assignedAt: Date.now(),
      ...nextStats
    };
    devicePerfTraceProp.value = tracePayload;
    try {
      Object.defineProperty(nextDevices, '__mapPerfTrace', {
        value: tracePayload,
        enumerable: false
      });
    } catch (err) {
      (nextDevices as any).__mapPerfTrace = tracePayload;
    }
    devicesProp.value = nextDevices;
    devicesCache = nextDevices;
    mapPerfLog('logic.loadDevices.assign.finish', {
      traceId: resolvedTraceId,
      reason,
      durationMs: roundPerfMs(perfNow() - assignStart),
      totalDevices: nextStats.totalDevices
    });

    movedDeviceCoordinateOverrides.clear();
    devicesLoaded.value = true;
    loadedDevicesLineId.value = lineId.value;
    devicesDirty.value = false;
    mapPerfLog('logic.loadDevices.finish', {
      traceId: resolvedTraceId,
      reason,
      durationMs: roundPerfMs(perfNow() - loadStart),
      ...nextStats
    });
    return true;
  } catch (e) {
    mapPerfLog('logic.loadDevices.error', {
      traceId: resolvedTraceId,
      reason,
      durationMs: roundPerfMs(perfNow() - loadStart),
      message: e && (e as any).message ? (e as any).message : String(e)
    });
    console.error('加载设备列表失败:', e);
    return false;
  }
};

const loadDevicesAsAddPatch = async (reason = 'add', traceId = '') => {
  const resolvedTraceId = traceId || nextMapPerfTraceId('addPatch');
  const loadStart = perfNow();
  const previousDevices = devicesCache || [];
  const beforeStats = getDevicePerfStats(previousDevices);
  mapPerfLog('logic.addPatch.start', {
    traceId: resolvedTraceId,
    reason,
    lineId: lineId.value,
    beforeTotalDevices: beforeStats.totalDevices
  });

  try {
    const daoStart = perfNow();
    const devices = await deviceDAO.findAllByLine(lineId.value);
    const daoDurationMs = roundPerfMs(perfNow() - daoStart);
    const nextDevices = devices || [];
    const nextStats = getDevicePerfStats(nextDevices);
    const diff = diffDeviceLists(previousDevices, nextDevices);

    mapPerfLog('logic.addPatch.dao.finish', {
      traceId: resolvedTraceId,
      reason,
      lineId: lineId.value,
      durationMs: daoDurationMs,
      addedCount: diff.addedDevices.length,
      removedCount: diff.removedIds.length,
      ...nextStats
    });

    if (diff.removedIds.length > 0) {
      mapPerfLog('logic.addPatch.fallback', {
        traceId: resolvedTraceId,
        reason,
        fallbackReason: 'removed-devices-detected',
        addedCount: diff.addedDevices.length,
        removedCount: diff.removedIds.length
      });
      return false;
    }

    devicesCache = nextDevices;
    movedDeviceCoordinateOverrides.clear();
    devicesLoaded.value = true;
    loadedDevicesLineId.value = lineId.value;
    devicesDirty.value = false;

    if (diff.addedDevices.length > 0) {
      sendDevicePatch({
        type: 'add',
        traceId: resolvedTraceId,
        devices: diff.addedDevices
      });
    }

    mapPerfLog('logic.addPatch.finish', {
      traceId: resolvedTraceId,
      reason,
      addedCount: diff.addedDevices.length,
      currentTotalDevices: devicesCache.length,
      patchSent: diff.addedDevices.length > 0,
      durationMs: roundPerfMs(perfNow() - loadStart)
    });
    return true;
  } catch (e) {
    mapPerfLog('logic.addPatch.error', {
      traceId: resolvedTraceId,
      reason,
      durationMs: roundPerfMs(perfNow() - loadStart),
      message: e && (e as any).message ? (e as any).message : String(e)
    });
    console.error('增量加载新增设备失败:', e);
    return false;
  }
};

const loadDevicesAsUpdatePatch = async (reason = 'edit', traceId = '') => {
  const resolvedTraceId = traceId || nextMapPerfTraceId('updatePatch');
  const loadStart = perfNow();
  const previousDevices = devicesCache || [];
  const beforeStats = getDevicePerfStats(previousDevices);
  mapPerfLog('logic.updatePatch.start', {
    traceId: resolvedTraceId,
    reason,
    lineId: lineId.value,
    beforeTotalDevices: beforeStats.totalDevices
  });

  try {
    const daoStart = perfNow();
    const devices = await deviceDAO.findAllByLine(lineId.value);
    const daoDurationMs = roundPerfMs(perfNow() - daoStart);
    const nextDevices = devices || [];
    const nextStats = getDevicePerfStats(nextDevices);
    const diff = diffDeviceLists(previousDevices, nextDevices);

    mapPerfLog('logic.updatePatch.dao.finish', {
      traceId: resolvedTraceId,
      reason,
      lineId: lineId.value,
      durationMs: daoDurationMs,
      addedCount: diff.addedDevices.length,
      updatedCount: diff.updatedDevices.length,
      removedCount: diff.removedIds.length,
      ...nextStats
    });

    if (diff.removedIds.length > 0) {
      mapPerfLog('logic.updatePatch.fallback', {
        traceId: resolvedTraceId,
        reason,
        fallbackReason: 'removed-devices-detected',
        addedCount: diff.addedDevices.length,
        updatedCount: diff.updatedDevices.length,
        removedCount: diff.removedIds.length
      });
      return false;
    }

    devicesCache = nextDevices;
    movedDeviceCoordinateOverrides.clear();
    devicesLoaded.value = true;
    loadedDevicesLineId.value = lineId.value;
    devicesDirty.value = false;

    if (diff.updatedDevices.length > 0 && diff.addedDevices.length > 0) {
      sendDevicePatch({
        type: 'diff',
        traceId: resolvedTraceId,
        updatedDevices: diff.updatedDevices,
        addedDevices: diff.addedDevices
      });
    } else if (diff.updatedDevices.length > 0) {
      sendDevicePatch({
        type: 'update',
        traceId: resolvedTraceId,
        devices: diff.updatedDevices
      });
    } else if (diff.addedDevices.length > 0) {
      sendDevicePatch({
        type: 'add',
        traceId: resolvedTraceId,
        devices: diff.addedDevices
      });
    }

    mapPerfLog('logic.updatePatch.finish', {
      traceId: resolvedTraceId,
      reason,
      addedCount: diff.addedDevices.length,
      updatedCount: diff.updatedDevices.length,
      currentTotalDevices: devicesCache.length,
      patchSent: diff.updatedDevices.length > 0 || diff.addedDevices.length > 0,
      durationMs: roundPerfMs(perfNow() - loadStart)
    });
    return true;
  } catch (e) {
    mapPerfLog('logic.updatePatch.error', {
      traceId: resolvedTraceId,
      reason,
      durationMs: roundPerfMs(perfNow() - loadStart),
      message: e && (e as any).message ? (e as any).message : String(e)
    });
    console.error('增量更新设备失败:', e);
    return false;
  }
};

const devicesLoaded = ref(false);
const loadedDevicesLineId = ref('');
const devicesDirty = ref(true);

const getDevicesReloadReason = () => {
  if (!devicesLoaded.value) return 'initial';
  if (loadedDevicesLineId.value !== lineId.value) return 'line-changed';
  if (devicesDirty.value) return pendingDevicesDirtyReason || 'dirty';
  return 'clean';
};

const markDevicesDirty = (reason = 'unknown') => {
  devicesDirty.value = true;
  pendingDevicesDirtyReason = reason;
  mapPerfLog('logic.devicesDirty.mark', {
    reason,
    lineId: lineId.value,
    currentTotalDevices: devicesCache.length
  });
};

const shouldReloadDevices = () => {
  return !devicesLoaded.value
    || loadedDevicesLineId.value !== lineId.value
    || devicesDirty.value;
};

const loadDevicesIfNeeded = async () => {
  const reason = getDevicesReloadReason();
  if (!shouldReloadDevices()) {
    mapPerfLog('logic.loadDevices.skip', {
      reason,
      lineId: lineId.value,
      currentTotalDevices: devicesCache.length
    });
    return;
  }

  const traceId = nextMapPerfTraceId('reloadDevices');
  let loaded = false;
  if (reason.indexOf('add:') === 0 && devicesCache.length > 0) {
    loaded = await loadDevicesAsAddPatch(reason, traceId);
    if (!loaded) {
      loaded = await loadDevices(`${reason}:fallback`, traceId);
    }
  } else if (reason.indexOf('edit:') === 0 && devicesCache.length > 0) {
    loaded = await loadDevicesAsUpdatePatch(reason, traceId);
    if (!loaded) {
      loaded = await loadDevices(`${reason}:fallback`, traceId);
    }
  } else {
    loaded = await loadDevices(reason, traceId);
  }

  if (loaded) {
    pendingDevicesDirtyReason = '';
  }
};

onLoad((options) => {
  if (options && options.lineId) {
    lineId.value = options.lineId;
  }
  if (options && options.lineName) {
    lineName.value = decodeURIComponent(options.lineName);
  }

  uni.$on('map-message', handleMapMessage);
  isInitialLocating.value = true;
  stopLocationWatch();
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
    fail: (err) => {
      uni.hideLoading();
      console.warn('首次获取定位失败:', err);
      uni.showToast({ title: '获取定位失败', icon: 'none' });
      // 即使首次失败也启动持续定位，后续可能恢复
    },
    complete: () => {
      isInitialLocating.value = false;
      if (isMapPageVisible.value && !isMovingDevice.value) {
        startLocationWatch();
      }
    }
  });
});

// ← 新增：每次页面显示时重新加载设备（包括从编辑页返回时）
onShow(() => {
  isMapPageVisible.value = true;
  mapPerfLog('logic.onShow', {
    lineId: lineId.value,
    reloadNeeded: shouldReloadDevices(),
    reason: getDevicesReloadReason(),
    currentTotalDevices: devicesCache.length
  });
  loadDevicesIfNeeded();
  if (!isInitialLocating.value && !isMovingDevice.value) {
    startLocationWatch();
  }
});

onHide(() => {
  isMapPageVisible.value = false;
  stopLocationWatch();
});

onUnmounted(() => {
  uni.$off('map-message', handleMapMessage);
  isMapPageVisible.value = false;
  stopLocationWatch();
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
import { getMapSvg } from '@/static/device_svgs.js';
import { haversineDistance } from '@/utils/common.js';
export default {
  data() {
    return {
      map: null,
      layers: {},
      locationMarker: null,
      deviceLayerGroup: null,   // ← 新增：设备图层组
      pendingDevices: null,     // ← 新增：地图未就绪时暂存设备数据
      pendingDevicesTrace: null,
      tdtKey: 'a30fe8f02deafbdc08192aa8f81c0044',
      pendingConfig: null,
      currentDevicesTrace: null,
      mapPerfEnabled: true,
      showNames: true,
      debugMarker: null, // DEBUG
      deviceMarkers: {}, // deviceId -> L.marker
      devicePolylines: {}, // deviceId -> [L.polyline, ...]
      deviceSpanLabels: {}, // deviceId -> [L.marker, ...]
      spanLabelMarkers: [],
      deviceMap: {},
      topLevelDeviceIds: [],
      prevChildrenMap: {},
      prevTopLevelById: {},
      visibleSampledDeviceIds: {},
      alwaysVisibleDeviceIds: {},
      markerMaxVisibleCount: 60,
      markerFullDisplayZoom: 16,
      markerEndpointOnlyZoom: 10,
      markerScaleBaseZoom: 16,
      markerMinScale: 0.35,
      markerMaxScale: 1,
      moveMaxVisibleCount: 24,
      keepSpanLabelsInMove: true,
      lastMarkerScale: null,
      lastActionId: null,
      hiddenDeviceId: null, // 当前被隐藏的设备ID
      selectedDeviceId: '', // 当前选中的设备ID（用于抬高 zIndex）
      lastSelectedMarkerId: '',
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
      .device-marker-content {
      transform-origin: 14px 34px;
      will-change: transform;
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
    mapPerfNow() {
      if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        return performance.now();
      }
      return Date.now();
    },

    roundPerfMs(value) {
      return Math.round(value * 100) / 100;
    },

    mapPerfLog(event, detail) {
      if (!this.mapPerfEnabled) return;

      var payload = {
        event: event,
        layer: 'render',
        page: 'pages/index/map.vue',
        at: new Date().toISOString()
      };
      detail = detail || {};
      for (var key in detail) {
        payload[key] = detail[key];
      }

      try {
        console.log('[MAP_PERF]', JSON.stringify(payload));
      } catch (err) {
        console.log('[MAP_PERF]', payload);
      }
    },

    getLayerCounts() {
      var markerCount = 0;
      var polylineCount = 0;
      var seenPolylines = {};

      for (var markerId in this.deviceMarkers) {
        if (this.deviceMarkers[markerId]) markerCount++;
      }

      for (var lineId in this.devicePolylines) {
        var lines = this.devicePolylines[lineId] || [];
        for (var i = 0; i < lines.length; i++) {
          var layer = lines[i];
          var key = layer && layer._leaflet_id !== undefined
            ? String(layer._leaflet_id)
            : lineId + ':' + i;
          if (!seenPolylines[key]) {
            seenPolylines[key] = true;
            polylineCount++;
          }
        }
      }

      return {
        markerCount: markerCount,
        polylineCount: polylineCount,
        spanLabelCount: this.spanLabelMarkers ? this.spanLabelMarkers.length : 0,
        topLevelCount: this.topLevelDeviceIds ? this.topLevelDeviceIds.length : 0
      };
    },

    initMap() {
      var initStart = this.mapPerfNow();
      if (!window.L || !this.tdtKey) return;

      const initialCenter = (this.pendingConfig && this.pendingConfig.center)
        ? this.pendingConfig.center
        : [29.5630, 106.5516];
      const initialZoom = (this.pendingConfig && this.pendingConfig.zoom)
        ? this.pendingConfig.zoom
        : 13;

      this.map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true
      }).setView(initialCenter, initialZoom);

      this.updateLayers((this.pendingConfig && this.pendingConfig.layerType) || 'img');

      this.map.on('click', (e) => {
        this.$ownerInstance.callMethod('receiveRenderData', {
          type: 'click',
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      });

      this.map.on('zoomend', () => {
        this.refreshMarkerScale();
        this.refreshMarkerVisibility();
        this.applySelectedMarkerZIndex();
      });

      if (this.pendingConfig) {
        if (this.pendingConfig.actionType === 'initLocate' || this.pendingConfig.actionType === 'locate') {
          this.drawLocationMarker(this.pendingConfig.center);
        }
        if (this.pendingConfig.actionId !== undefined && this.pendingConfig.actionId !== null) {
          this.lastActionId = this.pendingConfig.actionId;
        }
        this.pendingConfig = null;
      } else {
        this.lastActionId = 0;
      }

      // ← 新增：地图初始化完成后，绘制已暂存的设备数据
      var hadPendingDevices = !!this.pendingDevices;
      if (this.pendingDevices) {
        this.drawDevices(this.pendingDevices, this.pendingDevicesTrace || this.currentDevicesTrace);
        this.pendingDevices = null;
        this.pendingDevicesTrace = null;
      }

      this.mapPerfLog('render.initMap.finish', {
        durationMs: this.roundPerfMs(this.mapPerfNow() - initStart),
        hadPendingDevices: hadPendingDevices,
        zoom: this.map && this.map.getZoom ? this.map.getZoom() : null
      });
    },

    applyConfig(config) {
      if (!this.map || !config) return;

      if (config.actionType === 'initLocate') {
        this.map.setView(config.center, config.zoom);
        this.drawLocationMarker(config.center);
      }
      else if (config.actionType === 'locate') {
        // 飞行期间禁止拖拽
        this.map.dragging.disable();
        this.map.flyTo(config.center, config.zoom, { duration: 0.3 });
        this.drawLocationMarker(config.center);
        // 飞行结束后恢复拖拽
        var self = this;
        this.map.once('moveend', function() {
          self.map.dragging.enable();
        });
      }
      else if (config.actionType === 'updateLocation') {
        // 仅更新蓝点位置，不移动地图视野
        this.drawLocationMarker(config.center);
      }
      else if (config.actionType === 'zoom') {
        this.map.setZoom(config.zoom);
      }
      else if (config.actionType === 'layer') {
        this.updateLayers(config.layerType);
      }else if (config.actionType === 'flyTo') {
        // 如果当前缩放太小，自动放大到 16 级；否则保持当前缩放
        var targetZoom = Math.max(this.map.getZoom(), 16);
        // 飞行期间禁止拖拽
        this.map.dragging.disable();
        this.map.flyTo(config.center, targetZoom, { duration: 0.3 });
        // 飞行结束后恢复拖拽
        var self = this;
        this.map.once('moveend', function() {
          self.map.dragging.enable();
        });
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

      var actionId = newValue.actionId;
      if (actionId !== undefined && actionId !== null) {
        if (this.lastActionId === actionId) return;
        this.lastActionId = actionId;
      }

      this.applyConfig(newValue);
    },

    /** 设备数据变化时触发（独立 prop 通道） */
    onDevicesChange(newValue) {
      var trace = (newValue && newValue.__mapPerfTrace) || this.currentDevicesTrace || {};
      this.mapPerfLog('render.onDevicesChange', {
        traceId: trace.traceId || '',
        reason: trace.reason || '',
        deviceCount: newValue ? newValue.length : 0,
        mapReady: !!this.map
      });

      if (this.map) {
        this.drawDevices(newValue || [], trace);
      } else {
        this.pendingDevices = newValue;
        this.pendingDevicesTrace = trace;
      }
    },

    onDevicePerfTraceChange(newValue) {
      this.currentDevicesTrace = newValue || null;
      if (!newValue) return;

      this.mapPerfLog('render.deviceTrace.received', {
        traceId: newValue.traceId || '',
        reason: newValue.reason || '',
        op: newValue.op || '',
        totalDevices: newValue.totalDevices || 0,
        validCoordDevices: newValue.validCoordDevices || 0
      });
    },

    onDevicePatchChange(newValue) {
      if (!newValue || !this.map) return;
      if (newValue.type === 'move') {
        this.applyMovePatch(newValue);
      } else if (newValue.type === 'delete') {
        this.applyDeletePatch(newValue);
      } else if (newValue.type === 'add') {
        this.applyAddPatch(newValue);
      } else if (newValue.type === 'update') {
        this.applyUpdatePatch(newValue);
      } else if (newValue.type === 'diff') {
        this.applyDiffPatch(newValue);
      }
    },

    drawLocationMarker(center) {
      if (this.locationMarker) {
        this.locationMarker.setLatLng(center);
        return;
      }
      this.locationMarker = L.circleMarker(center, {
        color: '#fff',
        fillColor: '#2A85FF',
        fillOpacity: 1,
        radius: 8,
        weight: 2
      }).addTo(this.map);
    },

    refreshDeviceNameVisibility() {
      if (!this.map) return;

      var visible = this.showNames && !this.isMoveLightMode();
      for (var id in this.deviceMarkers) {
        var marker = this.deviceMarkers[id];
        var el = marker && marker.getElement ? marker.getElement() : null;
        if (!el) continue;

        var nameSpan = el.querySelector('.device-name-label');
        if (nameSpan) {
          nameSpan.style.display = visible ? 'inline' : 'none';
        }
      }
    },

    onShowNamesChange(newValue) {
      this.showNames = newValue;
      this.refreshDeviceNameVisibility();
    },

    onMarkerDisplayConfigChange(newValue) {
      if (!newValue) return;

      var maxVisibleCount = Number(newValue.maxVisibleCount);
      var fullDisplayZoom = Number(newValue.fullDisplayZoom);
      var endpointOnlyZoom = Number(newValue.endpointOnlyZoom);
      var scaleBaseZoom = Number(newValue.scaleBaseZoom);
      var minScale = Number(newValue.minScale);
      var maxScale = Number(newValue.maxScale);
      var moveMaxVisibleCount = Number(newValue.moveMaxVisibleCount);

      if (!isNaN(maxVisibleCount) && maxVisibleCount > 0) {
        this.markerMaxVisibleCount = Math.floor(maxVisibleCount);
      }
      if (!isNaN(fullDisplayZoom) && fullDisplayZoom > 0) {
        this.markerFullDisplayZoom = fullDisplayZoom;
      }
      if (!isNaN(endpointOnlyZoom) && endpointOnlyZoom > 0) {
        this.markerEndpointOnlyZoom = endpointOnlyZoom;
      }
      if (!isNaN(scaleBaseZoom) && scaleBaseZoom > 0) {
        this.markerScaleBaseZoom = scaleBaseZoom;
      }
      if (!isNaN(minScale) && minScale > 0) {
        this.markerMinScale = minScale;
      }
      if (!isNaN(maxScale) && maxScale > 0) {
        this.markerMaxScale = maxScale;
      }
      if (!isNaN(moveMaxVisibleCount) && moveMaxVisibleCount > 0) {
        this.moveMaxVisibleCount = Math.floor(moveMaxVisibleCount);
      }
      if (typeof newValue.keepSpanLabelsInMove === 'boolean') {
        this.keepSpanLabelsInMove = newValue.keepSpanLabelsInMove;
      }

      this.refreshMarkerScale(true);
      this.refreshMarkerVisibility();
      this.applySelectedMarkerZIndex();
    },

    /**
    * 绘制设备标记和连线
    * Marker 样式：倒水滴状定位针 + 内嵌居中 SVG 图标 + 右侧名称标签
    */
    drawDevices(devices, trace) {
      trace = trace || {};
      var traceId = trace.traceId || '';
      var reason = trace.reason || '';
      var drawStart = this.mapPerfNow();
      var clearStart = drawStart;
      var oldLayerRemoved = !!this.deviceLayerGroup;

      // 清除旧图层
      if (this.deviceLayerGroup) {
        this.map.removeLayer(this.deviceLayerGroup);
        this.deviceLayerGroup = null;
      }
      // 重置 marker/polyline 映射
      this.deviceMarkers = {};
      this.devicePolylines = {};
      this.deviceSpanLabels = {};
      this.spanLabelMarkers = [];
      this.deviceMap = {};
      this.topLevelDeviceIds = [];
      this.prevChildrenMap = {};
      this.prevTopLevelById = {};
      this.visibleSampledDeviceIds = {};
      var clearEnd = this.mapPerfNow();

      if (!devices || devices.length === 0) {
        this.mapPerfLog('render.drawDevices.finish', {
          traceId: traceId,
          reason: reason,
          durationMs: this.roundPerfMs(this.mapPerfNow() - drawStart),
          clearMs: this.roundPerfMs(clearEnd - clearStart),
          totalDevices: 0,
          markerCount: 0,
          polylineCount: 0,
          spanLabelCount: 0,
          oldLayerRemoved: oldLayerRemoved
        });
        return;
      }

      this.deviceLayerGroup = L.layerGroup().addTo(this.map);
      var self = this; // 保存 this 引用

      // 构建设备ID到设备对象的映射，用于快速查找
      var deviceMap = {};
      var topLevelDevices = [];
      var validCoordCount = 0;
      var invalidCoordCount = 0;
      var childDeviceCount = 0;
      var markerBuildStart = 0;
      var markerBuildEnd = 0;
      var edgeBuildStart = 0;
      var edgeBuildEnd = 0;
      var drawnPolylineCount = 0;
      var drawnSpanLabelCount = 0;
      // 收集每个设备的子设备信息
      var childDevices = {};
      var childIndexStart = this.mapPerfNow();

      // 第一遍遍历：收集子设备信息
      for (var i = 0; i < devices.length; i++) {
        var device = devices[i];
        if (device.parent_id && device.parent_id !== '') {
          childDeviceCount++;
          if (!childDevices[device.parent_id]) {
            childDevices[device.parent_id] = [];
          }
          childDevices[device.parent_id].push(device.id);
        }
      }
      var childIndexEnd = this.mapPerfNow();

      markerBuildStart = this.mapPerfNow();
      for (var i = 0; i < devices.length; i++) {
        var device=devices[i];
        // 先注册（无坐标的子设备也需要被记录，用于 getTopLevelDevice 追溯）
        deviceMap[device.id] = {
          id: device.id,
          latlng: null,
          prev_id: device.prev_id,
          parent_id: device.parent_id
        };
        var lat=parseFloat(device.latitude);
        var lng=parseFloat(device.longitude);

        if (isNaN(lat) || isNaN(lng) || (lat===0 && lng===0)) {
          invalidCoordCount++;
          continue;
        }
        validCoordCount++;
        var latlng = [lat, lng];
        deviceMap[device.id].latlng = latlng; // 补充有效坐标
        var displayName=device.name || '未命名' ;
        var svgHtml=this.getDeviceSvg(device.device_type);
        // 当设备类型为pole时，根据是否有子设备决定颜色：有子设备为绿色，否则为蓝色
        var color='#3bbffb';
        if (device.device_type === 'pole') {
          if (childDevices[device.id] && childDevices[device.id].length > 0) {
            color = '#03da6b'; // 绿色
          }
        }
        // 倒水滴气泡容器 + 右侧文字
        var html = ''
          + '<div class="device-marker-content" style="display:flex;align-items:flex-start;pointer-events:auto;transform:scale(1);">'
          +  '<div style="'
          +   'position:relative;'
          +   'width:28px;height:28px;'
          +   'display:flex;align-items:center;justify-content:center;'
          +   'flex-shrink:0;'
          +  '">' 
          +   '<!-- 倒水滴背景 -->'
          +   '<div class="device-pin-bg" style="'
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
          +  'display:' + ((self.showNames && !self.isMoveLightMode()) ? 'inline' : 'none') + ';'
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

        // 存储 marker 引用
        this.deviceMarkers[device.id] = marker;

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

        // 解析 attributes，供档距标签使用
        var parsedAttrs = {};
        if (device.attributes) {
          if (typeof device.attributes === 'string') {
            try { parsedAttrs = JSON.parse(device.attributes); } catch(e) {}
          } else if (typeof device.attributes === 'object') {
            parsedAttrs = device.attributes;
          }
        }
        
        // 构建设备映射表，用于后续连线
        deviceMap[device.id] = {
          id: device.id,
          latlng: latlng,
          prev_id: device.prev_id,
          parent_id: device.parent_id,
          attributes: parsedAttrs,
          device_type: device.device_type,
          name: displayName
        };
        
        // 仅顶层设备参与连线
        if (!device.parent_id || device.parent_id === '') {
          topLevelDevices.push(deviceMap[device.id]);
        }
      }
      markerBuildEnd = this.mapPerfNow();

      // 辅助函数：向上追溯 parent_id，返回顶层设备对象
      function getTopLevelDevice(deviceId) {
        var maxDepth = 20;
        var current = deviceMap[deviceId];
        
        while (current && current.parent_id && current.parent_id !== '' && maxDepth-- > 0) {
          var parent = deviceMap[current.parent_id];
          if (!parent) break;
          current = parent;
        }
        return current || null;
      }
      
      // 基于 prev_id 连接顶层设备，支持分支线路
      var prevChildrenMap = {};
      var prevTopLevelById = {};

      edgeBuildStart = this.mapPerfNow();
      for (var j = 0; j < topLevelDevices.length; j++) {
        var currentDevice=topLevelDevices[j];
        if (currentDevice.prev_id && currentDevice.prev_id !=='' ) { 
          // 若 prev_id 指向子设备，自动上溯到其顶层父设备 
          var prevDevice = getTopLevelDevice(currentDevice.prev_id);
          if (!prevDevice || !prevDevice.latlng) continue;
          if (!prevChildrenMap[prevDevice.id]) prevChildrenMap[prevDevice.id] = [];
          prevChildrenMap[prevDevice.id].push(currentDevice.id);
          prevTopLevelById[currentDevice.id] = prevDevice.id;
          
          // 当设备类型为question时，不绘制连线
          // if (currentDevice.device_type === 'question' || prevDevice.device_type === 'question') {
          //   continue;
          // }

          // 判断当前设备是否为"电缆"，决定连线样式
          var isCable = false;
          var attrs = currentDevice.attributes || {};
          if (currentDevice.device_type === 'pole' && attrs.wire_type === '电缆') {
            isCable = true;
          } else if (currentDevice.device_type === 'cable_turning_point' && attrs.cable_type === '电缆') {
            isCable = true;
          }

          var polylineOptions = {
            color: '#ff2d8f',
            weight: 4,
            opacity: 1
          };
          if (isCable) {
            polylineOptions.dashArray = '6, 6';  // 虚线：6px实线 + 6px间隔
            // polylineOptions.color = '#5aa9ff';  // 蓝色
          }

          var polyline = L.polyline([prevDevice.latlng, currentDevice.latlng], polylineOptions)
            .addTo(this.deviceLayerGroup);
          drawnPolylineCount++;

          if (!this.devicePolylines[currentDevice.id]) this.devicePolylines[currentDevice.id] = [];
          this.devicePolylines[currentDevice.id].push(polyline);
          if (!this.devicePolylines[prevDevice.id]) this.devicePolylines[prevDevice.id] = [];
          this.devicePolylines[prevDevice.id].push(polyline);
          // 档距标签
          var spanLength = haversineDistance(
            prevDevice.latlng[0], prevDevice.latlng[1],
            currentDevice.latlng[0], currentDevice.latlng[1]
          );
          var spanInt = Math.round(spanLength);
          if (spanInt > 0) {
            var midLat = (prevDevice.latlng[0] + currentDevice.latlng[0]) / 2;
            var midLng = (prevDevice.latlng[1] + currentDevice.latlng[1]) / 2;
            var spanHtml = '<div style="transform:translate(-50%,-50%);display:inline-block;">'
              + '<span style="'
              +   'white-space:nowrap;color:#fff;'
              +   'font-size:10px;font-weight:bold;'
              +   'text-shadow:-1px -1px 0 #333,1px -1px 0 #333,-1px 1px 0 #333,1px 1px 0 #333;'
              + '">' + spanInt + ' m</span>'
              + '</div>';
            var spanIcon = L.divIcon({
              className: 'device-marker-wrapper',
              html: spanHtml,
              iconSize: [0, 0],
              iconAnchor: [0, 0]
            });
            var spanMarker = L.marker([midLat, midLng], { icon: spanIcon, interactive: false })
            .addTo(this.deviceLayerGroup);
            this.spanLabelMarkers.push(spanMarker);
            drawnSpanLabelCount++;
            
            // 存储标签引用，关联到两端设备，方便移动时隐藏
            if (!this.deviceSpanLabels[currentDevice.id]) this.deviceSpanLabels[currentDevice.id] = [];
            this.deviceSpanLabels[currentDevice.id].push(spanMarker);
            if (!this.deviceSpanLabels[prevDevice.id]) this.deviceSpanLabels[prevDevice.id] = [];
            this.deviceSpanLabels[prevDevice.id].push(spanMarker);
          }
        }
      }
      edgeBuildEnd = this.mapPerfNow();
      // 重绘后恢复选中态对应的层级
      this.deviceMap = deviceMap;
      this.topLevelDeviceIds = topLevelDevices.map(function(item) { return String(item.id); });
      this.prevChildrenMap = prevChildrenMap;
      this.prevTopLevelById = prevTopLevelById;

      var scaleStart = this.mapPerfNow();
      this.refreshMarkerScale(true);
      var visibilityStart = this.mapPerfNow();
      this.refreshMarkerVisibility();
      var selectionStart = this.mapPerfNow();
      this.applySelectedMarkerZIndex(true);
      var drawEnd = this.mapPerfNow();
      var layerCounts = this.getLayerCounts();
      this.mapPerfLog('render.drawDevices.finish', {
        traceId: traceId,
        reason: reason,
        durationMs: this.roundPerfMs(drawEnd - drawStart),
        clearMs: this.roundPerfMs(clearEnd - clearStart),
        childIndexMs: this.roundPerfMs(childIndexEnd - childIndexStart),
        markerBuildMs: this.roundPerfMs(markerBuildEnd - markerBuildStart),
        edgeBuildMs: this.roundPerfMs(edgeBuildEnd - edgeBuildStart),
        refreshScaleMs: this.roundPerfMs(visibilityStart - scaleStart),
        refreshVisibilityMs: this.roundPerfMs(selectionStart - visibilityStart),
        selectionMs: this.roundPerfMs(drawEnd - selectionStart),
        totalDevices: devices.length,
        validCoordDevices: validCoordCount,
        invalidCoordDevices: invalidCoordCount,
        childDevices: childDeviceCount,
        topLevelDevices: topLevelDevices.length,
        markerCount: layerCounts.markerCount,
        polylineCount: layerCounts.polylineCount,
        spanLabelCount: layerCounts.spanLabelCount,
        drawnPolylineCount: drawnPolylineCount,
        drawnSpanLabelCount: drawnSpanLabelCount,
        zoom: this.map && this.map.getZoom ? this.map.getZoom() : null,
        samplingActive: this.isMarkerSamplingActive(),
        endpointOnly: this.isEndpointOnlyMode(),
        oldLayerRemoved: oldLayerRemoved
      });
      setTimeout(function() {
        var deferredStart = self.mapPerfNow();
        self.refreshMarkerScale(true);
        self.refreshMarkerVisibility();
        self.applySelectedMarkerZIndex(true);
        self.mapPerfLog('render.drawDevices.deferredRefresh.finish', {
          traceId: traceId,
          reason: reason,
          durationMs: self.roundPerfMs(self.mapPerfNow() - deferredStart),
          delayMs: 100
        });
      }, 100);
    },

    /** 监听选中设备变化，调整 marker 层级 */
    normalizeDeviceId(value) {
      if (value === null || value === undefined || value === '') return '';
      return String(value);
    },

    getMarkerScale() {
      if (!this.map) return 1;

      var scale = Math.pow(2, this.map.getZoom() - this.markerScaleBaseZoom);
      var minScale = Number(this.markerMinScale);
      var maxScale = Number(this.markerMaxScale);

      if (isNaN(minScale) || minScale <= 0) minScale = 0.35;
      if (isNaN(maxScale) || maxScale <= 0) maxScale = 1;

      var lower = Math.min(minScale, maxScale);
      var upper = Math.max(minScale, maxScale);
      return Math.max(lower, Math.min(upper, scale));
    },

    refreshMarkerScale(force) {
      if (!this.map) return;

      var scale = this.getMarkerScale();
      if (!force && scale === this.lastMarkerScale) return;

      this.lastMarkerScale = scale;
      for (var id in this.deviceMarkers) {
        var marker = this.deviceMarkers[id];
        if (!marker || !marker.getElement) continue;

        var el = marker.getElement();
        if (!el) continue;

        var content = el.querySelector('.device-marker-content');
        if (!content) continue;

        content.style.transformOrigin = '14px 34px';
        content.style.transform = 'scale(' + scale + ')';
      }
    },

    isMoveLightMode() {
      return !!this.hiddenDeviceId;
    },

    getEffectiveMarkerMaxVisibleCount() {
      var maxCount = this.isMoveLightMode()
        ? this.moveMaxVisibleCount
        : this.markerMaxVisibleCount;

      maxCount = Number(maxCount);
      return (!isNaN(maxCount) && maxCount > 0) ? Math.floor(maxCount) : this.markerMaxVisibleCount;
    },

    isMarkerSamplingActive() {
      if (!this.map) return false;
      var count = 0;
      for (var id in this.deviceMarkers) {
        if (this.deviceMarkers[id]) count++;
      }

      if (this.isMoveLightMode()) {
        return count > this.getEffectiveMarkerMaxVisibleCount();
      }

      return count > this.markerMaxVisibleCount && this.map.getZoom() < this.markerFullDisplayZoom;
    },

    isEndpointOnlyMode() {
      if (!this.map) return false;
      return this.map.getZoom() <= this.markerEndpointOnlyZoom;
    },

    getTopLevelId(deviceId) {
      var currentId = this.normalizeDeviceId(deviceId);
      var maxDepth = 20;
      while (currentId && this.deviceMap[currentId] && this.deviceMap[currentId].parent_id && maxDepth-- > 0) {
        var parentId = this.normalizeDeviceId(this.deviceMap[currentId].parent_id);
        if (!parentId || !this.deviceMap[parentId]) break;
        currentId = parentId;
      }
      return currentId;
    },

    normalizeDeviceIdList(values) {
      var result = [];
      if (!values) return result;

      var list = Array.isArray(values) ? values : [values];
      for (var i = 0; i < list.length; i++) {
        var id = this.normalizeDeviceId(list[i]);
        if (id && result.indexOf(id) === -1) result.push(id);
      }
      return result;
    },

    addUniqueId(list, deviceId) {
      var id = this.normalizeDeviceId(deviceId);
      if (id && list.indexOf(id) === -1) list.push(id);
    },

    addAffectedEdgeContext(list, deviceId) {
      var topId = this.getTopLevelId(deviceId);
      if (!topId) return;

      this.addUniqueId(list, topId);
      this.addUniqueId(list, this.prevTopLevelById[topId]);

      var children = this.prevChildrenMap[topId] || [];
      for (var i = 0; i < children.length; i++) {
        this.addUniqueId(list, children[i]);
      }
    },

    rebuildConnectionMaps() {
      var topLevelDeviceIds = [];
      var seenTopLevelIds = {};
      var prevChildrenMap = {};
      var prevTopLevelById = {};

      var addTopLevel = function(id) {
        var normalizedId = String(id);
        if (seenTopLevelIds[normalizedId]) return;
        seenTopLevelIds[normalizedId] = true;
        topLevelDeviceIds.push(normalizedId);
      };

      for (var oldIndex = 0; oldIndex < this.topLevelDeviceIds.length; oldIndex++) {
        var oldTopId = this.normalizeDeviceId(this.topLevelDeviceIds[oldIndex]);
        var oldTopDevice = this.deviceMap[oldTopId];
        if (oldTopDevice && oldTopDevice.latlng && (!oldTopDevice.parent_id || oldTopDevice.parent_id === '')) {
          addTopLevel(oldTopId);
        }
      }

      for (var id in this.deviceMap) {
        var device = this.deviceMap[id];
        if (device && device.latlng && (!device.parent_id || device.parent_id === '')) {
          addTopLevel(id);
        }
      }

      for (var i = 0; i < topLevelDeviceIds.length; i++) {
        var currentId = topLevelDeviceIds[i];
        var currentDevice = this.deviceMap[currentId];
        if (!currentDevice || !currentDevice.prev_id) continue;

        var prevId = this.getTopLevelId(currentDevice.prev_id);
        var prevDevice = prevId ? this.deviceMap[prevId] : null;
        if (!prevDevice || !prevDevice.latlng) continue;

        if (!prevChildrenMap[prevDevice.id]) prevChildrenMap[prevDevice.id] = [];
        prevChildrenMap[prevDevice.id].push(currentDevice.id);
        prevTopLevelById[currentDevice.id] = prevDevice.id;
      }

      this.topLevelDeviceIds = topLevelDeviceIds;
      this.prevChildrenMap = prevChildrenMap;
      this.prevTopLevelById = prevTopLevelById;
    },

    parseDeviceAttributes(rawAttributes) {
      if (!rawAttributes) return {};
      if (typeof rawAttributes === 'string') {
        try {
          return JSON.parse(rawAttributes);
        } catch (e) {
          return {};
        }
      }
      if (typeof rawAttributes === 'object') return rawAttributes;
      return {};
    },

    hasChildDevice(deviceId) {
      var id = this.normalizeDeviceId(deviceId);
      if (!id) return false;

      for (var childId in this.deviceMap) {
        var child = this.deviceMap[childId];
        if (child && this.normalizeDeviceId(child.parent_id) === id) {
          return true;
        }
      }
      return false;
    },

    getDeviceMarkerColor(deviceId) {
      var id = this.normalizeDeviceId(deviceId);
      var device = id ? this.deviceMap[id] : null;
      if (device && device.device_type === 'pole' && this.hasChildDevice(id)) {
        return '#03da6b';
      }
      return '#3bbffb';
    },

    setDeviceMarkerColor(deviceId) {
      var id = this.normalizeDeviceId(deviceId);
      var marker = id ? this.deviceMarkers[id] : null;
      if (!marker || !marker.getElement) return;

      var el = marker.getElement();
      if (!el) return;

      var bg = el.querySelector('.device-pin-bg');
      if (bg) bg.style.background = this.getDeviceMarkerColor(id);
    },

    registerDeviceRecord(device) {
      if (!device || device.id === undefined || device.id === null) return null;

      var id = this.normalizeDeviceId(device.id);
      var lat = parseFloat(device.latitude);
      var lng = parseFloat(device.longitude);
      var hasValidCoord = !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0);
      var parsedAttrs = this.parseDeviceAttributes(device.attributes);

      this.deviceMap[id] = {
        id: id,
        latlng: hasValidCoord ? [lat, lng] : null,
        prev_id: device.prev_id,
        parent_id: device.parent_id,
        attributes: parsedAttrs,
        device_type: device.device_type,
        name: device.name || '未命名'
      };

      return this.deviceMap[id];
    },

    createDeviceMarker(deviceId) {
      var id = this.normalizeDeviceId(deviceId);
      var device = id ? this.deviceMap[id] : null;
      if (!device || !device.latlng || this.deviceMarkers[id]) return false;

      var self = this;
      var displayName = device.name || '未命名';
      var svgHtml = this.getDeviceSvg(device.device_type);
      var color = this.getDeviceMarkerColor(id);
      var html = ''
        + '<div class="device-marker-content" style="display:flex;align-items:flex-start;pointer-events:auto;transform:scale(1);">'
        +  '<div style="'
        +   'position:relative;'
        +   'width:28px;height:28px;'
        +   'display:flex;align-items:center;justify-content:center;'
        +   'flex-shrink:0;'
        +  '">'
        +   '<div class="device-pin-bg" style="'
        +    'position:absolute;top:0;left:0;width:100%;height:100%;'
        +    'background:' + color + ';'
        +    'border-radius:50% 50% 50% 0;'
        +    'transform:rotate(-45deg);'
        +    'box-shadow:-2px 2px 4px rgba(0,0,0,0.3);'
        +   '"></div>'
        +   '<div style="'
        +    'position:relative;z-index:1;'
        +    'width:16px;height:16px;'
        +    'display:flex;align-items:center;justify-content:center;'
        +   '">'
        +    svgHtml
        +   '</div>'
        +  '</div>'
        + '<span class="device-name-label" style="'
        +  'display:' + ((self.showNames && !self.isMoveLightMode()) ? 'inline' : 'none') + ';'
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
      var icon = L.divIcon({
        className: 'device-marker-wrapper',
        html: html,
        iconSize: [28, 34],
        iconAnchor: [14, 34]
      });

      var marker = L.marker(device.latlng, { icon: icon }).addTo(this.deviceLayerGroup);
      this.deviceMarkers[id] = marker;
      this.rebindDeviceMarkerClick(id);
      return true;
    },

    addUniqueLayer(list, layer) {
      if (!layer) return;
      if (list.indexOf(layer) === -1) list.push(layer);
    },

    layerInList(list, layer) {
      if (!list || !layer) return false;
      for (var i = 0; i < list.length; i++) {
        if (list[i] === layer) return true;
      }
      return false;
    },

    removeMapLayer(layer) {
      if (!layer || !this.map) return;
      if (this.deviceLayerGroup && this.deviceLayerGroup.removeLayer) {
        this.deviceLayerGroup.removeLayer(layer);
        return;
      }
      if (this.map.removeLayer) this.map.removeLayer(layer);
    },

    removeLayersFromLookup(lookup, removedLayers, lookupIds) {
      if (!lookup || !removedLayers || removedLayers.length === 0) return;
      var ids = [];
      if (lookupIds && lookupIds.length > 0) {
        for (var lookupIndex = 0; lookupIndex < lookupIds.length; lookupIndex++) {
          var lookupId = this.normalizeDeviceId(lookupIds[lookupIndex]);
          if (lookupId && ids.indexOf(lookupId) === -1) ids.push(lookupId);
        }
      } else {
        for (var lookupKey in lookup) {
          ids.push(lookupKey);
        }
      }

      for (var idIndex = 0; idIndex < ids.length; idIndex++) {
        var id = ids[idIndex];
        var layers = lookup[id] || [];
        var kept = [];
        for (var i = 0; i < layers.length; i++) {
          if (!this.layerInList(removedLayers, layers[i])) kept.push(layers[i]);
        }
        if (kept.length > 0) {
          lookup[id] = kept;
        } else {
          delete lookup[id];
        }
      }
    },

    removeEdgesForDevice(deviceId) {
      var id = this.normalizeDeviceId(deviceId);
      if (!id) return;

      var relatedIds = [];
      var connectedIds = this.getConnectedTopLevelIds(id);
      for (var relatedIndex = 0; relatedIndex < connectedIds.length; relatedIndex++) {
        var relatedId = this.normalizeDeviceId(connectedIds[relatedIndex]);
        if (relatedId && relatedIds.indexOf(relatedId) === -1) relatedIds.push(relatedId);
      }
      if (relatedIds.indexOf(id) === -1) relatedIds.push(id);

      var polylines = [];
      var labels = [];
      var sourcePolylines = this.devicePolylines[id] || [];
      var sourceLabels = this.deviceSpanLabels[id] || [];

      for (var i = 0; i < sourcePolylines.length; i++) {
        this.addUniqueLayer(polylines, sourcePolylines[i]);
      }
      for (var j = 0; j < sourceLabels.length; j++) {
        this.addUniqueLayer(labels, sourceLabels[j]);
      }

      for (var p = 0; p < polylines.length; p++) {
        this.removeMapLayer(polylines[p]);
      }
      for (var l = 0; l < labels.length; l++) {
        this.removeMapLayer(labels[l]);
      }

      this.removeLayersFromLookup(this.devicePolylines, polylines, relatedIds);
      this.removeLayersFromLookup(this.deviceSpanLabels, labels, relatedIds);

      if (labels.length > 0) {
        for (var s = 0; s < labels.length; s++) {
          var labelIndex = this.spanLabelMarkers.indexOf(labels[s]);
          if (labelIndex !== -1) {
            this.spanLabelMarkers.splice(labelIndex, 1);
          }
        }
      }
    },

    drawEdgeBetween(prevDevice, currentDevice) {
      if (!prevDevice || !currentDevice || !prevDevice.latlng || !currentDevice.latlng || !this.deviceLayerGroup) return;

      var isCable = false;
      var attrs = currentDevice.attributes || {};
      if (currentDevice.device_type === 'pole' && attrs.wire_type === '电缆') {
        isCable = true;
      } else if (currentDevice.device_type === 'cable_turning_point' && attrs.cable_type === '电缆') {
        isCable = true;
      }

      var polylineOptions = {
        color: '#ff2d8f',
        weight: 4,
        opacity: 1
      };
      if (isCable) {
        polylineOptions.dashArray = '6, 6';
      }

      var polyline = L.polyline([prevDevice.latlng, currentDevice.latlng], polylineOptions)
        .addTo(this.deviceLayerGroup);

      if (!this.devicePolylines[currentDevice.id]) this.devicePolylines[currentDevice.id] = [];
      this.devicePolylines[currentDevice.id].push(polyline);
      if (!this.devicePolylines[prevDevice.id]) this.devicePolylines[prevDevice.id] = [];
      this.devicePolylines[prevDevice.id].push(polyline);

      var spanLength = haversineDistance(
        prevDevice.latlng[0], prevDevice.latlng[1],
        currentDevice.latlng[0], currentDevice.latlng[1]
      );
      var spanInt = Math.round(spanLength);
      if (spanInt <= 0) return;

      var midLat = (prevDevice.latlng[0] + currentDevice.latlng[0]) / 2;
      var midLng = (prevDevice.latlng[1] + currentDevice.latlng[1]) / 2;
      var spanHtml = '<div style="transform:translate(-50%,-50%);display:inline-block;">'
        + '<span style="'
        +   'white-space:nowrap;color:#fff;'
        +   'font-size:10px;font-weight:bold;'
        +   'text-shadow:-1px -1px 0 #333,1px -1px 0 #333,-1px 1px 0 #333,1px 1px 0 #333;'
        + '">' + spanInt + ' m</span>'
        + '</div>';
      var spanIcon = L.divIcon({
        className: 'device-marker-wrapper',
        html: spanHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });
      var spanMarker = L.marker(
        [midLat, midLng],
        { icon: spanIcon, interactive: false }
      ).addTo(this.deviceLayerGroup);
      this.spanLabelMarkers.push(spanMarker);

      if (!this.deviceSpanLabels[currentDevice.id]) this.deviceSpanLabels[currentDevice.id] = [];
      this.deviceSpanLabels[currentDevice.id].push(spanMarker);
      if (!this.deviceSpanLabels[prevDevice.id]) this.deviceSpanLabels[prevDevice.id] = [];
      this.deviceSpanLabels[prevDevice.id].push(spanMarker);
    },

    getConnectedTopLevelIds(deviceId) {
      var topId = this.getTopLevelId(deviceId);
      var result = [];
      if (!topId) return result;

      result.push(topId);

      var prevId = this.prevTopLevelById[topId];
      if (prevId) result.push(prevId);

      var children = this.prevChildrenMap[topId] || [];
      for (var i = 0; i < children.length; i++) {
        var childId = this.normalizeDeviceId(children[i]);
        if (childId) result.push(childId);
      }

      return result;
    },

    refreshEdgesAroundDevice(deviceId) {
      var topId = this.getTopLevelId(deviceId);
      if (!topId || !this.deviceMap[topId]) return false;

      this.removeEdgesForDevice(topId);

      var currentDevice = this.deviceMap[topId];
      var prevId = this.prevTopLevelById[topId];
      if (prevId && this.deviceMap[prevId]) {
        this.drawEdgeBetween(this.deviceMap[prevId], currentDevice);
      }

      var children = this.prevChildrenMap[topId] || [];
      for (var i = 0; i < children.length; i++) {
        var childId = this.normalizeDeviceId(children[i]);
        if (childId && this.deviceMap[childId]) {
          this.drawEdgeBetween(currentDevice, this.deviceMap[childId]);
        }
      }

      return true;
    },

    rebindDeviceMarkerClick(deviceId) {
      var id = this.normalizeDeviceId(deviceId);
      var marker = this.deviceMarkers[id];
      if (!id || !marker) return;

      var self = this;
      marker.off('click');
      marker.on('click', function(e) {
        if (e.originalEvent) {
          L.DomEvent.stopPropagation(e.originalEvent);
        }

        var device = self.deviceMap[id] || {};
        var latlng = device.latlng || [];
        self.$ownerInstance.callMethod('receiveRenderData', {
          type: 'deviceClick',
          device: {
            id: id,
            name: device.name || '未知设备',
            lat: Number(latlng[0]),
            lng: Number(latlng[1]),
            device_type: device.device_type || ''
          }
        });
      });
    },

    applyAddPatch(patch) {
      var patchStart = this.mapPerfNow();
      var traceId = patch && patch.traceId ? patch.traceId : '';
      var devices = patch && Array.isArray(patch.devices) ? patch.devices : [];

      if (devices.length === 0) {
        this.mapPerfLog('render.applyAddPatch.finish', {
          traceId: traceId,
          durationMs: this.roundPerfMs(this.mapPerfNow() - patchStart),
          addedCount: 0,
          markerAddedCount: 0
        });
        return;
      }

      if (!this.deviceLayerGroup) {
        this.deviceLayerGroup = L.layerGroup().addTo(this.map);
      }

      var beforeCounts = this.getLayerCounts();
      var registerStart = this.mapPerfNow();
      var addedIds = [];
      var parentIdsToRecolor = [];
      var duplicateCount = 0;
      var invalidCoordCount = 0;

      for (var i = 0; i < devices.length; i++) {
        var rawDevice = devices[i];
        var id = rawDevice ? this.normalizeDeviceId(rawDevice.id) : '';
        if (!id) continue;
        if (this.deviceMap[id]) duplicateCount++;

        var registered = this.registerDeviceRecord(rawDevice);
        if (!registered) continue;

        this.addUniqueId(addedIds, id);
        if (!registered.latlng) invalidCoordCount++;
        if (registered.parent_id) {
          this.addUniqueId(parentIdsToRecolor, registered.parent_id);
        }
      }
      var registerEnd = this.mapPerfNow();

      var markerStart = this.mapPerfNow();
      var markerAddedCount = 0;
      for (var m = 0; m < addedIds.length; m++) {
        if (this.createDeviceMarker(addedIds[m])) markerAddedCount++;
      }
      for (var p = 0; p < parentIdsToRecolor.length; p++) {
        this.setDeviceMarkerColor(parentIdsToRecolor[p]);
      }
      var markerEnd = this.mapPerfNow();

      var rebuildStart = this.mapPerfNow();
      this.rebuildConnectionMaps();
      var rebuildEnd = this.mapPerfNow();

      var affectedIds = [];
      for (var a = 0; a < addedIds.length; a++) {
        this.addAffectedEdgeContext(affectedIds, addedIds[a]);
      }
      for (var parentIndex = 0; parentIndex < parentIdsToRecolor.length; parentIndex++) {
        this.addAffectedEdgeContext(affectedIds, parentIdsToRecolor[parentIndex]);
      }

      var edgeStart = this.mapPerfNow();
      var refreshedEdgeCount = 0;
      for (var r = 0; r < affectedIds.length; r++) {
        var affectedId = affectedIds[r];
        if (!this.deviceMap[affectedId]) continue;
        if (this.refreshEdgesAroundDevice(affectedId)) refreshedEdgeCount++;
      }
      var edgeEnd = this.mapPerfNow();

      var refreshStart = this.mapPerfNow();
      this.refreshMarkerScale(true);
      this.refreshMarkerVisibility();
      this.applySelectedMarkerZIndex(true);
      var patchEnd = this.mapPerfNow();
      var afterCounts = this.getLayerCounts();

      this.mapPerfLog('render.applyAddPatch.finish', {
        traceId: traceId,
        durationMs: this.roundPerfMs(patchEnd - patchStart),
        registerMs: this.roundPerfMs(registerEnd - registerStart),
        markerBuildMs: this.roundPerfMs(markerEnd - markerStart),
        rebuildMapsMs: this.roundPerfMs(rebuildEnd - rebuildStart),
        refreshEdgesMs: this.roundPerfMs(edgeEnd - edgeStart),
        refreshVisibilityMs: this.roundPerfMs(patchEnd - refreshStart),
        addedCount: addedIds.length,
        duplicateCount: duplicateCount,
        invalidCoordCount: invalidCoordCount,
        markerAddedCount: markerAddedCount,
        parentRecolorCount: parentIdsToRecolor.length,
        affectedEdgeContextCount: affectedIds.length,
        refreshedEdgeCount: refreshedEdgeCount,
        beforeMarkerCount: beforeCounts.markerCount,
        afterMarkerCount: afterCounts.markerCount,
        beforePolylineCount: beforeCounts.polylineCount,
        afterPolylineCount: afterCounts.polylineCount,
        beforeSpanLabelCount: beforeCounts.spanLabelCount,
        afterSpanLabelCount: afterCounts.spanLabelCount
      });
    },

    applyDiffPatch(patch) {
      var patchStart = this.mapPerfNow();
      var traceId = patch && patch.traceId ? patch.traceId : '';
      var updatedDevices = patch && Array.isArray(patch.updatedDevices) ? patch.updatedDevices : [];
      var addedDevices = patch && Array.isArray(patch.addedDevices) ? patch.addedDevices : [];

      if (updatedDevices.length > 0) {
        this.applyUpdatePatch({
          type: 'update',
          traceId: traceId,
          devices: updatedDevices
        });
      }

      if (addedDevices.length > 0) {
        this.applyAddPatch({
          type: 'add',
          traceId: traceId,
          devices: addedDevices
        });
      }

      this.mapPerfLog('render.applyDiffPatch.finish', {
        traceId: traceId,
        durationMs: this.roundPerfMs(this.mapPerfNow() - patchStart),
        updatedCount: updatedDevices.length,
        addedCount: addedDevices.length
      });
    },

    applyUpdatePatch(patch) {
      var patchStart = this.mapPerfNow();
      var traceId = patch && patch.traceId ? patch.traceId : '';
      var devices = patch && Array.isArray(patch.devices) ? patch.devices : [];

      if (devices.length === 0) {
        this.mapPerfLog('render.applyUpdatePatch.finish', {
          traceId: traceId,
          durationMs: this.roundPerfMs(this.mapPerfNow() - patchStart),
          updatedCount: 0,
          markerRebuiltCount: 0
        });
        return;
      }

      if (!this.deviceLayerGroup) {
        this.deviceLayerGroup = L.layerGroup().addTo(this.map);
      }

      var beforeCounts = this.getLayerCounts();
      var oldAffectedIds = [];
      var updatedIds = [];
      var parentIdsToRecolor = [];
      var invalidCoordCount = 0;

      for (var i = 0; i < devices.length; i++) {
        var rawDevice = devices[i];
        var id = rawDevice ? this.normalizeDeviceId(rawDevice.id) : '';
        if (!id) continue;

        var existingDevice = this.deviceMap[id];
        this.addAffectedEdgeContext(oldAffectedIds, id);
        if (existingDevice) {
          this.addUniqueId(parentIdsToRecolor, existingDevice.parent_id);
        }
        this.addUniqueId(parentIdsToRecolor, rawDevice.parent_id);
        this.addUniqueId(updatedIds, id);
      }

      var removeEdgesStart = this.mapPerfNow();
      for (var oldIndex = 0; oldIndex < oldAffectedIds.length; oldIndex++) {
        this.removeEdgesForDevice(oldAffectedIds[oldIndex]);
      }
      var removeEdgesEnd = this.mapPerfNow();

      var registerStart = this.mapPerfNow();
      var markerRebuiltCount = 0;
      var missingBeforeCount = 0;
      for (var d = 0; d < devices.length; d++) {
        var device = devices[d];
        var deviceId = device ? this.normalizeDeviceId(device.id) : '';
        if (!deviceId) continue;

        if (this.deviceMarkers[deviceId]) {
          this.removeMapLayer(this.deviceMarkers[deviceId]);
          delete this.deviceMarkers[deviceId];
        } else {
          missingBeforeCount++;
        }

        var registered = this.registerDeviceRecord(device);
        if (registered && !registered.latlng) invalidCoordCount++;
        if (registered && this.createDeviceMarker(deviceId)) {
          markerRebuiltCount++;
        }
      }
      var registerEnd = this.mapPerfNow();

      var rebuildStart = this.mapPerfNow();
      this.rebuildConnectionMaps();
      var rebuildEnd = this.mapPerfNow();

      for (var parentIndex = 0; parentIndex < parentIdsToRecolor.length; parentIndex++) {
        this.setDeviceMarkerColor(parentIdsToRecolor[parentIndex]);
      }

      var affectedIds = oldAffectedIds.slice();
      for (var a = 0; a < updatedIds.length; a++) {
        this.addAffectedEdgeContext(affectedIds, updatedIds[a]);
      }
      for (var p = 0; p < parentIdsToRecolor.length; p++) {
        this.addAffectedEdgeContext(affectedIds, parentIdsToRecolor[p]);
      }

      var redrawStart = this.mapPerfNow();
      var refreshedEdgeCount = 0;
      for (var r = 0; r < affectedIds.length; r++) {
        var affectedId = affectedIds[r];
        if (!this.deviceMap[affectedId]) continue;
        if (this.refreshEdgesAroundDevice(affectedId)) refreshedEdgeCount++;
      }
      var redrawEnd = this.mapPerfNow();

      var refreshStart = this.mapPerfNow();
      this.refreshMarkerScale(true);
      this.refreshMarkerVisibility();
      this.applySelectedMarkerZIndex(true);
      var patchEnd = this.mapPerfNow();
      var afterCounts = this.getLayerCounts();

      this.mapPerfLog('render.applyUpdatePatch.finish', {
        traceId: traceId,
        durationMs: this.roundPerfMs(patchEnd - patchStart),
        removeEdgesMs: this.roundPerfMs(removeEdgesEnd - removeEdgesStart),
        markerRebuildMs: this.roundPerfMs(registerEnd - registerStart),
        rebuildMapsMs: this.roundPerfMs(rebuildEnd - rebuildStart),
        refreshEdgesMs: this.roundPerfMs(redrawEnd - redrawStart),
        refreshVisibilityMs: this.roundPerfMs(patchEnd - refreshStart),
        updatedCount: updatedIds.length,
        invalidCoordCount: invalidCoordCount,
        markerRebuiltCount: markerRebuiltCount,
        missingBeforeCount: missingBeforeCount,
        parentRecolorCount: parentIdsToRecolor.length,
        affectedEdgeContextCount: affectedIds.length,
        refreshedEdgeCount: refreshedEdgeCount,
        beforeMarkerCount: beforeCounts.markerCount,
        afterMarkerCount: afterCounts.markerCount,
        beforePolylineCount: beforeCounts.polylineCount,
        afterPolylineCount: afterCounts.polylineCount,
        beforeSpanLabelCount: beforeCounts.spanLabelCount,
        afterSpanLabelCount: afterCounts.spanLabelCount
      });
    },

    applyDeletePatch(patch) {
      var patchStart = this.mapPerfNow();
      var traceId = patch && patch.traceId ? patch.traceId : '';
      var deletedIds = this.normalizeDeviceIdList(patch.deletedIds);
      var brokenPrevIds = this.normalizeDeviceIdList(patch.brokenPrevIds);
      var fallbackId = this.normalizeDeviceId(patch.id);
      if (deletedIds.length === 0 && fallbackId) deletedIds.push(fallbackId);

      if (deletedIds.length === 0) {
        this.mapPerfLog('render.applyDeletePatch.error', {
          traceId: traceId,
          durationMs: this.roundPerfMs(this.mapPerfNow() - patchStart),
          reason: 'missing-deleted-ids'
        });
        return;
      }

      var beforeCounts = this.getLayerCounts();
      var affectedIds = [];
      for (var i = 0; i < deletedIds.length; i++) {
        this.addAffectedEdgeContext(affectedIds, deletedIds[i]);
      }
      for (var b = 0; b < brokenPrevIds.length; b++) {
        this.addAffectedEdgeContext(affectedIds, brokenPrevIds[b]);
      }

      var removeEdgesStart = this.mapPerfNow();
      for (var a = 0; a < affectedIds.length; a++) {
        this.removeEdgesForDevice(affectedIds[a]);
      }
      var removeEdgesEnd = this.mapPerfNow();

      for (var brokenIndex = 0; brokenIndex < brokenPrevIds.length; brokenIndex++) {
        var brokenId = brokenPrevIds[brokenIndex];
        if (this.deviceMap[brokenId]) {
          this.deviceMap[brokenId].prev_id = '';
        }
      }

      var removeMarkersStart = this.mapPerfNow();
      var removedMarkerCount = 0;
      for (var d = 0; d < deletedIds.length; d++) {
        var deletedId = deletedIds[d];
        if (this.deviceMarkers[deletedId]) {
          this.removeMapLayer(this.deviceMarkers[deletedId]);
          removedMarkerCount++;
        }

        delete this.deviceMarkers[deletedId];
        delete this.deviceMap[deletedId];
        delete this.devicePolylines[deletedId];
        delete this.deviceSpanLabels[deletedId];
        delete this.visibleSampledDeviceIds[deletedId];
        delete this.alwaysVisibleDeviceIds[deletedId];

        if (this.hiddenDeviceId && String(this.hiddenDeviceId) === deletedId) {
          this.hiddenDeviceId = null;
        }
        if (this.selectedDeviceId && String(this.selectedDeviceId) === deletedId) {
          this.selectedDeviceId = '';
        }
        if (this.lastSelectedMarkerId && String(this.lastSelectedMarkerId) === deletedId) {
          this.lastSelectedMarkerId = '';
        }
      }
      var removeMarkersEnd = this.mapPerfNow();

      var rebuildStart = this.mapPerfNow();
      this.rebuildConnectionMaps();
      var rebuildEnd = this.mapPerfNow();

      var redrawStart = this.mapPerfNow();
      var refreshedEdgeCount = 0;
      for (var r = 0; r < affectedIds.length; r++) {
        var affectedId = affectedIds[r];
        if (!this.deviceMap[affectedId]) continue;
        if (this.refreshEdgesAroundDevice(affectedId)) refreshedEdgeCount++;
      }
      var redrawEnd = this.mapPerfNow();

      var refreshStart = this.mapPerfNow();
      this.refreshMarkerVisibility();
      this.applySelectedMarkerZIndex(true);
      var patchEnd = this.mapPerfNow();
      var afterCounts = this.getLayerCounts();

      this.mapPerfLog('render.applyDeletePatch.finish', {
        traceId: traceId,
        durationMs: this.roundPerfMs(patchEnd - patchStart),
        removeEdgesMs: this.roundPerfMs(removeEdgesEnd - removeEdgesStart),
        removeMarkersMs: this.roundPerfMs(removeMarkersEnd - removeMarkersStart),
        rebuildMapsMs: this.roundPerfMs(rebuildEnd - rebuildStart),
        redrawEdgesMs: this.roundPerfMs(redrawEnd - redrawStart),
        refreshVisibilityMs: this.roundPerfMs(patchEnd - refreshStart),
        deletedIdCount: deletedIds.length,
        brokenPrevCount: brokenPrevIds.length,
        affectedEdgeContextCount: affectedIds.length,
        refreshedEdgeCount: refreshedEdgeCount,
        removedMarkerCount: removedMarkerCount,
        beforeMarkerCount: beforeCounts.markerCount,
        afterMarkerCount: afterCounts.markerCount,
        beforePolylineCount: beforeCounts.polylineCount,
        afterPolylineCount: afterCounts.polylineCount,
        beforeSpanLabelCount: beforeCounts.spanLabelCount,
        afterSpanLabelCount: afterCounts.spanLabelCount
      });
    },

    applyMovePatch(patch) {
      var patchStart = this.mapPerfNow();
      var traceId = patch && patch.traceId ? patch.traceId : '';
      var id = this.normalizeDeviceId(patch.id);
      var lat = Number(patch.lat);
      var lng = Number(patch.lng);
      if (!id || isNaN(lat) || isNaN(lng)) {
        this.mapPerfLog('render.applyMovePatch.error', {
          traceId: traceId,
          deviceId: id,
          durationMs: this.roundPerfMs(this.mapPerfNow() - patchStart),
          reason: 'invalid-params'
        });
        console.warn('移动 patch 参数无效:', patch);
        return;
      }

      var marker = this.deviceMarkers[id];
      var device = this.deviceMap[id];
      if (!marker || !device) {
        this.mapPerfLog('render.applyMovePatch.error', {
          traceId: traceId,
          deviceId: id,
          durationMs: this.roundPerfMs(this.mapPerfNow() - patchStart),
          reason: 'missing-layer'
        });
        console.warn('移动 patch 找不到设备图层:', patch);
        return;
      }

      var beforeCounts = this.getLayerCounts();
      var latlng = [lat, lng];
      var setLatLngStart = this.mapPerfNow();
      device.latlng = latlng;
      marker.setLatLng(latlng);
      var rebindStart = this.mapPerfNow();
      this.rebindDeviceMarkerClick(id);
      var edgeStart = this.mapPerfNow();
      var edgeRefreshed = this.refreshEdgesAroundDevice(id);
      var visibleStart = this.mapPerfNow();
      this.setDeviceVisible(id, !this.hiddenDeviceId || String(this.hiddenDeviceId) !== id);
      var selectionStart = this.mapPerfNow();

      if (this.selectedDeviceId && String(this.selectedDeviceId) === id) {
        this.applyMarkerSelectionStyle(id);
      }
      var patchEnd = this.mapPerfNow();
      var afterCounts = this.getLayerCounts();
      this.mapPerfLog('render.applyMovePatch.finish', {
        traceId: traceId,
        deviceId: id,
        durationMs: this.roundPerfMs(patchEnd - patchStart),
        setLatLngMs: this.roundPerfMs(rebindStart - setLatLngStart),
        rebindClickMs: this.roundPerfMs(edgeStart - rebindStart),
        refreshEdgesMs: this.roundPerfMs(visibleStart - edgeStart),
        visibilityMs: this.roundPerfMs(selectionStart - visibleStart),
        selectionMs: this.roundPerfMs(patchEnd - selectionStart),
        edgeRefreshed: !!edgeRefreshed,
        beforePolylineCount: beforeCounts.polylineCount,
        afterPolylineCount: afterCounts.polylineCount,
        beforeSpanLabelCount: beforeCounts.spanLabelCount,
        afterSpanLabelCount: afterCounts.spanLabelCount,
        markerCount: afterCounts.markerCount
      });
    },

    addDeviceContextToVisible(visible, deviceId) {
      var id = this.normalizeDeviceId(deviceId);
      if (!id) return;
      visible[id] = true;

      var topId = this.getTopLevelId(id);
      if (topId) {
        visible[topId] = true;

        var prevId = this.prevTopLevelById[topId];
        if (prevId) visible[prevId] = true;

        var children = this.prevChildrenMap[topId] || [];
        for (var i = 0; i < children.length; i++) {
          visible[this.normalizeDeviceId(children[i])] = true;
        }
      }
    },

    addForcedVisibleDevices(visible) {
      this.addDeviceContextToVisible(visible, this.selectedDeviceId);
      this.addDeviceContextToVisible(visible, this.hiddenDeviceId);
      for (var id in this.alwaysVisibleDeviceIds) {
        if (this.alwaysVisibleDeviceIds[id]) {
          this.addDeviceContextToVisible(visible, id);
        }
      }
    },

    samplePath(path, visible, visited, step, endpointOnly) {
      if (!path || path.length === 0) return;

      for (var i = 0; i < path.length; i++) {
        visited[path[i]] = true;
      }

      visible[path[0]] = true;
      visible[path[path.length - 1]] = true;
      if (endpointOnly) return;

      for (var j = 0; j < path.length; j += step) {
        visible[path[j]] = true;
      }
    },

    addSampledPathsFrom(rootId, path, visible, visited, active, step, maxDepth, endpointOnly) {
      var id = this.normalizeDeviceId(rootId);
      if (!id || !this.deviceMarkers[id]) return;

      var nextPath = path.slice();
      nextPath.push(id);

      if (active[id] || maxDepth <= 0) {
        this.samplePath(nextPath, visible, visited, step, endpointOnly);
        return;
      }

      active[id] = true;
      visited[id] = true;

      var children = this.prevChildrenMap[id] || [];
      var hasChildPath = false;
      for (var i = 0; i < children.length; i++) {
        var childId = this.normalizeDeviceId(children[i]);
        if (!childId || !this.deviceMarkers[childId]) continue;
        hasChildPath = true;
        this.addSampledPathsFrom(childId, nextPath, visible, visited, active, step, maxDepth - 1, endpointOnly);
      }

      if (!hasChildPath) {
        this.samplePath(nextPath, visible, visited, step, endpointOnly);
      }

      active[id] = false;
    },

    buildVisibleDeviceIdMap() {
      var visible = {};
      var allMarkerIds = [];
      for (var id in this.deviceMarkers) {
        if (this.deviceMarkers[id]) allMarkerIds.push(String(id));
      }

      if (allMarkerIds.length === 0) return visible;

      var endpointOnly = this.isEndpointOnlyMode();

      if (!endpointOnly && !this.isMarkerSamplingActive()) {
        for (var i = 0; i < allMarkerIds.length; i++) {
          visible[allMarkerIds[i]] = true;
        }
        return visible;
      }

      var topIds = [];
      for (var t = 0; t < this.topLevelDeviceIds.length; t++) {
        var topId = this.normalizeDeviceId(this.topLevelDeviceIds[t]);
        if (topId && this.deviceMarkers[topId]) topIds.push(topId);
      }

      var effectiveCount = topIds.length || allMarkerIds.length;
      var maxVisibleCount = this.getEffectiveMarkerMaxVisibleCount();
      var step = Math.max(1, Math.ceil(effectiveCount / maxVisibleCount));
      var roots = [];
      var visited = {};

      if (topIds.length === 0) {
        visible[allMarkerIds[0]] = true;
        visible[allMarkerIds[allMarkerIds.length - 1]] = true;
        if (endpointOnly) return visible;
        for (var ai = 0; ai < allMarkerIds.length; ai += step) {
          visible[allMarkerIds[ai]] = true;
        }
        this.addForcedVisibleDevices(visible);
        return visible;
      }

      for (var r = 0; r < topIds.length; r++) {
        if (!this.prevTopLevelById[topIds[r]]) roots.push(topIds[r]);
      }
      if (roots.length === 0 && topIds.length > 0) roots.push(topIds[0]);

      for (var ri = 0; ri < roots.length; ri++) {
        this.addSampledPathsFrom(roots[ri], [], visible, visited, {}, step, effectiveCount + 5, endpointOnly);
      }

      for (var ti = 0; ti < topIds.length; ti++) {
        if (!visited[topIds[ti]]) {
          this.addSampledPathsFrom(topIds[ti], [], visible, visited, {}, step, effectiveCount + 5, endpointOnly);
        }
      }

      if (endpointOnly) return visible;

      for (var branchId in this.prevChildrenMap) {
        if ((this.prevChildrenMap[branchId] || []).length > 1) {
          visible[String(branchId)] = true;
        }
      }

      this.addForcedVisibleDevices(visible);
      return visible;
    },

    setLayerDomVisible(layer, visible) {
      if (!layer) return;
      var el = layer.getElement ? layer.getElement() : null;
      if (el) {
        el.style.display = visible ? '' : 'none';
        return;
      }

      if (!visible) {
        setTimeout(function() {
          var delayedEl = layer.getElement ? layer.getElement() : null;
          if (delayedEl) delayedEl.style.display = 'none';
        }, 100);
      }
    },

    refreshSpanLabelVisibility() {
      var visible = (this.isMoveLightMode() && this.keepSpanLabelsInMove)
        ? true
        : !this.isMarkerSamplingActive();
      for (var i = 0; i < this.spanLabelMarkers.length; i++) {
        this.setLayerDomVisible(this.spanLabelMarkers[i], visible);
      }
    },

    refreshMarkerVisibility() {
      if (!this.map) return;

      var visible = this.buildVisibleDeviceIdMap();
      this.visibleSampledDeviceIds = visible;

      for (var id in this.deviceMarkers) {
        var shouldShow = !!visible[id];
        if (this.hiddenDeviceId && String(id) === String(this.hiddenDeviceId)) {
          shouldShow = false;
        }
        this.setLayerDomVisible(this.deviceMarkers[id], shouldShow);
      }

      this.refreshSpanLabelVisibility();
      this.refreshDeviceNameVisibility();
    },

    onSelectedDeviceIdChange(newValue) {
      this.selectedDeviceId = newValue ? String(newValue) : '';
      this.refreshMarkerVisibility();
      this.applySelectedMarkerZIndex();
    },
    
    resetMarkerSelectionStyle(deviceId) {
      var DEFAULT_SHADOW = '-2px 2px 4px rgba(0,0,0,0.3)';
      var id = this.normalizeDeviceId(deviceId);
      if (!id || !this.deviceMarkers[id]) return;

      var marker = this.deviceMarkers[id];
      if (marker.setZIndexOffset) marker.setZIndexOffset(0);

      var el = marker.getElement ? marker.getElement() : null;
      if (el) {
        var bg = el.querySelector('.device-pin-bg');
        if (bg) bg.style.boxShadow = DEFAULT_SHADOW;
      }
    },

    applyMarkerSelectionStyle(deviceId) {
      var SELECTED_SHADOW = '0 0 0 2px #fff, -2px 2px 6px rgba(0,0,0,0.4)';
      var id = this.normalizeDeviceId(deviceId);
      if (!id || !this.deviceMarkers[id]) return;

      var marker = this.deviceMarkers[id];
      if (marker.setZIndexOffset) marker.setZIndexOffset(1000);

      var self = this;
      var applyRing = function () {
        var selEl = marker.getElement ? marker.getElement() : null;
        if (selEl) {
          var selBg = selEl.querySelector('.device-pin-bg');
          if (selBg) selBg.style.boxShadow = SELECTED_SHADOW;
          return true;
        }
        return false;
      };

      if (!applyRing()) {
        // DOM 尚未挂载，延迟重试
        setTimeout(function () {
          if (self.selectedDeviceId === id) applyRing();
        }, 200);
      }
    },

    /** 选中设备抬高 zIndex 并加白色描边，取消选中恢复 */
    applySelectedMarkerZIndex(force) {
      var selectedId = this.normalizeDeviceId(this.selectedDeviceId);
      var previousId = this.normalizeDeviceId(this.lastSelectedMarkerId);

      if (!force && previousId === selectedId) return;

      if (force) {
        for (var id in this.deviceMarkers) {
          this.resetMarkerSelectionStyle(id);
        }
      } else if (previousId && previousId !== selectedId) {
        this.resetMarkerSelectionStyle(previousId);
      }

      if (selectedId) {
        this.applyMarkerSelectionStyle(selectedId);
      }

      this.lastSelectedMarkerId = selectedId;
    },

    onConfirmMoveChange(newValue) {
      if (!newValue || !this.map) return;

      var center = this.map.getCenter();
      this.$ownerInstance.callMethod('receiveRenderData', {
        type: 'confirmMoveResult',
        lat: center.lat,
        lng: center.lng
      });
    },

    /** 监听移动设备ID变化，隐藏/显示对应marker和连线 */
    onMovingDeviceIdChange(newValue) {
      if (!this.map) return;
      var previousHiddenId = this.hiddenDeviceId ? String(this.hiddenDeviceId) : '';
      var nextHiddenId = newValue ? String(newValue) : '';

      if (previousHiddenId && previousHiddenId !== nextHiddenId) {
        this.setDeviceVisible(previousHiddenId, true);
      }

      this.hiddenDeviceId = nextHiddenId || null;
      if (nextHiddenId) {
        this.setDeviceVisible(nextHiddenId, false);
      }
    },

    /** 设置指定设备的 marker 和关联连线的可见性 */
    setDeviceVisible(deviceId, visible) {
      var marker = this.deviceMarkers[deviceId];
      this.setLayerDomVisible(marker, visible);

      // 连线和距离标签不隐藏

      // var polylines = this.devicePolylines[deviceId];
      // if (polylines) {
      //   for (var i = 0; i < polylines.length; i++) {
      //     polylines[i].setStyle({ opacity: visible ? 1 : 0 });
      //   }
      // }

      // var spanLabels = this.deviceSpanLabels && this.deviceSpanLabels[deviceId];
      // if (spanLabels) {
      //   for (var i = 0; i < spanLabels.length; i++) {
      //     spanLabels[i].setOpacity(visible ? 1 : 0);
      //   }
      // }
    },
    
    /**
    * 根据设备类型返回对应的 SVG 图标 HTML
    * 可自行替换各类型的 path 数据
    */
    getDeviceSvg(deviceType) {
      return getMapSvg(deviceType);
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

      this.layers.base = L.tileLayer(layerUrl, { maxNativeZoom: 18,maxZoom: 25 }).addTo(this.map);
      this.layers.label = L.tileLayer(labelUrl, { maxNativeZoom: 18,maxZoom: 25 }).addTo(this.map);
    },
    /** 监听闪烁指令：flyTo 动画结束后对设备名称执行红色闪烁 */
    onBlinkDeviceIdChange(newValue) {
      if (!newValue || !this.map) return;
      var self = this;
      var blinkId = this.normalizeDeviceId(newValue.id);
      if (blinkId) {
        this.alwaysVisibleDeviceIds = {};
        this.alwaysVisibleDeviceIds[blinkId] = true;
        this.refreshMarkerVisibility();
        this.applySelectedMarkerZIndex();
      }
      // flyTo duration 约 0.5 s，延迟 700 ms 确保地图稳定、marker 已渲染
      setTimeout(function() {
        self._blinkDeviceName(newValue.id);
      }, 700);
    },

    /** 找到 marker 的 DOM，驱动名称标签红色闪烁 5 次 */
    _blinkDeviceName(deviceId) {
      var self = this;
      var marker = this.deviceMarkers[deviceId];
      if (!marker) return;
      this.setLayerDomVisible(marker, true);

      var el = marker.getElement ? marker.getElement() : null;
      if (!el) {
        // marker 元素偶尔在 flyTo 结束前仍未挂载，再等一次
        setTimeout(function() {
          var el2 = marker.getElement ? marker.getElement() : null;
          if (el2) self._doBlinkName(el2);
        }, 400);
        return;
      }
      this._doBlinkName(el);
    },

    _doBlinkName(markerEl) {
      var self = this;
      var nameSpan = markerEl.querySelector('.device-name-label');
      if (!nameSpan) return;

      // 临时强制显示（即使"名称"开关为关闭状态，搜索时也应让用户看到闪烁）
      nameSpan.style.display = 'inline';

      var count = 0;
      var totalBlinks = 5;          // 闪烁次数
      var interval = 350;           // 每半拍毫秒数
      var originalColor = '#ffffff';

      var timer = setInterval(function() {
        count++;
        // 奇数拍 → 红色；偶数拍 → 恢复白色
        nameSpan.style.color = (count % 2 === 1) ? '#ff0000' : originalColor;

        if (count >= totalBlinks * 2) {
          clearInterval(timer);
          // 动画结束后恢复颜色，并按当前"名称显示"开关状态决定是否隐藏
          nameSpan.style.color = originalColor;
          nameSpan.style.display = (self.showNames && !self.isMoveLightMode()) ? 'inline' : 'none';
        }
      }, interval);
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

.action-item.delete-action {
  color: #ff4d4f;
  font-weight: 500;
}

.action-item.delete-action:active {
  background-color: rgba(255, 77, 79, 0.08);
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

/* ========== 移动模式 - 中心设备标记 ========== */

/* 锚点：屏幕正中心 */
.move-center-pin {
  position: fixed;
  left: 50%;
  top: calc(50% + (44px + var(--status-bar-height, 44px)) / 2);
  z-index: 9999;
  pointer-events: none;
}

/* 脉冲环 - 提示落点位置 */
.move-pin-pulse {
  position: absolute;
  left: -12px;
  top: -10px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(59, 191, 251, 0.8);
  animation: move-pulse 1.5s ease-out infinite;
}

@keyframes move-pulse {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }

  100% {
    transform: scale(3);
    opacity: 0;
  }
}

/* 中心小圆点 */
.move-pin-dot {
  position: absolute;
  left: -4px;
  top: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3bbffb;
  box-shadow: 0 0 4px rgba(59, 191, 251, 0.6);
}

/* 标记主体（水滴 + 名称横排） */
.move-pin-body {
  position: absolute;
  /*
   * 水滴28×28旋转后，尖端在容器下方约34px处
   * 向上偏移34px使尖端对准屏幕中心
   * 向左偏移14px使水滴水平居中
   */
  left: -14px;
  top: -34px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}

/* 水滴容器 */
.move-pin-head {
  position: relative;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 倒水滴背景 */
.move-pin-teardrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #3bbffb;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  box-shadow: -2px 2px 6px rgba(0, 0, 0, 0.35);
}

/* 设备类型图标 */
.move-pin-icon {
  position: relative;
  z-index: 1;
  width: 16px;
  height: 16px;
}

/* 设备名称 */
.move-pin-name {
  margin-left: 6px;
  margin-top: 4px;
  white-space: nowrap;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  text-shadow:
    -1px -1px 0 #333,
    1px -1px 0 #333,
    -1px 1px 0 #333,
    1px 1px 0 #333;
}
</style>
