<!-- pages/test/test.vue -->
<template>
  <view class="container" style="padding: 30rpx;">
    <text style="font-size: 36rpx; font-weight: bold;">数据库验证\n\n</text>

    <!-- 第一步：初始化数据库 -->
    <button @tap="testInitDB" type="primary" style="margin-bottom: 20rpx;">
      1. 初始化数据库
    </button>

    <!-- 第二步：插入测试数据 -->
    <button @tap="testInsert" type="primary" style="margin-bottom: 20rpx;">
      2. 插入一条设备数据
    </button>

    <!-- 第三步：查询数据 -->
    <button @tap="testSelect" type="primary" style="margin-bottom: 20rpx;">
      3. 查询设备列表
    </button>

    <!-- 第四步：验证 Schema -->
    <button @tap="testSchema" type="warn" style="margin-bottom: 20rpx;">
      4. 验证 Schema 注册
    </button>
	
	<button @tap="goFormTest" type="primary" style="margin-bottom: 20rpx;">
	  5. 打开杆塔表单
	</button>

    <!-- 日志输出区 -->
    <view style="margin-top: 30rpx; background: #f5f5f5; padding: 20rpx; border-radius: 10rpx;">
      <text style="font-size: 24rpx; word-break: break-all;">{{ logText }}</text>
    </view>
	
	<!-- 在查询结果下方加个列表 -->
	<view v-for="item in deviceList" :key="item.id"
	      style="padding: 15rpx; border-bottom: 1px solid #eee;"
	      @tap="goEdit(item)">
	  <text>{{ item.name }} - {{ item.device_type }}</text>
	</view>
  </view>
</template>

<script>
import { initDatabase } from '@/db/init.js'
import { dbHelper } from '@/db/dbHelper.js'
import { getSchema, getAllSchemas } from '@/schema/registry.js'

export default {
  data() {
    return {
      logText: '点击按钮开始测试...\n',
	  deviceList: []
    }
  },
  methods: {
    log(msg) {
      console.log(msg)
      this.logText += msg + '\n'
    },

    // ========== 测试1：数据库初始化 ==========
    async testInitDB() {
      try {
        await initDatabase()
        this.log('✅ 数据库初始化成功')
      } catch (e) {
        this.log('❌ 数据库初始化失败: ' + JSON.stringify(e))
      }
    },

    // ========== 测试2：插入数据 ==========
    async testInsert() {
      try {
        const now = Date.now()
        const id = 'test_' + now
        const attributes = {
          pole_number: 'GT-001',
          pole_type: 'straight',
          material: 'concrete',
          height: '12'
        }

        await dbHelper.execute(
          `INSERT INTO t_device 
            (id, task_id, device_type, name, longitude, latitude, parent_id, attributes, photos, status, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            id,
            'task_001',
            'pole',
            '测试杆塔',
            116.397428,
            39.90923,
            '',
            JSON.stringify(attributes),
            '[]',
            'saved',
            now,
            now
          ]
        )
        this.log('✅ 插入成功, id=' + id)
      } catch (e) {
        this.log('❌ 插入失败: ' + JSON.stringify(e))
      }
    },

    // ========== 测试3：查询数据 ==========
    async testSelect() {
      try {
        const rows = await dbHelper.select(
          'SELECT * FROM t_device WHERE task_id=?',
          ['task_001']
        )
        this.log('✅ 查询到 ' + rows.length + ' 条数据')
		this.deviceList = rows
        rows.forEach((row, i) => {
          const attr = JSON.parse(row.attributes || '{}')
          this.log(
            `  [${i}] ${row.name} | 类型=${row.device_type} | 编号=${attr.pole_number} | 经度=${row.longitude}`
          )
        })
      } catch (e) {
        this.log('❌ 查询失败: ' + JSON.stringify(e))
      }
    },

    // ========== 测试4：Schema注册 ==========
    testSchema() {
      try {
        const all = getAllSchemas()
        this.log('✅ 已注册 ' + all.length + ' 种设备类型:')
        all.forEach(s => {
          this.log(`  - ${s.label}(${s.deviceType}), ${s.fields.length}个字段`)
        })

        // 单独取一个验证
        const pole = getSchema('pole')
        if (pole) {
          this.log('✅ 获取pole Schema成功:')
          pole.fields.forEach(f => {
            this.log(`    ${f.key}: ${f.type} ${f.required ? '(必填)' : ''}`)
          })
        } else {
          this.log('❌ 未找到 pole Schema')
        }
      } catch (e) {
        this.log('❌ Schema验证失败: ' + JSON.stringify(e))
      }
    },
	
	// ========== 测试5：打开杆塔页面 ==========
	goFormTest() {
	  uni.navigateTo({
	    url: '/pages/device/edit?taskId=task_001&deviceType=pole'
	  })
	},
	
	goEdit(item) {
	  uni.navigateTo({
	    url: `/pages/device/edit?taskId=${item.task_id}&deviceType=${item.device_type}&deviceId=${item.id}`
	  })
	}
  }
}
</script>