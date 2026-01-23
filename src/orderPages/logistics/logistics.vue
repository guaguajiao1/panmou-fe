<template>
  <view class="logistics-page">
    <CustomNavigationBar title="物流详情" />

    <scroll-view scroll-y class="logistics-scroll">
      <!-- 加载中 -->
      <view v-if="isLoading" class="loading-container">
        <uni-load-more status="loading" />
      </view>

      <template v-else-if="shipment">
        <!-- 快递信息头部 -->
        <view class="carrier-header">
          <view class="carrier-info">
            <image class="carrier-logo" :src="carrierLogo" mode="aspectFit" />
            <view class="carrier-detail">
              <text class="carrier-name">{{ shipment.carrierName }} {{ shipment.trackingNo }}</text>
            </view>
          </view>
          <view class="carrier-actions">
            <text class="action-btn" @click="copyTrackingNo">复制</text>
            <text class="action-divider">|</text>
            <text class="action-btn" @click="callCarrier">打电话</text>
          </view>
        </view>

        <!-- 物流时间线 -->
        <view class="timeline-section">
          <!-- 最新物流信息（高亮） -->
          <view v-if="traces.length > 0" class="timeline-item latest">
            <view class="timeline-dot active"></view>
            <view
              class="timeline-line"
              :class="{ hidden: !showAllTraces && traces.length <= 1 }"
            ></view>
            <view class="timeline-content">
              <view class="trace-header">
                <text class="trace-status">{{ latestStatus }}</text>
                <text class="trace-time">{{ formatTraceTime(traces[0]?.traceTime) }}</text>
              </view>
              <text class="trace-desc">{{ traces[0]?.traceDesc }}</text>
            </view>
          </view>

          <!-- 展开更多按钮 -->
          <view
            v-if="traces.length > 1 && !showAllTraces"
            class="expand-btn"
            @click="showAllTraces = true"
          >
            <view class="timeline-dot expand"></view>
            <text class="expand-text">查看更多物流明细</text>
            <uni-icons type="down" size="14" color="#666" />
          </view>

          <!-- 更多物流信息 -->
          <template v-if="showAllTraces">
            <view v-for="(trace, index) in traces.slice(1)" :key="index" class="timeline-item">
              <view class="timeline-dot"></view>
              <view class="timeline-line" :class="{ hidden: index === traces.length - 2 }"></view>
              <view class="timeline-content">
                <view class="trace-header">
                  <text v-if="trace.traceStatus" class="trace-status-text">{{
                    trace.traceStatus
                  }}</text>
                  <text class="trace-time">{{ formatTraceTime(trace.traceTime) }}</text>
                </view>
                <text class="trace-desc">{{ trace.traceDesc }}</text>
              </view>
            </view>

            <!-- 收起按钮 -->
            <view class="expand-btn" @click="showAllTraces = false">
              <view class="timeline-dot expand"></view>
              <text class="expand-text">收起更多物流明细</text>
              <uni-icons type="up" size="14" color="#666" />
            </view>
          </template>
        </view>

        <!-- 收货地址 -->
        <view class="address-section">
          <view class="address-icon">
            <uni-icons type="location" size="22" color="#333" />
          </view>
          <view class="address-content">
            <text class="address-title">送至 {{ addressShort }}</text>
            <view class="address-contact">
              <text class="name">{{ order?.shippingAddress?.receiver }}</text>
              <text class="phone">{{ maskedPhone }}</text>
              <text class="phone-tag">号码保护中</text>
            </view>
          </view>
        </view>
      </template>

      <!-- 无物流信息 -->
      <template v-else-if="!isLoading && order">
        <!-- 友好提示 -->
        <view class="no-logistics-section">
          <view class="no-logistics-icon">
            <uni-icons type="info" size="48" color="#999" />
          </view>
          <text class="no-logistics-text">暂无物流信息</text>
          <text class="no-logistics-desc">商品正在准备发货中，请耐心等待</text>
        </view>

        <!-- 收货地址 -->
        <view class="address-section">
          <view class="address-icon">
            <uni-icons type="location" size="22" color="#333" />
          </view>
          <view class="address-content">
            <text class="address-title">送至 {{ addressShort }}</text>
            <view class="address-contact">
              <text class="name">{{ order.shippingAddress?.receiver }}</text>
              <text class="phone">{{ maskedPhone }}</text>
              <text class="phone-tag">号码保护中</text>
            </view>
          </view>
        </view>
      </template>

      <!-- 完全无数据 -->
      <view v-else-if="!isLoading" class="empty-container">
        <text class="empty-text">暂无物流信息</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { orderApi } from '@/api/order'
import { OrderState } from '@/types/order-state'
import type { OrderDetail, Shipment, ShipmentTrace } from '@/types/order'

// 状态
const orderId = ref('')
const order = ref<OrderDetail | null>(null)
const shipment = ref<Shipment | null>(null)
const isLoading = ref(false)
const showAllTraces = ref(false)

// 物流轨迹
const traces = computed(() => {
  if (!shipment.value || !shipment.value.traces) return []
  // 按时间倒序排列
  return [...shipment.value.traces].sort((a, b) => {
    return new Date(b.traceTime).getTime() - new Date(a.traceTime).getTime()
  })
})

// 最新状态
const latestStatus = computed(() => {
  if (!order.value) return '物流信息'
  switch (order.value.orderState) {
    case OrderState.PAID:
      return '待发货'
    case OrderState.SHIPPED:
      return '运输中'
    case OrderState.COMPLETED:
      return '已签收'
    default:
      return '物流信息'
  }
})

