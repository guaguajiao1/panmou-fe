/** 购物车类型 */
export type CartItem = {
  /** 商品 ID */
  productId: string
  /** SKU ID,可以唯一标识一个sku */
  skuId: string
  /** 商品名称 */
  name: string
  /** 图片 */
  image: string
  /** 数量 */
  quantity: number
  /** 加入时价格 */
  price: number
  /** 当前的价格 */
  nowPrice: number
  /** 库存 */
  stock: number
  /** 是否选中 */
  selected: boolean
  /** 规格文字 */
  spec: string
  /** 是否为有效商品 */
  isEffective: boolean
  /** 是否支持订阅 */
  supportsSubscription: boolean
  /** 订阅优惠率，0-100 */
  subscriptionDiscountRate: number
  /** 订阅优惠 */
  subscriptionDiscount: number
  /** 一次性购买优惠率，0-100 */
  onceDiscountRate: number
  /** 一次性购买优惠 */
  onceDiscount: number
  /** 购买方式，0-一次性购买，1-订阅购买 */
  purchaseType: 0 | 1
}
