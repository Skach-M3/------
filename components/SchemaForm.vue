<template>
  <view class="schema-form">
    <!-- 按 group 分块显示 -->
    <view v-for="(group, groupIndex) in groupedFields" :key="groupIndex" class="form-group">
      <!-- 分组标题 -->
      <view v-if="group.name" class="section-header">
        <text class="section-title">{{ group.name }}</text>
      </view>

      <!-- 分组内的字段 -->
      <block v-for="(field, index) in group.fields" :key="index">
        <block v-if="field.type !== 'hidden' && isFieldVisible(field)">

          <!-- 普通字段 -->
          <view class="form-item">
            <view class="form-label-row">
              <text class="form-label">{{ field.label }}</text>
              <text v-if="field.required" class="required-star">*</text>
            </view>

            <!-- text -->
            <input v-if="field.type === 'text'" class="form-input" :value="modelValue[field.key]"
              :placeholder="field.placeholder || ('请输入' + field.label)"
              @input="onInput(field.key, $event.detail.value)" />

            <!-- composite-name 复合名称字段 -->
            <view v-else-if="field.type === 'composite-name'" class="composite-name-wrapper">
              <textarea class="composite-name-prefix" :value="compositePrefix" disabled auto-height />
              <textarea class="composite-name-suffix" :value="compositeSuffix"
                :placeholder="field.placeholder || ('请输入' + field.label)"
                @input="onCompositeInput(field.key, $event.detail.value)" auto-height />
            </view>

            <!-- number -->
            <input v-else-if="field.type === 'number'" class="form-input" type="digit" :value="modelValue[field.key]"
              :placeholder="field.placeholder || ('请输入' + field.label)"
              @input="onInput(field.key, $event.detail.value)" />

            <!-- textarea -->
            <textarea v-else-if="field.type === 'textarea'" class="form-textarea" :value="modelValue[field.key]"
              :placeholder="field.placeholder || ('请输入' + field.label)" :maxlength="field.maxLength || 500"
              @input="onInput(field.key, $event.detail.value)" />

            <!-- radio 单选按钮组 -->
            <view v-else-if="field.type === 'radio'" class="option-group">
              <view v-for="(opt, optIdx) in field.options" :key="optIdx" class="option-btn"
                :class="{ 'option-active': modelValue[field.key] === getOptValue(opt) }"
                @click="onInput(field.key, getOptValue(opt))">
                <text class="option-text">{{ getOptLabel(opt) }}</text>
              </view>
            </view>

            <!-- select 单选下拉 -->
            <block v-else-if="field.type === 'select'">
              <!-- 超过10个选项，使用自定义搜索弹窗 -->
              <view v-if="field.options && field.options.length > 10" class="picker-box"
                :class="{ 'picker-disabled': field.editable === false }"
                @click="field.editable !== false && openSearchSelect(field, field.options)">
                <text :class="modelValue[field.key] ? 'picker-text' : 'picker-placeholder'">
                  {{ getDisplayLabel(field.options, modelValue[field.key]) || ('请选择' + field.label) }}
                </text>
                <text v-if="field.editable !== false" class="picker-arrow">›</text>
              </view>
              <!-- 10个及以内，使用原生 picker -->
              <picker v-else :disabled="field.editable === false" :range="getLabelsArray(field.options)"
                :value="getPickerIndex(field.options, modelValue[field.key])"
                @change="onPickerChange(field.key, field.options, $event)">
                <view class="picker-box" :class="{ 'picker-disabled': field.editable === false }">
                  <text :class="modelValue[field.key] ? 'picker-text' : 'picker-placeholder'">
                    {{ getDisplayLabel(field.options, modelValue[field.key]) || ('请选择' + field.label) }}
                  </text>
                  <text v-if="field.editable !== false" class="picker-arrow">›</text>
                </view>
              </picker>
            </block>

            <!-- cascading-select 级联下拉 -->
            <block v-else-if="field.type === 'cascading-select'">
              <!-- 超过10个选项，使用自定义搜索弹窗 -->
              <block v-if="getCascadingOptions(field).length > 10">
                <view class="picker-box" @click="openSearchSelect(field, getCascadingOptions(field))">
                  <text :class="modelValue[field.key] ? 'picker-text' : 'picker-placeholder'">
                    {{ getDisplayLabel(getCascadingOptions(field), modelValue[field.key]) || ('请选择' + field.label) }}
                  </text>
                  <text class="picker-arrow">›</text>
                </view>
              </block>
              <!-- 10个及以内，使用原生 picker -->
              <picker v-else-if="getCascadingOptions(field).length > 0"
                :range="getLabelsArray(getCascadingOptions(field))"
                :value="getPickerIndex(getCascadingOptions(field), modelValue[field.key])"
                @change="onPickerChange(field.key, getCascadingOptions(field), $event)">
                <view class="picker-box">
                  <text :class="modelValue[field.key] ? 'picker-text' : 'picker-placeholder'">
                    {{ getDisplayLabel(getCascadingOptions(field), modelValue[field.key]) || ('请选择' + field.label) }}
                  </text>
                  <text class="picker-arrow">›</text>
                </view>
              </picker>
              <view v-else class="picker-box picker-disabled">
                <text class="picker-placeholder">
                  {{ modelValue[field.dependsOn] ? '暂无可选项' : ('请先选择' + getFieldLabel(field.dependsOn)) }}
                </text>
              </view>
            </block>

            <!-- multi-select / checkbox 多选按钮组 -->
            <view v-else-if="field.type === 'multi-select' || field.type === 'checkbox'" class="option-group">
              <view v-for="(opt, optIdx) in field.options" :key="optIdx" class="option-btn"
                :class="{ 'option-active': isMultiSelected(field.key, getOptValue(opt)) }"
                @click="onToggleMulti(field.key, getOptValue(opt))">
                <text class="option-text">{{ getOptLabel(opt) }}</text>
              </view>
            </view>

            <!-- auto-calc 只读计算字段 -->
            <view v-else-if="field.type === 'auto-calc'" class="auto-calc-box">
              <text class="auto-calc-value">{{ modelValue[field.key] || '—' }}</text>
              <text v-if="field.unit && modelValue[field.key]" class="auto-calc-unit">{{ field.unit }}</text>
            </view>

          </view>
        </block>
      </block>
    </view>
    <!-- ===== 照片区域 ===== -->
    <view v-if="showPhotoSection" class="photo-section">
      <!-- 区域标题 -->
      <view class="section-header">
        <text class="section-title">照片</text>
      </view>

      <!-- 3列网格 -->
      <view class="photo-grid">
        <!-- 遍历所有槽位 -->
        <!-- 遍历所有槽位 -->
        <view v-for="slot in allPhotoSlots" :key="slot.key" class="photo-grid-item">
          <view :class="['photo-slot', photos[slot.key] ? 'photo-slot-taken' : '']" @click="onSlotTap(slot)">
            <!-- 已拍照：缩略图 -->
            <template v-if="photos[slot.key]">
              <image :src="photos[slot.key]" mode="aspectFill" class="photo-thumb" />
              <!-- 已拍照角标 -->
              <view class="photo-taken-badge">✓</view>
            </template>
            <!-- 未拍照：占位符 -->
            <view v-else class="photo-placeholder">
              <image :src="cameraIconSvg" class="camera-icon-svg" mode="aspectFit" />
            </view>
          </view>
          <text class="photo-label">{{ slot.label }}</text>
        </view>

        <!-- 新增槽位「+」按钮 -->
        <view v-if="allowExtraSlot" class="photo-grid-item">
          <view class="photo-slot add-slot" @click="onAddSlotTap">
            <text class="add-icon">+</text>
          </view>
        </view>
      </view>
    </view>
    <!-- ===== ActionSheet 已拍照片操作面板 ===== -->
    <view v-if="actionSheet.visible" class="action-sheet-mask" @click="closeActionSheet">
      <view class="action-sheet-panel" @click.stop>
        <!-- 选项组 -->
        <view class="action-sheet-group">
          <view class="action-sheet-item" @click="onPreviewPhoto">
            <text class="action-sheet-text">查看照片</text>
          </view>
          <view class="action-sheet-divider"></view>
          <view class="action-sheet-item" @click="onRetakePhoto">
            <text class="action-sheet-text">重新拍照</text>
          </view>
          <view class="action-sheet-divider"></view>
          <view class="action-sheet-item" @click="onDeletePhoto">
            <text class="action-sheet-text action-sheet-text-danger">删除照片</text>
          </view>
        </view>
        <!-- 取消按钮 -->
        <view class="action-sheet-cancel" @click="closeActionSheet">
          <text class="action-sheet-text action-sheet-text-bold">取消</text>
        </view>
      </view>
    </view>
    <!-- ===== 新增槽位弹窗 ===== -->
    <view v-if="addSlotModal.visible" class="modal-mask" @click="onCancelAddSlot">
      <view class="modal-panel" @click.stop>
        <!-- 标题 -->
        <view class="modal-header">
          <text class="modal-title">新增照片</text>
        </view>
        <!-- 输入框 -->
        <view class="modal-body">
          <input v-model="addSlotModal.label" class="modal-input" placeholder="请输入照片名称"
            placeholder-class="modal-input-placeholder" maxlength="20" focus />
        </view>
        <!-- 按钮 -->
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
    <!-- ===== 搜索选择弹窗 (选项>10时触发) ===== -->
    <view v-if="searchSelectModal.visible" class="search-modal-mask" @click="closeSearchSelect">
      <view class="search-modal-panel" @click.stop>
        <view class="search-modal-header">
          <text class="search-modal-title">请选择{{ searchSelectModal.label }}</text>
          <text class="search-modal-close" @click="closeSearchSelect">×</text>
        </view>
        <view class="search-modal-search">
          <input v-model="searchSelectModal.keyword" class="search-modal-input" placeholder="输入关键字搜索..."
            :adjust-position="false" cursor-spacing="20" />
        </view>
        <scroll-view scroll-y class="search-modal-list">
          <view v-for="(opt, idx) in filteredSearchOptions" :key="idx" class="search-modal-item"
            :class="{ 'search-modal-item-active': modelValue[searchSelectModal.fieldKey] === getOptValue(opt) }"
            @click="onSearchSelectConfirm(opt)">
            <text class="search-modal-item-text">{{ getOptLabel(opt) }}</text>
            <text v-if="modelValue[searchSelectModal.fieldKey] === getOptValue(opt)"
              class="search-modal-item-check">✓</text>
          </view>
          <view v-if="filteredSearchOptions.length === 0" class="search-modal-empty">
            <text>无匹配选项</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'SchemaForm',

  props: {
    schema: {
      type: Object,
      required: true
    },
    modelValue: {
      type: Object,
      default: () => ({})
    },
    lineName: {
      type: String,
      default: ''
    },
    parentName: {
      type: String,
      default: ''
    },
    // 已拍照片，结构：{ slotKey: filePath }
    photos: {
      type: Object,
      default: () => ({})
    }
  },

  emits: ['update:modelValue', 'take-photo', 'preview-photo', 'delete-photo'],

  // ===== data 新增 =====
  data() {
    return {
      searchSelectModal: {
        visible: false,
        fieldKey: '',
        label: '',
        options: [],
        keyword: ''
      },
      // 用户自定义新增的照片槽位
      extraPhotoSlots: [],

      // 已拍照片操作面板
      actionSheet: {
        visible: false,
        slot: null // { key, label, filePath }
      },

      // 新增槽位弹窗
      addSlotModal: {
        visible: false,
        label: ''
      },
      // 相机图标 base64 SVG
      cameraIconSvg: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z'/%3E%3Ccircle cx='12' cy='13' r='4'/%3E%3C/svg%3E"
    };
  },

  computed: {
    // 按 group 分组字段
    groupedFields() {
      const fields = this.schema?.fields || []
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

    // 模糊搜索过滤后的选项
    filteredSearchOptions() {
      const { options, keyword } = this.searchSelectModal;
      if (!keyword) return options;
      const lowerKeyword = keyword.toLowerCase();
      return options.filter(opt => {
        const label = this.getOptLabel(opt).toLowerCase();
        return label.includes(lowerKeyword);
      });
    },
    compositePrefix() {
      return this.lineName ? `${this.lineName}#` : ''
    },
    // 动态获取 composite-name 类型字段
    compositeNameField() {
      return this.schema?.fields?.find(f => f.type === 'composite-name')
    },
    compositeSuffix() {
      const field = this.compositeNameField
      if (!field) return ''
      const value = this.modelValue[field.key] || ''
      const hashIndex = value.indexOf('#')
      if (hashIndex !== -1) {
        return value.substring(hashIndex + 1)
      }
      return value
    },

    // 合并 schema 定义的槽位 + 用户自定义槽位
    allPhotoSlots() {
      const base = this.schema?.photoSlots || [];
      return [...base, ...this.extraPhotoSlots];
    },

    // 是否显示照片区域
    showPhotoSection() {
      return Array.isArray(this.schema?.photoSlots) && this.schema.photoSlots.length > 0;
    },

    // 是否允许新增自定义槽位
    allowExtraSlot() {
      return !!this.schema?.extraPhotoSlot;
    }
  },

  methods: {
    /* ========== 搜索下拉弹窗逻辑 ========== */
    openSearchSelect(field, options) {
      this.searchSelectModal = {
        visible: true,
        fieldKey: field.key,
        label: field.label,
        options: options || [],
        keyword: ''
      };
    },

    closeSearchSelect() {
      this.searchSelectModal.visible = false;
    },

    onSearchSelectConfirm(opt) {
      const value = this.getOptValue(opt);
      this.onInput(this.searchSelectModal.fieldKey, value);
      this.closeSearchSelect();
    },
    /* ========== 选项处理（核心修复） ========== */

    /**
     * 从单个选项中提取显示文本（label）
     * 兼容两种格式：
     *   字符串 'xxx'  →  返回 'xxx'
     *   对象 { label: 'xxx', value: 'yyy' }  →  返回 'xxx'
     */
    getOptLabel(opt) {
      if (opt !== null && typeof opt === 'object') {
        return opt.label !== undefined ? '' + opt.label : ''
      }
      return '' + opt
    },

    /**
     * 从单个选项中提取实际值（value）
     * 兼容两种格式：
     *   字符串 'xxx'  →  返回 'xxx'
     *   对象 { label: 'xxx', value: 'yyy' }  →  返回 'yyy'
     */
    getOptValue(opt) {
      if (opt !== null && typeof opt === 'object') {
        return opt.value !== undefined ? '' + opt.value : '' + (opt.label || '')
      }
      return '' + opt
    },

    /**
     * 将选项数组转为纯字符串 label 数组（供 picker 的 range 使用）
     */
    getLabelsArray(options) {
      if (!options) return []
      return options.map(item => this.getOptLabel(item))
    },

    /**
     * 根据 value 在选项数组中找到对应的 label 用于显示
     */
    getDisplayLabel(options, value) {
      if (!options || !value) return ''
      const found = options.find(item => this.getOptValue(item) === value)
      return found ? this.getOptLabel(found) : value
    },

    /* ========== 数据更新 ========== */

    emitUpdate(val) {
      this.$emit('update:modelValue', { ...val })
    },

    onInput(key, value) {
      const newVal = { ...this.modelValue, [key]: value }
      this.clearInvalidDependents(key, value, newVal)
      this.emitUpdate(newVal)
    },

    onCompositeInput(key, suffix) {
      const prefix = this.compositePrefix
      const newVal = { ...this.modelValue, [key]: prefix + suffix }
      this.clearInvalidDependents(key, newVal[key], newVal)
      this.emitUpdate(newVal)
    },

    onPickerChange(key, options, e) {
      const idx = e.detail.value
      const opt = options[idx]
      if (opt !== undefined) {
        this.onInput(key, this.getOptValue(opt))
      }
    },

    onToggleMulti(key, optValue) {
      const current = Array.isArray(this.modelValue[key])
        ? [...this.modelValue[key]]
        : []
      const idx = current.indexOf(optValue)
      if (idx >= 0) {
        current.splice(idx, 1)
      } else {
        current.push(optValue)
      }
      const newVal = { ...this.modelValue, [key]: current }
      this.emitUpdate(newVal)
    },

    isMultiSelected(key, optValue) {
      const val = this.modelValue[key]
      return Array.isArray(val) && val.includes(optValue)
    },

    // 点击未拍照占位符
    onSlotTap(slot) {
      const filePath = this.photos[slot.key];
      if (filePath) {
        // 已拍照 → 打开操作面板
        this.actionSheet.slot = { key: slot.key, label: slot.label, filePath };
        this.actionSheet.visible = true;
      } else {
        // 未拍照 → 直接触发拍照
        this.$emit('take-photo', { key: slot.key, label: slot.label });
      }
    },

    // ActionSheet 选项
    onPreviewPhoto() {
      const { key, filePath } = this.actionSheet.slot;
      this.$emit('preview-photo', { key, filePath });
      this.closeActionSheet();
    },

    onRetakePhoto() {
      const { key, label } = this.actionSheet.slot;
      this.$emit('take-photo', { key, label });
      this.closeActionSheet();
    },

    onDeletePhoto() {
      const { key } = this.actionSheet.slot;
      this.$emit('delete-photo', { key });
      this.closeActionSheet();
    },

    closeActionSheet() {
      this.actionSheet.visible = false;
      this.actionSheet.slot = null;
    },

    // 新增槽位弹窗
    onAddSlotTap() {
      this.addSlotModal.label = '';
      this.addSlotModal.visible = true;
    },

    onConfirmAddSlot() {
      const label = this.addSlotModal.label.trim();
      if (!label) return;
      this.extraPhotoSlots.push({
        key: `extra_${Date.now()}`,
        label
      });
      this.addSlotModal.visible = false;
      this.addSlotModal.label = '';
    },

    onCancelAddSlot() {
      this.addSlotModal.visible = false;
      this.addSlotModal.label = '';
    },

    /* ========== 级联逻辑 ========== */

    clearInvalidDependents(changedKey, newValue, newVal) {
      this.schema.fields.forEach(field => {
        if (field.dependsOn === changedKey && field.optionsMap) {
          const validOptions = field.optionsMap[newValue] || []
          const validValues = validOptions.map(opt => this.getOptValue(opt))
          if (newVal[field.key] && !validValues.includes(newVal[field.key])) {
            newVal[field.key] = ''
          }
        }
      })
    },

    getCascadingOptions(field) {
      if (!field.dependsOn || !field.optionsMap) return []
      const parentVal = this.modelValue[field.dependsOn]
      if (!parentVal) return []
      return field.optionsMap[parentVal] || []
    },

    getPickerIndex(options, value) {
      if (!options || !value) return 0
      const idx = options.findIndex(item => this.getOptValue(item) === value)
      return idx >= 0 ? idx : 0
    },

    getFieldLabel(key) {
      const field = this.schema.fields.find(f => f.key === key)
      return field ? field.label : key
    },

    /* ========== 条件显示 ========== */

    isFieldVisible(field) {
      if (!field.visibleWhen) return true
      for (const depKey in field.visibleWhen) {
        const requiredValues = field.visibleWhen[depKey]
        const currentValue = this.modelValue[depKey]
        if (Array.isArray(currentValue)) {
          const hasMatch = requiredValues.some(v => currentValue.includes(v))
          if (!hasMatch) return false
        } else {
          if (!requiredValues.includes(currentValue)) return false
        }
      }
      return true
    },

    /* ========== 校验 ========== */

    validate() {
      const errors = []
      this.schema.fields.forEach(field => {
        if (['hidden', 'auto-calc', 'section'].includes(field.type)) return
        if (!this.isFieldVisible(field)) return
        if (!field.required) return
        const val = this.modelValue[field.key]
        if (field.type === 'multi-select' || field.type === 'checkbox') {
          if (!Array.isArray(val) || val.length === 0) {
            errors.push(field.label + '不能为空')
          }
        } else if (field.type === 'composite-name') {
          // 复合名称字段：只验证后缀部分
          const suffix = this.compositeSuffix
          if (!suffix || suffix.trim() === '') {
            errors.push(field.label + '不能为空')
          }
        } else {
          if (val === undefined || val === null || val === '') {
            errors.push(field.label + '不能为空')
          }
        }
      })
      return errors
    },

    /* ========== 默认值 ========== */

    initDefaults() {
      const newVal = { ...this.modelValue }
      let changed = false
      this.schema.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          const current = newVal[field.key]
          if (current === undefined || current === null || current === '') {
            newVal[field.key] = field.defaultValue
            changed = true
          }
        }
      })
      if (changed) {
        this.emitUpdate(newVal)
      }
    }
  }
}
</script>

