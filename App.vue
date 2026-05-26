<script>
import { getToken, clearToken } from '@/utils/auth.js';
import { checkAuth, stopAuthTimer } from '@/utils/authGuard.js';
import { initDatabase } from '@/db/init.js';

export default {
    data() {
        return {
            // 避免冷启动时 onLaunch + onShow 重复触发鉴权。
            launchedChecked: false
        };
    },
    onLaunch: async function () {
        console.log('App Launch');

        try {
            await initDatabase();
            console.log('数据库初始化成功');
        } catch (e) {
            console.error('数据库初始化失败: ' + JSON.stringify(e));
        }

        if (getToken()) {
            this.launchedChecked = true;
            const authed = await checkAuth();
            if (authed) {
                uni.reLaunch({ url: '/pages/index/index' });
            }
        } else {
            clearToken();
        }
    },
    onShow: function () {
        console.log('App Show');

        if (this.launchedChecked) {
            this.launchedChecked = false;
            return;
        }

        if (getToken()) {
            checkAuth();
        }
    },
    onHide: function () {
        console.log('App Hide');
        stopAuthTimer();
    }
};
</script>

<style>
/* 每个页面公共 css */
</style>
