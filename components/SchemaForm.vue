<!-- components/SchemaForm.vue -->
<template>
  <view class="schema-form">
    <view v-for="field in schema.fields" :key="field.key" class="form-item">
      <!-- 标签 -->
      <view class="form-label">
        <text class="label-text">{{ field.label }}</text>
        <text v-if="field.required" class="required-star">*</text>
      </view>

      <!-- 文本输入 -->
      <input
        v-if="field.type === 'text'"
        class="form-input"
        :value="modelValue[field.key] || ''"
        :placeholder="field.placeholder || ''"
        @input="onInput(field.key, $event.detail.value)"
      />

      <!-- 数字输入 -->
      <input
        v-if="field.type === 'number'"
        class="form-input"
        type="digit"
        :value="modelValue[field.key] || ''"
        :placeholder="field.placeholder || ''"
        @input="onInput(field.key, $event.detail.value)"
      />

      <!-- 多行文本 -->
      <textarea
        v-if="field.type === 'textarea'"
        class="form-textarea"
        :value="modelValue[field.key] || ''"
        :placeholder="field.placeholder || ''"
        @input="onInput(field.key, $event.detail.value)"
      />

      <!-- 单选 -->
      <view v-if="field.type === 'radio'" class="radio-group">
        <view
          v-for="opt in field.options"
          :key="opt.value"
          class="radio-item"
          :class="{ 'radio-active': modelValue[field.key] === opt.value }"
          @tap="onInput(field.key, opt.value)"
        >
          <text class="radio-text">{{ opt.label }}</text>
        </view>
      </view>

      <!-- 下拉选择 -->
      <picker
        v-if="field.type === 'select'"
        :range="field.options"
        range-key="label"
        :value="getPickerIndex(field)"
        @change="onPickerChange(field, $event.detail.value)"
      >
        <view class="form-input picker-display">
          <text :class="{ 'placeholder-text': !modelValue[field.key] }">
            {{ getPickerLabel(field) || field.placeholder || '请选择' }}
          </text>
        </view>
      </picker>

      <!-- 错误提示 -->
      <text v-if="errors[field.key]" class="error-text">{{ errors[field.key] }}</text>
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
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      errors: {}
    }
  },
  methods: {
    onInput(key, value) {
      const newVal = { ...this.modelValue, [key]: value }
      this.$emit('update:modelValue', newVal)
      // 清除该字段的错误
      if (this.errors[key]) {
        this.errors = { ...this.errors, [key]: '' }
      }
    },

    getPickerIndex(field) {
      if (!field.options) return 0
      const idx = field.options.findIndex(o => o.value === this.modelValue[field.key])
      return idx >= 0 ? idx : 0
    },

    getPickerLabel(field) {
      if (!field.options || !this.modelValue[field.key]) return ''
      const opt = field.options.find(o => o.value === this.modelValue[field.key])
      return opt ? opt.label : ''
    },

    onPickerChange(field, index) {
      const opt = field.options[index]
      if (opt) {
        this.onInput(field.key, opt.value)
      }
    },

    // 供父组件调用的验证方法
    validate() {
      const errs = {}
      let valid = true
      this.schema.fields.forEach(field => {
        if (field.required) {
          const val = this.modelValue[field.key]
          if (val === undefined || val === null || val === '') {
            errs[field.key] = field.label + '不能为空'
            valid = false
          }
        }
      })
      this.errors = errs
      return valid
    }
  }
}
</script>

<style scoped>
.schema-form {
  padding: 20rpx;
}
.form-item {
  margin-bottom: 30rpx;
}
.form-label {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 12rpx;
}
.label-text {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}
.required-star {
  color: #e53935;
  font-size: 30rpx;
  margin-left: 6rpx;
}
.form-input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  background: #fff;
  box-sizing: border-box;
}
.form-textarea {
  width: 100%;
  height: 180rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  padding: 20rpx;
  font-size: 28rpx;
  background: #fff;
  box-sizing: border-box;
}
.radio-group {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16rpx;
}
.radio-item {
  padding: 14rpx 30rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  background: #f9f9f9;
}
.radio-active {
  border-color: #2979ff;
  background: #e3f2fd;
}
.radio-text {
  font-size: 26rpx;
  color: #333;
}
.picker-display {
  display: flex;
  align-items: center;
}
.placeholder-text {
  color: #999;
}
.error-text {
  font-size: 24rpx;
  color: #e53935;
  margin-top: 8rpx;
}
</style>