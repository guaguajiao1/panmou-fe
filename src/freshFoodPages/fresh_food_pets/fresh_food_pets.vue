<template>
  <view class="fresh-food-pets-page">
    <CustomNavigationBar :title="pageTitle" show-back />

    <view class="page-header">
      <text class="title">为哪只{{ petTypeName }}定制鲜食？</text>
      <text class="desc">选择一只{{ petTypeName }}开始定制专属饮食方案</text>
    </view>

    <!-- 宠物列表 -->
    <scroll-view scroll-y class="pet-scroll">
      <view v-if="isLoading" class="loading-container">
        <uni-load-more status="loading" />
      </view>

      <view v-else-if="filteredPets.length === 0" class="empty-container">
        <text class="empty-text">暂无{{ petTypeName }}，请添加一只</text>
      </view>

      <view v-else class="pet-list">
        <!-- 已有宠物 -->
        <view v-for="pet in filteredPets" :key="pet.id" class="pet-card" @click="selectPet(pet)">
          <image class="pet-avatar" :src="pet.avatar" mode="aspectFill" />
          <view class="pet-info">
            <text class="pet-name">{{ pet.name }}</text>
            <text class="pet-breed">{{ pet.breedName || '未设置品种' }}</text>
          </view>
          <view class="pet-type-badge" :class="pet.type">
            {{ pet.type === 'dog' ? '🐕' : '🐈' }}
          </view>
        </view>
      </view>

      <!-- 添加新宠物 -->
      <view class="pet-card add-new" @click="addNewPet">
        <view class="add-icon">
          <uni-icons type="plusempty" size="32" color="#004a99" />
        </view>
        <view class="pet-info">
          <text class="pet-name">添加新{{ petTypeName }}</text>
          <text class="pet-breed">创建新的{{ petTypeName }}档案</text>
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { petApi } from '@/api/pet'
import type { PetProfile, PetType } from '@/types/pet'

const pets = ref<PetProfile[]>([])
const isLoading = ref(false)
const petType = ref<PetType>('dog')

const petTypeName = computed(() => (petType.value === 'dog' ? '狗狗' : '猫咪'))
const pageTitle = computed(() => `选择${petTypeName.value}`)

const filteredPets = computed(() => {
  return pets.value.filter((p) => p.type === petType.value)
})

const loadPets = async () => {
  isLoading.value = true
  try {
    const res = await petApi.list()
    if (res && res.code === '0') {
      pets.value = res.result
    }
  } catch (e) {
    console.error('加载宠物列表失败', e)
  } finally {
    isLoading.value = false
  }
}

const selectPet = (pet: PetProfile) => {
  // 传递 lockedType 参数，锁定宠物类型不可修改
  uni.redirectTo({
    url: `/accountPages/pet_edit/pet_edit?id=${pet.id}&mode=customize&lockedType=${petType.value}`,
  })
}

const addNewPet = () => {
  // 传递 lockedType 参数，锁定宠物类型不可修改
  uni.redirectTo({
    url: `/accountPages/pet_edit/pet_edit?mode=customize&lockedType=${petType.value}`,
  })
}

onLoad((options) => {
  if (options?.type === 'cat') {
    petType.value = 'cat'
  } else {
    petType.value = 'dog'
  }
})

onShow(() => {
  loadPets()
})
</script>

<style lang="scss" scoped>
.fresh-food-pets-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: $uni-bg-color-grey;
}

.page-header {
  padding: 40rpx 30rpx;
  background: linear-gradient(135deg, $uni-color-primary 0%, $uni-color-success 100%);
  color: $uni-text-color-inverse;
  flex-shrink: 0;

  .title {
    display: block;
    font-size: 40rpx;
    font-weight: 700;
    margin-bottom: 12rpx;
  }

  .desc {
    font-size: 26rpx;
    opacity: 0.9;
  }
}

.pet-scroll {
  flex: 1;
  padding: 20rpx;
  box-sizing: border-box;
}

.loading-container {
  padding: 100rpx 0;
}

.pet-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.pet-card {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background-color: $uni-text-color-inverse;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);

  .pet-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    background-color: $uni-bg-color-grey;
    flex-shrink: 0;
  }

  .pet-info {
    flex: 1;
    margin-left: 20rpx;

    .pet-name {
      display: block;
      font-size: 30rpx;
      font-weight: 600;
      color: $uni-text-color;
      margin-bottom: 6rpx;
    }

    .pet-breed {
      font-size: 24rpx;
      color: $uni-text-color-placeholder;
    }
  }

  .pet-type-badge {
    font-size: 36rpx;
    padding: 8rpx;
    border-radius: 12rpx;

    &.dog {
      background-color: #fff3e0;
    }

    &.cat {
      background-color: #e8f5e9;
    }
  }

  &.add-new {
    border: 2rpx dashed $uni-color-primary;
    background-color: #f0f7ff;

    .add-icon {
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      background-color: #e8f4fd;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
    }

    .pet-name {
      color: $uni-color-primary;
    }
  }
}

.safe-bottom {
  height: env(safe-area-inset-bottom);
}
</style>
