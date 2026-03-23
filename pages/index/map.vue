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
    <view id="map" class="map-container" :prop="mapConfig" :change:prop="mapModule.updateMapConfig"></view>

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

  </view>
</template>

<!-- 1. 逻辑层 -->
<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

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
  uni.getLocation({
    type: 'wgs84',
    success: (res) => {
      uni.hideLoading();
      mapConfig.center = [res.latitude, res.longitude];
      mapConfig.zoom = 16;
      mapConfig.actionType = 'locate';
      mapConfig.actionId++;
    },
    fail: (err) => {
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
  }
};

// === 底部悬浮菜单逻辑 ===
const isFabOpen = ref(false);

const fabItems = [
  { name: '变电站', path: 'substation' },
  { name: '杆塔', path: 'tower' },
  { name: '电缆拐点', path: 'cable' },
  { name: '变压器', path: 'transformer' },
  { name: '计量信息', path: 'meter' },
  { name: '站房', path: 'station' }
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

const handleFabClick = (item: any) => {
  isFabOpen.value = false;
  uni.showToast({ title: `跳转至: ${item.name}`, icon: 'none' });
};

onLoad(() => {
  uni.$on('map-message', handleMapMessage);
  uni.showLoading({ title: '定位中...' });
  uni.getLocation({
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
      tdtKey: 'a30fe8f02deafbdc08192aa8f81c0044',
      pendingConfig: null
    }
  },
  mounted() {
    // ✅ 拼接正确的基础路径（兼容 H5 和 App 端）
    const basePath = window.location.protocol + '//' + window.location.host;
    // App端实际路径可能类似 file:///android_asset/...
    
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
      
      this.updateLayers((this.pendingConfig && this.pendingConfig.layerType) || 'vec');
      
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
    },

    applyConfig(config, isFlyTo = true) {
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
    }
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

/* 自定义导航栏 */
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

/* 地图容器 */
.map-container {
  flex: 1;
  width: 100%;
  background-color: #f5f5f5;
}

/* 右侧悬浮工具栏 */
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

/* 底部中间悬浮菜单 */
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

/* 主按钮 */
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

/* 展开子菜单 */
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