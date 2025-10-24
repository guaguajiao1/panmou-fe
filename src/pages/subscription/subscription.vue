<template>
  <view class="page-container">
    <!-- 加载状态 -->
    <view v-if="isLoading && !subscriptionData" class="loading-placeholder">
      <uni-load-more status="loading"></uni-load-more>
    </view>

    <!-- 页面内容 -->
    <scroll-view v-if="subscriptionData" scroll-y class="scroll-view-content">
      <!-- 顶部成功提示 (例如跳过商品后) -->
      <view v-if="successMessage" class="success-banner">
        <uni-icons type="checkbox-filled" color="#007f00" size="20"></uni-icons>
        <text>{{ successMessage }}</text>
        <uni-icons
          type="closeempty"
          color="#666"
          size="16"
          @click="successMessage = ''"
        ></uni-icons>
      </view>

      <!-- 1. 下次订单管理 -->
      <uni-card padding="15px" margin="10px">
        <template #title>
          <view class="card-title-container">
            <text class="card-title">{{ subscriptionData.subscription.name }}</text>
            <button class="btn-text-link btn-rename">Rename</button>
          </view>
        </template>
        <view class="section">
          <text class="section-label">Next Order</text>
          <text class="section-value-large">{{
            formatShortDate(subscriptionData.subscription.fulfillment.nextShipment)
          }}</text>
          <text class="section-subtitle">
            Edit or skip by {{ formatDateTime(subscriptionData.subscription.authorizationDate) }}
          </text>
          <text class="section-subtitle">
            Payment processing on
            {{ formatShortDate(subscriptionData.subscription.fulfillment.nextShipment) }}
          </text>
          <view class="button-group-row">
            <button class="btn-primary" @click="openChangeDatePopup">Change Date</button>
            <button class="btn-secondary" @click="openSkipOrderPopup">Skip Order</button>
          </view>
          <view class="button-group-row" style="margin-top: 10px">
            <button class="btn-secondary btn-full" @click="handleOrderNow">Order Now</button>
          </view>
        </view>
      </uni-card>

      <!-- 2. 配送频率 -->
      <uni-card padding="15px" margin="10px">
        <view class="row-flex-between">
          <view>
            <text class="section-label">Frequency</text>
            <text class="section-value">{{
              formatFrequency(subscriptionData.subscription.fulfillment.frequency)
            }}</text>
          </view>
          <button class="btn-text-link" @click="openChangeFreqPopup">Change</button>
        </view>
      </uni-card>

      <!-- 3. 上次订单 -->
      <uni-card padding="15px" margin="10px" v-if="subscriptionData.subscription.orders.length > 0">
        <view class="row-flex-between">
          <view>
            <text class="section-label">Last Order</text>
            <text class="section-value">{{
              formatShortDate(subscriptionData.subscription.orders[0].placed)
            }}</text>
          </view>
          <button class="btn-text-link">View</button>
        </view>
      </uni-card>

      <!-- 4. 商品列表 -->
      <view class="list-title">
        Next Order {{ formatShortDate(subscriptionData.subscription.fulfillment.nextShipment) }}
      </view>
      <uni-card
        v-for="item in subscriptionData.subscription.items"
        :key="item.fulfillmentItemId"
        padding="15px"
        margin="10px"
      >
        <!-- 商品被跳过的提示 -->
        <view v-if="item.skipNext" class="skipped-item-tag">
          <uni-icons type="calendar-filled" color="#007f00" size="16"></uni-icons>
          <text>Skipped Once</text>
        </view>
        <view class="item-row">
          <image :src="item.item.thumbnail" class="item-image" mode="aspectFit"></image>
          <view class="item-info">
            <text class="item-name">{{ item.item.name }}</text>
            <text class="item-price">${{ item.price }}</text>
            <view class="item-quantity">
              <text class="quantity-label">Quantity</text>
              <uni-number-box :value="item.quantity" @change="onQuantityChange(item, $event)" />
            </view>
          </view>
        </view>
        <view class="item-actions">
          <button v-if="!item.skipNext" class="btn-text-link" @click="openSkipItemPopup(item)">
            Skip Once
          </button>
          <button v-else class="btn-text-link" @click="handleAddBackItem(item)">Add Back</button>
          <button class="btn-text-link">Replace</button>
          <button class="btn-text-link btn-remove" @click="openRemoveItemPopup(item)">
            Remove
          </button>
        </view>
      </uni-card>

      <!-- 5. 免运费进度 -->
      <uni-card padding="15px" margin="10px" class="free-shipping-card">
        <view class="row-flex-between">
          <text class="shipping-progress-text"
            >${{ freeShippingShortfall.toFixed(2) }} until FREE shipping</text
          >
          <uni-icons type="info" color="#666" size="20"></uni-icons>
        </view>
        <!-- 这里可以放一个进度条 -->
        <button class="btn-secondary btn-full" style="margin-top: 15px">Add More Items</button>
      </uni-card>

      <!-- 6. 订单总览 -->
      <uni-card padding="15px" margin="10px">
        <view class="summary-row">
          <text>Subtotal</text>
          <text>${{ subscriptionData.subscription.totalProduct }}</text>
        </view>
        <view class="summary-row">
          <text>Florida Shipping</text>
          <text>${{ subscriptionData.subscription.totalShipping }}</text>
        </view>
        <view class="summary-row">
          <text>Estimated Tax</text>
          <text>${{ estimatedTax }}</text>
        </view>
        <view class="summary-divider"></view>
        <view class="summary-row summary-total">
          <text>Order Total</text>
          <text>${{ subscriptionData.subscription.totalOrder }}</text>
        </view>
      </uni-card>

      <!-- 7. 促销代码 -->
      <uni-card padding="15px" margin="10px">
        <text class="section-label">Promo Code</text>
        <view class="promo-input">
          <uni-easyinput placeholder="Promo Code" class="input-field"></uni-easyinput>
          <button class="btn-secondary btn-apply">Apply</button>
        </view>
      </uni-card>

      <!-- 8. 配送地址 -->
      <uni-card padding="15px" margin="10px">
        <view class="row-flex-between">
          <view>
            <text class="section-label">Shipping Address</text>
            <!--
              [MODIFIED]
              更新为 AddressItem 结构
            -->
            <view class="address-details">
              <text>{{ subscriptionData.subscription.address.receiver }}</text>
              <text>{{ subscriptionData.subscription.address.address }}</text>
              <text>{{ subscriptionData.subscription.address.fullLocation }}</text>
            </view>
          </view>
          <button class="btn-text-link">Change</button>
        </view>
      </uni-card>

      <!-- 9. 礼品卡 -->
      <uni-card padding="15px" margin="10px">
        <view class="row-flex-between">
          <text class="section-label">Gift Cards</text>
          <button class="btn-text-link">+ Add a Gift Card</button>
        </view>
      </uni-card>

      <!-- 10. 支付方式 -->
      <uni-card padding="15px" margin="10px">
        <view class="row-flex-between">
          <view>
            <text class="section-label">Payment Method</text>
            <text class="section-value">{{
              formatPayment(subscriptionData.subscription.payments[0])
            }}</text>
          </view>
          <button class="btn-text-link">Change</button>
        </view>
      </uni-card>

      <!-- 11. 节省横幅 -->
      <view class="savings-banner">
        <text class="savings-text">
          You've saved ${{ subscriptionData.currentUser.lifetimeSavings.amountSaved.amount }} on
          Autoship orders so far!
        </text>
      </view>

      <!-- 12. 取消订阅 -->
      <view class="cancel-section">
        <text class="cancel-prompt">No longer need {{ subscriptionData.subscription.name }}?</text>
        <button class="btn-text-link btn-cancel-subscription" @click="handleCancelSubscription">
          Cancel This Autoship
        </button>
      </view>
    </scroll-view>

    <!-- 弹窗：修改下次订单日期 -->
    <uni-popup
      ref="changeDatePopupRef"
      type="bottom"
      background-color="#fff"
      border-radius="10px 10px 0 0"
    >
      <view class="popup-content popup-calendar">
        <view class="popup-header">
          <text class="popup-title">Change Next Order date</text>
          <uni-icons
            type="closeempty"
            size="24"
            color="#666"
            @click="closePopup('changeDatePopupRef')"
          ></uni-icons>
        </view>
        <uni-calendar
          :date="tempSelectedDate"
          :insert="true"
          :start-date="minChangeDate"
          @change="onCalendarChange"
        />
        <view class="popup-footer">
          <button class="btn-secondary" @click="closePopup('changeDatePopupRef')">Cancel</button>
          <button class="btn-primary" @click="saveNewDate">Save</button>
        </view>
      </view>
    </uni-popup>

    <!-- 弹窗：跳过下次订单 -->
    <uni-popup ref="skipOrderPopupRef" type="center" :is-mask-click="false">
      <view class="popup-content popup-center">
        <view class="popup-header">
          <text class="popup-title">Skip your next order?</text>
          <uni-icons
            type="closeempty"
            size="24"
            color="#666"
            @click="closePopup('skipOrderPopupRef')"
          ></uni-icons>
        </view>
        <view class="popup-body">
          <text class="popup-text">This will update your next order date.</text>
          <view class="popup-date-box">
            <text class="popup-date-label">New Order Date</text>
            <text class="popup-date-value">
              {{
                subscriptionData
                  ? formatShortDate(subscriptionData.subscription.fulfillment.followingShipment)
                  : ''
              }}
            </text>
          </view>
        </view>
        <view class="popup-footer-column">
          <button class="btn-primary" @click="handleSkipOrder">Skip Order</button>
          <button class="btn-secondary" @click="closePopup('skipOrderPopupRef')">Cancel</button>
        </view>
      </view>
    </uni-popup>

    <!-- 弹窗：修改配送频率 -->
    <uni-popup
      ref="changeFreqPopupRef"
      type="bottom"
      background-color="#fff"
      border-radius="10px 10px 0 0"
    >
      <view class="popup-content popup-frequency">
        <view class="popup-header">
          <text class="popup-title">Change Frequency</text>
          <uni-icons
            type="closeempty"
            size="24"
            color="#666"
            @click="closePopup('changeFreqPopupRef')"
          ></uni-icons>
        </view>
        <scroll-view scroll-y style="max-height: 400px">
          <uni-data-checkbox
            v-model="tempSelectedFrequencyInterval"
            :localdata="frequencyOptions"
            @change="onFrequencyChange"
          ></uni-data-checkbox>
        </scroll-view>
        <view class="popup-footer">
          <button class="btn-secondary" @click="closePopup('changeFreqPopupRef')">Cancel</button>
          <button class="btn-primary" @click="saveNewFrequency">Save</button>
        </view>
      </view>
    </uni-popup>

    <!-- 弹窗：跳过单个商品 -->
    <uni-popup ref="skipItemPopupRef" type="center" :is-mask-click="false">
      <view class="popup-content popup-center" v-if="selectedItem">
        <view class="popup-header">
          <text class="popup-title">Skip this item once?</text>
          <uni-icons
            type="closeempty"
            size="24"
            color="#666"
            @click="closePopup('skipItemPopupRef')"
          ></uni-icons>
        </view>
        <view class="popup-body">
          <view class="popup-item-info">
            <image
              :src="selectedItem.item.thumbnail"
              class="popup-item-image"
              mode="aspectFit"
            ></image>
            <text class="popup-item-name">{{ selectedItem.item.name }}</text>
          </view>
          <view class="popup-date-box">
            <text class="popup-date-label">New Order Date</text>
            <text class="popup-date-value">
              {{
                subscriptionData
                  ? formatShortDate(subscriptionData.subscription.fulfillment.followingShipment)
                  : ''
              }}
            </text>
          </view>
          <text class="popup-text-small">
            Skipping this item could change your deals or free shipping.
          </text>
          <text class="popup-text-small">It's easy to add it back if you change your mind.</text>
        </view>
        <view class="popup-footer-column">
          <button class="btn-primary" @click="handleSkipItem">Skip Once</button>
          <button class="btn-secondary" @click="closePopup('skipItemPopupRef')">Cancel</button>
        </view>
      </view>
    </uni-popup>

    <!-- 弹窗：移除单个商品 -->
    <uni-popup ref="removeItemPopupRef" type="center" :is-mask-click="false">
      <view class="popup-content popup-center" v-if="selectedItem">
        <view class="popup-header">
          <text class="popup-title">Remove this item?</text>
          <uni-icons
            type="closeempty"
            size="24"
            color="#666"
            @click="closePopup('removeItemPopupRef')"
          ></uni-icons>
        </view>
        <view class="popup-body">
          <view class="popup-item-info">
            <image
              :src="selectedItem.item.thumbnail"
              class="popup-item-image-large"
              mode="aspectFit"
            ></image>
            <text class="popup-item-name">{{ selectedItem.item.name }}</text>
          </view>
          <text class="popup-text"
            >You can always skip once if you need a break from this item.</text
          >
        </view>
        <view class="popup-footer-column">
          <button class="btn-danger" @click="handleRemoveItem">Remove Item</button>
          <button class="btn-secondary" @click="closePopup('removeItemPopupRef')">Keep Item</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { subscriptionApi } from '@/api/subscription'
