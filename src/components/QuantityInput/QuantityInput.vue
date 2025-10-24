<template>
  <view class="vk-data-input-number-box">
    <view
      class="u-icon-minus"
      :class="{ 'u-icon-disabled': disabled || Number(inputVal) <= min }"
      :style="{
        background: bgColor,
        height: inputHeight + 'rpx',
        color: color,
        fontSize: size + 'rpx',
        minHeight: '1.4em',
      }"
      @touchstart.prevent="btnTouchStart('minus')"
      @touchend.stop.prevent="clearTimer"
    >
      <view :style="'font-size:' + (Number(size) + 10) + 'rpx'" class="num-btn">－</view>
    </view>

    <input
      v-model="inputVal"
      :disabled="disabledInput || disabled"
      :cursor-spacing="getCursorSpacing"
      :class="{ 'u-input-disabled': disabled }"
      class="u-number-input"
      type="number"
      :style="{
        color: color,
        fontSize: size + 'rpx',
        background: bgColor,
        height: inputHeight + 'rpx',
        width: inputWidth + 'rpx',
      }"
      @blur="onBlur"
    />

    <view
      class="u-icon-plus"
      :class="{ 'u-icon-disabled': disabled || Number(inputVal) >= max }"
      :style="{
        background: bgColor,
        height: inputHeight + 'rpx',
        color: color,
        fontSize: size + 'rpx',
        minHeight: '1.4em',
      }"
      @touchstart.prevent="btnTouchStart('plus')"
      @touchend.stop.prevent="clearTimer"
    >
      <view :style="'font-size:' + (Number(size) + 10) + 'rpx'" class="num-btn">＋</view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * numberBox 步进器（此为uview组件改造）
 * @property {Number} modelValue 输入框初始值 (v-model)
 */
import { ref, computed, watch, nextTick } from 'vue'

// --- Props (纯 Vue 3) ---
const props = defineProps({
  // (Vue 3 v-model)
  modelValue: {
    type: Number,
    default: 1,
  },
  // 背景颜色
  bgColor: {
    type: String,
    default: '#F2F3F5',
  },
  // 最小值
  min: {
    type: Number,
    default: 0,
  },
  // 最大值
  max: {
    type: Number,
    default: 99999,
  },
  // 步进值，每次加或减的值
  step: {
    type: Number,
    default: 1,
  },
  // 步进值，首次增加或最后减的值
  stepFirst: {
    type: Number,
    default: 0,
  },
  // 是否只能输入 step 的倍数
  stepStrictly: {
    type: Boolean,
    default: false,
  },
  // 是否禁用加减操作
  disabled: {
    type: Boolean,
    default: false,
  },
  // input的字体大小，单位rpx
  size: {
    type: [Number, String],
    default: 26,
  },
  // 加减图标的颜色
  color: {
    type: String,
    default: '#323233',
  },
  // input宽度，单位rpx
  inputWidth: {
    type: [Number, String],
    default: 80,
  },
  // input高度，单位rpx
  inputHeight: {
    type: [Number, String],
    default: 50,
  },
  // index索引
  index: {
    type: [Number, String],
    default: '',
  },
  // 是否禁用输入框
  disabledInput: {
    type: Boolean,
    default: false,
  },
  // 输入框于键盘之间的距离
  cursorSpacing: {
    type: [Number, String],
    default: 100,
  },
  // 是否开启长按连续递增或递减
  longPress: {
    type: Boolean,
    default: true,
  },
  // 开启长按触发后，每触发一次需要多久
  pressTime: {
    type: [Number, String],
    default: 250,
  },
  // 是否只能输入大于或等于0的整数(正整数)
  positiveInteger: {
    type: Boolean,
    default: true,
  },
})

// --- Emits (纯 Vue 3) ---
// 【修复2】使用对象字面量（元组）语法
type InputNumberBoxEventPayload = {
  value: number
  index: string | number
}
const emit = defineEmits<{
  'update:modelValue': [value: number]
  change: [event: InputNumberBoxEventPayload]
  blur: [event: InputNumberBoxEventPayload]
  plus: [event: InputNumberBoxEventPayload]
  minus: [event: InputNumberBoxEventPayload]
}>()

