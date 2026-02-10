import type { FreshFoodLandingData } from '@/types/fresh-food-landing'
import { http } from '@/utils/http'

/**
 * 鲜食营销落地页 API
 */
export const freshFoodLandingApi = {
  /**
   * 获取营销落地页数据
   */
  getLandingData() {
    return http<FreshFoodLandingData>({
      method: 'GET',
      url: '/api/fresh-food/landing',
    })
  },
}
