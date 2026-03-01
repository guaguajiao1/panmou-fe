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
      :refresher-triggered="isRefresherTriggered"
      @refresherrefresh="onRefresherRefresh"
    >
      <view class="cart-item-row" v-for="item in cartData.items" :key="item.itemId">
        <!-- 复选框 -->
        <view class="checkbox-area" @click.stop="handleSelect(item)">
          <view class="checkbox" :class="{ checked: item.selected }"></view>
        </view>

        <ProductCard
          class="cart-product-card"
          v-bind="toProductCardProps(item)"
          @click="goToProductDetail(item.sku?.productId)"
        >
          <!-- 鲜食 sku.type===8: 自定义 + 删除, 无步进器 -->
          <template v-if="isFreshFood(item)">
            <view class="action-row">
              <button class="action-button" @click.stop="onCustomize(item)">自定义</button>
              <button class="delete-button" @click.stop="deleteItem(item)">删除</button>
            </view>
          </template>

          <!-- 普通商品: 订阅切换 + 步进器 + 删除 -->
          <template v-else>
            <view class="subscription-row" v-if="item.sku?.supportsSubscription">
              <view
                class="subscription-toggle"
                :class="{ active: item.purchaseType === 1 }"
                @click.stop="handleTogglePurchaseType(item)"
              >
                <view class="radio-circle"></view>
                <text class="toggle-text">订阅</text>
                <text
                  v-if="item.sku?.subscriptionDiscount && item.sku.subscriptionDiscount !== '0'"
                  class="subscription-discount-text"
                >
                  省 ¥{{ item.sku.subscriptionDiscount }}
                </text>
              </view>
            </view>

            <view class="stepper-row">
              <QuantityInput
                :modelValue="item.quantity"
                :min="1"
                :max="item.availableQuantity"
                @change="(e: InputNumberBoxEvent) => onQuantityChange(item, e)"
                :inputWidth="100"
                :inputHeight="50"
                :size="28"
              />
              <view class="card-actions">
                <button class="delete-button" @click.stop="deleteItem(item)">删除</button>
              </view>
            </view>
          </template>
        </ProductCard>
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
      <view class="footer-spacer"></view>
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
            <text class="final-price">¥{{ cartData.grandTotal }}</text>
            <text class="original-total" v-if="hasDiscount"> ¥{{ cartData.subtotal }} </text>
          </view>
        </view>
        <view class="bottom-row">
          <text class="details-link" @click="openDiscountDetails" v-if="hasDiscount"> 明细 </text>
        </view>
      </view>

      <button class="checkout-button" @click="handleCheckout">
        去结算 ({{ cartData.totalItemQuantity }})
      </button>
    </view>

    <uni-popup ref="discountPopup" type="bottom" background-color="#fff" :z-index="1001">
      <view class="discount-popup-content">
        <view class="popup-header">
          <text class="popup-title">金额明细</text>
          <text class="popup-close" @click="closeDiscountDetails">✕</text>
        </view>
        <scroll-view scroll-y class="popup-body">
          <!-- 已选商品缩略图区 -->
          <view class="selected-items-section" v-if="selectedItems.length > 0">
            <view class="items-grid">
              <view class="item-thumb-cell" v-for="item in visibleItems" :key="item.itemId">
                <view class="thumb-wrapper">
                  <image :src="item.sku?.image?.[0]" class="thumb-img" mode="aspectFill"></image>
                  <view class="thumb-check">✓</view>
                </view>
                <view class="thumb-price-row">
                  <text class="thumb-price">¥{{ item.finalPrice }}</text>
                  <text class="thumb-qty">x{{ item.quantity }}</text>
                </view>
              </view>
            </view>
            <view class="items-toggle" @click="itemsExpanded = !itemsExpanded">
              <text>已选 {{ selectedItems.length }} 件商品</text>
              <text class="toggle-arrow">{{ itemsExpanded ? '∧' : '∨' }}</text>
            </view>
          </view>

          <!-- 费用明细区 -->
          <view class="detail-card">
            <view class="detail-row">
              <text class="detail-label bold">商品总价</text>
              <text class="detail-amount">¥{{ cartData.subtotal }}</text>
            </view>
            <view class="detail-row" v-if="hasDiscount">
              <text class="detail-label bold">共减</text>
              <text class="detail-amount discount">-¥{{ cartData.totalDiscount }}</text>
            </view>
            <view
              class="detail-row indent"
              v-for="discount in cartData.discountDetails"
              :key="discount.promotionId"
            >
              <text class="detail-label">{{ discount.label }}</text>
              <text class="detail-amount discount"
                >-¥{{ Math.abs(parseFloat(discount.amount)).toFixed(2) }}</text
              >
            </view>
          </view>
        </scroll-view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { cartApi } from '@/api/cart'