import type {
  AutoshipData,
  Item,
  Frequency,
  FrequencyPairing,
  Payment,
  UpdateSubscriptionParams,
  UpdateType,
} from '@/types/subscription'
import type { AddressItem } from '@/types/address'
// [MODIFIED] 修复 uni-ui 导入路径

// [MODIFIED] 定义 HTTP 响应类型
type Data<T> = {
  code: string
  msg: string
  result: T
}

// [MODIFIED] Mock Data
const mockAddress: AddressItem = {
  id: 'addr_123',
  receiver: 'Lucy',
  contact: '123-456-7890',
  provinceCode: 'NY',
  cityCode: 'FLUSHING',
  countyCode: 'QUEENS',
  address: '1235 Genium Ave, Apt 4N',
  isDefault: 1,
  fullLocation: 'Flushing, NY 11265-8102',
}
const mockFrequencyPairings: FrequencyPairing[] = [
  { frequency: { unit: 'Week', interval: 1 }, date: '2025-08-12' },
  { frequency: { unit: 'Week', interval: 2 }, date: '2025-08-19' },
  { frequency: { unit: 'Week', interval: 3 }, date: '2025-08-26' },
  { frequency: { unit: 'Week', interval: 4 }, date: '2025-09-02' },
  { frequency: { unit: 'Week', interval: 5 }, date: '2025-09-09' },
  { frequency: { unit: 'Week', interval: 6 }, date: '2025-09-16' },
  { frequency: { unit: 'Week', interval: 7 }, date: '2025-09-23' },
  { frequency: { unit: 'Week', interval: 8 }, date: '2025-09-30' },
]
const mockItems: Item[] = [
  {
    fulfillmentItemId: 'item_1',
    price: '14.99',
    quantity: 1,
    skipNext: false,
    item: {
      id: 'p_1',
      name: 'As Seen on TV Wobble Wag Giggle Ball Dog Toy',
      thumbnail: 'https://placehold.co/80x80/eee/333?text=Wobble+Wag',
      brand: 'As Seen on TV',
      description: 'A fun toy for dogs.',
      isGiftCard: false,
      isPharma: false,
      isVetDiet: false,
      isFrozen: false,
      isSingleTablet: false,
      isAutoshipAllowed: true,
      petTypes: [],
      rxFrequency: {},
      foodFlavor: [],
      size: [],
    },
    adjustments: [],
    siteId: '1',
    totalAdjustments: '0.00',
    totalDiscountAdjustment: '0.00',
    totalProduct: '14.99',
    bundleComponentItems: [],
    isVirtualBundle: false,
    autoAdd: false,
    contactVet: false,
    clinic: {},
    pet: {},
    oosReplacement: { isOos: false, alternatives: [] },
    oneTime: false,
    subscriptionId: 'sub_1',
  },
  {
    fulfillmentItemId: 'item_2',
    price: '12.99',
    quantity: 1,
    skipNext: true, // This item is skipped
    item: {
      id: 'p_2',
      name: 'Frisco Celta Bobble Plush Squeaky Dog Toy',
      thumbnail: 'https://placehold.co/80x80/eee/333?text=Frisco+Plush',
      brand: 'Frisco',
      description: 'A soft toy for dogs.',
      isGiftCard: false,
      isPharma: false,
      isVetDiet: false,
      isFrozen: false,
      isSingleTablet: false,
      isAutoshipAllowed: true,
      petTypes: [],
      rxFrequency: {},
      foodFlavor: [],
      size: [],
    },
    adjustments: [],
    siteId: '1',
    totalAdjustments: '0.00',
    totalDiscountAdjustment: '0.00',
    totalProduct: '12.99',
    bundleComponentItems: [],
    isVirtualBundle: false,
    autoAdd: false,
    contactVet: false,
    clinic: {},
    pet: {},
    oosReplacement: { isOos: false, alternatives: [] },
    oneTime: false,
    subscriptionId: 'sub_1',
  },
]
const mockAutoshipData: AutoshipData = {
  currentUser: {
    lifetimeSavings: {
      amountSaved: { amount: 26, currency: 'USD' },
      savingsSinceMonths: 6,
      savingsSinceYear: 2024,
    },
    isPullForwardOptOut: false,
  },
  paymentMethods: [],
  subscription: {
    id: 'sub_1',
    fulfillmentRequestId: 'fr_1',
    name: 'Autoship #1',
    authorizationDate: '2025-08-02T23:00:00Z',
    startDate: '2025-03-01T00:00:00Z',
    fulfillment: {
      nextShipment: '2025-08-05T00:00:00Z',
      followingShipment: '2025-09-02T00:00:00Z',
      frequency: { unit: 'Week', interval: 4 },
      frequencyPairings: mockFrequencyPairings,
    },
    address: mockAddress,
    amountDue: { amount: 21.71, currency: 'USD' },
    blocked: false,
    blocks: [],
    currency: 'USD',
    items: mockItems,
    orders: [
      {
        id: 'order_1',
        status: 'DEPOSITED',
        placed: '2025-07-01T00:00:00Z',
        shipped: '2025-07-02T00:00:00Z',
      },
    ],
    // Totals match '订阅详情-跳过item后.jpg'
    totalOrder: '21.71',
    totalProduct: '14.99', // Only item 1
    totalShipping: '4.95',
    totalTax: '1.42',
    totalTaxShipping: '0.35',
    totalLoyaltyHealthcareAdjustment: { amount: 0, currency: 'USD' },
    totalLoyaltyRewardsAdjustment: { amount: 0, currency: 'USD' },
    totalLoyaltyEarnedRewards: { amount: 0, currency: 'USD' },
    orderedWithinLastSevenDays: false,
    placed: '2025-07-01T00:00:00Z',
    paymentFailureCount: 0,
    payments: [
      {
        paymentMethodType: 'APPLEPAY',
        instructionId: 'pi_1',
        walletId: 'w_1',
        paymentMethod: {
          id: 'pm_apple_1',
          detail: { __typename: 'ApplePay' },
        },
      },
    ],
    promos: [],
    subscriptions: [],
  },
}
// End Mock Data

