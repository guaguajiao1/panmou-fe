<template>
  <view class="step-activity">
    <view class="step-header">
      <text class="step-title">{{ petName }}的活动水平</text>
      <text class="step-desc">{{
        petType === 'dog' ? '告诉我们TA平时有多活跃' : '告诉我们TA平时有多好动'
      }}</text>
    </view>

    <!-- 四宫格选择 -->
    <view class="activity-grid">
      <view
        v-for="option in activityOptions"
        :key="option.value"
        class="activity-option"
        :class="{ active: modelValue.activityLevel === option.value }"
        @click="updateField('activityLevel', option.value)"
      >
        <image class="activity-image" :src="option.image" mode="aspectFit" />
        <text class="activity-label">{{ option.label }}</text>
        <text class="activity-sublabel">{{ option.sublabel }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PetFormData, ActivityLevel, PetType } from '@/types/pet'

const props = defineProps<{
  modelValue: PetFormData
  petName: string
  petType: PetType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PetFormData]
}>()

const basePath = '/static/pet-wizard'

const activityOptions = computed<
  { value: ActivityLevel; image: string; label: string; sublabel: string }[]
>(() => {
  const type = props.petType
  const isDog = type === 'dog'

  return [
    {
      value: 'low',
      image: `${basePath}/${type}_activity_low.svg`,
      label: 'Not Very Active',
      sublabel: isDog ? '只有我回家时才会动' : '喜欢睡觉和休息',
    },
    {
      value: 'moderate',
      image: `${basePath}/${type}_activity_moderate.svg`,
      label: 'Active',
      sublabel: isDog ? '喜欢玩耍' : '好奇心强',
    },
    {
      value: 'high',
      image: `${basePath}/${type}_activity_high.svg`,
      label: 'Very Active',
      sublabel: isDog ? '每天需要大量运动' : '喜欢追逐玩耍',
    },
    {
      value: 'athlete',
      image: `${basePath}/${type}_activity_athlete.svg`,
      label: 'Pro Athlete',
      sublabel: isDog ? '每天慢跑或长时间散步' : '全天候奔跑跳跃',
    },
  ]
})

const updateField = (field: keyof PetFormData, value: any) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}
</script>

<style lang="scss" scoped>
.step-activity {
  padding: 20rpx;
}

.step-header {
  text-align: center;
  padding: 40rpx 20rpx;

  .step-title {
    display: block;
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 12rpx;
  }

  .step-desc {
    font-size: 26rpx;
    color: #666;
  }
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.activity-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 16rpx;
  border-radius: 16rpx;
  background-color: #fafafa;
  border: 2rpx solid #e8e8e8;
  transition: all 0.2s;

  &.active {
    background-color: #e8f4fd;
    border-color: #4a7c8a;
  }

  .activity-image {
    width: 140rpx;
    height: 100rpx;
    margin-bottom: 16rpx;
  }

  .activity-label {
    font-size: 24rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 4rpx;
  }

  .activity-sublabel {
    font-size: 20rpx;
    color: #999;
    text-align: center;
  }
}
</style>
