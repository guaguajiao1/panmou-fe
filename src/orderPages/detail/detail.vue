<template>
  <view class="order-detail-page">
    <CustomNavigationBar :title="statusText" />

    <scroll-view scroll-y class="detail-scroll">
      <!-- 加载中 -->
      <view v-if="isLoading" class="loading-container">
        <uni-load-more status="loading" />
      </view>

      <template v-else-if="order">
        <!-- 待付款状态头部 - 只显示倒计时 -->
        <view
          v-if="order.orderState === OrderState.PENDING && remainingSeconds > 0"
          class="countdown-header"
        >
          <text class="countdown-label">剩余支付时间：</text>
          <text class="countdown-time">{{ countdownText }}</text>
        </view>

        <!-- 物流信息 + 收货地址 (非待付款订单) -->
        <view
          v-if="order.orderState !== OrderState.PENDING"
          class="section-card logistics-address-section"
        >
          <!-- 物流信息 -->
          <view class="logistics-info" @click="goToLogistics">
            <view class="logistics-icon">
              <uni-icons type="checkbox-filled" size="24" color="#ff4d4f" />
            </view>
            <view class="logistics-content">
              <text class="logistics-status">{{ latestLogisticsStatus }}</text>
              <text class="logistics-desc">{{ latestLogisticsDesc }}</text>
            </view>
            <view class="logistics-arrow">
              <uni-icons type="right" size="18" color="#999" />
            </view>
          </view>

          <!-- 分隔线 -->
          <view class="section-divider"></view>

          <!-- 收货地址 -->
          <view class="address-info">
            <view class="address-dot"></view>
            <view class="address-content">
              <text class="address-detail">
                {{ order.shippingAddress?.fullLocation }} {{ order.shippingAddress?.address }}
              </text>
              <view class="address-contact">
                <text class="name">{{ order.shippingAddress?.receiver }}</text>
                <text class="phone">{{ order.shippingAddress?.contact }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 收货地址 (待付款订单 - 无物流) -->
        <view v-else class="section-card address-only-section">
          <view class="address-icon">
            <uni-icons type="location" size="20" :color="themeColor" />
          </view>
          <view class="address-info">
            <view class="address-contact">
              <text class="name">{{ order.shippingAddress?.receiver }}</text>
              <text class="phone">{{ order.shippingAddress?.contact }}</text>
            </view>
            <text class="address-detail">
              {{ order.shippingAddress?.fullLocation }} {{ order.shippingAddress?.address }}
            </text>
          </view>
        </view>

        <!-- 商品列表 -->
        <view class="section-card goods-section">
          <view class="section-title">
            <text>商品信息</text>
          </view>
          <view class="goods-list">
            <view v-for="item in order.items" :key="item.itemId" class="goods-item">
              <image :src="item.productImage" class="goods-image" mode="aspectFill" />
              <view class="goods-info">
                <text class="goods-name">{{ item.productName }}</text>
                <text class="goods-attrs">{{ item.skuAttrs }}</text>
                <view class="goods-price-row">
                  <text class="goods-price">¥{{ item.unitPrice }}</text>
                  <text class="goods-quantity">x{{ item.quantity }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 商品操作按钮 -->
          <view v-if="order.orderState === OrderState.COMPLETED" class="goods-actions">
            <button class="action-tag">评价晒单</button>
            <button class="action-tag">加购物车</button>
            <button class="action-tag">申请售后</button>
          </view>
        </view>

        <!-- 价格明细 -->
        <view class="section-card price-section">
          <view class="price-row">
            <text class="label">商品金额</text>
            <text class="value">¥{{ order.totalAmount }}</text>
          </view>
          <view class="price-row">
            <text class="label">运费</text>
            <text class="value">¥{{ order.shippingFee }}</text>
          </view>
          <view v-if="parseFloat(String(order.discountAmount)) > 0" class="price-row">
            <text class="label">优惠</text>
            <text class="value discount">-¥{{ order.discountAmount }}</text>
          </view>
          <view class="price-row total">
            <text class="label">实付款</text>
            <text class="value total-value">¥{{ order.payAmount }}</text>
          </view>
        </view>

        <!-- 订单信息 -->
        <view class="section-card info-section">
          <view class="info-row">
            <text class="label">订单编号</text>
            <view class="value-with-copy">
              <text class="value">{{ order.orderId }}</text>
              <text class="copy-btn" @click="copyOrderId">复制</text>
            </view>
          </view>
          <view class="info-row">
            <text class="label">下单时间</text>
            <text class="value">{{ formatTime(order.createdAt) }}</text>
          </view>
          <view v-if="order.payTime" class="info-row">
            <text class="label">支付时间</text>
            <text class="value">{{ formatTime(order.payTime) }}</text>
          </view>
          <view class="info-row">
            <text class="label">支付方式</text>
            <text class="value">{{ order.payChannel === 1 ? '支付宝' : '微信支付' }}</text>
          </view>
        </view>
      </template>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view v-if="order" class="footer-actions">
      <!-- 待付款 -->
      <template v-if="order.orderState === OrderState.PENDING">
        <view class="footer-right">
          <button class="footer-btn secondary" @click="cancelOrder">取消订单</button>
          <button class="footer-btn primary" @click="goToPay">去支付</button>
        </view>
      </template>

      <!-- 待发货 -->
      <template v-else-if="order.orderState === OrderState.PAID">
        <view class="footer-right">
          <button class="footer-btn secondary" @click="remindShip">提醒发货</button>
          <button class="footer-btn secondary" @click="viewLogistics">查看物流</button>
          <button class="footer-btn secondary" @click="applyRefund">退款</button>
        </view>
      </template>

      <!-- 待收货 -->
      <template v-else-if="order.orderState === OrderState.SHIPPED">
        <view class="footer-right">
          <button class="footer-btn secondary" @click="viewLogistics">查看物流</button>
          <button class="footer-btn secondary" @click="applyAftersale">申请售后</button>
        </view>
      </template>

      <!-- 已完成 -->
      <template v-else-if="order.orderState === OrderState.COMPLETED">
        <view class="footer-right">
          <button class="footer-btn secondary" @click="viewLogistics">查看物流</button>
          <button class="footer-btn secondary" @click="applyAftersale">售后</button>
          <button class="footer-btn secondary" @click="buyAgain">再次购买</button>
        </view>
      </template>

      <!-- 已取消 -->
      <template v-else-if="order.orderState === OrderState.CANCELLED">
        <view class="footer-right">
          <button class="footer-btn secondary" @click="buyAgain">再次购买</button>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { orderApi } from '@/api/order'
import { OrderState, OrderStateText } from '@/types/order-state'
import type { OrderDetail } from '@/types/order'

const themeColor = '#004a99'

// 状态
const orderId = ref('')
const order = ref<OrderDetail | null>(null)
const isLoading = ref(false)
const remainingSeconds = ref(0)

// 计算属性
const statusText = computed(() => {
  if (!order.value) return '订单详情'
  return OrderStateText[order.value.orderState] || '订单详情'
})

const statusClass = computed(() => {
  if (!order.value) return ''
  switch (order.value.orderState) {
    case OrderState.PENDING:
      return 'status-pending'
    case OrderState.PAID:
      return 'status-paid'
    case OrderState.SHIPPED:
      return 'status-shipped'
    case OrderState.COMPLETED:
      return 'status-completed'
    case OrderState.CANCELLED:
      return 'status-cancelled'
    default:
      return ''
  }
})

const statusIcon = computed(() => {
  if (!order.value) return 'info'
  switch (order.value.orderState) {
    case OrderState.PENDING:
      return 'wallet'
    case OrderState.PAID:
      return 'checkbox'
    case OrderState.SHIPPED:
      return 'cart'
    case OrderState.COMPLETED:
      return 'checkbox-filled'
    case OrderState.CANCELLED:
      return 'closeempty'
    default:
      return 'info'
  }
})

const countdownText = computed(() => {
  if (remainingSeconds.value <= 0) return ''
  const hours = Math.floor(remainingSeconds.value / 3600)
  const minutes = Math.floor((remainingSeconds.value % 3600) / 60)
  const seconds = remainingSeconds.value % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`
})

// 物流状态
const latestLogisticsStatus = computed(() => {
  if (!order.value) return '暂无物流信息'
  switch (order.value.orderState) {
    case OrderState.PAID:
      return '待发货'
    case OrderState.SHIPPED:
      return '运输中'
    case OrderState.COMPLETED:
      return '已签收'
    case OrderState.CANCELLED:
      return '已取消'
    default:
      return '暂无物流信息'
  }
})

const latestLogisticsDesc = computed(() => {
  if (!order.value) return ''
  if (order.value.shipments && order.value.shipments.length > 0) {
    const shipment = order.value.shipments[0]
    if (shipment.traces && shipment.traces.length > 0) {
      return shipment.traces[0].traceDesc
    }
    return `${shipment.carrierName} ${shipment.trackingNo}`
  }
  switch (order.value.orderState) {
    case OrderState.PAID:
      return '商家正在准备发货，请耐心等待'
    case OrderState.SHIPPED:
      return '您的订单已发出，请注意查收'
    case OrderState.COMPLETED:
      return '您的订单已签收，可对快递员的服务进行评价'
    default:
      return ''
  }
})

// 倒计时定时器
let countdownTimer: ReturnType<typeof setInterval> | null = null

const startCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  if (remainingSeconds.value > 0) {
    countdownTimer = setInterval(() => {
      if (remainingSeconds.value > 0) {
        remainingSeconds.value--
      } else {
        if (countdownTimer) {
          clearInterval(countdownTimer)
          countdownTimer = null
        }
      }
    }, 1000)
  }
}

// 清理定时器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})

// 跳转物流页面
const goToLogistics = () => {
  uni.navigateTo({ url: `/orderPages/logistics/logistics?id=${orderId.value}` })
}

// 加载订单详情
const loadOrder = async () => {
  if (!orderId.value) return

  isLoading.value = true
  try {
    const res = await orderApi.get(orderId.value)
    if (res && res.code === '0') {
      order.value = res.result
      if (res.result.countdown) {
        remainingSeconds.value = res.result.countdown
        startCountdown()
      }
    } else {
      uni.showToast({ title: res?.msg || '加载失败', icon: 'none' })
    }
  } catch (e) {
    console.error('加载订单详情失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

// 格式化时间
const formatTime = (isoString?: string) => {
  if (!isoString) return '-'
  const date = new Date(isoString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`
}

// 复制订单号
const copyOrderId = () => {
  uni.setClipboardData({
    data: orderId.value,
    success: () => {
      uni.showToast({ title: '已复制', icon: 'success' })
    },
  })
}

// 去支付
const goToPay = () => {
  uni.showToast({ title: '模拟支付成功', icon: 'success' })
  loadOrder()
}

// 取消订单
const cancelOrder = async () => {
  try {
    const { confirm } = await uni.showModal({
      title: '提示',
      content: '确定要取消此订单吗？',
    })
    if (!confirm) return

    const res = await orderApi.cancel(orderId.value)
    if (res && res.code === '0') {
      uni.showToast({ title: '订单已取消', icon: 'success' })
      loadOrder()
    } else {
      uni.showToast({ title: res?.msg || '取消失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '取消失败', icon: 'none' })
  }
}

// 确认收货
const confirmReceive = async () => {
  try {
    const { confirm } = await uni.showModal({
      title: '提示',
      content: '确定已收到商品吗？',
    })
    if (!confirm) return

    const res = await orderApi.confirm(orderId.value)
    if (res && res.code === '0') {
      uni.showToast({ title: '已确认收货', icon: 'success' })
      loadOrder()
    } else {
      uni.showToast({ title: res?.msg || '确认失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '确认失败', icon: 'none' })
  }
}

// 删除订单
const deleteOrder = async () => {
  try {
    const { confirm } = await uni.showModal({
      title: '提示',
      content: '确定要删除此订单吗？',
    })
    if (!confirm) return

    const res = await orderApi.delete(orderId.value)
    if (res && res.code === '0') {
      uni.showToast({ title: '订单已删除', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 1500)
    } else {
      uni.showToast({ title: res?.msg || '删除失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '删除失败', icon: 'none' })
  }
}

// 查看物流
const viewLogistics = () => {
  uni.navigateTo({ url: `/orderPages/logistics/logistics?id=${orderId.value}` })
}

// 联系客服
const contactService = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

// 申请售后
const applyAftersale = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

// 提醒发货
const remindShip = () => {
  uni.showToast({ title: '已提醒卖家发货', icon: 'success' })
}

// 申请退款
const applyRefund = () => {
  uni.showToast({ title: '退款功能开发中', icon: 'none' })
}

// 再次购买
const buyAgain = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

// 页面加载
onLoad((options) => {
  if (options?.id) {
    orderId.value = options.id
    loadOrder()
  }
})
</script>

<style lang="scss" scoped>
.order-detail-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.detail-scroll {
  flex: 1;
  padding-bottom: 180rpx;
}

.loading-container {
  padding: 100rpx 0;
}

// 待付款倒计时头部
.countdown-header {
  background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
  padding: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  .countdown-label {
    font-size: 28rpx;
    color: #fff;
  }

  .countdown-time {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
    margin-left: 8rpx;
  }
}

// 物流+地址组合卡片
.logistics-address-section {
  padding: 0;

  .logistics-info {
    display: flex;
    align-items: center;
    padding: 24rpx;
    cursor: pointer;

    .logistics-icon {
      margin-right: 20rpx;
    }

    .logistics-content {
      flex: 1;

      .logistics-status {
        font-size: 32rpx;
        font-weight: 600;
        color: #ff4d4f;
        display: block;
      }

      .logistics-desc {
        font-size: 26rpx;
        color: #666;
        margin-top: 8rpx;
        display: block;
      }
    }

    .logistics-arrow {
      margin-left: 16rpx;
    }
  }

  .section-divider {
    height: 1rpx;
    background-color: #f0f0f0;
    margin: 0 24rpx;
  }

  .address-info {
    display: flex;
    padding: 24rpx;

    .address-dot {
      width: 16rpx;
      height: 16rpx;
      background-color: #ff4d4f;
      border-radius: 50%;
      margin-right: 20rpx;
      margin-top: 8rpx;
      flex-shrink: 0;
    }

    .address-content {
      flex: 1;

      .address-detail {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
        display: block;
        line-height: 1.4;
      }

      .address-contact {
        margin-top: 12rpx;

        .name {
          font-size: 26rpx;
          color: #666;
          margin-right: 20rpx;
        }

        .phone {
          font-size: 26rpx;
          color: #666;
        }
      }
    }
  }
}

// 待付款地址卡片 (无物流)
.address-only-section {
  display: flex;
  padding: 24rpx;

  .address-icon {
    margin-right: 20rpx;
    padding-top: 4rpx;
  }

  .address-info {
    flex: 1;

    .address-contact {
      margin-bottom: 12rpx;

      .name {
        font-size: 30rpx;
        font-weight: 600;
        margin-right: 20rpx;
      }

      .phone {
        font-size: 28rpx;
        color: #999;
      }
    }

    .address-detail {
      font-size: 26rpx;
      color: #666;
      line-height: 1.5;
    }
  }
}

// 通用卡片样式
.section-card {
  background-color: #fff;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 24rpx;
}

// 收货地址
.address-section {
  display: flex;

  .address-icon {
    margin-right: 20rpx;
    padding-top: 4rpx;
  }

  .address-info {
    flex: 1;

    .address-contact {
      margin-bottom: 12rpx;

      .name {
        font-size: 30rpx;
        font-weight: 600;
        margin-right: 20rpx;
      }

      .phone {
        font-size: 28rpx;
        color: $uni-text-color-grey;
      }
    }

    .address-detail {
      font-size: 26rpx;
      color: $uni-text-color-grey;
      line-height: 1.5;
    }
  }
}

// 商品列表
.goods-section {
  .section-title {
    font-size: 28rpx;
    font-weight: 600;
    margin-bottom: 16rpx;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid #f0f0f0;
  }

  .goods-item {
    display: flex;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    .goods-image {
      width: 160rpx;
      height: 160rpx;
      border-radius: 8rpx;
      background-color: #f5f5f5;
      flex-shrink: 0;
      margin-right: 20rpx;
    }

    .goods-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .goods-name {
        font-size: 28rpx;
        color: $uni-text-color;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }

      .goods-attrs {
        font-size: 24rpx;
        color: $uni-text-color-grey;
        margin-top: 8rpx;
      }

      .goods-price-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12rpx;

        .goods-price {
          font-size: 28rpx;
          color: $uni-text-color;
        }

        .goods-quantity {
          font-size: 26rpx;
          color: $uni-text-color-grey;
        }
      }
    }
  }

  .goods-actions {
    display: flex;
    justify-content: flex-end;
    gap: 16rpx;
    margin-top: 20rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid #f0f0f0;

    .action-tag {
      padding: 10rpx 24rpx;
      font-size: 24rpx;
      color: $uni-text-color-grey;
      background-color: #fff;
      border: 1rpx solid #ddd;
      border-radius: 24rpx;
      margin: 0;

      &::after {
        display: none;
      }
    }
  }
}

// 价格明细
.price-section {
  .price-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12rpx 0;

    .label {
      font-size: 28rpx;
      color: $uni-text-color-grey;
    }

    .value {
      font-size: 28rpx;
      color: $uni-text-color;

      &.discount {
        color: $uni-color-error;
      }
    }

    &.total {
      padding-top: 20rpx;
      border-top: 1rpx solid #f0f0f0;
      margin-top: 8rpx;

      .label {
        font-size: 30rpx;
        color: $uni-text-color;
      }

      .total-value {
        font-size: 36rpx;
        font-weight: 600;
        color: $uni-color-error;
      }
    }
  }
}

// 订单信息
.info-section {
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12rpx 0;

    .label {
      font-size: 26rpx;
      color: $uni-text-color-grey;
    }

    .value {
      font-size: 26rpx;
      color: $uni-text-color;
    }

    .value-with-copy {
      display: flex;
      align-items: center;

      .copy-btn {
        font-size: 24rpx;
        color: $uni-color-primary;
        margin-left: 16rpx;
      }
    }
  }
}

// 底部操作栏
.footer-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

  .footer-left {
    display: flex;
    gap: 16rpx;
  }

  .footer-right {
    display: flex;
    gap: 16rpx;
  }

  .footer-btn {
    padding: 16rpx 36rpx;
    border-radius: 40rpx;
    font-size: 28rpx;
    margin: 0;

    &::after {
      display: none;
    }

    &.secondary {
      background-color: #fff;
      color: #333;
      border: 1rpx solid #ddd;
    }

    &.primary {
      background-color: $uni-color-primary;
      color: #fff;
      border: none;
    }
  }
}
</style>
