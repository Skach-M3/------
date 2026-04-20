<template>
    <view class="page">
        <!-- 上级节点选择卡片 -->
        <view v-if="showPreNodeSelect" class="card">
            <view class="card-header">
                <text class="card-title">{{ currentSchema.preNodeFieldName || '上级节点' }}</text>
            </view>
            <view class="form-item">
                <view class="pre-node-picker">
                    <view class="picker-content" @click="goToPreNodeSelect">
                        <view v-if="prevId" class="pre-node-info">
                            <view class="icon-box" :style="{ backgroundColor: themeColor }">
                                <image class="device-icon" :src="getPreNodeIcon()" mode="aspectFit"></image>
                            </view>
                            <view class="pre-node-content">
                                <text class="pre-node-type">{{ getPreNodeDeviceLabel() }}</text>
                                <text class="pre-node-name">{{ preNodeDisplay }}</text>
                            </view>
                        </view>
                        <text v-else class="picker-placeholder">
                            {{ '请选择' + (currentSchema.preNodeFieldName || '上级节点') }}
                        </text>
                    </view>
                    <view class="picker-actions">
                        <view v-if="prevId" class="clear-btn" @click.stop="clearPreNode">
                            <text class="clear-icon">×</text>
                        </view>
                        <text class="picker-arrow">›</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 属性表单卡片 -->
        <view class="card">
            <view class="card-header">
                <text class="card-title">{{ currentSchema.label }}</text>
                <view v-if="showCopyFromParent" class="copy-btn" @click="handleCopyFromParent">
                    <text class="copy-btn-text">复制上级节点信息</text>
                </view>
            </view>

            <view class="schema-form">
                <view v-for="(group, groupIndex) in groupedFields" :key="groupIndex" class="form-group">
                    <view v-if="group.name" class="section-header">
                        <text class="section-title">{{ group.name }}</text>
                    </view>

                    <block v-for="(field, index) in group.fields" :key="index">
                        <block v-if="field.type !== 'hidden' && isFieldVisible(field)">
                            <view class="form-item">
                                <view class="form-label-row">
                                    <text class="form-label">{{ field.label }}</text>
                                    <text v-if="field.required" class="required-star">*</text>
                                </view>

                                <!-- text -->
                                <input v-if="field.type === 'text'" class="form-input" :value="attributes[field.key]"
                                    :placeholder="field.placeholder || ('请输入' + field.label)"
                                    @input="onInput(field.key, $event.detail.value)" />

                                <!-- auto-text（新增） -->
                                <input v-else-if="field.type === 'auto-text'" class="form-input"
                                    :value="attributes[field.key]" :disabled="field.editable === false"
                                    :placeholder="field.placeholder || ('请输入' + field.label)"
                                    @input="onInput(field.key, $event.detail.value)" />

                                <!-- auto-fill（新增） -->
                                <view v-else-if="field.type === 'auto-fill'" class="auto-calc-box">
                                    <text class="auto-calc-value">{{ attributes[field.key] || field.placeholder || '—'
                                        }}</text>
                                </view>

                                <!-- composite-name -->
                                <view v-else-if="field.type === 'composite-name'" class="composite-name-wrapper">
                                    <textarea class="composite-name-prefix" :value="compositePrefix" disabled
                                        auto-height />
                                    <textarea class="composite-name-suffix" :value="compositeSuffix"
                                        :placeholder="field.placeholder || ('请输入' + field.label)"
                                        @input="onCompositeInput(field.key, $event.detail.value)" auto-height />
                                </view>

                                <!-- select -->
                                <view v-else-if="field.type === 'select'" class="select-wrapper">
                                    <picker :disabled="field.editable === false" :range="getLabelsArray(field.options)"
                                        :value="getPickerIndex(field.options, attributes[field.key])"
                                        @change="onPickerChange(field.key, field.options, $event)">
                                        <view class="picker-box"
                                            :class="{ 'picker-disabled': field.editable === false }">
                                            <text :class="attributes[field.key] ? 'picker-text' : 'picker-placeholder'">
                                                {{ getDisplayLabel(field.options, attributes[field.key]) || ('请选择' +
                                                    field.label) }}
                                            </text>
                                            <text v-if="field.editable !== false" class="picker-arrow">›</text>
                                        </view>
                                    </picker>
                                    <view v-if="field.editable !== false && attributes[field.key]" class="clear-btn"
                                        @click="onClearSelect(field.key)">
                                        <text class="clear-icon">×</text>
                                    </view>
                                </view>

                                <!-- textarea -->
                                <textarea v-else-if="field.type === 'textarea'" class="form-textarea"
                                    :value="attributes[field.key]"
                                    :placeholder="field.placeholder || ('请输入' + field.label)"
                                    :maxlength="field.maxLength || 500"
                                    @input="onInput(field.key, $event.detail.value)" />

                                <!-- auto-calc -->
                                <view v-else-if="field.type === 'auto-calc'" class="auto-calc-box">
                                    <text class="auto-calc-value">
                                        {{
                                            field.decimal && attributes[field.key]
                                                ? Number(attributes[field.key]).toFixed(field.decimal)
                                                : (attributes[field.key] || '—')
                                        }}
                                    </text>
                                    <text v-if="field.unit && attributes[field.key]" class="auto-calc-unit">{{
                                        field.unit }}</text>
                                </view>

                                <!-- switchgear_layout -->
                                <view v-else-if="field.type === 'switchgear_layout'" class="layout-wrap">
                                    <view v-if="busbarCount <= 0" class="layout-empty">
                                        <text class="layout-empty-text">无母线，不需要配置开关柜布局</text>
                                    </view>

                                    <view v-else>
                                        <view v-if="!canCreateSwitchgear" class="warning-capsule-wrapper">
                                            <view class="warning-capsule">
                                                请先保存站房，生成ID后再新建开关柜
                                            </view>
                                        </view>
                                        <scroll-view scroll-x class="layout-scroll" v-if="canCreateSwitchgear">
                                            <view class="layout-grid">
                                                <view v-for="seg in busbarSegments" :key="seg" class="layout-col">
                                                    <view class="layout-col-title">{{ busbarLabels[seg - 1] }}段母线</view>
                                                    <view class="layout-counter">
                                                        <view class="counter-btn"
                                                            :class="{ 'counter-btn-disabled': !canCreateSwitchgear || getSwitchgearCount(seg - 1) <= 0 }"
                                                            @click="decreaseCount(seg - 1)">
                                                            <text>-</text>
                                                        </view>
                                                        <text class="counter-value">{{ getSwitchgearCount(seg - 1)
                                                        }}</text>
                                                        <view class="counter-btn"
                                                            :class="{ 'counter-btn-disabled': !canCreateSwitchgear }"
                                                            @click="increaseCount(seg - 1)">
                                                            <text>+</text>
                                                        </view>
                                                    </view>

                                                    <view v-for="(item, rowIdx) in getSwitchgearList(seg - 1)"
                                                        :key="item.localId" class="layout-item"
                                                        :class="{ 'layout-item-active': isSelectedSwitchgear(seg - 1, rowIdx) }"
                                                        @click="onSelectSwitchgear(seg - 1, rowIdx)">
                                                        <text class="layout-item-index">{{ rowIdx + 1 }}</text>
                                                        <text class="layout-item-name">{{ item.name || ''
                                                        }}</text>
                                                        <view class="switch-status-indicator" :class="{
                                                            'switch-status-on': item.switch_status === '合',
                                                            'switch-status-off': item.switch_status === '分'
                                                        }"></view>
                                                    </view>
                                                </view>
                                            </view>
                                        </scroll-view>

                                        <view v-if="selectedSwitchgearData" class="switchgear-editor">
                                            <view class="switchgear-editor-title">
                                                {{ getSelectedTitle() }}
                                            </view>

                                            <view v-for="field in switchgearEditorFields" :key="field.key"
                                                class="form-item">
                                                <view class="form-label-row">
                                                    <view class="form-label">
                                                        {{ field.label }}
                                                        <text v-if="field.required" class="required-star">*</text>
                                                    </view>
                                                </view>


                                                <!-- text -->
                                                <input v-if="field.type === 'text'" class="form-input"
                                                    :value="getSelectedSwitchgearValue(field.key)"
                                                    :placeholder="field.placeholder || ('请输入' + field.label)"
                                                    @input="updateSelectedSwitchgearField(field.key, $event.detail.value)" />

                                                <!-- auto-text -->
                                                <input v-else-if="field.type === 'auto-text'" class="form-input"
                                                    :value="getSelectedSwitchgearValue(field.key)"
                                                    :disabled="field.editable === false"
                                                    :placeholder="field.placeholder || ('请输入' + field.label)"
                                                    @input="updateSelectedSwitchgearField(field.key, $event.detail.value)" />

                                                <!-- auto-fill -->
                                                <view v-else-if="field.type === 'auto-fill'" class="auto-calc-box">
                                                    <text class="auto-calc-value">{{
                                                        getSelectedSwitchgearValue(field.key) || field.placeholder ||
                                                        '—' }}</text>
                                                </view>

                                                <!-- select -->
                                                <picker v-else-if="field.type === 'select'"
                                                    :range="(field.options || []).map(o => o.label)"
                                                    :value="getSelectedSwitchgearSelectIndex(field)"
                                                    @change="onSelectedSwitchgearSelectChange(field, $event)">
                                                    <view class="picker-box"
                                                        :class="{ 'picker-disabled': field.editable === false }">
                                                        <text class="picker-text"
                                                            v-if="getSelectedSwitchgearValue(field.key)">
                                                            {{ getSelectedSwitchgearValue(field.key) }}
                                                        </text>
                                                        <text v-else class="picker-placeholder">
                                                            {{ field.placeholder || ('请选择' + field.label) }}
                                                        </text>
                                                    </view>
                                                </picker>

                                                <!-- textarea -->
                                                <textarea v-else-if="field.type === 'textarea'" class="form-textarea"
                                                    :value="getSelectedSwitchgearValue(field.key)"
                                                    :placeholder="field.placeholder || ('请输入' + field.label)"
                                                    :maxlength="field.maxLength || 500"
                                                    @input="updateSelectedSwitchgearField(field.key, $event.detail.value)" />
                                            </view>

                                            <!-- 开关柜照片区域 -->
                                            <view v-if="showSelectedSwitchgearPhotoSection" class="photo-section">
                                                <view class="section-header">
                                                    <text class="section-title">开关柜照片</text>
                                                </view>

                                                <view class="photo-grid">
                                                    <view v-for="slot in selectedSwitchgearAllPhotoSlots"
                                                        :key="slot.key" class="photo-grid-item">
                                                        <view
                                                            :class="['photo-slot', selectedSwitchgearPhotos[slot.key] ? 'photo-slot-taken' : '']"
                                                            @click="onSwitchgearSlotTap(slot)">
                                                            <template v-if="selectedSwitchgearPhotos[slot.key]">
                                                                <image :src="selectedSwitchgearPhotos[slot.key]"
                                                                    mode="aspectFill" class="photo-thumb" />
                                                                <view class="photo-taken-badge">✓</view>
                                                            </template>
                                                            <view v-else class="photo-placeholder">
                                                                <image :src="cameraIconSvg" class="camera-icon-svg"
                                                                    mode="aspectFit" />
                                                            </view>
                                                        </view>
                                                        <text class="photo-label">{{ slot.label }}</text>
                                                    </view>

                                                    <view v-if="selectedSwitchgearAllowExtraSlot"
                                                        class="photo-grid-item">
                                                        <view class="photo-slot add-slot"
                                                            @click="onSwitchgearAddSlotTap">
                                                            <text class="add-icon">+</text>
                                                        </view>
                                                    </view>
                                                </view>
                                            </view>
                                        </view>
                                    </view>
                                </view>
                            </view>
                        </block>
                    </block>
                </view>

                <!-- 照片区域 -->
                <view v-if="showPhotoSection" class="photo-section">
                    <view class="section-header">
                        <text class="section-title">照片</text>
                    </view>

                    <view class="photo-grid">
                        <view v-for="slot in allPhotoSlots" :key="slot.key" class="photo-grid-item">
                            <view :class="['photo-slot', photos[slot.key] ? 'photo-slot-taken' : '']"
                                @click="onSlotTap(slot)">
                                <template v-if="photos[slot.key]">
                                    <image :src="photos[slot.key]" mode="aspectFill" class="photo-thumb" />
                                    <view class="photo-taken-badge">✓</view>
                                </template>
                                <view v-else class="photo-placeholder">
                                    <image :src="cameraIconSvg" class="camera-icon-svg" mode="aspectFit" />
                                </view>
                            </view>
                            <text class="photo-label">{{ slot.label }}</text>
                        </view>

                        <view v-if="allowExtraSlot" class="photo-grid-item">
                            <view class="photo-slot add-slot" @click="onAddSlotTap">
                                <text class="add-icon">+</text>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- ActionSheet -->
                <view v-if="actionSheet.visible" class="action-sheet-mask" @click="closeActionSheet">
                    <view class="action-sheet-panel" @click.stop>
                        <view class="action-sheet-group">
                            <view class="action-sheet-item" @click="handleActionPreviewPhoto">
                                <text class="action-sheet-text">查看照片</text>
                            </view>
                            <view class="action-sheet-divider"></view>
                            <view class="action-sheet-item" @click="handleActionRetakePhoto">
                                <text class="action-sheet-text">重新拍照</text>
                            </view>
                            <view class="action-sheet-divider"></view>
                            <view class="action-sheet-item" @click="handleActionDeletePhoto">
                                <text class="action-sheet-text action-sheet-text-danger">删除照片</text>
                            </view>
                        </view>
                        <view class="action-sheet-cancel" @click="closeActionSheet">
                            <text class="action-sheet-text action-sheet-text-bold">取消</text>
                        </view>
                    </view>
                </view>

                <!-- 新增槽位弹窗 -->
                <view v-if="addSlotModal.visible" class="modal-mask" @click="onCancelAddSlot">
                    <view class="modal-panel" @click.stop>
                        <view class="modal-header">
                            <text class="modal-title">新增照片</text>
                        </view>
                        <view class="modal-body">
                            <input v-model="addSlotModal.label" class="modal-input" placeholder="请输入照片名称"
                                placeholder-class="modal-input-placeholder" maxlength="20" focus />
                        </view>
                        <view class="modal-footer">
                            <view class="modal-btn modal-btn-cancel" @click="onCancelAddSlot">
                                <text class="modal-btn-text">取消</text>
                            </view>
                            <view class="modal-footer-divider"></view>
                            <view class="modal-btn modal-btn-confirm" @click="onConfirmAddSlot">
                                <text class="modal-btn-text modal-btn-text-primary">确认</text>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 自定义输入弹窗 -->
                <view v-if="customInputModal.visible" class="modal-mask" @click.self="onCancelCustomInput">
                    <view class="modal-panel" @click.stop>
                        <view class="modal-header">
                            <text class="modal-title">输入自定义选项</text>
                        </view>
                        <view class="modal-body">
                            <input v-model="customInputModal.inputValue" class="modal-input" placeholder="请输入自定义内容"
                                placeholder-class="modal-input-placeholder" maxlength="20" focus
                                @input="customInputModal.inputValue = $event.detail.value" />
                        </view>
                        <view class="modal-footer">
                            <view class="modal-btn modal-btn-cancel" @click="onCancelCustomInput">
                                <text class="modal-btn-text">取消</text>
                            </view>
                            <view class="modal-footer-divider"></view>
                            <view class="modal-btn modal-btn-confirm" @click="onConfirmCustomInput">
                                <text class="modal-btn-text modal-btn-text-primary">确认</text>
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- 底部保存 -->
        <view class="bottom-bar">
            <button class="save-btn" @click="onSave">保存</button>
        </view>
    </view>

    <!-- 水印绘制 canvas  -->
    <canvas canvas-id="watermarkCanvas"
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px', position: 'fixed', left: '-9999px' }"></canvas>
</template>

