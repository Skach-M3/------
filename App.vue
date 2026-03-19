<script>
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
