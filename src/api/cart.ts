import type { Cart, AddToCartParams } from '@/types/cart'
import { http } from '@/utils/http'

// --- 为函数参数定义类型别名，使代码更清晰 ---

/** 添加到购物车的参数类型 */
type AddItemParams = {
  productId: string
  skuId: string
  quantity: number
  purchaseType: 0 | 1
}

/** 更新购物车商品项的参数类型 */
type UpdateItemParams = {
  quantity?: number
  selected?: boolean
  purchaseType?: 0 | 1
}

/**
 * 账户相关的API请求 - 购物车模块
 *
 * API路径设计: /account/cart
 * 版本前缀 /v1 由请求拦截器统一处理
 */
export const cartApi = {
  /**
   * 获取当前账户的购物车详情
   */
  get() {
    return http<Cart>({
      method: 'GET',
      url: '/account/cart',
    })
  },

  /**
   * 向购物车中添加商品
   * @param cartId 购物车ID
   * @param data 商品信息
   */
  addItem(cartId: string, data: AddToCartParams) {
    return http({
      method: 'POST',
      url: `/account/carts/${cartId}/items`,
      data,
    })
  },

  /**
   * 删除购物车中的一件或多件商品 (批量删除)
   * @param cartId 购物车ID
   * @param itemIds 要删除的商品itemId数组
   */
  removeItems(cartId: string, itemIds: string[]) {
    return http<Cart>({
      method: 'POST',
      url: `/account/carts/${cartId}/items:batchDelete`,
      data: { itemIds },
    })
  },

  /**
   * 修改购物车中单个商品的数量、选中状态或购买类型
   * @param cartId 购物车ID
   * @param itemId 要修改的商品itemId
   * @param data 更新的信息
   */
  updateItem(cartId: string, itemId: string, data: UpdateItemParams) {
    return http<Cart>({
      method: 'PUT',
      url: `/account/carts/${cartId}/items/${itemId}`,
      data,
    })
  },

  /**
   * 更新购物车中所有商品的选中状态 (全选/取消全选)
   * @param cartId 购物车ID
   * @param data 是否全选
   */
  updateAllSelection(cartId: string, data: { selected: boolean }) {
    return http<Cart>({
      method: 'POST',
      url: `/account/carts/${cartId}/items:updateSelection`,
      data,
    })
  },
}
