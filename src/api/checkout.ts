/*
1.购物车 “去结算” 按钮背后的请求
请求路径：GET /checkout/entry/cart
关键参数：
  proceedToCheckout=1
  referrer=cart
返回结果：
  CheckoutResult对象

2.获取结账预览信息
请求路径：GET /checkout/p/{id}
返回结果：PreviewOrder对象

3.更新结账预览信息
请求路径：POST /checkout/p/{id}/update
关键参数：
返回结果：更新后的PreviewOrder对象

4.提交订单
请求路径：POST /checkout/p/{id}/place-order
关键参数：
返回结果：PlaceOrderResult对象
*/

import type {
  OrderPreview,
  CheckoutResult,
  UpdatePreviewParams,
  PlaceOrderResult,
} from '@/types/checkout'
import { http } from '@/utils/http'

/**
 * Checkout 相关 API
 * 风格与 src/api/address.ts 保持一致
 */
export const checkoutApi = {
  /**
   * 购物车 -> 结账入口 (返回 previewId)
   */
  entryCart() {
    return http<CheckoutResult>({
      method: 'GET',
      url: '/checkout/entry/cart?proceedToCheckout=1&referrer=cart',
    })
  },

  /**
   * 获取结账预览信息
   * @param previewId 预览 id
   */
  getPreview(previewId: string) {
    return http<OrderPreview>({ method: 'GET', url: `/checkout/p/${previewId}` })
  },

  /**
   * 更新结账预览
   * @param previewId preview id
   * @param params 更新参数 (参见 src/types/checkout.d.ts)
   */
  updatePreview(previewId: string, params: UpdatePreviewParams) {
    return http<OrderPreview>({
      method: 'POST',
      url: `/checkout/p/${previewId}/update`,
      data: params,
    })
  },

  /**
   * 提交订单
   * @param previewId preview id
   * @param data 提交所需额外数据（可选）
   */
  placeOrder(previewId: string, data?: any) {
    return http<PlaceOrderResult>({
      method: 'POST',
      url: `/checkout/p/${previewId}/place-order`,
      data,
    })
  },
}
