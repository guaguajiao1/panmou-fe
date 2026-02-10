<template>
  <view class="step-health">
    <view class="step-header">
      <text class="step-title">{{ petName }}有健康问题吗?</text>
      <text class="step-desc">我们会根据情况调整营养配方</text>
    </view>

    <!-- 有无健康问题选择 -->
    <view class="health-switch">
      <view
        class="switch-option"
        :class="{ active: modelValue.hasHealthIssues === false }"
        @click="updateHasIssues(false)"
      >
        没有问题
      </view>
      <view
        class="switch-option"
        :class="{ active: modelValue.hasHealthIssues === true }"
        @click="updateHasIssues(true)"
      >
        有健康问题
      </view>
    </view>

    <!-- 健康问题列表 -->
    <view v-if="modelValue.hasHealthIssues" class="issue-section">
      <text class="section-title">请选择相关的健康问题</text>
      <view class="issue-list">
        <view
          v-for="item in filteredHealthIssues"
          :key="item.id"
          class="issue-item"
          :class="{ selected: modelValue.healthIssueIds.includes(item.id) }"
          @click="toggleIssue(item.id)"
        >
          <text class="issue-name">{{ item.name }}</text>
          <view class="issue-check">
            <uni-icons
              :type="modelValue.healthIssueIds.includes(item.id) ? 'checkbox-filled' : 'circle'"
              size="24"
              :color="modelValue.healthIssueIds.includes(item.id) ? '#004a99' : '#ccc'"
            />
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
  healthIssues: EnumItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PetFormData]
}>()

// 根据宠物类型过滤健康问题（如果有petType标记的话）
const filteredHealthIssues = computed(() => {
  // 如果健康问题有petType属性，则按类型过滤，否则显示全部
  return props.healthIssues.filter((item) => {
    if ('petType' in item && item.petType) {
      return item.petType === props.petType || item.petType === 'all'
    }
    return true
  })
})

const updateHasIssues = (value: boolean) => {
  emit('update:modelValue', {
    ...props.modelValue,
    hasHealthIssues: value,
    healthIssueIds: value ? props.modelValue.healthIssueIds : [],
  })
}

const toggleIssue = (id: string) => {
  const current = props.modelValue.healthIssueIds || []
  const newIds = current.includes(id) ? current.filter((i) => i !== id) : [...current, id]
  emit('update:modelValue', { ...props.modelValue, healthIssueIds: newIds })
}
</script>

<style lang="scss" scoped>
.step-health {
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

.health-switch {
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

.issue-section {
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

.issue-list {
  display: flex;
  flex-direction: column;
}

.issue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  &.selected {
    .issue-name {
      color: #004a99;
      font-weight: 500;
    }
  }

  .issue-name {
    font-size: 28rpx;
    color: #333;
  }

  .issue-check {
    flex-shrink: 0;
  }
}
</style>
