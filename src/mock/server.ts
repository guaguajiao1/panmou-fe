import type { AddressItem } from '@/types/address'
import { type Item, type OrderPreview, type Subscription } from './../types/checkout.d'
import type { Cart } from '@/types/cart'
import type { OrderDetail, OrderSkuItem, DiscountDetail } from '@/types/order'
import type { OrderShipment, ShipmentTrace } from '@/types/logistics'
import { OrderState, OrderItemState, ItemType, ShipmentState } from '@/types/order-state'
// Development mock server implementing Address, Cart and Checkout APIs
// Returns Data<T> objects that match the http wrapper expectations

type Data<T> = {
  code: string
  msg: string
  result: T
}

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms))

// In-memory stores
const addresses: Array<any> = []
let globalCart: any = {}
const previews: Record<string, any> = {}
const orders: Map<string, OrderDetail> = new Map()

// Helpers
const clone = (v: any) => JSON.parse(JSON.stringify(v))

const computePreview = (orderPreview: OrderPreview) => {
  let totalDiscount = 0
  let hasSubscription = false
  orderPreview.subtotal = 0
  orderPreview.totalItemQuantity = 0
  orderPreview.freeShippingEligibleAmount = 0
  orderPreview.discountDetails = []
  orderPreview.grandTotal = 0
  orderPreview.subscriptionDiscount.subscriptionDiscount = 0
  orderPreview.subscriptionDiscount.subscriptionDiscountRate = 0

  orderPreview.items.forEach((it: Item) => {
    it.discountDetails = []
    it.totalPrice = it.sku.strikeThroughPrice * it.quantity
    it.sku.onceDiscount = (it.sku.onceDiscountRate * it.sku.strikeThroughPrice) / 100
    it.sku.subscriptionDiscount =
      (it.sku.subscriptionDiscountRate * it.sku.strikeThroughPrice) / 100
    if (it.purchaseType === 1) {
      it.totalDiscount = it.sku.subscriptionDiscount * it.quantity
      it.sku.adjustedPrice = it.sku.strikeThroughPrice - it.sku.subscriptionDiscount
      it.discountDetails.push({
        label: '订阅折扣',
        isRecurring: true,
        promotionId: 'MOCK-SUBSCRIPTION',
        promotionCode: '',
        amount: it.totalDiscount,
        displayLevel: 'ITEM',
        discountTarget: 'PRODUCT',
      })
      totalDiscount = totalDiscount + it.totalDiscount
      hasSubscription = true
    } else {
      it.sku.adjustedPrice = it.sku.strikeThroughPrice - it.sku.onceDiscount
      it.totalDiscount = it.sku.onceDiscount * it.quantity
      it.discountDetails.push({
        label: '商品折扣',
        isRecurring: false,
        promotionId: 'MOCK-ONCE',
        promotionCode: '',
        amount: it.totalDiscount,
        displayLevel: 'ITEM',
        discountTarget: 'PRODUCT',
      })
      totalDiscount = totalDiscount + it.totalDiscount
    }
    orderPreview.subtotal = orderPreview.subtotal + it.sku.strikeThroughPrice * it.quantity
    orderPreview.totalItemQuantity = orderPreview.totalItemQuantity + it.quantity
    orderPreview.freeShippingEligibleAmount = orderPreview.subtotal
    if (it.discountDetails.length > 0) {
      orderPreview.discountDetails.push(...it.discountDetails)
    }
  })
  orderPreview.grandTotal = orderPreview.subtotal - totalDiscount
  if (hasSubscription) {
    orderPreview.items.forEach((it: Item) => {
      if (it.sku.supportSubscription && it.purchaseType === 1) {
        orderPreview.subscriptionDiscount.subscriptionDiscount += it.totalDiscount
        if (
          it.sku.subscriptionDiscountRate >
          orderPreview.subscriptionDiscount.subscriptionDiscountRate
        ) {
          orderPreview.subscriptionDiscount.subscriptionDiscountRate =
            it.sku.subscriptionDiscountRate
        }
      }
    })
  } else {
    orderPreview.items.forEach((it: Item) => {
      if (it.sku.supportSubscription) {
        orderPreview.subscriptionDiscount.subscriptionDiscount +=
          it.sku.subscriptionDiscount * it.quantity
        if (
          it.sku.subscriptionDiscountRate >
          orderPreview.subscriptionDiscount.subscriptionDiscountRate
        ) {
          orderPreview.subscriptionDiscount.subscriptionDiscountRate =
            it.sku.subscriptionDiscountRate
        }
      }
    })
  }

  if (!orderPreview.shippingAddress) {
    // 使用 find() 来查找 isDefault 为 1 的第一个地址
    const defaultShippingAddress = addresses.find((a: AddressItem) => a.isDefault === 1)

    // console.log('Default shipping address=', defaultShippingAddress)

    // 如果 find() 没找到，它会返回 undefined。
    // 我们把它设置为 null，或者保持 undefined，这取决于您的后续逻辑。
    // (假设您希望在找不到时，shippingAddress 保持为 null 或 undefined)
    orderPreview.shippingAddress = defaultShippingAddress || null
  }

  return orderPreview
}

