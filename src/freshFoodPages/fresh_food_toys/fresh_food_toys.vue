<template>
  <view class="toys-page">
    <CustomNavigationBar title="玩具 & 磨牙棒" show-back />

    <scroll-view scroll-y class="toys-content">
      <!-- 玩具区域 -->
      <view class="section toys-section">
        <view class="section-header">
          <text class="section-title">🧸 选择玩具类型</text>
          <text class="section-desc">为你的狗狗挑选合适的玩具</text>
        </view>

        <view class="toy-categories">
          <view
            v-for="toy in toyCategories"
            :key="toy.id"
            class="toy-card"
            :class="{ selected: selectedToy === toy.id }"
            @click="selectToy(toy.id)"
          >
            <view class="toy-image-wrapper" :class="{ selected: selectedToy === toy.id }">
              <image class="toy-image" :src="toy.image" mode="aspectFit" />
            </view>
            <text class="toy-name">{{ toy.nameEn }} {{ toy.name }}</text>
            <text class="toy-desc">{{ toy.description }}</text>

            <!-- 数量选择器 -->
            <view v-if="selectedToy === toy.id" class="quantity-picker">
              <view class="qty-btn" @click.stop="decreaseQty('toy')">
                <text>−</text>
              </view>
              <text class="qty-value">{{ toyQuantity }}</text>
              <view class="qty-btn" @click.stop="increaseQty('toy')">
                <text>+</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 磨牙棒区域 -->
      <view class="section chews-section">
        <view class="section-header">
          <text class="section-title">🦴 磨牙棒</text>
          <text class="section-desc">帮助保持口腔健康</text>
        </view>

        <view class="chews-list">
          <view v-for="chew in chewList" :key="chew.id" class="chew-card">
            <image class="chew-image" :src="chew.image" mode="aspectFit" />
            <view class="chew-info">
              <text class="chew-name">{{ chew.name }}</text>
              <text class="chew-price">¥{{ chew.price }}/件</text>
            </view>
            <!-- 数量选择器 -->
            <view class="quantity-picker">
              <view class="qty-btn" @click="decreaseChewQty(chew.id)">
                <text>−</text>
              </view>
              <text class="qty-value">{{ chewQuantities[chew.id] || 0 }}</text>
              <view class="qty-btn" @click="increaseChewQty(chew.id)">
                <text>+</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 选购汇总 -->
      <view v-if="hasSelection" class="summary-section">
        <text class="summary-title">已选商品</text>
        <view v-if="selectedToy && toyQuantity > 0" class="summary-item">
          <text>{{ getSelectedToyName }} × {{ toyQuantity }}</text>
          <text class="summary-price">¥{{ getSelectedToyPrice * toyQuantity }}</text>
        </view>
        <view v-for="chew in selectedChews" :key="chew.id" class="summary-item">
          <text>{{ chew.name }} × {{ chewQuantities[chew.id] }}</text>
          <text class="summary-price">¥{{ chew.price * chewQuantities[chew.id] }}</text>
        </view>
        <view class="summary-total">
          <text>合计</text>
          <text class="total-price">¥{{ totalPrice }}</text>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="footer-placeholder" />
    </scroll-view>

    <!-- 底部固定栏 -->
    <view class="footer-bar">
      <button class="btn-skip" @click="skip">Skip 跳过</button>
      <button class="btn-add" @click="addToPlan">Add to Plan 添加到计划</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useFreshFoodStore } from '@/stores'
import { cartApi } from '@/api/cart'
import { checkoutApi } from '@/api/checkout'

interface ToyItem {
  id: string
  name: string
  nameEn: string
  image: string
  description: string
  selected?: boolean
  quantity?: number
  price: number
}

interface ChewItem {
  id: string
  name: string
  image: string
  price: number
  quantity: number
}

const freshFoodStore = useFreshFoodStore()
const toyCategories = ref<ToyItem[]>([])
const chewList = ref<ChewItem[]>([])
const selectedToy = ref<string | null>(null)
const toyQuantity = ref(1)
const chewQuantities = ref<Record<string, number>>({})
const petId = ref('')

// 选择玩具
const selectToy = (id: string) => {
  if (selectedToy.value === id) {
    selectedToy.value = null
    toyQuantity.value = 1
  } else {
    selectedToy.value = id
    toyQuantity.value = 1
  }
}

// 玩具数量增减
const increaseQty = (type: string) => {
  if (type === 'toy') {
    toyQuantity.value++
  }
}

const decreaseQty = (type: string) => {
  if (type === 'toy' && toyQuantity.value > 1) {
    toyQuantity.value--
  }
}

// 磨牙棒数量增减
const increaseChewQty = (id: string) => {
  if (!chewQuantities.value[id]) {
    chewQuantities.value[id] = 0
  }
  chewQuantities.value[id]++
}

const decreaseChewQty = (id: string) => {
  if (chewQuantities.value[id] && chewQuantities.value[id] > 0) {
    chewQuantities.value[id]--
  }
}

// 计算属性
const getSelectedToyName = computed(() => {
  const toy = toyCategories.value.find((t) => t.id === selectedToy.value)
  return toy ? `${toy.nameEn} ${toy.name}` : ''
})

const getSelectedToyPrice = computed(() => {
  const toy = toyCategories.value.find((t) => t.id === selectedToy.value)
  return toy?.price || 0
})

const selectedChews = computed(() => {
  return chewList.value.filter((c) => chewQuantities.value[c.id] > 0)
})

const hasSelection = computed(() => {
  return (selectedToy.value && toyQuantity.value > 0) || selectedChews.value.length > 0
})