<script>
import station from '@/schema/station'
import stationSwitchgear from '@/schema/stationSwitchgear'
import deviceDAO from '@/dao/deviceDAO.js'
import { themeColor } from '@/static/themeColor.js'
import { getPinSvgUri } from '@/static/device_svgs.js'
import { getSchema } from '@/schema/index.js'
import { TIANDITU_KEY } from '@/utils/getKey.js';

export default {
    data() {
        return {
            canvasWidth: 0,
            canvasHeight: 0,
            TIANDITU_KEY,
            // 路由参数
            lineId: '',
            lineName: '',
            deviceType: 'station',
            deviceId: '',
            parentId: '',
            routeQuery: {}, // 缓存路由参数


            cabinetNumberManuallyEdited: false, // 开关柜编号是否手工修改

            // 上级节点缓存
            prevDeviceType: '',
            prevDeviceAttributes: null,

            // 链表 & 排序
            prevId: '',
            sortOrder: 1,

            // 定位
            longitude: '',
            latitude: '',

            // 表单数据
            attributes: {},

            // 当前 schema（固定 station）
            currentSchema: station,

            // 上级节点显示
            preNodeDisplay: '',
            themeColor,

            // 照片
            photos: {},
            extraPhotoSlots: [],

            // 自定义输入
            customValues: {},
            customInputModal: {
                visible: false,
                fieldKey: '',
                inputValue: '',
                isMulti: false
            },

            // 布局编辑选中态
            selectedSwitchgear: null,

            actionSheet: {
                visible: false,
                slot: null
            },
            addSlotModal: {
                visible: false,
                label: '',
                target: 'station' // station | switchgear
            },

            busbarLabels: ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'],

            cameraIconSvg:
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z'/%3E%3Ccircle cx='12' cy='13' r='4'/%3E%3C/svg%3E"
        }
    },

    computed: {
        showPreNodeSelect() {
            return this.currentSchema.isPreNodeEditable === true
        },
        showCopyFromParent() {
            return !!(this.prevId && this.prevDeviceType && this.prevDeviceType === this.deviceType)
        },
        groupedFields() {
            const fields = this.currentSchema?.fields || []
            const groups = []
            const groupMap = new Map()
            fields.forEach(field => {
                const groupName = field.group || ''
                if (!groupMap.has(groupName)) {
                    const group = { name: groupName, fields: [] }
                    groupMap.set(groupName, group)
                    groups.push(group)
                }
                groupMap.get(groupName).fields.push(field)
            })
            return groups
        },
        compositePrefix() {
            return this.lineName ? `${this.lineName}` : ''
        },
        compositeNameField() {
            return this.currentSchema?.fields?.find(f => f.type === 'composite-name')
        },
        compositeSuffix() {
            const field = this.compositeNameField
            if (!field) return ''

            const value = String(this.attributes[field.key] || '')
            const prefix = this.compositePrefix

            // 线路名后直接接后缀
            if (value.startsWith(prefix)) {
                return value.substring(prefix.length)
            }
            return value
        },
        allPhotoSlots() {
            const base = this.currentSchema?.photoSlots || []
            return [...base, ...this.extraPhotoSlots]
        },
        showPhotoSection() {
            return Array.isArray(this.currentSchema?.photoSlots) && this.currentSchema.photoSlots.length > 0
        },
        allowExtraSlot() {
            return !!this.currentSchema?.extraPhotoSlot
        },
        busbarCount() {
            const n = Number(this.attributes.busbar_count || 0)
            return Number.isNaN(n) ? 0 : Math.max(0, Math.min(4, n))
        },
        busbarSegments() {
            return Array.from({ length: this.busbarCount }, (_, i) => i + 1)
        },
        selectedSwitchgearData() {
            if (!this.selectedSwitchgear) return null
            const { segIndex, rowIndex } = this.selectedSwitchgear
            const layout = this.normalizeLayout(this.attributes.switchgear_layout)
            if (!layout[segIndex] || !layout[segIndex][rowIndex]) return null
            return layout[segIndex][rowIndex]
        },
        switchgearSchema() {
            return stationSwitchgear
        },
        switchgearEditorFields() {
            const fields = this.switchgearSchema?.fields || []
            // 布局内只编辑这些可见字段；隐藏字段由布局自动写入
            return fields.filter(f => [
                'belong_station',
                'cabinet_name',
                'cabinet_number',
                'cabinet_type',
                'switch_status',
                'remark_1',
                'remark_2'
            ].includes(f.key))
        },
        stationId() {
            return (
                this.deviceId ||
                ''
            )
        },
        canCreateSwitchgear() {
            return !!this.stationId
        },

        switchgearBasePhotoSlots() {
            return Array.isArray(this.switchgearSchema?.photoSlots) ? this.switchgearSchema.photoSlots : []
        },
        selectedSwitchgearPhotos() {
            const row = this.selectedSwitchgearData
            return row?._photos || {}
        },
        selectedSwitchgearExtraPhotoSlots() {
            const row = this.selectedSwitchgearData
            return Array.isArray(row?._extraPhotoSlots) ? row._extraPhotoSlots : []
        },
        selectedSwitchgearAllPhotoSlots() {
            return [...this.switchgearBasePhotoSlots, ...this.selectedSwitchgearExtraPhotoSlots]
        },
        showSelectedSwitchgearPhotoSection() {
            return !!this.selectedSwitchgearData && this.switchgearBasePhotoSlots.length > 0
        },
        selectedSwitchgearAllowExtraSlot() {
            return !!this.switchgearSchema?.extraPhotoSlot
        },
    },

    onLoad(query) {
        this.routeQuery = query || {} // 新增

        this.lineId = query.lineId || ''
        this.lineName = query.lineName ? decodeURIComponent(query.lineName) : ''
        this.deviceType = query.deviceType || 'station'
        this.deviceId = query.deviceId || ''
        this.parentId = query.parentId || ''

        if (query.lat) this.latitude = query.lat
        if (query.lng) this.longitude = query.lng

        this.currentSchema = this.getSchemaByType(this.deviceType)

        uni.setNavigationBarTitle({
            title: (this.deviceId ? '编辑' : '新增') + this.currentSchema.label
        })

        if (this.deviceId) {
            this.loadDevice()
        } else {
            this.initNewDevice()
        }
    },

    methods: {
        /* ========== 数据加载 ========== */
        async loadDevice() {
            try {
                const device = await deviceDAO.findById(this.deviceId)
                if (!device) {
                    uni.showToast({ title: '设备不存在', icon: 'none' })
                    return
                }

                this.longitude = device.longitude || ''
                this.latitude = device.latitude || ''
                this.parentId = device.parent_id || ''
                this.prevId = device.prev_id || ''
                this.sortOrder = device.sort_order || 1

                const attrs = device.attributes
                    ? (typeof device.attributes === 'string' ? JSON.parse(device.attributes) : device.attributes)
                    : {}

                if (attrs._photos) {
                    this.photos = attrs._photos
                    delete attrs._photos
                } else {
                    this.photos = {}
                }

                const extraSlots = attrs._extraPhotoSlots || []
                delete attrs._extraPhotoSlots

                this.attributes = attrs
                this.extraPhotoSlots = extraSlots

                this.ensureLayoutByBusbarCount()
                await this.loadPreNodeDisplay()
                this.syncCoordsToAttributes()

                // 从 devices 表加载已有的 station_switchgear 合并到布局
                if (this.deviceType === 'station') {
                    await this.loadSwitchgearFromDB()
                }

                // 编辑态默认视为已确定编号，避免自动覆盖
                if (this.deviceType === 'stationSwitchgear') {
                    this.cabinetNumberManuallyEdited = true
                }
            } catch (e) {
                console.error('加载设备失败:', e)
                uni.showToast({ title: '加载失败', icon: 'none' })
            }
        },

        /** 从 devices 表加载子开关柜，按 region_key + sort_index 重建 switchgear_layout */
        async loadSwitchgearFromDB() {
            try {
                const list = await deviceDAO.findByParent(
                    this.lineId,
                    'station_switchgear',
                    this.deviceId
                )
                if (!Array.isArray(list)) return

                this.ensureLayoutByBusbarCount()
                const layout = this.normalizeLayout(this.attributes.switchgear_layout)

                // 以 DB 为准重建每段母线的柜列表
                for (let i = 0; i < layout.length; i += 1) layout[i] = []

                list.forEach(device => {
                    const attrs = device.attributes
                        ? (typeof device.attributes === 'string' ? JSON.parse(device.attributes) : device.attributes)
                        : {}

                    // 1) 优先用 region_key（形如 seg_1/seg_2）解析段索引
                    let segIndex = -1
                    if (attrs.region_key) {
                        const m = String(attrs.region_key).match(/\d+/)
                        if (m) segIndex = parseInt(m[0], 10) - 1
                    }
                    // 2) 兜底：按 sort_order 回推
                    if (segIndex < 0 && device.sort_order !== undefined) {
                        segIndex = Math.floor((device.sort_order || 0) / 100)
                    }
                    if (segIndex < 0 || segIndex >= layout.length) return

                    const sortIdx = Number(attrs.sort_index)
                    const rowIndex = Number.isFinite(sortIdx) && sortIdx > 0
                        ? sortIdx - 1
                        : layout[segIndex].length

                    const row = {
                        deviceId: device.id,
                        localId: `db_${device.id}`,
                        belong_station: attrs.belong_station || '',
                        name: attrs.cabinet_name || device.name || '',
                        cabinet_name: attrs.cabinet_name || device.name || '',
                        cabinet_number: attrs.cabinet_number || '',
                        cabinet_type: attrs.cabinet_type || '',
                        switch_status: attrs.switch_status || '',
                        remark_1: attrs.remark_1 || '',
                        remark_2: attrs.remark_2 || '',
                        region_label: attrs.region_label || '',
                        region_key: attrs.region_key || '',
                        sort_index: attrs.sort_index || 0,
                        _photos: attrs._photos || {},
                        _extraPhotoSlots: attrs._extraPhotoSlots || []
                    }

                    // 填到指定位置，允许稀疏
                    layout[segIndex][rowIndex] = row
                })

                // 压实稀疏数组（去掉空洞）
                for (let i = 0; i < layout.length; i += 1) {
                    layout[i] = (layout[i] || []).filter(Boolean)
                }

                this.attributes = { ...this.attributes, switchgear_layout: layout }
            } catch (e) {
                console.error('加载开关柜失败:', e)
            }
        },

        /**
         * 把 switchgear_layout 同步到 devices 表
         * - 有 deviceId 且仍存在 → update
         * - 无 deviceId → insert
         * - DB 中已有但 layout 里已移除 → deleteWithChildren
         */
        async syncSwitchgearToDB(stationId) {
            if (!stationId) return

            const layout = this.normalizeLayout(this.attributes.switchgear_layout)
            const stationName = this.getStationNameForLayout()

            // 1) 先查 DB 里已有的
            let existingList = []
            try {
                existingList = await deviceDAO.findByParent(
                    this.lineId,
                    'station_switchgear',
                    stationId
                ) || []
            } catch (e) {
                console.warn('查询子开关柜失败:', e)
                existingList = []
            }
            const existingIdSet = new Set(existingList.map(d => d.id))
            const keptIdSet = new Set()

            // 2) 遍历 layout，insert/update
            for (let segIndex = 0; segIndex < layout.length; segIndex += 1) {
                const col = layout[segIndex] || []
                for (let rowIndex = 0; rowIndex < col.length; rowIndex += 1) {
                    const row = col[rowIndex]
                    if (!row) continue

                    const belongStation = row.belong_station || stationName || ''
                    const cabinetNumber =
                        row.cabinet_number ||
                        this.buildLayoutCabinetNumber(segIndex, rowIndex, belongStation)

                    const attrs = {
                        belong_station: belongStation,
                        cabinet_name: row.cabinet_name || row.name || '',
                        cabinet_number: cabinetNumber,
                        cabinet_type: row.cabinet_type || '',
                        switch_status: row.switch_status || '',
                        remark_1: row.remark_1 || '',
                        remark_2: row.remark_2 || '',
                        region_label: row.region_label || `${this.busbarLabels[segIndex] || ''}段`,
                        region_key: row.region_key || `seg_${segIndex + 1}`,
                        sort_index: rowIndex + 1,
                        _photos: row._photos || {},
                        _extraPhotoSlots: row._extraPhotoSlots || []
                    }

                    const name = attrs.cabinet_name || cabinetNumber || '开关柜'
                    const sortOrder = segIndex * 100 + rowIndex + 1

                    const deviceData = {
                        line_id: this.lineId,
                        device_type: 'station_switchgear',
                        parent_id: stationId,
                        prev_id: '',
                        name,
                        longitude: '',
                        latitude: '',
                        sort_order: sortOrder,
                        attributes: JSON.stringify(attrs)
                    }

                    try {
                        if (row.deviceId && existingIdSet.has(row.deviceId)) {
                            await deviceDAO.update(row.deviceId, deviceData)
                            keptIdSet.add(row.deviceId)
                        } else {
                            const newId = await deviceDAO.insert(deviceData)
                            row.deviceId = newId
                            keptIdSet.add(newId)
                        }
                        // 回写到布局项（便于用户保存后继续编辑）
                        row.cabinet_number = cabinetNumber
                        row.belong_station = belongStation
                        row.region_label = attrs.region_label
                        row.region_key = attrs.region_key
                        row.sort_index = attrs.sort_index
                    } catch (e) {
                        console.error(`同步开关柜失败(${segIndex + 1}-${rowIndex + 1}):`, e)
                        throw e
                    }
                }
            }

            // 3) 删除 DB 中已被用户移除的开关柜
            for (const existing of existingList) {
                if (!keptIdSet.has(existing.id)) {
                    try {
                        await deviceDAO.deleteWithChildren(existing.id)
                    } catch (e) {
                        console.warn('删除旧开关柜失败:', e)
                    }
                }
            }

            // 4) 回写布局到 attributes
            this.attributes = { ...this.attributes, switchgear_layout: layout }
        },

        async initNewDevice() {
            try {
                const lastDevice = await deviceDAO.findLastAvailablePreNode(this.lineId)
                if (lastDevice) {
                    this.prevId = lastDevice.id
                    this.sortOrder = (lastDevice.sort_order || 0) + 1
                } else {
                    this.prevId = ''
                    this.sortOrder = 1
                }

                this.attributes = {}
                this.photos = {}
                this.extraPhotoSlots = []
                this.selectedSwitchgear = null
                this.cabinetNumberManuallyEdited = false

                await this.loadPreNodeDisplay()

                this.$nextTick(async () => {
                    this.initDefaults()
                    await this.initSwitchgearFields()
                    this.syncCoordsToAttributes()
                })
            } catch (e) {
                console.error('初始化新设备失败:', e)
            }
        },

        async loadPreNodeDisplay() {
            if (!this.prevId) {
                this.preNodeDisplay = ''
                this.prevDeviceType = ''
                this.prevDeviceAttributes = null
                return
            }
            try {
                const device = await deviceDAO.findById(this.prevId)
                if (device) {
                    this.preNodeDisplay = device.name || '未命名'
                    this.prevDeviceType = device.device_type || ''
                    const attrs = device.attributes
                        ? (typeof device.attributes === 'string' ? JSON.parse(device.attributes) : device.attributes)
                        : {}
                    this.prevDeviceAttributes = attrs
                }
            } catch (e) {
                console.error('加载上级节点名称失败:', e)
            }
        },

        /** 获取上级节点图标 */
        getPreNodeIcon() {
            return getPinSvgUri(this.prevDeviceType)
        },

        /** 获取上级节点设备类型标签 */
        getPreNodeDeviceLabel() {
            const schema = getSchema(this.prevDeviceType)
            return schema ? schema.label : this.prevDeviceType
        },

        getSchemaByType(type) {
            const map = {
                station,
                'station_switchgear': stationSwitchgear
            }
            return map[type] || station
        },

        goToPreNodeSelect() {
            uni.navigateTo({
                url: `/pages/device/preNode?lineId=${this.lineId}&lineName=${encodeURIComponent(this.lineName)}&deviceId=${this.deviceId}&isPreNodeSelect=true`,
                events: {
                    selectPreNode: (data) => {
                        this.handlePreNodeSelected(data)
                    }
                }
            })
        },

        async handlePreNodeSelected(data) {
            if (!data) return

            this.prevId = data.id
            this.preNodeDisplay = data.name || ''
            this.prevDeviceType = data.device_type || ''

            if (data.id) {
                try {
                    const prevDevice = await deviceDAO.findById(data.id)
                    if (prevDevice) {
                        this.prevDeviceType = prevDevice.device_type || ''
                        const attrs = prevDevice.attributes
                            ? (typeof prevDevice.attributes === 'string' ? JSON.parse(prevDevice.attributes) : prevDevice.attributes)
                            : {}
                        this.prevDeviceAttributes = attrs
                    }
                } catch (e) {
                    console.warn('加载上级设备失败:', e)
                }
            } else {
                this.prevDeviceType = ''
                this.prevDeviceAttributes = null
            }
        },

        /** 清除上级节点 */
        clearPreNode() {
            this.prevId = ''
            this.preNodeDisplay = ''
            this.prevDeviceType = ''
            this.prevDeviceAttributes = null
        },

        async handleCopyFromParent() {
            const copyableKeys = (this.currentSchema.fields || [])
                .filter(f => f.isCopyable)
                .map(f => f.key)

            if (copyableKeys.length === 0) {
                uni.showToast({ title: '没有可复制的字段', icon: 'none' })
                return
            }

            let parentAttrs = this.prevDeviceAttributes
            if (!parentAttrs) {
                try {
                    const prevDevice = await deviceDAO.findById(this.prevId)
                    if (!prevDevice) {
                        uni.showToast({ title: '上级节点不存在', icon: 'none' })
                        return
                    }
                    parentAttrs = prevDevice.attributes
                        ? (typeof prevDevice.attributes === 'string' ? JSON.parse(prevDevice.attributes) : prevDevice.attributes)
                        : {}
                    this.prevDeviceAttributes = parentAttrs
                } catch (e) {
                    uni.showToast({ title: '加载上级节点失败', icon: 'none' })
                    return
                }
            }

            const newAttrs = { ...this.attributes }
            copyableKeys.forEach(key => {
                const val = parentAttrs[key]
                newAttrs[key] = Array.isArray(val) ? [...val] : (val !== undefined ? val : '')
            })

            this.attributes = newAttrs
            this.ensureLayoutByBusbarCount()
            uni.showToast({ title: '复制成功', icon: 'success' })
        },

        /* ========== 字段基础方法 ========== */
        getOptLabel(opt) {
            if (opt !== null && typeof opt === 'object') {
                return opt.label !== undefined ? '' + opt.label : ''
            }
            return '' + opt
        },

        getOptValue(opt) {
            if (opt !== null && typeof opt === 'object') {
                return opt.value !== undefined ? '' + opt.value : '' + (opt.label || '')
            }
            return '' + opt
        },

        getLabelsArray(options) {
            if (!options) return []
            return options.map(item => this.getOptLabel(item))
        },

        getDisplayLabel(options, value) {
            if (!options || value === undefined || value === null || value === '') return ''
            const found = options.find(item => this.getOptValue(item) === value)
            return found ? this.getOptLabel(found) : value
        },

        getPickerIndex(options, value) {
            if (!options || !options.length) return 0
            if (value === undefined || value === null || value === '') return 0
            const idx = options.findIndex(item => this.getOptValue(item) === value)
            return idx >= 0 ? idx : 0
        },

        onInput(key, value) {
            this.attributes = { ...this.attributes, [key]: value }

            if (key === 'busbar_count') {
                this.ensureLayoutByBusbarCount()
                this.syncSwitchgearAutoFields()
            }

            // 开关柜编号手工编辑标记
            if (this.deviceType === 'stationSwitchgear' && key === 'cabinet_number') {
                this.cabinetNumberManuallyEdited = true
            }

            // 依赖项变化时自动重算编号（未手工改号才重算）
            if (
                this.deviceType === 'stationSwitchgear' &&
                ['belong_station', 'region_label', 'sort_index'].includes(key) &&
                !this.cabinetNumberManuallyEdited
            ) {
                this.regenerateCabinetNumber()
            }

            // 站房名称变化时：同步填充布局里的 belong_station / cabinet_number
            const stationNameKey = this.currentSchema?.nameField
            if (stationNameKey && key === stationNameKey) {
                this.syncSwitchgearAutoFields({ overwriteBelong: true, overwriteCabinet: true })
            }
        },

        async initSwitchgearFields() {
            if (this.deviceType !== 'stationSwitchgear') return

            const attrs = { ...this.attributes }

            // 1) 从父站房自动写入 belong_station
            if (!attrs.belong_station && this.parentId) {
                try {
                    const parent = await deviceDAO.findById(this.parentId)
                    if (parent) {
                        attrs.belong_station = parent.name || ''
                    }
                } catch (e) {
                    console.warn('加载父站房失败:', e)
                }
            }

            // 2) 从路由参数写入隐藏字段（由站房布局传入）
            if (!attrs.region_label && this.routeQuery.regionLabel) {
                attrs.region_label = decodeURIComponent(this.routeQuery.regionLabel)
            }
            if (!attrs.region_key && this.routeQuery.regionKey) {
                attrs.region_key = decodeURIComponent(this.routeQuery.regionKey)
            }
            if ((attrs.sort_index === undefined || attrs.sort_index === null || attrs.sort_index === '') && this.routeQuery.sortIndex) {
                const n = Number(this.routeQuery.sortIndex)
                attrs.sort_index = Number.isNaN(n) ? '' : n
            }

            this.attributes = attrs

            // 3) 自动生成 cabinet_number（仅新建且未手工改）
            if (!this.cabinetNumberManuallyEdited && !attrs.cabinet_number) {
                this.regenerateCabinetNumber()
            }
        },

        regenerateCabinetNumber() {
            if (this.deviceType !== 'stationSwitchgear') return
            if (this.cabinetNumberManuallyEdited) return

            const belongStation = this.attributes.belong_station || ''
            const regionLabel = this.attributes.region_label || ''
            const seqRaw = Number(this.attributes.sort_index || this.sortOrder || 1)
            const seq = Number.isNaN(seqRaw) ? 1 : Math.max(1, seqRaw)
            const seqText = String(seq).padStart(2, '0')

            const cabinetNo = `${belongStation}${regionLabel}母线开关柜${seqText}`
            this.attributes = { ...this.attributes, cabinet_number: cabinetNo }
        },

        getSelectedSwitchgearValue(key) {
            const row = this.selectedSwitchgearData
            if (!row) return ''
            return row[key] ?? ''
        },

        updateSelectedSwitchgearField(key, value) {
            if (!this.ensureStationSavedForSwitchgear()) return
            if (!this.selectedSwitchgear) return
            const { segIndex, rowIndex } = this.selectedSwitchgear
            const layout = this.normalizeLayout(this.attributes.switchgear_layout)
            if (!layout[segIndex] || !layout[segIndex][rowIndex]) return

            const row = { ...layout[segIndex][rowIndex], [key]: value }

            // 列表显示字段与编辑字段保持一致
            if (key === 'cabinet_name') row.name = value
            if (key === 'name' && !row.cabinet_name) row.cabinet_name = value

            layout[segIndex][rowIndex] = row
            this.attributes = { ...this.attributes, switchgear_layout: layout }
        },

        /** 清除选择框内容 */
        onClearSelect(key) {
            this.attributes = { ...this.attributes, [key]: '' }
        },

        getSelectedSwitchgearSelectIndex(field) {
            const options = field.options || []
            const current = this.getSelectedSwitchgearValue(field.key)
            if (!options.length) return 0
            const idx = options.findIndex(opt => this.getOptValue(opt) === current)
            return idx >= 0 ? idx : 0
        },

        onSelectedSwitchgearSelectChange(field, e) {
            const idx = Number(e.detail.value)
            const options = field.options || []
            const opt = options[idx]
            if (opt === undefined) return
            const val = this.getOptValue(opt)
            if (val === '其他') {
                this.openSwitchgearCustomInput(field.key)
                return
            }
            this.updateSelectedSwitchgearField(field.key, val)
        },

        openSwitchgearCustomInput(fieldKey) {
            this.customInputModal = {
                visible: true,
                fieldKey: fieldKey,
                inputValue: '',
                isMulti: false,
                target: 'switchgear'
            }
        },

        onCompositeInput(key, suffix) {
            const prefix = this.compositePrefix || ''
            const safeSuffix = String(suffix || '')
            this.attributes = { ...this.attributes, [key]: prefix + safeSuffix }

            const stationNameKey = this.currentSchema?.nameField
            if (stationNameKey && key === stationNameKey) {
                this.syncSwitchgearAutoFields({ overwriteBelong: true, overwriteCabinet: true })
            }
        },

        onPickerChange(key, options, e) {
            const idx = e.detail.value
            const opt = options[idx]
            const val = this.getOptValue(opt)
            if (val === '其他') {
                this.openCustomInput(key, false)
                return
            }
            if (opt !== undefined) this.onInput(key, val)
        },

        isFieldVisible(field) {
            // station 特殊：母线电源线路名称随 busbar_count 显隐
            if (field.key && field.key.startsWith('power_line_name_')) {
                const n = Number(field.key.split('_').pop() || 0)
                return this.busbarCount >= n && this.busbarCount > 0
            }
            if (field.type === 'switchgear_layout') {
                return this.busbarCount > 0
            }

            // 通用 visibleWhen
            if (!field.visibleWhen) return true
            for (const depKey in field.visibleWhen) {
                const requiredValues = field.visibleWhen[depKey]
                const currentValue = this.attributes[depKey]
                if (Array.isArray(currentValue)) {
                    const hasMatch = requiredValues.some(v => currentValue.includes(v))
                    if (!hasMatch) return false
                } else {
                    if (!requiredValues.includes(currentValue)) return false
                }
            }
            return true
        },

        /* ========== switchgear_layout ========== */
        ensureStationSavedForSwitchgear() {
            if (this.canCreateSwitchgear) return true
            uni.showToast({
                title: '请先保存站房（生成ID）后再新建开关柜',
                icon: 'none'
            })
            return false
        },
        normalizeLayout(layout) {
            if (!Array.isArray(layout)) return []
            return layout.map((col, colIndex) => {
                if (!Array.isArray(col)) return []
                return col.map((item, idx) => {
                    const base = (item && typeof item === 'object') ? { ...item } : {}
                    return {
                        ...base, // 保留已有所有字段，避免数据丢失
                        deviceId: base.deviceId || '',
                        localId: base.localId || `${Date.now()}_${colIndex}_${idx}_${Math.random().toString(36).slice(2, 8)}`,
                        // 兼容旧数据：name 与 cabinet_name 互补
                        name: base.name || base.cabinet_name || '',
                        cabinet_name: base.cabinet_name || base.name || '',
                        _photos: (base._photos && typeof base._photos === 'object') ? base._photos : {},
                        _extraPhotoSlots: Array.isArray(base._extraPhotoSlots) ? base._extraPhotoSlots : []
                    }
                })
            })
        },

        createSwitchgearItem(segIndex, rowIndex) {
            return {
                deviceId: '',
                localId: `${Date.now()}_${Math.random()}_${segIndex}_${rowIndex}`,
                belong_station: this.attributes.belong_station || '',
                cabinet_name: '',
                name: '',
                cabinet_number: '',
                cabinet_type: '',
                switch_status: '',
                remark_1: '',
                remark_2: '',
                _photos: {},
                _extraPhotoSlots: []
            }
        },

        ensureLayoutByBusbarCount() {
            const count = this.busbarCount
            let layout = this.normalizeLayout(this.attributes.switchgear_layout)

            if (count <= 0) {
                layout = []
                this.selectedSwitchgear = null
            } else {
                if (layout.length < count) {
                    for (let i = layout.length; i < count; i += 1) layout.push([])
                } else if (layout.length > count) {
                    layout = layout.slice(0, count)
                }

                if (this.selectedSwitchgear) {
                    const { segIndex, rowIndex } = this.selectedSwitchgear
                    if (!layout[segIndex] || !layout[segIndex][rowIndex]) {
                        this.selectedSwitchgear = null
                    }
                }
            }

            this.attributes = { ...this.attributes, switchgear_layout: layout }
        },

        getSwitchgearList(segIndex) {
            const layout = this.normalizeLayout(this.attributes.switchgear_layout)
            return layout[segIndex] || []
        },

        getSwitchgearCount(segIndex) {
            return this.getSwitchgearList(segIndex).length
        },

        onSwitchgearCountInput(segIndex, raw) {
            if (!this.ensureStationSavedForSwitchgear()) return

            const targetCount = Math.max(0, parseInt(raw || '0', 10) || 0)
            const layout = this.normalizeLayout(this.attributes.switchgear_layout)
            while (layout.length < this.busbarCount) layout.push([])
            let col = layout[segIndex] || []

            if (col.length < targetCount) {
                const addLen = targetCount - col.length
                for (let i = 0; i < addLen; i += 1) {
                    col.push(this.createSwitchgearItem(segIndex, col.length))
                }
            } else if (col.length > targetCount) {
                col = col.slice(0, targetCount)
            }

            layout[segIndex] = col
            this.attributes = { ...this.attributes, switchgear_layout: layout }

            // 新增/调整数量后，自动补齐站房名称与编号
            this.syncSwitchgearAutoFields()

            if (this.selectedSwitchgear) {
                const { segIndex: s, rowIndex: r } = this.selectedSwitchgear
                if (!layout[s] || !layout[s][r]) {
                    this.selectedSwitchgear = null
                }
            }
        },

        increaseCount(index) {
            if (!this.canCreateSwitchgear) return;
            const currentCount = Number(this.getSwitchgearCount(index)) || 0;
            this.onSwitchgearCountInput(index, currentCount + 1);
        },

        decreaseCount(index) {
            if (!this.canCreateSwitchgear) return;
            const currentCount = Number(this.getSwitchgearCount(index)) || 0;
            // 最低为0
            if (currentCount > 0) {
                // 弹出确认框
                uni.showModal({
                    title: '删除开关柜',
                    content: '确定要删除开关柜吗？',
                    confirmText: '取消',
                    cancelText: '确定',
                    success: (res) => {
                        if (res.cancel) {
                            this.onSwitchgearCountInput(index, currentCount - 1);
                        }
                    }
                });
            }
        },

        onSelectSwitchgear(segIndex, rowIndex) {
            this.selectedSwitchgear = { segIndex, rowIndex }
        },

        isSelectedSwitchgear(segIndex, rowIndex) {
            return (
                this.selectedSwitchgear &&
                this.selectedSwitchgear.segIndex === segIndex &&
                this.selectedSwitchgear.rowIndex === rowIndex
            )
        },

        getSelectedTitle() {
            if (!this.selectedSwitchgear) return ''
            const { segIndex, rowIndex } = this.selectedSwitchgear
            return `${this.busbarLabels[segIndex]}段 · 柜${rowIndex + 1}`
        },

        updateSelectedSwitchgear(key, value) {
            if (!this.selectedSwitchgear) return
            const { segIndex, rowIndex } = this.selectedSwitchgear
            const layout = this.normalizeLayout(this.attributes.switchgear_layout)
            if (!layout[segIndex] || !layout[segIndex][rowIndex]) return
            layout[segIndex][rowIndex][key] = value
            this.attributes = { ...this.attributes, switchgear_layout: layout }
        },

        getStationNameForLayout() {
            // 站房名称优先取 schema 配置的 nameField
            const nameKey = this.currentSchema?.nameField
            if (nameKey && this.attributes[nameKey]) return String(this.attributes[nameKey])

            // 兜底（按你项目常见字段名）
            return (
                this.attributes.station_name ||
                this.attributes.name ||
                this.attributes.belong_station ||
                ''
            )
        },

        buildLayoutCabinetNumber(segIndex, rowIndex, belongStation) {
            const stationName = belongStation || ''
            if (!stationName) return ''
            const regionLabel = `${this.busbarLabels[segIndex] || ''}段`
            const seqText = String(rowIndex + 1).padStart(2, '0')
            return `${stationName}${regionLabel}母线开关柜${seqText}`
        },

        syncSwitchgearAutoFields({ overwriteBelong = false, overwriteCabinet = false } = {}) {
            const layout = this.normalizeLayout(this.attributes.switchgear_layout)
            if (!layout.length) return

            const stationName = this.getStationNameForLayout()
            let changed = false

            layout.forEach((col, segIndex) => {
                col.forEach((row, rowIndex) => {
                    if (!row || typeof row !== 'object') return

                    // 1) 自动填入站房名称
                    if (stationName && (overwriteBelong || !row.belong_station)) {
                        row.belong_station = stationName
                        changed = true
                    }

                    // 2) 自动填入开关柜编号
                    const autoNo = this.buildLayoutCabinetNumber(segIndex, rowIndex, row.belong_station || stationName)
                    if (autoNo && (overwriteCabinet || !row.cabinet_number)) {
                        row.cabinet_number = autoNo
                        changed = true
                    }
                })
            })

            if (changed) {
                this.attributes = { ...this.attributes, switchgear_layout: layout }
            }
        },

        /* ========== 自定义输入 ========== */
        openCustomInput(key, isMulti = false) {
            this.customInputModal = { visible: true, fieldKey: key, inputValue: '', isMulti }
        },

        onConfirmCustomInput() {
            const { fieldKey, inputValue, isMulti, target } = this.customInputModal
            const val = (inputValue || '').trim()
            if (!val) {
                uni.showToast({ title: '请输入内容', icon: 'none' })
                return
            }

            if (target === 'switchgear') {
                // 处理开关柜的自定义输入
                this.updateSelectedSwitchgearField(fieldKey, val)
            } else {
                // 处理站房的自定义输入
                if (isMulti) {
                    if (!this.customValues[fieldKey]) this.customValues[fieldKey] = []
                    this.customValues[fieldKey].push(val)
                    const current = [...(this.attributes[fieldKey] || [])]
                    current.push(val)
                    this.attributes = { ...this.attributes, [fieldKey]: current }
                } else {
                    this.attributes = { ...this.attributes, [fieldKey]: val }
                }
            }

            this.customInputModal.visible = false
        },

        onCancelCustomInput() {
            this.customInputModal.visible = false
        },

        /* ========== 照片处理 ========== */
        async onTakePhoto({ key, target = 'station' }) {
            try {
                // 1. 调用相机
                const chooseRes = await new Promise((resolve, reject) => {
                    uni.chooseImage({
                        count: 1,
                        sourceType: ['camera'],
                        success: resolve,
                        fail: reject
                    })
                })
                const tempFilePath = chooseRes.tempFilePaths[0]

                uni.showLoading({ title: '添加水印中...', mask: true })

                // 2. 获取位置信息和当前时间
                const [locationInfo, dateTime] = await Promise.all([
                    this.getLocationAndAddress(),
                    this.getCurrentDateTime()
                ])

                // 3. 给图片添加水印 (防闪退缩放版)
                const watermarkedPath = await this.addWatermark(tempFilePath, locationInfo, dateTime)

                // 4. 保存到持久化存储 (注意这里使用的是 watermarkedPath)
                const saveRes = await new Promise((resolve, reject) => {
                    uni.saveFile({
                        tempFilePath: watermarkedPath,
                        success: resolve,
                        fail: reject
                    })
                })

                const savedPath = saveRes.savedFilePath

                // 5. 根据 target 更新对应的数据状态 (这部分保留你原有的逻辑)
                if (target === 'switchgear') {
                    if (!this.selectedSwitchgear) {
                        uni.hideLoading()
                        return
                    }
                    const { segIndex, rowIndex } = this.selectedSwitchgear
                    const layout = this.normalizeLayout(this.attributes.switchgear_layout)
                    if (!layout[segIndex] || !layout[segIndex][rowIndex]) {
                        uni.hideLoading()
                        return
                    }

                    const row = { ...layout[segIndex][rowIndex] }
                    const oldPath = (row._photos || {})[key]
                    if (oldPath) this.tryRemoveFile(oldPath)

                    row._photos = { ...(row._photos || {}), [key]: savedPath }
                    layout[segIndex][rowIndex] = row
                    this.attributes = { ...this.attributes, switchgear_layout: layout }
                } else {
                    const oldPath = this.photos[key]
                    if (oldPath) this.tryRemoveFile(oldPath)
                    this.photos = { ...this.photos, [key]: savedPath }
                }

                uni.hideLoading()
                uni.showToast({ title: '拍照成功', icon: 'success' })
            } catch (e) {
                uni.hideLoading()
                if (e && e.errMsg && e.errMsg.indexOf('cancel') > -1) return
                console.error('拍照或添加水印失败:', e)
                // uni.showToast({ title: '拍照失败', icon: 'none' })
            }
        },

        /** 给图片添加水印核心方法（带防闪退缩放与延时绘制） */
        async addWatermark(imagePath, locationInfo, dateTime) {
            return new Promise((resolve, reject) => {
                uni.getImageInfo({
                    src: imagePath,
                    success: (image) => {
                        const MAX_SIZE = 1280; // 设定最大边长防崩溃
                        let targetWidth = image.width;
                        let targetHeight = image.height;

                        if (targetWidth > MAX_SIZE || targetHeight > MAX_SIZE) {
                            if (targetWidth > targetHeight) {
                                targetHeight = Math.round((targetHeight * MAX_SIZE) / targetWidth);
                                targetWidth = MAX_SIZE;
                            } else {
                                targetWidth = Math.round((targetWidth * MAX_SIZE) / targetHeight);
                                targetHeight = MAX_SIZE;
                            }
                        }

                        this.canvasWidth = targetWidth;
                        this.canvasHeight = targetHeight;

                        setTimeout(() => {
                            const ctx = uni.createCanvasContext('watermarkCanvas', this);
                            ctx.drawImage(imagePath, 0, 0, targetWidth, targetHeight);

                            const fontSize = Math.max(targetWidth / 30, 14);
                            const padding = fontSize;
                            ctx.setFontSize(fontSize);
                            ctx.setFillStyle('white');
                            ctx.setTextBaseline('bottom');
                            ctx.setShadow(2, 2, 4, 'rgba(0, 0, 0, 0.8)');

                            const textLine1 = `时间：${dateTime}`;
                            const textLine2 = `经纬度：${locationInfo.lon}, ${locationInfo.lat}`;
                            const textLine3 = `地点：${locationInfo.address}`;

                            ctx.fillText(textLine3, padding, targetHeight - padding);
                            ctx.fillText(textLine2, padding, targetHeight - padding - fontSize * 1.5);
                            ctx.fillText(textLine1, padding, targetHeight - padding - fontSize * 3);

                            ctx.draw(false, () => {
                                setTimeout(() => {
                                    uni.canvasToTempFilePath({
                                        canvasId: 'watermarkCanvas',
                                        destWidth: targetWidth,
                                        destHeight: targetHeight,
                                        success: (res) => resolve(res.tempFilePath),
                                        fail: (err) => {
                                            console.error('导出水印图片失败', err);
                                            reject(err);
                                        }
                                    }, this);
                                }, 300);
                            });
                        }, 100);
                    },
                    fail: (err) => {
                        console.error('获取图片信息失败', err);
                        reject(err);
                    }
                });
            });
        },

        /** 获取位置及逆地理编码 */
        getLocationAndAddress() {
            return new Promise((resolve) => {
                const defaultLoc = { lat: '未知', lon: '未知', address: '地址解析失败' }
                uni.getLocation({
                    type: 'wgs84',
                    success: (res) => {
                        const lat = res.latitude
                        const lon = res.longitude
                        const postStr = encodeURIComponent(JSON.stringify({ lon, lat, ver: 1 }))
                        const url = `https://api.tianditu.gov.cn/geocoder?postStr=${postStr}&type=geocode&tk=${this.TIANDITU_KEY}`

                        uni.request({
                            url: url,
                            method: 'GET',
                            success: (geoRes) => {
                                if (geoRes.data && geoRes.data.result) {
                                    resolve({
                                        lat: lat.toFixed(6),
                                        lon: lon.toFixed(6),
                                        address: geoRes.data.result.formatted_address || '未知详细地址'
                                    })
                                } else {
                                    resolve({ lat: lat.toFixed(6), lon: lon.toFixed(6), address: '地址解析失败' })
                                }
                            },
                            fail: () => {
                                resolve({ lat: lat.toFixed(6), lon: lon.toFixed(6), address: '网络错误，地址解析失败' })
                            }
                        })
                    },
                    fail: (err) => {
                        console.warn('获取定位失败:', err)
                        resolve(defaultLoc)
                    }
                })
            })
        },

        /** 获取当前格式化时间 */
        getCurrentDateTime() {
            const now = new Date()
            const year = now.getFullYear()
            const month = String(now.getMonth() + 1).padStart(2, '0')
            const day = String(now.getDate()).padStart(2, '0')
            const hours = String(now.getHours()).padStart(2, '0')
            const minutes = String(now.getMinutes()).padStart(2, '0')
            const seconds = String(now.getSeconds()).padStart(2, '0')
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        },

        onPreviewPhoto({ filePath }) {
            uni.previewImage({
                urls: [filePath],
                current: filePath
            })
        },

        onDeletePhoto({ key, target = 'station' }) {
            if (target === 'switchgear') {
                if (!this.selectedSwitchgear) return
                const { segIndex, rowIndex } = this.selectedSwitchgear
                const layout = this.normalizeLayout(this.attributes.switchgear_layout)
                if (!layout[segIndex] || !layout[segIndex][rowIndex]) return

                const row = { ...layout[segIndex][rowIndex] }
                const filePath = (row._photos || {})[key]
                if (filePath) this.tryRemoveFile(filePath)

                const newPhotos = { ...(row._photos || {}) }
                delete newPhotos[key]
                row._photos = newPhotos

                layout[segIndex][rowIndex] = row
                this.attributes = { ...this.attributes, switchgear_layout: layout }
            } else {
                const filePath = this.photos[key]
                if (filePath) this.tryRemoveFile(filePath)

                const newPhotos = { ...this.photos }
                delete newPhotos[key]
                this.photos = newPhotos
            }

            uni.showToast({ title: '已删除', icon: 'success' })
        },

        tryRemoveFile(filePath) {
            if (!filePath) return
            uni.removeSavedFile({
                filePath,
                fail: (e) => {
                    console.warn('删除文件忽略:', e.errMsg || e)
                }
            })
        },

        onSlotTap(slot) {
            const filePath = this.photos[slot.key]
            if (filePath) {
                this.actionSheet.slot = { key: slot.key, label: slot.label, filePath, target: 'station' }
                this.actionSheet.visible = true
            } else {
                this.onTakePhoto({ key: slot.key, label: slot.label, target: 'station' })
            }
        },

        // 开关柜槽位点击
        onSwitchgearSlotTap(slot) {
            const filePath = this.selectedSwitchgearPhotos[slot.key]
            if (filePath) {
                this.actionSheet.slot = { key: slot.key, label: slot.label, filePath, target: 'switchgear' }
                this.actionSheet.visible = true
            } else {
                this.onTakePhoto({ key: slot.key, label: slot.label, target: 'switchgear' })
            }
        },

        handleActionPreviewPhoto() {
            const { filePath } = this.actionSheet.slot
            this.onPreviewPhoto({ filePath })
            this.closeActionSheet()
        },

        handleActionRetakePhoto() {
            const { key, label, target } = this.actionSheet.slot
            this.onTakePhoto({ key, label, target: target || 'station' })
            this.closeActionSheet()
        },

        handleActionDeletePhoto() {
            const { key, target } = this.actionSheet.slot
            this.onDeletePhoto({ key, target: target || 'station' })
            this.closeActionSheet()
        },

        closeActionSheet() {
            this.actionSheet.visible = false
            this.actionSheet.slot = null
        },

        onAddSlotTap() {
            this.addSlotModal.label = ''
            this.addSlotModal.target = 'station'
            this.addSlotModal.visible = true
        },

        onSwitchgearAddSlotTap() {
            if (!this.selectedSwitchgear) return
            this.addSlotModal.label = ''
            this.addSlotModal.target = 'switchgear'
            this.addSlotModal.visible = true
        },

        onConfirmAddSlot() {
            const label = this.addSlotModal.label.trim()
            if (!label) return

            if (this.addSlotModal.target === 'switchgear') {
                if (!this.selectedSwitchgear) return
                const { segIndex, rowIndex } = this.selectedSwitchgear
                const layout = this.normalizeLayout(this.attributes.switchgear_layout)
                if (!layout[segIndex] || !layout[segIndex][rowIndex]) return

                const row = { ...layout[segIndex][rowIndex] }
                const currentSlots = Array.isArray(row._extraPhotoSlots) ? [...row._extraPhotoSlots] : []
                currentSlots.push({ key: `extra_${Date.now()}`, label })
                row._extraPhotoSlots = currentSlots

                layout[segIndex][rowIndex] = row
                this.attributes = { ...this.attributes, switchgear_layout: layout }
            } else {
                this.extraPhotoSlots.push({
                    key: `extra_${Date.now()}`,
                    label
                })
            }

            this.addSlotModal.visible = false
            this.addSlotModal.label = ''
            this.addSlotModal.target = 'station'
        },

        onCancelAddSlot() {
            this.addSlotModal.visible = false
            this.addSlotModal.label = ''
            this.addSlotModal.target = 'station'
        },

        /* ========== 其他 ========== */
        syncCoordsToAttributes() {
            this.attributes = {
                ...this.attributes,
                longitude: this.longitude,
                latitude: this.latitude
            }
        },

        initDefaults() {
            const newVal = { ...this.attributes }
            let changed = false
            const fields = this.currentSchema.fields || []

            fields.forEach(field => {
                if (field.defaultValue !== undefined) {
                    const current = newVal[field.key]
                    if (current === undefined || current === null || current === '') {
                        newVal[field.key] = field.defaultValue
                        changed = true
                    }
                }
            })

            if (changed) this.attributes = { ...newVal }
            this.ensureLayoutByBusbarCount()
        },

        validate() {
            const errors = []
            const fields = this.currentSchema.fields || []

            fields.forEach(field => {
                if (['hidden', 'auto-calc', 'section'].includes(field.type)) return
                if (!this.isFieldVisible(field)) return
                if (!field.required) return

                const val = this.attributes[field.key]
                if (field.type === 'composite-name') {
                    const suffix = this.compositeSuffix
                    if (!suffix || suffix.trim() === '') errors.push(field.label + '不能为空')
                } else if (val === undefined || val === null || val === '') {
                    errors.push(field.label + '不能为空')
                }
            })

            // 照片必填校验
            const requiredSlots = (this.currentSchema.photoSlots || []).filter(s => s.required)
            requiredSlots.forEach(slot => {
                if (!this.photos[slot.key]) {
                    errors.push(`请上传照片：${slot.label}`)
                }
            })

            // ===== 开关柜布局内必填校验 =====
            if (this.busbarCount > 0) {
                const layout = this.normalizeLayout(this.attributes.switchgear_layout)
                const requiredEditorFields = (this.switchgearEditorFields || []).filter(f => f.required)
                const requiredSwitchgearPhotoSlots = (this.switchgearSchema?.photoSlots || []).filter(s => s.required)

                for (let segIndex = 0; segIndex < this.busbarCount; segIndex += 1) {
                    const col = layout[segIndex] || []
                    for (let rowIndex = 0; rowIndex < col.length; rowIndex += 1) {
                        const row = col[rowIndex] || {}
                        for (const field of requiredEditorFields) {
                            const v = row[field.key]
                            if (v === undefined || v === null || v === '') {
                                errors.push(`${this.busbarLabels[segIndex]}段母线 · 柜${rowIndex + 1}：${field.label}不能为空`)
                            }
                        }

                        // 照片必填校验
                        requiredSwitchgearPhotoSlots.forEach(slot => {
                            const rowPhotos = row?._photos || {}
                            if (!rowPhotos[slot.key]) {
                                errors.push(`${this.busbarLabels[segIndex]}段母线 · 柜${rowIndex + 1}：请上传照片：${slot.label}`)
                            }
                        })
                    }
                }
            }

            return errors
        },

        /* ========== 保存 ========== */
        async onSave() {
            this.ensureLayoutByBusbarCount()
            this.syncSwitchgearAutoFields()

            const errors = this.validate()
            if (errors.length > 0) {
                uni.showToast({ title: errors[0], icon: 'none' })
                return
            }

            this.ensureLayoutByBusbarCount()

            const nameField = this.currentSchema.nameField
            const name =
                (nameField && this.attributes[nameField])
                    ? String(this.attributes[nameField])
                    : this.currentSchema.label

            const attrsToSave = { ...this.attributes }

            if (Object.keys(this.photos).length > 0) {
                attrsToSave._photos = this.photos
            }
            if (this.extraPhotoSlots.length > 0) {
                attrsToSave._extraPhotoSlots = this.extraPhotoSlots
            }

            const deviceData = {
                line_id: this.lineId,
                device_type: this.deviceType,
                parent_id: this.parentId,
                prev_id: this.prevId,
                name: name,
                longitude: this.longitude,
                latitude: this.latitude,
                sort_order: this.sortOrder,
                attributes: JSON.stringify(attrsToSave)
            }

            try {
                let stationId = this.deviceId
                if (this.deviceId) {
                    await deviceDAO.update(this.deviceId, deviceData)
                } else {
                    const newId = await deviceDAO.insert(deviceData)
                    this.deviceId = newId
                    stationId = newId
                }

                // 同步子开关柜到 devices 表
                if (this.deviceType === 'station') {
                    await this.syncSwitchgearToDB(stationId)
                }

                uni.showToast({ title: '保存成功', icon: 'success' })
                setTimeout(() => { uni.navigateBack() }, 500)
            } catch (e) {
                console.error('保存失败:', e)
                uni.showToast({ title: '保存失败', icon: 'none' })
            }
        }
    }
}
</script>

