import type { AddressItem } from './address'
import type { OrderState, OrderItemState, ItemType } from './order-state'
import type { OrderShipment } from './logistics'

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
  /** 商品总金额（优惠前，格式化字符串） */
  totalAmount: string
  /** 优惠金额（格式化字符串） */
  discountAmount: string
  /** 运费（格式化字符串） */
  shippingFee: string
  /** 实付金额（格式化字符串） */
  payAmount: string

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

  /** 单价（格式化字符串） */
  unitPrice: string
  /** 数量 */
  quantity: number
  /** 优惠金额（分摊，格式化字符串） */
  discountAmount: string
  /** 实付金额（格式化字符串） */
  actualAmount: string
  /** 优惠明细 */
  discountDetails: DiscountDetail[]

  /** 组合商品子项列表（前端展示用） */
  children?: OrderSkuItem[]
  /** 是否展示子SKU（组合商品控制） */
  showChildren?: boolean
  /** 是否为盲盒商品 */
  isMysteryBox?: boolean
  /** 盲盒是否已开启 */
  mysteryBoxOpened?: boolean
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
  /** 优惠金额（格式化字符串） */
  discountAmount: string
}

// ==================== 导出状态枚举（便捷引用） ====================

export { OrderState, OrderItemState, ItemType } from './order-state'
