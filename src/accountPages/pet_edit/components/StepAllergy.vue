<template>
  <view class="step-allergy">
    <view class="step-header">
      <text class="step-title">{{ petName }}有食物过敏吗?</text>
      <text class="step-desc">我们会避免使用这些食材</text>
    </view>

    <!-- 有无过敏选择 -->
    <view class="allergy-switch">
      <view
        class="switch-option"
        :class="{ active: modelValue.hasFoodAllergies === false }"
        @click="updateHasAllergy(false)"
      >
        没有过敏
      </view>
      <view
        class="switch-option"
        :class="{ active: modelValue.hasFoodAllergies === true }"
        @click="updateHasAllergy(true)"
      >
        有过敏
      </view>
    </view>

    <!-- 过敏原列表 -->
    <view v-if="modelValue.hasFoodAllergies" class="allergen-section">
      <text class="section-title">请选择过敏的食物</text>
      <view class="allergen-grid">
        <view
          v-for="item in filteredAllergens"
          :key="item.id"
          class="allergen-item"
          :class="{ selected: modelValue.foodAllergyIds.includes(item.id) }"
          @click="toggleAllergen(item.id)"
        >
          <text class="allergen-name">{{ item.name }}</text>
          <view v-if="modelValue.foodAllergyIds.includes(item.id)" class="check-mark">
            <uni-icons type="checkmarkempty" size="18" color="#fff" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PetFormData, EnumItem, PetType } from '@/types/pet'

const props = defineProps<{
  modelValue: PetFormData
  petName: string
  petType: PetType
  allergens: EnumItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PetFormData]
}>()

// 根据宠物类型过滤过敏原（如果有petType标记的话）
const filteredAllergens = computed(() => {
  // 如果过敏原有petType属性，则按类型过滤，否则显示全部
  return props.allergens.filter((item) => {
    if ('petType' in item && item.petType) {
      return item.petType === props.petType || item.petType === 'all'
    }
    return true
  })
})

const updateHasAllergy = (value: boolean) => {
  emit('update:modelValue', {
    ...props.modelValue,
    hasFoodAllergies: value,
    foodAllergyIds: value ? props.modelValue.foodAllergyIds : [],
  })
}

const toggleAllergen = (id: string) => {
  const current = props.modelValue.foodAllergyIds || []
  const newIds = current.includes(id) ? current.filter((i) => i !== id) : [...current, id]
  emit('update:modelValue', { ...props.modelValue, foodAllergyIds: newIds })
}
</script>

<style lang="scss" scoped>
.step-allergy {
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

.allergy-switch {
  display: flex;
  background-color: #f5f5f5;
  border-radius: 16rpx;
  padding: 8rpx;
  margin-bottom: 24rpx;

  .switch-option {
    flex: 1;
    text-align: center;
    padding: 24rpx;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #666;
    transition: all 0.2s;

    &.active {
      background-color: #fff;
      color: #333;
      font-weight: 600;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
    }
  }
}

.allergen-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;

  .section-title {
    display: block;
    font-size: 26rpx;
    color: #666;
    margin-bottom: 20rpx;
  }
}

.allergen-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.allergen-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  background-color: #f8f8f8;
  border-radius: 32rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;

  &.selected {
    background-color: #004a99;
    border-color: #004a99;

    .allergen-name {
      color: #fff;
    }
  }

  .allergen-name {
    font-size: 26rpx;
    color: #333;
  }

  .check-mark {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
