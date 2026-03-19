<template>
  <view class="content">
    <!-- 地图容器 -->
    <view 
      id="map" 
      class="map-container" 
      :prop="mapConfig" 
      :change:prop="mapModule.updateMapConfig"
    ></view>

    <!-- UI 控制层 -->
    <view class="controls-panel">
      <view class="info-box">
        <text class="title">当前状态</text>
        <text class="desc">{{ statusText }}</text>
      </view>

      <view class="btn-group">
        <!-- 新增定位按钮 -->
        <button class="btn" type="primary" @click="locateUser">
           📍 定位我
        </button>
        <button class="btn" type="default" @click="toggleLayer">
          切换图层
        </button>
      </view>
      
      <view class="btn-group" style="margin-top: 10px;">
        <button class="btn" size="mini" @click="zoomIn">放大 (+)</button>
        <button class="btn" size="mini" @click="zoomOut">缩小 (-)</button>
      </view>
    </view>
  </view>
</template>

<!-- 1. 逻辑层 (Vue3 + TS) -->
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

const statusText = ref('等待操作...');

// 响应式数据
const mapConfig = reactive<MapConfig>({
  center: [30.2084, 120.2120], // 默认杭州
  zoom: 13,
  layerType: 'vec',
  actionId: 0,
  actionType: 'init'
});

// === 核心功能：获取定位 ===
const locateUser = () => {
  statusText.value = '正在获取定位...';
  
  uni.getLocation({
    type: 'wgs84', // 重要：使用 wgs84 坐标系以匹配 Leaflet/天地图
    success: (res) => {
      console.log('定位成功:', res);
      statusText.value = `定位成功: ${res.latitude.toFixed(4)}, ${res.longitude.toFixed(4)}`;
      
      // 更新地图配置，触发 RenderJS
      mapConfig.center = [res.latitude, res.longitude];
      mapConfig.zoom = 16; // 定位成功后自动放大
      mapConfig.actionType = 'locate'; // 告诉 RenderJS 这是一个定位动作
      mapConfig.actionId++;
    },
    fail: (err) => {
      console.error('定位失败', err);
      statusText.value = '定位失败，请检查手机GPS权限';
      
      // 提示用户
      uni.showToast({
        title: '获取定位失败',
        icon: 'none'
      });
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
    statusText.value = `点击坐标: ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`;
  }
};

onLoad(() => {
  uni.$on('map-message', handleMapMessage);
  // 页面加载后自动定位一次（可选）
  // locateUser(); 
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
      locationMarker: null, // 用于存储定位点
	  // key
      tdtKey: 'a30fe8f02deafbdc08192aa8f81c0044', 
    }
  },
  mounted() {
    // 动态加载 Leaflet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      this.initMap();
    };
    document.head.appendChild(script);
  },
  methods: {
    initMap() {
      if (!window.L || !this.tdtKey) return;
      
      this.map = L.map('map', {
        zoomControl: false, 
        attributionControl: false
      }).setView([30.2084, 120.2120], 13);

      this.updateLayers('vec');

      this.map.on('click', (e) => {
        this.$ownerInstance.callMethod('receiveRenderData', {
          type: 'click',
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      });
    },

    updateMapConfig(newValue, oldValue) {
      if (!this.map || !newValue) return;

      // === 处理定位 ===
      if (newValue.actionType === 'locate') {
        // 1. 飞到当前位置
        this.map.flyTo(newValue.center, newValue.zoom);
        
        // 2. 绘制定位点 (蓝色圆点)
        this.drawLocationMarker(newValue.center);
      }
      // === 处理普通缩放 ===
      else if (newValue.actionType === 'zoom') {
        this.map.setZoom(newValue.zoom);
      }
      // === 处理图层切换 ===
      else if (newValue.actionType === 'layer') {
        this.updateLayers(newValue.layerType);
      }
    },

    drawLocationMarker(center) {
      // 如果已经有定位点，先移除
      if (this.locationMarker) {
        this.map.removeLayer(this.locationMarker);
      }

      // 创建一个漂亮的蓝色定位点
      this.locationMarker = L.circleMarker(center, {
        color: '#fff',       // 边框白色
        fillColor: '#2A85FF', // 填充蓝色
        fillOpacity: 1,
        radius: 8,           // 半径
        weight: 2            // 边框宽度
      }).addTo(this.map);
      
      // 再加一个半透明的光晕效果
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

<style>
.content { display: flex; flex-direction: column; width: 100%; height: 100vh; overflow: hidden; }
.map-container { flex: 1; width: 100%; background-color: #eee; }
.controls-panel { height: 200px; background-color: #ffffff; box-shadow: 0 -2px 10px rgba(0,0,0,0.1); padding: 15px; display: flex; flex-direction: column; z-index: 999; }
.info-box { margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
.title { font-weight: bold; font-size: 16px; }
.desc { font-size: 12px; color: #666; margin-top: 4px; display: block;}
.btn-group { display: flex; gap: 10px; }
.btn { flex: 1; font-size: 14px; display: flex; align-items: center; justify-content: center; }
</style>