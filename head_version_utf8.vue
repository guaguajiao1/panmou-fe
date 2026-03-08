<template>
  <view class="fresh-food-plan-page">
    <CustomNavigationBar title="瀹氬埗鏂规" show-back />

    <scroll-view scroll-y class="plan-content">
      <!-- 瀹犵墿淇℃伅鎽樿 -->
      <view class="pet-summary">
        <image
          v-if="planData.pet.avatar"
          class="pet-avatar"
          :src="planData.pet.avatar"
          mode="aspectFill"
        />
        <view class="pet-info">
          <text class="pet-name">{{ planData.pet.name }}鐨勪笓灞炴柟妗?/text>
          <text class="pet-desc">{{ planData.pet.summary }}</text>
        </view>
      </view>

      <!-- 1. 椴滈鍗犳瘮 -->
      <view class="section ratio-section">
        <view class="section-header">
          <text class="section-title">椴滈鍗犳瘮</text>
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
            <view v-if="ratio.recommended" class="recommended-tag">鎺ㄨ崘</view>
            <image class="ratio-image" :src="ratio.image" mode="aspectFit" />
            <view class="ratio-info">
              <text class="ratio-name">{{ ratio.name }}</text>
              <text class="ratio-desc">{{ ratio.description }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 2. 閰嶉€侀鐜?-->
      <view class="section frequency-section">
        <view class="section-header">
          <text class="section-title">閰嶉€侀鐜?/text>
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
            <view v-if="freq.recommended" class="freq-recommend-tag">鎺ㄨ崘</view>
            <text class="freq-label">{{ freq.label }}</text>
            <text class="freq-packs">姣忔閰嶉€亄{ freq.totalPacks }}琚?/text>
          </view>
        </view>
      </view>

      <!-- 3. 椋熻氨鍒楄〃锛堝惈姝ヨ繘鍣級 -->
      <view class="section recipes-section">
        <view class="section-header">
          <text class="section-title">閫夋嫨椋熻氨</text>
          <text class="section-hint">
            宸查€?{{ totalSelectedQuantity }}/{{ totalPacks }} 琚嬶紝{{ selectedRecipeCount }}/3 绉?          </text>
        </view>
        <view class="recipes-list">
          <view
            v-for="recipeSku in currentRecipes"
            :key="recipeSku.sku.skuId"
            class="recipe-card"
            :class="{ active: recipeSku.quantity > 0 }"
          >
            <view v-if="recipeSku.recommended" class="recipe-recommended-tag">鎺ㄨ崘</view>
            <image class="recipe-image" :src="recipeSku.sku.image?.[0] || ''" mode="aspectFill" />
            <view class="recipe-info">
              <text class="recipe-name">{{ recipeSku.sku.name }}</text>
              <text class="recipe-desc">{{ recipeSku.sku.desc }}</text>
              <text class="recipe-price">楼{{ recipeSku.sku.originalPrice }}/琚?/text>
            </view>
            <view class="recipe-stepper">
              <view
                class="stepper-btn minus"
                :class="{ disabled: recipeSku.quantity <= 0 }"
                @click="decreaseRecipeQuantity(recipeSku.sku.skuId)"
              >
                <text>鈭?/text>
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

      <!-- 搴曢儴鍗犱綅 -->
      <view class="footer-placeholder" />
    </scroll-view>

    <!-- 椋熻氨璇︽儏寮圭獥 -->
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

    <!-- 搴曢儴鏍?-->
    <view class="footer-bar">
      <view class="price-info">
        <view class="price-row">
          <text class="price-current">楼{{ totalCost.toFixed(2) }}</text>
          <text class="price-daily">(楼{{ dailyCost.toFixed(2) }}/澶?</text>
        </view>
        <text class="discount-note">馃帀 棣栧崟绔嬪噺{{ planData.firstOrderDiscount }}%</text>
        <text class="shipping-note">杩愯垂: 楼{{ currentShippingFee }}</text>
      </view>
      <view class="action-buttons">
        <button class="btn-cart" :disabled="!isOrderValid" @click="addToCart">鍔犲叆璐墿杞?/button>
        <button class="btn-checkout" :disabled="!isOrderValid" @click="checkout">绔嬪嵆缁撶畻</button>
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

// 缁熶竴椤甸潰鏁版嵁
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

/** 褰撳墠閫変腑鐨勫崰姣斿璞?*/
const currentRatio = computed(() => {
  return planData.ratios.list.find((r) => r.id === planData.ratios.selected)
})

/** 褰撳墠鍗犳瘮涓嬬殑閰嶉€侀鐜囧垪琛?*/
const currentFrequencies = computed(() => {
  return currentRatio.value?.frequencies || []
})

/** 褰撳墠閫変腑鐨勯鐜囧璞?*/
const currentFrequency = computed(() => {
  return currentFrequencies.value.find((f) => f.id === selectedFrequencyId.value)
})

/** 褰撳墠鍗犳瘮涓嬬殑椋熻氨SKU鍒楄〃 */
const currentRecipes = computed(() => {
  return currentRatio.value?.recipes || []
})

/** 褰撳墠鍗犳瘮+棰戠巼涓嬬殑鎬昏鏁?n */
const totalPacks = computed(() => {
  return currentFrequency.value?.totalPacks || 0
})

/** 宸查€夐璋辩绫绘暟锛坬uantity > 0 鐨勯璋辨暟锛?*/
const selectedRecipeCount = computed(() => {
  return currentRecipes.value.filter((r) => r.quantity > 0).length
})

/** 宸查€夐璋辨€绘暟閲?*/
const totalSelectedQuantity = computed(() => {
  return currentRecipes.value.reduce((sum, r) => sum + r.quantity, 0)
})

/** 褰撳墠棰戠巼鐨勮繍璐?*/
const currentShippingFee = computed(() => {
  return currentFrequency.value?.shippingFee || '0'
})

/** 椋熻氨鎬讳环 = 鈭?sku.originalPrice 脳 quantity) */
const totalRecipePrice = computed(() => {
  return currentRecipes.value.reduce((sum, r) => {
    return sum + parseFloat(r.sku.originalPrice || '0') * r.quantity
  }, 0)
})

/** 鎬昏垂鐢?= 椋熻氨鎬讳环 + 杩愯垂 */
const totalCost = computed(() => {
  return totalRecipePrice.value + parseFloat(currentShippingFee.value || '0')
})

/** 姣忔棩鑺辫垂 = 鎬昏垂鐢?/ 閰嶉€佸懆鏈熷ぉ鏁?*/
const dailyCost = computed(() => {
  const days = currentFrequency.value?.deliveryDays || 1
  return totalCost.value / days
})

/** 璁㈠崟鏄惁鏈夋晥锛堟€绘暟閲?= n锛?*/
const isOrderValid = computed(() => {
  return totalSelectedQuantity.value === totalPacks.value && totalPacks.value > 0
})

// ========== 鏂规硶 ==========

/** 鍒ゆ柇鏄惁杩樿兘澧炲姞鏌愰璋辨暟閲?*/
const canIncrease = (skuId: string) => {
  // 鎬绘暟涓嶈兘瓒呰繃 n
  if (totalSelectedQuantity.value >= totalPacks.value) return false
  // 鎵惧埌褰撳墠椋熻氨
  const recipe = currentRecipes.value.find((r) => r.sku.skuId === skuId)
  if (!recipe) return false
  // 濡傛灉褰撳墠鏁伴噺涓?锛屾鏌ュ凡閫夌绫绘暟鏄惁宸茶揪3
  if (recipe.quantity === 0 && selectedRecipeCount.value >= 3) return false
  return true
}

/** 鍧囧垎椋熻氨鏁伴噺锛氬皢 n 鍧囧垎缁欐帹鑽愰璋憋紝鏈変綑鏁颁粠鍓嶅線鍚庝緷娆″姞1 */
const distributeRecipes = () => {
  const recipes = currentRecipes.value
  if (recipes.length === 0 || totalPacks.value === 0) return

  // 鍏堝叏閮ㄥ綊闆?  recipes.forEach((r) => (r.quantity = 0))

  // 鎵惧埌鎺ㄨ崘椋熻氨锛屽鏋滄病鏈夋帹鑽愶紝鍒欏彇鍓?涓?  let targetRecipes = recipes.filter((r) => r.recommended)
  if (targetRecipes.length === 0) {
    targetRecipes = recipes.slice(0, Math.min(3, recipes.length))
  }
  // 鏈€澶?绉?  targetRecipes = targetRecipes.slice(0, 3)

  const n = totalPacks.value
  const base = Math.floor(n / targetRecipes.length)
  const remainder = n % targetRecipes.length

  targetRecipes.forEach((r, idx) => {
    r.quantity = base + (idx < remainder ? 1 : 0)
  })
}

/** 閫夋嫨鍗犳瘮 */
const selectRatio = (id: string) => {
  if (planData.ratios.selected === id) return
  planData.ratios.selected = id

  // 鍒囨崲棰戠巼涓烘帹鑽愭垨绗竴涓?  const freqs = currentFrequencies.value
  const recommended = freqs.find((f) => f.recommended)
  selectedFrequencyId.value = recommended?.id || freqs[0]?.id || ''

  // 鍧囧垎椋熻氨
  distributeRecipes()
}

/** 閫夋嫨棰戠巼 */
const selectFrequency = (id: string) => {
  if (selectedFrequencyId.value === id) return
  selectedFrequencyId.value = id

  // 棰戠巼鍙樹簡 鈫?totalPacks(n) 鍙樹簡 鈫?閲嶆柊鍧囧垎
  distributeRecipes()
}

/** 澧炲姞椋熻氨鏁伴噺 */
const increaseRecipeQuantity = (skuId: string) => {
  if (!canIncrease(skuId)) {
    if (totalSelectedQuantity.value >= totalPacks.value) {
      uni.showToast({ title: `鎬绘暟涓嶈兘瓒呰繃${totalPacks.value}琚媊, icon: 'none' })
    } else {
      uni.showToast({ title: '鏈€澶氶€夋嫨3绉嶉璋?, icon: 'none' })
    }
    return
  }
  const recipe = currentRecipes.value.find((r) => r.sku.skuId === skuId)
  if (recipe) recipe.quantity++
}

/** 鍑忓皯椋熻氨鏁伴噺 */
const decreaseRecipeQuantity = (skuId: string) => {
  const recipe = currentRecipes.value.find((r) => r.sku.skuId === skuId)
  if (recipe && recipe.quantity > 0) {
    recipe.quantity--
  }
}

/** 鏌ョ湅椋熻氨璇︽儏 */
const viewRecipeDetail = async (skuId: string) => {
  isLoadingRecipe.value = true
  showRecipePopup.value = true
  try {
    const recipe = currentRecipes.value.find((r) => r.sku.skuId === skuId)
    const productId = recipe?.sku.productId || skuId
    const data = await getProductDetail(productId)
    recipeDetail.value = data
  } catch (e) {
    console.error('鍔犺浇椋熻氨璇︽儏澶辫触', e)
    uni.showToast({ title: '鍔犺浇澶辫触', icon: 'none' })
    showRecipePopup.value = false
  } finally {
    isLoadingRecipe.value = false
  }
}

/** 鍏抽棴椋熻氨璇︽儏寮圭獥 */
const closeRecipePopup = () => {
  showRecipePopup.value = false
  recipeDetail.value = null
}

/** 淇濆瓨閫夋嫨鍒?store */
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

/** 鎵ц鏈€缁堟搷浣?(褰撴病鏈塻nacks鍜宼oys椤甸潰鏃朵娇鐢? */
const executeFinalAction = async (action: 'addToCart' | 'checkout') => {
  const params = {
    planId: freshFoodStore.planId,
    planSelections: freshFoodStore.planSelections,
    items: freshFoodStore.extraItems,
  }

  if (action === 'addToCart') {
    await cartApi.addItem('my-cart', params)
    uni.showToast({ title: '宸插姞鍏ヨ喘鐗╄溅', icon: 'success' })
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

/** 鍔犲叆璐墿杞?*/
const addToCart = async () => {
  if (!isOrderValid.value) {
    uni.showToast({ title: `璇烽€夋弧${totalPacks.value}琚嬮璋盽, icon: 'none' })
    return
  }

  saveSelectionsToStore('addToCart')

  // 鍒ゆ柇鏄惁鏈変笅涓€椤碉紙snacks锛?  const hasNextPage = true // TODO: 鍙€氳繃 planData 閰嶇疆鎺у埗
  if (hasNextPage) {
    uni.navigateTo({ url: '/freshFoodPages/fresh_food_snacks/fresh_food_snacks' })
  } else {
    uni.showLoading({ title: '娣诲姞涓?..' })
    try {
      await executeFinalAction('addToCart')
    } catch {
      uni.showToast({ title: '娣诲姞澶辫触', icon: 'none' })
    } finally {
      uni.hideLoading()
    }
  }
}

/** 绔嬪嵆缁撶畻 */
const checkout = async () => {
  if (!isOrderValid.value) {
    uni.showToast({ title: `璇烽€夋弧${totalPacks.value}琚嬮璋盽, icon: 'none' })
    return
  }

  saveSelectionsToStore('checkout')

  const hasNextPage = true
  if (hasNextPage) {
    uni.navigateTo({ url: '/freshFoodPages/fresh_food_snacks/fresh_food_snacks' })
  } else {
    uni.showLoading({ title: '澶勭悊涓?..' })
    try {
      await executeFinalAction('checkout')
    } catch {
      uni.showToast({ title: '鎿嶄綔澶辫触', icon: 'none' })
    } finally {
      uni.hideLoading()
    }
  }
}

// ========== 鏁版嵁鍔犺浇 ==========

const loadPlanData = async () => {
  isLoading.value = true
  try {
    // 1. 鍒涘缓 Plan
    const createRes = await freshFoodApi.createPlan({ petId: petId.value })
    if (createRes.code === '0' && createRes.result) {
      freshFoodStore.planId = createRes.result.planId

      // 2. 鑾峰彇 Plan 璇︽儏
      const planRes = await freshFoodApi.getPlan(freshFoodStore.planId)
      if (planRes.code === '0' && planRes.result) {
        Object.assign(planData, planRes.result)
        // 榛樿閫夋帹鑽愬崰姣?        const recommendedRatio = planData.ratios.list.find((r) => r.recommended)
        planData.ratios.selected = recommendedRatio?.id || planData.ratios.list[0]?.id || ''
        // 榛樿閫夋帹鑽愰鐜?        const freqs = currentFrequencies.value
        const recommendedFreq = freqs.find((f) => f.recommended)
        selectedFrequencyId.value = recommendedFreq?.id || freqs[0]?.id || ''
        // 鍧囧垎椋熻氨
        distributeRecipes()
      }
    }
  } catch (e) {
    console.error('鍔犺浇鏂规鏁版嵁澶辫触', e)
    loadMockData()
  } finally {
    isLoading.value = false
  }
}

/** Mock 杈呭姪锛氬垱寤洪矞椋?SKU */
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
    name: '灏忚タ',
    type: 'dog',
    avatar: 'https://placehold.co/80x80/f5e6d3/333?text=馃悤',
    breedName: '鏌寸姮',
    birthday: '2022-05-15',
    gender: 'male',
    neutered: true,
    currentWeight: 12,
    idealWeight: 11,
    bodyCondition: 'ideal',
    activityLevel: 'moderate',
    pickyLevel: 'sometimes',
    summary: '鎴愬勾鏌寸姮锛屼綋鍨嬫爣鍑嗭紝娲诲姩閲忛€備腑',
  }

  // 閫氱敤椋熻氨 SKU
  const chickenSku = makeFreshSku(
    'r1',
    '楦¤倝钄彍椁?,
    '閫夌敤浼樿川楦¤兏鑲夛紝鎼厤鏂伴矞鏃朵护钄彍',
    '25.00',
    '馃崡',
  )
  const beefSku = makeFreshSku('r2', '鐗涜倝绾㈣柉椁?, '绮鹃€夌墰鑵胯倝锛岄厤浠ラ鐢滅孩钖拰鍗楃摐', '28.00', '馃ォ')
  const fishSku = makeFreshSku('r3', '涓夋枃楸奸', '娣辨捣涓夋枃楸硷紝瀵屽惈Omega-3鑴傝偑閰?, '32.00', '馃悷')
  const lambSku = makeFreshSku('r4', '缇婅倝绯欑背椁?, '鏂拌タ鍏扮緤鑲夛紝鎼厤鏈夋満绯欑背', '30.00', '馃悜')

  planData.ratios = {
    list: [
      {
        id: 'ratio100',
        name: '100%椴滈',
        description: '瀹屽叏浠ラ矞椋熶负涓?,
        percentage: 100,
        recommended: true,
        image: 'https://placehold.co/60x40/00a86b/fff?text=100%25',
        frequencies: [
          {
            id: 'f100_2w',
            interval: 2,
            unit: 'week',
            label: '姣?鍛?,
            totalPacks: 14,
            deliveryDays: 14,
            shippingFee: '0',
            tag: '鏈€鍒掔畻',
            recommended: true,
          },
          {
            id: 'f100_3w',
            interval: 3,
            unit: 'week',
            label: '姣?鍛?,
            totalPacks: 21,
            deliveryDays: 21,
            shippingFee: '0',
            tag: '馃 鍐扮鍙嬪ソ',
          },
          {
            id: 'f100_4w',
            interval: 4,
            unit: 'week',
            label: '姣?鍛?,
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
        name: '50%椴滈',
        description: '椴滈鎼厤骞茬伯',
        percentage: 50,
        image: 'https://placehold.co/60x40/ffa500/fff?text=50%25',
        frequencies: [
          {
            id: 'f50_2w',
            interval: 2,
            unit: 'week',
            label: '姣?鍛?,
            totalPacks: 7,
            deliveryDays: 14,
            shippingFee: '0',
            recommended: true,
          },
          {
            id: 'f50_3w',
            interval: 3,
            unit: 'week',
            label: '姣?鍛?,
            totalPacks: 11,
            deliveryDays: 21,
            shippingFee: '5',
          },
          {
            id: 'f50_4w',
            interval: 4,
            unit: 'week',
            label: '姣?鍛?,
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
        name: '25%椴滈',
        description: '椴滈浣滀负杈呴',
        percentage: 25,
        image: 'https://placehold.co/60x40/6495ed/fff?text=25%25',
        frequencies: [
          {
            id: 'f25_2w',
            interval: 2,
            unit: 'week',
            label: '姣?鍛?,
            totalPacks: 4,
            deliveryDays: 14,
            shippingFee: '0',
            recommended: true,
          },
          {
            id: 'f25_4w',
            interval: 4,
            unit: 'week',
            label: '姣?鍛?,
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
  planData.futureOrderNote = '鍚庣画璁㈠崟鎸夊師浠疯绠?

  // 榛樿閫夋帹鑽愬崰姣?  const recommendedRatio = planData.ratios.list.find((r) => r.recommended)
  planData.ratios.selected = recommendedRatio?.id || planData.ratios.list[0]?.id || ''

  // 榛樿閫夋帹鑽愰鐜?  const freqs = currentFrequencies.value
  const recommendedFreq = freqs.find((f) => f.recommended)
  selectedFrequencyId.value = recommendedFreq?.id || freqs[0]?.id || ''

  // 鍧囧垎椋熻氨
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

// 瀹犵墿淇℃伅
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

// 閫氱敤Section
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

// 鍗犳瘮
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

// 棰戠巼
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

// 椋熻氨鍒楄〃
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

// 搴曢儴鍗犱綅
.footer-placeholder {
  height: 280rpx;
}

// 搴曢儴鍥哄畾鏍?.footer-bar {
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

// 椋熻氨璇︽儏寮圭獥
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
