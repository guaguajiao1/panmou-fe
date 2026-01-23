import type { OrderDetail } from '@/types/order'
import type { OrderState } from '@/types/order-state'
import type { LogisticsQueryResult } from '@/types/logistics'
import { http } from '@/utils/http'

// --- 参数类型定义 ---

/** 订单列表查询参数 */
type OrderListParams = {
  /** 页码，从1开始 */
  page?: number
  /** 每页数量，默认10 */
  pageSize?: number
  /** 订单状态筛选，不传则查询全部 */
  orderState?: OrderState | null
}

/** 订单列表响应类型 */
type OrderListResult = {
  /** 订单列表 */
  items: OrderDetail[]
  /** 总记录数 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页数量 */
  pageSize: number
  /** 总页数 */
  totalPages: number
}

/**
 * 订单相关 API 模块
 *
 * API路径设计: /account/orders (遵循 Google API 风格，使用复数名词)
 * 版本前缀 /v1 由请求拦截器统一处理
 *
 * Google API 风格说明:
 * - 使用标准HTTP方法: GET(查询)、POST(创建)、PUT(更新)、DELETE(删除)
 * - 资源使用复数名词: /orders 而非 /order
 * - 自定义操作使用冒号分隔: /orders/{id}:confirm, /orders/{id}:cancel
 */
export const orderApi = {
  /**
   * 查询订单列表
   *
   * @description 分页查询当前账户的订单列表，支持按订单状态筛选
   * @param params 查询参数
   *   - page: 页码，从1开始，默认1
   *   - pageSize: 每页数量，默认10
   *   - orderState: 订单状态筛选，不传或传null则查询全部
   * @returns 分页后的订单列表
   *
   * @example
   * // 查询全部订单第一页
   * orderApi.list({ page: 1, pageSize: 10 })
   *
   * // 查询待付款订单
   * orderApi.list({ page: 1, orderState: OrderState.PENDING })
   */
  list(params?: OrderListParams) {
    return http<OrderListResult>({
      method: 'GET',
      url: '/account/orders',
      data: params,
    })
  },

  /**
   * 获取订单详情
   *
   * @description 根据订单ID获取订单完整信息，包含商品、地址、物流等
   * @param orderId 订单ID
   * @returns 订单详情对象
   *
   * @example
   * orderApi.get('ORDER-123456')
   */
  get(orderId: string) {
    return http<OrderDetail>({
      method: 'GET',
      url: `/account/orders/${orderId}`,
    })
  },

  /**
   * 确认收货
   *
   * @description 用户确认已收到商品，订单状态变更为已完成
   * @param orderId 订单ID
   * @returns 更新后的订单详情
   *
   * @example
   * // 确认收货操作
   * orderApi.confirm('ORDER-123456')
   */
  confirm(orderId: string) {
    return http<OrderDetail>({
      method: 'POST',
      url: `/account/orders/${orderId}:confirm`,
    })
  },

  /**
   * 取消订单
   *
   * @description 取消待付款或待发货状态的订单
   * @param orderId 订单ID
   * @param data 取消原因等附加信息
   * @returns 更新后的订单详情
   *
   * @example
   * orderApi.cancel('ORDER-123456', { reason: '不想要了' })
   */
  cancel(orderId: string, data?: { reason?: string }) {
    return http<OrderDetail>({
      method: 'POST',
      url: `/account/orders/${orderId}:cancel`,
      data,
    })
  },

  /**
   * 删除订单
   *
   * @description 删除已完成或已取消的订单（软删除，从用户订单列表中移除）
   * @param orderId 订单ID
   * @returns 删除结果
   *
   * @example
   * orderApi.delete('ORDER-123456')
   */
  delete(orderId: string) {
    return http<{ success: boolean }>({
      method: 'DELETE',
      url: `/account/orders/${orderId}`,
    })
  },

  /**
   * 获取订单物流信息
   *
   * @description 获取订单的物流包裹及轨迹信息
   * @param orderId 订单ID
   * @returns 物流查询结果，包含所有包裹及其轨迹
   *
   * @example
   * orderApi.getLogistics('ORDER-123456')
   */
  getLogistics(orderId: string) {
    return http<LogisticsQueryResult>({
      method: 'GET',
      url: `/account/orders/${orderId}/logistics`,
    })
  },

  /**
   * 获取各状态订单数量
   *
   * @description 获取当前用户各状态订单的数量，用于在"我的"页面显示徽标
   * @returns 各状态订单数量对象
   *
   * @example
   * orderApi.getCounts()
   */
  getCounts() {
    return http<OrderCountsResult>({
      method: 'GET',
      url: '/account/orders:count',
    })
  },
}

/** 订单数量结果类型 */
type OrderCountsResult = {
  /** 待付款订单数 */
  pending: number
  /** 待发货订单数 */
  paid: number
  /** 待收货订单数 */
  shipped: number
  /** 已完成订单数 (不显示) */
  completed: number
  /** 退款/售后订单数 */
  refunding: number
}
