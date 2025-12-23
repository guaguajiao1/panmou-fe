/**
 * 物流相关类型定义
 */

import type { ShipmentState } from './order-state'

// ==================== 物流包裹 ====================

/** 订单物流包裹信息 */
export type OrderShipment = {
  /** 包裹ID */
  shipmentId: string
  /** 订单ID */
  orderId: string

  /** 快递公司编码（如 SF、YTO、ZTO） */
  carrierCode: string
  /** 快递公司名称 */
  carrierName: string
  /** 快递单号 */
  trackingNo: string

  /** 包裹状态 */
  shipmentState: ShipmentState

  /** 发货时间 */
  shippedAt: string
  /** 签收时间 */
  deliveredAt?: string

  /** 包裹内商品列表 */
  items: ShipmentItemInfo[]

  /** 物流轨迹列表（按时间倒序） */
  traces: ShipmentTrace[]
}

/** 包裹内商品信息 */
export type ShipmentItemInfo = {
  /** 订单商品ID */
  orderItemId: string
  /** 商品名称 */
  productName: string
  /** 商品图片 */
  productImage: string
  /** 规格 */
  skuAttrs: string
  /** 发货数量 */
  quantity: number
}

/** 物流轨迹记录 */
export type ShipmentTrace = {
  /** 轨迹ID */
  traceId: string
  /** 轨迹时间 */
  traceTime: string
  /** 轨迹状态 */
  traceState: ShipmentState
  /** 轨迹描述 */
  traceDesc: string
  /** 所在位置 */
  location?: string
}

// ==================== 快递公司 ====================

/** 快递公司信息 */
export type CarrierInfo = {
  /** 快递公司编码 */
  code: string
  /** 快递公司名称 */
  name: string
  /** 客服电话 */
  tel?: string
  /** Logo 图片 */
  logo?: string
}

/** 常用快递公司列表 */
export const commonCarriers: CarrierInfo[] = [
  { code: 'SF', name: '顺丰速运', tel: '95338' },
  { code: 'YTO', name: '圆通速递', tel: '95554' },
  { code: 'ZTO', name: '中通快递', tel: '95311' },
  { code: 'STO', name: '申通快递', tel: '95543' },
  { code: 'YD', name: '韵达快递', tel: '95546' },
  { code: 'JTSD', name: '极兔速递', tel: '956677' },
  { code: 'EMS', name: '邮政EMS', tel: '11183' },
  { code: 'JD', name: '京东物流', tel: '950616' },
]

// ==================== 查询参数 ====================

/** 物流查询参数 */
export type LogisticsQueryParams = {
  /** 订单ID */
  orderId: string
  /** 包裹ID（可选，不传则返回该订单所有包裹） */
  shipmentId?: string
}

/** 物流查询结果 */
export type LogisticsQueryResult = {
  /** 订单ID */
  orderId: string
  /** 包裹列表 */
  shipments: OrderShipment[]
}
