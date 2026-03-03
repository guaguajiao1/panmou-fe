<template>
  <view class="fresh-food-plan-page">
    <CustomNavigationBar title="定制方案" show-back />

    <scroll-view scroll-y class="plan-content">
      <!-- 宠物信息摘要 -->
      <view class="pet-summary">
        <image
          v-if="planData.pet.avatar"
          class="pet-avatar"
          :src="planData.pet.avatar"
          mode="aspectFill"
        />
        <view class="pet-info">
          <text class="pet-name">{{ planData.pet.name }}的专属方案</text>
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
              selected: planData.ratios.selected === ratio.id,
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
        <view class="frequency-options">
          <view
            v-for="freq in currentFrequencies"
            :key="freq.id"
            class="frequency-card"
            :class="{
              selected: selectedFrequencyId === freq.id,
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
            v-for="recipeSku in currentRecipes"
            :key="recipeSku.sku.skuId"
            class="recipe-card"
            :class="{ active: recipeSku.quantity > 0 }"
          >
            <view v-if="recipeSku.recommended" class="recipe-recommended-tag">推荐</view>
            <image class="recipe-image" :src="recipeSku.sku.image?.[0] || ''" mode="aspectFill" />
            <view class="recipe-info">
              <text class="recipe-name">{{ recipeSku.sku.name }}</text>
              <text class="recipe-desc">{{ recipeSku.sku.desc }}</text>
              <text class="recipe-price">¥{{ recipeSku.sku.originalPrice }}/袋</text>
            </view>
            <view class="recipe-stepper">
              <view
                class="stepper-btn minus"
                :class="{ disabled: recipeSku.quantity <= 0 }"
                @click="decreaseRecipeQuantity(recipeSku.sku.skuId)"
              >
                <text>−</text>
              </view>
              <text class="stepper-value">{{ recipeSku.quantity }}</text>
              <view
                class="stepper-btn plus"
                :class="{ disabled: !canIncrease(recipeSku.sku.skuId) }"
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

    <!-- 食谱详情弹窗 -->
    <view v-if="showRecipePopup" class="recipe-popup-mask" @click="closeRecipePopup">
      <view class="recipe-popup" @click.stop>
        <view class="popup-close" @click="closeRecipePopup">
          <uni-icons type="close" size="24" color="#666" />
        </view>
        <scroll-view class="popup-scroll" scroll-y>
          <view class="popup-image-container">
            <image
              class="popup-main-image"
              :src="recipeDetail?.product?.images?.[0] || ''"
              mode="aspectFill"
            />
          </view>
          <view class="popup-title">{{ recipeDetail?.product?.title }}</view>
          <view class="popup-detail-images">
            <image
              v-for="(img, index) in recipeDetail?.product?.detailImages"
              :key="index"
              class="detail-image"
              :src="img"
              mode="widthFix"
            />
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 底部栏 -->
    <view class="footer-bar">
      <view class="price-info">
        <view class="price-row">
          <text class="price-current">¥{{ totalCost.toFixed(2) }}</text>
          <text class="price-daily">(¥{{ dailyCost.toFixed(2) }}/天)</text>
        </view>
        <text class="discount-note">🎉 首单立减{{ planData.firstOrderDiscount }}%</text>
        <text class="shipping-note">运费: ¥{{ currentShippingFee }}</text>
      </view>
      <view class="action-buttons">
        <button class="btn-cart" :disabled="!isOrderValid" @click="addToCart">加入购物车</button>
        <button class="btn-checkout" :disabled="!isOrderValid" @click="checkout">立即结算</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type {
  FreshPlanPageData,
  FreshFoodRecipeSku,
  FreshFoodOrderParams,
} from '@/types/fresh-food'
import type { ProductData } from '@/types/product'
import { getProductDetail } from '@/api/product'
import { useFreshFoodStore } from '@/stores'
import { freshFoodApi } from '@/api/fresh-food'
import { cartApi } from '@/api/cart'
import { checkoutApi } from '@/api/checkout'

