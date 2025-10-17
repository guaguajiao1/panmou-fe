<template>
  <view class="frequency-picker-wrapper">
    <picker mode="selector" :range="frequencyOptions" @change="onFrequencyChange">
      <view class="picker-view">
        <view class="picker-label">
          <text class="label-title">配送频率</text>
          <text class="label-value">{{ selectedFrequencyLabel }}</text>
        </view>
        <uni-icons type="bottom" size="16" color="#666"></uni-icons>
      </view>
    </picker>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import type { Subscription, SubscriptionFrequency } from '@/types/checkout'

const props = defineProps<{
  modelValue: SubscriptionFrequency | null
  recommendSubscriptions: Subscription[]
}>()

const emit = defineEmits(['update:modelValue'])

// Hardcoded frequency options
// FIX: Added `as const` to ensure TypeScript infers the unit as a literal type ('WEEK' | 'MONTH'), not a generic string.
const allFrequencies = ref<SubscriptionFrequency[]>([
  ...Array.from({ length: 16 }, (_, i) => ({ frequency: i + 1, unit: 'WEEK' as const })),
  ...Array.from({ length: 4 }, (_, i) => ({ frequency: i + 5, unit: 'MONTH' as const })),
])

// Options for the picker component (string array)
const frequencyOptions = computed(() =>
  allFrequencies.value.map((f) => `${f.frequency}${f.unit === 'WEEK' ? '周' : '个月'}`),
)

// The currently selected frequency object
const selectedFrequency = ref<SubscriptionFrequency | null>(props.modelValue)

// The display label for the selected frequency
const selectedFrequencyLabel = computed(() => {
  if (!selectedFrequency.value) return '请选择'
  const { frequency, unit } = selectedFrequency.value
  return `${frequency}${unit === 'WEEK' ? '周' : '个月'}`
})

// Handler for picker changes
const onFrequencyChange = (e: any) => {
  const index = e.detail.value
  const newFrequency = allFrequencies.value[index]
  if (newFrequency) {
    selectedFrequency.value = newFrequency
    emit('update:modelValue', newFrequency)
  }
}

// Watch for prop changes to determine the initial/default value
watch(
  () => props.recommendSubscriptions,
  (subs) => {
    if (!subs || subs.length === 0) {
      // Fallback to 4 weeks if no recommendations
      const fallback = { frequency: 4, unit: 'WEEK' as const }
      selectedFrequency.value = fallback
      emit('update:modelValue', fallback)
      return
    }

    // Find 'default' source
    const defaultSub = subs.find((s) => s.source === 'default')
    if (defaultSub) {
      selectedFrequency.value = defaultSub.subscriptionFrequency
      emit('update:modelValue', defaultSub.subscriptionFrequency)
      return
    }

    // Find 'recommend' source
    const recommendSub = subs.find((s) => s.source === 'recommend')
    if (recommendSub) {
      selectedFrequency.value = recommendSub.subscriptionFrequency
      emit('update:modelValue', recommendSub.subscriptionFrequency)
      return
    }
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.frequency-picker-wrapper {
  border: 1px solid #ddd;
  border-radius: 8rpx;
  padding: 16rpx;
  .picker-view {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .picker-label {
    .label-title {
      display: block;
      font-size: 22rpx;
      color: #999;
    }
    .label-value {
      font-size: 28rpx;
      color: #333;
    }
  }
}
</style>