import { checkoutApi } from '@/api/checkout'
import type { Cart, CartItem } from '@/types/cart'
import type { ProductCardProps } from '@/types/product'
import type { InputNumberBoxEvent } from '@/components/QuantityInput/QuantityInput.d.ts'
import ProductCard from '@/components/ProductCard/ProductCard.vue'
import { onShow } from '@dcloudio/uni-app'

// --- 默认购物车数据结构 ---
const defaultCart: Cart = {
  uid: '',
  cartId: '',
  totalItemQuantity: 0,
  subtotal: '0.00',
  grandTotal: '0.00',
  shippingFee: '0.00',
  freeShippingThreshold: '0.00',
  freeShippingEligibleAmount: '0.00',
  totalDiscount: '0.00',
  discountDetails: [],
  items: [],
}

// --- 响应式数据 ---
const cartData = ref<Cart>(defaultCart)
const isLoading = ref(true)
const isRefresherTriggered = ref(false)
const discountPopup = ref<any>(null)
const itemsExpanded = ref(false)

/** 已选商品列表 */
const selectedItems = computed(() => cartData.value.items.filter((item: CartItem) => item.selected))
/** 可见商品列表（折叠时最多4个） */
const visibleItems = computed(() => {
  if (itemsExpanded.value) return selectedItems.value
  return selectedItems.value.slice(0, 4)
})

// --- 辅助方法 ---

/** 判断鲜食商品 */
const isFreshFood = (item: CartItem) => item.sku?.type === 8

/** CartItem → ProductCardProps 映射（纯展示，不做价格计算） */
const toProductCardProps = (item: CartItem): ProductCardProps => {
  const s = item.sku
  const showOriginal =
    item.originalPrice && item.originalPrice !== item.finalPrice ? item.originalPrice : undefined

  // totalDiscount: 直接使用 item.totalItemDiscount
  const totalDiscount =
    item.totalItemDiscount && item.totalItemDiscount !== '0' && item.totalItemDiscount !== '0.00'
      ? `-¥${item.totalItemDiscount}`
      : undefined

  return {
    itemId: item.itemId,
    image: s?.image?.[0] ?? '',
    name: s?.name ?? '',
    specs: s?.specs,
    finalPrice: item.finalPrice ?? '',
    originalPrice: showOriginal,
    quantity: item.quantity || 1,
    totalPrice: item.totalItemPrice,
    totalDiscount,
    discountDetails: item.discountDetails?.length > 0 ? item.discountDetails : undefined,
  }
}

// --- 计算属性 ---
/** 是否有优惠（纯展示判断，不做计算） */
const hasDiscount = computed(() => {
  const d = cartData.value.totalDiscount
  return !!d && d !== '0' && d !== '0.00'
})

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
 * @param quiet 是否静默加载（不显示全局 loading）
 */
const fetchCartData = async (quiet = false) => {
  if (!quiet) isLoading.value = true

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
    isRefresherTriggered.value = false
  }
}

/** 下拉刷新回调 */
const onRefresherRefresh = () => {
  isRefresherTriggered.value = true
  fetchCartData(true)
}

/** 数量变更 */
const onQuantityChange = async (item: CartItem, event: InputNumberBoxEvent) => {
  const quantity = event.value
  if (quantity > item.availableQuantity) {
    uni.showToast({ title: '已达到最大库存喽', icon: 'none' })
    return
  }
  if (quantity < 1) return

  isLoading.value = true
  try {
    const res = await cartApi.updateItem(cartData.value.cartId, item.itemId, { quantity })
    if (res && res.result) {
      cartData.value = res.result
    }
  } catch (error) {
    console.error('更新数量失败', error)
  } finally {
    isLoading.value = false
  }
}

