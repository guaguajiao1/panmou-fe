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

      <!-- 1. 食谱选择（最上方） -->
      <view class="section recipes-section">
        <view class="section-header">
          <text class="section-title">选择食谱</text>
          <text class="section-hint">最多选择{{ planData.recipes.maxSelectable }}款</text>
        </view>
        <view class="recipes-grid">
          <view
            v-for="recipe in planData.recipes.list"
            :key="recipe.id"
            class="recipe-card"
            :class="{ selected: planData.recipes.selected.includes(recipe.id) }"
            @click="toggleRecipe(recipe.id)"
          >
            <view v-if="recipe.recommended" class="recipe-recommended-tag">推荐</view>
            <view v-if="planData.recipes.selected.includes(recipe.id)" class="recipe-check">
              <uni-icons type="checkbox-filled" size="16" color="#00a86b" />
            </view>
            <image class="recipe-image" :src="recipe.image" mode="aspectFill" />
            <text class="recipe-name">{{ recipe.name }}</text>
            <text class="recipe-detail-btn" @click.stop="viewRecipeDetail(recipe.id)">详情</text>
          </view>
        </view>
      </view>

      <!-- 2. 鲜食占比 -->
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

      <!-- 3. 配送频率 -->
      <view class="section frequency-section">
        <view class="section-header">
          <text class="section-title">配送频率</text>
        </view>
        <view class="frequency-options">
          <view
            v-for="freq in planData.frequencies.list"
            :key="freq.id"
            class="frequency-card"
            :class="{
              selected: planData.frequencies.selected === freq.id,
              'has-tag': freq.tag,
            }"
            @click="selectFrequency(freq.id)"
          >
            <view v-if="freq.tag" class="freq-tag">{{ freq.tag }}</view>
            <text class="freq-label">{{ freq.label }}</text>
            <text class="freq-packs">每次配送{{ freq.packsPerDelivery }}包</text>
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="footer-placeholder" />
    </scroll-view>

    <!-- 食谱详情弹窗 -->
    <view v-if="showRecipePopup" class="recipe-popup-mask" @click="closeRecipePopup">
      <view class="recipe-popup" @click.stop>
        <!-- 关闭按钮 -->
        <view class="popup-close" @click="closeRecipePopup">
          <uni-icons type="close" size="24" color="#666" />
        </view>

        <!-- 可滚动内容 -->
        <scroll-view class="popup-scroll" scroll-y>
          <!-- 食谱主图（圆形） -->
          <view class="popup-image-container">
            <image
              class="popup-main-image"
              :src="recipeDetail?.item?.images?.[0] || ''"
              mode="aspectFill"
            />
          </view>

          <!-- 食谱名称 -->
          <view class="popup-title">{{ recipeDetail?.item?.title }}</view>

          <!-- 详情图片列表 -->
          <view class="popup-detail-images">
            <image
              v-for="(img, index) in recipeDetail?.item?.detailImages"
              :key="index"
              class="detail-image"
              :src="img"
              mode="widthFix"
            />
          </view>
        </scroll-view>
      </view>
    </view>

    <view class="footer-bar">
      <view class="price-info">
        <view class="price-row">
          <text class="price-current">¥{{ currentPrice.discountedTotal.toFixed(2) }}</text>
          <text class="price-daily">(¥{{ currentPrice.dailyPrice.toFixed(2) }}/天)</text>
        </view>
        <text class="discount-note">🎉 首单立减{{ planData.firstOrderDiscount }}%</text>
        <text class="future-note">¥{{ currentPrice.originalTotal.toFixed(2) }} 后续订单价格</text>
      </view>
      <view class="action-buttons">
        <button class="btn-cart" @click="addToCart">加入购物车</button>
        <button class="btn-checkout" @click="checkout">立即结算</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { FreshPlanPageData, PriceMatrixItem } from '@/types/fresh-food'
import type { ProductData } from '@/types/product'
import { getProductDetail } from '@/api/product'

const petId = ref('')
const isLoading = ref(false)
const showRecipePopup = ref(false)
const recipeDetail = ref<ProductData | null>(null)
const isLoadingRecipe = ref(false)

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
  recipes: {
    list: [],
    selected: [],
    maxSelectable: 3,
  },
  ratios: {
    list: [],
    selected: '',
  },
  frequencies: {
    list: [],
    selected: '',
  },
  priceMatrix: [],
  firstOrderDiscount: 50,
  futureOrderNote: '',
})

