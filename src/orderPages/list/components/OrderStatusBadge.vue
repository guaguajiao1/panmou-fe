<template>
  <view class="order-status-badge" :class="statusClass">
    <text class="status-text">{{ statusText }}</text>
    <text v-if="showCountdown && countdown > 0" class="countdown">
      {{ countdownText }}
    </text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { OrderState, OrderStateText } from '@/types/order-state'

const props = defineProps<{
  orderState: OrderState
  countdown?: number
}>()

const remainingSeconds = ref(props.countdown || 0)
let timer: number | null = null

const showCountdown = computed(() => {
  return props.orderState === OrderState.PENDING && remainingSeconds.value > 0
})

const countdownText = computed(() => {
  if (remainingSeconds.value <= 0) return ''
  const hours = Math.floor(remainingSeconds.value / 3600)
  const minutes = Math.floor((remainingSeconds.value % 3600) / 60)
  const seconds = remainingSeconds.value % 60
  if (hours > 0) {
    return `${hours}小时${minutes.toString().padStart(2, '0')}分钟`
  }
  return `${minutes}分${seconds.toString().padStart(2, '0')}秒`
})

const statusText = computed(() => {
  return OrderStateText[props.orderState] || '未知状态'
})

const statusClass = computed(() => {
  switch (props.orderState) {
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
    case OrderState.REFUNDING:
    case OrderState.REFUNDED:
      return 'status-refund'
    default:
      return ''
  }
})

onMounted(() => {
  if (showCountdown.value) {
    timer = setInterval(() => {
      if (remainingSeconds.value > 0) {
        remainingSeconds.value--
      } else {
        if (timer) clearInterval(timer)
      }
    }, 1000) as unknown as number
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style lang="scss" scoped>
.order-status-badge {
  display: inline-flex;
  align-items: center;
  font-size: 28rpx;
  font-weight: 500;

  .status-text {
    margin-right: 10rpx;
  }

  .countdown {
    color: $uni-color-error;
    font-size: 24rpx;
  }

  &.status-pending {
    color: #ff6b00;
  }

  &.status-paid {
    color: $uni-color-primary;
  }

  &.status-shipped {
    color: #07c160;
  }

  &.status-completed {
    color: $uni-text-color-grey;
  }

  &.status-cancelled {
    color: $uni-text-color-grey;
  }

  &.status-refund {
    color: $uni-color-warning;
  }
}
</style>
