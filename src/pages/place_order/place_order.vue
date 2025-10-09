<template>
  <view class="place-order-page">
    <!-- 全局加载动画 -->
    <view class="loading-overlay" v-if="isLoading">
      <uni-load-more status="loading" :showText="false"></uni-load-more>
    </view>

    <!-- 顶部导航栏 -->
    <view class="custom-nav-bar">
      <text class="title">提交订单</text>
    </view>

    <scroll-view scroll-y class="scroll-view-container">
      <!-- 1. 地址区 -->
      <view class="section-card address-section">
        <template v-if="!selecteAddress">
          <!-- inline AddressForm when no address exists -->
          <AddressForm :saveText="'使用这个地址'" :address-data="{}" @save="onAddressFormSave" />
        </template>
        <template v-else>
          <view class="address-display" @click="goToAddressManagement">
            <view class="address-info">
              <view class="address-line-1">
                <text class="name">{{ selecteAddress.name }}</text>
                <text class="phone">{{ selecteAddress.phone }}</text>
              </view>
              <view class="address-line-2">
                <text class="default-tag" v-if="selecteAddress.isDefault">默认</text>
                <text>
                  {{ selecteAddress.province }} {{ selecteAddress.city }}
                  {{ selecteAddress.district }}
                </text>
              </view>
              <view class="address-line-3">
                <text>{{ selecteAddress.details }}</text>
              </view>
            </view>
            <uni-icons type="right" size="18" color="#999"></uni-icons>
          </view>
        </template>
      </view>

      <!-- 2. 全新订阅区 (不再折叠) -->
      <view class="subscription-toggle-section" v-if="hasEligibleSubscriptionItems">
        <view class="promo-header">
          <text>开启您的首次订阅订单，符合条件的商品最高可省</text>
          <text class="promo-highlight">50% (¥{{ totalSubscriptionDiscount.toFixed(2) }})</text>
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
              <text class="save-amount"
                >此订单您将额外节省 ¥{{
                  totalSubscriptionDiscountBasedOnSelection.toFixed(2)
                }}！</text
              >
              <picker
                mode="selector"
                :range="frequencyOptions"
                @change="onFrequencyChange"
                class="frequency-picker-wrapper"
              >
                <view class="picker-view">
                  <view class="picker-label">
                    <text class="label-title">配送频率</text>
                    <text class="label-value">{{ selectedFrequency }}</text>
                  </view>
                  <uni-icons type="bottom" size="16" color="#666"></uni-icons>
                </view>
              </picker>
              <text class="change-tip">您可以随时轻松地更改、取消或重新安排配送。</text>
              <scroll-view scroll-x class="subscribed-items-scroll">
                <view
                  class="item-image-wrapper"
                  v-for="item in subscriptionImageItems"
                  :key="item.id"
                >
                  <image :src="item.image" class="item-image-sm"></image>
                </view>
              </scroll-view>
              <text class="promo-terms"
                >订阅促销最高可省 ¥20。仅限支持订阅的商品。部分商品除外。限时优惠。</text
              >
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

      <!-- 3. 商品列表区 (与 cart 保持一致) -->
      <view class="section-card product-list-section">
        <view class="section-title">您的商品</view>
        <view class="cart-item" v-for="item in orderItems" :key="item.id">
          <view class="item-main">
            <image
              :src="item.image"
              class="item-image"
              mode="aspectFill"
              @click="goToProductDetail(item)"
            ></image>
            <view class="item-content-wrapper">
              <view class="item-info" @click="goToProductDetail(item)">
                <text class="item-name">{{ item.name }}</text>
                <text class="item-specs">{{ item.specs }}</text>
              </view>
              <view class="item-controls">
                <view class="quantity-stepper">
                  <button @click="decreaseQuantity(item)" :disabled="item.quantity <= 1">-</button>
                  <text>{{ item.quantity }}</text>
                  <button @click="increaseQuantity(item)">+</button>
                </view>
                <view class="price-info">
                  <text class="current-price"
                    >¥{{ calculateItemPrice(item).current.toFixed(2) }}</text
                  >
                  <text
                    class="original-price"
                    v-if="item.originalPrice > calculateItemPrice(item).current"
                  >
                    ¥{{ item.originalPrice.toFixed(2) }}
                  </text>
                </view>
              </view>
              <!-- 购买方式选择器，现在在商品列表中 -->
              <view class="purchase-type-selector">
                <view
                  class="type-option"
                  :class="{ active: item.purchaseType === 'once' }"
                  @click="togglePurchaseType(item, 'once')"
                >
                  <view class="radio-circle"></view>
                  <text
                    >买一次<text v-if="item.onceDiscount > 0" class="save-highlight"
                      >省{{ item.onceDiscount }}%（-¥{{ getSavedAmount(item, 'once') }}）</text
                    ></text
                  >
                </view>
                <view
                  class="type-option"
                  :class="{ active: item.purchaseType === 'subscribe' }"
                  @click="togglePurchaseType(item, 'subscribe')"
                  v-if="item.supportsSubscription"
                >
                  <view class="radio-circle"></view>
                  <text
                    >订阅并<text class="save-highlight"
                      >省{{ item.subscriptionDiscount }}%（-¥{{
                        getSavedAmount(item, 'subscribe')
                      }}）</text
                    ></text
                  >
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 4. 支付方式区 -->
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

      <!-- 5. 订单总结区 -->
      <view class="section-card summary-section">
        <view class="summary-row">
          <text class="label">商品金额</text>
          <text class="value">¥{{ orderSummary.subtotal.toFixed(2) }}</text>
        </view>
        <view class="summary-row">
          <text class="label">优惠金额</text>
          <text class="value discount-value">- ¥{{ orderSummary.totalDiscount.toFixed(2) }}</text>
        </view>
        <view class="summary-row">
          <text class="label">运费</text>
          <text class="value">¥{{ orderSummary.shippingFee.toFixed(2) }}</text>
        </view>
        <view class="summary-divider"></view>
        <view class="summary-row total-row">
          <text class="label">合计</text>
          <text class="value total-value">¥{{ orderSummary.total.toFixed(2) }}</text>
        </view>
      </view>

      <!-- 6. 文字说明区 -->
      <view class="disclaimer-section">
        <text
          >点击“立即支付”，即表示您同意我们的服务条款和隐私政策。如果您的订单包含订阅商品，您将授权我们定期向您的账户收费，直到您取消订阅为止。</text
        >
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="footer">
      <button class="place-order-button" @click="placeOrder" :disabled="isSubmitting">
        {{ isSubmitting ? '处理中...' : `立即支付 ¥${orderSummary.total.toFixed(2)}` }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AddressForm from '@/components/AddressForm/AddressForm.vue'
import { http } from '@/utils/http'
import { useAddressStore } from '@/stores/modules/address'

const themeColor = '#2c6fdb'
const isLoading = ref(true)
const isSubmitting = ref(false)
const addressStore = useAddressStore()
// orderPre will hold data returned by order API and address list
const orderPre = ref({ userAddresses: [] })
// computed selected address: prefer store.selectedAddress, fallback to default from orderPre
const selecteAddress = computed(() => {
  return addressStore.selectedAddress || orderPre.value?.userAddresses?.find((v) => v.isDefault)
})
const orderItems = ref([])
const orderSummary = ref({ subtotal: 0, totalDiscount: 0, shippingFee: 0, total: 0 })
const frequencyOptions = ref([])
const selectedFrequency = ref('')

// --- 主要状态：是否开启全局订阅 (由商品列表计算得出) ---
const isSubscribing = computed(() =>
  orderItems.value.some((item) => item.purchaseType === 'subscribe'),
)

onLoad(() => {
  fetchOrderData()
})

// --- 计算属性 ---
const hasEligibleSubscriptionItems = computed(() =>
  orderItems.value.some((item) => item.supportsSubscription),
)

const subscriptionImageItems = computed(() => {
  if (isSubscribing.value) {
    // 规则 3.3 (B被选中): 显示已订阅的商品
    return orderItems.value.filter((item) => item.purchaseType === 'subscribe')
  } else {
    // 规则 3.2 (B没被选中): 显示所有可以订阅的商品
    return orderItems.value.filter((item) => item.supportsSubscription)
  }
})

// 计算所有可订阅商品的总折扣潜力
const totalSubscriptionDiscount = computed(() => {
  return orderItems.value
    .filter((i) => i.supportsSubscription)
    .reduce((sum, item) => {
      const saved = item.originalPrice * (item.subscriptionDiscount / 100)
      return sum + saved * item.quantity
    }, 0)
})

// 根据当前选择实际节省的订阅金额
const totalSubscriptionDiscountBasedOnSelection = computed(() => {
  return orderItems.value
    .filter((i) => i.purchaseType === 'subscribe')
    .reduce((sum, item) => {
      const saved = item.originalPrice * (item.subscriptionDiscount / 100)
      return sum + saved * item.quantity
    }, 0)
})

// --- API & 核心方法 ---
const fetchOrderDataAPI = (params = {}) => {
  /* ... (逻辑保持不变) ... */ return new Promise((resolve) =>
    setTimeout(() => {
      const baseItems = [
        {
          id: 1,
          name: '亮白洁牙咀嚼棒 (小型犬)',
          specs: '30支/盒',
          image: 'https://placehold.co/100x100/e8e8e8/333?text=Chews',
          originalPrice: 40.0,
          quantity: 1,
          supportsSubscription: true,
          subscriptionDiscount: 15,
          onceDiscount: 5,
        },
        {
          id: 2,
          name: 'T形洁牙玩具',
          specs: '中型犬',
          image: 'https://placehold.co/100x100/e8e8e8/333?text=Toy',
          originalPrice: 25.0,
          quantity: 1,
          supportsSubscription: true,
          subscriptionDiscount: 10,
          onceDiscount: 0,
        },
        {
          id: 3,
          name: '天然剑麻猫抓板',
          specs: '大号',
          image: 'https://placehold.co/100x100/e8e8e8/333?text=Scratch',
          originalPrice: 30.0,
          quantity: 2,
          supportsSubscription: false,
          subscriptionDiscount: 0,
          onceDiscount: 0,
        },
      ]
      let items = params.items ? JSON.parse(JSON.stringify(params.items)) : baseItems
      let subtotal = 0
      let finalTotal = 0
      items.forEach((item) => {
        subtotal += item.originalPrice * item.quantity
        let currentPrice
        if (item.purchaseType === 'subscribe' && item.supportsSubscription) {
          currentPrice = item.originalPrice * (1 - item.subscriptionDiscount / 100)
        } else {
          currentPrice = item.originalPrice * (1 - item.onceDiscount / 100)
        }
        finalTotal += currentPrice * item.quantity
      })
      const totalDiscount = subtotal - finalTotal
      const shippingFee = 0.0
      const total = finalTotal + shippingFee
      const response = {
        orderItems: items,
        orderSummary: { subtotal, totalDiscount, shippingFee, total },
        frequencyOptions: {
          weeks: Array.from({ length: 16 }, (_, i) => `${i + 1}周`),
          months: Array.from({ length: 4 }, (_, i) => `${i + 5}个月`),
          default: '4周 (推荐)',
        },
      }
      resolve({ success: true, data: response })
    }, 800),
  )
}
const createOrderAPI = (params) => {
  /* ... (逻辑保持不变) ... */ return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          success: true,
          paymentParams: {
            provider: 'wxpay',
            timeStamp: String(Date.now()),
            nonceStr: 'nonceStr',
            package: 'prepay_id=...',
            signType: 'MD5',
            paySign: 'paySign',
          },
        }),
      1500,
    ),
  )
}
const fetchOrderData = async (params) => {
  isLoading.value = true
  const res = await fetchOrderDataAPI(params)
  if (res.success) {
    const data = res.data

    // Try to get addresses from the address mock via http

    try {
      const addrRes = await http({ url: '/address/list', method: 'GET' })
      if (addrRes && addrRes.code === '0' && Array.isArray(addrRes.result)) {
        orderPre.value.userAddresses = addrRes.result
      } else {
        // fallback: use order API returned address if available
        orderPre.value.userAddresses = data.shippingAddress ? [data.shippingAddress] : []
      }
    } catch (e) {
      orderPre.value.userAddresses = data.shippingAddress ? [data.shippingAddress] : []
      console.warn('fetch addresses error', e)
    }

    orderItems.value = data.orderItems
    orderSummary.value = data.orderSummary
    if (frequencyOptions.value.length === 0) {
      frequencyOptions.value = [...data.frequencyOptions.weeks, ...data.frequencyOptions.months]
      selectedFrequency.value = data.frequencyOptions.default
    }
  } else {
    uni.showToast({ title: '数据加载失败', icon: 'none' })
  }
  isLoading.value = false
}
const recalculateOrder = () => {
  fetchOrderData({ items: orderItems.value, frequency: selectedFrequency.value })
}
// Inline address form save handler
const onAddressFormSave = async (formData) => {
  uni.showLoading({ title: '保存地址...' })
  try {
    const res = await http({ url: '/address/create', method: 'POST', data: formData })
    if (res && res.code === '0') {
      const created = res.result
      // update global store and local orderPre so computed selecteAddress reflects it
      addressStore.changeSelectedAddress(created)
      orderPre.value.userAddresses = [created, ...(orderPre.value.userAddresses || [])]
      uni.hideLoading()
      uni.showToast({ title: '已使用这个地址', icon: 'success' })
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

const goToAddressManagement = () => {
  uni.navigateTo({ url: '/pages/account/address_list/address_list?select=1' })
}
const placeOrder = async () => {
  /* ... (逻辑保持不变) ... */ if (!selecteAddress.value) {
    uni.showToast({ title: '请先创建收货地址', icon: 'none' })
    return
  }
  isSubmitting.value = true
  const res = await createOrderAPI({
    addressId: 1,
    items: orderItems.value,
    frequency: selectedFrequency.value,
  })
  if (res.success) {
    uni.requestPayment({
      ...res.paymentParams,
      success: () => {
        uni.showToast({ title: '支付成功', icon: 'success' })
        uni.redirectTo({ url: '/pages/order/success' })
      },
      fail: () => uni.showToast({ title: '支付失败', icon: 'none' }),
      complete: () => (isSubmitting.value = false),
    })
  } else {
    uni.showToast({ title: '订单创建失败', icon: 'none' })
    isSubmitting.value = false
  }
}

// --- 事件处理 ---
const onFrequencyChange = (e) => {
  selectedFrequency.value = frequencyOptions.value[e.detail.value]
  recalculateOrder()
}
const increaseQuantity = (item) => {
  item.quantity++
  recalculateOrder()
}
const decreaseQuantity = (item) => {
  if (item.quantity > 1) {
    item.quantity--
    recalculateOrder()
  }
}

// 规则 4: B由没选中到选中后，所有可选D的商品都选D。
// 规则 1 的反向操作：点击A，所有商品都选C
const toggleGlobalSubscription = (subscribe) => {
  orderItems.value.forEach((item) => {
    if (item.supportsSubscription) {
      item.purchaseType = subscribe ? 'subscribe' : 'once'
    }
  })
  recalculateOrder()
}

// 规则 3: 商品列表区切换后，所有状态联动
const togglePurchaseType = (item, type) => {
  if (item.supportsSubscription) {
    item.purchaseType = type
  } else {
    item.purchaseType = 'once'
  }
  recalculateOrder()
}

const calculateItemPrice = (item) => {
  /* ... (逻辑保持不变) ... */ let current
  if (item.purchaseType === 'subscribe' && item.supportsSubscription) {
    current = item.originalPrice * (1 - item.subscriptionDiscount / 100)
  } else {
    current = item.originalPrice * (1 - item.onceDiscount / 100)
  }
  return { current }
}
const getSavedAmount = (item, type) => {
  /* ... (逻辑保持不变) ... */ const discountPercent =
    type === 'subscribe' ? item.subscriptionDiscount : item.onceDiscount
  if (discountPercent > 0) {
    const saved = item.originalPrice * (discountPercent / 100)
    return saved.toFixed(2)
  }
  return '0.00'
}
// (goToAddressManagement is declared earlier to open address list in selection mode)
const goToProductDetail = (item) => uni.navigateTo({ url: `/pages/product/detail?id=${item.id}` })
</script>

<style lang="scss" scoped>
/* ... 其他样式 ... */
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
  /* ... (样式保持不变) ... */
  .address-create {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40rpx 0;
    color: $uni-text-color-grey;
    font-size: $uni-font-size-base;
    text {
      margin-left: 16rpx;
    }
  }
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
          font-size: $uni-font-size-base;
          color: $uni-text-color-grey;
        }
      }
      .address-line-2 {
        display: flex;
        align-items: center;
        margin-top: 8rpx;
        font-size: $uni-font-size-sm;
        .default-tag {
          background-color: #ffefe6;
          color: #d84f1a;
          padding: 2rpx 10rpx;
          border-radius: $uni-border-radius-sm;
          margin-right: 12rpx;
        }
      }
      .address-line-3 {
        margin-top: 8rpx;
        font-size: $uni-font-size-base;
        color: $uni-text-color;
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
        .frequency-picker-wrapper {
          border: 1px solid $uni-border-color;
          border-radius: $uni-border-radius-base;
          padding: $uni-spacing-col-base $uni-spacing-row-base;
          .picker-view {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .picker-label {
            .label-title {
              display: block;
              font-size: 22rpx;
              color: $uni-text-color-grey;
            }
            .label-value {
              font-size: $uni-font-size-base;
              color: $uni-text-color;
            }
          }
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
  /* ... (样式保持不变) ... */
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
  /* ... (样式保持不变) ... */
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
  /* ... (样式保持不变) ... */
  font-size: $uni-font-size-sm;
  color: $uni-text-color-grey;
  padding: $uni-spacing-col-lg $uni-spacing-row-base;
  line-height: 1.6;
}
.footer {
  /* ... (样式保持不变) ... */
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
