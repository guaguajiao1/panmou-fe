import type { FreshPlanPageData } from '@/types/fresh-food'
import { http } from '@/utils/http'

export const freshFoodApi = {
  /** 为特定宠物创建鲜食定制方案（返回 planId） */
  createPlan(petInfo: any) {
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
}
