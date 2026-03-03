<template>
  <view class="snacks-page">
    <CustomNavigationBar title="选择零食" show-back />

    <scroll-view scroll-y class="snacks-content">
      <view class="page-header">
        <text class="header-title">为你的狗狗选择健康零食</text>
        <text class="header-desc">天然食材，无添加剂，每一口都是营养</text>
      </view>

      <!-- 零食列表 -->
      <view class="snacks-list">
        <view
          v-for="snack in snackList"
          :key="snack.id"
          class="snack-card"
          :class="{ selected: selectedSnack === snack.id }"
          @click="selectSnack(snack.id)"
        >
          <image class="snack-image" :src="snack.image" mode="aspectFit" />
          <view class="snack-info">
            <view class="snack-name-row">
              <text class="snack-name">{{ snack.nameEn }} {{ snack.name }}</text>
              <text class="nutrition-link">{{ snack.nutritionFacts }}</text>
            </view>
            <view class="snack-ingredients">
              <text v-for="(ing, idx) in snack.ingredients" :key="idx" class="ingredient">
                {{ ing }}
              </text>
            </view>
          </view>
          <view class="snack-radio">
            <view class="radio-circle" :class="{ checked: selectedSnack === snack.id }">
              <view v-if="selectedSnack === snack.id" class="radio-dot" />
            </view>
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="footer-placeholder" />
    </scroll-view>

    <!-- 底部固定栏 -->
    <view class="footer-bar">
      <button class="btn-skip" @click="skip">Skip 跳过</button>
      <button class="btn-add" :disabled="!selectedSnack" @click="addToPlan">
        Add to Plan 添加到计划
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useFreshFoodStore } from '@/stores'
import { cartApi } from '@/api/cart'
import { checkoutApi } from '@/api/checkout'

interface SnackItem {
  id: string
  name: string
  nameEn: string
  image: string
  ingredients: string[]
  nutritionFacts?: string
  price: number
  selected?: boolean
}

const freshFoodStore = useFreshFoodStore()
const snackList = ref<SnackItem[]>([])
const selectedSnack = ref<string | null>(null)
const petId = ref('')

// 选择零食
const selectSnack = (id: string) => {
  selectedSnack.value = selectedSnack.value === id ? null : id
}

/** 执行最终操作 (当没有toys页面时使用) */
const executeFinalAction = async () => {
  const params = {
    planId: freshFoodStore.planId,
    planSelections: freshFoodStore.planSelections,
    items: freshFoodStore.extraItems,
  }

  if (freshFoodStore.flowAction === 'addToCart') {
    await cartApi.addItem('my-cart', params)
    uni.showToast({ title: '已加入购物车', icon: 'success' })
    freshFoodStore.clearState()
    setTimeout(() => {
      uni.switchTab({ url: '/pages/cart/cart' })
    }, 1000)
  } else if (freshFoodStore.flowAction === 'checkout') {
    const res = await checkoutApi.entryDirect(params)
    freshFoodStore.clearState()
    uni.navigateTo({
      url: `/orderPages/checkout/checkout?previewId=${res.result.previewId}`,
    })
  } else {
    uni.showToast({ title: '未知操作类型', icon: 'none' })
  }
}

const proceedNext = async () => {
  const hasNextPage = true // TODO: 判断是否有 Toys 页面配置
  if (hasNextPage) {
    uni.navigateTo({ url: '/freshFoodPages/fresh_food_toys/fresh_food_toys' })
  } else {
    uni.showLoading({ title: '处理中...' })
    try {
      await executeFinalAction()
    } catch {
      uni.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      uni.hideLoading()
    }
  }
}

// 跳过
const skip = () => {
  proceedNext()
}

// 添加到计划
const addToPlan = () => {
  if (!selectedSnack.value) return

  const snack = snackList.value.find((s) => s.id === selectedSnack.value)
  if (snack) {
    freshFoodStore.extraItems.push({
      productId: snack.id,
      skuId: snack.id,
      quantity: 1,
      purchaseType: 0,
    })
  }

  proceedNext()
}

