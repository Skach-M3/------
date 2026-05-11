<template>
	<view class="page-container">
		<!-- 标题栏放在最顶上 -->
		<view class="nav-bar">
			<view class="logo-box">
				<image class="logo-img" src="/static/logo.svg" mode="aspectFit"></image>
			</view>
			<text class="app-title">现场作业</text>
		</view>

		<!-- 1. 顶部状态与信息区 (主题色 #006567) -->
		<view class="header-section">
			<!-- 状态与位置信息 -->
			<view class="info-panel">
				<!-- 左侧雷达状态 -->
				<view class="status-radar">
					<view class="radar-circle" :class="{ 'connected': !isLocating }">
						<!-- 旋转的边框（仅定位中显示） -->
						<view class="spinner-border" v-if="isLocating"></view>
						<text class="status-text">{{ isLocating ? '连接中' : '已连接' }}</text>
					</view>
				</view>

				<!-- 右侧环境数据 -->
				<view class="location-data">
					<text class="data-line">纬度：{{ locationInfo.latitude }}</text>
					<text class="data-line">经度：{{ locationInfo.longitude }}</text>
					<text class="data-line address-text">{{ locationInfo.address }}</text>
				</view>
			</view>
		</view>

		<!-- 2. 现场作业区 (固定不滚动) -->
		<view class="action-section">
			<view class="card-box">
				<view class="card-title">现场作业</view>
				<view class="action-grid">
					<!-- 线路采集 (主题色) -->
					<view class="action-item" @click="handleAction('line')">
						<view class="icon-wrapper theme-bg">
							<u-icon name="share" color="#fff" size="32"></u-icon>
						</view>
						<text class="action-name">线路采集</text>
					</view>

					<!-- 数据上传 (蓝色) -->
					<view class="action-item" @click="handleAction('upload')">
						<view class="icon-wrapper blue-bg">
							<!-- 将 arrow-upward 替换为 cloud-upload -->
							<image src="/static/upload.png" style="width: 26px; height: 26px;" mode="aspectFit"></image>
						</view>
						<text class="action-name">数据上传</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 3. 采集任务区 (占满剩余空间，仅内部列表滚动) -->
		<view class="list-section">
			<view class="card-box flex-card">
				<!-- 标题固定在卡片顶部 -->
				<view class="card-title sticky-title">工作日报</view>
				<view class="action-grid">

					<!-- 工作日报 -->
					<view class="action-item" @click="handleAction('daylyReport')">
						<view class="icon-wrapper blue-bg">
							<image src="/static/daylyReport.png" style="width: 30px; height: 30px;" mode="aspectFit">
							</image>
						</view>
						<text class="action-name">工作日报</text>
					</view>
				</view>

				<!-- 仅列表区域滚动 -->
				<!-- <scroll-view scroll-y class="task-scroll-area">

					<view class="empty-tip" v-if="lineList.length === 0">
						<text class="empty-text">暂无线路，请先在"线路采集"中新建</text>
					</view>

					<view class="task-list" v-else>
						<view class="card-item" v-for="item in lineList" :key="item.id">
							
							<view class="card-header">
								<view class="header-left">
									<view class="tag" :style="{ color: themeColor, backgroundColor: themeColorLight }">
										线路
									</view>
									<text class="title u-line-1">{{ item.name }}</text>
								</view>
								<text class="date">{{ item.created_date }}</text>
							</view>

							
							<view class="card-info" v-if="item.station || item.recorder">
								<text class="info-text" v-if="item.station">变电站：{{ item.station }}</text>
								<text class="info-text" v-if="item.recorder">采录人：{{ item.recorder }}</text>
							</view>

							
							<view class="card-actions">
								<view class="action-btn btn-edit" @click="handleEdit(item)">编辑</view>
								<view class="action-btn btn-collect" @click="handleCollect(item)">进入采集</view>
							</view>
						</view>
					</view>

					<view class="bottom-spacer"></view>
				</scroll-view> -->
			</view>
		</view>

		<!-- 4. 底部功能栏 -->
		<view class="tab-bar">
			<view class="tab-item active">
				<u-icon name="home" color="#006567" size="24"></u-icon>
				<text class="tab-text">首页</text>
			</view>
			<view class="tab-item" @click="switchTab('stat')">
				<u-icon name="grid" color="#999999" size="24"></u-icon>
				<text class="tab-text">统计</text>
			</view>
			<view class="tab-item" @click="switchTab('my')">
				<u-icon name="account" color="#999999" size="24"></u-icon>
				<text class="tab-text">我的</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { onLoad, onShow, onHide, onUnload } from '@dcloudio/uni-app';
import { TIANDITU_KEY } from '@/utils/getKey.js';
import { lineDAO } from '@/dao/lineDAO';
import { themeColor, themeColorLight } from '@/static/themeColor.js';

// --- 数据接口定义 ---
interface LocationInfo {
	latitude: string;
	longitude: string;
	accuracy: string;
	address: string;
}

// --- 响应式数据 ---
const isLocating = ref<boolean>(true);
const isRetrying = ref<boolean>(false);
let retryTimer: ReturnType<typeof setInterval> | null = null;

const locationInfo = reactive<LocationInfo>({
	latitude: '获取中...',
	longitude: '获取中...',
	accuracy: '--',
	address: '正在获取位置...'
});

// 采集任务列表（最新3条线路）
const lineList = ref<any[]>([]);

// --- 方法 ---

// 加载最新 3 条线路
const loadLatestLines = async () => {
	try {
		const result = await lineDAO.findAll();
		const all = result || [];
		// 按创建时间倒序排序
		all.sort((a: any, b: any) => {
			const ta = new Date(a.created_date || a.createdDate || 0).getTime();
			const tb = new Date(b.created_date || b.createdDate || 0).getTime();
			return tb - ta;
		});
		lineList.value = all.slice(0, 3);
	} catch (e) {
		console.error('加载线路失败:', e);
		lineList.value = [];
	}
};

// 进入采集
const handleCollect = (item: any) => {
	uni.navigateTo({ url: `/pages/index/map?lineId=${item.id}&lineName=${encodeURIComponent(item.name)}` });
};

// 导出
const handleExport = (item: any) => {
	uni.navigateTo({
		url: `/pages/line/export?id=${item.id}&name=${encodeURIComponent(item.name || '')}`
	});
};

// 编辑
const handleEdit = (item: any) => {
	uni.navigateTo({ url: `/pages/line/edit?id=${item.id}` });
};

// 删除（逻辑与 linelist 完全一致：左侧按钮=确定删除）
const handleDelete = (item: any) => {
	uni.showModal({
		title: '确认删除',
		content: `确定删除线路「${item.name}」吗？`,
		confirmText: '取消',
		cancelText: '确定',
		success: async (res) => {
			if (res.cancel) {
				try {
					await lineDAO.deleteById(item.id);
					uni.showToast({ title: '已删除', icon: 'success' });
					loadLatestLines();
				} catch (e) {
					console.error('删除失败:', e);
					uni.showToast({ title: '删除失败', icon: 'none' });
				}
			}
		}
	});
};

// 清除重试定时器
const clearRetryTimer = () => {
	if (retryTimer) {
		clearInterval(retryTimer);
		retryTimer = null;
	}
};

// 天地图逆地理编码
const reverseGeocode = (lat: number, lon: number) => {
	const postStr = encodeURIComponent(JSON.stringify({
		lon: lon,
		lat: lat,
		ver: 1
	}));
	const url = `https://api.tianditu.gov.cn/geocoder?postStr=${postStr}&type=geocode&tk=${TIANDITU_KEY}`;

	uni.request({
		url: url,
		method: 'GET',
		success: (res: any) => {
			console.log('天地图逆地理编码结果:', res.data);
			if (res.data && res.data.result) {
				const result = res.data.result;
				locationInfo.address = result.formatted_address || '未知详细地址';
			} else {
				locationInfo.address = '地址解析失败';
			}
		},
		fail: (err) => {
			console.warn('逆地理编码请求失败:', err);
			locationInfo.address = '地址解析失败（网络错误）';
		}
	});
};

// 获取定位
const startLocation = (isSilent = false) => {
	isLocating.value = true;

	if (!isSilent) {
		locationInfo.address = '正在获取位置...';
	} else {
		locationInfo.address = '等待GPS信号，正在自动重试...';
	}

	uni.getLocation({
		type: 'wgs84',
		isHighAccuracy: true,
		success: (res) => {
			clearRetryTimer();
			isRetrying.value = false;

			locationInfo.latitude = res.latitude.toFixed(6);
			locationInfo.longitude = res.longitude.toFixed(6);
			locationInfo.accuracy = res.accuracy ? `${res.accuracy}米` : '未知';

			locationInfo.address = '正在解析地址...';
			reverseGeocode(res.latitude, res.longitude);
			isLocating.value = false;
		},
		fail: (err) => {
			console.warn('获取定位失败:', err);
			locationInfo.latitude = '获取失败';
			locationInfo.longitude = '获取失败';
			locationInfo.accuracy = '--';
			locationInfo.address = '定位失败，请开启GPS或检查权限';

			if (!isSilent) {
				uni.showToast({
					title: '定位失败，请开启手机GPS',
					icon: 'none',
					duration: 2000
				});
			}

			isRetrying.value = true;
			if (!retryTimer) {
				retryTimer = setInterval(() => {
					startLocation(true);
				}, 3000);
			}
		}
	});
};

// 跳转
const handleAction = (type: string) => {
	console.log('点击', type);
	if (type === 'line') {
		uni.navigateTo({ url: '/pages/line/lineList' });
	} else if (type === 'upload') {
		uni.showToast({ title: '上传功能暂未开放', icon: 'none' });
	} else if (type === 'daylyReport') {
		uni.showToast({ title: '工作日报功能暂未开放', icon: 'none' });
	}
};

// --- 生命周期 ---

onLoad(() => {
	startLocation(false);
});

onShow(() => {
	uni.hideTabBar();
	// 每次进入/返回首页时刷新任务列表
	loadLatestLines();

	if (isRetrying.value) {
		clearRetryTimer();
		startLocation(true);
	}
});

// 底部 Tab 切换
const switchTab = (type: string) => {
	console.log('>>>>>> tab 点击触发', type); // ← 加这行
	if (type === 'my') {
		uni.switchTab({ url: '/pages/index/myInfo' });
	} else if (type === 'stat') {
		uni.showToast({ title: '统计页暂未开放', icon: 'none' });
	}
};

onHide(() => {
	clearRetryTimer();
});

onUnload(() => {
	clearRetryTimer();
});
</script>

<style lang="scss" scoped>
.page-container {
	height: 100vh;
	overflow: hidden;
	background-color: #f5f6f8;
	display: flex;
	flex-direction: column;
}

/* 顶部区域 */
.header-section {
	flex-shrink: 0;
	background-color: #006567;
	padding: 10px 20px 20px;
	color: #ffffff;
	box-shadow: 0 4px 10px rgba(0, 101, 103, 0.2);
	z-index: 10;
}

.nav-bar {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	background-color: #006567;
	padding: 0px 20px 10px;
	color: #ffffff;
	z-index: 10;

	.logo-box {
		width: 40px;
		height: 40px;
		background-color: #ffffff;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 12px;
		overflow: hidden;

		.logo-img {
			width: 100%;
			height: 100%;
		}
	}

	.app-title {
		font-size: 20px;
		font-weight: bold;
	}
}

.info-panel {
	display: flex;
	align-items: center;
	background-color: rgba(255, 255, 255, 0.1);
	padding: 15px;
	border-radius: 12px;

	.status-radar {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-right: 15px;
		width: 70px;

		.radar-circle {
			position: relative;
			width: 70px;
			height: 70px;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 6px;

			&.connected {
				border: 2px solid #8bc34a;
			}

			.spinner-border {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				box-sizing: border-box;
				border-radius: 50%;
				border: 2px solid rgba(139, 195, 74, 0.3);
				border-top-color: #8bc34a;
				animation: spin 1.2s linear infinite;
			}

			.status-text {
				font-size: 14px;
				color: #8bc34a;
				z-index: 1;
			}
		}
	}

	.location-data {
		flex: 1;
		display: flex;
		flex-direction: column;

		.data-line {
			font-size: 13px;
			line-height: 1.6;
			color: rgba(255, 255, 255, 0.9);
		}

		.address-text {
			margin-top: 4px;
			font-size: 12px;
			color: rgba(255, 255, 255, 0.7);
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			overflow: hidden;
		}
	}
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}

	100% {
		transform: rotate(360deg);
	}
}

