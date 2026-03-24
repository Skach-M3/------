<template>
    <view class="p-4">
        <text class="text-lg font-bold mb-4 block">数据库 & Schema 测试</text>

        <!-- 测试结果展示 -->
        <scroll-view scroll-y class="bg-gray-100 rounded p-3 mb-4" style="height: 400px;">
            <text v-for="(log, i) in logs" :key="i" class="block text-sm mb-1"
                :class="log.type === 'error' ? 'text-red-500' : log.type === 'pass' ? 'text-green-600' : 'text-gray-700'">
                {{ log.msg }}
            </text>
            <text v-if="logs.length === 0" class="text-gray-400">点击下方按钮开始测试</text>
        </scroll-view>

        <!-- 测试按钮 -->
        <view class="space-y-3">
            <button class="bg-blue-500 text-white rounded py-2" @click="testSchema">
                1. 测试 Schema 定义
            </button>
            <button class="bg-blue-500 text-white rounded py-2" @click="testInitDB">
                2. 测试数据库初始化
            </button>
            <button class="bg-blue-500 text-white rounded py-2" @click="testLineDAO">
                3. 测试 LineDAO 增删查
            </button>
            <button class="bg-blue-500 text-white rounded py-2" @click="testDeviceDAO">
                4. 测试 DeviceDAO 全流程
            </button>
            <button class="bg-red-400 text-white rounded py-2" @click="clearLogs">
                清空日志
            </button>
        </view>
    </view>
</template>

<script>
import { initDatabase } from '@/db/init.js'
import { lineDAO } from '@/dao/lineDAO.js'
import { deviceDAO } from '@/dao/deviceDAO.js'
import { getSchema, getAllSchemas, getMainSchemas, getChildSchemas } from '@/schema/registry.js'

