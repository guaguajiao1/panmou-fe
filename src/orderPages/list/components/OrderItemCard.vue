<template>
  <view class="order-item-card" @click="$emit('click')">
    <!-- 普通商品或盲盒未开启时的父商品展示 -->
    <view class="main-item">
      <image :src="item.productImage" class="product-image" mode="aspectFill" />
      <view class="product-info">
        <text class="product-name">{{ item.productName }}</text>
        <text class="product-attrs">{{ item.skuAttrs }}</text>
      </view>
      <view class="price-info">
        <text class="actual-price">¥{{ item.unitPrice.toFixed(2) }}</text>
        <text class="quantity">x{{ item.quantity }}</text>
      </view>
    </view>

    <!-- 组合商品子SKU展示（showChildren=true 且非盲盒或盲盒已拆开） -->
    <view v-if="shouldShowChildren" class="children-container">
      <scroll-view scroll-x class="children-scroll">
        <view class="children-list">
          <view v-for="child in item.children" :key="child.itemId" class="child-item">
            <image :src="child.productImage" class="child-image" mode="aspectFill" />
            <text class="child-name">{{ child.productName }}</text>
            <text class="child-attrs">{{ child.skuAttrs }}</text>
            <text class="child-quantity">x{{ child.quantity }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 盲盒操作按钮 -->
    <view v-if="showMysteryBoxButton" class="mystery-box-action">
      <button class="open-box-btn" @click.stop="handleOpenMysteryBox">🎁 拆盲盒</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OrderSkuItem } from '@/types/order'
import { OrderState, ItemType } from '@/types/order-state'

const props = defineProps<{
  item: OrderSkuItem
  orderState?: OrderState
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'openMysteryBox', itemId: string): void
}>()

// 是否显示子SKU
const shouldShowChildren = computed(() => {
  // 盲盒商品：必须已拆开才显示
  if (props.item.isMysteryBox) {
    return props.item.mysteryBoxOpened && props.item.children && props.item.children.length > 0
  }
  // 组合商品：根据 showChildren 字段判断
  if (props.item.itemType === ItemType.BUNDLE || props.item.itemType === ItemType.MYSTERY_BOX) {
    return props.item.showChildren && props.item.children && props.item.children.length > 0
  }
  return false
})

// 是否显示盲盒拆开按钮
const showMysteryBoxButton = computed(() => {
  return (
    props.item.isMysteryBox &&
    !props.item.mysteryBoxOpened &&
    props.orderState === OrderState.COMPLETED &&
    props.item.children &&
    props.item.children.length > 0
  )
})

// 拆盲盒
const handleOpenMysteryBox = () => {
  emit('openMysteryBox', props.item.itemId)
}
</script>

<style lang="scss" scoped>
.order-item-card {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.main-item {
  display: flex;
  align-items: flex-start;

  .product-image {
    width: 180rpx;
    height: 180rpx;
    border-radius: 12rpx;
    background-color: #f5f5f5;
    flex-shrink: 0;
  }

  .product-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-left: 20rpx;
    min-width: 0;

    .product-name {
      font-size: 28rpx;
      color: #333;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      overflow: hidden;
      line-height: 1.4;
      word-break: break-all;
    }

    .product-attrs {
      font-size: 24rpx;
      color: #999;
      margin-top: 12rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .price-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-left: 16rpx;
    flex-shrink: 0;

    .actual-price {
      font-size: 30rpx;
      color: #333;
      font-weight: 600;
    }

    .quantity {
      font-size: 24rpx;
      color: #999;
      margin-top: 12rpx;
    }
  }
}

// 子SKU水平滚动区域
.children-container {
  margin-top: 16rpx;
  padding: 16rpx;
  background-color: #f8f8f8;
  border-radius: 12rpx;
}

.children-scroll {
  white-space: nowrap;
}

.children-list {
  display: inline-flex;
  gap: 16rpx;
}

.child-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 140rpx;
  flex-shrink: 0;

  .child-image {
    width: 100rpx;
    height: 100rpx;
    border-radius: 8rpx;
    background-color: #fff;
  }

  .child-name {
    font-size: 22rpx;
    color: #333;
    margin-top: 8rpx;
    text-align: center;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    overflow: hidden;
    width: 100%;
  }

  .child-attrs {
    font-size: 20rpx;
    color: #999;
    margin-top: 4rpx;
    text-align: center;
  }

  .child-quantity {
    font-size: 20rpx;
    color: #999;
    margin-top: 4rpx;
  }
}

// 盲盒按钮
.mystery-box-action {
  margin-top: 16rpx;
  display: flex;
  justify-content: center;

  .open-box-btn {
    background: linear-gradient(135deg, #ff6b6b, #ff8e53);
    color: #fff;
    font-size: 28rpx;
    padding: 16rpx 48rpx;
    border-radius: 40rpx;
    border: none;
    box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.4);

    &::after {
      display: none;
    }

    &:active {
      transform: scale(0.95);
    }
  }
}
</style>