const deleteItem = async (item: CartItem) => {
  isLoading.value = true
  try {
    const res = await cartApi.removeItems(cartData.value.cartId, [item.itemId])
    if (res && res.result) {
      cartData.value = res.result
    }
  } catch (error) {
    console.error('删除失败', error)
  } finally {
    isLoading.value = false
  }
}

/** 切换购买方式（一次性 / 订阅） */
const handleTogglePurchaseType = async (item: CartItem) => {
  const newType = item.purchaseType === 1 ? 0 : 1
  if (item.purchaseType !== newType) {
    isLoading.value = true
    try {
      const res = await cartApi.updateItem(cartData.value.cartId, item.itemId, {
        purchaseType: newType,
      })
      if (res && res.result) {
        cartData.value = res.result
      }
    } catch (error) {
      console.error('切换购买方式失败', error)
    } finally {
      isLoading.value = false
    }
  }
}

/** 切换商品选中状态 */
const handleSelect = async (item: CartItem) => {
  isLoading.value = true
  try {
    const res = await cartApi.updateItem(cartData.value.cartId, item.itemId, {
      selected: !item.selected,
    })
    if (res && res.result) {
      cartData.value = res.result
    }
  } catch (error) {
    console.error('切换选中状态失败', error)
  } finally {
    isLoading.value = false
  }
}