// --- Reactive State ---
const inputVal = ref<number | string>(Number(props.modelValue)) // 输入框中的值
const timer = ref<NodeJS.Timeout | null>(null) // 用作长按的定时器
const changeFromInner = ref(false) // 值发生变化，是来自内部还是外部
const innerChangeTimer = ref<NodeJS.Timeout | null>(null) // 内部定时器

// --- Computed ---
const getCursorSpacing = computed(() => {
  // 先将值转为px单位，再转为数值
  return Number(uni.upx2px(Number(props.cursorSpacing)))
})

// --- Watchers ---
// 监听来自外部 v-model 的变化
watch(
  () => props.modelValue,
  (v1) => {
    // 只有value的改变是来自外部的时候，才去同步inputVal的值
    if (!changeFromInner.value) {
      inputVal.value = v1
      nextTick(() => {
        changeFromInner.value = false
      })
    }
  },
)

// 监听内部输入框的变化
watch(inputVal, (v1, v2) => {
  // 允许用户清空输入框
  if (v1 === '') return
  let value: number | string = 0
  // 检查是否为有效数字
  let tmp = isNumber(v1)
  if (tmp && Number(v1) >= props.min && Number(v1) <= props.max) {
    value = v1
  } else {
    value = v2 // 如果无效，恢复为上一个有效值
  }
  // 检查是否为正整数
  if (props.positiveInteger) {
    // 小于0，或者带有小数点
    if (Number(v1) < 0 || String(v1).indexOf('.') !== -1) {
      value = v2
      // 强制更新输入框显示
      nextTick(() => {
        inputVal.value = v2
      })
    }
  }
  // 发出change事件
  handleChange(Number(value), 'change')
})

// 【修复1】修正 min/max 变化时，v-model 的值
watch(
  () => props.min,
  (newMin) => {
    // 移除 v1 !== '' 检查
    if (props.modelValue < newMin) {
      emit('update:modelValue', newMin)
    }
  },
)
// 【修复1】修正 min/max 变化时，v-model 的值
watch(
  () => props.max,
  (newMax) => {
    // 移除 v1 !== '' 检查
    if (props.modelValue > newMax) {
      emit('update:modelValue', newMax)
    }
  },
)

// --- Methods ---

/**
 * 验证十进制数字
 */
const isNumber = (value: any): boolean => {
  return /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value)
}

/**
 * 统一处理change事件
 */
const handleChange = (value: number, type: 'change' | 'blur' | 'plus' | 'minus') => {
  if (props.disabled) return
  // 清除定时器，避免造成混乱
  if (innerChangeTimer.value) {
    clearTimeout(innerChangeTimer.value)
    innerChangeTimer.value = null
  }
  // 标记为内部变更
  changeFromInner.value = true
  // 一定时间内，清除changeFromInner标记
  innerChangeTimer.value = setTimeout(() => {
    changeFromInner.value = false
  }, 150)

  // 纯 Vue 3 v-model：只 emit 'update:modelValue'
  emit('update:modelValue', Number(value))

  // 触发其他事件
  // 【修复2】现在这个 'emit' 调用可以正确匹配类型了
  emit(type, {
    value: Number(value),
    index: props.index,
  })
}

// 精度计算：加法
const calcPlus = (num1: any, num2: any): string => {
  let baseNum, baseNum1, baseNum2
  try {
    baseNum1 = num1.toString().split('.')[1].length
  } catch (e) {
    baseNum1 = 0
  }
  try {
    baseNum2 = num2.toString().split('.')[1].length
  } catch (e) {
    baseNum2 = 0
  }
  baseNum = Math.pow(10, Math.max(baseNum1, baseNum2))
  let precision = baseNum1 >= baseNum2 ? baseNum1 : baseNum2 //精度
  return ((num1 * baseNum + num2 * baseNum) / baseNum).toFixed(precision)
}

