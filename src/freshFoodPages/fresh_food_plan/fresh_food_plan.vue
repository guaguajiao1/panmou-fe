<template>
  <view class="fresh-food-plan-page">
    <CustomNavigationBar
      title="定制方案"
      :back-icon="flowCompleted ? 'close' : 'back'"
      :custom-back="true"
      @back="handleBack"
    />

    <!-- 加载态 -->
    <view v-if="isLoading" class="loading-overlay">
      <view class="loading-content">
        <view class="loading-spinner" />
        <text class="loading-text">正在计算、定制中...</text>
      </view>
    </view>

    <scroll-view v-else scroll-y class="plan-content">
      <!-- 宠物信息摘要 -->
      <view class="pet-summary">
        <image
          v-if="planData.pet.avatar"
          class="pet-avatar"
          :src="planData.pet.avatar"
          mode="aspectFill"
        />
        <view class="pet-info">
          <text class="pet-name">定制{{ planData.pet.name }}的专属方案</text>
          <text class="pet-desc">{{ planData.pet.summary }}</text>
        </view>
      </view>

      <!-- 1. 鲜食占比 -->
      <view class="section ratio-section">
        <view class="section-header">
          <text class="section-title">鲜食占比</text>
        </view>
        <view class="ratio-options">
          <view
            v-for="ratio in planData.ratios.list"
            :key="ratio.id"
            class="ratio-card"
            :class="{
              selected: ratio.selected,
              recommended: ratio.recommended,
            }"
            @click="selectRatio(ratio.id)"
          >
            <view v-if="ratio.recommended" class="recommended-tag">推荐</view>
            <image class="ratio-image" :src="ratio.image" mode="aspectFit" />
            <view class="ratio-info">
              <text class="ratio-name">{{ ratio.name }}</text>
              <text class="ratio-desc">{{ ratio.description }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 2. 配送频率 -->
      <view class="section frequency-section">
        <view class="section-header">
          <text class="section-title">配送频率</text>
        </view>
        <text class="first-order-note" v-if="planData.firstOrderNote">{{
          planData.firstOrderNote
        }}</text>
        <view class="frequency-options">
          <view
            v-for="freq in currentFrequencies"
            :key="freq.id"
            class="frequency-card"
            :class="{
              selected: freq.selected,
              'has-tag': freq.tag,
            }"
            @click="selectFrequency(freq.id)"
          >
            <view v-if="freq.tag" class="freq-tag">{{ freq.tag }}</view>
            <view v-if="freq.recommended" class="freq-recommend-tag">推荐</view>
            <text class="freq-label">{{ freq.label }}</text>
            <text class="freq-packs">每次配送{{ freq.totalPacks }}袋</text>
          </view>
        </view>
      </view>

      <!-- 3. 食谱列表（含步进器） -->
      <view class="section recipes-section">
        <view class="section-header">
          <text class="section-title">选择食谱</text>
          <text class="section-hint">
            已选 {{ totalSelectedQuantity }}/{{ totalPacks }} 袋，{{ selectedRecipeCount }}/3 种
          </text>
        </view>
        <view class="recipes-list">
          <view
            v-for="(recipeSku, index) in currentRecipes"
            :key="recipeSku.sku.skuId"
            class="recipe-card"
            :class="{ active: currentRecipeQuantityArray[index].quantity > 0 }"
          >
            <view v-if="recipeSku.recommended" class="recipe-recommended-tag">推荐</view>
            <image class="recipe-image" :src="recipeSku.sku.image?.[0] || ''" mode="aspectFill" />
            <view class="recipe-info">
              <text class="recipe-name">{{ recipeSku.sku.name }}</text>
              <text class="recipe-desc">{{ recipeSku.sku.ingredient }}</text>
              <text class="recipe-detail-link" @click.stop="openIngredientPopup(recipeSku.sku)"
                >查看详情</text
              >
            </view>
            <view class="recipe-stepper">
              <view
                class="stepper-btn minus"
                :class="{ disabled: currentRecipeQuantityArray[index].quantity <= 0 || isViewOnly }"
                @click="decreaseRecipeQuantity(recipeSku.sku.skuId)"
              >
                <text>−</text>
              </view>
              <text class="stepper-value">{{ currentRecipeQuantityArray[index].quantity }}</text>
              <view
                class="stepper-btn plus"
                :class="{ disabled: !canIncrease(recipeSku.sku.skuId) || isViewOnly }"
                @click="increaseRecipeQuantity(recipeSku.sku.skuId)"
              >
                <text>+</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="footer-placeholder" />
    </scroll-view>

    <!-- 成分详情弹窗 -->
    <view v-if="showIngredientPopup" class="recipe-popup-mask" @click="closeIngredientPopup">
      <view class="recipe-popup" @click.stop>
        <view class="popup-close" @click="closeIngredientPopup">
          <uni-icons type="close" size="24" color="#666" />
        </view>
        <scroll-view class="popup-scroll" scroll-y>
          <image
            v-if="ingredientPopupData.image"
            class="popup-ingredient-image"
            :src="ingredientPopupData.image"
            mode="widthFix"
          />
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

    <!-- 正常的底部栏 -->
    <view v-else-if="!isLoading" class="footer-bar">
      <view class="price-info">
        <view class="price-row">
          <text class="price-current">¥{{ (totalCostAfterDiscount / 100).toFixed(2) }}</text>
          <text class="price-daily">(¥{{ (dailyCost / 100).toFixed(2) }}/天)</text>
        </view>
        <text v-if="planData.firstOrderNote" class="discount-note">{{
          planData.firstOrderNote
        }}</text>
        <text v-if="planData.firstOrderDiscount > 0" class="future-order-note"
          >后续订单 ¥{{ (totalCost / 100).toFixed(2) }}</text
        >
      </view>
      <view class="action-buttons" v-if="scene === 'cart' || scene === 'subscription'">
        <button
          class="btn-checkout"
          :style="{ width: '240rpx', margin: '0' }"
          :disabled="!isOrderValid"
          @click="handleSave"
        >
          保存
        </button>
      </view>
      <view class="action-buttons" v-else-if="!isViewOnly">
        <button class="btn-cart" :disabled="!isOrderValid" @click="addToCart">加入购物车</button>
        <button class="btn-checkout" :disabled="!isOrderValid" @click="checkout">立即结算</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import type { FreshPlanPageData } from '@/types/fresh-food'