<style scoped>
.page {
    min-height: 100vh;
    background: #f5f6f7;
    padding: 20rpx;
    padding-bottom: 140rpx;
    padding-top: calc(var(--status-bar-height) + 10rpx);
}

.card {
    background: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
}

.card-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
}

.card-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
}

.copy-btn {
    padding: 8rpx 20rpx;
    background: #eef3ff;
    border-radius: 8rpx;
    border: 1rpx solid #2979ff;
}

.copy-btn-text {
    font-size: 24rpx;
    color: #2979ff;
}

/* ---- 底部保存栏 ---- */
.bottom-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 20rpx 24rpx;
    padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
    background: #fff;
    box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
    z-index: 10;
}

.save-btn {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    text-align: center;
    background: #2979ff;
    color: #fff;
    font-size: 32rpx;
    font-weight: bold;
    border-radius: 12rpx;
    border: none;
    padding: 0;
    margin: 0;
}

.save-btn::after {
    border: none;
}

/* ===== Schema Form ===== */
.schema-form {
    padding: 0;
}

.form-group {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    box-shadow: 0rpx 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.form-group:last-child {
    margin-bottom: 0;
}

.section-header {
    padding: 0 0 16rpx 0;
    margin-bottom: 0rpx;
    border-bottom: 1rpx solid #e5e5e5;
}

.section-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
}

