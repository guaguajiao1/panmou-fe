<template>
  <view class="shipping-progress-wrapper">
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

// 定义 props
const props = defineProps({
  currentTotal: {
    type: Number,
    required: true,
  },
  threshold: {
    type: Number,
    required: true,
  },
})

// 计算免运费还差多少
const shippingDifference = computed(() => {
  const shortfall = props.threshold - props.currentTotal
  return shortfall > 0 ? shortfall : 0
})

// 计算进度百分比
const shippingProgress = computed(() => {
  const progress = (props.currentTotal / props.threshold) * 100
  return Math.min(progress, 100)
})
</script>

<style lang="scss" scoped>
.shipping-progress-wrapper {
  background-color: $uni-bg-color;
  padding: $uni-spacing-row-lg;
  margin: ($uni-spacing-row-lg * 2) $uni-spacing-row-base 0 $uni-spacing-row-base; // 保持之前的外边距
  border-radius: $uni-border-radius-lg;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .progress-text {
    font-size: $uni-font-size-sm;
    color: $uni-text-color-grey;
    margin-bottom: $uni-spacing-col-base;
    display: block;
    text-align: left;
    .highlight {
      color: $uni-color-error;
      font-weight: 500;
    }
    &.success {
      color: $uni-color-success;
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
    background-color: $uni-color-success;
    border-radius: 4px;
    transition: width 0.3s ease;
  }
}
</style>