import type { Sku } from '@/types/product'
import { useFreshFoodStore } from '@/stores'
import { freshFoodApi } from '@/api/fresh-food'
import { cartApi } from '@/api/cart'
import { checkoutApi } from '@/api/checkout'

const freshFoodStore = useFreshFoodStore()

const isLoading = ref(true)
const flowCompleted = ref(false)

const scene = ref<'cart' | 'subscription' | 'checkout' | ''>('')
const cartId = ref('')
const itemId = ref('')
const subscriptionId = ref('')

const isViewOnly = computed(() => scene.value === 'checkout')

// 成分弹窗
const showIngredientPopup = ref(false)
const ingredientPopupData = reactive({ image: '' })

// 统一页面数据
const planData = ref<FreshPlanPageData>({
  pet: {
    id: '',
    name: '',
    type: 'dog',
    avatar: '',
    breedName: '',
    birthday: '',
    gender: 'male',
    neutered: false,
    summary: '',
  },
  ratios: {
    list: [],
    wholeRatioShipNote: '',
  },
  firstOrderDiscount: 0,
  firstOrderNote: '',
  snacks: null,
  toys: null,
  planId: '',
  uid: '',
  petId: '',
  createdAt: '',
  updatedAt: '',
})

// ========== Computed ==========

/** 当前选中的占比对象 */
const currentRatio = computed(() => {
  return planData.value.ratios.list.find((r) => r.selected)
})

