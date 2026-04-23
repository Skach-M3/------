<script>
import { isTokenValid, clearToken } from '@/utils/auth.js';
import { initDatabase } from '@/db/init.js'
export default {
	onLaunch: async function () {
		console.log('App Launch')
		try {
			await initDatabase()
			this.log('✅ 数据库初始化成功')
		} catch (e) {
			this.log('❌ 数据库初始化失败: ' + JSON.stringify(e))
		}
		if (isTokenValid()) {
			// token 有效 → 直接进首页
			uni.reLaunch({ url: '/pages/index/index' });
		} else {
			// token 无效或过期 → 清除 + 停在登录页（pages.json 第一页）
			clearToken();
		}
	},
	onShow: function () {
		console.log('App Show')
	},
	onHide: function () {
		console.log('App Hide')
	}
}
</script>

<style>
/*每个页面公共css */
</style>