/* 公共卡片样式 */
.card-box {
	background-color: #ffffff;
	border-radius: 16px;
	padding: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);

	.card-title {
		font-size: 16px;
		font-weight: bold;
		color: #333;
		margin-bottom: 16px;
	}
}

/* 固定操作区 */
.action-section {
	flex-shrink: 0;
	padding: 15px 15px 0 15px;
	z-index: 5;
}

/* 现场作业网格 */
.action-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 20px 30px;
	padding: 0 10px;

	.action-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 60px;

		.icon-wrapper {
			width: 60px;
			height: 60px;
			border-radius: 16px;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 10px;

			&.theme-bg {
				background-color: #006567;
			}

			&.blue-bg {
				background-color: #2196f3;
			}
		}

		.action-name {
			font-size: 14px;
			color: #333;
			white-space: nowrap;
		}
	}
}

/* 列表区域 (占满剩余空间) */
.list-section {
	flex: 1;
	height: 0;
	/* 必须设置高度为0，让 flex: 1 生效 */
	padding: 15px;
	display: flex;
	flex-direction: column;
}

.flex-card {
	flex: 1;
	display: flex;
	flex-direction: column;
	padding-bottom: 0;
	/* 底部留给 scroll-view 处理 */
	overflow: hidden;
	/* 确保内部滚动不溢出圆角 */
}

