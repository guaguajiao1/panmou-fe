<template>
  <view class="step-weight">
    <view class="step-header">
      <text class="step-title">{{ petName }}的体重信息</text>
      <text class="step-desc">帮助我们为TA计算最佳饮食方案</text>
    </view>

    <!-- 当前体重输入 -->
    <view class="weight-section">
      <view class="weight-item">
        <text class="weight-label">当前体重</text>
        <view class="weight-input-wrapper">
          <input
            type="digit"
            :value="modelValue.currentWeight"
            class="weight-input"
            placeholder="0.0"
            @input="updateField('currentWeight', parseFloat($event.detail.value) || undefined)"
          />
          <text class="weight-unit">kg</text>
        </view>
      </view>
    </view>

    <!-- 体型选择 (四宫格) -->
    <view class="body-section">
      <text class="section-title">{{ petName }}目前的体型是?</text>
      <view class="body-options">
        <view
          v-for="option in bodyOptions"
          :key="option.value"
          class="body-option"
          :class="{ active: modelValue.bodyCondition === option.value }"
          @click="updateField('bodyCondition', option.value)"
        >
          <image class="body-image" :src="option.image" mode="aspectFit" />
          <text class="body-label">{{ option.label }}</text>
          <text class="body-sublabel">{{ option.sublabel }}</text>
        </view>
      </view>
    </view>

    <!-- 理想体重输入 -->
    <view class="weight-section ideal-weight">
      <view class="weight-item">
        <text class="weight-label">理想体重</text>
        <view class="weight-input-wrapper">
          <input
            type="digit"
            :value="modelValue.idealWeight"
            class="weight-input"
            placeholder="0.0"
            @input="updateField('idealWeight', parseFloat($event.detail.value) || undefined)"
          />
          <text class="weight-unit">kg</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PetFormData, BodyCondition, PetType } from '@/types/pet'

const props = defineProps<{
  modelValue: PetFormData
  petName: string
  petType: PetType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PetFormData]
}>()

const basePath = '/static/pet-wizard'

const bodyOptions = computed<
  { value: BodyCondition; image: string; label: string; sublabel: string }[]
>(() => {
  const type = props.petType
  return [
    {
      value: 'thin',
      image: `${basePath}/${type}_body_thin.svg`,
      label: 'Too Skinny',
      sublabel: '太瘦了',
    },
    {
      value: 'ideal',
      image: `${basePath}/${type}_body_ideal.svg`,
      label: 'Just Right',
      sublabel: '恰到好处',
    },
    {
      value: 'chubby',
      image: `${basePath}/${type}_body_chubby.svg`,
      label: 'Rounded',
      sublabel: '圆角',
    },
    {
      value: 'overweight',
      image: `${basePath}/${type}_body_overweight.svg`,
      label: 'Chunky',
      sublabel: '胖胖的',
    },
  ]
})

const updateField = (field: keyof PetFormData, value: any) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}
</script>

<style lang="scss" scoped>
.step-weight {
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

.weight-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.weight-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;

  .weight-label {
    font-size: 28rpx;
    color: #333;
  }

  .weight-input-wrapper {
    display: flex;
    align-items: center;
    gap: 8rpx;

    .weight-input {
      width: 120rpx;
      text-align: right;
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }

    .weight-unit {
      font-size: 26rpx;
      color: #666;
    }
  }
}

.body-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;

  .section-title {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 24rpx;
    text-align: center;
  }
}

.body-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.body-option {
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

  .body-image {
    width: 140rpx;
    height: 100rpx;
    margin-bottom: 16rpx;
  }

  .body-label {
    font-size: 26rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 4rpx;
  }

  .body-sublabel {
    font-size: 22rpx;
    color: #999;
  }
}
</style>
