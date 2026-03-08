import {
  delay,
  clone,
  addresses,
  globalCart,
  setGlobalCart,
  previews,
  orders,
  pets,
  plans,
  computePreview,
  computeCart,
  type FreshFoodPlan,
} from './store'
import type { CartItem } from '@/types/cart'
import { OrderState, OrderItemState, ItemType, ShipmentState } from '@/types/order-state'
import type { PetEnums, PetProfile } from '@/types/pet'
import type { FreshFoodRatio, DeliveryFrequency } from '@/types/fresh-food'
import type { Item } from '@/types/checkout.d'

export const handle = async (url: string, options: any) => {
  // --- Order APIs (/account/orders) ---
  console.warn('order url=', url)
  console.warn('order options=', options)
  console.warn(
    'if=',
    url.match(/^\/account\/orders(\?.*)?$/) &&
      String(options.method || 'GET').toUpperCase() === 'GET',
  )
  // 查询订单列表 GET /account/orders
  if (
    url.match(/^\/account\/orders(\?.*)?$/) &&
    String(options.method || 'GET').toUpperCase() === 'GET'
  ) {
    // 支持从URL查询参数或options.data获取参数
    // 小程序环境不支持 URL 构造函数，使用简单的解析方式
    const parseQueryParams = (urlStr: string): Record<string, string> => {
      const params: Record<string, string> = {}
      const queryIndex = urlStr.indexOf('?')
      if (queryIndex === -1) return params
      const queryString = urlStr.slice(queryIndex + 1)
      queryString.split('&').forEach((pair) => {
        const [key, value] = pair.split('=')
        if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '')
      })
      return params
    }

    const urlParams = parseQueryParams(url)
    const data = (options.data as any) || {}

    const page = parseInt(data.page || urlParams['page'] || '1')
    const pageSize = parseInt(data.pageSize || urlParams['pageSize'] || '10')
    const orderState = data.orderState ?? urlParams['orderState']

    let filteredOrders = Array.from(orders.values())
    console.warn('filteredOrders=', filteredOrders)

    // 按订单状态筛选
    if (
      orderState !== null &&
      orderState !== undefined &&
      orderState !== 'null' &&
      orderState !== ''
    ) {
      const stateNum = typeof orderState === 'number' ? orderState : parseInt(orderState)
      if (!isNaN(stateNum)) {
        filteredOrders = filteredOrders.filter((o) => o.orderState === stateNum)
      }
    }

    // 按创建时间倒序排序
    filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // 分页
    const total = filteredOrders.length
    const totalPages = Math.ceil(total / pageSize) || 1
    const startIndex = (page - 1) * pageSize
    const items = filteredOrders.slice(startIndex, startIndex + pageSize)

    console.warn('order items=', items)
    return {
      code: '0',
      msg: 'ok',
      result: { items: clone(items), total, page, pageSize, totalPages },
    }
  }

  // 获取订单数量 GET /account/orders:count
  if (
    url.match(/^\/account\/orders:count$/) &&
    String(options.method || 'GET').toUpperCase() === 'GET'
  ) {
    const allOrders = Array.from(orders.values())
    const counts = {
      pending: allOrders.filter((o) => o.orderState === OrderState.PENDING).length,
      paid: allOrders.filter((o) => o.orderState === OrderState.PAID).length,
      shipped: allOrders.filter((o) => o.orderState === OrderState.SHIPPED).length,
      completed: allOrders.filter((o) => o.orderState === OrderState.COMPLETED).length,
      refunding: allOrders.filter((o) => o.orderState === OrderState.REFUNDING).length,
    }
    return { code: '0', msg: 'ok', result: counts }
  }

  // 获取订单详情 GET /account/orders/{orderId}
  const orderDetailMatch = url.match(/^\/account\/orders\/([^/:]+)$/)
  if (orderDetailMatch && String(options.method || 'GET').toUpperCase() === 'GET') {
    const orderId = orderDetailMatch[1]
    const order = orders.get(orderId)
    if (!order) return { code: '1', msg: '订单不存在', result: null }
    return { code: '0', msg: 'ok', result: clone(order) }
  }

  // 确认收货 POST /account/orders/{orderId}:confirm
  const confirmMatch = url.match(/^\/account\/orders\/([^/:]+):confirm$/)
  if (confirmMatch && String(options.method || 'POST').toUpperCase() === 'POST') {
    const orderId = confirmMatch[1]
    const order = orders.get(orderId)
    if (!order) return { code: '1', msg: '订单不存在', result: null }
    if (order.orderState !== OrderState.SHIPPED) {
      return { code: '2', msg: '订单状态不允许确认收货', result: null }
    }
    order.orderState = OrderState.COMPLETED
    order.updatedAt = new Date().toISOString()
    order.items.forEach((item) => {
      item.itemState = OrderItemState.RECEIVED
    })
    return { code: '0', msg: '已确认收货', result: clone(order) }
  }

  // 取消订单 POST /account/orders/{orderId}:cancel
  const cancelMatch = url.match(/^\/account\/orders\/([^/:]+):cancel$/)
  if (cancelMatch && String(options.method || 'POST').toUpperCase() === 'POST') {
    const orderId = cancelMatch[1]
    const order = orders.get(orderId)
    if (!order) return { code: '1', msg: '订单不存在', result: null }
    if (order.orderState !== OrderState.PENDING && order.orderState !== OrderState.PAID) {
      return { code: '2', msg: '订单状态不允许取消', result: null }
    }
    order.orderState = OrderState.CANCELLED
    order.updatedAt = new Date().toISOString()
    return { code: '0', msg: '订单已取消', result: clone(order) }
  }

  // 删除订单 DELETE /account/orders/{orderId}
  const deleteOrderMatch = url.match(/^\/account\/orders\/([^/:]+)$/)
  if (deleteOrderMatch && String(options.method || 'DELETE').toUpperCase() === 'DELETE') {
    const orderId = deleteOrderMatch[1]
    const order = orders.get(orderId)
    if (!order) return { code: '1', msg: '订单不存在', result: null }
    if (order.orderState !== OrderState.COMPLETED && order.orderState !== OrderState.CANCELLED) {
      return { code: '2', msg: '只能删除已完成或已取消的订单', result: null }
    }
    orders.delete(orderId)
    return { code: '0', msg: '订单已删除', result: { success: true } }
  }

  // 获取订单物流 GET /account/orders/{orderId}/logistics
  const logisticsMatch = url.match(/^\/account\/orders\/([^/:]+)\/logistics$/)
  if (logisticsMatch && String(options.method || 'GET').toUpperCase() === 'GET') {
    const orderId = logisticsMatch[1]
    const order = orders.get(orderId)
    if (!order) return { code: '1', msg: '订单不存在', result: null }
    if (!order.shipments || order.shipments.length === 0) {
      return {
        code: '0',
        msg: 'ok',
        result: {
          orderId,
          orderState: order.orderState,
          shippingAddress: clone(order.shippingAddress),
          shipments: [],
        },
      }
    }
    return {
      code: '0',
      msg: 'ok',
      result: {
        orderId,
        orderState: order.orderState,
        shippingAddress: clone(order.shippingAddress),
        shipments: clone(order.shipments),
      },
    }
  }

  return null
}