// 加载 mock 数据
const loadMockData = () => {
  snackList.value = [
    {
      id: 'snack1',
      name: '牛肉',
      nameEn: 'Beef',
      image: 'https://placehold.co/200x200/f5e6d3/8b4513?text=🥩+牛肉条',
      ingredients: [
        'Beef (protein) 牛肉（蛋白质）',
        'Apple (fiber) 苹果（纤维）',
        'Sea Salt (electrolytes) 海盐（电解质）',
      ],
      nutritionFacts: 'Nutrition Facts 营养成分',
      price: 39,
    },
    {
      id: 'snack2',
      name: '猪肉',
      nameEn: 'Pork',
      image: 'https://placehold.co/200x200/f5e6d3/8b4513?text=🥓+猪肉条',
      ingredients: [
        'Pork (protein) 猪肉（蛋白质）',
        'Pear (fiber) 梨（纤维）',
        'Sea Salt (electrolytes) 海盐（电解质）',
      ],
      nutritionFacts: 'Nutrition Facts 营养成分',
      price: 35,
    },
    {
      id: 'snack3',
      name: '鸡肉',
      nameEn: 'Chicken',
      image: 'https://placehold.co/200x200/f5e6d3/8b4513?text=🍗+鸡肉条',
      ingredients: [
        'Chicken (protein) 鸡肉（蛋白质）',
        'Apple (fiber) 苹果（纤维）',
        'Sea Salt (electrolytes) 海盐（电解质）',
      ],
      nutritionFacts: 'Nutrition Facts 营养成分',
      price: 32,
    },
  ]
}

onLoad((options) => {
  petId.value = options?.petId || ''
  loadMockData()
})
</script>

<style lang="scss" scoped>
.snacks-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #fff;
}

.snacks-content {
  flex: 1;
}

.page-header {
  padding: 40rpx 30rpx;
  text-align: center;

  .header-title {
    display: block;
    font-size: 36rpx;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 12rpx;
  }

  .header-desc {
    font-size: 26rpx;
    color: #666;
  }
}

.snacks-list {
  padding: 0 24rpx;
}

.snack-card {
  display: flex;
  align-items: flex-start;
  padding: 24rpx;
  margin-bottom: 24rpx;
  background-color: #fff;
  border: 2rpx solid #eee;
  border-radius: 16rpx;
  transition: all 0.2s ease;

  &.selected {
    border-color: #ff6b35;
    background-color: #fff9f7;
  }
}

.snack-image {
  width: 160rpx;
  height: 200rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.snack-info {
  flex: 1;
  margin-left: 20rpx;
}

.snack-name-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
  flex-wrap: wrap;

  .snack-name {
    font-size: 32rpx;
    font-weight: 700;
    color: #1a1a1a;
  }

  .nutrition-link {
    font-size: 22rpx;
    color: #ff6b35;
  }
}

.snack-ingredients {
  .ingredient {
    display: block;
    font-size: 24rpx;
    color: #666;
    line-height: 1.6;
  }
}

.snack-radio {
  margin-left: 16rpx;
  margin-top: 60rpx;
}

.radio-circle {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 2rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &.checked {
    border-color: #ff6b35;
    background-color: #ff6b35;
  }

  .radio-dot {
    width: 20rpx;
    height: 20rpx;
    border-radius: 50%;
    background-color: #fff;
  }
}

.footer-placeholder {
  height: 160rpx;
}

.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.btn-skip {
  flex: 1;
  height: 88rpx;
  background-color: #fff;
  color: #ff6b35;
  font-size: 30rpx;
  font-weight: 600;
  border: 2rpx solid #ff6b35;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-add {
  flex: 1.5;
  height: 88rpx;
  background-color: #ff6b35;
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    background-color: #ccc;
  }
}
</style>