<style scoped>
.schema-form {
  padding: 0;
}

/* ---- 分组卡片 ---- */
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

/* ---- 分组标题 ---- */
.section-header {
  padding: 0 0 16rpx 0;
  margin-bottom: 8rpx;
  border-bottom: 1rpx solid #e5e5e5;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

/* ---- 表单项 ---- */
.form-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-label-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 12rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
}

.required-star {
  color: #e74c3c;
  font-size: 28rpx;
  margin-left: 4rpx;
}

/* ---- 文本输入框 ---- */
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

/* ---- 复合名称输入框 ---- */
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

/* ---- 多行文本框 ---- */
.form-textarea {
  width: 100%;
  min-height: 34rpx;
  max-height: 100rpx;
  overflow: auto;
  border: 1rpx solid #dcdfe6;
  border-radius: 8rpx;
  padding: 16rpx 20rpx;
  font-size: 28rpx;
  color: #333;
  background: #fff;
  box-sizing: border-box;
}

/* ---- 单选/多选按钮组 ---- */
.option-group {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16rpx;
}

.option-btn {
  padding: 12rpx 28rpx;
  border: 1rpx solid #dcdfe6;
  border-radius: 8rpx;
  background: #fff;
}

.option-btn.option-active {
  border-color: #2979ff;
  background: #eef3ff;
}

