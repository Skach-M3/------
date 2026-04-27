<script>
import { getToken, clearToken } from '@/utils/auth.js';
import { checkAuth, stopAuthTimer } from '@/utils/authGuard.js';
import { initDatabase } from '@/db/init.js';

export default {
	data() {
		return {
			// 标记冷启动是否已经触发过鉴权检查，避免 onLaunch + onShow 重复请求
			launchedChecked: false
		};
	},
	onLaunch: async function () {
		console.log('App Launch');

		// 1. 初始化数据库
		try {
			await initDatabase();
			console.log('✅ 数据库初始化成功');
		} catch (e) {
			console.error('❌ 数据库初始化失败: ' + JSON.stringify(e));
		}

		// 2. 鉴权处理
		if (getToken()) {
			// 有 token：交给 checkAuth 处理
			//  - 200 成功：刷新锚点 + 启动 12h 定时器
			//  - 401：清除 token 并跳登录页
			//  - 网络异常 + 仍在 12h 宽限期：允许继续使用
			//  - 网络异常 + 已超 12h：弹窗提示并跳登录页
			checkAuth();
			this.launchedChecked = true;

			// 入口页跳转到首页（checkAuth 内部若失败会再 reLaunch 到登录页）
			uni.reLaunch({ url: '/pages/index/index' });
		} else {
			// 无 token：清理残留并停留在登录页（pages.json 第一页）
			clearToken();
		}
	},
	onShow: function () {
		console.log('App Show');

		// 冷启动时 onLaunch 已经检查过，跳过本次
		if (this.launchedChecked) {
			this.launchedChecked = false;
			return;
		}

		// 从后台回前台时再校验一次
		if (getToken()) {
			checkAuth();
		}
	},
	onHide: function () {
		console.log('App Hide');
		// 进入后台后 setTimeout 不可靠，先停掉，回前台 onShow 会重新触发
		stopAuthTimer();
	}
};
</script>

<style>
/*每个页面公共css */
</style>