.sticky-title {
	flex-shrink: 0;
	/* 保证标题不被压缩 */
	margin-bottom: 10px !important;
}

.task-scroll-area {
	flex: 1;
	height: 0;
	/* 必须，确保 scroll-view 在 flex 容器内正常滚动 */
}

/* 空状态 */
.empty-tip {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 40rpx 0;

	.empty-text {
		font-size: 28rpx;
		color: #999999;
	}
}

/* 采集任务卡片 */
.task-list {
	display: flex;
	flex-direction: column;
	padding-bottom: 10px;
}

.card-item {
	background-color: #ffffff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	border: 2rpx solid #f0f0f0;

	&:last-child {
		margin-bottom: 0;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;

		.header-left {
			display: flex;
			align-items: center;
			flex: 1;
			overflow: hidden;

			.tag {
				font-size: 24rpx;
				padding: 4rpx 16rpx;
				border-radius: 20rpx;
				margin-right: 16rpx;
				font-weight: 500;
				white-space: nowrap;
			}

			.title {
				font-size: 32rpx;
				font-weight: bold;
				color: #333333;
				flex: 1;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}

		.date {
			font-size: 26rpx;
			color: #999999;
			margin-left: 20rpx;
			white-space: nowrap;
		}
	}

	.card-info {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
		margin-bottom: 24rpx;
		padding-left: 8rpx;

		.info-text {
			font-size: 26rpx;
			color: #666666;
		}
	}

	.card-actions {
		display: flex;
		justify-content: flex-end;
		gap: 20rpx;

		.action-btn {
			font-size: 26rpx;
			padding: 12rpx 30rpx;
			border-radius: 8rpx;
			font-weight: 500;

			&.btn-collect {
				background-color: #fff3e8;
				color: #ff8c00;
			}

			&.btn-edit {
				background-color: #f5f5f5;
				color: #333333;
			}
		}
	}
}

.bottom-spacer {
	height: 15px;
}

/* 底部功能栏 */
.tab-bar {
	flex-shrink: 0;
	display: flex;
	justify-content: space-around;
	align-items: center;
	background-color: #ffffff;
	height: 60px;
	box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.03);
	padding-bottom: env(safe-area-inset-bottom);
	z-index: 10;

	.tab-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #999999;
		flex: 1;
		height: 100%;

		&.active {
			color: #006567;

			.tab-text {
				font-weight: bold;
			}
		}

		.tab-text {
			font-size: 12px;
			margin-top: 4px;
		}
	}
}
</style>