const computeCart = (cart: Cart) => {
  let totalDiscount = 0
  let hasSubscription = false
  cart.subtotal = 0
  cart.totalItemQuantity = 0
  cart.freeShippingEligibleAmount = 0
  cart.grandTotal = 0

  cart.items.forEach((it: Item) => {
    it.discountDetails = []
    it.totalPrice = it.sku.strikeThroughPrice * it.quantity
    it.sku.onceDiscount = (it.sku.onceDiscountRate * it.sku.strikeThroughPrice) / 100
    it.sku.subscriptionDiscount =
      (it.sku.subscriptionDiscountRate * it.sku.strikeThroughPrice) / 100
    if (it.purchaseType === 1) {
      it.totalDiscount = it.sku.subscriptionDiscount * it.quantity
      it.sku.adjustedPrice = it.sku.strikeThroughPrice - it.sku.subscriptionDiscount
      it.discountDetails.push({
        label: '订阅折扣',
        isRecurring: true,
        promotionId: 'MOCK-SUBSCRIPTION',
        promotionCode: '',
        amount: it.totalDiscount,
        displayLevel: 'ITEM',
        discountTarget: 'PRODUCT',
      })
      totalDiscount = totalDiscount + it.totalDiscount
      hasSubscription = true
    } else {
      it.sku.adjustedPrice = it.sku.strikeThroughPrice - it.sku.onceDiscount
      it.totalDiscount = it.sku.onceDiscount * it.quantity
      it.discountDetails.push({
        label: '商品折扣',
        isRecurring: false,
        promotionId: 'MOCK-ONCE',
        promotionCode: '',
        amount: it.totalDiscount,
        displayLevel: 'ITEM',
        discountTarget: 'PRODUCT',
      })
      totalDiscount = totalDiscount + it.totalDiscount
    }
    cart.subtotal = cart.subtotal + it.sku.strikeThroughPrice * it.quantity
    cart.totalItemQuantity = cart.totalItemQuantity + it.quantity
    cart.freeShippingEligibleAmount = cart.subtotal
  })
  cart.grandTotal = cart.subtotal - totalDiscount

  return cart
}