// 精度计算：减法
const calcMinus = (num1: any, num2: any): string => {
  let baseNum, baseNum1, baseNum2
  try {
    baseNum1 = num1.toString().split('.')[1].length
  } catch (e) {
    baseNum1 = 0
  }
  try {
    baseNum2 = num2.toString().split('.')[1].length
  } catch (e) {
    baseNum2 = 0
  }
  baseNum = Math.pow(10, Math.max(baseNum1, baseNum2))
  let precision = baseNum1 >= baseNum2 ? baseNum1 : baseNum2
  return ((num1 * baseNum - num2 * baseNum) / baseNum).toFixed(precision)
}

/**
 * 计算+或-的值
 */
const computeVal = (type: 'minus' | 'plus') => {
  uni.hideKeyboard()
  if (props.disabled) return
  let value = 0
  const currentVal = Number(inputVal.value)

  // 减
  if (type === 'minus') {
    if (props.stepFirst > 0 && currentVal === props.stepFirst) {
      value = props.min
    } else {
      value = Number(calcMinus(currentVal, props.step))
    }
  }
  // 加
  else if (type === 'plus') {
    if (props.stepFirst > 0 && currentVal < props.stepFirst) {
      value = props.stepFirst
    } else {
      value = Number(calcPlus(currentVal, props.step))
    }
  }

  // 步长倍数限制
  if (props.stepStrictly) {
    let strictly = value % props.step
    if (strictly > 0) {
      value -= strictly
    }
  }

  // 边界限制
  if (value > props.max) {
    value = props.max
  } else if (value < props.min) {
    value = props.min
  }

  // 触发更新
  inputVal.value = value
  handleChange(value, type)
}

const minus = () => {
  computeVal('minus')
}

const plus = () => {
  computeVal('plus')
}

/**
 * 清除长按定时器
 */
const clearTimer = () => {
  nextTick(() => {
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
  })
}

/**
 * 按钮长按开始
 */
const btnTouchStart = (callbackType: 'minus' | 'plus') => {
  // 先执行一遍方法
  if (callbackType === 'minus') {
    minus()
  } else if (callbackType === 'plus') {
    plus()
  }

  // 如果没开启长按功能，直接返回
  if (!props.longPress) return

  if (timer.value) clearInterval(timer.value) //再次清空定时器，防止重复注册
  timer.value = null

  timer.value = setInterval(() => {
    // 持续执行加或减函数
    if (callbackType === 'minus') {
      minus()
    } else if (callbackType === 'plus') {
      plus()
    }
  }, Number(props.pressTime))
}

/**
 * 处理用户手动输入（失去焦点时）
 */
const onBlur = (event: any) => {
  let val = 0
  let value = event.detail.value

  if (value === '') {
    // 如果清空了，则恢复到最小值
    val = props.min
  } else if (props.positiveInteger && (value[0] == 0 || String(value).indexOf('.') !== -1)) {
    // 如果要求正整数，但输入了 "05" 或 "1.5" 等
    val = props.min
  } else if (!isNumber(value)) {
    // 如果输入了 "abc" 等非数字
    val = props.min
  } else {
    val = +value
  }

  // 步进值修正
  if (props.stepFirst > 0 && val < props.stepFirst && val > 0) {
    val = props.stepFirst
  }

  // 步长倍数修正
  if (props.stepStrictly) {
    let strictly = val % props.step
    if (strictly > 0) {
      val -= strictly
    }
  }

  // 边界修正
  if (val > props.max) {
    val = props.max
  } else if (val < props.min) {
    val = props.min
  }

  // 最终更新
  nextTick(() => {
    inputVal.value = val
    handleChange(val, 'blur')
  })
}
</script>

<style lang="scss" scoped>
/* 样式与原文件一致 */
.vk-data-input-number-box {
  display: inline-flex;
  align-items: center;
}

.u-number-input {
  position: relative;
  text-align: center;
  padding: 0;
  margin: 0 6rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.u-icon-plus,
.u-icon-minus {
  width: 60rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.u-icon-plus {
  border-radius: 0 8rpx 8rpx 0;
}

.u-icon-minus {
  border-radius: 8rpx 0 0 8rpx;
}

.u-icon-disabled {
  color: #c8c9cc !important;
  background: #f7f8fa !important;
}

.u-input-disabled {
  color: #c8c9cc !important;
  background-color: #f2f3f5 !important;
}
.num-btn {
  font-weight: 550;
  position: relative;
  top: -4rpx;
}
</style>