export default {
    data() {
        return {
            logs: []
        }
    },
    methods: {
        log(msg) {
            this.logs.push({ msg: `[INFO] ${msg}`, type: 'info' })
        },
        pass(msg) {
            this.logs.push({ msg: `[PASS] ${msg}`, type: 'pass' })
        },
        fail(msg) {
            this.logs.push({ msg: `[FAIL] ${msg}`, type: 'error' })
        },
        clearLogs() {
            this.logs = []
        },

        // ====== 测试1：Schema 纯逻辑验证 ======
        testSchema() {
            this.log('--- Schema 测试开始 ---')

            // 检查注册数量
            const all = getAllSchemas()
            if (all.length === 2) {
                this.pass(`注册了 ${all.length} 个 schema: ${all.map(s => s.deviceType).join(', ')}`)
            } else {
                this.fail(`期望 2 个 schema，实际 ${all.length}`)
            }

            // 检查 pole schema
            const pole = getSchema('pole')
            if (pole) {
                this.pass(`getSchema('pole') 成功，label=${pole.label}`)
            } else {
                this.fail("getSchema('pole') 返回 null")
                return
            }

            // 检查字段数
            if (pole.fields && pole.fields.length > 0) {
                this.pass(`pole 有 ${pole.fields.length} 个字段`)
            } else {
                this.fail('pole.fields 为空')
            }

            // 检查 nameField 指向的字段是否存在
            const nameField = pole.fields.find(f => f.key === pole.nameField)
            if (nameField) {
                this.pass(`nameField '${pole.nameField}' 对应字段存在，label=${nameField.label}`)
            } else {
                this.fail(`nameField '${pole.nameField}' 在 fields 中找不到`)
            }

            // 检查 children
            if (pole.children && pole.children.includes('pole_switchgear')) {
                this.pass('pole.children 包含 pole_switchgear')
            } else {
                this.fail('pole.children 缺少 pole_switchgear')
            }

            // 检查 poleSwitchgear schema
            const sw = getSchema('pole_switchgear')
            if (sw && sw.isChild && sw.parentTypes.includes('pole')) {
                this.pass('pole_switchgear isChild=true, parentTypes 包含 pole')
            } else {
                this.fail('pole_switchgear 子设备配置异常')
            }

            // 检查 getMainSchemas
            const mains = getMainSchemas()
            if (mains.length === 1 && mains[0].deviceType === 'pole') {
                this.pass(`getMainSchemas() 返回 ${mains.length} 个主设备: ${mains[0].deviceType}`)
            } else {
                this.fail(`getMainSchemas() 异常: ${JSON.stringify(mains.map(s => s.deviceType))}`)
            }

            // 检查 getChildSchemas
            const children = getChildSchemas('pole')
            if (children.length === 1 && children[0].deviceType === 'pole_switchgear') {
                this.pass(`getChildSchemas('pole') 返回 ${children.length} 个子设备`)
            } else {
                this.fail(`getChildSchemas('pole') 异常`)
            }

            // 检查 cascading-select 字段
            const wireModel = pole.fields.find(f => f.key === 'wire_model')
            if (wireModel && wireModel.type === 'cascading-select' && wireModel.dependsOn === 'wire_type') {
                const keys = Object.keys(wireModel.optionsMap)
                this.pass(`wire_model 联动字段正常，optionsMap 包含 ${keys.length} 组: ${keys.join(', ')}`)
            } else {
                this.fail('wire_model cascading-select 配置异常')
            }

            // 检查 auto-calc 字段
            const span = pole.fields.find(f => f.key === 'span_length')
            if (span && span.type === 'auto-calc' && span.calcType === 'distance_from_prev') {
                this.pass('span_length auto-calc 字段正常')
            } else {
                this.fail('span_length auto-calc 配置异常')
            }

            // 检查 photoSlots
            if (pole.photoSlots && pole.photoSlots.length === 4) {
                this.pass(`pole 有 ${pole.photoSlots.length} 个照片槽: ${pole.photoSlots.map(s => s.label).join(', ')}`)
            } else {
                this.fail(`pole.photoSlots 数量异常`)
            }

            // 检查 exportOrder 无重复
            const orders = pole.fields.map(f => f.exportOrder).filter(Boolean)
            const unique = new Set(orders)
            if (orders.length === unique.size) {
                this.pass(`exportOrder 无重复 (${orders.length} 个)`)
            } else {
                this.fail('exportOrder 有重复值')
            }

            this.log('--- Schema 测试结束 ---')
        },

        // ====== 测试2：数据库初始化 ======
        async testInitDB() {
            this.log('--- 数据库初始化测试开始 ---')
            try {
                await initDatabase()
                this.pass('initDatabase() 执行成功')
            } catch (e) {
                this.fail(`initDatabase() 失败: ${JSON.stringify(e)}`)
            }
            this.log('--- 数据库初始化测试结束 ---')
        },

        // ====== 测试3：LineDAO ======
        async testLineDAO() {
            this.log('--- LineDAO 测试开始 ---')
            try {
                // 插入
                await lineDAO.insert({
                    station: '测试变电站',
                    name: '测试线路001',
                    unit: '测试单位',
                    recorder: '测试人',
                    createdDate: '2026-03-24'
                })
                this.pass('lineDAO.insert 成功')

                // 查全部
                const all = await lineDAO.findAll()
                if (all.length > 0) {
                    this.pass(`lineDAO.findAll 返回 ${all.length} 条`)
                    const last = all[0]  // DESC 排序，第一条是最新的
                    this.log(`  最新线路: id=${last.id}, name=${last.name}`)

                    // 按ID查
                    const found = await lineDAO.findById(last.id)
                    if (found && found.name === '测试线路001') {
                        this.pass(`lineDAO.findById(${last.id}) 成功`)
                    } else {
                        this.fail('findById 返回数据不匹配')
                    }

                    // 关键字搜索
                    const searched = await lineDAO.findByKeyword('测试')
                    if (searched.length > 0) {
                        this.pass(`lineDAO.findByKeyword('测试') 返回 ${searched.length} 条`)
                    } else {
                        this.fail('findByKeyword 无结果')
                    }

                    // 删除
                    await lineDAO.deleteById(last.id)
                    const afterDel = await lineDAO.findById(last.id)
                    if (!afterDel) {
                        this.pass(`lineDAO.deleteById(${last.id}) 成功`)
                    } else {
                        this.fail('deleteById 后仍能查到数据')
                    }
                } else {
                    this.fail('lineDAO.findAll 无数据')
                }
            } catch (e) {
                this.fail(`LineDAO 测试异常: ${JSON.stringify(e)}`)
            }
            this.log('--- LineDAO 测试结束 ---')
        },

        // ====== 测试4：DeviceDAO 全流程 ======
        async testDeviceDAO() {
            this.log('--- DeviceDAO 测试开始 ---')
            try {
                // 先插入一条线路
                await lineDAO.insert({
                    station: 'DAO测试站',
                    name: 'DAO测试线路',
                    unit: '',
                    recorder: '',
                    createdDate: '2026-03-24'
                })
                const lines = await lineDAO.findAll()
                const lineId = lines[0].id
                this.log(`  测试用线路 id=${lineId}`)

                const now = Date.now()
                const poleId = 'test_pole_' + now
                const swId = 'test_sw_' + now

                // 获取最大排序号
                const maxOrder = await deviceDAO.getMaxSortOrder(lineId)
                this.pass(`getMaxSortOrder 返回 ${maxOrder}`)

                // 插入杆塔
                await deviceDAO.insert({
                    id: poleId,
                    lineId: lineId,
                    deviceType: 'pole',
                    name: '10kV测试路1杆',
                    longitude: 113.12345678,
                    latitude: 23.12345678,
                    prevId: null,
                    parentId: null,
                    sortOrder: maxOrder + 1,
                    attributes: {
                        pole_name: '10kV测试路1杆',
                        pole_height: 12,
                        pole_material: '水泥杆',
                        pole_nature: '直线',
                        wire_arrangement: '水平',
                        wire_type: '绝缘导线',
                        wire_model: 'JKLYJ-10kV-95',
                        auxiliary_equipment: ['接地环', '柱上避雷器']
                    },
                    photos: {
                        overview: ['file://photo1.jpg'],
                        nameplate: []
                    },
                    status: 'saved',
                    createdAt: now,
                    updatedAt: now
                })
                this.pass('deviceDAO.insert 杆塔成功')

                // 插入柱上开关（子设备）
                await deviceDAO.insert({
                    id: swId,
                    lineId: lineId,
                    deviceType: 'pole_switchgear',
                    name: '10kV测试路1杆-智能',
                    longitude: 113.12345678,
                    latitude: 23.12345678,
                    prevId: null,
                    parentId: poleId,
                    sortOrder: 1,
                    attributes: {
                        switch_name: '10kV测试路1杆-智能',
                        switch_function: ['分段', '联络'],
                        switch_status: '合',
                        switch_type: '智能',
                        switch_target: '某分支线'
                    },
                    photos: {
                        name_plate: [],
                        close_up: []
                    },
                    status: 'saved',
                    createdAt: now,
                    updatedAt: now
                })
                this.pass('deviceDAO.insert 柱上开关成功')

                // 查线路主设备
                const mainDevices = await deviceDAO.findByLineId(lineId)
                if (mainDevices.length >= 1) {
                    this.pass(`findByLineId 返回 ${mainDevices.length} 个主设备`)
                    const pole = mainDevices.find(d => d.id === poleId)
                    if (pole) {
                        // 验证 attributes 能正确解析
                        const attrs = JSON.parse(pole.attributes)
                        if (attrs.pole_material === '水泥杆' && Array.isArray(attrs.auxiliary_equipment)) {
                            this.pass('attributes JSON 解析正确')
                        } else {
                            this.fail('attributes 内容不匹配')
                        }
                        // 验证 photos 能正确解析
                        const photos = JSON.parse(pole.photos)
                        if (photos.overview && photos.overview.length === 1) {
                            this.pass('photos JSON 解析正确')
                        } else {
                            this.fail('photos 内容不匹配')
                        }
                    }
                } else {
                    this.fail('findByLineId 无数据')
                }

                // 查子设备
                const children = await deviceDAO.findChildren(poleId)
                if (children.length === 1 && children[0].device_type === 'pole_switchgear') {
                    this.pass(`findChildren 返回 ${children.length} 个子设备`)
                } else {
                    this.fail(`findChildren 异常: ${children.length}`)
                }

                // 查最后一个主设备
                const lastDevice = await deviceDAO.findLastDevice(lineId)
                if (lastDevice && lastDevice.id === poleId) {
                    this.pass('findLastDevice 正确返回最新杆塔')
                } else {
                    this.fail('findLastDevice 异常')
                }

                // 查全部（含子设备），用于导出
                const allDevices = await deviceDAO.findAllByLineId(lineId)
                if (allDevices.length >= 2) {
                    this.pass(`findAllByLineId 返回 ${allDevices.length} 条（含子设备）`)
                } else {
                    this.fail(`findAllByLineId 数量异常: ${allDevices.length}`)
                }

                // 更新杆塔
                await deviceDAO.update({
                    id: poleId,
                    name: '10kV测试路1杆(改)',
                    longitude: 113.99999999,
                    latitude: 23.99999999,
                    prevId: null,
                    parentId: null,
                    sortOrder: maxOrder + 1,
                    attributes: { pole_name: '10kV测试路1杆(改)', pole_height: 15 },
                    photos: {},
                    status: 'saved',
                    updatedAt: Date.now()
                })
                const updated = await deviceDAO.findById(poleId)
                if (updated && updated.name === '10kV测试路1杆(改)') {
                    this.pass('deviceDAO.update 成功')
                } else {
                    this.fail('update 后数据不匹配')
                }

                // 删除（含子设备）
                await deviceDAO.deleteById(poleId)
                const afterDel = await deviceDAO.findById(poleId)
                const childAfterDel = await deviceDAO.findById(swId)
                if (!afterDel && !childAfterDel) {
                    this.pass('deleteById 成功删除杆塔及子设备')
                } else {
                    this.fail('deleteById 后仍有残留数据')
                }

                // 清理测试线路
                await lineDAO.deleteById(lineId)
                this.pass('测试数据清理完毕')

            } catch (e) {
                this.fail(`DeviceDAO 测试异常: ${JSON.stringify(e)}`)
            }
            this.log('--- DeviceDAO 测试结束 ---')
        }
    }
}
</script>