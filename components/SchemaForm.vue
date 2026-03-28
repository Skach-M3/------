<template>
  <view class="schema-form">
    <block v-for="(field, index) in schema.fields" :key="index">
      <block v-if="field.type !== 'hidden' && isFieldVisible(field)">

        <!-- 分组标题 -->
        <view v-if="field.type === 'section'" class="section-header">
          <text class="section-title">{{ field.label }}</text>
        </view>

        <!-- 普通字段 -->
        <view v-else class="form-item">
          <view class="form-label-row">
            <text class="form-label">{{ field.label }}</text>
            <text v-if="field.required" class="required-star">*</text>
          </view>

          <!-- text -->
          <input v-if="field.type === 'text'" class="form-input" :value="modelValue[field.key]"
            :placeholder="field.placeholder || ('请输入' + field.label)"
            @input="onInput(field.key, $event.detail.value)" />

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
          <picker v-else-if="field.type === 'select'" :range="getLabelsArray(field.options)"
            :value="getPickerIndex(field.options, modelValue[field.key])"
            @change="onPickerChange(field.key, field.options, $event)">
            <view class="picker-box">
              <text :class="modelValue[field.key] ? 'picker-text' : 'picker-placeholder'">
                {{ getDisplayLabel(field.options, modelValue[field.key]) || ('请选择' + field.label) }}
              </text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>

          <!-- cascading-select 级联下拉 -->
          <block v-else-if="field.type === 'cascading-select'">
            <picker v-if="getCascadingOptions(field).length > 0" :range="getLabelsArray(getCascadingOptions(field))"
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
    }
  },

  emits: ['update:modelValue'],

  methods: {
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

/* ---- 分组标题 ---- */
.section-header {
  padding: 24rpx 0 12rpx 0;
  border-bottom: 1rpx solid #e5e5e5;
  margin-bottom: 12rpx;
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

/* ---- 多行文本框 ---- */
.form-textarea {
  width: 100%;
  min-height: 160rpx;
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
</style>