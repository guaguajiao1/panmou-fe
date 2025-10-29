<template>
  <view class="place-order-page">
    <view class="loading-overlay" v-if="isLoading">
      <uni-load-more status="loading" :showText="false"></uni-load-more>
    </view>
    <CustomNavigationBar title="确认订单"></CustomNavigationBar>

    <scroll-view scroll-y class="scroll-view-container">
      <view class="address-section-wrapper">
        <template v-if="!orderPreview.shippingAddress">
          <AddressForm :saveText="'使用这个地址'" @save="onAddressFormSave" />
        </template>
        <template v-else>
          <view
            class="section-card address-section"
            @click="goToAddressManagement(orderPreview.shippingAddress.id)"
          >
            <view class="address-display">
              <view class="address-info">
                <view class="address-line-1">
                  <text class="name">{{ orderPreview.shippingAddress.receiver }}</text>
                  <text class="phone">{{ orderPreview.shippingAddress.contact }}</text>
                </view>
                <view class="address-line-2">
                  <text class="default-tag" v-if="orderPreview.shippingAddress.isDefault">
                    默认
                  </text>
                  <text>
                    {{ orderPreview.shippingAddress.fullLocation }}
                    {{ orderPreview.shippingAddress.address }}</text
                  >
                </view>
              </view>
              <uni-icons type="right" size="18" color="#999"></uni-icons>
            </view>
          </view>
        </template>
      </view>

      <view class="subscription-toggle-section" v-if="hasEligibleSubscriptionItems">
        <view class="promo-header">
          <text>{{
            orderPreview.recommendSubscriptions
              ? '开启您的首次订阅订单，符合条件的商品最高可省'
              : '开启订阅，符合条件商品优惠。'
          }}</text>
          <text class="promo-highlight">
            {{ orderPreview.subscriptionDiscount.subscriptionDiscountRate }}% (¥{{
              orderPreview.subscriptionDiscount.subscriptionDiscount
            }})
          </text>
          <text class="more-info">更多信息</text>
        </view>

        <view
          class="subscription-option"
          :class="{ active: isSubscribing }"
          @click="toggleGlobalSubscription(true)"
        >
          <view class="radio-circle-lg"><view class="radio-dot"></view></view>
          <view class="option-content">
            <text class="option-title">是，让我的生活更轻松</text>
            <view class="option-details">
              <text class="save-amount">
                此订单您将额外节省 ¥{{ orderPreview.subscriptionDiscount.subscriptionDiscount }}
              </text>
              <SubscriptionFrequencyPicker
                v-model="selectedFreqObj"
                :recommend-subscriptions="orderPreview.recommendSubscriptions"
                @update:modelValue="onFrequencyChange"
              />
              <text class="change-tip">您可以随时轻松地更改、取消或重新安排配送。</text>
              <scroll-view scroll-x class="subscribed-items-scroll">
                <view
                  class="item-image-wrapper"
                  v-for="item in subscriptionImageItems"
                  :key="item.id"
                >
                  <image :src="item.sku.image" class="item-image-sm"></image>
                </view>
              </scroll-view>
              <text class="promo-terms">
                订阅促销最高可省 ¥20。仅限支持订阅的商品。部分商品除外。限时优惠。
              </text>
            </view>
          </view>
        </view>

        <view
          class="subscription-option"
          :class="{ active: !isSubscribing }"
          @click="toggleGlobalSubscription(false)"
        >
          <view class="radio-circle-lg"><view class="radio-dot"></view></view>
          <view class="option-content">
            <text class="option-title">不，谢谢</text>
            <text class="option-desc">您将只购买一次这些商品。</text>
          </view>
        </view>
      </view>

      <view class="section-card product-list-section">
        <view class="section-title">您的商品</view>
        <CartItemCard
          v-for="item in orderPreview.items"
          :key="item.id"
          :item="item"
          @setQuantity="handleSetQuantity"
          @delete="deleteItem"
          @toggle-purchase-type="handleTogglePurchaseType"
          @go-to-product-detail="goToProductDetail"
        />
      </view>

      <view class="section-card payment-section">
        <text class="label">支付方式</text>
        <view class="payment-method">
          <image
            src="https://placehold.co/24x24/07c160/ffffff?text=W"
            class="wechat-icon"
            mode="aspectFit"
          ></image>
          <text>微信支付</text>
        </view>
      </view>

      <view class="section-card summary-section">
        <view class="summary-row">
          <text class="label">商品金额</text>
          <text class="value">¥{{ orderPreview.subtotal }}</text>
        </view>
        <view class="summary-row">
          <text class="label">运费</text>
          <text class="value">¥{{ orderPreview.shippingFee }}</text>
        </view>
        <view v-for="(d, idx) in orderPreview.discountDetails || []" :key="idx" class="summary-row">
          <text class="label">{{ d.label }}</text>
          <text class="value discount-value">- ¥{{ d.amount }}</text>
        </view>

        <view class="summary-divider"></view>
        <view class="summary-row total-row">
          <text class="label">合计</text>
          <text class="value total-value">¥{{ orderPreview.grandTotal }}</text>
        </view>
      </view>

      <view class="disclaimer-section">
        <text
          >点击“立即支付”，即表示您同意我们的服务条款和隐私政策。如果您的订单包含订阅商品，您将授权我们定期向您的账户收费，直到您取消订阅为止。</text
        >
      </view>
    </scroll-view>

    <view class="footer">
      <button class="place-order-button" @click="placeOrder" :disabled="isSubmitting">
        {{ paymentButtonText }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import AddressForm from '@/components/AddressForm/AddressForm.vue'
import SubscriptionFrequencyPicker from '@/components/SubscriptionFrequencyPicker/SubscriptionFrequencyPicker.vue'
import { useAddressStore } from '@/stores/modules/address'
import { checkoutApi } from '@/api/checkout'
import { addressApi } from '@/api/address'
import type { OrderPreview, SubscriptionFrequency, UpdatePreviewParams } from '@/types/checkout'
import type { AddressParams, AddressItem } from '@/types/address'
import type { Item } from '@/types/checkout'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'

onPullDownRefresh(() => {
  uni.stopPullDownRefresh()
})
onReachBottom(() => {})
const themeColor = '#2c6fdb'
const isLoading = ref(true)
const isSubmitting = ref(false)
const addressStore = useAddressStore()

const previewId = ref<string>('')

const orderPreview = ref<OrderPreview>({
  totalItemQuantity: 0,
  subtotal: 0,
  grandTotal: 0,
  shippingFee: 0,
  freeShippingThreshold: 0,
  freeShippingEligibleAmount: 0,
  discountDetails: [],
  shippingAddress: undefined,
  recommendSubscriptions: [],
  items: [],
  id: '',
  subscriptionDiscount: {
    subscriptionDiscountRate: 0,
    subscriptionDiscount: 0,
    firstSubscription: false,
  },
})

const selectedFreqObj = ref<SubscriptionFrequency | null>(null)

const isSubscribing = computed(() =>
  orderPreview.value.items.some((item: Item) => item.purchaseType === 1),
)

const hasEligibleSubscriptionItems = computed(() =>
  orderPreview.value.items.some((item: Item) => item.sku?.supportSubscription),
)

const subscriptionImageItems = computed(() => {
  if (isSubscribing.value) {
    return orderPreview.value.items.filter((i: Item) => i.purchaseType === 1)
  }
  return orderPreview.value.items.filter((i: Item) => i.sku?.supportSubscription)
})

const paymentButtonText = computed(() => {
  if (isSubmitting.value) return '处理中...'
  const total = orderPreview.value.grandTotal ?? 0
  console.log('Computed paymentButtonText, total=', total)
  return `立即支付 ¥${total}`
})

// Watch for address changes from the store (updated by address list page)
watch(
  () => addressStore.selectedAddress,
  (newAddress) => {
    if (!newAddress) {
      updateAddressOnServer('')
    } else if (newAddress && newAddress.id !== orderPreview.value.shippingAddress?.id) {
      // orderPreview.value.shippingAddress = newAddress
      updateAddressOnServer(newAddress.id)
      console.log('Address store changed, updating server preview.')
    }
  },
  { deep: true },
)

// ----------------- API interactions -----------------
const loadPreview = async () => {
  isLoading.value = true
  try {
    // **Requirement 4**: Ensure previewId exists. Fallback to entryCart if not from URL.
    if (!previewId.value) {
      const entryRes = await checkoutApi.entryCart()
      if (entryRes && entryRes.code === '0') previewId.value = (entryRes.result as any).previewId
    }
    if (!previewId.value) throw new Error('no previewId')

    const res = await checkoutApi.getPreview(previewId.value)
    if (res && res.code === '0') {
      orderPreview.value = res.result
      // Set the selected address in the store for consistency
      if (res.result.shippingAddress) {
        addressStore.changeSelectedAddress(res.result.shippingAddress)
      }
    } else {
      uni.showToast({ title: '数据加载失败', icon: 'none' })
    }
  } catch (e) {
    console.warn('loadPreview error', e)
    uni.showToast({ title: '数据加载失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

const updateItem = async (item: { itemId: string; quantity: number; purchaseType: 0 | 1 }) => {
  if (!previewId.value) await loadPreview()
  if (!previewId.value) return
  const params: UpdatePreviewParams = {
    updateField: 'ITEM',
    itemLevelSelection: item,
  }
  isLoading.value = true
  try {
    const res = await checkoutApi.updatePreview(previewId.value, params)
    if (res && res.code === '0') orderPreview.value = res.result
    console.log('updateItem orderPreview.value === res.result ?', orderPreview.value === res.result)
  } catch (e) {
    console.warn('updateItem error', e)
  } finally {
    isLoading.value = false
    console.log('updateItem completed orderPreview=', orderPreview.value)
  }
}

const deleteItem = async (item: Item) => {
  try {
    // Reuse updateItem with quantity 0 to delete
  } catch (error) {
    console.error('删除失败', error)
  }
}

const updateGlobalSubscription = async (subscribe: boolean) => {
  if (!previewId.value) await loadPreview()
  if (!previewId.value || !selectedFreqObj.value) return

  const params: UpdatePreviewParams = {
    updateField: 'GLOBALSUBSCRIPTION',
    globalSubscription: {
      subscribe,
      fulfillmentSchedule: selectedFreqObj.value,
    },
  }
  isLoading.value = true
  try {
    const res = await checkoutApi.updatePreview(previewId.value, params)
    console.log('vue orderPreview before update=', orderPreview.value)
    console.log('updateGlobalSubscription response=', res)

    if (res && res.code === '0') orderPreview.value = res.result
    console.log(
      'updateGlobalSubscription orderPreview.value === res.result ?',
      orderPreview.value === res.result,
    )

    console.log('vue orderPreview after update=', orderPreview.value)
  } catch (e) {
    console.warn('vue updateGlobalSubscription error', e)
  } finally {
    isLoading.value = false
  }
}

const updateAddressOnServer = async (addressId: string | number) => {
  if (!previewId.value) await loadPreview()
  if (!previewId.value) return
  const params: any = { updateField: 'ADDRESS', addressId }
  isLoading.value = true
  try {
    const res = await checkoutApi.updatePreview(previewId.value, params)
    console.log('updateAddressOnServer response=', res)
    if (res && res.code === '0') orderPreview.value = res.result
  } catch (e) {
    console.warn('updateAddressOnServer error', e)
  } finally {
    isLoading.value = false
  }
}

const placeOrder = async () => {
  if (!orderPreview.value.shippingAddress) {
    uni.showToast({ title: '请先创建收货地址', icon: 'none' })
    return
  }
  if (!previewId.value) await loadPreview()
  isSubmitting.value = true
  try {
    const res = await checkoutApi.placeOrder(previewId.value)
    if (res && res.code === '0') {
      uni.showToast({ title: '下单成功', icon: 'success' })
      uni.redirectTo({ url: '/pages/order/success' })
    } else {
      uni.showToast({ title: res?.msg || '下单失败', icon: 'none' })
    }
  } catch (e) {
    console.warn('placeOrder error', e)
    uni.showToast({ title: '下单失败', icon: 'none' })
  } finally {
    isSubmitting.value = false
  }
}

const handleSetQuantity = (payload: { item: Item; quantity: number }) => {
  const { item, quantity } = payload
  updateItem({
    itemId: item.id,
    quantity: quantity,
    purchaseType: item.purchaseType,
  })
}
const toggleGlobalSubscription = (subscribe: boolean) => {
  updateGlobalSubscription(subscribe)
}

const handleTogglePurchaseType = (payload: { item: Item; type: 0 | 1 }) => {
  togglePurchaseType(payload.item, payload.type)
}

const togglePurchaseType = (item: Item, type: 0 | 1) => {
  if (item.purchaseType !== type) {
    updateItem({
      itemId: item.id,
      quantity: item.quantity,
      purchaseType: type,
    })
  }
}

const onFrequencyChange = () => {
  updateGlobalSubscription(true)
}

const onAddressFormSave = async (formData: AddressItem) => {
  uni.showLoading({ title: '保存地址...' })
  try {
    const res = await addressApi.create(formData)
    if (res && res.code === '0') {
      const created = res.result as AddressItem
      // Update the address store, which will trigger the watcher to update the server
      addressStore.changeSelectedAddress(created)
      uni.hideLoading()
      uni.showToast({ title: '已使用新地址', icon: 'success' })
    } else {
      uni.hideLoading()
      uni.showToast({ title: res?.msg || '保存失败', icon: 'none' })
    }
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '保存失败', icon: 'none' })
    console.warn('onAddressFormSave error', e)
  }
}

const goToAddressManagement = (id: string) => {
  console.log('Navigating to address management with id=', id)
  uni.navigateTo({ url: `/pages/account/address_list/address_list?source=checkout&id=${id}` })
}

const goToProductDetail = (item: Item) =>
  uni.navigateTo({ url: `/pages/product/detail?id=${item.id || item.sku?.productId}` })

onLoad((options) => {
  if (options && options.previewId) {
    previewId.value = options.previewId
  }
  loadPreview()
})

// While the watcher is good, onShow is a reliable way to catch changes
// if the user uses system back buttons.
onShow(() => {
  // This ensures that if the selected address in the store is different from
  // what's displayed, it gets synced.
  if (
    addressStore.selectedAddress &&
    orderPreview.value.shippingAddress?.id !== addressStore.selectedAddress.id
  ) {
    console.log('Address changed detected onShow, syncing.')
    orderPreview.value.shippingAddress = addressStore.selectedAddress
    updateAddressOnServer(addressStore.selectedAddress.id)
  }
})
</script>

<style lang="scss" scoped>
.address-section-wrapper {
  margin-bottom: 20rpx;
}

.place-order-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
}
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.custom-nav-bar {
  background-color: $uni-bg-color;
  text-align: center;
  padding: $uni-spacing-col-base;
  padding-top: calc(var(--status-bar-height) + #{$uni-spacing-col-base});
  border-bottom: 1px solid #eee;

  .close-icon {
    position: absolute;
    left: $uni-spacing-row-lg;
    top: 50%;
    transform: translateY(-50%);
    padding-top: var(--status-bar-height);
    font-size: 48rpx;
    font-weight: 300;
    color: $uni-color-primary;
  }

  .title {
    font-size: $uni-font-size-lg;
    font-weight: bold;
  }
}
.scroll-view-container {
  flex: 1;
  padding: $uni-spacing-col-lg;
  box-sizing: border-box;
  padding-bottom: 160rpx;
}
.section-card {
  background-color: $uni-bg-color;
  border-radius: $uni-border-radius-lg;
  padding: $uni-spacing-col-lg $uni-spacing-row-lg;
  margin-bottom: $uni-spacing-col-lg;
}
.section-title {
  font-size: $uni-font-size-lg;
  font-weight: bold;
  margin-bottom: $uni-spacing-col-lg;
}
.address-section {
  .address-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .address-info {
      flex: 1;
      .address-line-1 {
        .name {
          font-size: $uni-font-size-lg;
          font-weight: bold;
          margin-right: 20rpx;
        }
        .phone {
          font-size: $uni-font-size-lg;
          font-weight: bold;
        }
      }
      .address-line-2 {
        display: flex;
        align-items: center;
        margin-top: 8rpx;
        font-size: $uni-font-size-sm;
        .default-tag {
          background-color: mix($uni-color-primary, $uni-bg-color, 10%);
          color: $uni-color-primary;
          padding: 2rpx 10rpx;
          border-radius: $uni-border-radius-sm;
          margin-right: 12rpx;
        }
      }
    }
  }
}

/* 全新订阅区样式 */
.subscription-toggle-section {
  background-color: $uni-bg-color;
  border-radius: $uni-border-radius-lg;
  padding: $uni-spacing-col-lg $uni-spacing-row-lg;
  margin-bottom: $uni-spacing-col-lg;
  .promo-header {
    font-size: 32rpx;
    font-weight: bold;
    line-height: 1.5;
    margin-bottom: $uni-spacing-col-lg;
    .promo-highlight {
      color: v-bind(themeColor);
    }
    .more-info {
      font-size: $uni-font-size-sm;
      color: $uni-text-color-grey;
      text-decoration: underline;
      margin-left: 10rpx;
    }
  }
  .subscription-option {
    display: flex;
    padding: $uni-spacing-col-lg;
    border: 1px solid $uni-border-color;
    border-radius: $uni-border-radius-base;
    margin-bottom: $uni-spacing-col-base;
    transition: all 0.2s ease-in-out;
    &.active {
      border-color: v-bind(themeColor);
      background-color: #f0f6ff;
      .radio-dot {
        opacity: 1;
      }
    }
    .radio-circle-lg {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid $uni-border-color;
      margin-right: $uni-spacing-row-lg;
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: border-color 0.2s;
    }
    &.active .radio-circle-lg {
      border-color: v-bind(themeColor);
    }
    .radio-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: v-bind(themeColor);
      opacity: 0;
      transition: opacity 0.2s;
    }
    .option-content {
      flex: 1;
      .option-title {
        font-size: $uni-font-size-base;
        font-weight: 500;
        display: block;
      }
      .option-desc {
        font-size: $uni-font-size-sm;
        color: $uni-text-color-grey;
        margin-top: 4rpx;
      }
      .option-details {
        margin-top: $uni-spacing-col-base;
        .save-amount {
          font-size: $uni-font-size-base;
          color: #e54d42;
          font-weight: bold;
          display: block;
          margin-bottom: $uni-spacing-col-lg;
        }
        .change-tip {
          display: block;
          font-size: $uni-font-size-sm;
          color: $uni-text-color-grey;
          margin-top: $uni-spacing-col-base;
        }
        .subscribed-items-scroll {
          white-space: nowrap;
          margin-top: $uni-spacing-col-lg;
          .item-image-wrapper {
            display: inline-block;
            margin-right: $uni-spacing-row-base;
            .item-image-sm {
              width: 100rpx;
              height: 100rpx;
              border-radius: $uni-border-radius-base;
              border: 1px solid #eee;
            }
          }
        }
        .promo-terms {
          display: block;
          font-size: 22rpx;
          color: $uni-text-color-grey;
          line-height: 1.5;
          margin-top: $uni-spacing-col-lg;
        }
      }
    }
  }
}

/* 商品列表区 (与 cart 保持一致) */
.product-list-section {
  padding-left: 0;
  padding-right: 0;
  .cart-item {
    padding: $uni-spacing-col-lg $uni-spacing-row-lg;
    .item-main {
      display: flex;
    }
    .item-image {
      width: 160rpx;
      height: 160rpx;
      border-radius: $uni-border-radius-base;
      margin-right: $uni-spacing-row-base;
      flex-shrink: 0;
      background-color: #f4f4f4;
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
    .item-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 50rpx;
      .quantity-stepper {
        display: flex;
        align-items: center;
        border: 1px solid #ddd;
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
          color: v-bind(themeColor);
        }
        .original-price {
          font-size: 24rpx;
          color: #999;
          text-decoration: line-through;
          display: block;
        }
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
          border-radius: 50%;
          border: 1px solid $uni-border-color;
          margin-right: $uni-spacing-row-base;
          position: relative;
        }
        .save-highlight {
          color: $uni-color-error;
          font-weight: bold;
          margin-left: $uni-spacing-row-sm;
        }
        &.active .radio-circle {
          border-color: v-bind(themeColor);
          &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: v-bind(themeColor);
          }
        }
      }
    }
  }
}