;(function createSamplePreviews() {
  const items1: Item[] = [
    {
      id: '101',
      quantity: 2,
      totalPrice: 0,
      totalDiscount: 0,
      availableQuantity: 99,
      sku: {
        productId: 1101,
        skuId: 101,
        name: '高级狗咀嚼棒',
        specs: '大号',
        image: 'https://placehold.co/160x160?text=Chew',
        strikeThroughPrice: 60,
        adjustedPrice: 0,
        supportSubscription: true,
        subscriptionDiscountRate: 35,
        subscriptionDiscount: 0,
        onceDiscountRate: 5,
        onceDiscount: 0,
      },
      discountDetails: [],
      purchaseType: 0,
      subscription: {
        subscriptionFrequency: { frequency: 4, unit: 'WEEK' },
        subscriptionAdjustments: [],
        source: 'CHECKOUT',
      },
    },
    {
      id: '201',
      quantity: 1,
      totalPrice: 0,
      totalDiscount: 0,
      availableQuantity: 50,
      sku: {
        productId: 1201,
        skuId: 201,
        name: '猫抓板',
        specs: '中号',
        image: 'https://placehold.co/160x160?text=Scratch',
        strikeThroughPrice: 30,
        adjustedPrice: 0,
        supportSubscription: false,
        subscriptionDiscountRate: 0,
        subscriptionDiscount: 0,
        onceDiscountRate: 5,
        onceDiscount: 0,
      },
      discountDetails: [],
      purchaseType: 0,
      subscription: {
        subscriptionFrequency: { frequency: 4, unit: 'WEEK' },
        subscriptionAdjustments: [],
        source: 'CHECKOUT',
      },
    },
  ]
  const orderPreview: OrderPreview = {
    id: '1',
    subscriptionDiscount: {
      subscriptionDiscountRate: 0,
      subscriptionDiscount: 0,
      firstSubscription: false,
    },
    totalItemQuantity: 0,
    subtotal: 0,
    grandTotal: 0,
    shippingFee: 0,
    freeShippingThreshold: 30,
    freeShippingEligibleAmount: 0,
    discountDetails: [],
    recommendSubscriptions: [],
    items: items1,
  }

  const cart: Cart = {
    id: '1',
    totalItemQuantity: 0,
    subtotal: 0,
    grandTotal: 0,
    shippingFee: 0,
    freeShippingThreshold: 30,
    freeShippingEligibleAmount: 0,
    items: items1,
  }

  previews['1'] = computePreview(orderPreview)
  globalCart = computeCart(cart)
  console.log('server init', previews['1'])
})()