.option-text {
  font-size: 26rpx;
  color: #333;
}

.option-active .option-text {
  color: #2979ff;
}

/* ===== 照片区域 ===== */
.photo-section {
  margin-top: 24rpx;
}

/* 网格容器 */
.photo-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 16rpx 24rpx;
  gap: 16rpx;
}

/* 网格项 - 三等分去除间距 */
.photo-grid-item {
  width: calc((100% - 32rpx) / 3);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 方形占位槽 */
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

/* 已拍照时去除虚线边框 */
.photo-slot-taken {
  border: none;
}

/* 已拍照状态 - 去掉虚线边框 */
.photo-thumb {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

/* 已拍照角标 */
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

/* 未拍照占位 */
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

/* 相机 SVG 图标 */
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

/* ===== Modal 弹窗 ===== */
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

/* ===== 搜索选择弹窗 ===== */
.search-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1001;
  display: flex;
  align-items: flex-end;
}

.search-modal-panel {
  width: 100%;
  height: 70vh;
  background-color: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.2s ease-out;
}

.search-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.search-modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.search-modal-close {
  font-size: 40rpx;
  color: #999;
  padding: 0 10rpx;
}

.search-modal-search {
  padding: 20rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.search-modal-input {
  width: 100%;
  height: 72rpx;
  background-color: #f5f7fa;
  border-radius: 36rpx;
  padding: 0 32rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.search-modal-list {
  flex: 1;
  height: 0;
}

.search-modal-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.search-modal-item:active {
  background-color: #f9f9f9;
}

.search-modal-item-text {
  font-size: 28rpx;
  color: #333;
}

.search-modal-item-active .search-modal-item-text {
  color: #2979ff;
  font-weight: 500;
}

.search-modal-item-check {
  color: #2979ff;
  font-size: 32rpx;
  font-weight: bold;
}

.search-modal-empty {
  padding: 60rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: #999;
}
</style>