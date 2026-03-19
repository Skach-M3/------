<template>
	<view class="page-container">
		<!-- 标题栏放在最顶上 -->
		<view class="nav-bar">
			<view class="logo-box">
				<text class="logo-text">R</text>
			</view>
			<text class="app-title">现场采集工具</text>
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
					<text class="data-line">精度：±{{ locationInfo.accuracy }}</text>
					<text class="data-line address-text">{{ locationInfo.address }}</text>
				</view>
			</view>
		</view>

		<!-- 主体内容区 -->
		<scroll-view scroll-y class="main-content">

			<!-- 2. 现场作业区 -->
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

					<!-- 台区采集 (绿色) -->
					<view class="action-item" @click="handleAction('substation')">
						<view class="icon-wrapper green-bg">
							<u-icon name="grid" color="#fff" size="32"></u-icon>
						</view>
						<text class="action-name">台区采集</text>
					</view>
				</view>
			</view>

			<!-- 3. 采集任务区 (数据驱动) -->
			<view class="card-box">
				<view class="card-title">采集任务</view>
				<view class="task-list">
					<view class="task-item" v-for="task in taskList" :key="task.id">
						<view class="task-header">
							<view class="task-title-group">
								<text class="task-tag" :class="task.type === 'line' ? 'tag-blue' : 'tag-green'">
									{{ task.typeText }}
								</text>
								<text class="task-title u-line-1">{{ task.title }}</text>
							</view>
							<text class="task-date">{{ task.date }}</text>
						</view>

						<view class="task-actions">
							<view class="btn-group">
								<view class="action-btn btn-orange" @click="">进入采集</view>
								<view class="action-btn btn-blue" @click="">导出数据</view>
								<view class="action-btn btn-gray" @click="">编辑</view>
								<view class="action-btn btn-gray" @click="">删除</view>
							</view>
						</view>
					</view>
				</view>
			</view>

			<view class="bottom-spacer"></view>
		</scroll-view>
	</view>
</template>

<script setup lang="ts">
	import { ref, reactive } from 'vue';
	import { onLoad, onShow, onHide, onUnload } from '@dcloudio/uni-app';

	// 填入您申请的天地图 Web API Key
	const TIANDITU_KEY = 'a30fe8f02deafbdc08192aa8f81c0044';

	// --- 数据接口定义 ---
	interface LocationInfo {
		latitude : string;
		longitude : string;
		accuracy : string;
		address : string;
	}

	interface Task {
		id : number;
		type : 'line' | 'substation';
		typeText : string;
		title : string;
		date : string;
	}

	// --- 响应式数据 ---
	const isLocating = ref<boolean>(true);
	const isRetrying = ref<boolean>(false); // 是否处于静默重试状态
	let retryTimer : ReturnType<typeof setInterval> | null = null; // 重试定时器

	const locationInfo = reactive<LocationInfo>({
		latitude: '获取中...',
		longitude: '获取中...',
		accuracy: '--',
		address: '正在获取位置...'
	});

	const taskList = ref<Task[]>([
		{ id: 1, type: 'line', typeText: '线路', title: '10KV奥体145线[12km]', date: '2026-03-04' },
		{ id: 2, type: 'substation', typeText: '台区', title: '400V城南小区配电设施普查', date: '2026-03-04' }
	]);

	// --- 方法 ---

	// 清除重试定时器
	const clearRetryTimer = () => {
		if (retryTimer) {
			clearInterval(retryTimer);
			retryTimer = null;
		}
	};

	// 获取定位 (isSilent: 是否为静默重试，静默重试不弹窗打扰用户)
	const startLocation = (isSilent = false) => {
		isLocating.value = true;

		if (!isSilent) {
			locationInfo.address = '正在获取位置...';
		} else {
			locationInfo.address = '等待GPS信号，正在自动重试...';
		}

		uni.getLocation({
			type: 'gcj02', // 国测局坐标系，天地图适用
			isHighAccuracy: true,
			geocode: true,
			success: (res) => {
				// 定位成功，清除定时器，结束重试状态
				clearRetryTimer();
				isRetrying.value = false;

				locationInfo.latitude = res.latitude.toFixed(6);
				locationInfo.longitude = res.longitude.toFixed(6);
				locationInfo.accuracy = res.accuracy ? `${res.accuracy}米` : '未知';

				// 开始解析详细地址
				if (res.address) {
					const addr = res.address;
					locationInfo.address = `${addr.province || ''}${addr.city || ''}${addr.district || ''}${addr.street || ''}${addr.streetNum || ''}${addr.poiName || ''}` || '未知详细地址';
				} else {
					locationInfo.address = '地址解析成功 (具体地址需配置地图SDK)';
				}
				isLocating.value = false;
			},
			fail: (err) => {
				console.warn('获取定位失败:', err);
				locationInfo.latitude = '获取失败';
				locationInfo.longitude = '获取失败';
				locationInfo.accuracy = '--';
				locationInfo.address = '定位失败，请开启GPS或检查权限';

				// 如果是首次手动/加载触发的失败，给个弹窗提示
				if (!isSilent) {
					uni.showToast({
						title: '定位失败，请开启手机GPS',
						icon: 'none',
						duration: 2000
					});
				}

				// 标记进入重试状态，并开启 3 秒一次的定时器
				isRetrying.value = true;
				if (!retryTimer) {
					retryTimer = setInterval(() => {
						startLocation(true); // 开启静默重试
					}, 3000);
				}
			}
		});
	};

	// 模拟点击事件（避免编译警告）
	const handleAction = (type : string) => {
		console.log('点击了:', type);
	};

	// --- 生命周期 ---

	onLoad(() => {
		// 页面加载时首次请求定位
		startLocation(false);
	});

	onShow(() => {
		// 当用户从系统设置(如去开GPS)切回APP时
		// 如果当前处于重试状态，立刻主动触发一次，并重置定时器，提升响应速度
		if (isRetrying.value) {
			clearRetryTimer();
			startLocation(true);
		}
	});

	onHide(() => {
		// APP 切到后台时，必须清除定时器，防止后台疯狂调用GPS导致发热和系统警告
		clearRetryTimer();
	});

	onUnload(() => {
		// 页面销毁时清理定时器，防止内存泄漏
		clearRetryTimer();
	});
