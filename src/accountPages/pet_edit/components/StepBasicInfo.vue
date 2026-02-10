<template>
  <view class="step-basic-info">
    <!-- 头像上传 -->
    <view class="avatar-section" @click="chooseAvatar">
      <image class="avatar-preview" :src="modelValue.avatar || defaultAvatar" mode="aspectFill" />
      <view class="avatar-overlay">
        <uni-icons type="camera" size="28" color="#fff" />
      </view>
      <text class="avatar-tip">点击上传头像</text>
    </view>

    <!-- 表单 -->
    <view class="form-section">
      <view class="form-item">
        <text class="label required">宠物名称</text>
        <input
          :value="modelValue.name"
          class="input"
          :class="{ readonly: isNameLocked }"
          :placeholder="isNameLocked ? '' : '给宠物起个名字'"
          maxlength="20"
          :disabled="isNameLocked"
          @input="updateField('name', $event.detail.value)"
        />
      </view>

      <view class="form-item">
        <text class="label required">宠物类型</text>
        <view class="type-selector">
          <view
            class="type-option"
            :class="{
              active: modelValue.type === 'dog',
              disabled: isTypeLocked && modelValue.type !== 'dog',
            }"
            @click="selectType('dog')"
          >
            🐕 狗狗
          </view>
          <view
            class="type-option"
            :class="{
              active: modelValue.type === 'cat',
              disabled: isTypeLocked && modelValue.type !== 'cat',
            }"
            @click="selectType('cat')"
          >
            🐈 猫咪
          </view>
        </view>
      </view>

      <view class="form-item" @click="$emit('showBreedPicker')">
        <text class="label required">品种</text>
        <view class="picker-value">
          <text>{{ breedName || '请选择品种' }}</text>
          <uni-icons type="right" size="18" color="#999" />
        </view>
      </view>

      <view class="form-item" @click="$emit('showDatePicker')">
        <text class="label required">生日</text>
        <view class="picker-value">
          <text>{{ modelValue.birthday || '请选择生日' }}</text>
          <uni-icons type="right" size="18" color="#999" />
        </view>
      </view>

      <view class="form-item">
        <text class="label required">性别</text>
        <view class="gender-selector">
          <view
            class="gender-option male"
            :class="{ active: modelValue.gender === 'male' }"
            @click="updateField('gender', 'male')"
          >
            ♂ 公
          </view>
          <view
            class="gender-option female"
            :class="{ active: modelValue.gender === 'female' }"
            @click="updateField('gender', 'female')"
          >
            ♀ 母
          </view>
        </view>
      </view>

      <view class="form-item">
        <text class="label">是否绝育</text>
        <switch
          :checked="modelValue.neutered"
          @change="updateField('neutered', $event.detail.value)"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PetFormData, PetType } from '@/types/pet'

const props = defineProps<{
  modelValue: PetFormData
  breedName: string
  lockedType?: PetType | ''
  isEdit?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PetFormData]
  showBreedPicker: []
  showDatePicker: []
}>()

const defaultAvatar = 'https://placehold.co/200x200/f0f0f0/999?text=Pet'

const isTypeLocked = computed(() => !!props.lockedType || !!props.isEdit)
const isNameLocked = computed(() => !!props.isEdit)

// 使用计算属性包装，避免直接修改 props
const formData = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const updateField = (field: keyof PetFormData, value: any) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

const selectType = (type: PetType) => {
  // 如果类型被锁定，则不允许修改
  if (isTypeLocked.value) return
  updateField('type', type)
}

const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      updateField('avatar', res.tempFilePaths[0])
    },
  })
}
</script>

<style lang="scss" scoped>
.step-basic-info {
  padding: 20rpx;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  position: relative;

  .avatar-preview {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background-color: #f0f0f0;
  }

  .avatar-overlay {
    position: absolute;
    top: 40rpx;
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .avatar-tip {
    margin-top: 16rpx;
    font-size: 24rpx;
    color: #999;
  }
}

.form-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.form-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .label {
    font-size: 28rpx;
    color: #333;

    &.required::before {
      content: '*';
      color: #f56c6c;
      margin-right: 4rpx;
    }
  }

  .input {
    flex: 1;
    text-align: right;
    font-size: 28rpx;
    color: #333;

    &.readonly {
      color: #999;
      background-color: transparent;
    }
  }

  .picker-value {
    display: flex;
    align-items: center;
    gap: 8rpx;
    color: #666;
    font-size: 28rpx;
  }
}

.type-selector {
  display: flex;
  gap: 16rpx;

  .type-option {
    padding: 16rpx 32rpx;
    border-radius: 24rpx;
    font-size: 26rpx;
    background-color: #f5f5f5;
    color: #666;
    transition: all 0.2s;

    &.active {
      background-color: #004a99;
      color: #fff;
    }

    &.disabled {
      opacity: 0.4;
      pointer-events: none;
    }
  }
}

.gender-selector {
  display: flex;
  gap: 16rpx;

  .gender-option {
    padding: 16rpx 32rpx;
    border-radius: 24rpx;
    font-size: 26rpx;
    background-color: #f5f5f5;
    color: #666;
    transition: all 0.2s;

    &.male.active {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    &.female.active {
      background-color: #fce4ec;
      color: #c2185b;
    }
  }
}
</style>
