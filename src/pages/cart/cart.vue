<template>
  <view class="cart-page">
    <view class="loading-overlay" v-if="isLoading">
      <uni-load-more status="loading" :showText="false"></uni-load-more>
    </view>
    <CustomNavigationBar title="购物车"></CustomNavigationBar>

    <scroll-view scroll-y class="scroll-view-container">
      <CartItemCard
        v-for="item in cartData.items"
        :key="item.id"
        :item="item"
        @setQuantity="handleSetQuantity"
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
      <view style="height: 220rpx"></view>
    </scroll-view>

    <view class="cart-footer" v-if="cartData.items.length > 0">
      <ShippingProgress
        :currentTotal="cartData.freeShippingEligibleAmount"
        :threshold="cartData.freeShippingThreshold"
        variant="compact"
      />
      <view class="subtotal-info">
        <view class="top-row">
          <text class="subtotal-label">合计:</text>
          <view class="price-row">
            <text class="final-price">¥{{ cartData.grandTotal.toFixed(2) }}</text>
            <text class="original-total" v-if="totalDiscount > 0">
              ¥{{ cartData.subtotal.toFixed(2) }}
            </text>
          </view>
        </view>
        <view class="bottom-row">
          <text class="details-link" @click="openDiscountDetails" v-if="totalDiscount > 0">
            明细
          </text>
        </view>
      </view>

      <button class="checkout-button" @click="handleCheckout">
        去结算 ({{ cartData.totalItemQuantity }})
      </button>
    </view>

    <uni-popup ref="discountPopup" type="bottom" background-color="#fff">
      <view class="discount-popup-content">
        <view class="popup-header">
          <text class="popup-title">费用明细</text>
          <text class="popup-close" @click="closeDiscountDetails">✕</text>
        </view>
        <scroll-view scroll-y class="popup-body">
          <view class="detail-row">
            <text>商品总价</text>
            <text>¥{{ cartData.subtotal.toFixed(2) }}</text>
          </view>
          <view
            class="detail-row"
            v-for="discount in cartData.discountDetails"
            :key="discount.promotionId"
          >
            <text>{{ discount.label }}</text>
            <text class="discount-amount">¥{{ discount.amount.toFixed(2) }}</text>
          </view>
        </scroll-view>
        <view class="popup-footer">
          <text>合计</text>
          <text class="final-price">¥{{ cartData.grandTotal.toFixed(2) }}</text>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { cartApi } from '@/api/cart'
import type { Cart } from '@/types/cart'
import type { Item } from '@/types/checkout'
// 导入 uni-popup 的类型，如果需要更严格的类型检查
// import type { UniPopup } from '@dcloudio/uni-ui'

// --- 默认购物车数据结构 ---
const defaultCart: Cart = {
  id: '',
  totalItemQuantity: 0,
  subtotal: 0,
  grandTotal: 0,
  shippingFee: 0,
  freeShippingThreshold: 50,
  freeShippingEligibleAmount: 0,
  discountDetails: [],
  items: [],
}

// --- 响应式数据 ---
const cartData = ref<Cart>(defaultCart)
const isLoading = ref(true)
// 弹窗 Ref (需求 3)
const discountPopup = ref<any>(null) // 使用 any 简化，或者使用 InstanceType<typeof UniPopup>

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

// --- 弹窗控制方法 (需求 3) ---
/** 打开优惠明细弹窗 */
const openDiscountDetails = () => {
  if (discountPopup.value) {
    discountPopup.value.open()
  }
}
/** 关闭优惠明细弹窗 */
const closeDiscountDetails = () => {
  if (discountPopup.value) {
    discountPopup.value.close()
  }
}

// --- API 方法 ---

/**
 * 获取购物车详情 (用于初始化和刷新)
 */
const fetchCartData = async () => {
  isLoading.value = true

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
    isLoading.value = false
  }
}