/** 当前占比下的配送频率列表 */
const currentFrequencies = computed(() => {
  return currentRatio.value?.frequencies || []
})

/** 当前选中的频率对象 */
const currentFrequency = computed(() => {
  return currentFrequencies.value.find((f) => f.selected)
})

/** 当前占比下的食谱SKU列表 */
const currentRecipeQuantityArray = computed(() => {
  return currentFrequency.value?.recipeQuantityArray || []
})

/** 当前占比+频率下的总袋数 n */
const totalPacks = computed(() => {
  return currentFrequency.value?.totalPacks || 0
})

/** 已选食谱种类数（quantity > 0 的食谱数） */
const selectedRecipeCount = computed(() => {
  return currentRecipeQuantityArray.value.filter((r) => r.quantity > 0).length
})

/** 已选食谱总数量 */
const totalSelectedQuantity = computed(() => {
  return currentRecipeQuantityArray.value.reduce((sum, r) => sum + r.quantity, 0)
})

/** 当前占比下的食谱数据列表 (提供价格等基础信息) */
const currentRecipes = computed(() => {
  return currentRatio.value?.recipes || []
})

/** 食谱总价 = ∑(currentRecipeArray[i].quantity × recipes[i].originalPriceValue) */
const totalRecipePrice = computed(() => {
  const quantites = currentRecipeQuantityArray.value
  const recipes = currentRecipes.value

  return quantites.reduce((sum, item, index) => {
    const r = recipes[index]
    if (r && r.sku.originalPriceValue) {
      return sum + r.sku.originalPriceValue * item.quantity
    }
    return sum
  }, 0)
})

/** 总费用计算 (原价计算 = 食谱总价 + 运费) */
const totalCost = computed(() => {
  // 把 shippingFee 转为数字，防止从 mock 拿到的 '0' 字符串导致拼接 (例如 2500 + '0' = '25000')
  const shippingFee = Number(currentFrequency.value?.shippingFee || 0)
  return totalRecipePrice.value + shippingFee
})

const totalCostAfterDiscount = computed(() => {
  return (totalCost.value * (100 - planData.value.firstOrderDiscount)) / 100
})

/** 每日花费 = 总费用 / 配送周期天数 */
const dailyCost = computed(() => {
  const days = currentFrequency.value?.deliveryDays || 1
  return totalCostAfterDiscount.value / days
})

/** 订单是否有效（总数量 = n） */
const isOrderValid = computed(() => {
  return totalSelectedQuantity.value === totalPacks.value && totalPacks.value > 0
})

// ========== 方法 ==========

/** 判断是否还能增加某食谱数量 */
const canIncrease = (skuId: string) => {
  // 总数不能超过 n
  if (totalSelectedQuantity.value >= totalPacks.value) return false
  // 找到当前食谱
  const recipe = currentRecipeQuantityArray.value.find((r) => r.skuId === skuId)
  if (!recipe) return false
  // 如果当前数量为0，检查已选种类数是否已达3
  if (recipe.quantity === 0 && selectedRecipeCount.value >= 3) return false
  return true
}

/** 选择占比 */
const selectRatio = (id: string) => {
  if (isViewOnly.value) return
  const currentRatioObj = planData.value.ratios.list.find((r) => r.id === id)
  if (!currentRatioObj || currentRatioObj.selected) return
  // 重置ratio selected
  planData.value.ratios.list.forEach((r) => (r.selected = r.id === id))

  const freqs = currentRatioObj.frequencies
  if (!freqs || freqs.length === 0) return

  let hasSelected = false
  let recommendedIndex = -1
  // 重置frequency selected
  for (let i = 0; i < freqs.length; i++) {
    if (freqs[i].selected) {
      if (hasSelected) {
        freqs[i].selected = false
      } else {
        hasSelected = true
      }
    }
    if (recommendedIndex === -1 && freqs[i].recommended) {
      recommendedIndex = i
    }
  }

  if (!hasSelected) {
    const targetIndex = recommendedIndex !== -1 ? recommendedIndex : 0
    freqs[targetIndex].selected = true
  }
}

