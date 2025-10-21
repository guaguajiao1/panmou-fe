<template>
  <view class="cart-item">
    <view class="item-top-content">
      <image
        :src="props.item.sku.image"
        class="item-image"
        mode="aspectFill"
        @click="onGoToProductDetail"
      ></image>

      <view class="item-content-wrapper">
        <view class="item-info" @click="onGoToProductDetail">
          <text class="item-name">{{ props.item.sku.name }}</text>
          <text class="item-specs">{{ props.item.sku.specs }}</text>
        </view>

        <view class="price-info">
          <text class="current-price">¥{{ props.item.sku.adjustedPrice }}</text>
          <text
            class="original-price"
            v-if="props.item.sku.adjustedPrice !== props.item.sku.strikeThroughPrice"
          >
            ¥{{ props.item.sku.strikeThroughPrice.toFixed(2) }}
          </text>
        </view>
      </view>
    </view>

    <view class="item-bottom-controls">
      <view class="quantity-stepper">
        <button @click="onDecrease" :disabled="props.item.quantity <= 1">-</button>
        <text>{{ props.item.quantity }}</text>
        <button @click="onIncrease" :disabled="props.item.quantity >= props.item.availableQuantity">
          +
        </button>
      </view>

      <view class="purchase-type-selector">
        <view
          class="type-option"
          :class="{ active: props.item.purchaseType === 0 }"
          @click="onToggleType(0)"
        >
          <view class="radio-circle"></view>
          <text
            >买一次<text v-if="props.item.sku.onceDiscount > 0" class="save-highlight save-once"
              >（-¥{{ props.item.sku.onceDiscount.toFixed(2) }}）</text
            ></text
          >
        </view>
        <view
          class="type-option"
          :class="{ active: props.item.purchaseType === 1 }"
          @click="onToggleType(1)"
          v-if="props.item.sku.supportSubscription"
        >
          <view class="radio-circle"></view>
          <text
            >订阅<text
              v-if="props.item.sku.subscriptionDiscount > 0"
              class="save-highlight save-subscription"
              >（-¥{{ props.item.sku.subscriptionDiscount.toFixed(2) }}）</text
            ></text
          >
        </view>
      </view>

      <button class="delete-button" @click="onDelete">删除</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { Item } from '@/types/checkout'

// 1. Props: 定义组件需要从外部接收什么数据
// 确保导入 Item 类型
interface Props {
  item: Item
}
const props = defineProps<Props>()

// 2. Emits: 定义组件能向外发出哪些事件
const emit = defineEmits<{
  (e: 'increase', item: Item): void
  (e: 'decrease', item: Item): void
  (e: 'delete', item: Item): void
  (e: 'togglePurchaseType', payload: { item: Item; type: 0 | 1 }): void
  (e: 'goToProductDetail', productId: string | number): void
}>()

// 3. 本地事件处理器: 调用 emit 向父组件发送事件
const onIncrease = () => {
  emit('increase', props.item)
}

const onDecrease = () => {
  emit('decrease', props.item)
}

const onDelete = () => {
  emit('delete', props.item)
}

const onToggleType = (type: 0 | 1) => {
  // 如果类型未改变，则不发送事件
  if (props.item.purchaseType === type) return
  emit('togglePurchaseType', { item: props.item, type: type })
}

const onGoToProductDetail = () => {
  emit('goToProductDetail', props.item.sku.productId)
}
</script>

<style lang="scss" scoped>
.cart-item {
  background-color: $uni-bg-color;
  border-radius: $uni-border-radius-lg;
  padding: $uni-spacing-row-lg;
  margin-bottom: $uni-spacing-col-lg;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

  .item-top-content {
    display: flex;
    flex-direction: row;
  }

  .item-image {
    width: 40%;
    aspect-ratio: 1 / 1;
    height: auto;
    border-radius: $uni-border-radius-base;
    margin-right: $uni-spacing-row-base;
    flex-shrink: 0;
    background-color: $uni-bg-color-grey;
    cursor: pointer;
  }

  .item-content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .item-info {
    cursor: pointer;
    .item-name {
      display: block;
      font-size: $uni-font-size-base;
      font-weight: 600;
      color: $uni-text-color;
      margin-bottom: $uni-spacing-col-sm;
    }
    .item-specs {
      display: block;
      font-size: $uni-font-size-sm;
      color: $uni-text-color-grey;
    }
  }

  .price-info {
    margin-top: $uni-spacing-col-base;
    .current-price {
      font-size: 40rpx;
      font-weight: bold;
      color: $uni-color-error;
      display: block;
    }
    .original-price {
      font-size: 20rpx;
      color: $uni-text-color-grey;
      text-decoration: line-through;
      display: block;
    }
  }

  .item-bottom-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 50rpx;
    width: 100%;
  }

  .purchase-type-selector {
    margin: 0 $uni-spacing-row-base;
    flex-grow: 1;

    .type-option {
      display: flex;
      align-items: center;
      font-size: $uni-font-size-sm;

      // 增加 "买一次" 和 "订阅" 之间的垂直间距
      &:not(:last-child) {
        margin-bottom: 8rpx;
      }

      .radio-circle {
        width: 14px;
        height: 14px;
        border-radius: $uni-border-radius-circle;
        border: 1px solid $uni-border-color;
        margin-right: 5px;
        position: relative;
        flex-shrink: 0;
      }
      .save-highlight {
        font-weight: bold;

        &.save-once {
          color: $uni-text-color;
        }
        &.save-subscription {
          color: $uni-color-error;
        }
      }
      &.active {
        .radio-circle {
          border-color: $uni-color-primary;
          &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 7px;
            height: 7px;
            border-radius: $uni-border-radius-circle;
            background-color: $uni-color-primary;
          }
        }
      }
    }
  }

  .quantity-stepper {
    display: flex;
    align-items: center;
    border: 1px solid $uni-border-color;
    border-radius: 30rpx;
    flex-shrink: 0;

    button {
      background-color: transparent;
      padding: 0;
      margin: 0 20rpx;
      font-size: 40rpx;
      line-height: 50rpx;
      width: 50rpx;
      height: 50rpx;
      color: $uni-text-color;
      &:after {
        display: none;
      }
      &[disabled] {
        color: $uni-text-color-disable;
      }
    }
    text {
      font-size: $uni-font-size-base;
      font-weight: 500;
      min-width: 60rpx;
      text-align: center;
    }
  }

  .delete-button {
    flex-shrink: 0;
    font-size: $uni-font-size-base;
    color: $uni-color-primary;
    background-color: $uni-bg-color;
    border: 1px solid $uni-color-primary;
    border-radius: 30rpx;
    padding: 0 30rpx;
    margin: 0;
    height: 60rpx;
    line-height: 60rpx;

    &::after {
      display: none;
    }
    &:active {
      opacity: 0.7;
    }
  }
}
</style>
