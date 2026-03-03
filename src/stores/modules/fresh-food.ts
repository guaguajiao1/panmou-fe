import { defineStore } from 'pinia'
import { ref } from 'vue'

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

  /** 重置所有状态（操作成功后调用） */
  const clearState = () => {
    planId.value = ''
    flowAction.value = null
    planSelections.value = { ratioId: '', frequencyId: '', recipes: [] }
    extraItems.value = []
  }

  return { planId, flowAction, planSelections, extraItems, clearState }
})
