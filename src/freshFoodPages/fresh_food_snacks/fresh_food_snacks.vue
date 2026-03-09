<template>
  <view class="snacks-page">
    <CustomNavigationBar
      title="选择零食"
      :back-icon="flowCompleted ? 'close' : 'back'"
      :custom-back="true"
      @back="handleBack"
    />

    <scroll-view scroll-y class="snacks-content">
      <view class="page-header">
        <text class="header-title">{{ snacksConfig?.title }}</text>
        <text class="header-desc">{{ snacksConfig?.description }}</text>
        <text class="header-price-info">{{ snacksConfig?.priceNote }}</text>
      </view>

      <!-- 零食列表 -->
      <view class="snacks-list">
        <view
          v-for="snack in snackList"
          :key="snack.skuId"
          class="snack-card"
          :class="{ selected: selectedSnack === snack.skuId }"
          @click="selectSnack(snack.skuId)"
        >
          <image class="snack-image" :src="snack.image?.[0]" mode="aspectFit" />
          <view class="snack-info">
            <view class="snack-name-row">
              <text class="snack-name">{{ snack.name }}</text>
              <text class="nutrition-link" @click.stop="openIngredientPopup(snack)">查看详情</text>
            </view>
            <view class="snack-ingredients">
              <text class="ingredient">{{ snack.ingredient || snack.desc }}</text>
            </view>
          </view>
          <view class="snack-radio">
            <view class="radio-circle" :class="{ checked: selectedSnack === snack.skuId }">
              <view v-if="selectedSnack === snack.skuId" class="radio-dot" />
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
      <button class="btn-add" :disabled="!selectedSnack" @click="addToPlan">添加到计划</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useFreshFoodStore } from '@/stores'
import { cartApi } from '@/api/cart'
import { checkoutApi } from '@/api/checkout'
import type { Sku } from '@/types/product'

const freshFoodStore = useFreshFoodStore()

const snacksConfig = computed(() => freshFoodStore.currentPlan?.snacks)
const snackList = computed<Sku[]>(() => snacksConfig.value?.list || [])
const selectedSnack = ref<string | null>(null)

// 追踪本页添加的商品ID
const addedItemIds = ref<string[]>([])

const flowCompleted = ref(false)

// 成分弹窗
const showIngredientPopup = ref(false)
const ingredientPopupImage = ref('')

const openIngredientPopup = (snack: Sku) => {
  if (snack.ingredientImage) {
    ingredientPopupImage.value = snack.ingredientImage
    showIngredientPopup.value = true
  } else {
    uni.showToast({ title: '暂无详情', icon: 'none' })
  }
}

const closeIngredientPopup = () => {
  showIngredientPopup.value = false
}

// 选择零食
const selectSnack = (skuId: string) => {
  selectedSnack.value = selectedSnack.value === skuId ? null : skuId
}

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

/** 执行最终操作 (当没有toys页面时使用) */
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

const proceedNext = async () => {
  const planData = freshFoodStore.currentPlan
  const hasToys =
    planData?.toys && (planData.toys.toyCategories?.length > 0 || planData.toys.chews?.length > 0)

  if (hasToys) {
    uni.navigateTo({ url: '/freshFoodPages/fresh_food_toys/fresh_food_toys' })
  } else {
    uni.showLoading({ title: '处理中...' })
    try {
      await executeFinalAction()
    } catch {
      uni.showToast({
        title:
          freshFoodStore.flowAction === 'addToCart'
            ? '加入购物车失败，请稍后重试'
            : '结算失败，请稍后重试',
        icon: 'none',
      })
    } finally {
      uni.hideLoading()
    }
  }
}

// 回退：清理本页添加的商品，然后返回上一页
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
  proceedNext()
}

// 添加到计划
const addToPlan = () => {
  if (!selectedSnack.value) return

  const snack = snackList.value.find((s) => s.skuId === selectedSnack.value)
  if (snack) {
    freshFoodStore.extraItems.push({
      productId: snack.productId,
      skuId: snack.skuId,
      quantity: 1,
      purchaseType: 1,
    })
    addedItemIds.value.push(snack.skuId)
  }

  proceedNext()
}

onLoad(() => {
  // 默认选中第一个商品
  selectedSnack.value = snackList.value[0]?.skuId || null
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

  .header-price-info {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #ff6b35;
    margin-top: 12rpx;
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
    border-color: #1976d2;
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
    color: #e6a23c;
    font-weight: 500;
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
    border-color: #1976d2;
    background-color: #1976d2;
  }

  .radio-dot {
    width: 20rpx;
    height: 20rpx;
    border-radius: 50%;
    background-color: #fff;
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
</style>