const totalPrice = computed(() => {
  let total = 0
  if (selectedToy.value && toyQuantity.value > 0) {
    total += getSelectedToyPrice.value * toyQuantity.value
  }
  for (const chew of selectedChews.value) {
    total += chew.price * (chewQuantities.value[chew.id] || 0)
  }
  return total
})

/** 执行最终操作 */
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

const goToCheckout = async () => {
  uni.showLoading({ title: '处理中...' })
  try {
    await executeFinalAction()
  } catch {
    uni.showToast({ title: '操作失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

// 跳过
const skip = () => {
  goToCheckout()
}

// 添加到计划
const addToPlan = () => {
  // 存储玩具
  if (selectedToy.value && toyQuantity.value > 0) {
    freshFoodStore.extraItems.push({
      productId: selectedToy.value,
      skuId: selectedToy.value,
      quantity: toyQuantity.value,
      purchaseType: 0,
    })
  }

  // 存储磨牙棒
  selectedChews.value.forEach((c) => {
    freshFoodStore.extraItems.push({
      productId: c.id,
      skuId: c.id,
      quantity: chewQuantities.value[c.id],
      purchaseType: 0,
    })
  })

  goToCheckout()
}

// 加载 mock 数据
const loadMockData = () => {
  toyCategories.value = [
    {
      id: 'toy1',
      name: '毛绒玩具',
      nameEn: 'Plush Toys',
      image: 'https://placehold.co/200x200/e3f2fd/1976d2?text=🧸',
      description: 'Soft Materials 软性材料',
      price: 49,
    },
    {
      id: 'toy2',
      name: '耐用咀嚼玩具',
      nameEn: 'Durable Chew Toys',
      image: 'https://placehold.co/200x200/e3f2fd/1976d2?text=🦴',
      description: 'Tough Materials 坚韧材料',
      price: 59,
    },
    {
      id: 'toy3',
      name: '组合盒',
      nameEn: 'Combo Box',
      image: 'https://placehold.co/200x200/e3f2fd/1976d2?text=📦',
      description: 'Fluffy & Tough 蓬松又坚韧',
      price: 89,
    },
  ]

  chewList.value = [
    {
      id: 'chew1',
      name: '天然牛皮磨牙棒',
      image: 'https://placehold.co/120x120/fff3e0/e65100?text=🦴',
      price: 29,
      quantity: 0,
    },
    {
      id: 'chew2',
      name: '鹿角磨牙棒',
      image: 'https://placehold.co/120x120/fff3e0/e65100?text=🦌',
      price: 45,
      quantity: 0,
    },
    {
      id: 'chew3',
      name: '洁齿磨牙骨',
      image: 'https://placehold.co/120x120/fff3e0/e65100?text=🦷',
      price: 25,
      quantity: 0,
    },
  ]
}

onLoad((options) => {
  petId.value = options?.petId || ''
  loadMockData()
})
</script>

<style lang="scss" scoped>
.toys-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.toys-content {
  flex: 1;
}

.section {
  margin: 20rpx;
  padding: 24rpx;
  background-color: #fff;
  border-radius: 16rpx;
}

.section-header {
  margin-bottom: 24rpx;

  .section-title {
    display: block;
    font-size: 32rpx;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 8rpx;
  }

  .section-desc {
    font-size: 24rpx;
    color: #666;
  }
}

// 玩具卡片
.toy-categories {
  display: flex;
  gap: 16rpx;
}

.toy-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 12rpx;
  border-radius: 16rpx;
  background-color: #f8f9fa;
  transition: all 0.2s ease;

  &.selected {
    background-color: #e3f2fd;
  }
}

.toy-image-wrapper {
  width: 140rpx;
  height: 140rpx;
  border-radius: 16rpx;
  background-color: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
  border: 3rpx solid transparent;

  &.selected {
    border-color: #1976d2;
  }
}

.toy-image {
  width: 100rpx;
  height: 100rpx;
}

.toy-name {
  font-size: 24rpx;
  font-weight: 700;
  color: #1976d2;
  text-align: center;
  margin-bottom: 6rpx;
}

.toy-desc {
  font-size: 20rpx;
  color: #666;
  text-align: center;
}

// 数量选择器
.quantity-picker {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 16rpx;
}

.qty-btn {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background-color: #fff;
  border: 2rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 28rpx;
    color: #333;
  }
}

.qty-value {
  font-size: 28rpx;
  font-weight: 600;
  min-width: 40rpx;
  text-align: center;
}

// 磨牙棒列表
.chews-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.chew-card {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background-color: #fafafa;
  border-radius: 12rpx;
}

.chew-image {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.chew-info {
  flex: 1;
  margin-left: 16rpx;

  .chew-name {
    display: block;
    font-size: 28rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 4rpx;
  }

  .chew-price {
    font-size: 24rpx;
    color: #e65100;
  }
}

// 汇总区域
.summary-section {
  margin: 20rpx;
  padding: 24rpx;
  background-color: #fff;
  border-radius: 16rpx;

  .summary-title {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 16rpx;
  }
}

.summary-item {
  display: flex;
  justify-content: space-between;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;

  .summary-price {
    color: #333;
  }
}

.summary-total {
  display: flex;
  justify-content: space-between;
  padding-top: 16rpx;
  border-top: 1rpx solid #eee;
  font-size: 28rpx;
  font-weight: 600;

  .total-price {
    color: #e65100;
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
  color: #1976d2;
  font-size: 30rpx;
  font-weight: 600;
  border: 2rpx solid #1976d2;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-add {
  flex: 1.5;
  height: 88rpx;
  background-color: #1976d2;
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
