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
      :change:debugMarker="mapModule.onDebugMarkerChange"></view>

    <!-- 右侧悬浮工具栏 -->
    <view class="right-tools">
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
        <view class="tool-item" @click="toast('叠加')">
          <text class="icon">📚</text>
          <text class="text">叠加</text>
        </view>
        <view class="tool-item" @click="toast('名称')">
          <text class="icon">👁</text>
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

    <!-- 底部中间悬浮加号及展开菜单 -->
    <view class="bottom-fab-wrapper">
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

// === 核心功能：获取定位 ===
const locateUser = () => {
  uni.showLoading({ title: '定位中...' });
  getLocation({
    type: 'wgs84',
    success: (res) => {
      uni.hideLoading();
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
  if (data.type === 'click') {
    console.log(`点击坐标: ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`);
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
  const url = `/pages/device/edit?lineId=${lineId.value}&deviceType=${item.deviceType}&lat=${Number(lat).toFixed(6)}&lng=${Number(lng).toFixed(6)}`;

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

onLoad((options) => {
  if (options && options.lineId) {
    lineId.value = options.lineId;
  }

  uni.$on('map-message', handleMapMessage);
  uni.showLoading({ title: '定位中...' });
  getLocation({
    type: 'wgs84',
    success: (res) => {
      uni.hideLoading();
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

    /**
    * 绘制设备标记和连线
    * Marker 样式：蓝色圆角矩形气泡 + 底部三角箭头 + 内嵌 SVG 图标 + 右侧名称标签
    */
    drawDevices(devices) {
    // 清除旧图层
      if (this.deviceLayerGroup) {
        this.map.removeLayer(this.deviceLayerGroup);
        this.deviceLayerGroup = null;
      }
      if (!devices || devices.length === 0) return;
    
      this.deviceLayerGroup = L.layerGroup().addTo(this.map);
      var lineCoords = [];
    
      for (var i = 0; i < devices.length; i++) { 
        var device=devices[i];
        var lat=parseFloat(device.latitude);
        var lng=parseFloat(device.longitude); 
        
        if (isNaN(lat) || isNaN(lng) || (lat===0 && lng===0)) continue;
        var latlng=[lat,lng];
        var displayName=device.name || '未命名' ;
        var svgHtml=this.getDeviceSvg(device.device_type);
        var color='#3bbffb';
        // 气泡容器 + 底部三角 + 右侧文字
        var html=''
          + '<div style="display:flex;align-items:flex-start;pointer-events:auto;">'
          +  '<div style="'
          +   'position:relative;'
          +   'width:36px;height:36px;'
          +   'background:' + color + ';'
          +   'border-radius:8px;'
          +   'display:flex;align-items:center;justify-content:center;'
          +   'flex-shrink:0;'
          +   'box-shadow:0 2px 6px rgba(0,0,0,0.35);'
          +  '">'
          +  svgHtml
          +  '<div style="'
          +   'position:absolute;bottom:-7px;left:50%;'
          +   'transform:translateX(-50%);'
          +   'width:0;height:0;'
          +   'border-left:7px solid transparent;'
          +   'border-right:7px solid transparent;'
          +   'border-top:7px solid ' + color + ';'
          +  '"></div>'
          + '</div>'
          // 右侧文字
          + '<span style="'
          +  'margin-left:6px;margin-top:6px;'
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
          iconSize: [36, 43],
          iconAnchor: [18, 43]
        });
        L.marker(latlng, { icon: icon }).addTo(this.deviceLayerGroup);
        
        // 仅顶层设备参与连线
        if (!device.parent_id || device.parent_id === '' ) { 
          lineCoords.push(latlng);
        }
      }

      // 按 sort_order 顺序连线
      if (lineCoords.length>= 2) {
        L.polyline(lineCoords, {
          color: '#006567',
          weight: 3,
          opacity: 0.8
        }).addTo(this.deviceLayerGroup);
      }
    },
    
    /**
    * 根据设备类型返回对应的 SVG 图标 HTML
    * 可自行替换各类型的 path 数据
    */
    getDeviceSvg(deviceType) {
      var svgs = {
        'pole':
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 162 148">'
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
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none">'
          + '<circle cx="9" cy="12" r="5" stroke="#fff" stroke-width="1.5" />'
          + '<circle cx="15" cy="12" r="5" stroke="#fff" stroke-width="1.5" />'
          + '</svg>',
        'substation':
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none">'
          + '<rect x="4" y="9" width="16" height="11" rx="1" stroke="#fff" stroke-width="1.5" />'
          + '<path d="M4 9l8-5 8 5" stroke="#fff" stroke-width="1.5" stroke-linejoin="round" />'
          + '<path d="M13 12l-2 3.5h3l-2 3.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />'
          + '</svg>',
        'cable':
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none">'
          + '<circle cx="12" cy="12" r="3" fill="#fff" />'
          + '<path d="M4 12h5M15 12h5M12 4v5M12 15v5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" />'
          + '</svg>',
        'meter':
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none">'
          + '<circle cx="12" cy="13" r="8" stroke="#fff" stroke-width="1.5" />'
          + '<path d="M12 13l4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" />'
          + '<circle cx="12" cy="13" r="1.5" fill="#fff" />'
          + '</svg>',
        'station':
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none">'
          + '<path d="M3 12l9-7 9 7" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />'
          + '<rect x="5" y="12" width="14" height="8" stroke="#fff" stroke-width="1.5" />'
          + '<rect x="9" y="15" width="6" height="5" stroke="#fff" stroke-width="1.5" />'
          + '</svg>'
      };
      return svgs[deviceType]
        || '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="6" fill="#fff" /></svg>';
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
</style>