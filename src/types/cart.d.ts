import { Item, DiscountDetail } from './checkout'
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

export interface Cart {
  // 购物车ID
  id: string
  // 指购物车中所有商品的总数量
  totalItemQuantity: number
  // 指所有商品在应用订单级折扣前的总价
  subtotal: number
  // 表示这是用户最终需要支付的“总计”金额
  grandTotal: number
  // 运费
  shippingFee: number
  // 满免运费门槛
  freeShippingThreshold: number
  // 参与面运费满免运费活动的金额
  freeShippingEligibleAmount: number
  // 优惠、折扣
  discountDetails: DiscountDetail[]

  items: Item[]
}
