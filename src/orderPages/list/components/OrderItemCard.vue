<template>
  <view class="order-item-card" @click="$emit('click')">
    <image :src="item.productImage" class="product-image" mode="aspectFill" />
    <view class="product-info">
      <text class="product-name">{{ item.productName }}</text>
      <text class="product-attrs">{{ item.skuAttrs }}</text>
      <view class="price-row">
        <text class="actual-price">¥{{ item.unitPrice.toFixed(2) }}</text>
        <text class="quantity">x{{ item.quantity }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { OrderSkuItem } from '@/types/order'

defineProps<{
  item: OrderSkuItem
}>()

defineEmits<{
  (e: 'click'): void
}>()
</script>

<style lang="scss" scoped>
.order-item-card {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .product-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: $uni-border-radius-base;
    background-color: #f5f5f5;
    flex-shrink: 0;
    margin-right: 20rpx;
  }

  .product-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;

    .product-name {
      font-size: 28rpx;
      color: $uni-text-color;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      line-height: 1.4;
    }

    .product-attrs {
      font-size: 24rpx;
      color: $uni-text-color-grey;
      margin-top: 8rpx;
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12rpx;

      .actual-price {
        font-size: 28rpx;
        color: $uni-text-color;
        font-weight: 500;
      }

      .quantity {
        font-size: 26rpx;
        color: $uni-text-color-grey;
      }
    }
  }
}
</style>
