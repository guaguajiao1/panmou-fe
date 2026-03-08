import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FreshPlanPageData } from '@/types/fresh-food'

export const useFreshFoodStore = defineStore('freshFood', () => {
  /** 当前流程的 planId */
  const planId = ref('')

  /** 流程操作类型 */
  const flowAction = ref<'addToCart' | 'checkout' | null>(null)

  /** 鲜食方案的用户选择 */
  const planSelections = ref<{
    ratioId: string
    frequencyId: string
    recipes: { skuId: string; quantity: number }[]
  }>({
    ratioId: '',
    frequencyId: '',
    recipes: [],
  })

  /** 附加商品（零食、玩具等） */
  const extraItems = ref<
    {
      productId: string
      skuId: string
      quantity: number
      purchaseType: 0 | 1
    }[]
  >([])

  /** 当前加载的方案配置数据缓存 */
  const currentPlan = ref<FreshPlanPageData | null>(null)

  /** 重置所有状态（操作成功后调用） */
  const clearState = () => {
    planId.value = ''
    flowAction.value = null
    planSelections.value = { ratioId: '', frequencyId: '', recipes: [] }
    extraItems.value = []
    // 注意：不要在此处清空 currentPlan，否则最后一页渲染会丢失数据
  }

  /** 移除指定 productId 列表的附加商品（回退时清理） */
  const removeExtraItemsByIds = (ids: string[]) => {
    extraItems.value = extraItems.value.filter((i) => !ids.includes(i.productId))
  }

  return {
    planId,
    flowAction,
    planSelections,
    extraItems,
    currentPlan,
    clearState,
    removeExtraItemsByIds,
  }
})
