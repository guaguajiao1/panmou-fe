<template>
  <view class="cart-page">
    <CustomNavigationBar title="购物车"></CustomNavigationBar>

    <scroll-view
      scroll-y
      class="scroll-view-container"
      :refresher-enabled="true"
      @refresherrefresh="onRefresh"
      :refresher-triggered="isRefreshing"
    >
      <view class="cart-item" v-for="item in cartData.items" :key="item.id">
        <view class="item-main">
          <image
            :src="item.sku.image"
            class="item-image"
            mode="aspectFill"
            @click="goToProductDetail(item.sku.productId)"
          ></image>

          <view class="item-content-wrapper">
            <view class="item-info" @click="goToProductDetail(item.sku.productId)">
              <text class="item-name">{{ item.sku.name }}</text>
              <text class="item-specs">{{ item.sku.specs }}</text>
            </view>

            <view class="item-controls">
              <view class="quantity-stepper">
                <button @click="decreaseQuantity(item)" :disabled="item.quantity <= 1">-</button>
                <text>{{ item.quantity }}</text>
                <button
                  @click="increaseQuantity(item)"
                  :disabled="item.quantity >= item.availableQuantity"
                >
                  +
                </button>
              </view>
              <view class="price-info">
                <text class="current-price">¥{{ item.sku.adjustedPrice }}</text>
                <text class="original-price">¥{{ item.sku.strikeThroughPrice.toFixed(2) }} </text>
              </view>
            </view>

            <view class="purchase-type-selector">
              <view
                class="type-option"
                :class="{ active: item.purchaseType === 0 }"
                @click="togglePurchaseType(item, 0)"
              >
                <view class="radio-circle"></view>
                <text
                  >买一次<text v-if="item.sku.onceDiscount > 0" class="save-highlight"
                    >省{{ item.sku.onceDiscountRate }}%（-¥{{
                      item.sku.onceDiscount.toFixed(2)
                    }}）</text
                  ></text
                >
              </view>
              <view
                class="type-option"
                :class="{ active: item.purchaseType === 1 }"
                @click="togglePurchaseType(item, 1)"
                v-if="item.sku.supportSubscription"
              >
                <view class="radio-circle"></view>
                <text
                  >订阅并<text class="save-highlight"
                    >省{{ item.sku.subscriptionDiscountRate }}%（-¥{{
                      item.sku.subscriptionDiscount.toFixed(2)
                    }}）</text
                  ></text
                >
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="cartData.items.length === 0" class="empty-cart">
        <image
          src="https://placehold.co/100x100/f0f0f0/cccccc?text=🐾"
          class="empty-icon"
          mode="aspectFit"
        ></image>
        <text>购物车还是空的哦</text>
        <button class="go-shopping-btn" @click="goShopping">去逛逛</button>
      </view>
      <view style="height: 120rpx"></view>
    </scroll-view>

    <view class="cart-footer" v-if="cartData.items.length > 0">
      <view class="shipping-progress-wrapper">
        <view class="progress-bar">
          <view class="progress-bar-inner" :style="{ width: shippingProgress + '%' }"></view>
        </view>
        <text class="progress-text" v-if="shippingDifference > 0">
          还差 <text class="highlight">¥{{ shippingDifference.toFixed(2) }}</text> 即可免运费
        </text>
        <text class="progress-text success" v-else> 🎉 已满足免运费条件 </text>
      </view>

      <view class="subtotal-info">
        <text class="subtotal-label">合计:</text>
        <view class="subtotal-price">
          <text class="final-price">¥{{ cartData.grandTotal.toFixed(2) }}</text>
          <text class="original-total" v-if="totalDiscount > 0"
            >已省 ¥{{ totalDiscount.toFixed(2) }}</text
          >
        </view>
      </view>
      <button class="checkout-button" @click="handleCheckout">
        去结算 ({{ cartData.totalItemQuantity }})
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// 修正导入路径
import { cartApi } from '@/api/cart'
import type { Cart } from '@/types/cart'
import type { Item } from '@/types/checkout'

// --- 默认购物车数据结构（应与Cart类型严格一致） ---
const defaultCart: Cart = {
  id: '',
  totalItemQuantity: 0,
  subtotal: 0,
  grandTotal: 0,
  shippingFee: 0,
  freeShippingThreshold: 50,
  freeShippingEligibleAmount: 0,
  items: [],
}