const freshFoodStore = useFreshFoodStore()

const petId = ref('')
const isLoading = ref(false)
const showRecipePopup = ref(false)
const recipeDetail = ref<ProductData | null>(null)
const isLoadingRecipe = ref(false)
const selectedFrequencyId = ref('')

// 统一页面数据
const planData = reactive<FreshPlanPageData>({
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
    selected: '',
  },
  firstOrderDiscount: 50,
  futureOrderNote: '',
})

// ========== Computed ==========

/** 当前选中的占比对象 */
const currentRatio = computed(() => {
  return planData.ratios.list.find((r) => r.id === planData.ratios.selected)
})

/** 当前占比下的配送频率列表 */
const currentFrequencies = computed(() => {
  return currentRatio.value?.frequencies || []
})

/** 当前选中的频率对象 */
const currentFrequency = computed(() => {
  return currentFrequencies.value.find((f) => f.id === selectedFrequencyId.value)
})

/** 当前占比下的食谱SKU列表 */
const currentRecipes = computed(() => {
  return currentRatio.value?.recipes || []
})

/** 当前占比+频率下的总袋数 n */
const totalPacks = computed(() => {
  return currentFrequency.value?.totalPacks || 0
})

/** 已选食谱种类数（quantity > 0 的食谱数） */
const selectedRecipeCount = computed(() => {
  return currentRecipes.value.filter((r) => r.quantity > 0).length
})

/** 已选食谱总数量 */
const totalSelectedQuantity = computed(() => {
  return currentRecipes.value.reduce((sum, r) => sum + r.quantity, 0)
})

/** 当前频率的运费 */
const currentShippingFee = computed(() => {
  return currentFrequency.value?.shippingFee || '0'
})

/** 食谱总价 = ∑(sku.originalPrice × quantity) */
const totalRecipePrice = computed(() => {
  return currentRecipes.value.reduce((sum, r) => {
    return sum + parseFloat(r.sku.originalPrice || '0') * r.quantity
  }, 0)
})

/** 总费用 = 食谱总价 + 运费 */
const totalCost = computed(() => {
  return totalRecipePrice.value + parseFloat(currentShippingFee.value || '0')
})