// 快递logo
const carrierLogo = computed(() => {
  const code = shipment.value?.carrierCode?.toLowerCase() || ''
  // 可根据快递公司code返回对应logo
  return `https://placehold.co/60x60?text=${code.toUpperCase()}`
})

// 地址简写
const addressShort = computed(() => {
  if (!order.value?.shippingAddress) return ''
  const addr = order.value.shippingAddress
  // 提取最后一个地址部分
  return addr.address || addr.fullLocation?.split(' ').pop() || ''
})

// 隐藏手机号中间4位
const maskedPhone = computed(() => {
  const phone = order.value?.shippingAddress?.contact || ''
  if (phone.length >= 11) {
    return phone.slice(0, 3) + '****' + phone.slice(7)
  }
  return phone
})

// 格式化时间
const formatTraceTime = (isoString?: string) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

// 复制快递单号
const copyTrackingNo = () => {
  if (shipment.value?.trackingNo) {
    uni.setClipboardData({
      data: shipment.value.trackingNo,
      success: () => {
        uni.showToast({ title: '已复制', icon: 'success' })
      },
    })
  }
}

// 拨打快递电话
const callCarrier = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

// 加载物流信息
const loadLogistics = async () => {
  if (!orderId.value) return

  isLoading.value = true
  try {
    const res = await orderApi.getLogistics(orderId.value)
    if (res && res.code === '0') {
      order.value = res.result
      if (res.result.shipments && res.result.shipments.length > 0) {
        shipment.value = res.result.shipments[0]
      }
    } else {
      uni.showToast({ title: res?.msg || '加载失败', icon: 'none' })
    }
  } catch (e) {
    console.error('加载物流失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

// 页面加载
onLoad((options) => {
  if (options?.id) {
    orderId.value = options.id
    loadLogistics()
  }
})
</script>

<style lang="scss" scoped>
.logistics-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.logistics-scroll {
  flex: 1;
}

.loading-container {
  padding: 100rpx 0;
}

// 快递信息头部
.carrier-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;

  .carrier-info {
    display: flex;
    align-items: center;

    .carrier-logo {
      width: 60rpx;
      height: 60rpx;
      border-radius: 8rpx;
      margin-right: 16rpx;
    }

    .carrier-name {
      font-size: 28rpx;
      color: #333;
    }
  }

  .carrier-actions {
    display: flex;
    align-items: center;

    .action-btn {
      font-size: 26rpx;
      color: #666;
      padding: 8rpx 16rpx;
    }

    .action-divider {
      color: #ddd;
      margin: 0 8rpx;
    }
  }
}

// 物流时间线
.timeline-section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.timeline-item {
  display: flex;
  position: relative;
  padding-bottom: 30rpx;

  &.latest {
    .trace-status {
      color: #ff6b00;
      font-size: 32rpx;
      font-weight: 600;
    }

    .trace-desc {
      color: #333;
    }
  }

  .timeline-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    background-color: #ddd;
    margin-right: 24rpx;
    margin-top: 8rpx;
    flex-shrink: 0;
    z-index: 1;

    &.active {
      background-color: #ff6b00;
      width: 20rpx;
      height: 20rpx;
      margin-top: 6rpx;
    }

    &.expand {
      background-color: #fff;
      border: 2rpx solid #ddd;
    }
  }

  .timeline-line {
    position: absolute;
    left: 7rpx;
    top: 28rpx;
    bottom: 0;
    width: 2rpx;
    background-color: #e8e8e8;

    &.hidden {
      display: none;
    }
  }

  .timeline-content {
    flex: 1;

    .trace-header {
      display: flex;
      align-items: baseline;
      margin-bottom: 8rpx;

      .trace-status {
        font-size: 28rpx;
        color: #333;
        margin-right: 16rpx;
      }

      .trace-status-text {
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
        margin-right: 16rpx;
      }

      .trace-time {
        font-size: 24rpx;
        color: #999;
      }
    }

    .trace-desc {
      font-size: 26rpx;
      color: #666;
      line-height: 1.5;
    }
  }
}

.expand-btn {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  cursor: pointer;

  .timeline-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    background-color: #fff;
    border: 2rpx solid #ddd;
    margin-right: 24rpx;
    flex-shrink: 0;
  }

  .expand-text {
    font-size: 26rpx;
    color: #666;
    margin-right: 8rpx;
  }
}

// 收货地址
.address-section {
  display: flex;
  background-color: #fff;
  padding: 30rpx;

  .address-icon {
    margin-right: 20rpx;
    margin-top: 4rpx;
  }

  .address-content {
    flex: 1;

    .address-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
      display: block;
      margin-bottom: 12rpx;
    }

    .address-contact {
      display: flex;
      align-items: center;
      flex-wrap: wrap;

      .name {
        font-size: 26rpx;
        color: #666;
        margin-right: 16rpx;
      }

      .phone {
        font-size: 26rpx;
        color: #666;
        margin-right: 12rpx;
      }

      .phone-tag {
        font-size: 22rpx;
        color: #999;
        background-color: #f5f5f5;
        padding: 4rpx 12rpx;
        border-radius: 4rpx;
      }
    }
  }
}

// 无物流信息区域
.no-logistics-section {
  background-color: #fff;
  padding: 60rpx 30rpx;
  text-align: center;
  margin-bottom: 20rpx;

  .no-logistics-icon {
    margin-bottom: 20rpx;
  }

  .no-logistics-text {
    display: block;
    font-size: 32rpx;
    color: #333;
    font-weight: 500;
    margin-bottom: 12rpx;
  }

  .no-logistics-desc {
    display: block;
    font-size: 26rpx;
    color: #999;
  }
}

.empty-container {
  padding: 100rpx 0;
  text-align: center;

  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}
</style>