.form-item {
    padding: 22rpx 0;
    border-bottom: 1rpx solid #f0f0f0;

    &:last-child {
        border-bottom: none;
        padding-bottom: 10rpx;
    }
}

.form-label-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 12rpx;
}

.form-label {
    font-size: 25rpx;
    color: #666666;
}

.required-star {
    color: #e74c3c;
    font-size: 28rpx;
    margin-left: 4rpx;
}

.form-input {
    width: 100%;
    height: 72rpx;
    border: 1rpx solid #dcdfe6;
    border-radius: 8rpx;
    padding: 0 20rpx;
    font-size: 28rpx;
    color: #333;
    background: #fff;
    box-sizing: border-box;
}

.composite-name-wrapper {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.composite-name-prefix {
    width: 100%;
    min-height: 34rpx;
    border: 1rpx solid #dcdfe6;
    border-radius: 8rpx;
    padding: 16rpx 20rpx;
    font-size: 28rpx;
    color: #333;
    background: #f5f7fa;
    box-sizing: border-box;
}

.composite-name-suffix {
    width: 100%;
    min-height: 34rpx;
    border: 1rpx solid #dcdfe6;
    border-radius: 8rpx;
    padding: 16rpx 20rpx;
    font-size: 28rpx;
    color: #333;
    background: #fff;
    box-sizing: border-box;
}

.form-textarea {
    width: 100%;
    min-height: 34rpx;
    max-height: 120rpx;
    overflow: auto;
    border: 1rpx solid #dcdfe6;
    border-radius: 8rpx;
    padding: 16rpx 20rpx;
    font-size: 28rpx;
    color: #333;
    background: #fff;
    box-sizing: border-box;
}

/* ---- 下拉选择器 ---- */
.picker-box {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    height: 72rpx;
    border: 1rpx solid #dcdfe6;
    border-radius: 8rpx;
    padding: 0 20rpx;
    background: #fff;
}

.select-wrapper {
    position: relative;
    margin-bottom: 20rpx;
}

.select-wrapper .clear-btn {
    position: absolute;
    right: 20rpx;
    top: 50%;
    transform: translateY(-50%);
    margin-right: 22rpx;
    z-index: 1;
}

.pre-node-picker {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    min-height: 72rpx;
    border: 1rpx solid #dcdfe6;
    border-radius: 8rpx;
    padding: 16rpx 20rpx;
    background: #fff;
    flex-wrap: wrap;
}

.picker-content {
    flex: 1;
    min-width: 0;
}

.picker-actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.clear-btn {
    margin-right: 12rpx;
    width: 36rpx;
    height: 36rpx;
    border-radius: 50%;
    background: #f0f0f0;
    display: flex;
    justify-content: center;
    align-items: center;
}

.clear-btn:active {
    background: #e0e0e0;
}

.clear-icon {
    font-size: 24rpx;
    color: #999;
    font-weight: bold;
}

.pre-node-info {
    display: flex;
    align-items: center;
    flex: 1;
    margin-right: 16rpx;
}

.icon-box {
    width: 52rpx;
    height: 52rpx;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 16rpx;
    flex-shrink: 0;
}

.device-icon {
    width: 30rpx;
    height: 30rpx;
}

.pre-node-content {
    flex: 1;
    min-width: 0;
}

.pre-node-type {
    font-size: 24rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 4rpx;
    display: block;
}

.pre-node-name {
    font-size: 22rpx;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.picker-box.picker-disabled {
    background: #f5f7fa;
}

.picker-text {
    font-size: 28rpx;
    color: #333;
}

.picker-placeholder {
    font-size: 28rpx;
    color: #c0c4cc;
}

.picker-arrow {
    font-size: 32rpx;
    color: #c0c4cc;
}

/* ---- 自动计算只读框 ---- */
.auto-calc-box {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 72rpx;
    border: 1rpx solid #dcdfe6;
    border-radius: 8rpx;
    padding: 0 20rpx;
    background: #f5f7fa;
}

.auto-calc-value {
    font-size: 28rpx;
    color: #666;
}

.auto-calc-unit {
    font-size: 24rpx;
    color: #999;
    margin-left: 8rpx;
}

/* ===== switchgear_layout ===== */
.layout-wrap {
    margin-top: 6rpx;
}

.layout-empty {
    padding: 20rpx;
    border: 1rpx dashed #ddd;
    border-radius: 10rpx;
    background: #fafafa;
}

.layout-empty-text {
    font-size: 24rpx;
    color: #999;
}

.layout-scroll {
    white-space: nowrap;
}

.layout-grid {
    display: inline-flex;
    align-items: flex-start;
    gap: 16rpx;
    min-width: 100%;
}

.layout-col {
    width: 220rpx;
    background: #f8f9fb;
    border: 1rpx solid #e9edf3;
    border-radius: 12rpx;
    padding: 12rpx;
    box-sizing: border-box;
}

.layout-col-title {
    font-size: 24rpx;
    color: #333;
    font-weight: 600;
    margin-bottom: 8rpx;
}

.layout-counter {
    width: 100%;
    height: 56rpx;
    border: 1rpx solid #dcdfe6;
    border-radius: 28rpx;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12rpx;
    overflow: hidden;
}

.counter-btn {
    width: 60rpx;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    color: #606266;
    font-size: 32rpx;
    font-weight: 500;
}

/* 正常状态下的点击反馈 */
.counter-btn:active {
    background: #e4e7ed;
}

/* 禁用状态样式 */
.counter-btn-disabled {
    color: #c0c4cc;
    background: #f5f7fa;
}

.counter-btn-disabled:active {
    background: #f5f7fa;
    /* 禁用时点击不变色 */
}

.counter-value {
    flex: 1;
    text-align: center;
    font-size: 24rpx;
    color: #333;
}

.layout-item {
    height: 64rpx;
    border-radius: 8rpx;
    border: 1rpx solid #dcdfe6;
    background: #fff;
    margin-bottom: 8rpx;
    padding: 0 10rpx;
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.layout-item:last-child {
    margin-bottom: 0;
}

.layout-item-active {
    border-color: #2979ff;
    background: #eef3ff;
}

.layout-item-index {
    min-width: 34rpx;
    height: 34rpx;
    border-radius: 17rpx;
    background: #edf0f5;
    font-size: 22rpx;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
}

.layout-item-active .layout-item-index {
    background: #2979ff;
    color: #fff;
}

.layout-item-name {
    flex: 1;
    font-size: 22rpx;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.switchgear-editor {
    margin-top: 16rpx;
    padding: 16rpx;
    border: 1rpx solid #dbe6ff;
    border-radius: 12rpx;
    background: #f7faff;
}

.switchgear-editor-title {
    font-size: 26rpx;
    color: #2979ff;
    font-weight: 600;
    margin-bottom: 12rpx;
}

/* 开关柜状态指示器样式 */
.switch-status-indicator {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    margin-left: 10rpx;
}

.switch-status-off {
    background-color: #4CD964;
    /* 绿色 - 分 */
}

.switch-status-on {
    background-color: #FF3B30;
    /* 红色 - 合 */
}

/* ===== 照片区域 ===== */
.photo-section {
    margin-top: 24rpx;
}

.photo-grid {
    display: flex;
    flex-wrap: wrap;
    padding: 16rpx 24rpx;
    gap: 16rpx;
}

.photo-grid-item {
    width: calc((100% - 32rpx) / 3);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.photo-slot {
    width: 100%;
    padding-bottom: 100%;
    position: relative;
    border-radius: 12rpx;
    overflow: hidden;
    background-color: #f5f5f5;
    border: 2rpx dashed #cccccc;
    box-sizing: border-box;
}

.photo-slot-taken {
    border: none;
}

.photo-thumb {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 12rpx;
}

.photo-taken-badge {
    position: absolute;
    right: 8rpx;
    bottom: 8rpx;
    width: 32rpx;
    height: 32rpx;
    border-radius: 50%;
    background-color: #22c55e;
    color: #ffffff;
    font-size: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.photo-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.camera-icon-svg {
    width: 56rpx;
    height: 56rpx;
    opacity: 0.5;
}

.photo-label {
    font-size: 22rpx;
    color: #666666;
    margin-top: 8rpx;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
}

.add-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    border-style: dashed;
}

.add-icon {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 64rpx;
    color: #999999;
    line-height: 1;
}

/* ===== ActionSheet ===== */
.action-sheet-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.action-sheet-panel {
    width: 100%;
    padding: 0 16rpx 32rpx;
    animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }

    to {
        transform: translateY(0);
    }
}

.action-sheet-group {
    background-color: #ffffff;
    border-radius: 24rpx;
    overflow: hidden;
}

.action-sheet-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100rpx;
}

.action-sheet-item:active {
    background-color: #f2f2f2;
}

.action-sheet-divider {
    height: 1rpx;
    background-color: #e5e5e5;
    margin: 0 24rpx;
}

.action-sheet-text {
    font-size: 30rpx;
    color: #333333;
}

.action-sheet-text-danger {
    color: #e54d42;
}

.action-sheet-text-bold {
    font-weight: 600;
}

.action-sheet-cancel {
    margin-top: 16rpx;
    background-color: #ffffff;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100rpx;
}

.action-sheet-cancel:active {
    background-color: #f2f2f2;
}

/* ===== Modal ===== */
.modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-panel {
    width: 560rpx;
    background-color: #ffffff;
    border-radius: 24rpx;
    overflow: hidden;
    animation: modalFadeIn 0.2s ease-out;
}

@keyframes modalFadeIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

.modal-header {
    padding: 40rpx 32rpx 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333333;
}

.modal-body {
    padding: 24rpx 32rpx 40rpx;
}

.modal-input {
    width: 100%;
    height: 80rpx;
    border: 2rpx solid #dcdcdc;
    border-radius: 12rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: #333333;
    background-color: #f9f9f9;
    box-sizing: border-box;
}

.modal-input-placeholder {
    color: #bbbbbb;
    font-size: 28rpx;
}

.modal-footer {
    display: flex;
    border-top: 1rpx solid #e5e5e5;
}

.modal-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 96rpx;
}

.modal-btn:active {
    background-color: #f2f2f2;
}

.modal-footer-divider {
    width: 1rpx;
    background-color: #e5e5e5;
}

.modal-btn-text {
    font-size: 30rpx;
    color: #666666;
}

.modal-btn-text-primary {
    color: #2979ff;
    font-weight: 600;
}

.warning-capsule-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
}

.warning-capsule {
    background-color: rgba(239, 68, 68, 0.1);
    /* 半透明红色背景 */
    color: #ef4444;
    /* 红色文字 */
    font-size: 14px;
    /* text-sm */
    padding: 6px 16px;
    /* 上下左右内边距撑开胶囊 */
    border-radius: 9999px;
    /* 胶囊圆角 */
}
</style>