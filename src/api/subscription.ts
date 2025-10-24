import type { AutoshipData, UpdateSubscriptionParams } from '@/types/subscription'
import { http } from '@/utils/http'

export const subscriptionApi = {
  /**
   * 获取 Autoship 订阅详情
   * 请求路径：GET /subscriptions/{id}
   * 关键参数：id - 订阅 ID
   * 返回结果：AutoshipResponse 对象
   * @param id 订阅 ID
   */
  getSubscriptionDetails(id: string) {
    return http<AutoshipData>({
      method: 'GET',
      url: `/subscriptions/${id}`,
    })
  },

  updateSubscription(id: string, updateParam: UpdateSubscriptionParams) {
    return http<AutoshipData>({
      method: 'POST',
      url: `/subscriptions/${id}`,
      data: updateParam,
    })
  },
}
