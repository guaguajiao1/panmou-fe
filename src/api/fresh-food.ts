import type { FreshPlanPageData } from '@/types/fresh-food'
import type { PetFormData } from '@/types/pet'
import { http } from '@/utils/http'

export const freshFoodApi = {
  /** 为特定宠物创建鲜食定制方案（返回 planId） */
  createPlan(petInfo: PetFormData) {
    return http<{ planId: string }>({
      method: 'POST',
      url: '/api/fresh-food/plans',
      data: petInfo,
    })
  },
  /** 根据 planId 获取方案详情 */
  getPlan(planId: string) {
    return http<FreshPlanPageData>({
      method: 'GET',
      url: `/api/fresh-food/plans/${planId}`,
    })
  },

  updatePlan(planId: string, data: UpdatePlanData, params: UpdatePlanQueryParams) {
    const query = Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&')
    const url = query
      ? `/api/fresh-food/plans/${planId}?${query}`
      : `/api/fresh-food/plans/${planId}`

    return http<FreshPlanPageData>({
      method: 'PUT',
      url,
      data: data, // 这里的 data 会作为 Request Body 发送给后端
    })
  },
}

// 1. 定义请求体 (Body) 的数据结构
export interface UpdatePlanData {
  planId?: string
  /** 鲜食用户选择 */
  planSelections?: {
    ratioId: string
    frequencyId: string
    recipes: {
      productId?: string
      skuId: string
      quantity: number
    }[]
  }
}

// 2. 定义 URL 上的查询参数 (Query) 数据结构
export interface UpdatePlanQueryParams {
  scene: 'cart' | 'subscription' // 限制只能传这两个特定字符串
  cartId?: string
  itemId?: string
  subscriptionId?: string
}
