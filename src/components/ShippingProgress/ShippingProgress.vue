<template>
  <view class="shipping-progress-wrapper" :class="['variant-' + variant]">
    <text class="progress-text" v-if="shippingDifference > 0">
      还差 <text class="highlight">¥{{ shippingDifference.toFixed(2) }}</text> 即可免运费
    </text>
    <text class="progress-text success" v-else> 🎉 已满足免运费条件 </text>
    <view class="progress-bar">
      <view class="progress-bar-inner" :style="{ width: shippingProgress + '%' }"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  /** 当前订单总额 */
  currentTotal: {
    type: [Number, String] as any,
    required: true,
  },
  /** 免运费阈值 */
  threshold: {
    type: [Number, String] as any,
    required: true,
  },
  /**
   * 样式变体:
   * 'default': 带背景、阴影、圆角、默认内边距 (用于 subscription, checkout)
   * 'compact': 透明背景、无阴影、无圆角、更小内边距 (用于 cart 底部栏)
   */
  variant: {
    type: String,
    default: 'default', // 默认为 default
    validator: (value: string) => ['default', 'compact'].includes(value),
  },
})

/** 免运费还差多少 */
const shippingDifference = computed(() => {
  const shortfall = parseFloat(String(props.threshold)) - parseFloat(String(props.currentTotal))
  return shortfall > 0 ? shortfall : 0
})

/** 进度百分比 */
const shippingProgress = computed(() => {
  const numThreshold = parseFloat(String(props.threshold))
  const numCurrent = parseFloat(String(props.currentTotal))
  if (!numThreshold) return 0
  const progress = (numCurrent / numThreshold) * 100
  return Math.min(progress, 100)
})
</script>

<style lang="scss" scoped>
.shipping-progress-wrapper {
  // 通用样式
  width: 100%; // 默认占满父容器宽度
  box-sizing: border-box;

  // Default variant styles (带轮廓)
  &.variant-default {
    background-color: $uni-bg-color;
    padding: $uni-spacing-col-base $uni-spacing-row-lg;
    border-radius: $uni-border-radius-lg;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    // margin is controlled by the parent component
  }

  // Compact variant styles (无轮廓, 用于购物车底部栏)
  &.variant-compact {
    background-color: transparent; // 无背景
    padding: $uni-spacing-col-sm $uni-spacing-row-sm; // 更小内边距
    border-radius: 0; // 无圆角
    box-shadow: none; // 无阴影
  }
}

.progress-text {
  font-size: $uni-font-size-sm;
  color: $uni-text-color-grey;
  margin-bottom: $uni-spacing-col-sm;
  display: block;
  text-align: left;
  .highlight {
    color: $uni-color-error;
    font-weight: 500;
  }
  &.success {
    color: $uni-color-success; // 成功文字颜色保持绿色
    font-weight: 500;
  }
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: $uni-bg-color-grey;
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar-inner {
  height: 100%;
  // [MODIFIED] 3. 颜色使用 $uni-color-primary
  background-color: $uni-color-primary; // 改为蓝色
  border-radius: 4px;
  transition: width 0.3s ease;
}
</style>