// 当前价格（从矩阵查表）
const currentPrice = computed<PriceMatrixItem>(() => {
  const item = planData.priceMatrix.find(
    (p) =>
      p.ratioId === planData.ratios.selected && p.frequencyId === planData.frequencies.selected,
  )
  return (
    item || {
      ratioId: '',
      frequencyId: '',
      dailyPrice: 0,
      originalTotal: 0,
      discountedTotal: 0,
    }
  )
})

// 加载方案数据
const loadPlanData = async (recipeIds?: string[]) => {
  isLoading.value = true
  try {
    let url = `/api/fresh-food/plan?petId=${petId.value}`
    if (recipeIds && recipeIds.length > 0) {
      url += `&recipeIds=${recipeIds.join(',')}`
    }

    const res = await uni.request({
      url,
      method: 'GET',
    })

    if (res.statusCode === 200 && res.data) {
      const data = res.data as { code: string; result: FreshPlanPageData }
      if (data.code === '0' && data.result) {
        Object.assign(planData, data.result)
      }
    }
  } catch (e) {
    console.error('加载方案数据失败', e)
    // 使用mock数据
    loadMockData()
  } finally {
    isLoading.value = false
  }
}

// Mock数据
const loadMockData = () => {
  planData.pet = {
    id: petId.value,
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

  planData.recipes = {
    list: [
      {
        id: 'r1',
        name: '鸡肉蒬菜餐',
        description: '选用优质鸡胸肉，搭配新鲜时令蔬菜，低脂肪高蛋白，适合控制体重的狗狗',
        image: 'https://placehold.co/200x200/90EE90/333?text=🍗',
        ingredients: ['鸡胸肉', '胡萝卜', '西兰花', '糟米', '鱼油'],
        nutrition: '蛋白质25g | 脂肪8g | 碳水化合物30g | 热量280kcal',
        recommended: true,
      },
      {
        id: 'r2',
        name: '牛肉红薯餐',
        description: '精选牛腿肉，配以香甜红薯和南瓜，富含铁元素，增强抗疲劳能力',
        image: 'https://placehold.co/200x200/F4A460/333?text=🥩',
        ingredients: ['牛腿肉', '红薯', '南瓜', '燕麦', '亚麻籽油'],
        nutrition: '蛋白质22g | 脂肪12g | 碳水化合物35g | 热量320kcal',
      },
      {
        id: 'r3',
        name: '三文鱼餐',
        description: '深海三文鱼配新鲜蔬菜，富含Omega-3脂肪酸，促进毛发健康亮泽',
        image: 'https://placehold.co/200x200/FFA07A/333?text=🐟',
        ingredients: ['三文鱼', '菠菜', '土豆', '豆角', '橄榄油'],
        nutrition: '蛋白质20g | 脂肪15g | 碳水化合物28g | 热量300kcal',
      },
    ],
    selected: ['r1'],
    maxSelectable: 3,
  }

  planData.ratios = {
    list: [
      {
        id: 'ratio100',
        name: '100%鲜食',
        description: '完全以鲜食为主',
        percentage: 100,
        recommended: true,
        image: 'https://placehold.co/60x40/00a86b/fff?text=100%25',
      },
      {
        id: 'ratio50',
        name: '50%鲜食',
        description: '鲜食搭配干粮',
        percentage: 50,
        image: 'https://placehold.co/60x40/ffa500/fff?text=50%25',
      },
      {
        id: 'ratio25',
        name: '25%鲜食',
        description: '鲜食作为辅食',
        percentage: 25,
        image: 'https://placehold.co/60x40/6495ed/fff?text=25%25',
      },
    ],
    selected: 'ratio100',
  }

  planData.frequencies = {
    list: [
      {
        id: 'f1',
        interval: 2,
        unit: 'week',
        label: '每2周',
        pricePerDay: 0,
        packsPerDelivery: 14,
        tag: '最划算',
      },
      {
        id: 'f2',
        interval: 3,
        unit: 'week',
        label: '每3周',
        pricePerDay: 0,
        packsPerDelivery: 21,
        tag: '🧊 冰箱友好',
      },
      {
        id: 'f3',
        interval: 4,
        unit: 'week',
        label: '每4周',
        pricePerDay: 0,
        packsPerDelivery: 28,
      },
    ],
    selected: 'f1',
  }

  // 价格矩阵 (占比 × 频率)
  planData.priceMatrix = [
    // 100%鲜食
    {
      ratioId: 'ratio100',
      frequencyId: 'f1',
      dailyPrice: 25,
      originalTotal: 700,
      discountedTotal: 350,
    },
    {
      ratioId: 'ratio100',
      frequencyId: 'f2',
      dailyPrice: 24,
      originalTotal: 1008,
      discountedTotal: 504,
    },
    {
      ratioId: 'ratio100',
      frequencyId: 'f3',
      dailyPrice: 23,
      originalTotal: 1288,
      discountedTotal: 644,
    },
    // 50%鲜食
    {
      ratioId: 'ratio50',
      frequencyId: 'f1',
      dailyPrice: 15,
      originalTotal: 420,
      discountedTotal: 210,
    },
    {
      ratioId: 'ratio50',
      frequencyId: 'f2',
      dailyPrice: 14,
      originalTotal: 588,
      discountedTotal: 294,
    },
    {
      ratioId: 'ratio50',
      frequencyId: 'f3',
      dailyPrice: 13,
      originalTotal: 728,
      discountedTotal: 364,
    },
    // 25%鲜食
    {
      ratioId: 'ratio25',
      frequencyId: 'f1',
      dailyPrice: 8,
      originalTotal: 224,
      discountedTotal: 112,
    },
    {
      ratioId: 'ratio25',
      frequencyId: 'f2',
      dailyPrice: 7.5,
      originalTotal: 315,
      discountedTotal: 157.5,
    },
    {
      ratioId: 'ratio25',
      frequencyId: 'f3',
      dailyPrice: 7,
      originalTotal: 392,
      discountedTotal: 196,
    },
  ]

  planData.firstOrderDiscount = 50
  planData.futureOrderNote = '后续订单按原价计算'

  // 零食数据
  planData.snacks = {
    list: [
      {
        id: 'snack1',
        name: '牛肉',
        nameEn: 'Beef',
        image: 'https://placehold.co/200x200/f5e6d3/8b4513?text=🥩+牛肉条',
        ingredients: ['牛肉（蛋白质）', '苹果（纤维）', '海盐（电解质）'],
        nutritionFacts: 'Nutrition Facts 营养成分',
        price: 39,
        selected: false,
      },
      {
        id: 'snack2',
        name: '猪肉',
        nameEn: 'Pork',
        image: 'https://placehold.co/200x200/f5e6d3/8b4513?text=🥓+猪肉条',
        ingredients: ['猪肉（蛋白质）', '梨（纤维）', '海盐（电解质）'],
        nutritionFacts: 'Nutrition Facts 营养成分',
        price: 35,
        selected: false,
      },
      {
        id: 'snack3',
        name: '鸡肉',
        nameEn: 'Chicken',
        image: 'https://placehold.co/200x200/f5e6d3/8b4513?text=🍗+鸡肉条',
        ingredients: ['鸡肉（蛋白质）', '苹果（纤维）', '海盐（电解质）'],
        nutritionFacts: 'Nutrition Facts 营养成分',
        price: 32,
        selected: false,
      },
    ],
    selected: null,
  }

  // 玩具类型数据
  planData.toys = {
    categories: [
      {
        id: 'toy1',
        name: '毛绒玩具',
        nameEn: 'Plush Toys',
        image: 'https://placehold.co/200x200/e3f2fd/1976d2?text=🧸+毛绒',
        description: '软性材料',
        price: 49,
        selected: false,
        quantity: 0,
      },
      {
        id: 'toy2',
        name: '耐用咀嚼玩具',
        nameEn: 'Durable Chew Toys',
        image: 'https://placehold.co/200x200/e3f2fd/1976d2?text=🦴+耐用',
        description: '坚韧材料',
        price: 59,
        selected: false,
        quantity: 0,
      },
      {
        id: 'toy3',
        name: '组合盒',
        nameEn: 'Combo Box',
        image: 'https://placehold.co/200x200/e3f2fd/1976d2?text=📦+组合',
        description: '蓬松又坚韧',
        price: 89,
        selected: false,
        quantity: 0,
      },
    ],
    selected: null,
  }

  // 磨牙棒数据
  planData.chews = {
    list: [
      {
        id: 'chew1',
        name: '天然牛皮磨牙棒',
        image: 'https://placehold.co/200x200/fff3e0/e65100?text=🦴+牛皮',
        price: 29,
        quantity: 0,
      },
      {
        id: 'chew2',
        name: '鹿角磨牙棒',
        image: 'https://placehold.co/200x200/fff3e0/e65100?text=🦌+鹿角',
        price: 45,
        quantity: 0,
      },
      {
        id: 'chew3',
        name: '洁齿磨牙骨',
        image: 'https://placehold.co/200x200/fff3e0/e65100?text=🦷+洁齿',
        price: 25,
        quantity: 0,
      },
    ],
  }
}

// 切换食谱
const toggleRecipe = async (id: string) => {
  const current = [...planData.recipes.selected]
  if (current.includes(id)) {
    if (current.length > 1) {
      planData.recipes.selected = current.filter((r) => r !== id)
    }
  } else if (current.length < planData.recipes.maxSelectable) {
    planData.recipes.selected = [...current, id]
  } else {
    uni.showToast({ title: `最多选择${planData.recipes.maxSelectable}款食谱`, icon: 'none' })
    return
  }
  // 切换食谱后重新请求数据
  await loadPlanData(planData.recipes.selected)
}

// 查看食谱详情
const viewRecipeDetail = async (id: string) => {
  isLoadingRecipe.value = true
  showRecipePopup.value = true
  try {
    const data = await getProductDetail(id)
    recipeDetail.value = data
  } catch (e) {
    console.error('加载食谱详情失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
    showRecipePopup.value = false
  } finally {
    isLoadingRecipe.value = false
  }
}

// 关闭食谱详情弹窗
const closeRecipePopup = () => {
  showRecipePopup.value = false
  recipeDetail.value = null
}

// 选择占比
const selectRatio = (id: string) => {
  planData.ratios.selected = id
}

// 选择频率
const selectFrequency = (id: string) => {
  planData.frequencies.selected = id
}

// 加入购物车
const addToCart = async () => {
  uni.showLoading({ title: '添加中...' })
  try {
    await new Promise((resolve) => setTimeout(resolve, 500))
    uni.hideLoading()
    uni.showToast({ title: '已加入购物车', icon: 'success' })
  } catch {
    uni.hideLoading()
    uni.showToast({ title: '添加失败', icon: 'none' })
  }
}

// 立即结算
const checkout = async () => {
  uni.showLoading({ title: '处理中...' })
  try {
    await new Promise((resolve) => setTimeout(resolve, 500))
    uni.hideLoading()
    // 先跳转到零食选择页
    uni.navigateTo({
      url: `/freshFoodPages/fresh_food_snacks/fresh_food_snacks?petId=${planData.pet.id}`,
    })
  } catch {
    uni.hideLoading()
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

onLoad((options) => {
  if (options?.petId) {
    petId.value = options.petId
    loadPlanData()
  } else {
    // 无petId时用mock
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

// 食谱
.recipes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.recipe-card {
  position: relative;
  width: calc((100% - 24rpx) / 3);
  padding: 10rpx 6rpx;
  background-color: #f8f8f8;
  border-radius: 12rpx;
  box-sizing: border-box;
  border: 2rpx solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;

  &.selected {
    border-color: #00a86b;
    background-color: #e8f5e9;
  }

  .recipe-recommended-tag {
    position: absolute;
    top: -8rpx;
    left: 50%;
    transform: translateX(-50%);
    background-color: #ff6600;
    color: #fff;
    font-size: 18rpx;
    padding: 2rpx 10rpx;
    border-radius: 6rpx;
    white-space: nowrap;
  }

  .recipe-check {
    position: absolute;
    top: 4rpx;
    right: 4rpx;
  }

  .recipe-image {
    width: 70rpx;
    height: 70rpx;
    border-radius: 8rpx;
    margin-bottom: 8rpx;
  }

  .recipe-name {
    font-size: 22rpx;
    color: #333;
    text-align: center;
    margin-bottom: 4rpx;
    line-height: 1.2;
  }

  .recipe-detail-btn {
    font-size: 20rpx;
    color: #00a86b;
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

    .price-original {
      font-size: 24rpx;
      color: #999;
      text-decoration: line-through;
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

    .future-note {
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