// 初始化Mock订单数据
;(function createSampleOrders() {
  const now = new Date()
  const mockAddress: AddressItem = {
    id: '1',
    receiver: '张三',
    contact: '13800138000',
    provinceCode: '110000',
    cityCode: '110100',
    countyCode: '110101',
    address: '朝阳区建国门外大街1号',
    fullLocation: '北京市 北京市 东城区',
    isDefault: 1,
  }

  // 订单1: 待付款
  const order1: OrderDetail = {
    orderId: 'ORDER-001',
    userId: 'USER-001',
    orderState: OrderState.PENDING,
    payChannel: 2,
    payType: 1,
    totalItemQuantity: 2,
    totalAmount: 120,
    discountAmount: 10,
    shippingFee: 0,
    payAmount: 110,
    discountDetails: [
      {
        discountId: 'D001',
        discountType: 1,
        sourceId: 'COUPON-001',
        sourceName: '新人优惠券',
        discountAmount: 10,
      },
    ],
    shippingAddress: mockAddress,
    items: [
      {
        itemId: 'ITEM-001',
        orderId: 'ORDER-001',
        itemType: ItemType.NORMAL,
        itemState: OrderItemState.NORMAL,
        skuId: 'SKU-001',
        productId: 'PROD-001',
        productName: '高级狗咀嚼棒',
        skuAttrs: '规格:大号',
        productImage: 'https://placehold.co/160x160?text=Chew',
        unitPrice: 60,
        quantity: 2,
        discountAmount: 10,
        actualAmount: 110,
        discountDetails: [],
      },
    ],
    createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    expiredAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
    countdown: 1800,
  }

  // 订单2: 待发货
  const order2: OrderDetail = {
    orderId: 'ORDER-002',
    userId: 'USER-001',
    orderState: OrderState.PAID,
    payChannel: 2,
    payType: 1,
    payTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    totalItemQuantity: 1,
    totalAmount: 30,
    discountAmount: 0,
    shippingFee: 5,
    payAmount: 35,
    discountDetails: [],
    shippingAddress: mockAddress,
    items: [
      {
        itemId: 'ITEM-002',
        orderId: 'ORDER-002',
        itemType: ItemType.NORMAL,
        itemState: OrderItemState.NORMAL,
        skuId: 'SKU-002',
        productId: 'PROD-002',
        productName: '猫抓板',
        skuAttrs: '规格:中号',
        productImage: 'https://placehold.co/160x160?text=Scratch',
        unitPrice: 30,
        quantity: 1,
        discountAmount: 0,
        actualAmount: 30,
        discountDetails: [],
      },
    ],
    createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
  }

  // 订单3: 待收货（含物流信息）
  const order3: OrderDetail = {
    orderId: 'ORDER-003',
    userId: 'USER-001',
    orderState: OrderState.SHIPPED,
    payChannel: 1,
    payType: 1,
    payTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    totalItemQuantity: 3,
    totalAmount: 180,
    discountAmount: 20,
    shippingFee: 0,
    payAmount: 160,
    discountDetails: [
      {
        discountId: 'D002',
        discountType: 2,
        sourceId: 'PROMO-001',
        sourceName: '满100减20',
        discountAmount: 20,
      },
    ],
    shippingAddress: mockAddress,
    items: [
      {
        itemId: 'ITEM-003',
        orderId: 'ORDER-003',
        itemType: ItemType.NORMAL,
        itemState: OrderItemState.SHIPPED,
        skuId: 'SKU-001',
        productId: 'PROD-001',
        productName: '高级狗咀嚼棒',
        skuAttrs: '规格:大号',
        productImage: 'https://placehold.co/160x160?text=Chew',
        unitPrice: 60,
        quantity: 3,
        discountAmount: 20,
        actualAmount: 160,
        discountDetails: [],
      },
    ],
    shipments: [
      {
        shipmentId: 'SHIP-001',
        orderId: 'ORDER-003',
        carrierCode: 'SF',
        carrierName: '顺丰速运',
        trackingNo: 'SF1234567890',
        shipmentState: ShipmentState.DELIVERING,
        shippedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            orderItemId: 'ITEM-003',
            productName: '高级狗咀嚼棒',
            productImage: 'https://placehold.co/160x160?text=Chew',
            skuAttrs: '规格:大号',
            quantity: 3,
          },
        ],
        traces: [
          {
            traceId: 'T003',
            traceTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            traceState: ShipmentState.DELIVERING,
            traceDesc: '【北京市】快件正在派送中，快递员：李四，电话：138****1234',
            location: '北京市朝阳区',
          },
          {
            traceId: 'T002',
            traceTime: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
            traceState: ShipmentState.IN_TRANSIT,
            traceDesc: '【北京市】快件已到达北京朝阳分拨中心',
            location: '北京市朝阳区',
          },
          {
            traceId: 'T001',
            traceTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            traceState: ShipmentState.COLLECTED,
            traceDesc: '【上海市】顺丰速运已揽收',
            location: '上海市浦东新区',
          },
        ],
      },
    ],
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  }

  // 订单4: 已完成
  const order4: OrderDetail = {
    orderId: 'ORDER-004',
    userId: 'USER-001',
    orderState: OrderState.COMPLETED,
    payChannel: 2,
    payType: 1,
    payTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalItemQuantity: 1,
    totalAmount: 60,
    discountAmount: 0,
    shippingFee: 0,
    payAmount: 60,
    discountDetails: [],
    shippingAddress: mockAddress,
    items: [
      {
        itemId: 'ITEM-004',
        orderId: 'ORDER-004',
        itemType: ItemType.NORMAL,
        itemState: OrderItemState.RECEIVED,
        skuId: 'SKU-001',
        productId: 'PROD-001',
        productName: '高级狗咀嚼棒',
        skuAttrs: '规格:大号',
        productImage: 'https://placehold.co/160x160?text=Chew',
        unitPrice: 60,
        quantity: 1,
        discountAmount: 0,
        actualAmount: 60,
        discountDetails: [],
      },
    ],
    shipments: [
      {
        shipmentId: 'SHIP-002',
        orderId: 'ORDER-004',
        carrierCode: 'YTO',
        carrierName: '圆通速递',
        trackingNo: 'YT9876543210',
        shipmentState: ShipmentState.DELIVERED,
        shippedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        deliveredAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            orderItemId: 'ITEM-004',
            productName: '高级狗咀嚼棒',
            productImage: 'https://placehold.co/160x160?text=Chew',
            skuAttrs: '规格:大号',
            quantity: 1,
          },
        ],
        traces: [
          {
            traceId: 'T006',
            traceTime: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            traceState: ShipmentState.DELIVERED,
            traceDesc: '【北京市】快件已签收，签收人：本人签收',
            location: '北京市朝阳区',
          },
          {
            traceId: 'T005',
            traceTime: new Date(now.getTime() - 4.5 * 24 * 60 * 60 * 1000).toISOString(),
            traceState: ShipmentState.DELIVERING,
            traceDesc: '【北京市】快件正在派送中',
            location: '北京市朝阳区',
          },
          {
            traceId: 'T004',
            traceTime: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            traceState: ShipmentState.COLLECTED,
            traceDesc: '【上海市】圆通速递已揽收',
            location: '上海市浦东新区',
          },
        ],
      },
    ],
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  }

  // 将订单添加到存储
  orders.set(order1.orderId, order1)
  orders.set(order2.orderId, order2)
  orders.set(order3.orderId, order3)
  orders.set(order4.orderId, order4)

  console.log('Mock orders initialized:', orders.size)
})()

