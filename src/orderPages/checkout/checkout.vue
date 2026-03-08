<template>
  <view class="place-order-page">
    <view class="loading-overlay" v-if="isLoading">
      <uni-load-more status="loading" :showText="false"></uni-load-more>
    </view>
    <CustomNavigationBar title="确认订单" />

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
            orderPreview.recommendedAutoships
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
                :recommend-autoships="orderPreview.recommendedAutoships"
                @update:modelValue="onFrequencyChange"
              />
              <text class="change-tip">您可以随时轻松地更改、取消或重新安排配送。</text>
              <scroll-view scroll-x class="subscribed-items-scroll">
                <view
                  class="item-image-wrapper"
                  v-for="item in subscriptionImageItems"
                  :key="item.itemId"
                >
                  <image :src="item.sku.image?.[0]" class="item-image-sm"></image>
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

        <view class="checkout-item-row" v-for="item in orderPreview.items" :key="item.itemId">
          <ProductCard
            class="checkout-product-card"
            v-bind="toProductCardProps(item)"
            @click="goToProductDetail(item)"
          >
            <!-- 鲜食 sku.type===8: 结算页显示查看计划按钮 -->
            <template v-if="isFreshFood(item)">
              <view class="action-row">
                <button class="action-button" @click.stop="onViewPlan(item)">查看计划</button>
              </view>
            </template>
            <!-- 普通商品: 订阅切换 + 步进器 -->
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
                  :max="item.sku?.maxQuantity || 99"
                  @change="(e: InputNumberBoxEvent) => onQuantityChange(item, e)"
                  :inputWidth="100"
                  :inputHeight="50"
                  :size="28"
                />
              </view>
            </template>
          </ProductCard>
        </view>
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
          >点击"立即支付"，即表示您同意我们的服务条款和隐私政策。如果您的订单包含订阅商品，您将授权我们定期向您的账户收费，直到您取消订阅为止。</text
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
import ProductCard from '@/components/ProductCard/ProductCard.vue'
import { useAddressStore } from '@/stores/modules/address'
import { checkoutApi } from '@/api/checkout'
import { addressApi } from '@/api/address'
import type { OrderPreview, SubscriptionFrequency, UpdatePreviewParams } from '@/types/checkout'
import type { AddressItem } from '@/types/address'
import type { Item } from '@/types/checkout'
import type { ProductCardProps } from '@/types/product'
import type { InputNumberBoxEvent } from '@/components/QuantityInput/QuantityInput.d.ts'
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
  subtotal: '0.00',
  grandTotal: '0.00',
  shippingFee: '0.00',
  freeShippingThreshold: '0.00',
  freeShippingEligibleAmount: '0.00',
  totalDiscount: '0.00',
  discountDetails: [],
  shippingAddress: undefined,
  recommendedAutoships: [],
  items: [],
  id: '',
  subscriptionDiscount: {
    subscriptionDiscountRate: '0',
    subscriptionDiscount: '0.00',
    firstSubscription: false,
  },
})

const selectedFreqObj = ref<SubscriptionFrequency | null>(null)

// --- 辅助方法 ---

/** 判断鲜食商品 */
const isFreshFood = (item: Item) => item.sku?.type === 8

const onViewPlan = (item: Item) => {
  if (!item.sku?.planId) return
  uni.navigateTo({
    url: `/freshFoodPages/fresh_food_plan/fresh_food_plan?planId=${item.sku.planId}&scene=checkout&itemId=${item.itemId}`,
  })
}

/** Item -> ProductCardProps 映射（纯展示，不做价格计算） */
const toProductCardProps = (item: Item): ProductCardProps => {
  const s = item.sku
  const showOriginal =
    item.originalPrice && item.originalPrice !== item.finalPrice ? item.originalPrice : undefined

  const totalDiscount =
    item.totalItemDiscount && item.totalItemDiscount !== '0' && item.totalItemDiscount !== '0.00'
      ? `-\u00A5${item.totalItemDiscount}`
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
const isSubscribing = computed(() =>
  orderPreview.value.items.some((item: Item) => item.purchaseType === 1),
)

const hasEligibleSubscriptionItems = computed(() =>
  orderPreview.value.items.some((item: Item) => item.sku?.supportsSubscription),
)

const subscriptionImageItems = computed(() => {
  if (isSubscribing.value) {
    return orderPreview.value.items.filter((i: Item) => i.purchaseType === 1)
  }
  return orderPreview.value.items.filter((i: Item) => i.sku?.supportsSubscription)
})

const paymentButtonText = computed(() => {
  if (isSubmitting.value) return '处理中...'
  const total = orderPreview.value.grandTotal ?? '0.00'
  return `立即支付 ¥${total}`
})

// Watch for address changes from the store (updated by address list page)
watch(
  () => addressStore.selectedAddress,
  (newAddress) => {
    if (!newAddress) {
      updateAddressOnServer('')
    } else if (newAddress && newAddress.id !== orderPreview.value.shippingAddress?.id) {
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
    if (!previewId.value) {
      const entryRes = await checkoutApi.entryCart()
      if (entryRes && entryRes.code === '0') previewId.value = (entryRes.result as any).previewId
    }
    if (!previewId.value) throw new Error('no previewId')

    const res = await checkoutApi.getPreview(previewId.value)
    if (res && res.code === '0') {
      orderPreview.value = res.result
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
  } catch (e) {
    console.warn('updateItem error', e)
  } finally {
    isLoading.value = false
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
    if (res && res.code === '0') orderPreview.value = res.result
  } catch (e) {
    console.warn('updateGlobalSubscription error', e)
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

/** 数量变更 */
const onQuantityChange = (item: Item, event: InputNumberBoxEvent) => {
  updateItem({
    itemId: item.itemId,
    quantity: event.value,
    purchaseType: item.purchaseType,
  })
}

const toggleGlobalSubscription = (subscribe: boolean) => {
  updateGlobalSubscription(subscribe)
}

const handleTogglePurchaseType = (item: Item) => {
  const newType = item.purchaseType === 1 ? 0 : 1
  updateItem({
    itemId: item.itemId,
    quantity: item.quantity,
    purchaseType: newType,
  })
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
  uni.navigateTo({ url: `/accountPages/address_list/address_list?source=checkout&id=${id}` })
}

const goToProductDetail = (item: Item) =>
  uni.navigateTo({ url: `/pages/product/detail?id=${item.sku?.productId}` })

onLoad((options) => {
  if (options && options.previewId) {
    previewId.value = options.previewId
  }
  loadPreview()
})

onShow(() => {
  if (
    addressStore.selectedAddress &&
    orderPreview.value.shippingAddress?.id !== addressStore.selectedAddress.id
  ) {
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

/* 商品列表区 */
.product-list-section {
  padding-left: 0;
  padding-right: 0;
}

/* 结算页商品行 */
.checkout-item-row {
  background-color: #fff;
  margin-bottom: $uni-spacing-col-base;
}

/* 覆写 ProductCard 样式：全宽无侧边框 */
.checkout-product-card {
  :deep(.product-card) {
    border-radius: 0;
    box-shadow: none;
    margin-bottom: 0;
    padding-left: $uni-spacing-row-lg;
    padding-right: $uni-spacing-row-lg;
  }
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
