<template>
  <view class="subscription-list">
    <CustomNavigationBar title="订阅列表" />

    <view class="tabs-container">
      <button
        class="tab-button"
        :class="{ active: currentTab === 'active' }"
        @click="changeTab('active')"
      >
        生效中
      </button>
      <button
        class="tab-button"
        :class="{ active: currentTab === 'cancelled' }"
        @click="changeTab('cancelled')"
      >
        已取消
      </button>
    </view>

    <scroll-view scroll-y class="scroll-view-content">
      <view v-if="isLoading" class="loading-placeholder">
        <uni-load-more status="loading"></uni-load-more>
      </view>
      <view v-else-if="subscriptions.length === 0" class="empty-placeholder">
        <text>没有找到订阅信息</text>
      </view>

      <view
        v-else
        class="subscription-item"
        v-for="sub in subscriptions"
        :key="sub.subscription.id"
      >
        <text class="subscription-title">{{ sub.subscription.name }}</text>

        <view class="item-images-container">
          <view
            v-for="item in sub.subscription.items.slice(0, 10)"
            :key="item.id"
            class="item-image-wrapper"
          >
            <image :src="item.item.thumbnail" class="item-image" mode="aspectFill" />
          </view>
        </view>

        <!-- 添加商品数量和频率总结 -->
        <view class="item-summary-row">
          <text>
            每
            <text class="text-primary">{{
              getFrequencyInterval(sub.subscription.fulfillment.frequency)
            }}</text>
            {{ getFrequencyUnitStr(sub.subscription.fulfillment.frequency) }} 收到
            <text class="text-primary">{{ getTotalQuantity(sub.subscription.items) }}</text>
            件商品
          </text>
        </view>

        <!-- 更新下次订单文本和样式 -->
        <view class="info-row">
          <text class="info-label">下次订单:</text>
          <text class="info-value text-primary">{{
            formatSmartDate(sub.subscription.fulfillment.nextShipment)
          }}</text>
        </view>
        <!-- 更新收货地址文本 -->
        <view class="info-row">
          <text class="info-label">收货地址:</text>
          <text class="info-value">{{ sub.subscription.address.fullLocation }}</text>
        </view>

        <!-- @onclick 和按钮文字 -->
        <button class="edit-subscription" @click="goToSubscriptionDetail(sub.subscription.id)">
          编辑订阅
        </button>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { SimpleAutoshipData, Frequency, Item } from '@/types/subscription'
import { computed, ref } from 'vue'
import { subscriptionApi } from '@/api/subscription'
import { onLoad } from '@dcloudio/uni-app'