export const mockRequest = async (options: UniApp.RequestOptions): Promise<Data<any> | null> => {
  let url = String(options.url || '')
  try {
    const u = new URL(url, 'http://localhost')
    url = u.pathname + u.search
  } catch (e) {
    // keep original
  }
  console.log(`Mock request: ${options.method} ${url}`)
  await delay()

  // --- Address APIs (/account/addresses) ---
  if (url === '/account/addresses' && String(options.method || 'GET').toUpperCase() === 'GET') {
    return { code: '0', msg: 'ok', result: clone(addresses) }
  }

  if (url === '/account/addresses' && String(options.method || 'POST').toUpperCase() === 'POST') {
    const body = (options.data as any) || {}
    const id = Date.now()
    const item = { ...body }
    item.id = id.toString()
    if (item.isDefault) addresses.forEach((a) => (a.isDefault = 1))
    addresses.push(item)
    console.log('Address created:', item)
    return { code: '0', msg: 'created', result: item }
  }

  if (
    url.match(/^\/account\/addresses\/\d+$/) &&
    String(options.method || 'GET').toUpperCase() === 'GET'
  ) {
    const id = url.split('/').pop()
    const found = addresses.find((a) => a.id === id)
    if (found) return { code: '0', msg: 'ok', result: clone(found) }
    return { code: '1', msg: 'not found', result: null }
  }

  if (
    url.match(/^\/account\/addresses\/\d+$/) &&
    String(options.method || 'PUT').toUpperCase() === 'PUT'
  ) {
    const id = url.split('/').pop()
    const idx = addresses.findIndex((a) => a.id === id)
    if (idx === -1) return { code: '1', msg: 'not found', result: null }
    const body = (options.data as any) || {}
    addresses[idx] = { ...addresses[idx], ...body }
    if (addresses[idx].isDefault)
      addresses.forEach((a, i) => {
        if (i !== idx) a.isDefault = 1
      })
    return { code: '0', msg: 'updated', result: clone(addresses[idx]) }
  }

  if (
    url.match(/^\/account\/addresses\/\d+$/) &&
    String(options.method || 'DELETE').toUpperCase() === 'DELETE'
  ) {
    const id = url.split('/').pop()
    const idx = addresses.findIndex((a) => a.id === id)
    if (idx === -1) return { code: '1', msg: 'not found', result: null }
    const removed = addresses.splice(idx, 1)[0]
    if (removed.isDefault && addresses.length > 0) addresses[0].isDefault = 1
    console.log('Address deleted:', removed)
    console.log('Remaining addresses:', addresses)
    return { code: '0', msg: 'deleted', result: clone(removed) }
  }

  // --- Cart APIs (/account/cart) ---
  if (url === '/account/cart' && String(options.method || 'GET').toUpperCase() === 'GET') {
    return { code: '0', msg: 'ok', result: clone(globalCart) }
  }

  if (
    url === '/account/cart:batchDelete' &&
    String(options.method || 'POST').toUpperCase() === 'POST'
  ) {
    const body = (options.data as any) || {}
    const ids = body.skuIds || []
    for (const sid of ids) {
      const idx = globalCart.items.findIndex((item: Item) => String(item.sku.skuId) === String(sid))
      if (idx !== -1) globalCart.items.splice(idx, 1)
    }
    return { code: '0', msg: 'deleted', result: clone(computeCart(globalCart)) }
  }

  if (
    url.match(/^\/account\/cart\/items\/.+$/) &&
    String(options.method || 'PUT').toUpperCase() === 'PUT'
  ) {
    const parts = url.split('/')
    const skuId = parts[parts.length - 1]
    const body = (options.data as any) || {}
    const idx = globalCart.items.findIndex((item: Item) => String(item.sku.skuId) === String(skuId))
    if (idx === -1) return { code: '1', msg: 'not found', result: null }
    globalCart.items[idx].quantity = body.quantity ?? globalCart.items[idx].quantity
    globalCart.items[idx].purchaseType = body.purchaseType ?? globalCart.items[idx].purchaseType
    return { code: '0', msg: 'updated', result: clone(computeCart(globalCart)) }
  }

  if (
    url === '/account/cart:updateSelection' &&
    String(options.method || 'POST').toUpperCase() === 'POST'
  ) {
    const body = (options.data as any) || {}
    const selected = !!body.selected
    //globalCart.items.forEach((item: Item) => (item.selected = selected))
    return { code: '0', msg: 'ok', result: clone(computeCart(globalCart)) }
  }

  const checkoutMatch = url.match(/^\/checkout\/p\/([^/]+)(?:\/(update|place-order))?$/)
  if (checkoutMatch) {
    const previewId = checkoutMatch[1]
    const action = checkoutMatch[2] || ''
    const method = String(options.method || 'GET').toUpperCase()
    console.log('[[[server berore orderPreview=', previews[previewId])

    if (!action && method === 'GET') {
      previews[previewId] = computePreview(previews[previewId])
      console.log('[[[server get berore orderPreview=', previews[previewId])
      if (!previews[previewId]) return { code: '1', msg: 'preview not found', result: null }
      return { code: '0', msg: 'ok', result: clone(previews[previewId]) }
    }

    if (action === 'update' && method === 'POST') {
      const body = (options.data as any) || {}
      if (!previews[previewId]) return { code: '1', msg: 'preview not found', result: null }
      const updateField = body.updateField
      if (updateField === 'ITEM' && body.itemLevelSelection) {
        const sel = body.itemLevelSelection
        const items = previews[previewId].items || []
        const idx = items.findIndex(
          (it: any) =>
            String(it.id) === String(sel.itemId) ||
            String(it.sku?.skuId) === String(sel.partNumber),
        )
        if (idx !== -1) {
          if (sel.quantity !== undefined) items[idx].quantity = Number(sel.quantity)
          if (sel.purchaseType !== undefined)
            items[idx].purchaseType = sel.purchaseType === 1 ? 1 : 0
        }
      } else if (updateField === 'GLOBALSUBSCRIPTION' && body.globalSubscription) {
        const items = previews[previewId].items || []
        const oldIsSubscribe = items.some((it: Item) => it.purchaseType === 1)
        const freq = body.globalSubscription.fulfillmentSchedule || { frequency: 4, unit: 'WEEK' }

        if (oldIsSubscribe === body.globalSubscription.subscribe && oldIsSubscribe) {
          items.forEach((it: Item) => {
            if (it.sku?.supportSubscription) {
              it.subscription = it.subscription || {
                subscriptionFrequency: freq,
                subscriptionAjudgements: [],
                source: 'CHECKOUT',
              }
              it.subscription.subscriptionFrequency = freq
            }
          })
        }

        if (
          oldIsSubscribe !== body.globalSubscription.subscribe &&
          body.globalSubscription.subscribe
        ) {
          items.forEach((it: Item) => {
            if (it.sku?.supportSubscription) {
              it.purchaseType = 1
              it.subscription = it.subscription || {
                subscriptionFrequency: freq,
                subscriptionAjudgements: [],
                source: 'CHECKOUT',
              }
              it.subscription.subscriptionFrequency = freq
            }
          })
        }
        if (
          oldIsSubscribe !== body.globalSubscription.subscribe &&
          !body.globalSubscription.subscribe
        ) {
          items.forEach((it: Item) => {
            if (it.sku?.supportSubscription) {
              it.purchaseType = 0
            }
          })
        }
      } else if (updateField === 'ADDRESS') {
        console.log('Updating address to id=', body.addressId)
        if (!body.addressId || body.addressId === '') {
          previews[previewId].shippingAddress = null
        } else {
          const addr = addresses.find((a) => String(a.id) === String(body.addressId))
          console.log('address=', addr)
          if (addr) previews[previewId].shippingAddress = addr
        }
      }

      // after mutations, recompute totals
      previews[previewId] = computePreview(previews[previewId])
      console.log('[[[server after orderPreview=', previews[previewId])

      return { code: '0', msg: 'updated', result: clone(previews[previewId]) }
    }

    if (action === 'place-order' && method === 'POST') {
      if (!previews[previewId]) return { code: '1', msg: 'preview not found', result: null }
      const orderId = 'ORDER-' + Date.now()
      // simulate order creation: drop preview
      delete previews[previewId]
      return { code: '0', msg: 'ok', result: { orderId } }
    }
  }

  // Product detail fallback (simple)
  if (url.startsWith('/product/detail')) {
    return {
      code: '0',
      msg: 'ok',
      result: {
        id: 100,
        name: '模拟商品',
        image: 'https://placehold.co/200x200',
        price: 99.0,
        stock: 100,
      },
    }
  }

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
      return { code: '2', msg: '暂无物流信息', result: { orderId, shipments: [] } }
    }
    return { code: '0', msg: 'ok', result: { orderId, shipments: clone(order.shipments) } }
  }

  // --- Account Auth APIs (/account/auth) ---

  // 微信小程序手机号登录 POST /account/auth/wx-phone
  if (
    url.match(/^\/account\/auth\/wx-phone$/) &&
    String(options.method || 'POST').toUpperCase() === 'POST'
  ) {
    return {
      code: '0',
      msg: 'ok',
      result: {
        mobile: '13888888888',
        token: 'mock-token-' + Date.now(),
        profile: {
          uid: '888',
          nickname: '盼眸用户',
          avatar: 'https://pcapi-xiaotuxian-front-devtest.itheima.net/miniapp/uploads/avatar_3.jpg',
          account: 'panmou_user',
          gender: '男',
          birthday: '1995-01-01',
          fullLocation: '北京市 市辖区 东城区',
          profession: '工程师',
        },
      },
    }
  }

  // 微信小程序静默登录 POST /account/auth/wx-silent
  if (
    url.match(/^\/account\/auth\/wx-silent$/) &&
    String(options.method || 'POST').toUpperCase() === 'POST'
  ) {
    return {
      code: '0',
      msg: 'ok',
      result: {
        mobile: '13888888888',
        token: 'mock-token-' + Date.now(),
        profile: {
          uid: '888',
          nickname: '盼眸用户',
          avatar: 'https://pcapi-xiaotuxian-front-devtest.itheima.net/miniapp/uploads/avatar_3.jpg',
          account: 'panmou_user',
          gender: '男',
        },
      },
    }
  }

  // 退出登录 POST /account/auth/logout
  if (
    url.match(/^\/account\/auth\/logout$/) &&
    String(options.method || 'POST').toUpperCase() === 'POST'
  ) {
    return { code: '0', msg: 'ok', result: null }
  }

  // --- Account Profile APIs (/account/profile) ---

  // 获取用户资料 GET /account/profile
  if (
    url.match(/^\/account\/profile$/) &&
    String(options.method || 'GET').toUpperCase() === 'GET'
  ) {
    return {
      code: '0',
      msg: 'ok',
      result: {
        uid: '888',
        nickname: '盼眸用户',
        avatar: 'https://pcapi-xiaotuxian-front-devtest.itheima.net/miniapp/uploads/avatar_3.jpg',
        account: 'panmou_user',
        gender: '男',
        birthday: '1995-01-01',
        fullLocation: '北京市 市辖区 东城区',
        profession: '工程师',
      },
    }
  }

  // 更新用户资料 PUT /account/profile
  if (
    url.match(/^\/account\/profile$/) &&
    String(options.method || 'PUT').toUpperCase() === 'PUT'
  ) {
    const data = (options.data as any) || {}
    return {
      code: '0',
      msg: 'ok',
      result: {
        uid: '888',
        nickname: data.nickname || '盼眸用户',
        avatar: 'https://pcapi-xiaotuxian-front-devtest.itheima.net/miniapp/uploads/avatar_3.jpg',
        account: 'panmou_user',
        gender: data.gender || '男',
        birthday: data.birthday || '1995-01-01',
        fullLocation: '北京市 市辖区 东城区',
        profession: data.profession || '工程师',
      },
    }
  }

  // 更新用户头像 PUT /account/profile/avatar
  if (
    url.match(/^\/account\/profile\/avatar$/) &&
    String(options.method || 'PUT').toUpperCase() === 'PUT'
  ) {
    const data = (options.data as any) || {}
    return {
      code: '0',
      msg: 'ok',
      result: {
        avatar:
          data.avatar ||
          'https://pcapi-xiaotuxian-front-devtest.itheima.net/miniapp/uploads/avatar_3.jpg',
      },
    }
  }

  // --- Legacy APIs (保持向后兼容) ---

  // 旧版登录 POST /login/wxMin
  if (url.match(/^\/login\/wxMin/) && String(options.method || 'POST').toUpperCase() === 'POST') {
    return {
      code: '0',
      msg: 'ok',
      result: {
        mobile: '13888888888',
        token: 'mock-token-' + Date.now(),
        profile: {
          uid: '888',
          nickname: '盼眸用户',
          avatar: 'https://pcapi-xiaotuxian-front-devtest.itheima.net/miniapp/uploads/avatar_3.jpg',
          account: 'panmou_user',
          gender: '男',
        },
      },
    }
  }

  // 旧版用户资料 GET /member/profile
  if (url.match(/^\/member\/profile/) && String(options.method || 'GET').toUpperCase() === 'GET') {
    return {
      code: '0',
      msg: 'ok',
      result: {
        uid: '888',
        nickname: '盼眸用户',
        avatar: 'https://pcapi-xiaotuxian-front-devtest.itheima.net/miniapp/uploads/avatar_3.jpg',
        account: 'panmou_user',
        gender: '男',
        birthday: '1995-01-01',
        fullLocation: '北京市 市辖区 东城区',
        profession: '工程师',
      },
    }
  }

  // 旧版用户资料 PUT /member/profile
  if (url.match(/^\/member\/profile/) && String(options.method || 'PUT').toUpperCase() === 'PUT') {
    const data = (options.data as any) || {}
    return {
      code: '0',
      msg: 'ok',
      result: {
        uid: '888',
        nickname: data.nickname || '盼眸用户',
        avatar: 'https://pcapi-xiaotuxian-front-devtest.itheima.net/miniapp/uploads/avatar_3.jpg',
        account: 'panmou_user',
        gender: data.gender || '男',
        birthday: data.birthday || '1995-01-01',
        fullLocation: '北京市 市辖区 东城区',
        profession: data.profession || '工程师',
      },
    }
  }

  return null
}
