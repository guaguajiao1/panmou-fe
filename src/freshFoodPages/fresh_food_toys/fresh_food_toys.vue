<template>
  <view class="toys-page">
    <CustomNavigationBar
      title="玩具 & 磨牙棒"
      :back-icon="flowCompleted ? 'close' : 'back'"
      :custom-back="true"
      @back="handleBack"
    />

    <scroll-view scroll-y class="toys-content">
      <!-- 玩具区域 -->
      <view class="section toys-section">
        <view class="section-header">
          <text class="section-title">选择玩具类型</text>
          <text class="section-desc">为你的狗狗挑选合适的玩具</text>
          <text class="section-price-info">{{ toysConfig?.toyPriceNote }}</text>
        </view>

        <view class="toy-categories">
          <view
            v-for="toy in toyCategories"
            :key="toy.skuId"
            class="toy-card"
            :class="{ selected: selectedToy === toy.skuId }"
            @click="selectToy(toy.skuId)"
          >
            <view class="toy-image-wrapper" :class="{ selected: selectedToy === toy.skuId }">
              <image class="toy-image" :src="toy.image?.[0]" mode="aspectFit" />
            </view>
            <text class="toy-name">{{ toy.name }}</text>
            <text class="toy-desc">{{ toy.desc }}</text>

            <!-- 数量选择器 -->
            <view v-if="selectedToy === toy.skuId" class="quantity-picker">
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
          <text class="section-price-info">{{
            toysConfig?.chewPriceNote || '首单免费，后续10元'
          }}</text>
        </view>

        <view class="chews-list">
          <view v-for="chew in chewList" :key="chew.skuId" class="chew-card">
            <image class="chew-image" :src="chew.image?.[0]" mode="aspectFit" />
            <view class="chew-info">
              <text class="chew-name">{{ chew.name }}</text>
              <text class="chew-ingredient">{{ chew.ingredient || chew.desc }}</text>
              <text class="chew-detail-link" @click.stop="openIngredientPopup(chew)">查看详情</text>
            </view>
            <!-- 数量选择器 -->
            <view class="quantity-picker">
              <view class="qty-btn" @click="decreaseChewQty(chew.skuId)">
                <text>−</text>
              </view>
              <text class="qty-value">{{ chewQuantities[chew.skuId] || 0 }}</text>
              <view class="qty-btn" @click="increaseChewQty(chew.skuId)">
                <text>+</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="footer-placeholder" />
    </scroll-view>

    <!-- 成分图片弹窗 -->
    <view v-if="showIngredientPopup" class="popup-mask" @click="closeIngredientPopup">
      <view class="popup-container" @click.stop>
        <view class="popup-close" @click="closeIngredientPopup">
          <uni-icons type="close" size="24" color="#666" />
        </view>
        <scroll-view scroll-y class="popup-scroll">
          <image class="popup-image" :src="ingredientPopupImage" mode="widthFix" />
        </scroll-view>
      </view>
    </view>

    <!-- 成功加入购物车后的底部栏 -->
    <view v-if="flowCompleted" class="footer-bar success-footer">
      <view class="success-banner">
        <uni-icons type="checkmarkempty" size="20" color="#00a86b" />
        <text class="success-text">已成功加入购物车！</text>
      </view>
      <view class="success-actions">
        <button class="btn-cart" @click="goToCart">去购物车</button>
        <button class="btn-another" @click="goToCustomizeAnother">为另一只狗狗定制</button>
      </view>
    </view>

    <!-- 底部固定栏 -->
    <view v-else class="footer-bar">
      <button class="btn-skip" @click="skip">跳过</button>
      <button class="btn-add" :disabled="!hasSelection" @click="addToPlan">添加到计划</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useFreshFoodStore } from '@/stores'
import { cartApi } from '@/api/cart'
import { checkoutApi } from '@/api/checkout'
import type { Sku } from '@/types/product'

const freshFoodStore = useFreshFoodStore()

const toysConfig = computed(() => freshFoodStore.currentPlan?.toys)
const toyCategories = computed<Sku[]>(() => toysConfig.value?.toyCategories || [])
const chewList = computed<Sku[]>(() => toysConfig.value?.chews || [])

const selectedToy = ref<string | null>(null)
const toyQuantity = ref(1)
const chewQuantities = ref<Record<string, number>>({})

const flowCompleted = ref(false)

// 追踪本页添加的商品ID
const addedItemIds = ref<string[]>([])

// 成分弹窗
const showIngredientPopup = ref(false)
const ingredientPopupImage = ref('')

const openIngredientPopup = (chew: Sku) => {
  if (chew.ingredientImage) {
    ingredientPopupImage.value = chew.ingredientImage
    showIngredientPopup.value = true
  } else {
    uni.showToast({ title: '暂无详情', icon: 'none' })
  }
}

const closeIngredientPopup = () => {
  showIngredientPopup.value = false
}

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
const selectedChews = computed(() => {
  return chewList.value.filter((c) => chewQuantities.value[c.skuId] > 0)
})

const hasSelection = computed(() => {
  return (selectedToy.value && toyQuantity.value > 0) || selectedChews.value.length > 0
})