const fullMockData: Array<SimpleAutoshipData> = [
  // 生效中
  {
    subscription: {
      id: 'sub_001',
      name: '狗狗的每月补给 (生效中)',
      state: 'active',
      fulfillment: {
        frequency: { interval: 4, unit: 'Week' },
        nextShipment: '2025-12-15',
      },
      items: [
        {
          id: 'item_001',
          item: {
            id: 'p_001',
            name: '狗粮',
            quantity: 1,
            partNumber: '123',
            thumbnail: 'https://placehold.co/160x160/007aff/fff?text=1',
          },
        },
        {
          id: 'item_002',
          item: {
            id: 'p_002',
            name: '玩具',
            quantity: 2,
            partNumber: '124',
            thumbnail: 'https://placehold.co/160x160/4cd964/fff?text=2',
          },
        },
      ],
      address: {
        id: 'addr_001',
        receiver: '张三',
        contact: '13800138000',
        provinceCode: '310000',
        cityCode: '310100',
        countyCode: '310115',
        address: 'xxx路 123号',
        isDefault: 1,
        fullLocation: '上海市浦东新区 123号',
      },
    },
    currentUser: {
      lifetimeSavings: {
        amountSaved: { amount: 0, currency: 'USD' },
        savingsSinceMonths: 0,
        savingsSinceYear: 0,
      },
      isPullForwardOptOut: false,
    },
  },
  {
    subscription: {
      id: 'sub_003',
      name: '猫猫 (生效中)',
      state: 'active',
      fulfillment: {
        frequency: { interval: 4, unit: 'Week' },
        nextShipment: '2025-12-15',
      },
      items: [
        {
          id: 'item_001',
          item: {
            id: 'p_001',
            name: '狗粮',
            quantity: 1,
            partNumber: '123',
            thumbnail: 'https://placehold.co/160x160/007aff/fff?text=1',
          },
        },
        {
          id: 'item_002',
          item: {
            id: 'p_002',
            name: '玩具',
            quantity: 2,
            partNumber: '124',
            thumbnail: 'https://placehold.co/160x160/4cd964/fff?text=2',
          },
        },
      ],
      address: {
        id: 'addr_001',
        receiver: '张三',
        contact: '13800138000',
        provinceCode: '310000',
        cityCode: '310100',
        countyCode: '310115',
        address: 'xxx路 123号',
        isDefault: 1,
        fullLocation: '上海市浦东新区 123号',
      },
    },
    currentUser: {
      lifetimeSavings: {
        amountSaved: { amount: 0, currency: 'USD' },
        savingsSinceMonths: 0,
        savingsSinceYear: 0,
      },
      isPullForwardOptOut: false,
    },
  },
  // 已取消
  {
    subscription: {
      id: 'sub_002',
      name: '猫咪的零食 (已取消)',
      state: 'cancelled',
      fulfillment: {
        frequency: { interval: 8, unit: 'Week' },
        nextShipment: '2025-10-01',
      },
      items: [
        {
          id: 'item_003',
          item: {
            id: 'p_003',
            name: '猫条',
            quantity: 5,
            partNumber: '125',
            thumbnail: 'https://placehold.co/160x160/f0ad4e/fff?text=3',
          },
        },
      ],
      address: {
        id: 'addr_002',
        receiver: '李四',
        contact: '13900139000',
        provinceCode: '440000',
        cityCode: '440100',
        countyCode: '440106',
        address: 'yyy路 456号',
        isDefault: 0,
        fullLocation: '广东省广州市天河区 456号',
      },
    },
    currentUser: {
      lifetimeSavings: {
        amountSaved: { amount: 10, currency: 'USD' },
        savingsSinceMonths: 0,
        savingsSinceYear: 0,
      },
      isPullForwardOptOut: false,
    },
  },
]

const subscriptions = ref<Array<SimpleAutoshipData>>([])
// 当前 Tab 状态
const currentTab = ref('active')
// 加载状态
const isLoading = ref(true)

onLoad((optionss) => {
  changeTab(currentTab.value, true) // 传入 true 表示首次加载
  // getSubscriptions(currentTab.value)
})

function getFrequencyInterval(frequency: Frequency) {
  return frequency.interval
}
function getFrequencyUnitStr(frequency: Frequency) {
  if (!frequency) return ''
  return frequency.unit === 'Week' ? '周' : frequency.unit === 'Mon' ? '个月' : frequency.unit
}

// 计算商品总数
function getTotalQuantity(items: SimpleAutoshipData['subscription']['items']): number {
  if (!items) return 0
  return items.reduce((sum, item) => sum + (item.item.quantity || 0), 0)
}

// 格式化日期 (使用 subscription.vue 的智能日期格式)
function formatSmartDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()

  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }

  if (date.getFullYear() !== now.getFullYear()) {
    options.year = 'numeric'
  }

  const datePart = date.toLocaleDateString('zh-CN', options)
  const weekdayPart = date.toLocaleDateString('zh-CN', { weekday: 'long', timeZone: 'UTC' })

  return `${datePart} ${weekdayPart}`
}

// 跳转到详情页
const goToSubscriptionDetail = (id: string) => {
  uni.navigateTo({
    url: `/pages/subscription/subscription?id=${id}`,
  })
}

// 切换 Tab 并加载数据
function changeTab(newTab: 'active' | 'cancelled', isFirstLoad = false) {
  if (currentTab.value === newTab && !isFirstLoad) return
  currentTab.value = newTab

  // 清空旧数据，显示加载状态
  isLoading.value = true
  subscriptions.value = []

  setTimeout(() => {
    subscriptions.value = fullMockData.filter(
      (sub) => sub.subscription.state.toLowerCase() === newTab.toLowerCase(),
    )
    isLoading.value = false
  }, 300) // 模拟网络延迟

  // getSubscriptions(newTab)
}

