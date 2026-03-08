<template>
  <view class="pet-list-page">
    <CustomNavigationBar title="我的宠物" />

    <scroll-view scroll-y class="pet-scroll">
      <!-- 加载中 -->
      <view v-if="isLoading" class="loading-container">
        <uni-load-more status="loading" />
      </view>

      <!-- 宠物列表 -->
      <view v-else-if="pets.length > 0" class="pet-list">
        <view
          v-for="(pet, index) in pets"
          :key="pet.id"
          class="pet-card"
          :class="[
            'pet-card',
            { dragging: draggingIndex === index, selectable: propsSource === 'customize' },
          ]"
          @longpress="startDrag(index)"
          @touchmove.prevent="onDrag"
          @touchend="endDrag"
          @click="onPetClick(pet.id)"
        >
          <image class="pet-avatar" :src="pet.avatar" mode="aspectFill" />
          <view class="pet-info">
            <view class="pet-name-row">
              <text class="pet-name">{{ pet.name }}</text>
              <view class="pet-type-badge" :class="pet.type">
                {{ pet.type === 'dog' ? '🐕 狗' : '🐈 猫' }}
              </view>
            </view>
            <text class="pet-breed">{{ pet.breedName || '未设置品种' }}</text>
            <view class="pet-tags">
              <text v-if="pet.gender === 'male'" class="tag male">♂ 公</text>
              <text v-else class="tag female">♀ 母</text>
              <text v-if="pet.neutered" class="tag">已绝育</text>
              <text v-if="pet.hasFoodAllergies" class="tag warning">食物过敏</text>
              <text v-if="pet.hasHealthIssues" class="tag warning">健康问题</text>
            </view>
          </view>
          <view class="actions" v-if="propsSource !== 'customize'">
            <uni-icons
              type="compose"
              size="22"
              color="#666"
              @click.stop="editPet(pet.id)"
            ></uni-icons>

            <uni-icons
              class="delete-icon"
              type="trash"
              size="22"
              color="#666"
              @click.stop="deletePet(pet.id)"
            ></uni-icons>
          </view>
          <view class="drag-handle" v-if="propsSource !== 'customize'">
            <uni-icons type="bars" size="24" color="#ccc" />
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-container">
        <image
          src="https://placehold.co/200x200/f5f5f5/999?text=No+Pets"
          class="empty-image"
          mode="aspectFit"
        />
        <text class="empty-text">还没有添加宠物</text>
        <button class="add-btn" @click="addPet">添加宠物</button>
      </view>
    </scroll-view>

    <!-- 添加按钮 -->
    <view v-if="pets.length > 0" class="fab-container">
      <button class="fab-btn" @click="addPet">
        <uni-icons type="plus" size="28" color="#fff" />
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { petApi } from '@/api/pet'
import type { PetProfile } from '@/types/pet'

const propsSource = ref('')

onLoad((options) => {
  if (options?.source) {
    propsSource.value = options.source
  }
})

const pets = ref<PetProfile[]>([])
const isLoading = ref(false)
const draggingIndex = ref<number | null>(null)
const dragStartY = ref(0)
const dragCurrentY = ref(0)

// 加载宠物列表
const loadPets = async () => {
  isLoading.value = true
  try {
    const res = await petApi.list()
    if (res && res.code === '0') {
      pets.value = res.result
    }
  } catch (e) {
    console.error('加载宠物列表失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

// 跳转添加宠物
const addPet = () => {
  uni.navigateTo({ url: '/accountPages/pet_edit/pet_edit' })
}

// 跳转编辑宠物
const editPet = (petId: string) => {
  if (draggingIndex.value !== null) return
  uni.navigateTo({ url: `/accountPages/pet_edit/pet_edit?id=${petId}` })
}

const onPetClick = (petId: string) => {
  if (propsSource.value === 'customize') {
    editPet(petId)
  }
}

// 删除宠物
const deletePet = (petId: string) => {
  uni.showModal({
    title: '确认删除',
    content: '您确定要删除这只宠物吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const deleteRes = await petApi.delete(petId)
          if (deleteRes.code === '0') {
            uni.showToast({ icon: 'success', title: '删除成功' })
            loadPets()
          } else {
            uni.showToast({ icon: 'none', title: deleteRes.msg || '删除失败' })
          }
        } catch (error) {
          uni.showToast({ icon: 'none', title: '删除失败' })
        }
      }
    },
  })
}

// 拖拽排序
const startDrag = (index: number) => {
  draggingIndex.value = index
  uni.vibrateShort({})
}

const onDrag = (e: TouchEvent) => {
  if (draggingIndex.value === null) return
  dragCurrentY.value = e.touches[0].clientY
}

const endDrag = async () => {
  if (draggingIndex.value === null) return
  const petIds = pets.value.map((p) => p.id)
  draggingIndex.value = null

  try {
    await petApi.reorder(petIds)
  } catch (e) {
    console.error('保存排序失败', e)
  }
}

// 页面显示时刷新
onShow(() => {
  loadPets()
})
</script>

<style lang="scss" scoped>
.pet-list-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.pet-scroll {
  flex: 1;
  padding: 20rpx;
}

.loading-container {
  padding: 100rpx 0;
}

.pet-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.pet-card {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;

  &.dragging {
    transform: scale(1.02);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
    z-index: 100;
  }

  &.selectable:active {
    background-color: #f9f9f9;
  }

  .pet-avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    flex-shrink: 0;
    background-color: #f0f0f0;
  }

  .pet-info {
    flex: 1;
    margin-left: 24rpx;
    min-width: 0;

    .pet-name-row {
      display: flex;
      align-items: center;
      gap: 12rpx;
      margin-bottom: 8rpx;
    }

    .pet-name {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }

    .pet-type-badge {
      font-size: 22rpx;
      padding: 4rpx 12rpx;
      border-radius: 20rpx;

      &.dog {
        background-color: #fff3e0;
        color: #e65100;
      }

      &.cat {
        background-color: #e8f5e9;
        color: #2e7d32;
      }
    }

    .pet-breed {
      font-size: 26rpx;
      color: #666;
      margin-bottom: 8rpx;
    }

    .pet-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8rpx;

      .tag {
        font-size: 22rpx;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        background-color: #f0f0f0;
        color: #666;

        &.male {
          background-color: #e3f2fd;
          color: #1976d2;
        }

        &.female {
          background-color: #fce4ec;
          color: #c2185b;
        }

        &.warning {
          background-color: #fff3e0;
          color: #e65100;
        }
      }
    }
  }

  .actions {
    display: flex;
    align-items: center;
    padding-left: 16rpx;

    .delete-icon {
      margin-left: 24rpx;
    }
  }

  .drag-handle {
    margin-left: 16rpx;
    padding: 16rpx;
  }
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;

  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 32rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999;
    margin-bottom: 32rpx;
  }

  .add-btn {
    background-color: #004a99;
    color: #fff;
    border-radius: 40rpx;
    padding: 24rpx 64rpx;
    font-size: 28rpx;
    border: none;

    &::after {
      border: none;
    }
  }
}

.fab-container {
  position: fixed;
  right: 40rpx;
  bottom: calc(40rpx + env(safe-area-inset-bottom));

  .fab-btn {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #004a99 0%, #0066cc 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 8rpx 24rpx rgba(0, 74, 153, 0.4);
    border: none;
    padding: 0;

    &::after {
      border: none;
    }
  }
}
</style>