// --- 响应式数据 ---
const cartData = ref<Cart>(defaultCart)
const isRefreshing = ref(false)

// --- 计算属性 ---

/** 实际已节省的金额（subtotal - grandTotal） */
const totalDiscount = computed(() => {
  const discount = cartData.value.subtotal - cartData.value.grandTotal
  // 确保折扣金额不为负
  return discount > 0 ? discount : 0
})

/** 距离免运费门槛还差多少 */
const shippingDifference = computed(() =>
  // 免运费门槛 - 参与免运费活动的商品总额
  Math.max(0, cartData.value.freeShippingThreshold - cartData.value.freeShippingEligibleAmount),
)

/** 免运费进度条百分比 */
const shippingProgress = computed(() => {
  const threshold = cartData.value.freeShippingThreshold
  const eligibleAmount = cartData.value.freeShippingEligibleAmount
  if (threshold <= 0) return 100 // 避免除零或无门槛

  const progress = (eligibleAmount / threshold) * 100
  return Math.min(progress, 100)
})

// --- API 方法 ---

/**
 * 获取购物车详情 (用于初始化和刷新)
 */
const fetchCartData = async () => {
  // 仅在手动下拉刷新时设置动画状态
  if (!isRefreshing.value) {
    // 假设非手动刷新时不需要加载动画
  }

  try {
    const res = await cartApi.get()
    if (res && res.result) {
      cartData.value = res.result as Cart
    } else {
      cartData.value = defaultCart
    }
  } catch (error) {
    console.error('获取购物车失败', error)
    uni.showToast({ title: '加载失败，请重试', icon: 'none' })
  } finally {
    isRefreshing.value = false
  }
}

/**
 * 更新商品数量 (增加)
 */
const increaseQuantity = async (item: Item) => {
  if (item.quantity >= item.availableQuantity) {
    uni.showToast({ title: '已达到最大库存', icon: 'none' })
    return
  }

  const newQuantity = item.quantity + 1
  try {
    await cartApi.updateItem(item.sku.skuId as string, { quantity: newQuantity })
    await fetchCartData()
  } catch (error) {
    console.error('增加数量失败', error)
  }
}

/**
 * 更新商品数量 (减少或删除)
 */
const decreaseQuantity = async (item: Item) => {
  const newQuantity = item.quantity - 1
  try {
    await cartApi.updateItem(item.sku.skuId as string, { quantity: newQuantity })
    await fetchCartData()
  } catch (error) {
    console.error('减少数量失败', error)
  }
}

/**
 * 切换购买方式 (0: 买一次, 1: 订阅)
 */
const togglePurchaseType = async (item: Item, type: 0 | 1) => {
  if (item.purchaseType !== type) {
    try {
      await cartApi.updateItem(item.sku.skuId as string, { purchaseType: type })
      await fetchCartData()
    } catch (error) {
      console.error('切换购买方式失败', error)
    }
  }
}

// --- 事件处理函数 ---

const onRefresh = async () => {
  isRefreshing.value = true
  await fetchCartData()
}

const handleCheckout = () => {
  // uni.navigateTo({ url: `/pages/checkout/checkout?cartId=${cartData.value.id}` })
  console.log('去结算，Cart ID：', cartData.value.id)
}

const goToProductDetail = (id: string | number) => {
  // uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
  console.log('查看商品详情：', id)
}

const goShopping = () => {
  // uni.switchTab({ url: '/pages/index/index' })
  console.log('去逛逛')
}

// 页面加载时获取数据
onMounted(() => {
  fetchCartData()
})
</script>

<style lang="scss" scoped>
/* SCSS 变量定义 */

// uni-app 的 page 自动引入了 $uni-xxx 变量，直接在样式中使用即可。

.cart-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: $uni-bg-color-grey;
}

.custom-nav-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $uni-spacing-col-base $uni-spacing-row-lg;
  padding-top: var(--status-bar-height);
  background-color: $uni-bg-color;
  position: relative;
  border-bottom: 1px solid #eee;

  .title {
    font-size: $uni-font-size-lg;
    font-weight: 600;
    color: $uni-text-color;
  }
}