.payment-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .label {
    font-size: $uni-font-size-base;
  }
  .payment-method {
    display: flex;
    align-items: center;
    .wechat-icon {
      width: 48rpx;
      height: 48rpx;
      margin-right: 16rpx;
      border-radius: $uni-border-radius-base;
    }
  }
}
.summary-section {
  .summary-row {
    display: flex;
    justify-content: space-between;
    font-size: $uni-font-size-base;
    padding: $uni-spacing-col-base 0;
    .label {
      color: $uni-text-color-grey;
    }
    .discount-value {
      color: $uni-color-error;
    }
  }
  .summary-divider {
    height: 1px;
    background-color: $uni-bg-color-grey;
    margin: $uni-spacing-col-base 0;
  }
  .total-row {
    font-weight: bold;
    .total-value {
      font-size: $uni-font-size-lg;
      color: $uni-color-error;
    }
  }
}
.disclaimer-section {
  font-size: $uni-font-size-sm;
  color: $uni-text-color-grey;
  padding: $uni-spacing-col-lg $uni-spacing-row-base;
  line-height: 1.6;
}
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  background-color: $uni-bg-color;
  padding: $uni-spacing-col-base $uni-spacing-row-lg;
  padding-bottom: calc(#{$uni-spacing-col-base} + constant(safe-area-inset-bottom));
  padding-bottom: calc(#{$uni-spacing-col-base} + env(safe-area-inset-bottom));
  border-top: 1px solid #eee;
  .place-order-button {
    width: 95%;
    height: 88rpx;
    line-height: 88rpx;
    background-color: v-bind(themeColor);
    color: $uni-text-color-inverse;
    border-radius: 44rpx;
    font-size: $uni-font-size-lg;
    padding: 0;
    margin: 0;
    &::after {
      display: none;
    }
    &[disabled] {
      background-color: #a3c3f3;
    }
  }
}
</style>
