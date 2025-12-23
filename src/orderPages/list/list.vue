<template>
  <view class="order-list-page">
    <CustomNavigationBar title="我的订单" />

    <!-- Tab 切换 -->
    <view class="tabs-container">
      <scroll-view scroll-x class="tabs-scroll">
        <view class="tabs">
          <view
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-item"
            :class="{ active: activeTab === tab.id }"
            @click="switchTab(tab.id)"
          >
            <text>{{ tab.text }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 订单列表 -->
    <scroll-view
      scroll-y
      class="order-scroll"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 加载中 -->
      <view v-if="isLoading && orders.length === 0" class="loading-container">
        <uni-load-more status="loading" />
      </view>

      <!-- 订单列表 -->
      <view v-else-if="orders.length > 0" class="order-list">
        <view
          v-for="order in orders"
          :key="order.orderId"
          class="order-card"
          @click="goToDetail(order.orderId)"
        >
          <!-- 订单头部 -->
          <view class="order-header">
            <text class="order-id">订单号: {{ order.orderId }}</text>
            <OrderStatusBadge :order-state="order.orderState" :countdown="order.countdown" />
          </view>

          <!-- 商品列表 -->
          <view class="order-items">
            <OrderItemCard v-for="item in order.items" :key="item.itemId" :item="item" />
          </view>

          <!-- 订单底部 -->
          <view class="order-footer">
            <view class="order-total">
              <text class="total-label">共{{ order.totalItemQuantity }}件</text>
              <text class="total-amount">
                实付：<text class="amount">¥{{ order.payAmount.toFixed(2) }}</text>
              </text>
            </view>

            <!-- 操作按钮 -->
            <view class="order-actions" @click.stop>
              <!-- 待付款 -->
              <template v-if="order.orderState === OrderState.PENDING">
                <button class="action-btn secondary" @click.stop="cancelOrder(order.orderId)">
                  取消订单
                </button>
                <button class="action-btn primary" @click.stop="goToPay(order.orderId)">
                  去支付
                </button>
              </template>

              <!-- 待发货 -->
              <template v-else-if="order.orderState === OrderState.PAID">
                <button class="action-btn secondary" @click.stop="cancelOrder(order.orderId)">
                  取消订单
                </button>
              </template>

              <!-- 待收货 -->
              <template v-else-if="order.orderState === OrderState.SHIPPED">
                <button class="action-btn secondary" @click.stop="viewLogistics(order.orderId)">
                  查看物流
                </button>
                <button class="action-btn primary" @click.stop="confirmReceive(order.orderId)">
                  确认收货
                </button>
              </template>

              <!-- 已完成/已取消 -->
              <template
                v-else-if="
                  order.orderState === OrderState.COMPLETED ||
                  order.orderState === OrderState.CANCELLED
                "
              >
                <button class="action-btn secondary" @click.stop="deleteOrder(order.orderId)">
                  删除订单
                </button>
                <button class="action-btn primary" @click.stop="buyAgain(order)">再次购买</button>
              </template>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-container">
        <image src="/static/images/empty-order.png" class="empty-image" mode="aspectFit" />
        <text class="empty-text">暂无订单</text>
        <button class="go-shopping" @click="goShopping">去逛逛</button>
      </view>

      <!-- 加载更多 -->
      <uni-load-more v-if="orders.length > 0" :status="loadMoreStatus" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { orderApi } from '@/api/order'
import { OrderState, orderStateList } from '@/types/order-state'
import type { OrderDetail } from '@/types/order'
import OrderItemCard from './components/OrderItemCard.vue'
import OrderStatusBadge from './components/OrderStatusBadge.vue'

// Tab 配置
const tabs = orderStateList

// 状态
const activeTab = ref(0)
const orders = ref<OrderDetail[]>([])
const isLoading = ref(false)
const isRefreshing = ref(false)
const page = ref(1)
const pageSize = 10
const total = ref(0)
const hasMore = ref(true)

// 加载更多状态
const loadMoreStatus = computed(() => {
  if (isLoading.value) return 'loading'
  if (!hasMore.value) return 'noMore'
  return 'more'
})

// 获取当前选中的 Tab 对应的订单状态
const currentOrderState = computed(() => {
  const tab = tabs.find((t) => t.id === activeTab.value)
  return tab?.state ?? null
})

// 加载订单列表
const loadOrders = async (reset = false) => {
  if (reset) {
    page.value = 1
    hasMore.value = true
  }

  if (!hasMore.value && !reset) return

  isLoading.value = true

  try {
    const res = await orderApi.list({
      page: page.value,
      pageSize,
      orderState: currentOrderState.value,
    })

    if (res && res.code === '0') {
      const result = res.result
      if (reset) {
        orders.value = result.items
      } else {
        orders.value.push(...result.items)
      }
      total.value = result.total
      hasMore.value = page.value < result.totalPages
      page.value++
    }
  } catch (e) {
    console.error('加载订单失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

// 切换 Tab
const switchTab = (tabId: number) => {
  if (activeTab.value === tabId) return
  activeTab.value = tabId
  loadOrders(true)
}

// 下拉刷新
const onRefresh = () => {
  isRefreshing.value = true
  loadOrders(true)
}

// 加载更多
const loadMore = () => {
  if (!isLoading.value && hasMore.value) {
    loadOrders()
  }
}

// 跳转订单详情
const goToDetail = (orderId: string) => {
  uni.navigateTo({ url: `/orderPages/detail/detail?id=${orderId}` })
}

// 去支付
const goToPay = (orderId: string) => {
  uni.showToast({ title: '模拟支付成功', icon: 'success' })
  loadOrders(true)
}

// 取消订单
const cancelOrder = async (orderId: string) => {
  try {
    const { confirm } = await uni.showModal({
      title: '提示',
      content: '确定要取消此订单吗？',
    })
    if (!confirm) return

    const res = await orderApi.cancel(orderId)
    if (res && res.code === '0') {
      uni.showToast({ title: '订单已取消', icon: 'success' })
      loadOrders(true)
    } else {
      uni.showToast({ title: res?.msg || '取消失败', icon: 'none' })
    }
  } catch (e) {
    console.error('取消订单失败', e)
    uni.showToast({ title: '取消失败', icon: 'none' })
  }
}

// 确认收货
const confirmReceive = async (orderId: string) => {
  try {
    const { confirm } = await uni.showModal({
      title: '提示',
      content: '确定已收到商品吗？',
    })
    if (!confirm) return

    const res = await orderApi.confirm(orderId)
    if (res && res.code === '0') {
      uni.showToast({ title: '已确认收货', icon: 'success' })
      loadOrders(true)
    } else {
      uni.showToast({ title: res?.msg || '确认失败', icon: 'none' })
    }
  } catch (e) {
    console.error('确认收货失败', e)
    uni.showToast({ title: '确认失败', icon: 'none' })
  }
}

// 删除订单
const deleteOrder = async (orderId: string) => {
  try {
    const { confirm } = await uni.showModal({
      title: '提示',
      content: '确定要删除此订单吗？删除后不可恢复。',
    })
    if (!confirm) return

    const res = await orderApi.delete(orderId)
    if (res && res.code === '0') {
      uni.showToast({ title: '订单已删除', icon: 'success' })
      loadOrders(true)
    } else {
      uni.showToast({ title: res?.msg || '删除失败', icon: 'none' })
    }
  } catch (e) {
    console.error('删除订单失败', e)
    uni.showToast({ title: '删除失败', icon: 'none' })
  }
}

// 查看物流
const viewLogistics = (orderId: string) => {
  uni.navigateTo({ url: `/orderPages/detail/detail?id=${orderId}&tab=logistics` })
}

// 再次购买
const buyAgain = (order: OrderDetail) => {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

// 去逛逛
const goShopping = () => {
  uni.switchTab({ url: '/pages/shop/shop' })
}

// 页面加载
onLoad((options) => {
  if (options?.state) {
    const stateNum = parseInt(options.state)
    const matchTab = tabs.find((t) => t.state === stateNum)
    if (matchTab) activeTab.value = matchTab.id
  }
})

onShow(() => {
  loadOrders(true)
})
</script>

<style lang="scss" scoped>
.order-list-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.tabs-container {
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
}

.tabs-scroll {
  white-space: nowrap;
}

.tabs {
  display: inline-flex;
  padding: 0 20rpx;

  .tab-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 24rpx 32rpx;
    font-size: 28rpx;
    color: $uni-text-color-grey;
    position: relative;

    &.active {
      color: $uni-color-primary;
      font-weight: 500;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60rpx;
        height: 4rpx;
        background-color: $uni-color-primary;
        border-radius: 2rpx;
      }
    }
  }
}

.order-scroll {
  flex: 1;
  padding: 20rpx;
}

.loading-container {
  padding: 100rpx 0;
}

.order-list {
  .order-card {
    background-color: #fff;
    border-radius: 16rpx;
    margin-bottom: 20rpx;
    overflow: hidden;

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24rpx 24rpx 0;

      .order-id {
        font-size: 24rpx;
        color: $uni-text-color-grey;
      }
    }

    .order-items {
      padding: 0 24rpx;
    }

    .order-footer {
      padding: 20rpx 24rpx 24rpx;
      border-top: 1rpx solid #f5f5f5;

      .order-total {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-bottom: 20rpx;

        .total-label {
          font-size: 24rpx;
          color: $uni-text-color-grey;
          margin-right: 20rpx;
        }

        .total-amount {
          font-size: 26rpx;
          color: $uni-text-color;

          .amount {
            font-size: 32rpx;
            font-weight: 600;
            color: $uni-color-error;
          }
        }
      }

      .order-actions {
        display: flex;
        justify-content: flex-end;
        gap: 16rpx;

        .action-btn {
          padding: 12rpx 28rpx;
          border-radius: 32rpx;
          font-size: 26rpx;
          line-height: 1.5;
          margin: 0;

          &::after {
            display: none;
          }

          &.secondary {
            background-color: #fff;
            color: $uni-text-color-grey;
            border: 1rpx solid #ddd;
          }

          &.primary {
            background-color: $uni-color-primary;
            color: #fff;
            border: none;
          }
        }
      }
    }
  }
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;

  .empty-image {
    width: 300rpx;
    height: 300rpx;
    margin-bottom: 40rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: $uni-text-color-grey;
    margin-bottom: 40rpx;
  }

  .go-shopping {
    padding: 16rpx 60rpx;
    background-color: $uni-color-primary;
    color: #fff;
    font-size: 28rpx;
    border-radius: 40rpx;
    border: none;

    &::after {
      display: none;
    }
  }
}
</style>