// API 数据
const subscriptionData = ref<AutoshipData | null>(null)
const isLoading = ref(true)
const subscriptionId = ref('')
const successMessage = ref('')
const FREE_SHIPPING_THRESHOLD = 49.0

// 弹窗 Refs
type PopupRef = InstanceType<typeof UniPopup> | null
const changeDatePopupRef = ref<PopupRef>(null)
const skipOrderPopupRef = ref<PopupRef>(null)
const changeFreqPopupRef = ref<PopupRef>(null)
const skipItemPopupRef = ref<PopupRef>(null)
const removeItemPopupRef = ref<PopupRef>(null)

// 弹窗内部状态
const tempSelectedDate = ref('')
const tempSelectedFrequency = ref<Frequency | null>(null)
const tempSelectedFrequencyInterval = ref<number | null>(null)
const selectedItem = ref<Item | null>(null)

// --- 1. 数据加载 ---
onLoad(async (options) => {
  const id = options?.id
  if (!id && !mockAutoshipData) {
    // Allow mock data to run without id
    uni.showToast({ title: '无效的订阅ID', icon: 'none' })
    uni.navigateBack()
    return
  }
  subscriptionId.value = id || mockAutoshipData.subscription.id

  // [MODIFIED] 使用 Mock Data
  subscriptionData.value = mockAutoshipData
  // 初始化弹窗的默认值
  tempSelectedDate.value = mockAutoshipData.subscription.fulfillment.nextShipment
  tempSelectedFrequency.value = mockAutoshipData.subscription.fulfillment.frequency
  tempSelectedFrequencyInterval.value = mockAutoshipData.subscription.fulfillment.frequency.interval
  isLoading.value = false
  // [MODIFIED] 注释掉 API 调用
  // await fetchSubscriptionDetails()
})

