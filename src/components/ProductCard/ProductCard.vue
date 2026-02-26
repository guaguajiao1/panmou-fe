<template>
  <view class="product-card">
    <!-- 通用展示区 -->
    <view class="main-content">
      <image
        :src="props.image"
        class="product-image"
        mode="aspectFill"
        @click="emit('click')"
      ></image>

      <view class="product-info" @click="emit('click')">
        <text class="product-name">{{ props.name }}</text>

        <!-- 规格说明 -->
        <text class="product-spec" v-if="props.specs">{{ props.specs }}</text>

        <!-- 价格行 -->
        <view class="price-row">
          <text class="price-label">到手价</text>
          <text class="currency">¥</text>
          <text class="final-price">{{ props.finalPrice }}</text>
          <text class="original-price" v-if="props.originalPrice">¥{{ props.originalPrice }}</text>
        </view>

        <!-- 优惠入口 -->
        <view class="discount-entry" v-if="props.totalDiscount" @click.stop="openDiscountPopup">
          <text class="discount-text">{{ props.totalDiscount }}</text>
          <text class="discount-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 操作区 slot：步进器、按钮等由父组件注入 -->
    <slot />

    <!-- 优惠明细弹窗 -->
    <DiscountDetailPopup
      ref="discountPopupRef"
      :image="props.image"
      :finalPrice="props.finalPrice"
      :originalPrice="props.originalPrice"
      :quantity="props.quantity"
      :totalPrice="props.totalPrice"
      :discountDetails="props.discountDetails"
    />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ProductCardProps } from '@/types/product'
import DiscountDetailPopup from './DiscountDetailPopup.vue'

const props = defineProps<ProductCardProps>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const discountPopupRef = ref<InstanceType<typeof DiscountDetailPopup> | null>(null)

const openDiscountPopup = () => {
  discountPopupRef.value?.open()
}
</script>

<style lang="scss" scoped>
.product-card {
  background-color: #fff;
  border-radius: $uni-border-radius-lg;
  padding: $uni-spacing-row-lg;
  margin-bottom: $uni-spacing-col-base;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
}

.main-content {
  display: flex;
  flex-direction: row;
}

.product-image {
  width: 240rpx;
  height: 240rpx;
  border-radius: $uni-border-radius-base;
  margin-right: $uni-spacing-row-base;
  background-color: #f5f5f5;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: $uni-font-size-base;
  font-weight: 600;
  color: $uni-text-color;
  margin-bottom: 4rpx;
  @include text-ellipsis-2;
}

.product-spec {
  font-size: 24rpx;
  color: $uni-text-color-grey;
  margin-top: 8rpx;
  margin-bottom: 12rpx;
  display: block;
}

.price-row {
  display: flex;
  align-items: baseline;
  margin-bottom: 4rpx;

  .price-label {
    font-size: 24rpx;
    color: $uni-color-error;
    font-weight: bold;
    margin-right: 12rpx;
  }

  .currency {
    font-size: 24rpx;
    color: $uni-color-error;
    font-weight: bold;
  }

  .final-price {
    font-size: 36rpx;
    color: $uni-color-error;
    font-weight: bold;
    margin-right: 12rpx;
  }

  .original-price {
    font-size: 24rpx;
    color: $uni-text-color-grey;
  }
}

.discount-entry {
  display: flex;
  align-items: center;
  margin-top: 8rpx;
  cursor: pointer;

  .discount-text {
    font-size: 22rpx;
    color: $uni-color-error;
    font-weight: 500;
  }

  .discount-arrow {
    font-size: 28rpx;
    color: $uni-color-error;
    margin-left: 8rpx;
    line-height: 1;
  }
}
</style>
