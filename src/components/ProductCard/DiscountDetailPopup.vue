<template>
  <uni-popup
    ref="popupRef"
    type="bottom"
    background-color="#fff"
    :z-index="1001"
    :is-mask-click="true"
  >
    <view class="discount-popup-content">
      <!-- 标题栏 -->
      <view class="popup-header">
        <text class="popup-title">商品明细</text>
        <text class="popup-close" @click="close">✕</text>
      </view>

      <scroll-view scroll-y class="popup-body">
        <!-- 商品信息区 -->
        <view class="product-summary">
          <image :src="image" class="product-thumb" mode="aspectFill"></image>
          <view class="product-price-info">
            <view class="price-line">
              <text class="price-symbol">¥</text>
              <text class="price-value">{{ finalPrice }}</text>
            </view>
            <text class="original-price" v-if="originalPrice">¥{{ originalPrice }}</text>
            <text class="quantity-text" v-if="quantity">已选 {{ quantity }} 件</text>
          </view>
        </view>

        <!-- 费用明细卡片 -->
        <view class="detail-card">
          <!-- 商品总价 -->
          <view class="detail-row" v-if="totalPrice">
            <text class="detail-label bold">商品总价</text>
            <text class="detail-amount">¥{{ totalPrice }}</text>
          </view>

          <!-- 共减 -->
          <view class="detail-row" v-if="discountSum > 0">
            <text class="detail-label bold">共减</text>
            <text class="detail-amount discount">¥{{ discountSum.toFixed(2) }}</text>
          </view>

          <!-- 各项优惠明细 -->
          <view class="detail-row indent" v-for="(detail, index) in discountDetails" :key="index">
            <text class="detail-label">{{ detail.label }}</text>
            <text class="detail-amount discount"
              >-¥{{ Math.abs(parseFloat(detail.amount)).toFixed(2) }}</text
            >
          </view>
        </view>
      </scroll-view>
    </view>
  </uni-popup>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DiscountDetail } from '@/types/product'

const props = defineProps<{
  image?: string
  finalPrice?: string
  originalPrice?: string
  quantity?: number
  totalPrice?: string
  discountDetails?: DiscountDetail[]
}>()

const popupRef = ref<any>(null)

/** 优惠总额 */
const discountSum = computed(() => {
  if (!props.discountDetails?.length) return 0
  let sum = 0
  props.discountDetails.forEach((d) => {
    const amt = parseFloat(d.amount)
    if (!isNaN(amt) && amt < 0) sum += Math.abs(amt)
  })
  return sum
})

const open = () => {
  popupRef.value?.open('bottom')
}

const close = () => {
  popupRef.value?.close()
}

defineExpose({ open, close })
</script>

<style lang="scss" scoped>
.discount-popup-content {
  background-color: #fff;
  border-top-left-radius: 20rpx;
  border-top-right-radius: 20rpx;
  height: 66vh;
  display: flex;
  flex-direction: column;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);

  .popup-header {
    position: relative;
    text-align: center;
    padding: $uni-spacing-col-lg;
    border-bottom: 1px solid $uni-border-color;
    flex-shrink: 0;
    .popup-title {
      font-size: $uni-font-size-lg;
      font-weight: 600;
    }
    .popup-close {
      position: absolute;
      right: $uni-spacing-row-lg;
      top: 50%;
      transform: translateY(-50%);
      font-size: 40rpx;
      color: $uni-text-color-grey;
      cursor: pointer;
    }
  }

  .popup-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 $uni-spacing-row-lg;
    box-sizing: border-box;
  }
}

/* 商品信息区 */
.product-summary {
  display: flex;
  align-items: flex-start;
  padding: $uni-spacing-col-lg 0;

  .product-thumb {
    width: 160rpx;
    height: 160rpx;
    border-radius: 8rpx;
    margin-right: 24rpx;
    background-color: #f5f5f5;
    flex-shrink: 0;
  }

  .product-price-info {
    flex: 1;
    display: flex;
    flex-direction: column;

    .price-line {
      display: flex;
      align-items: baseline;

      .price-symbol {
        font-size: 28rpx;
        color: $uni-color-error;
        font-weight: bold;
      }

      .price-value {
        font-size: 40rpx;
        color: $uni-color-error;
        font-weight: bold;
        margin-right: 8rpx;
      }
    }

    .original-price {
      font-size: 24rpx;
      color: $uni-text-color-grey;
      text-decoration: line-through;
      margin-top: 4rpx;
    }

    .quantity-text {
      font-size: 24rpx;
      color: $uni-text-color-grey;
      margin-top: 4rpx;
    }
  }
}

/* 费用明细卡片 */
.detail-card {
  margin: $uni-spacing-col-lg 0;
  padding: $uni-spacing-col-lg $uni-spacing-row-lg;
  border: 1px solid $uni-border-color;
  border-radius: 12rpx;
  background-color: #fafafa;

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12rpx 0;

    &.indent {
      padding-left: 20rpx;
    }

    .detail-label {
      font-size: $uni-font-size-base;
      color: $uni-text-color;

      &.bold {
        font-weight: 600;
      }
    }

    .detail-amount {
      font-size: $uni-font-size-base;
      color: $uni-text-color;
      font-weight: 500;
      margin-left: 20rpx;
      flex-shrink: 0;

      &.discount {
        color: $uni-color-error;
      }
    }
  }
}
</style>