/** 选择频率 */
const selectFrequency = (id: string) => {
  if (isViewOnly.value) return
  const currentFreq = currentFrequencies.value.find((f) => f.id === id)
  if (currentFreq?.selected) return

  currentFrequencies.value.forEach((f) => (f.selected = f.id === id))
}

/** 增加食谱数量 */
const increaseRecipeQuantity = (skuId: string) => {
  if (isViewOnly.value) return
  if (!canIncrease(skuId)) {
    if (totalSelectedQuantity.value >= totalPacks.value) {
      uni.showToast({ title: `总数不能超过${totalPacks.value}袋`, icon: 'none' })
    } else {
      uni.showToast({ title: '最多选择3种食谱', icon: 'none' })
    }
    return
  }
  const recipeQuantity = currentFrequency.value?.recipeQuantityArray?.find((r) => r.skuId === skuId)
  if (recipeQuantity) {
    recipeQuantity.quantity++
  }
}

/** 减少食谱数量 */
const decreaseRecipeQuantity = (skuId: string) => {
  if (isViewOnly.value) return
  const recipeQuantity = currentFrequency?.value?.recipeQuantityArray?.find(
    (r) => r.skuId === skuId,
  )
  if (recipeQuantity && recipeQuantity.quantity > 0) {
    recipeQuantity.quantity--
  }
}

/** 打开成分详情弹窗 */
const openIngredientPopup = (sku: Sku) => {
  ingredientPopupData.image = sku.ingredientImage || ''
  showIngredientPopup.value = true
}

/** 关闭成分弹窗 */
const closeIngredientPopup = () => {
  showIngredientPopup.value = false
}