// 【新】处理所有数量更新的函数
const handleSetQuantity = async (payload: { item: Item; quantity: number }) => {
  const { item, quantity } = payload

  // 可以在这里添加前端的校验
  if (quantity > item.availableQuantity) {
    uni.showToast({ title: '已达到最大库存', icon: 'none' })
    return
  }
  if (quantity < 1) {
    // 理论上 QuantityInput 的 min=1 会阻止此情况，但双重保险
    return
  }

  isLoading.value = true
  try {
    // 调用同一个更新 API，但传入的是确切的 `quantity` 值
    const res = await cartApi.updateItem(item.sku.skuId as string, { quantity: quantity })
    if (res && res.result) {
      cartData.value = res.result
    }
  } catch (error) {
    console.error('更新数量失败', error)
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
      // 修复：} 和 finally 之间缺少空格 (原代码中的备注)
      isLoading.value = false
    }
  }
}

// --- 事件处理函数 (逻辑不变) ---

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
.cart-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: $uni-bg-color-grey;
}

.loading-overlay {
  position: fixed; /* 改为固定定位，使其脱离文档流，成为真正的“遮罩” */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7); /* 半透明背景 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000; /* 确保在最上层 */
}

/* Custom Nav Bar 样式 (如果 CustomNavigationBar 是全局组件则不需要) */
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

/* 页脚 (需求 1 & 2: 变小, 变更为 column 布局) */
.cart-footer {
  display: flex;
  flex-direction: column; // (需求 2: 更改)
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: $uni-bg-color;
  padding: $uni-spacing-col-sm $uni-spacing-row-lg; // (需求 1: 减小 padding)
  padding-bottom: calc($uni-spacing-col-sm + constant(safe-area-inset-bottom));
  padding-bottom: calc($uni-spacing-col-sm + env(safe-area-inset-bottom));
  border-top: 1px solid $uni-border-color;
  z-index: 99;

  /* 合计信息 (需求 3: 布局调整) */
  .subtotal-info {
    display: flex;
    flex-direction: column; // 更改为 column
    justify-content: center;
    margin-top: $uni-spacing-col-sm;
    margin-bottom: $uni-spacing-col-sm;

    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline; // (关键) 水平对齐 "合计" 和 "价格"
    }

    .bottom-row {
      display: flex;
      justify-content: flex-end; // "明细" 右对齐
    }

    .subtotal-label {
      font-size: 36rpx; // (新需求: 变大)
      font-weight: bold; // (新需求: 加粗以匹配价格)
      color: $uni-text-color;
    }

    /* .subtotal-price-wrapper 已被移除 */

    .price-row {
      display: flex;
      align-items: baseline;
    }

    .final-price {
      font-size: 36rpx;
      font-weight: bold;
      color: $uni-color-error;
      margin-right: $uni-spacing-row-sm;
    }
    .original-total {
      font-size: 24rpx;
      color: $uni-text-color-grey;
      text-decoration: line-through;
    }
    .details-link {
      font-size: $uni-font-size-sm;
      color: $uni-color-primary;
      margin-top: 4rpx;
      cursor: pointer;
    }
  }
  /* 结算按钮 (需求 1: 变小) */
  .checkout-button {
    width: 100%;
    height: 72rpx; // 变小
    line-height: 72rpx; // 变小
    background-color: $uni-color-primary;
    color: $uni-text-color-inverse;
    border-radius: 36rpx; // 变小
    font-size: $uni-font-size-base; // 变小
    font-weight: 500;
    text-align: center;
    padding: 0;
    margin: 0;
    &:after {
      display: none;
    }
  }
}

/* 优惠明细弹窗样式 (需求 3) */
.discount-popup-content {
  background-color: #fff;
  border-top-left-radius: 20rpx;
  border-top-right-radius: 20rpx;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);

  .popup-header {
    position: relative;
    text-align: center;
    padding: $uni-spacing-col-lg;
    border-bottom: 1px solid $uni-border-color;
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
    max-height: 50vh; // 大约半个屏幕
    padding: $uni-spacing-col-lg $uni-spacing-row-lg;
    box-sizing: border-box;
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: $uni-font-size-base;
      margin-bottom: $uni-spacing-col-base;
      &:last-child {
        margin-bottom: 0;
      }
      .discount-amount {
        color: $uni-color-error; // 优惠金额(负数)显示为红色
      }
    }
  }

  .popup-footer {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: $uni-spacing-col-lg $uni-spacing-row-lg;
    border-top: 1px solid $uni-border-color;
    font-size: $uni-font-size-lg;
    font-weight: 600;
    .final-price {
      font-size: 40rpx;
      color: $uni-color-error;
    }
  }
}
</style>
