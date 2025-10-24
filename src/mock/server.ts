import type { AddressItem } from '@/types/address'
import { type Item, type OrderPreview, type Subscription } from './../types/checkout.d'
import type { it } from 'node:test'
import type { Cart } from '@/types/cart'
// Development mock server implementing Address, Cart and Checkout APIs
// Returns Data<T> objects that match the http wrapper expectations

type Data<T> = {
  code: string
  msg: string
  result: T
}

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms))

// In-memory stores
const addresses: Array<any> = []
let globalCart: any = {}
const previews: Record<string, any> = {}

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
    const defaultShippingAddress = addresses.reduce(
      (def: AddressItem | null, a) => (a.isDefault ? a : def),
      null,
    )
    orderPreview.shippingAddress = defaultShippingAddress
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

export const mockRequest = async (options: UniApp.RequestOptions): Promise<Data<any> | null> => {
  let url = String(options.url || '')
  try {
    const u = new URL(url, 'http://localhost')
    url = u.pathname + u.search
  } catch (e) {
    // keep original
  }

  await delay()

  // --- Address APIs (/account/addresses) ---
  if (url === '/account/addresses' && String(options.method || 'GET').toUpperCase() === 'GET') {
    return { code: '0', msg: 'ok', result: clone(addresses) }
  }

  if (url === '/account/addresses' && String(options.method || 'POST').toUpperCase() === 'POST') {
    const body = (options.data as any) || {}
    const id = Date.now()
    const item = { id, ...body, isDefault: !!body.isDefault }
    if (item.isDefault) addresses.forEach((a) => (a.isDefault = false))
    addresses.push(item)
    return { code: '0', msg: 'created', result: item }
  }

  if (
    url.match(/^\/account\/addresses\/\d+$/) &&
    String(options.method || 'GET').toUpperCase() === 'GET'
  ) {
    const id = Number(url.split('/').pop())
    const found = addresses.find((a) => a.id === id)
    if (found) return { code: '0', msg: 'ok', result: clone(found) }
    return { code: '1', msg: 'not found', result: null }
  }

  if (
    url.match(/^\/account\/addresses\/\d+$/) &&
    String(options.method || 'PUT').toUpperCase() === 'PUT'
  ) {
    const id = Number(url.split('/').pop())
    const idx = addresses.findIndex((a) => a.id === id)
    if (idx === -1) return { code: '1', msg: 'not found', result: null }
    const body = (options.data as any) || {}
    addresses[idx] = { ...addresses[idx], ...body }
    if (addresses[idx].isDefault)
      addresses.forEach((a, i) => {
        if (i !== idx) a.isDefault = false
      })
    return { code: '0', msg: 'updated', result: clone(addresses[idx]) }
  }

  if (
    url.match(/^\/account\/addresses\/\d+$/) &&
    String(options.method || 'DELETE').toUpperCase() === 'DELETE'
  ) {
    const id = Number(url.split('/').pop())
    const idx = addresses.findIndex((a) => a.id === id)
    if (idx === -1) return { code: '1', msg: 'not found', result: null }
    const removed = addresses.splice(idx, 1)[0]
    if (removed.isDefault && addresses.length > 0) addresses[0].isDefault = true
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
      const source = previews[previewId]
      console.log('[[[server get berore orderPreview=', previews[previewId])
      if (!source) return { code: '1', msg: 'preview not found', result: null }
      return { code: '0', msg: 'ok', result: clone(source) }
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
      } else if (updateField === 'ADDRESS' && body.addressId) {
        const addr = addresses.find((a) => String(a.id) === String(body.addressId))
        console.log('address=', addr)
        if (addr) previews[previewId].shippingAddress = addr
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

  // Not mocked
  return null
}