</script>

<style lang="scss" scoped>
	.page-container {
		/* 修改为固定高度并隐藏溢出，配合 flex 布局实现头部固定 */
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
		/* 顶部加上状态栏高度，让其紧贴屏幕最顶部 */
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

			.logo-text {
				color: #006567;
				font-size: 24px;
				font-weight: bold;
				font-style: italic;
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

				/* 定位成功后的固定边框 */
				&.connected {
					border: 2px solid #8bc34a;
				}

				/* 旋转动画边框 */
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

			.calibration-text {
				font-size: 12px;
				color: rgba(255, 255, 255, 0.8);
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

	/* 旋转动画 */
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}

		100% {
			transform: rotate(360deg);
		}
	}

	/* 主体内容区 */
	.main-content {
		/* 占据剩余全部空间 */
		flex: 1;
		/* 必须设置 height: 0，让 scroll-view 在 flex 容器中正确计算高度并开启内部滚动 */
		height: 0;
		padding: 15px;
		box-sizing: border-box;
	}

	.card-box {
		background-color: #ffffff;
		border-radius: 16px;
		padding: 16px;
		margin-bottom: 15px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);

		.card-title {
			font-size: 16px;
			font-weight: bold;
			color: #333;
			margin-bottom: 16px;
		}
	}

	/* 现场作业网格 */
	.action-grid {
		display: flex;
		gap: 30px;
		padding: 0 10px;

		.action-item {
			display: flex;
			flex-direction: column;
			align-items: center;

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

				&.green-bg {
					background-color: #4caf50;
				}
			}

			.action-name {
				font-size: 14px;
				color: #333;
			}
		}
	}

	/* 任务列表 */
	.task-list {
		display: flex;
		flex-direction: column;
		gap: 15px;

		.task-item {
			background-color: #fafafa;
			border-radius: 12px;
			padding: 15px;

			.task-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 15px;

				.task-title-group {
					display: flex;
					align-items: center;
					flex: 1;
					margin-right: 10px;

					.task-tag {
						font-size: 12px;
						padding: 2px 6px;
						border-radius: 4px;
						margin-right: 8px;
						white-space: nowrap;

						&.tag-blue {
							color: #1989fa;
							background-color: #e8f3ff;
						}

						&.tag-green {
							color: #4caf50;
							background-color: #e8f5e9;
						}
					}

					.task-title {
						font-size: 15px;
						font-weight: bold;
						color: #333;
					}
				}

				.task-date {
					font-size: 12px;
					color: #999;
					white-space: nowrap;
				}
			}

			.task-actions {
				display: flex;
				justify-content: flex-end;

				.btn-group {
					display: flex;
					gap: 8px;

					.action-btn {
						font-size: 12px;
						padding: 6px 12px;
						border-radius: 6px;

						&.btn-orange {
							color: #ff9800;
							background-color: #fff3e0;
						}

						&.btn-blue {
							color: #2196f3;
							background-color: #e3f2fd;
						}

						&.btn-gray {
							color: #666;
							background-color: #eeeeee;
						}
					}
				}
			}
		}
	}

	.bottom-spacer {
		height: 60px;
	}
</style>