/** 回退到 landing 并清除中间页面，可选链式跳转 */
const clearStackAndNavigate = (targetUrl?: string) => {
  const pages = getCurrentPages()
  const landingIndex = pages.findIndex((p) => p.route?.includes('fresh_food_landing'))
  const delta = landingIndex > -1 ? pages.length - 1 - landingIndex : pages.length

  uni.navigateBack({
    delta,
    complete: () => {
      if (targetUrl) {
        setTimeout(() => uni.navigateTo({ url: targetUrl }), 500)
      }
    },
  })
}

/** 前往购物车 */
const goToCart = () => {
  clearStackAndNavigate('/pages/cart/cart')
}

/** 为另一只狗狗定制 */
const goToCustomizeAnother = () => {
  clearStackAndNavigate('/freshFoodPages/fresh_food_pets/fresh_food_pets')
}

/** 执行最终操作：成功后清理堆栈并跳转 */
const executeFinalAction = async () => {
  const params = {
    planId: freshFoodStore.planId,
    planSelections: freshFoodStore.planSelections,
    items: freshFoodStore.extraItems,
  }

  if (freshFoodStore.flowAction === 'addToCart') {
    await cartApi.addItem('my-cart', params)
    freshFoodStore.clearState()
    flowCompleted.value = true // 显示成功操作栏
  } else if (freshFoodStore.flowAction === 'checkout') {
    const res = await checkoutApi.entryDirect(params)
    freshFoodStore.clearState()
    clearStackAndNavigate(`/orderPages/checkout/checkout?previewId=${res.result.previewId}`)
  } else {
    uni.showToast({ title: '未知操作类型', icon: 'none' })
  }
}

const goToCheckout = async () => {
  uni.showLoading({ title: '处理中...' })
  try {
    await executeFinalAction()
  } catch {
    uni.showToast({ title: '加入购物车失败，请稍后重试', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

// 回退：清理本页添加的商品
const handleBack = () => {
  if (flowCompleted.value) {
    clearStackAndNavigate()
    return
  }

  if (addedItemIds.value.length > 0) {
    freshFoodStore.removeExtraItemsByIds(addedItemIds.value)
  }
  uni.navigateBack()
}

// 跳过
const skip = () => {
  goToCheckout()
}

// 添加到计划
const addToPlan = () => {
  // 存储玩具
  if (selectedToy.value && toyQuantity.value > 0) {
    const toy = toyCategories.value.find((t) => t.skuId === selectedToy.value)
    if (toy) {
      freshFoodStore.extraItems.push({
        productId: toy.productId,
        skuId: toy.skuId,
        quantity: toyQuantity.value,
        purchaseType: 1,
      })
      addedItemIds.value.push(toy.skuId)
    }
  }

  // 存储磨牙棒
  selectedChews.value.forEach((c) => {
    freshFoodStore.extraItems.push({
      productId: c.productId,
      skuId: c.skuId,
      quantity: chewQuantities.value[c.skuId],
      purchaseType: 1,
    })
    addedItemIds.value.push(c.skuId)
  })

  goToCheckout()
}

onLoad(() => {
  // 默认选中第一个玩具
  selectedToy.value = toyCategories.value[0]?.skuId || null
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

  .section-price-info {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #1976d2;
    margin-top: 8rpx;
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

  .chew-ingredient {
    display: block;
    font-size: 22rpx;
    color: #666;
    margin-bottom: 4rpx;
  }

  .chew-detail-link {
    font-size: 24rpx;
    color: #e6a23c;
    font-weight: 500;
  }
}

// 成分弹窗
.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.popup-container {
  width: 100%;
  height: 85vh;
  background-color: #fff;
  border-radius: 32rpx 32rpx 0 0;
  position: relative;
  overflow: hidden;

  .popup-close {
    position: absolute;
    top: 20rpx;
    right: 20rpx;
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    z-index: 10;
  }

  .popup-scroll {
    height: 100%;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .popup-image {
    width: 100%;
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

  &:disabled {
    background-color: #ccc;
    color: #fff;
    border: none;
    opacity: 1;
  }
}

// 成功底部栏
.footer-bar.success-footer {
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  padding: 30rpx 40rpx calc(20rpx + env(safe-area-inset-bottom));
  height: auto;

  .success-banner {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 8rpx;
  }

  .success-text {
    font-size: 32rpx;
    font-weight: 700;
    color: #333;
  }

  .success-actions {
    display: flex;
    width: 100%;
    gap: 24rpx;

    button {
      flex: 1;
      height: 80rpx;
      font-size: 28rpx;
      font-weight: 600;
      border-radius: 40rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #fff;
      margin: 0;
      padding: 0;

      &::after {
        border: none;
      }
    }

    button.btn-cart {
      color: #ff69b4; /* 粉色字体 */
      border: 2rpx solid #ff69b4; /* 粉色边框 */
    }

    button.btn-another {
      color: #ff3b30; /* 红色字体 */
      border: 2rpx solid #ff3b30; /* 红色边框 */
    }
  }
}
</style>
