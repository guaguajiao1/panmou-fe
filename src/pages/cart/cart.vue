<template>
  <view class="cart-page">
    <view class="loading-overlay" v-if="isLoading">
      <uni-load-more status="loading" :showText="false"></uni-load-more>
    </view>
    <CustomNavigationBar title="购物车"></CustomNavigationBar>

    <scroll-view
      scroll-y
      class="scroll-view-container"
      :refresher-enabled="true"
      @refresherrefresh="onRefresh"
      :refresher-triggered="isRefreshing"
    >
      <CartItemCard
        v-for="item in cartData.items"
        :key="item.id"
        :item="item"
        @increase="increaseQuantity"
        @decrease="decreaseQuantity"
        @delete="deleteItem"
        @toggle-purchase-type="handleTogglePurchaseType"
        @go-to-product-detail="goToProductDetail"
      />

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
          <text class="original-total" v-if="totalDiscount > 0">
            已省 ¥{{ totalDiscount.toFixed(2) }}
          </text>
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
const isLoading = ref(true)

// --- 计算属性 ---
/** 实际已节省的金额（subtotal - grandTotal） */
const totalDiscount = computed(() => {
  const discount = cartData.value.subtotal - cartData.value.grandTotal
  return discount > 0 ? discount : 0
})

/** 距离免运费门槛还差多少 */
const shippingDifference = computed(() =>
  Math.max(0, cartData.value.freeShippingThreshold - cartData.value.freeShippingEligibleAmount),
)

/** 免运费进度条百分比 */
const shippingProgress = computed(() => {
  const threshold = cartData.value.freeShippingThreshold
  const eligibleAmount = cartData.value.freeShippingEligibleAmount
  if (threshold <= 0) return 100
  const progress = (eligibleAmount / threshold) * 100
  return Math.min(progress, 100)
})

// --- API 方法 ---

/**
 * 获取购物车详情 (用于初始化和刷新)
 */
const fetchCartData = async () => {
  isLoading.value = true
  if (!isRefreshing.value) {
    // 仅在非刷新状态下显示加载提示
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
    isLoading.value = false
  }
}

const increaseQuantity = async (item: Item) => {
  if (item.quantity >= item.availableQuantity) {
    uni.showToast({ title: '已达到最大库存', icon: 'none' })
    return
  }
  isLoading.value = true
  try {
    const res = await cartApi.updateItem(item.sku.skuId as string, { quantity: item.quantity + 1 })
    if (res && res.result) {
      cartData.value = res.result
    }
  } catch (error) {
    console.error('增加数量失败', error)
  } finally {
    isLoading.value = false
  }
}

const decreaseQuantity = async (item: Item) => {
  isLoading.value = true
  try {
    const res = await cartApi.updateItem(item.sku.skuId as string, { quantity: item.quantity - 1 })
    if (res && res.result) {
      cartData.value = res.result
    }
  } catch (error) {
    console.error('减少数量失败', error)
  } finally {
    isLoading.value = false
  }
}

const deleteItem = async (item: Item) => {
  isLoading.value = true
  try {
    const res = await cartApi.removeItems({ skuIds: [item.sku.skuId as string] })
    // 直接使用 removeItems 的返回结果更新购物车
    if (res && res.result) {
      cartData.value = res.result
    }
  } catch (error) {
    console.error('删除失败', error)
  } finally {
    isLoading.value = false
  }
}

const togglePurchaseType = async (item: Item, type: 0 | 1) => {
  if (item.purchaseType !== type) {
    isLoading.value = true
    try {
      const res = await cartApi.updateItem(item.sku.skuId as string, { purchaseType: type })
      if (res && res.result) {
        cartData.value = res.result
      }
    } catch (error) {
      console.error('切换购买方式失败', error)
    } finally {
      // 修复：} 和 finally 之间缺少空格
      isLoading.value = false
    }
  }
}

// --- 事件处理函数 (逻辑不变) ---

const onRefresh = async () => {
  isRefreshing.value = true
  await fetchCartData()
}

/**
 * (公共)
 * 用于 @toggle-purchase-type 事件的包装器
 */
const handleTogglePurchaseType = (payload: { item: Item; type: 0 | 1 }) => {
  togglePurchaseType(payload.item, payload.type)
}

const handleCheckout = () => {
  console.log('去结算，Cart ID：', cartData.value.id)
}
const goToProductDetail = (id: string | number) => {
  console.log('查看商品详情：', id)
}
const goShopping = () => {
  console.log('去逛逛')
}

onMounted(() => {
  fetchCartData()
})
</script>

<style lang="scss" scoped>
/*
  父组件的样式表
  只包含页面布局、空状态 和 底部栏 的样式
  .cart-item 的样式已移至 CartItemCard.vue
*/

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
