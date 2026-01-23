<template>
  <view v-if="visible" class="popup-mask" @click="handleClose">
    <view class="popup-container" @click.stop>
      <!-- 标题 -->
      <view class="popup-header">
        <text class="popup-title">🎉 恭喜！盲盒已揭晓</text>
        <view class="close-btn" @click="handleClose">
          <text class="close-icon">×</text>
        </view>
      </view>

      <!-- 子SKU列表 -->
      <scroll-view scroll-x class="sku-scroll">
        <view class="sku-list">
          <view v-for="child in children" :key="child.itemId" class="sku-item">
            <view class="sku-image-wrapper">
              <image :src="child.productImage" class="sku-image" mode="aspectFill" />
              <view class="quantity-badge">x{{ child.quantity }}</view>
            </view>
            <text class="sku-name">{{ child.productName }}</text>
            <text class="sku-attrs">{{ child.skuAttrs }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="popup-footer">
        <button class="confirm-btn" @click="handleClose">我知道了</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { OrderSkuItem } from '@/types/order'

defineProps<{
  visible: boolean
  children: OrderSkuItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const handleClose = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.popup-container {
  width: 90%;
  max-width: 650rpx;
  background: linear-gradient(180deg, #fff5f5 0%, #ffffff 30%);
  border-radius: 24rpx;
  overflow: hidden;
  animation: popIn 0.3s ease-out;
}

@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;

  .popup-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
  }

  .close-btn {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .close-icon {
      font-size: 40rpx;
      color: #999;
    }
  }
}

.sku-scroll {
  white-space: nowrap;
  padding: 0 32rpx 32rpx;
}

.sku-list {
  display: inline-flex;
  gap: 24rpx;
}

.sku-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 180rpx;

  .sku-image-wrapper {
    position: relative;
    width: 140rpx;
    height: 140rpx;

    .sku-image {
      width: 100%;
      height: 100%;
      border-radius: 16rpx;
      background-color: #f5f5f5;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
    }

    .quantity-badge {
      position: absolute;
      top: -10rpx;
      right: -10rpx;
      background: linear-gradient(135deg, #ff6b6b, #ff8e53);
      color: #fff;
      font-size: 20rpx;
      padding: 4rpx 12rpx;
      border-radius: 20rpx;
      font-weight: 500;
    }
  }

  .sku-name {
    font-size: 24rpx;
    color: #333;
    margin-top: 16rpx;
    text-align: center;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    white-space: normal;
    width: 100%;
    line-height: 1.4;
  }

  .sku-attrs {
    font-size: 22rpx;
    color: #999;
    margin-top: 8rpx;
    text-align: center;
  }
}

.popup-footer {
  padding: 24rpx 32rpx 32rpx;

  .confirm-btn {
    width: 100%;
    background: linear-gradient(135deg, #ff6b6b, #ff8e53);
    color: #fff;
    font-size: 32rpx;
    padding: 24rpx 0;
    border-radius: 48rpx;
    border: none;

    &::after {
      display: none;
    }

    &:active {
      opacity: 0.9;
    }
  }
}
</style>
