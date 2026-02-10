<template>
  <view class="step-picky">
    <view class="step-header">
      <text class="step-title">吃饭时，{{ petName }}是……</text>
      <text class="step-desc">帮助我们为TA推荐合适的食谱</text>
    </view>

    <!-- 四宫格选择 -->
    <view class="picky-grid">
      <view
        v-for="option in pickyOptions"
        :key="option.value"
        class="picky-option"
        :class="{ active: modelValue.pickyLevel === option.value }"
        @click="updateField('pickyLevel', option.value)"
      >
        <image class="picky-image" :src="option.image" mode="aspectFit" />
        <text class="picky-label">{{ option.label }}</text>
        <text class="picky-sublabel">{{ option.sublabel }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PetFormData, PickyLevel, PetType } from '@/types/pet'

const props = defineProps<{
  modelValue: PetFormData
  petName: string
  petType: PetType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PetFormData]
}>()

const basePath = '/static/pet-wizard'

const pickyOptions = computed<
  { value: PickyLevel; image: string; label: string; sublabel: string }[]
>(() => {
  const type = props.petType
  return [
    {
      value: 'very_picky',
      image: `${basePath}/${type}_picky_very.svg`,
      label: 'Very Picky',
      sublabel: '非常挑剔',
    },
    {
      value: 'sometimes',
      image: `${basePath}/${type}_picky_sometimes.svg`,
      label: 'Can Be Picky',
      sublabel: '有时候会挑剔',
    },
    {
      value: 'foodie',
      image: `${basePath}/${type}_picky_foodie.svg`,
      label: 'Good Eater',
      sublabel: '好吃货',
    },
    {
      value: 'eats_all',
      image: `${basePath}/${type}_picky_all.svg`,
      label: 'Will Eat Anything',
      sublabel: '什么都吃',
    },
  ]
})

const updateField = (field: keyof PetFormData, value: any) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}
</script>

<style lang="scss" scoped>
.step-picky {
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

.picky-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.picky-option {
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

  .picky-image {
    width: 140rpx;
    height: 100rpx;
    margin-bottom: 16rpx;
  }

  .picky-label {
    font-size: 24rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 4rpx;
  }

  .picky-sublabel {
    font-size: 20rpx;
    color: #999;
    text-align: center;
  }
}
</style>
