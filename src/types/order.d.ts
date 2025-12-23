import type { AddressItem } from './address'
import type { OrderState, OrderItemState, ItemType } from './order-state'
import type { OrderShipment } from './logistics.d'

// ==================== 订单详情 ====================

/** 订单详情 */
export type OrderDetail = {
  /** 订单ID */
  orderId: string
  /** 用户ID */
  userId: string

  /** 订单主状态 */
  orderState: OrderState

  /** 支付渠道：1支付宝 2微信 */
  payChannel: 1 | 2
  /** 支付方式：1在线支付 2货到付款 */
  payType: 1 | 2
  /** 支付时间 */
  payTime?: string

  /** 商品总数量 */
  totalItemQuantity: number
  /** 商品总金额（优惠前） */
  totalAmount: number
  /** 优惠金额 */
  discountAmount: number
  /** 运费 */
  shippingFee: number
  /** 实付金额 */
  payAmount: number

  /** 优惠明细 */
  discountDetails: DiscountDetail[]

  /** 收货地址 */
  shippingAddress: AddressItem

  /** 订单商品列表 */
  items: OrderSkuItem[]

  /** 物流包裹列表 */
  shipments?: OrderShipment[]

  /** 下单时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 支付过期时间 */
  expiredAt?: string
  /** 倒计时秒数（待付款时） */
  countdown?: number
}

// ==================== 订单商品 ====================

/** 订单商品项 */
export type OrderSkuItem = {
  /** 商品项ID */
  itemId: string
  /** 订单ID */
  orderId: string

  /** 父商品ID（组合商品子项指向父） */
  parentItemId?: string
  /** 商品类型 */
  itemType: ItemType

  /** 商品子状态 */
  itemState: OrderItemState

  /** SKU ID */
  skuId: string
  /** 商品ID */
  productId: string
  /** 商品名称（快照） */
  productName: string
  /** 规格属性（快照），如 "颜色:红;容量:100ml" */
  skuAttrs: string
  /** 商品图片（快照） */
  productImage: string

  /** 单价 */
  unitPrice: number
  /** 数量 */
  quantity: number
  /** 优惠金额（分摊） */
  discountAmount: number
  /** 实付金额 */
  actualAmount: number
  /** 优惠明细 */
  discountDetails: DiscountDetail[]

  /** 组合商品子项列表（前端展示用） */
  children?: OrderSkuItem[]
}

// ==================== 订单优惠明细 ====================

/** 优惠明细 */
export type DiscountDetail = {
  /** 优惠ID */
  discountId: string
  /** 优惠类型：1优惠券 2满减活动 3会员折扣 4积分抵扣 */
  discountType: 1 | 2 | 3 | 4
  /** 优惠来源ID（优惠券ID/活动ID等） */
  sourceId: string
  /** 优惠名称 */
  sourceName: string
  /** 优惠金额 */
  discountAmount: number
}

// ==================== 导出状态枚举（便捷引用） ====================

export { OrderState, OrderItemState, ItemType } from './order-state'