/** 保存选择到 store */
const saveSelectionsToStore = (action: 'addToCart' | 'checkout') => {
  freshFoodStore.flowAction = action
  freshFoodStore.planSelections = {
    ratioId: currentRatio.value?.id || '',
    frequencyId: currentFrequency.value?.id || '',
    recipes: currentRecipeQuantityArray.value
      .filter((r) => r.quantity > 0)
      .map((r) => ({ skuId: r.skuId, quantity: r.quantity })),
  }
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

/** 顶部栏返回按钮处理 */
const handleBack = () => {
  if (flowCompleted.value) {
    clearStackAndNavigate()
  } else {
    uni.navigateBack()
  }
}

/** 执行最终操作 (当没有snacks和toys页面时使用) */
const executeFinalAction = async (action: 'addToCart' | 'checkout') => {
  const params = {
    planId: freshFoodStore.planId,
    planSelections: freshFoodStore.planSelections,
    items: freshFoodStore.extraItems,
  }

  if (action === 'addToCart') {
    await cartApi.addItem('my-cart', params)
    freshFoodStore.clearState()
    flowCompleted.value = true // 显示成功操作栏
  } else {
    const res = await checkoutApi.entryDirect(params)
    freshFoodStore.clearState()
    clearStackAndNavigate(`/orderPages/checkout/checkout?previewId=${res.result.previewId}`)
  }
}

/** 判断是否有下一页，并跳转 */
const proceedNext = (action: 'addToCart' | 'checkout') => {
  const hasSnacks = planData.value.snacks && planData.value.snacks.list?.length > 0
  const hasToys =
    planData.value.toys &&
    (planData.value.toys.toyCategories?.length > 0 || planData.value.toys.chews?.length > 0)

  if (hasSnacks) {
    uni.navigateTo({ url: '/freshFoodPages/fresh_food_snacks/fresh_food_snacks' })
  } else if (hasToys) {
    uni.navigateTo({ url: '/freshFoodPages/fresh_food_toys/fresh_food_toys' })
  } else {
    // 已经是最后一步
    uni.showLoading({ title: '处理中...' })
    executeFinalAction(action)
      .catch(() => {
        uni.showToast({
          title: action === 'addToCart' ? '加入购物车失败，请稍后重试' : '结算失败，请稍后重试',
          icon: 'none',
        })
      })
      .finally(() => {
        uni.hideLoading()
      })
  }
}

/** 加入购物车 */
const addToCart = () => {
  if (!isOrderValid.value) {
    uni.showToast({ title: `请选满${totalPacks.value}袋食谱`, icon: 'none' })
    return
  }
  saveSelectionsToStore('addToCart')
  proceedNext('addToCart')
}

/** 立即结算 */
const checkout = () => {
  if (!isOrderValid.value) {
    uni.showToast({ title: `请选满${totalPacks.value}袋食谱`, icon: 'none' })
    return
  }
  saveSelectionsToStore('checkout')
  proceedNext('checkout')
}

/** 场景值为 cart/subscription 时的单独保存逻辑 */
const handleSave = async () => {
  if (!isOrderValid.value) {
    uni.showToast({ title: `请选满${totalPacks.value}袋食谱`, icon: 'none' })
    return
  }

  const payload = {
    planSelections: {
      ratioId: currentRatio.value?.id || '',
      frequencyId: currentFrequency.value?.id || '',
      recipes: currentRecipeQuantityArray.value
        .filter((r) => r.quantity > 0)
        .map((r) => ({ skuId: r.skuId, quantity: r.quantity })),
    },
  }

  const queryParams: any = { scene: scene.value }
  if (scene.value === 'cart') {
    queryParams.cartId = cartId.value
    queryParams.itemId = itemId.value
  } else if (scene.value === 'subscription') {
    queryParams.subscriptionId = subscriptionId.value
    queryParams.itemId = itemId.value
  }

  uni.showLoading({ title: '保存中...' })
  try {
    await freshFoodApi.updatePlan(freshFoodStore.planId, payload, queryParams)
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch (e) {
    console.error('保存计划失败', e)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

// ========== 数据加载 ==========
/** 通过 planId 加载方案数据 */
const loadPlanData = async (planId: string) => {
  isLoading.value = true
  try {
    const planRes = await freshFoodApi.getPlan(planId)
    if (planRes.code === '0' && planRes.result) {
      planData.value = planRes.result
      freshFoodStore.currentPlan = planRes.result // 缓存到store供后续页面使用
    } else {
      uni.showToast({ title: '加载方案失败', icon: 'none' })
    }
  } catch (e) {
    console.error('加载方案数据失败', e)
    uni.showToast({ title: '加载方案失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

onLoad((options) => {
  if (options?.scene) {
    scene.value = options.scene as any
    cartId.value = options.cartId || ''
    itemId.value = options.itemId || ''
    subscriptionId.value = options.subscriptionId || ''
  }

  if (options?.planId) {
    freshFoodStore.planId = options.planId
    loadPlanData(options.planId)
  } else {
    uni.showToast({ title: '缺少方案ID', icon: 'none' })
    isLoading.value = false
  }
})
</script>

<style lang="scss" scoped>
.fresh-food-plan-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: $uni-bg-color-grey;
}

.plan-content {
  flex: 1;
}

// 宠物信息
.pet-summary {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background: linear-gradient(135deg, $uni-color-primary 0%, $uni-color-success 100%);

  .pet-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    border: 4rpx solid rgba($uni-text-color-inverse, 0.5);
    flex-shrink: 0;
  }

  .pet-info {
    flex: 1;
    margin-left: 20rpx;

    .pet-name {
      display: block;
      font-size: 36rpx;
      font-weight: 700;
      color: $uni-text-color-inverse;
      margin-bottom: 8rpx;
    }

    .pet-desc {
      font-size: 26rpx;
      color: rgba($uni-text-color-inverse, 0.9);
    }
  }
}

// 通用Section
.section {
  margin: 20rpx;
  padding: 24rpx;
  background-color: $uni-bg-color;
  border-radius: 16rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $uni-text-color;
    }

    .section-hint {
      font-size: 24rpx;
      color: $uni-text-color-placeholder;
    }
  }
}

// 占比
.ratio-options {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.ratio-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 20rpx;
  background-color: $uni-bg-color-grey;
  border-radius: 12rpx;
  border: 2rpx solid transparent;

  &.selected {
    border-color: $uni-color-primary;
    background-color: rgba($uni-color-primary, 0.08);
  }

  &.recommended {
    .recommended-tag {
      position: absolute;
      top: -10rpx;
      right: 16rpx;
      background-color: $uni-color-warning;
      color: $uni-text-color-inverse;
      font-size: 18rpx;
      padding: 2rpx 10rpx;
      border-radius: 6rpx;
    }
  }

  .ratio-image {
    width: 60rpx;
    height: 40rpx;
    border-radius: 6rpx;
    flex-shrink: 0;
  }

  .ratio-info {
    flex: 1;

    .ratio-name {
      display: block;
      font-size: 28rpx;
      font-weight: 600;
      color: $uni-text-color;
      margin-bottom: 2rpx;
    }

    .ratio-desc {
      font-size: 22rpx;
      color: $uni-text-color-grey;
    }
  }
}

.first-order-note {
  display: block;
  font-size: 24rpx;
  color: $uni-color-warning;
  margin-bottom: 20rpx;
}

// 频率
.frequency-options {
  display: flex;
  gap: 12rpx;
}

.frequency-card {
  flex: 1;
  position: relative;
  padding: 24rpx 16rpx 16rpx;
  background-color: $uni-bg-color-grey;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  text-align: center;

  &.selected {
    border-color: $uni-color-primary;
    background-color: rgba($uni-color-primary, 0.08);
  }

  &.has-tag {
    padding-top: 28rpx;
  }

  .freq-tag {
    position: absolute;
    top: -10rpx;
    left: 50%;
    transform: translateX(-50%);
    background-color: $uni-color-error;
    color: $uni-text-color-inverse;
    font-size: 16rpx;
    padding: 2rpx 10rpx;
    border-radius: 6rpx;
    white-space: nowrap;
  }

  .freq-recommend-tag {
    position: absolute;
    top: -10rpx;
    right: 8rpx;
    background-color: $uni-color-warning;
    color: $uni-text-color-inverse;
    font-size: 16rpx;
    padding: 2rpx 8rpx;
    border-radius: 6rpx;
  }

  .freq-label {
    display: block;
    font-size: 26rpx;
    font-weight: 600;
    color: $uni-text-color;
    margin-bottom: 6rpx;
  }

  .freq-packs {
    font-size: 20rpx;
    color: $uni-text-color-grey;
  }
}

// 食谱列表
.recipes-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.recipe-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 16rpx;
  background-color: $uni-bg-color-grey;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s ease;

  &.active {
    border-color: $uni-color-primary;
    background-color: rgba($uni-color-primary, 0.08);
  }

  .recipe-recommended-tag {
    position: absolute;
    top: -8rpx;
    left: 16rpx;
    background-color: $uni-color-warning;
    color: $uni-text-color-inverse;
    font-size: 18rpx;
    padding: 2rpx 10rpx;
    border-radius: 6rpx;
  }

  .recipe-image {
    width: 100rpx;
    height: 100rpx;
    border-radius: 12rpx;
    flex-shrink: 0;
  }

  .recipe-info {
    flex: 1;
    margin-left: 16rpx;

    .recipe-name {
      display: block;
      font-size: 28rpx;
      font-weight: 600;
      color: $uni-text-color;
      margin-bottom: 4rpx;
    }

    .recipe-desc {
      display: block;
      font-size: 22rpx;
      color: $uni-text-color-grey;
      margin-bottom: 4rpx;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .recipe-detail-link {
      font-size: 24rpx;
      color: $uni-color-warning;
      font-weight: 500;
    }
  }

  .recipe-stepper {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-left: 12rpx;
    flex-shrink: 0;
  }

  .stepper-btn {
    width: 52rpx;
    height: 52rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid $uni-border-color;
    background-color: $uni-bg-color;

    text {
      font-size: 28rpx;
      color: $uni-text-color;
      line-height: 1;
    }

    &.plus {
      background-color: $uni-color-primary;
      border-color: $uni-color-primary;

      text {
        color: $uni-text-color-inverse;
      }
    }

    &.disabled {
      opacity: 0.4;
    }
  }

  .stepper-value {
    font-size: 28rpx;
    font-weight: 600;
    min-width: 40rpx;
    text-align: center;
  }
}

// 底部占位
.footer-placeholder {
  height: 280rpx;
}

// 底部固定栏
.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background-color: $uni-bg-color;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.08);

  .price-info {
    flex: 1;

    .price-row {
      display: flex;
      align-items: baseline;
      gap: 8rpx;
      margin-bottom: 4rpx;
    }

    .price-current {
      font-size: 36rpx;
      font-weight: 700;
      color: $uni-color-warning;
    }

    .price-daily {
      font-size: 24rpx;
      color: $uni-text-color-grey;
    }

    .discount-note {
      display: block;
      font-size: 24rpx;
      color: $uni-color-warning;
      margin-bottom: 2rpx;
    }
    .future-order-note {
      font-size: 24rpx;
      color: $uni-text-color-placeholder;
    }
    .shipping-note {
      font-size: 20rpx;
      color: $uni-text-color-placeholder;
    }
  }

  .action-buttons {
    display: flex;
    align-items: flex-end;
    gap: 12rpx;

    button {
      margin: 0;
      padding: 0;
      font-size: 26rpx;

      &::after {
        border: none;
      }

      &[disabled] {
        opacity: 0.5;
      }
    }

    .btn-cart {
      height: 64rpx;
      padding: 0 24rpx;
      border-radius: 32rpx;
      background-color: $uni-bg-color;
      border: 2rpx solid $uni-color-primary;
      color: $uni-color-primary;
      font-weight: 500;
    }

    .btn-checkout {
      height: 64rpx;
      padding: 0 28rpx;
      border-radius: 32rpx;
      background-color: $uni-color-warning;
      color: $uni-text-color-inverse;
      font-weight: 600;
    }
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
    color: $uni-text-color;
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
      background-color: $uni-bg-color;
      margin: 0;
      padding: 0;

      &::after {
        border: none;
      }
    }

    button.btn-cart {
      color: $uni-color-error; /* 粉色字体 */
      border: 2rpx solid $uni-color-error; /* 粉色边框 */
    }

    button.btn-another {
      color: $uni-color-error; /* 红色字体 */
      border: 2rpx solid $uni-color-error; /* 红色边框 */
    }
  }
}

// 加载态
.loading-overlay {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $uni-bg-color-grey;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.loading-spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid $uni-border-color;
  border-top-color: $uni-color-primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 30rpx;
  color: $uni-text-color-grey;
}

// 成分详情弹窗
.recipe-popup-mask {
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

.recipe-popup {
  width: 100%;
  height: 85vh;
  background-color: $uni-bg-color;
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
    background-color: rgba($uni-text-color-inverse, 0.9);
    border-radius: 50%;
    z-index: 10;
  }

  .popup-scroll {
    height: 100%;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .popup-ingredient-image {
    width: 100%;
  }

  .popup-ingredient-info {
    padding: 24rpx 40rpx 40rpx;
  }

  .popup-title {
    font-size: 36rpx;
    font-weight: 700;
    color: $uni-text-color;
    margin-bottom: 20rpx;
  }

  .popup-ingredient-section {
    margin-top: 16rpx;
  }

  .popup-section-label {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: $uni-text-color;
    margin-bottom: 8rpx;
  }

  .popup-ingredient-text {
    font-size: 26rpx;
    color: $uni-text-color-grey;
    line-height: 1.8;
  }
}
</style>