async function fetchSubscriptionDetails() {
  isLoading.value = true
  try {
    // [MODIFIED] 处理 Data<T> 响应
    const res = await subscriptionApi.getSubscriptionDetails(subscriptionId.value)
    if (res.code === '0') {
      // 假设 '0' 是成功代码
      subscriptionData.value = res.result
      // 初始化弹窗的默认值
      tempSelectedDate.value = res.result.subscription.fulfillment.nextShipment
      tempSelectedFrequency.value = res.result.subscription.fulfillment.frequency
      tempSelectedFrequencyInterval.value = res.result.subscription.fulfillment.frequency.interval
    } else {
      throw new Error(res.msg || '加载失败')
    }
  } catch (error: any) {
    console.error('fetchSubscriptionDetails error:', error)
    uni.showToast({ title: error.message || '加载失败，请稍后重试', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

// --- 2. 核心：更新订阅 ---
async function callUpdateApi(
  params: Omit<UpdateSubscriptionParams, 'subscriptionId'>,
  successMsg: string,
) {
  if (!subscriptionData.value) return

  // [MODIFIED] 在 Mock 模式下模拟 API 行为
  if (subscriptionId.value === mockAutoshipData.subscription.id) {
    uni.showLoading({ title: '正在处理...' })
    // 模拟延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 简单模拟: 重新设置 mock data (在真实场景中, res.result 会是新数据)
    // 这里我们只是为了演示流程
    subscriptionData.value = { ...mockAutoshipData } // 简单重置

    // 真实模拟
    const type = params.type
    if (type === 'SKIP_ONCE_ITEM' && params.itemId) {
      const item = subscriptionData.value.subscription.items.find(
        (i) => i.fulfillmentItemId === params.itemId,
      )
      if (item) item.skipNext = true
    } else if (type === 'ADD_BACK_ITEM' && params.itemId) {
      const item = subscriptionData.value.subscription.items.find(
        (i) => i.fulfillmentItemId === params.itemId,
      )
      if (item) item.skipNext = false
    }
    // ... 可以添加更多模拟逻辑 ...

    uni.hideLoading()
    closeAllPopups()
    if (successMsg.startsWith('商品已跳过')) {
      successMessage.value = successMsg
      setTimeout(() => (successMessage.value = ''), 5000)
    } else {
      uni.showToast({ title: successMsg, icon: 'success' })
    }
    return // 结束模拟调用
  }
  // --- END Mock 模式 ---

  uni.showLoading({ title: '正在处理...' })
  try {
    const fullParams: UpdateSubscriptionParams = {
      ...params,
      subscriptionId: subscriptionData.value.subscription.id,
    }
    // [MODIFIED] 处理 Data<T> 响应
    const res = await subscriptionApi.updateSubscription(subscriptionId.value, fullParams)

    if (res.code === '0') {
      subscriptionData.value = res.result // 使用返回的最新数据刷新整个页面

      // 关闭所有弹窗
      closeAllPopups()

      // 显示成功提示
      if (successMsg.startsWith('商品已跳过')) {
        successMessage.value = successMsg // 使用顶部横幅
        setTimeout(() => (successMessage.value = ''), 5000)
      } else {
        uni.showToast({ title: successMsg, icon: 'success' })
      }
    } else {
      throw new Error(res.msg || '操作失败')
    }
  } catch (error: any) {
    console.error('callUpdateApi error:', error)
    uni.showToast({ title: error.message || '操作失败，请重试', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

// --- 3. 弹窗控制 ---
function closePopup(refName: keyof typeof popupRefs) {
  const ref = popupRefs[refName]
  ref.value?.close()
}

function closeAllPopups() {
  Object.values(popupRefs).forEach((ref) => ref.value?.close())
  selectedItem.value = null
}

const popupRefs = {
  changeDatePopupRef,
  skipOrderPopupRef,
  changeFreqPopupRef,
  skipItemPopupRef,
  removeItemPopupRef,
}

// --- 4. 事件处理器 - 打开弹窗 ---
function openChangeDatePopup() {
  if (!subscriptionData.value) return
  tempSelectedDate.value = subscriptionData.value.subscription.fulfillment.nextShipment
  changeDatePopupRef.value?.open()
}

function openSkipOrderPopup() {
  skipOrderPopupRef.value?.open()
}

function openChangeFreqPopup() {
  if (!subscriptionData.value) return
  tempSelectedFrequency.value = subscriptionData.value.subscription.fulfillment.frequency
  tempSelectedFrequencyInterval.value =
    subscriptionData.value.subscription.fulfillment.frequency.interval
  changeFreqPopupRef.value?.open()
}

function openSkipItemPopup(item: Item) {
  selectedItem.value = item
  skipItemPopupRef.value?.open()
}

function openRemoveItemPopup(item: Item) {
  selectedItem.value = item
  removeItemPopupRef.value?.open()
}

// --- 5. 事件处理器 - 弹窗内操作 ---

// 修改日期
function onCalendarChange(e: { fulldate: string }) {
  tempSelectedDate.value = e.fulldate
}
async function saveNewDate() {
  await callUpdateApi(
    {
      type: 'CHANGE_NEXTORDER_DATE',
      nextOrderDate: tempSelectedDate.value,
    },
    '订单日期已更新',
  )
}

// 跳过订单
async function handleSkipOrder() {
  await callUpdateApi({ type: 'SKIP_NEXTORDER' }, '订单已跳过')
}

// 立即下单
async function handleOrderNow() {
  await callUpdateApi({ type: 'ORDER_NOW' }, '订单已提交')
}

// 修改频率
function onFrequencyChange(e: { detail: { value: number } }) {
  const newInterval = e.detail.value
  tempSelectedFrequencyInterval.value = newInterval
  // 假设 unit 总是 'Week'，根据 frequencyPairings 找到完整的 Frequency 对象
  const pairing = frequencyOptions.value.find((f) => f.value === newInterval)
  if (pairing) {
    tempSelectedFrequency.value = pairing.originalFrequency
  }
}
async function saveNewFrequency() {
  if (!tempSelectedFrequency.value) return
  await callUpdateApi(
    {
      type: 'CHANGE_FREQUENCY',
      frequency: tempSelectedFrequency.value,
    },
    '配送频率已更新',
  )
}

// 跳过商品
async function handleSkipItem() {
  if (!selectedItem.value) return
  await callUpdateApi(
    {
      type: 'SKIP_ONCE_ITEM',
      itemId: selectedItem.value.fulfillmentItemId,
    },
    `商品已跳过: ${selectedItem.value.item.name}`,
  )
}

// 加回商品
async function handleAddBackItem(item: Item) {
  await callUpdateApi(
    {
      type: 'ADD_BACK_ITEM',
      itemId: item.fulfillmentItemId,
    },
    '商品已加回订单',
  )
}

// 移除商品
async function handleRemoveItem() {
  if (!selectedItem.value) return
  await callUpdateApi(
    {
      type: 'REMOVE_ITEM', // 假设的 type，d.ts 中未定义，先用这个
      itemId: selectedItem.value.fulfillmentItemId,
    },
    '商品已移除',
  )
}

// 改变数量 (注意: API中未定义, 这是一个示例)
function onQuantityChange(item: Item, newQuantity: number) {
  console.log(`Item ${item.item.name} quantity changed to ${newQuantity}`)
  // 这里可以调用一个 'CHANGE_QUANTITY' 类型的 callUpdateApi
  // await callUpdateApi({ type: 'CHANGE_QUANTITY', itemId: item.fulfillmentItemId, quantity: newQuantity }, '数量已更新')
  // 暂时先用 toast 提示
  uni.showToast({ title: `数量变为 ${newQuantity} (API未实现)`, icon: 'none' })
  // 为防止UI与后端不一致，最好调完API后刷新整个数据
  // fetchSubscriptionDetails();
}

// 取消订阅
async function handleCancelSubscription() {
  uni.showModal({
    title: '确认取消',
    content: `你确定要取消 ${subscriptionData.value?.subscription.name} 吗?`,
    confirmColor: '#d9534f',
    success: async (res) => {
      if (res.confirm) {
        await callUpdateApi({ type: 'CANCEL_SUBSCRIPTION' }, '订阅已取消')
        // 取消后通常会跳转回列表页
        // uni.navigateBack(); // 在mock模式下暂时不跳转
      }
    },
  })
}

// --- 6. 计算属性和格式化 ---

// 免运费还差多少
const freeShippingShortfall = computed(() => {
  if (!subscriptionData.value) return 0
  const total = parseFloat(subscriptionData.value.subscription.totalOrder)
  const shortfall = FREE_SHIPPING_THRESHOLD - total
  return shortfall > 0 ? shortfall : 0
})

// 预估税费
const estimatedTax = computed(() => {
  if (!subscriptionData.value) return '0.00'
  const tax = parseFloat(subscriptionData.value.subscription.totalTax)
  const shippingTax = parseFloat(subscriptionData.value.subscription.totalTaxShipping)
  return (tax + shippingTax).toFixed(2)
})

// 频率选项
const frequencyOptions = computed(() => {
  if (!subscriptionData.value) return []
  return subscriptionData.value.subscription.fulfillment.frequencyPairings.map((pairing) => ({
    value: pairing.frequency.interval,
    text: `Every ${pairing.frequency.interval} ${pairing.frequency.unit}${
      pairing.frequency.interval > 1 ? 's' : ''
    }`,
    originalFrequency: pairing.frequency, // 保存原始对象以便API调用
  }))
})

// 修改日期的最小可选日期 (例如: 明天)
const minChangeDate = computed(() => {
  const today = new Date()
  today.setDate(today.getDate() + 1)
  return today.toISOString().split('T')[0]
})

// 日期格式化: Tue, Aug 5
function formatShortDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// 日期时间格式化: Sat, Aug 2 at 11 p.m. ET
function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
  })
}

// 频率格式化: Every 4 Weeks
function formatFrequency(freq: Frequency): string {
  if (!freq) return ''
  return `Every ${freq.interval} ${freq.unit}${freq.interval > 1 ? 's' : ''}`
}

// 支付方式格式化
function formatPayment(payment: Payment): string {
  if (!payment) return 'N/A'
  switch (payment.paymentMethodType) {
    case 'APPLEPAY':
      return 'Apple Pay'
    case 'CREDITCARD':
      return 'Credit Card' // 假设
    default:
      return payment.paymentMethodType
  }
}
</script>

<style lang="scss" scoped>
/* [MODIFIED] 引入 uni.scss 变量 */

// 1. 定义与图片匹配的 APP 主题色
$app-color-primary: #004a99; // 主题蓝
$app-color-danger: #d9534f; // 危险红
$app-color-success: #007f00; // 成功绿
$app-color-success-bg: #e6f7e6; // 成功背景绿
$app-color-info-bg: #e6f7f2; // 提示背景青

// 2. 定义补充的 uni.scss 中没有的变量（基于图片）
$app-text-color-secondary: #666; // 次要文字（比 $uni-text-color-grey 更深）
$app-border-color-light: #f0f0f0; // 浅色分割线
$app-border-radius: 8px; // App内的统一圆角

// 页面和滚动容器
page {
  background-color: $uni-bg-color-grey; // 使用 uni.scss 变量
}
.page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.scroll-view-content {
  flex: 1;
  height: 100%;
  box-sizing: border-box;
}
.loading-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

// 通用按钮样式
button {
  font-size: $uni-font-size-base; // 使用 uni.scss 变量
  border-radius: 20px;
  padding: 0 $uni-spacing-row-lg;
  height: 40px;
  line-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  &::after {
    border: none;
  }
}

.btn-primary {
  background-color: $app-color-primary;
  color: $uni-text-color-inverse;
}
.btn-secondary {
  background-color: $uni-bg-color;
  color: $app-color-primary;
  border: 1px solid $app-color-primary;
}
.btn-danger {
  background-color: $app-color-danger;
  color: $uni-text-color-inverse;
}
.btn-text-link {
  background-color: transparent;
  color: $app-color-primary;
  border: none;
  padding: 0;
  margin: 0;
  height: auto;
  line-height: 1.5;
  font-size: $uni-font-size-base;
  &.btn-rename {
    font-size: $uni-font-size-sm;
  }
  &.btn-remove {
    color: $app-color-danger;
  }
}
.btn-full {
  width: 100%;
}
.button-group-row {
  display: flex;
  gap: $uni-spacing-row-base;
  margin-top: $uni-spacing-row-lg;
  > button {
    flex: 1;
  }
}

// 卡片内样式
:deep(.uni-card) {
  border-radius: $app-border-radius !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin: $uni-spacing-row-base !important;
  padding: $uni-spacing-row-lg !important;
}
.card-title-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-size: 18px; // 大于 $uni-font-size-lg
  font-weight: bold;
  color: $uni-text-color;
}
.section {
  display: flex;
  flex-direction: column;
}
.section-label {
  font-size: $uni-font-size-base;
  color: $app-text-color-secondary;
  margin-bottom: $uni-spacing-col-sm;
}
.section-value {
  font-size: $uni-font-size-lg;
  color: $uni-text-color;
  font-weight: 500;
}
.section-value-large {
  font-size: 22px;
  color: $uni-text-color;
  font-weight: bold;
}
.section-subtitle {
  font-size: $uni-font-size-sm;
  color: $app-text-color-secondary;
  margin-top: $uni-spacing-col-sm;
}
.row-flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  > view {
    display: flex;
    flex-direction: column;
  }
}

// 列表标题
.list-title {
  font-size: $uni-font-size-lg;
  font-weight: bold;
  color: $uni-text-color;
  padding: $uni-spacing-row-lg $uni-spacing-row-lg 5px $uni-spacing-row-lg;
}

// 商品列表项
.item-row {
  display: flex;
  gap: $uni-spacing-row-lg;
}
.item-image {
  width: 80px;
  height: 80px;
  border-radius: $uni-border-radius-base;
  flex-shrink: 0;
  background-color: #eee;
}
.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.item-name {
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.item-price {
  font-size: $uni-font-size-lg;
  color: $uni-text-color;
  font-weight: bold;
  margin-top: $uni-spacing-col-sm;
}
.item-quantity {
  display: flex;
  align-items: center;
  gap: $uni-spacing-row-base;
  margin-top: $uni-spacing-col-base;
  .quantity-label {
    font-size: $uni-font-size-base;
    color: $app-text-color-secondary;
  }
  :deep(.uni-numbox) {
    margin: 0;
  }
}
.item-actions {
  display: flex;
  justify-content: flex-start;
  gap: 20px;
  margin-top: $uni-spacing-row-lg;
  padding-top: $uni-spacing-row-lg;
  border-top: 1px solid $app-border-color-light;
}
.skipped-item-tag {
  display: flex;
  align-items: center;
  gap: $uni-spacing-row-sm;
  background-color: $app-color-success-bg;
  color: $app-color-success;
  font-size: $uni-font-size-sm;
  font-weight: 500;
  padding: $uni-spacing-col-sm $uni-spacing-col-base;
  border-radius: $uni-border-radius-base;
  margin-bottom: $uni-spacing-row-base;
  width: fit-content;
}

// 免运费卡
.free-shipping-card {
  .shipping-progress-text {
    font-size: $uni-font-size-base;
    font-weight: 500;
    color: $uni-text-color;
  }
}

// 订单总览
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: $uni-font-size-base;
  color: $app-text-color-secondary;
  margin-bottom: $uni-spacing-col-base;
}
.summary-divider {
  height: 1px;
  background-color: $app-border-color-light;
  margin: $uni-spacing-row-base 0;
}
.summary-total {
  font-size: $uni-font-size-lg;
  font-weight: bold;
  color: $uni-text-color;
}

// 促销代码
.promo-input {
  display: flex;
  gap: $uni-spacing-row-base;
  margin-top: $uni-spacing-row-sm;
  .input-field {
    flex: 1;
  }
  .btn-apply {
    flex-shrink: 0;
    width: 80px;
  }
}

// 地址
.address-details {
  display: flex;
  flex-direction: column;
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  margin-top: $uni-spacing-col-sm;
  text {
    line-height: 1.5;
  }
}

// 底部区域
.savings-banner {
  background-color: $app-color-info-bg;
  border: 1px solid #00a870;
  border-radius: $app-border-radius;
  padding: $uni-spacing-row-lg;
  margin: $uni-spacing-row-base;
  .savings-text {
    color: $app-color-success;
    font-size: $uni-font-size-base;
    font-weight: 500;
    text-align: center;
  }
}
.cancel-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  .cancel-prompt {
    font-size: $uni-font-size-base;
    color: $app-text-color-secondary;
    margin-bottom: $uni-spacing-row-base;
  }
  .btn-cancel-subscription {
    color: $app-color-danger;
    font-weight: 500;
  }
}

// 顶部成功横幅
.success-banner {
  display: flex;
  align-items: center;
  gap: $uni-spacing-row-base;
  background-color: $app-color-success-bg;
  color: $app-color-success;
  padding: $uni-spacing-col-lg $uni-spacing-row-lg;
  font-size: $uni-font-size-base;
  font-weight: 500;
  uni-icons:last-child {
    margin-left: auto;
  }
}

// --- 弹窗样式 ---
.popup-content {
  background-color: $uni-bg-color;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $uni-spacing-row-lg;
  border-bottom: 1px solid $app-border-color-light;
  .popup-title {
    font-size: $uni-font-size-lg;
    font-weight: bold;
    color: $uni-text-color;
  }
}
.popup-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.popup-text {
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  margin-bottom: $uni-spacing-row-lg;
}
.popup-text-small {
  font-size: $uni-font-size-sm;
  color: $app-text-color-secondary;
  margin-top: $uni-spacing-row-base;
}
.popup-date-box {
  background-color: $uni-bg-color-grey;
  border-radius: $app-border-radius;
  padding: $uni-spacing-row-lg;
  margin: $uni-spacing-row-lg 0;
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  .popup-date-label {
    font-size: $uni-font-size-sm;
    color: $app-text-color-secondary;
    display: block;
    margin-bottom: $uni-spacing-row-sm;
  }
  .popup-date-value {
    font-size: 20px;
    font-weight: bold;
    color: $uni-text-color;
  }
}
.popup-footer {
  display: flex;
  gap: $uni-spacing-row-base;
  padding: $uni-spacing-row-lg;
  border-top: 1px solid $app-border-color-light;
  > button {
    flex: 1;
  }
}
.popup-footer-column {
  display: flex;
  flex-direction: column;
  gap: $uni-spacing-row-base;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
  > button {
    width: 100%;
  }
}

// 居中弹窗特定样式
.popup-center {
  width: 90vw;
  max-width: 340px;
  border-radius: $uni-border-radius-lg;
  .popup-header {
    border-bottom: none;
    padding-bottom: 0;
  }
  .popup-footer-column {
    padding-top: 0;
  }
  .popup-item-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $uni-spacing-row-base;
    margin-bottom: $uni-spacing-row-lg;
  }
  .popup-item-image {
    width: 80px;
    height: 80px;
  }
  .popup-item-image-large {
    width: 120px;
    height: 120px;
  }
  .popup-item-name {
    font-size: $uni-font-size-base;
    font-weight: 500;
  }
}

// 频率弹窗
.popup-frequency {
  :deep(.uni-data-checklist .checklist-group) {
    padding: $uni-spacing-row-lg;
  }
  :deep(.uni-data-checklist .checklist-cell) {
    padding: $uni-spacing-col-lg 0;
    border-bottom: 1px solid $app-border-color-light;
    &:last-child {
      border-bottom: none;
    }
  }
}

// 日历弹窗
.popup-calendar {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