.shipping-progress-wrapper {
  padding: $uni-spacing-col-base $uni-spacing-row-lg;
  background-color: $uni-bg-color;
  margin-top: $uni-spacing-col-base;
  width: 100%;

  .progress-bar {
    height: 15px;
    background-color: $uni-bg-color-grey;
    border-radius: $uni-border-radius-lg;
    overflow: hidden;
    .progress-bar-inner {
      height: 100%;
      background-color: $uni-color-primary;
      border-radius: $uni-border-radius-lg;
      transition: width 0.3s ease;
    }
  }
  .progress-text {
    font-size: $uni-font-size-base;
    color: $uni-text-color;
    text-align: center;
    margin-top: $uni-spacing-col-base;
    display: block;
    .highlight {
      // 使用 $uni-color-warning
      color: $uni-color-warning;
      font-weight: bold;
    }
    &.success {
      color: $uni-color-primary;
    }
  }
}

.scroll-view-container {
  flex: 1;
  overflow-y: auto;
  padding: $uni-spacing-col-lg $uni-spacing-row-lg;
  box-sizing: border-box;
}

.cart-item {
  background-color: $uni-bg-color;
  border-radius: $uni-border-radius-lg;
  padding: $uni-spacing-row-lg;
  margin-bottom: $uni-spacing-col-lg;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  position: relative;

  .item-main {
    display: flex;
  }

  .item-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: $uni-border-radius-base;
    margin-right: $uni-spacing-row-base;
    flex-shrink: 0;
    background-color: $uni-bg-color-grey;
    cursor: pointer;
  }

  .item-content-wrapper {
    flex: 1;
  }

  .item-info {
    padding-right: 40rpx;
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

  .purchase-type-selector {
    margin-top: $uni-spacing-col-lg;
    .type-option {
      display: flex;
      align-items: center;
      padding: $uni-spacing-col-sm 0;
      font-size: $uni-font-size-sm;
      .radio-circle {
        width: 16px;
        height: 16px;
        border-radius: $uni-border-radius-circle;
        border: 1px solid $uni-border-color;
        margin-right: $uni-spacing-row-base;
        position: relative;
      }
      .save-highlight {
        color: $uni-color-error;
        font-weight: bold;
        margin-left: $uni-spacing-row-sm;
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
            width: 8px;
            height: 8px;
            border-radius: $uni-border-radius-circle;
            background-color: $uni-color-primary;
          }
        }
      }
    }
  }

  .item-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 50rpx;
  }

  .quantity-stepper {
    display: flex;
    align-items: center;
    border: 1px solid $uni-border-color;
    border-radius: 30rpx;
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

  .price-info {
    text-align: right;
    .current-price {
      font-size: 32rpx;
      font-weight: bold;
      color: $uni-color-primary;
    }
    .original-price {
      font-size: 24rpx;
      color: $uni-text-color-grey;
      text-decoration: line-through;
      display: block;
    }
  }
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  color: $uni-text-color-grey;
  .empty-icon {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: $uni-spacing-col-lg;
  }
  .go-shopping-btn {
    margin-top: $uni-spacing-col-lg;
    background-color: $uni-color-primary;
    color: $uni-text-color-inverse;
    border-radius: 40rpx;
    padding: 0 60rpx;
    height: 80rpx;
    line-height: 80rpx;
    font-size: $uni-font-size-base;
  }
}

.cart-footer {
  display: flex;
  flex-direction: column-reverse;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: $uni-bg-color;
  padding: $uni-spacing-col-base $uni-spacing-row-lg;
  padding-bottom: calc($uni-spacing-col-base + constant(safe-area-inset-bottom));
  padding-bottom: calc($uni-spacing-col-base + env(safe-area-inset-bottom));
  border-top: 1px solid $uni-border-color;
  z-index: 99;

  .subtotal-info {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-top: $uni-spacing-col-base;
    .subtotal-label {
      font-size: $uni-font-size-base;
      color: $uni-text-color;
    }
    .subtotal-price {
      display: flex;
      align-items: center;
      .final-price {
        font-size: 40rpx;
        font-weight: bold;
        color: $uni-text-color;
        margin-right: $uni-spacing-row-sm;
      }
      .original-total {
        font-size: $uni-font-size-sm;
        color: $uni-text-color-grey;
      }
    }
  }
  .checkout-button {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    background-color: $uni-color-primary;
    color: $uni-text-color-inverse;
    border-radius: 44rpx;
    font-size: $uni-font-size-lg;
    font-weight: 500;
    text-align: center;
    padding: 0;
    margin: 0;
    &:after {
      display: none;
    }
  }
}
</style>