const handleCheckout = async () => {
  const selectedItems = cartData.value.items.filter((item: CartItem) => item.selected)
  if (selectedItems.length === 0) {
    uni.showToast({ title: '请选择商品', icon: 'none' })
    return
  }
  uni.showLoading({ title: '正在结算...' })
  try {
    const res = await checkoutApi.entryCart()
    if (res?.code === '0' && res.result?.previewId) {
      uni.navigateTo({ url: `/orderPages/checkout/checkout?previewId=${res.result.previewId}` })
    } else {
      uni.showToast({ title: '结算失败', icon: 'none' })
    }
  } catch {
    uni.showToast({ title: '结算失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const goToProductDetail = (id?: string | number) => {
  if (id) uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

const onCustomize = (item: CartItem) => {
  console.log('自定义商品', item.itemId)
}

const goShopping = () => {
  console.log('去逛逛')
}

onShow(() => {
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.scroll-view-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  box-sizing: border-box;
}

/* 底部占位：与 footer 等高，防止最后一个商品被遮挡 */
.footer-spacer {
  height: 360rpx;
}

/* 商品行: 复选框 + ProductCard */
.cart-item-row {
  display: flex;
  align-items: flex-start;
  background-color: #fff;
  margin-bottom: $uni-spacing-col-base;
}

/* 覆写 ProductCard 样式：全宽无侧边框 */
.cart-product-card {
  flex: 1;
  min-width: 0;

  :deep(.product-card) {
    border-radius: 0;
    box-shadow: none;
    margin-bottom: 0;
    padding-left: 0;
    padding-right: $uni-spacing-row-lg;
  }
}

/* 复选框 */
.checkbox-area {
  display: flex;
  align-items: center;
  padding-left: $uni-spacing-row-lg;
  padding-right: 16rpx;
  padding-top: 100rpx;
  flex-shrink: 0;

  .checkbox {
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    border: 3rpx solid #ccc;
    position: relative;
    transition: all 0.2s;

    &.checked {
      background-color: $uni-color-primary;
      border-color: $uni-color-primary;

      &::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #fff;
        font-size: 24rpx;
        font-weight: bold;
      }
    }
  }
}

/* 订阅行 */
.subscription-row {
  margin-top: $uni-spacing-col-sm;
  padding-top: $uni-spacing-col-sm;
  display: flex;
  align-items: center;
  min-height: 50rpx;
}

.subscription-toggle {
  display: flex;
  align-items: center;
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  cursor: pointer;
  padding: 10rpx 0;

  .radio-circle {
    width: 32rpx;
    height: 32rpx;
    border-radius: 50%;
    border: 2rpx solid $uni-border-color;
    margin-right: 12rpx;
    position: relative;
    box-sizing: border-box;
  }

  &.active {
    .radio-circle {
      border-color: $uni-color-primary;
      background-color: $uni-color-primary;

      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 12rpx;
        height: 12rpx;
        background-color: #fff;
        border-radius: 50%;
      }
    }
  }

  .toggle-text {
    font-weight: 500;
  }

  .subscription-discount-text {
    margin-left: 16rpx;
    color: $uni-color-error;
    font-size: 24rpx;
    font-weight: 500;
  }
}

/* 步进器行 */
.stepper-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rpx;
}

.card-actions {
  display: flex;
  align-items: center;
}

/* 鲜食操作行 */
.action-row {
  display: flex;
  align-items: center;
  margin-top: 30rpx;
  gap: 20rpx;
}

.action-button {
  font-size: 28rpx;
  color: $uni-color-primary;
  background-color: #fff;
  border: 1rpx solid $uni-color-primary;
  border-radius: 32rpx;
  padding: 0;
  width: 200rpx;
  height: 64rpx;
  line-height: 62rpx;
  text-align: center;

  &::after {
    border: none;
  }
}

.delete-button {
  font-size: 28rpx;
  color: $uni-color-primary;
  background-color: #fff;
  border: 1rpx solid $uni-color-primary;
  border-radius: 32rpx;
  padding: 0;
  width: 200rpx;
  height: 64rpx;
  line-height: 62rpx;
  margin-left: 20rpx;
  text-align: center;

  &::after {
    border: none;
  }
}

/* 空购物车 */
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

/* 页脚 */
.cart-footer {
  display: flex;
  flex-direction: column;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: $uni-bg-color;
  padding: $uni-spacing-col-sm $uni-spacing-row-lg;
  padding-bottom: calc($uni-spacing-col-sm + constant(safe-area-inset-bottom));
  padding-bottom: calc($uni-spacing-col-sm + env(safe-area-inset-bottom));
  border-top: 1px solid $uni-border-color;
  z-index: 99;

  .subtotal-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-top: $uni-spacing-col-sm;
    margin-bottom: $uni-spacing-col-sm;

    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .bottom-row {
      display: flex;
      justify-content: flex-end;
    }

    .subtotal-label {
      font-size: 36rpx;
      font-weight: bold;
      color: $uni-text-color;
    }

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

  .checkout-button {
    width: 100%;
    height: 72rpx;
    line-height: 72rpx;
    background-color: $uni-color-primary;
    color: $uni-text-color-inverse;
    border-radius: 36rpx;
    font-size: $uni-font-size-base;
    font-weight: 500;
    text-align: center;
    padding: 0;
    margin: 0;
    &:after {
      display: none;
    }
  }
}

/* 金额明细弹窗样式 */
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

/* 已选商品缩略图区 */
.selected-items-section {
  padding: $uni-spacing-col-lg 0;
  border-bottom: 1px solid $uni-border-color;
}

.items-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.item-thumb-cell {
  width: calc(25% - 12rpx);
  display: flex;
  flex-direction: column;
  align-items: center;

  .thumb-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    border-radius: 8rpx;
    overflow: hidden;
    background-color: #f5f5f5;

    .thumb-img {
      width: 100%;
      height: 100%;
    }

    .thumb-check {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 36rpx;
      height: 36rpx;
      line-height: 36rpx;
      text-align: center;
      background-color: $uni-color-error;
      color: #fff;
      font-size: 20rpx;
      border-top-left-radius: 8rpx;
    }
  }

  .thumb-price-row {
    display: flex;
    align-items: baseline;
    margin-top: 8rpx;
    width: 100%;
    justify-content: center;
    gap: 4rpx;

    .thumb-price {
      font-size: 24rpx;
      font-weight: bold;
      color: $uni-text-color;
    }

    .thumb-qty {
      font-size: 20rpx;
      color: $uni-text-color-grey;
    }
  }
}

.items-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $uni-spacing-col-base 0 0;
  font-size: $uni-font-size-sm;
  color: $uni-text-color-grey;
  cursor: pointer;

  .toggle-arrow {
    margin-left: 8rpx;
    font-size: 24rpx;
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