/** 每日花费 = 总费用 / 配送周期天数 */
const dailyCost = computed(() => {
  const days = currentFrequency.value?.deliveryDays || 1
  return totalCost.value / days
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
  const recipe = currentRecipes.value.find((r) => r.sku.skuId === skuId)
  if (!recipe) return false
  // 如果当前数量为0，检查已选种类数是否已达3
  if (recipe.quantity === 0 && selectedRecipeCount.value >= 3) return false
  return true
}

/** 均分食谱数量：将 n 均分给推荐食谱，有余数从前往后依次加1 */
const distributeRecipes = () => {
  const recipes = currentRecipes.value
  if (recipes.length === 0 || totalPacks.value === 0) return

  // 先全部归零
  recipes.forEach((r) => (r.quantity = 0))

  // 找到推荐食谱，如果没有推荐，则取前3个
  let targetRecipes = recipes.filter((r) => r.recommended)
  if (targetRecipes.length === 0) {
    targetRecipes = recipes.slice(0, Math.min(3, recipes.length))
  }
  // 最多3种
  targetRecipes = targetRecipes.slice(0, 3)

  const n = totalPacks.value
  const base = Math.floor(n / targetRecipes.length)
  const remainder = n % targetRecipes.length

  targetRecipes.forEach((r, idx) => {
    r.quantity = base + (idx < remainder ? 1 : 0)
  })
}

/** 选择占比 */
const selectRatio = (id: string) => {
  if (planData.ratios.selected === id) return
  planData.ratios.selected = id

  // 切换频率为推荐或第一个
  const freqs = currentFrequencies.value
  const recommended = freqs.find((f) => f.recommended)
  selectedFrequencyId.value = recommended?.id || freqs[0]?.id || ''

  // 均分食谱
  distributeRecipes()
}

/** 选择频率 */
const selectFrequency = (id: string) => {
  if (selectedFrequencyId.value === id) return
  selectedFrequencyId.value = id

  // 频率变了 → totalPacks(n) 变了 → 重新均分
  distributeRecipes()
}

/** 增加食谱数量 */
const increaseRecipeQuantity = (skuId: string) => {
  if (!canIncrease(skuId)) {
    if (totalSelectedQuantity.value >= totalPacks.value) {
      uni.showToast({ title: `总数不能超过${totalPacks.value}袋`, icon: 'none' })
    } else {
      uni.showToast({ title: '最多选择3种食谱', icon: 'none' })
    }
    return
  }
  const recipe = currentRecipes.value.find((r) => r.sku.skuId === skuId)
  if (recipe) recipe.quantity++
}

/** 减少食谱数量 */
const decreaseRecipeQuantity = (skuId: string) => {
  const recipe = currentRecipes.value.find((r) => r.sku.skuId === skuId)
  if (recipe && recipe.quantity > 0) {
    recipe.quantity--
  }
}

/** 查看食谱详情 */
const viewRecipeDetail = async (skuId: string) => {
  isLoadingRecipe.value = true
  showRecipePopup.value = true
  try {
    const recipe = currentRecipes.value.find((r) => r.sku.skuId === skuId)
    const productId = recipe?.sku.productId || skuId
    const data = await getProductDetail(productId)
    recipeDetail.value = data
  } catch (e) {
    console.error('加载食谱详情失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
    showRecipePopup.value = false
  } finally {
    isLoadingRecipe.value = false
  }
}

/** 关闭食谱详情弹窗 */
const closeRecipePopup = () => {
  showRecipePopup.value = false
  recipeDetail.value = null
}

/** 保存选择到 store */
const saveSelectionsToStore = (action: 'addToCart' | 'checkout') => {
  freshFoodStore.flowAction = action
  freshFoodStore.planSelections = {
    ratioId: planData.ratios.selected,
    frequencyId: selectedFrequencyId.value,
    recipes: currentRecipes.value
      .filter((r) => r.quantity > 0)
      .map((r) => ({ skuId: r.sku.skuId, quantity: r.quantity })),
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
    uni.showToast({ title: '已加入购物车', icon: 'success' })
    freshFoodStore.clearState()
    setTimeout(() => {
      uni.switchTab({ url: '/pages/cart/cart' })
    }, 1000)
  } else {
    const res = await checkoutApi.entryDirect(params)
    freshFoodStore.clearState()
    uni.navigateTo({
      url: `/orderPages/checkout/checkout?previewId=${res.result.previewId}`,
    })
  }
}

/** 加入购物车 */
const addToCart = async () => {
  if (!isOrderValid.value) {
    uni.showToast({ title: `请选满${totalPacks.value}袋食谱`, icon: 'none' })
    return
  }

  saveSelectionsToStore('addToCart')

  // 判断是否有下一页（snacks）
  const hasNextPage = true // TODO: 可通过 planData 配置控制
  if (hasNextPage) {
    uni.navigateTo({ url: '/freshFoodPages/fresh_food_snacks/fresh_food_snacks' })
  } else {
    uni.showLoading({ title: '添加中...' })
    try {
      await executeFinalAction('addToCart')
    } catch {
      uni.showToast({ title: '添加失败', icon: 'none' })
    } finally {
      uni.hideLoading()
    }
  }
}

/** 立即结算 */
const checkout = async () => {
  if (!isOrderValid.value) {
    uni.showToast({ title: `请选满${totalPacks.value}袋食谱`, icon: 'none' })
    return
  }

  saveSelectionsToStore('checkout')

  const hasNextPage = true
  if (hasNextPage) {
    uni.navigateTo({ url: '/freshFoodPages/fresh_food_snacks/fresh_food_snacks' })
  } else {
    uni.showLoading({ title: '处理中...' })
    try {
      await executeFinalAction('checkout')
    } catch {
      uni.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      uni.hideLoading()
    }
  }
}

// ========== 数据加载 ==========

const loadPlanData = async () => {
  isLoading.value = true
  try {
    // 1. 创建 Plan
    const createRes = await freshFoodApi.createPlan({ petId: petId.value })
    if (createRes.code === '0' && createRes.result) {
      freshFoodStore.planId = createRes.result.planId

      // 2. 获取 Plan 详情
      const planRes = await freshFoodApi.getPlan(freshFoodStore.planId)
      if (planRes.code === '0' && planRes.result) {
        Object.assign(planData, planRes.result)
        // 默认选推荐占比
        const recommendedRatio = planData.ratios.list.find((r) => r.recommended)
        planData.ratios.selected = recommendedRatio?.id || planData.ratios.list[0]?.id || ''
        // 默认选推荐频率
        const freqs = currentFrequencies.value
        const recommendedFreq = freqs.find((f) => f.recommended)
        selectedFrequencyId.value = recommendedFreq?.id || freqs[0]?.id || ''
        // 均分食谱
        distributeRecipes()
      }
    }
  } catch (e) {
    console.error('加载方案数据失败', e)
    loadMockData()
  } finally {
    isLoading.value = false
  }
}

/** Mock 辅助：创建鲜食 SKU */
const makeFreshSku = (
  id: string,
  name: string,
  desc: string,
  price: string,
  imageEmoji: string,
) => ({
  skuId: id,
  productId: id,
  strikeThroughPrice: price,
  advertisedPrice: price,
  originalPrice: price,
  subscriptionPrice: price,
  name,
  image: [`https://placehold.co/200x200/90EE90/333?text=${encodeURIComponent(imageEmoji)}`],
  desc,
  specs: '',
  type: 8,
  supportsSubscription: true,
  subscriptionDiscountRate: '0',
  subscriptionDiscount: '',
  maxQuantity: 99,
})

const loadMockData = () => {
  planData.pet = {
    id: petId.value || 'pet1',
    name: '小西',
    type: 'dog',
    avatar: 'https://placehold.co/80x80/f5e6d3/333?text=🐕',
    breedName: '柴犬',
    birthday: '2022-05-15',
    gender: 'male',
    neutered: true,
    currentWeight: 12,
    idealWeight: 11,
    bodyCondition: 'ideal',
    activityLevel: 'moderate',
    pickyLevel: 'sometimes',
    summary: '成年柴犬，体型标准，活动量适中',
  }

  // 通用食谱 SKU
  const chickenSku = makeFreshSku(
    'r1',
    '鸡肉蔬菜餐',
    '选用优质鸡胸肉，搭配新鲜时令蔬菜',
    '25.00',
    '🍗',
  )
  const beefSku = makeFreshSku('r2', '牛肉红薯餐', '精选牛腿肉，配以香甜红薯和南瓜', '28.00', '🥩')
  const fishSku = makeFreshSku('r3', '三文鱼餐', '深海三文鱼，富含Omega-3脂肪酸', '32.00', '🐟')
  const lambSku = makeFreshSku('r4', '羊肉糙米餐', '新西兰羊肉，搭配有机糙米', '30.00', '🐑')

  planData.ratios = {
    list: [
      {
        id: 'ratio100',
        name: '100%鲜食',
        description: '完全以鲜食为主',
        percentage: 100,
        recommended: true,
        image: 'https://placehold.co/60x40/00a86b/fff?text=100%25',
        frequencies: [
          {
            id: 'f100_2w',
            interval: 2,
            unit: 'week',
            label: '每2周',
            totalPacks: 14,
            deliveryDays: 14,
            shippingFee: '0',
            tag: '最划算',
            recommended: true,
          },
          {
            id: 'f100_3w',
            interval: 3,
            unit: 'week',
            label: '每3周',
            totalPacks: 21,
            deliveryDays: 21,
            shippingFee: '0',
            tag: '🧊 冰箱友好',
          },
          {
            id: 'f100_4w',
            interval: 4,
            unit: 'week',
            label: '每4周',
            totalPacks: 28,
            deliveryDays: 28,
            shippingFee: '10',
          },
        ],
        recipes: [
          { sku: chickenSku, quantity: 0, recommended: true },
          { sku: beefSku, quantity: 0, recommended: true },
          { sku: fishSku, quantity: 0 },
          { sku: lambSku, quantity: 0 },
        ],
      },
      {
        id: 'ratio50',
        name: '50%鲜食',
        description: '鲜食搭配干粮',
        percentage: 50,
        image: 'https://placehold.co/60x40/ffa500/fff?text=50%25',
        frequencies: [
          {
            id: 'f50_2w',
            interval: 2,
            unit: 'week',
            label: '每2周',
            totalPacks: 7,
            deliveryDays: 14,
            shippingFee: '0',
            recommended: true,
          },
          {
            id: 'f50_3w',
            interval: 3,
            unit: 'week',
            label: '每3周',
            totalPacks: 11,
            deliveryDays: 21,
            shippingFee: '5',
          },
          {
            id: 'f50_4w',
            interval: 4,
            unit: 'week',
            label: '每4周',
            totalPacks: 14,
            deliveryDays: 28,
            shippingFee: '10',
          },
        ],
        recipes: [
          { sku: chickenSku, quantity: 0, recommended: true },
          { sku: beefSku, quantity: 0 },
          { sku: fishSku, quantity: 0, recommended: true },
        ],
      },
      {
        id: 'ratio25',
        name: '25%鲜食',
        description: '鲜食作为辅食',
        percentage: 25,
        image: 'https://placehold.co/60x40/6495ed/fff?text=25%25',
        frequencies: [
          {
            id: 'f25_2w',
            interval: 2,
            unit: 'week',
            label: '每2周',
            totalPacks: 4,
            deliveryDays: 14,
            shippingFee: '0',
            recommended: true,
          },
          {
            id: 'f25_4w',
            interval: 4,
            unit: 'week',
            label: '每4周',
            totalPacks: 7,
            deliveryDays: 28,
            shippingFee: '10',
          },
        ],
        recipes: [
          { sku: chickenSku, quantity: 0, recommended: true },
          { sku: beefSku, quantity: 0 },
        ],
      },
    ],
    selected: '',
  }

  planData.firstOrderDiscount = 50
  planData.futureOrderNote = '后续订单按原价计算'

  // 默认选推荐占比
  const recommendedRatio = planData.ratios.list.find((r) => r.recommended)
  planData.ratios.selected = recommendedRatio?.id || planData.ratios.list[0]?.id || ''

  // 默认选推荐频率
  const freqs = currentFrequencies.value
  const recommendedFreq = freqs.find((f) => f.recommended)
  selectedFrequencyId.value = recommendedFreq?.id || freqs[0]?.id || ''

  // 均分食谱
  distributeRecipes()
}

onLoad((options) => {
  if (options?.petId) {
    petId.value = options.petId
    loadPlanData()
  } else {
    loadMockData()
  }
})
</script>

<style lang="scss" scoped>
.fresh-food-plan-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.plan-content {
  flex: 1;
}

// 宠物信息
.pet-summary {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background: linear-gradient(135deg, #00a86b 0%, #00c853 100%);

  .pet-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    border: 4rpx solid rgba(255, 255, 255, 0.5);
    flex-shrink: 0;
  }

  .pet-info {
    flex: 1;
    margin-left: 20rpx;

    .pet-name {
      display: block;
      font-size: 36rpx;
      font-weight: 700;
      color: #fff;
      margin-bottom: 8rpx;
    }

    .pet-desc {
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

// 通用Section
.section {
  margin: 20rpx;
  padding: 24rpx;
  background-color: #fff;
  border-radius: 16rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }

    .section-hint {
      font-size: 24rpx;
      color: #999;
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
  background-color: #f8f8f8;
  border-radius: 12rpx;
  border: 2rpx solid transparent;

  &.selected {
    border-color: #00a86b;
    background-color: #e8f5e9;
  }

  &.recommended {
    .recommended-tag {
      position: absolute;
      top: -10rpx;
      right: 16rpx;
      background-color: #ff6600;
      color: #fff;
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
      color: #333;
      margin-bottom: 2rpx;
    }

    .ratio-desc {
      font-size: 22rpx;
      color: #666;
    }
  }
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
  background-color: #f8f8f8;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  text-align: center;

  &.selected {
    border-color: #00a86b;
    background-color: #e8f5e9;
  }

  &.has-tag {
    padding-top: 28rpx;
  }

  .freq-tag {
    position: absolute;
    top: -10rpx;
    left: 50%;
    transform: translateX(-50%);
    background-color: #c2185b;
    color: #fff;
    font-size: 16rpx;
    padding: 2rpx 10rpx;
    border-radius: 6rpx;
    white-space: nowrap;
  }

  .freq-recommend-tag {
    position: absolute;
    top: -10rpx;
    right: 8rpx;
    background-color: #ff6600;
    color: #fff;
    font-size: 16rpx;
    padding: 2rpx 8rpx;
    border-radius: 6rpx;
  }

  .freq-label {
    display: block;
    font-size: 26rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 6rpx;
  }

  .freq-packs {
    font-size: 20rpx;
    color: #666;
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
  background-color: #f8f8f8;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s ease;

  &.active {
    border-color: #00a86b;
    background-color: #e8f5e9;
  }

  .recipe-recommended-tag {
    position: absolute;
    top: -8rpx;
    left: 16rpx;
    background-color: #ff6600;
    color: #fff;
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
      color: #333;
      margin-bottom: 4rpx;
    }

    .recipe-desc {
      display: block;
      font-size: 22rpx;
      color: #666;
      margin-bottom: 4rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .recipe-price {
      font-size: 24rpx;
      color: #ff6600;
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
    border: 2rpx solid #ddd;
    background-color: #fff;

    text {
      font-size: 28rpx;
      color: #333;
      line-height: 1;
    }

    &.plus {
      background-color: #00a86b;
      border-color: #00a86b;

      text {
        color: #fff;
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
  background-color: #fff;
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
      font-size: 40rpx;
      font-weight: 700;
      color: #ff6600;
    }

    .price-daily {
      font-size: 22rpx;
      color: #666;
    }

    .discount-note {
      display: block;
      font-size: 22rpx;
      color: #c2185b;
      margin-bottom: 2rpx;
    }

    .shipping-note {
      font-size: 20rpx;
      color: #999;
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
      background-color: #fff;
      border: 2rpx solid #00a86b;
      color: #00a86b;
      font-weight: 500;
    }

    .btn-checkout {
      height: 64rpx;
      padding: 0 28rpx;
      border-radius: 32rpx;
      background-color: #ff6600;
      color: #fff;
      font-weight: 600;
    }
  }
}

// 食谱详情弹窗
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

  .popup-image-container {
    width: 100%;
  }

  .popup-main-image {
    width: 100%;
    height: 400rpx;
  }

  .popup-title {
    text-align: center;
    font-size: 36rpx;
    font-weight: 700;
    color: #1a1a1a;
    padding: 20rpx 40rpx;
  }

  .popup-detail-images {
    padding: 0 24rpx 40rpx;

    .detail-image {
      width: 100%;
      display: block;
      margin-bottom: 0;
    }
  }
}
</style>
