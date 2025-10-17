import type { AddressItem } from '@/types/address'
import { type Item, type OrderPreview, type Subscription } from './../types/checkout.d'
// Development mock server implementing Address, Cart and Checkout APIs
// Returns Data<T> objects that match the http wrapper expectations

type Data<T> = {
  code: string
  msg: string
  result: T
}

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms))

// In-memory stores
const addresses: Array<any> = []
const cartItems: Array<any> = []
const previews: Record<string, any> = {}

// Helpers
const clone = (v: any) => JSON.parse(JSON.stringify(v))

const computePreviewFromItems = (items: Item[]) => {
  const cloned = clone(items || [])

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
    eligibleSubtotalForFreeShipping: 0,
    discountDetails: [],
    recommendSubscriptions: [],
    items: [],
  }
  let totalDiscount = 0
  let hasSubscription = false

  cloned.forEach((it: Item) => {
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
    orderPreview.eligibleSubtotalForFreeShipping = orderPreview.subtotal
    if (it.discountDetails.length > 0) {
      orderPreview.discountDetails.push(...it.discountDetails)
    }
  })
  orderPreview.grandTotal = orderPreview.subtotal - totalDiscount
  if (hasSubscription) {
    cloned.forEach((it: Item) => {
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
    cloned.forEach((it: Item) => {
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
  orderPreview.items = cloned
  if (!orderPreview.shippingAddress) {
    const defaultShippingAddress = addresses.reduce(
      (def: AddressItem | null, a) => (a.isDefault ? a : def),
      null,
    )
    orderPreview.shippingAddress = defaultShippingAddress
  }
  return orderPreview
}

// --- Pre-populate two previews (IDs: '1' and '2') for development convenience
// preview '1' : subtotal >= 100 -> free shipping
// preview '2' : subtotal < 100 -> has shipping fee
;(function createSamplePreviews() {
  const items1: Item[] = [
    {
      id: 101,
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
        subscriptionAjudgements: [],
        source: 'CHECKOUT',
      },
    },
    {
      id: 201,
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
        subscriptionAjudgements: [],
        source: 'CHECKOUT',
      },
    },
  ]

  previews['1'] = computePreviewFromItems(items1)
})()

// Convert a cart entry (legacy shape) into checkout Item shape
const cartEntryToItem = (entry: any) => {
  const qty = Number(entry.quantity || 1)
  const unit = Number(entry.unitPrice || entry.price || 0)
  const purchaseType = entry.purchaseType ?? 0
  const sku = {
    productId: entry.productId || entry.id,
    skuId: entry.skuId || entry.skuId || entry.id,
    name: entry.name || '',
    specs: entry.specs || '',
    image: entry.image || '',
    strikeThroughPrice: unit,
    offerPrice: entry.offerPrice ?? unit,
    advertisedPrice: unit,
    supportSubscription: !!entry.supportSubscription,
    subscriptionDiscountRate: entry.subscriptionDiscount ?? 0,
    subscriptionDiscount: entry.subscriptionDiscount ?? 0,
    onceDiscountRate: entry.onceDiscount ?? 0,
    onceDiscount: entry.onceDiscount ?? 0,
  }
  const totalPrice = Number(((sku.offerPrice || unit) * qty).toFixed(2))
  const discountPrice = Math.max(0, Number((unit * qty - totalPrice).toFixed(2)))
  return {
    id: sku.productId,
    quantity: qty,
    unitPrice: unit,
    totalPrice,
    discountPrice,
    availableQuantity: 999,
    sku,
    discountDetails: [],
    purchaseType: purchaseType === 1 ? 1 : 0,
    subscription: {
      subscriptionFrequency: { frequency: 4, unit: 'WEEK' },
      subscriptionAjudgements: [
        {
          quantity: qty,
          skuId: sku.skuId,
          productId: sku.productId,
          partNumber: String(sku.skuId),
        },
      ],
      source: 'CHECKOUT',
    },
  }
}

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
    return { code: '0', msg: 'ok', result: clone(cartItems) }
  }

  if (url === '/account/cart/items' && String(options.method || 'POST').toUpperCase() === 'POST') {
    const body = (options.data as any) || {}
    // ensure sku uniqueness
    const existing = cartItems.find((c) => String(c.skuId) === String(body.skuId))
    if (existing) {
      existing.quantity = (existing.quantity || 0) + (body.quantity || 1)
      existing.purchaseType = body.purchaseType ?? existing.purchaseType
      return { code: '0', msg: 'updated', result: clone(existing) }
    }
    const id = Date.now()
    const entry = {
      id,
      productId: body.productId,
      skuId: body.skuId,
      quantity: body.quantity || 1,
      purchaseType: body.purchaseType || 0,
      name: body.name || '商品-' + id,
      unitPrice: body.unitPrice || 10,
    }
    cartItems.push(entry)
    return { code: '0', msg: 'created', result: clone(entry) }
  }

  if (
    url === '/account/cart:batchDelete' &&
    String(options.method || 'POST').toUpperCase() === 'POST'
  ) {
    const body = (options.data as any) || {}
    const ids = body.skuIds || []
    for (const sid of ids) {
      const idx = cartItems.findIndex((c) => String(c.skuId) === String(sid))
      if (idx !== -1) cartItems.splice(idx, 1)
    }
    return { code: '0', msg: 'deleted', result: null }
  }

  if (
    url.match(/^\/account\/cart\/items\/.+$/) &&
    String(options.method || 'PUT').toUpperCase() === 'PUT'
  ) {
    const parts = url.split('/')
    const skuId = parts[parts.length - 1]
    const body = (options.data as any) || {}
    const idx = cartItems.findIndex((c) => String(c.skuId) === String(skuId))
    if (idx === -1) return { code: '1', msg: 'not found', result: null }
    cartItems[idx] = { ...cartItems[idx], ...body }
    return { code: '0', msg: 'updated', result: clone(cartItems[idx]) }
  }

  if (
    url === '/account/cart:updateSelection' &&
    String(options.method || 'POST').toUpperCase() === 'POST'
  ) {
    const body = (options.data as any) || {}
    const selected = !!body.selected
    cartItems.forEach((c) => (c.selected = selected))
    return { code: '0', msg: 'ok', result: clone(cartItems) }
  }

  // --- Checkout endpoints ---
  if (url.startsWith('/checkout/entry/cart')) {
    // create a preview from current cart
    const previewId = 'PREVIEW-' + Date.now()
    const items = cartItems.map(cartEntryToItem)
    // previews[previewId] = computePreviewFromItems(items)
    return { code: '0', msg: 'ok', result: { previewId } }
  }

  const checkoutMatch = url.match(/^\/checkout\/p\/([^/]+)(?:\/(update|place-order))?$/)
  if (checkoutMatch) {
    const previewId = checkoutMatch[1]
    const action = checkoutMatch[2] || ''
    const method = String(options.method || 'GET').toUpperCase()

    if (!action && method === 'GET') {
      const source = previews[previewId]
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
        const subscribe = !!body.globalSubscription.subscribe
        const freq = body.globalSubscription.fulfillmentSchedule || { frequency: 4, unit: 'WEEK' }
        const items = previews[previewId].items || []
        items.forEach((it: any) => {
          if (it.sku?.supportSubscription) {
            it.purchaseType = subscribe ? 1 : 0
            it.subscription = it.subscription || {
              subscriptionFrequency: freq,
              subscriptionAjudgements: [],
              source: 'CHECKOUT',
            }
            it.subscription.subscriptionFrequency = freq
          }
        })
      } else if (updateField === 'ADDRESS' && body.addressId) {
        const addr = addresses.find((a) => String(a.id) === String(body.addressId))
        if (addr) previews[previewId].shippingAddresses = addr
      }

      // after mutations, recompute totals
      previews[previewId] = computePreviewFromItems(previews[previewId].items || [])
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
