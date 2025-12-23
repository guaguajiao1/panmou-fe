/**
 * 订单状态机定义
 * 使用 state 命名，数值使用 10/20/30... 便于后续扩展
 */

// ==================== Order 主状态 ====================

/** 订单主状态枚举 */
export enum OrderState {
  /** 待付款 */
  PENDING = 10,
  /** 待发货（已付款） */
  PAID = 20,
  /** 待收货（已发货） */
  SHIPPED = 30,
  /** 已完成 */
  COMPLETED = 40,
  /** 已取消 */
  CANCELLED = 50,
  /** 退款中 */
  REFUNDING = 60,
  /** 已退款 */
  REFUNDED = 70,
}

/** 订单状态文本映射 */
export const OrderStateText: Record<OrderState, string> = {
  [OrderState.PENDING]: '待付款',
  [OrderState.PAID]: '待发货',
  [OrderState.SHIPPED]: '待收货',
  [OrderState.COMPLETED]: '已完成',
  [OrderState.CANCELLED]: '已取消',
  [OrderState.REFUNDING]: '退款中',
  [OrderState.REFUNDED]: '已退款',
}

/** 订单状态列表（用于 Tab 切换等） */
export const orderStateList = [
  { id: 0, text: '全部', state: null },
  { id: 1, text: '待付款', state: OrderState.PENDING },
  { id: 2, text: '待发货', state: OrderState.PAID },
  { id: 3, text: '待收货', state: OrderState.SHIPPED },
  { id: 4, text: '已完成', state: OrderState.COMPLETED },
  { id: 5, text: '退款/售后', state: OrderState.REFUNDING },
]

// ==================== OrderItem 子状态 ====================

/** 订单商品子状态枚举 */
export enum OrderItemState {
  /** 正常（待发货） */
  NORMAL = 10,
  /** 已发货 */
  SHIPPED = 20,
  /** 已收货 */
  RECEIVED = 30,
  /** 已评价 */
  REVIEWED = 40,
  /** 退款申请中（未发货时） */
  REFUND_APPLY = 50,
  /** 已退款 */
  REFUNDED = 60,
  /** 退货申请中（已收货时） */
  RETURN_APPLY = 70,
  /** 退货中（寄回商品） */
  RETURNING = 80,
  /** 已退货 */
  RETURNED = 90,
}

/** 订单商品状态文本映射 */
export const OrderItemStateText: Record<OrderItemState, string> = {
  [OrderItemState.NORMAL]: '正常',
  [OrderItemState.SHIPPED]: '已发货',
  [OrderItemState.RECEIVED]: '已收货',
  [OrderItemState.REVIEWED]: '已评价',
  [OrderItemState.REFUND_APPLY]: '退款申请中',
  [OrderItemState.REFUNDED]: '已退款',
  [OrderItemState.RETURN_APPLY]: '退货申请中',
  [OrderItemState.RETURNING]: '退货中',
  [OrderItemState.RETURNED]: '已退货',
}

// ==================== 物流状态 ====================

/** 物流包裹状态枚举 */
export enum ShipmentState {
  /** 已创建（待揽收） */
  CREATED = 1,
  /** 已揽收 */
  COLLECTED = 2,
  /** 运输中 */
  IN_TRANSIT = 3,
  /** 派送中 */
  DELIVERING = 4,
  /** 已签收 */
  DELIVERED = 5,
  /** 异常 */
  EXCEPTION = 6,
}

/** 物流状态文本映射 */
export const ShipmentStateText: Record<ShipmentState, string> = {
  [ShipmentState.CREATED]: '待揽收',
  [ShipmentState.COLLECTED]: '已揽收',
  [ShipmentState.IN_TRANSIT]: '运输中',
  [ShipmentState.DELIVERING]: '派送中',
  [ShipmentState.DELIVERED]: '已签收',
  [ShipmentState.EXCEPTION]: '物流异常',
}

// ==================== 商品类型 ====================

/** 订单商品类型枚举 */
export enum ItemType {
  /** 普通商品 */
  NORMAL = 1,
  /** 组合商品（父） */
  BUNDLE = 2,
  /** 组合子商品 */
  BUNDLE_CHILD = 3,
}

// ==================== 状态流转配置 ====================

/** 订单状态允许的下一步操作 */
export const OrderStateTransitions: Record<OrderState, OrderState[]> = {
  [OrderState.PENDING]: [OrderState.PAID, OrderState.CANCELLED],
  [OrderState.PAID]: [OrderState.SHIPPED, OrderState.REFUNDING, OrderState.CANCELLED],
  [OrderState.SHIPPED]: [OrderState.COMPLETED, OrderState.REFUNDING],
  [OrderState.COMPLETED]: [],
  [OrderState.CANCELLED]: [],
  [OrderState.REFUNDING]: [OrderState.REFUNDED, OrderState.PAID, OrderState.SHIPPED],
  [OrderState.REFUNDED]: [],
}

/** 判断订单是否可以取消 */
export function canCancelOrder(state: OrderState): boolean {
  return state === OrderState.PENDING || state === OrderState.PAID
}

/** 判断订单是否可以申请退款 */
export function canApplyRefund(state: OrderState): boolean {
  return state === OrderState.PAID || state === OrderState.SHIPPED
}

/** 判断订单是否已结束（终态） */
export function isOrderFinished(state: OrderState): boolean {
  return [OrderState.COMPLETED, OrderState.CANCELLED, OrderState.REFUNDED].includes(state)
}