// 获取订阅列表
async function getSubscriptions(state: string) {
  isLoading.value = true
  try {
    // [MODIFIED] 2. 注释掉 API 调用
    // const res = (await subscriptionApi.getSubscriptions(state)) as any // 假设的 API 响应类型
    // if (res.code === '0') {
    //   subscriptions.value = res.result as Array<SimpleAutoshipData>
    // } else {
    //   console.error('Failed to fetch subscriptions:', res.msg)
    //   uni.showToast({ title: res.msg || '加载失败', icon: 'none' })
    // }
  } catch (error: any) {
    console.error('Failed to fetch subscriptions:', error)
    uni.showToast({ title: '加载订阅列表失败', icon: 'none' })
  } finally {
    // isLoading.value = false
  }
}
</script>

<style lang="scss">
.tabs-container {
  display: flex;
  gap: $uni-spacing-row-lg;
  padding: $uni-spacing-col-base $uni-spacing-row-lg;
  background-color: $uni-bg-color;
  border-bottom: 1px solid $uni-border-color;

  --nav-height: 88rpx;
  --tabs-height: 86rpx; /* 70rpx + (padding * 2) */
}
.tab-button {
  width: 187.5rpx;
  font-size: $uni-font-size-base;
  height: 70rpx;
  line-height: 70rpx;
  border-radius: 35rpx;
  margin: 0;
  padding: 0;

  background-color: $uni-bg-color-grey;
  color: $uni-text-color;
  border: 1px solid $uni-border-color;

  &::after {
    border: none;
  }

  &.active {
    background-color: $uni-color-primary;
    color: $uni-text-color-inverse;
    border-color: $uni-color-primary;
  }
}

.scroll-view-content {
  box-sizing: border-box;
  display: block;
  /* #ifdef H5 */
  height: calc(100vh - var(--nav-height));
  /* #endif */
  /* #ifdef MP-WEIXIN */
  height: calc(100vh - var(--nav-height) - env(safe-area-inset-bottom));
  /* #endif */
}

.loading-placeholder,
.empty-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 100rpx;
  color: $uni-text-color-grey;
}

.subscription-item {
  background-color: $uni-bg-color;
  padding: $uni-spacing-col-lg $uni-spacing-row-lg;
  border-top: 1px solid $uni-border-color;
}

.subscription-title {
  display: block;
  font-size: $uni-font-size-lg;
  font-weight: bold;
  color: $uni-text-color;
  margin-bottom: $uni-spacing-col-sm;
}
.subscription-frequency {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-text-color-grey;
}

.item-images-container {
  display: flex;
  flex-wrap: wrap;
  gap: $uni-spacing-row-base;
  margin: $uni-spacing-col-lg 0;
}

.item-image-wrapper {
  position: relative;
  height: 0;

  $gap: 20rpx;
  $columns: 5;
  width: calc((100% - ($gap * ($columns - 1))) / $columns);
  padding-top: calc((100% - ($gap * ($columns - 1))) / $columns);

  border-radius: $uni-border-radius-base;
  background-color: $uni-bg-color-grey;
  overflow: hidden;
}

.item-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: $uni-border-radius-base;
}

.item-summary-row {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-text-color-grey;
  margin-top: $uni-spacing-col-lg;
  padding-top: $uni-spacing-col-lg;
  border-top: 1px solid $uni-bg-color-grey;
}

.text-primary {
  color: $uni-color-primary;
  font-weight: 500;
}

.info-row {
  display: flex;
  font-size: $uni-font-size-sm;
  color: $uni-text-color-grey;
  margin-top: $uni-spacing-col-sm;

  .info-label {
    flex-shrink: 0;
    margin-right: $uni-spacing-row-sm;
  }
  .info-value {
    color: $uni-text-color;
    font-weight: 500;

    &.text-primary {
      color: $uni-color-primary;
      font-weight: 500;
    }
  }
}

.edit-subscription {
  margin-top: $uni-spacing-col-lg;
  background-color: $uni-color-primary;
  color: $uni-text-color-inverse;
  font-size: $uni-font-size-base;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  width: 100%;
}
</style>
