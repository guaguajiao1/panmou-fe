import type { AddressItem } from '@/types/address'
import { type Item, type OrderPreview } from './../types/checkout.d'
import type { Cart, CartItem } from '@/types/cart'
import type { OrderDetail, OrderSkuItem, DiscountDetail } from '@/types/order'
import type { OrderShipment, ShipmentTrace } from '@/types/logistics'
import type { PetProfile, PetEnums, EnumItem } from '@/types/pet'
import { OrderState, OrderItemState, ItemType, ShipmentState } from '@/types/order-state'
// Development mock server implementing Address, Cart and Checkout APIs
// Returns Data<T> objects that match the http wrapper expectations

type Data<T> = {
  code: string
  msg: string
  result: T
}

const delay = (ms = 1500) => new Promise((r) => setTimeout(r, ms))

// In-memory stores
const addresses: Array<any> = []
let globalCart: any = {}
const previews: Record<string, any> = {}
const orders: Map<string, OrderDetail> = new Map()
const pets: Map<string, PetProfile> = new Map()

// Helpers
const clone = (v: any) => JSON.parse(JSON.stringify(v))

/**
 * computePreview: Recalculate all prices for an OrderPreview.
 *
 * Pricing logic (per item):
 *   originalPrice   = sku.originalPrice (base / list price, provided in raw data)
 *   totalItemPrice   = originalPrice * quantity
 *   totalItemDiscount = sum of |discountDetail.amount| * quantity   (+ subscription if applicable)
 *   finalPrice       = originalPrice - perItemDiscount
 *   grandTotal       = subtotal - totalDiscount
 *
 * Order-level discountDetails = aggregate item discounts by label.
 */
const computePreview = (orderPreview: OrderPreview) => {
  let numSubtotal = 0
  let numTotalDiscount = 0
  let numFreeShippingEligible = 0
  let numSubDiscount = 0
  let maxSubRate = ''
  let maxSubRateNum = 0
  let hasSubscription = false
  orderPreview.totalItemQuantity = 0

  orderPreview.items.forEach((it: any) => {
    const sku = it.sku
    // base price: use the numeric "rawPrice" we store internally, or parse originalPrice
    const basePrice: number = sku._rawPrice ?? (parseFloat(sku.originalPrice) || 0)

    // Keep existing promo discounts, remove old subscription discount
    it.discountDetails = (it.discountDetails || []).filter(
      (d: any) => d.promotionId !== 'MOCK-SUBSCRIPTION',
    )

    // Per-unit promo discount (sum of all existing discount amounts, which are negative)
    let promoDiscountPerUnit = 0
    it.discountDetails.forEach((d: any) => {
      const amt = parseFloat(d.amount)
      if (!isNaN(amt) && amt < 0) promoDiscountPerUnit += Math.abs(amt)
    })

    // Subscription discount per unit
    const subRateNum = parseFloat(sku.subscriptionDiscountRate) || 0
    const skuSubDiscountPerUnit = (subRateNum * basePrice) / 100
    sku.subscriptionDiscount = skuSubDiscountPerUnit.toFixed(2)

    if (it.purchaseType === 1 && sku.supportsSubscription) {
      const itemSubTotal = skuSubDiscountPerUnit * it.quantity
      it.discountDetails.push({
        label: '订阅折扣',
        isRecurring: true,
        promotionId: 'MOCK-SUBSCRIPTION',
        promotionCode: '',
        amount: (-skuSubDiscountPerUnit).toFixed(2),
        displayLevel: 'ITEM' as const,
        discountTarget: 'PRODUCT',
      })
      hasSubscription = true
    }

    // Total per-unit discount
    const allDiscountPerUnit =
      promoDiscountPerUnit +
      (it.purchaseType === 1 && sku.supportsSubscription ? skuSubDiscountPerUnit : 0)

    // item-level computed fields
    it.originalPrice = basePrice.toFixed(2)
    it.finalPrice = (basePrice - allDiscountPerUnit).toFixed(2)
    it.totalItemPrice = (basePrice * it.quantity).toFixed(2)
    it.totalItemDiscount = (allDiscountPerUnit * it.quantity).toFixed(2)

    // sku display fields
    sku.originalPrice = basePrice.toFixed(2)
    sku.finalPrice = it.finalPrice

    numSubtotal += basePrice * it.quantity
    numTotalDiscount += allDiscountPerUnit * it.quantity
    orderPreview.totalItemQuantity += it.quantity
    numFreeShippingEligible = numSubtotal

    // subscription stats
    if (sku.supportsSubscription) {
      if (subRateNum > maxSubRateNum) {
        maxSubRateNum = subRateNum
        maxSubRate = sku.subscriptionDiscountRate
      }
      if (it.purchaseType === 1) {
        numSubDiscount += skuSubDiscountPerUnit * it.quantity
      } else {
        // potential subscription discount
        numSubDiscount += skuSubDiscountPerUnit * it.quantity
      }
    }
  })

  const numGrandTotal = numSubtotal - numTotalDiscount
  orderPreview.subtotal = numSubtotal.toFixed(2)
  orderPreview.grandTotal = numGrandTotal.toFixed(2)
  orderPreview.totalDiscount = numTotalDiscount.toFixed(2)
  orderPreview.freeShippingEligibleAmount = numFreeShippingEligible.toFixed(2)

  // Aggregate order-level discount details by label
  const labelMap = new Map<string, any>()
  orderPreview.items.forEach((it: any) => {
    ;(it.discountDetails || []).forEach((d: any) => {
      const perUnitAmt = parseFloat(d.amount) || 0 // negative
      const lineAmt = perUnitAmt * it.quantity
      if (labelMap.has(d.label)) {
        const existing = labelMap.get(d.label)
        existing.amount = (parseFloat(existing.amount) + lineAmt).toFixed(2)
      } else {
        labelMap.set(d.label, { ...d, amount: lineAmt.toFixed(2) })
      }
    })
  })
  orderPreview.discountDetails = Array.from(labelMap.values())

  orderPreview.subscriptionDiscount.subscriptionDiscount = numSubDiscount.toFixed(2)
  orderPreview.subscriptionDiscount.subscriptionDiscountRate = maxSubRate || '0'

  if (!orderPreview.shippingAddress) {
    const defaultShippingAddress = addresses.find((a: AddressItem) => a.isDefault === 1)
    orderPreview.shippingAddress = defaultShippingAddress || null
  }

  return orderPreview
}

/**
 * computeCart: Recalculate all prices for a Cart.
 * Only SELECTED items contribute to cart-level totals (subtotal, grandTotal, totalDiscount).
 * All items still get their per-item fields computed.
 */
const computeCart = (cart: Cart) => {
  let numSubtotal = 0
  let numTotalDiscount = 0
  cart.totalItemQuantity = 0

  cart.items.forEach((it: any) => {
    const sku = it.sku
    const basePrice: number = sku._rawPrice ?? (parseFloat(sku.originalPrice) || 0)

    // Keep existing promo discounts, remove old subscription discount
    it.discountDetails = (it.discountDetails || []).filter(
      (d: any) => d.promotionId !== 'MOCK-SUBSCRIPTION',
    )

    // Per-unit promo discount
    let promoDiscountPerUnit = 0
    it.discountDetails.forEach((d: any) => {
      const amt = parseFloat(d.amount)
      if (!isNaN(amt) && amt < 0) promoDiscountPerUnit += Math.abs(amt)
    })

    // Subscription discount per unit
    const subRateNum = parseFloat(sku.subscriptionDiscountRate) || 0
    let subscriptionDiscountPerUnit = 0
    if (it.purchaseType === 1 && sku.supportsSubscription) {
      subscriptionDiscountPerUnit = (subRateNum * basePrice) / 100

      it.discountDetails.push({
        label: `订阅省${sku.subscriptionDiscountRate}%`,
        isRecurring: true,
        promotionId: 'MOCK-SUBSCRIPTION',
        promotionCode: '',
        amount: (-subscriptionDiscountPerUnit).toFixed(2),
        displayLevel: 'ITEM' as const,
        discountTarget: 'PRODUCT',
      })
    }
    sku.subscriptionDiscount = ((subRateNum * basePrice) / 100).toFixed(2)

    // Total per-unit discount
    const allDiscountPerUnit = promoDiscountPerUnit + subscriptionDiscountPerUnit

    // item-level computed fields (matching CartItem type)
    it.originalPrice = basePrice.toFixed(2)
    it.finalPrice = (basePrice - allDiscountPerUnit).toFixed(2)
    it.totalItemPrice = (basePrice * it.quantity).toFixed(2)
    it.totalItemDiscount = (allDiscountPerUnit * it.quantity).toFixed(2)
    it.addedPrice = basePrice.toFixed(2)

    // sku display fields
    sku.originalPrice = basePrice.toFixed(2)
    sku.finalPrice = it.finalPrice

    // Only selected items contribute to cart-level totals
    if (it.selected) {
      numTotalDiscount += allDiscountPerUnit * it.quantity
      numSubtotal += basePrice * it.quantity
      cart.totalItemQuantity += it.quantity
    }
  })

  const numGrandTotal = numSubtotal - numTotalDiscount
  cart.subtotal = numSubtotal.toFixed(2)
  cart.grandTotal = numGrandTotal.toFixed(2)
  cart.totalDiscount = numTotalDiscount.toFixed(2)
  cart.freeShippingEligibleAmount = numGrandTotal.toFixed(2)

  // Aggregate order-level discount details by label (only selected items)
  const labelMap = new Map<string, any>()
  cart.items.forEach((it: any) => {
    if (!it.selected) return
    ;(it.discountDetails || []).forEach((d: any) => {
      const perUnitAmt = parseFloat(d.amount) || 0
      const lineAmt = perUnitAmt * it.quantity
      if (labelMap.has(d.label)) {
        const existing = labelMap.get(d.label)
        existing.amount = (parseFloat(existing.amount) + lineAmt).toFixed(2)
      } else {
        labelMap.set(d.label, { ...d, amount: lineAmt.toFixed(2) })
      }
    })
  })
  cart.discountDetails = Array.from(labelMap.values())

  return cart
}

/**
 * Create sample mock data with rich discount details.
 *
 * ===== Item 1: 高级狗粮 (qty 2) =====
 * originalPrice (base) = 199.90
 * discounts per unit:
 *   官方直降  -16.60   (P-DIRECT)
 *   促销      -20.00   (P-PROMO)
 *   Plus会员  -2.00    (P-PLUS)
 *   首购优惠  -3.00    (P-FIRST)
 *   total discount per unit = 41.60
 * finalPrice = 199.90 - 41.60 = 158.30
 * totalItemPrice = 199.90 * 2 = 399.80
 * totalItemDiscount = 41.60 * 2 = 83.20
 *
 * ===== Item 2: 猫抓板 (qty 1) =====
 * originalPrice = 89.90
 * discounts per unit:
 *   官方直降  -3.00    (P-DIRECT)
 *   促销      -2.00    (P-PROMO)
 *   total discount per unit = 5.00
 * finalPrice = 89.90 - 5.00 = 84.90
 * totalItemPrice = 89.90 * 1 = 89.90
 * totalItemDiscount = 5.00 * 1 = 5.00
 *
 * ===== Item 3: 鲜食鸡胸肉 (qty 1, fresh food: sku.type=8) =====
 * originalPrice = 29.90
 * discounts per unit:
 *   首购优惠  -3.00    (P-FIRST)
 *   total discount per unit = 3.00
 * finalPrice = 29.90 - 3.00 = 26.90
 * totalItemPrice = 29.90
 * totalItemDiscount = 3.00
 *
 * ===== Order Level =====
 * subtotal = 399.80 + 89.90 + 29.90 = 519.60
 * totalDiscount = 83.20 + 5.00 + 3.00 = 91.20
 * grandTotal = 519.60 - 91.20 = 428.40
 * Aggregated order discounts:
 *   官方直降  -(16.60*2 + 3.00*1) = -36.20
 *   促销      -(20.00*2 + 2.00*1) = -42.00
 *   Plus会员  -(2.00*2) = -4.00
 *   首购优惠  -(3.00*2 + 3.00*1) = -9.00
 *   sum = 36.20 + 42.00 + 4.00 + 9.00 = 91.20 ✓
 */
;(function createSamplePreviews() {
  // --- SKU definitions (shared _rawPrice for compute functions) ---
  const skuDogFood: any = {
    productId: '1101',
    skuId: '101',
    name: '高级狗粮',
    desc: '天然无谷物配方，适合所有犬种',
    specs: '大袋 10kg',
    image: ['https://placehold.co/160x160?text=DogFood'],
    strikeThroughPrice: '239.00',
    advertisedPrice: '199.90',
    originalPrice: '199.90',
    finalPrice: '0.00', // will be computed
    type: 1,
    supportsSubscription: true,
    subscriptionDiscountRate: '5',
    subscriptionDiscount: '0.00',
    maxQuantity: 99,
    _rawPrice: 199.9,
  }

  const skuCatScratcher: any = {
    productId: '1201',
    skuId: '201',
    name: '猫抓板',
    desc: '耐磨瓦楞纸材质',
    specs: '中号',
    image: ['https://placehold.co/160x160?text=Scratch'],
    strikeThroughPrice: '99.00',
    advertisedPrice: '89.90',
    originalPrice: '89.90',
    finalPrice: '0.00',
    type: 1,
    supportsSubscription: true,
    subscriptionDiscountRate: '5',
    subscriptionDiscount: '0.00',
    maxQuantity: 50,
    _rawPrice: 89.9,
  }

  const skuFreshChicken: any = {
    productId: '1301',
    skuId: '301',
    name: '鲜食鸡胸肉',
    desc: '新鲜冷链配送',
    specs: '200g/份',
    image: ['https://placehold.co/160x160?text=FreshMeal'],
    strikeThroughPrice: '35.00',
    advertisedPrice: '29.90',
    originalPrice: '29.90',
    finalPrice: '0.00',
    type: 8, // 鲜食类型
    supportsSubscription: false,
    subscriptionDiscountRate: '0',
    subscriptionDiscount: '0.00',
    maxQuantity: 1,
    customization: {
      items: [
        {
          code: 'PROTEIN',
          name: '蛋白质来源',
          image: '',
          mode: 1,
          displayMode: 1,
          values: [
            { code: 'CHICKEN', name: '鸡胸肉', image: '', checked: 1 },
            { code: 'BEEF', name: '牛肉', image: '', checked: 0 },
          ],
        },
      ],
    },
    _rawPrice: 29.9,
  }

  // --- Checkout items ---
  const items1: any[] = [
    {
      itemId: 'ci-101',
      quantity: 2,
      originalPrice: '0.00',
      finalPrice: '0.00',
      totalItemPrice: '0.00',
      totalItemDiscount: '0.00',
      availableQuantity: 99,
      sku: { ...skuDogFood },
      discountDetails: [
        {
          label: '官方直降',
          isRecurring: false,
          promotionId: 'P-DIRECT',
          promotionCode: '',
          amount: '-16.60',
          displayLevel: 'ITEM' as const,
          discountTarget: 'PRODUCT',
        },
        {
          label: '促销',
          isRecurring: false,
          promotionId: 'P-PROMO',
          promotionCode: '',
          amount: '-20.00',
          displayLevel: 'ITEM' as const,
          discountTarget: 'PRODUCT',
        },
        {
          label: 'Plus会员',
          isRecurring: false,
          promotionId: 'P-PLUS',
          promotionCode: '',
          amount: '-2.00',
          displayLevel: 'ITEM' as const,
          discountTarget: 'PRODUCT',
        },
        {
          label: '首购优惠',
          isRecurring: false,
          promotionId: 'P-FIRST',
          promotionCode: '',
          amount: '-3.00',
          displayLevel: 'ITEM' as const,
          discountTarget: 'PRODUCT',
        },
      ],
      purchaseType: 0 as const,
      Autoship: {
        subscriptionFrequency: { frequency: 4, unit: 'WEEK' as const },
        subscriptionAdjustments: [],
        source: 'CHECKOUT' as const,
      },
    },
    {
      itemId: 'ci-201',
      quantity: 1,
      originalPrice: '0.00',
      finalPrice: '0.00',
      totalItemPrice: '0.00',
      totalItemDiscount: '0.00',
      availableQuantity: 50,
      sku: { ...skuCatScratcher },
      discountDetails: [
        {
          label: '官方直降',
          isRecurring: false,
          promotionId: 'P-DIRECT',
          promotionCode: '',
          amount: '-3.00',
          displayLevel: 'ITEM' as const,
          discountTarget: 'PRODUCT',
        },
        {
          label: '促销',
          isRecurring: false,
          promotionId: 'P-PROMO',
          promotionCode: '',
          amount: '-2.00',
          displayLevel: 'ITEM' as const,
          discountTarget: 'PRODUCT',
        },
      ],
      purchaseType: 0 as const,
      Autoship: {
        subscriptionFrequency: { frequency: 4, unit: 'WEEK' as const },
        subscriptionAdjustments: [],
        source: 'CHECKOUT' as const,
      },
    },
    {
      itemId: 'ci-301',
      quantity: 1,
      originalPrice: '0.00',
      finalPrice: '0.00',
      totalItemPrice: '0.00',
      totalItemDiscount: '0.00',
      availableQuantity: 10,
      sku: { ...skuFreshChicken },
      discountDetails: [
        {
          label: '首购优惠',
          isRecurring: false,
          promotionId: 'P-FIRST',
          promotionCode: '',
          amount: '-3.00',
          displayLevel: 'ITEM' as const,
          discountTarget: 'PRODUCT',
        },
      ],
      purchaseType: 0 as const,
      Autoship: {
        subscriptionFrequency: { frequency: 4, unit: 'WEEK' as const },
        subscriptionAdjustments: [],
        source: 'CHECKOUT' as const,
      },
    },
  ]

  const orderPreview: any = {
    id: '1',
    subscriptionDiscount: {
      subscriptionDiscountRate: '0',
      subscriptionDiscount: '0.00',
      firstSubscription: false,
    },
    totalItemQuantity: 0,
    subtotal: '0.00',
    grandTotal: '0.00',
    shippingFee: '0.00',
    freeShippingThreshold: '49.00',
    freeShippingEligibleAmount: '0.00',
    totalDiscount: '0.00',
    discountDetails: [],
    recommendedAutoships: [],
    items: items1,
  }

  // --- Cart items (mirrors checkout items, adds cart-specific fields) ---
  const cartItems: any[] = [
    {
      itemId: 'ci-101',
      quantity: 2,
      originalPrice: '0.00',
      finalPrice: '0.00',
      totalItemPrice: '0.00',
      totalItemDiscount: '0.00',
      availableQuantity: 99,
      addedPrice: '199.90',
      sku: { ...skuDogFood },
      discountDetails: [
        {
          label: '官方直降',
          isRecurring: false,
          promotionId: 'P-DIRECT',
          promotionCode: '',
          amount: '-16.60',
          displayLevel: 'ITEM' as const,
          discountTarget: 'PRODUCT',
        },
        {
          label: '促销',
          isRecurring: false,
          promotionId: 'P-PROMO',
          promotionCode: '',
          amount: '-20.00',
          displayLevel: 'ITEM' as const,
          discountTarget: 'PRODUCT',
        },
        {
          label: 'Plus会员',
          isRecurring: false,
          promotionId: 'P-PLUS',
          promotionCode: '',
          amount: '-2.00',
          displayLevel: 'ITEM' as const,
          discountTarget: 'PRODUCT',
        },
        {
          label: '首购优惠',
          isRecurring: false,
          promotionId: 'P-FIRST',
          promotionCode: '',
          amount: '-3.00',
          displayLevel: 'ITEM' as const,
          discountTarget: 'PRODUCT',
        },
      ],
      selected: true,
      isEffective: true,
      purchaseType: 0 as const,
    },
    {
      itemId: 'ci-201',
      quantity: 1,
      originalPrice: '0.00',
      finalPrice: '0.00',
      totalItemPrice: '0.00',
      totalItemDiscount: '0.00',
      availableQuantity: 50,
      addedPrice: '89.90',
      sku: { ...skuCatScratcher },
      discountDetails: [
        {
          label: '官方直降',
          isRecurring: false,
          promotionId: 'P-DIRECT',
          promotionCode: '',
          amount: '-3.00',
          displayLevel: 'ITEM' as const,
          discountTarget: 'PRODUCT',
        },
        {
          label: '促销',
          isRecurring: false,
          promotionId: 'P-PROMO',
          promotionCode: '',
          amount: '-2.00',
          displayLevel: 'ITEM' as const,
          discountTarget: 'PRODUCT',
        },
      ],
      selected: true,
      isEffective: true,
      purchaseType: 0 as const,
    },
    {
      itemId: 'ci-301',
      quantity: 1,
      originalPrice: '0.00',
      finalPrice: '0.00',
      totalItemPrice: '0.00',
      totalItemDiscount: '0.00',
      availableQuantity: 10,
      addedPrice: '29.90',
      sku: { ...skuFreshChicken },
      discountDetails: [
        {
          label: '首购优惠',
          isRecurring: false,
          promotionId: 'P-FIRST',
          promotionCode: '',
          amount: '-3.00',
          displayLevel: 'ITEM' as const,
          discountTarget: 'PRODUCT',
        },
      ],
      selected: true,
      isEffective: true,
      purchaseType: 0 as const,
    },
  ]

  const cart: any = {
    uid: 'USER-001',
    cartId: 'CART-001',
    totalItemQuantity: 0,
    subtotal: '0.00',
    grandTotal: '0.00',
    shippingFee: '0.00',
    freeShippingThreshold: '49.00',
    freeShippingEligibleAmount: '0.00',
    totalDiscount: '0.00',
    discountDetails: [],
    items: cartItems,
  }

  previews['1'] = computePreview(orderPreview)
  globalCart = computeCart(cart)
  console.log('server init cart', globalCart)
  console.log('server init preview', previews['1'])
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
    totalAmount: '120.00',
    discountAmount: '10.00',
    shippingFee: '0.00',
    payAmount: '110.00',
    discountDetails: [
      {
        discountId: 'D001',
        discountType: 1,
        sourceId: 'COUPON-001',
        sourceName: '新人优惠券',
        discountAmount: '10.00',
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
        unitPrice: '60.00',
        quantity: 2,
        discountAmount: '10.00',
        actualAmount: '110.00',
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
    totalAmount: '30.00',
    discountAmount: '0.00',
    shippingFee: '5.00',
    payAmount: '35.00',
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
        unitPrice: '30.00',
        quantity: 1,
        discountAmount: '0.00',
        actualAmount: '30.00',
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
    totalAmount: '180.00',
    discountAmount: '20.00',
    shippingFee: '0.00',
    payAmount: '160.00',
    discountDetails: [
      {
        discountId: 'D002',
        discountType: 2,
        sourceId: 'PROMO-001',
        sourceName: '满100减20',
        discountAmount: '20.00',
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
        unitPrice: '60.00',
        quantity: 3,
        discountAmount: '20.00',
        actualAmount: '160.00',
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
            traceId: 'T005',
            traceTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            traceState: ShipmentState.DELIVERING,
            traceStatus: '派送中',
            traceDesc:
              '【吉林省延边州敦化市黄泥河分部】的刘雪莹（15526759668）正在派件（有事先呼我，勿找...展开）',
            location: '吉林省延边州敦化市',
          },
          {
            traceId: 'T004',
            traceTime: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
            traceState: ShipmentState.IN_TRANSIT,
            traceStatus: '运输中',
            traceDesc: '吉林省延边州敦化市黄泥河分部 已收入',
            location: '吉林省延边州敦化市',
          },
          {
            traceId: 'T003',
            traceTime: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
            traceState: ShipmentState.IN_TRANSIT,
            traceDesc:
              '您的快件已经到达【吉林省延边朝鲜族自治州敦化市】【物流问题无需找商家或平台，请致电...展开】',
            location: '吉林省延边朝鲜族自治州敦化市',
          },
          {
            traceId: 'T002',
            traceTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            traceState: ShipmentState.IN_TRANSIT,
            traceDesc: '您的快件离开【长春转运中心】，已发往【吉林省延边朝鲜族自治州敦化市】',
            location: '长春转运中心',
          },
          {
            traceId: 'T001',
            traceTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            traceState: ShipmentState.COLLECTED,
            traceStatus: '已揽件',
            traceDesc:
              '您的快件在【湖南省长沙市雨花区新塘坡】已揽收，揽收人：邹勇（18570604686）【物流问题无需找...展开】',
            location: '湖南省长沙市雨花区',
          },
          {
            traceId: 'T000',
            traceTime: new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
            traceState: ShipmentState.CREATED,
            traceStatus: '已下单',
            traceDesc: '商品已经下单',
            location: '',
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
    totalAmount: '60.00',
    discountAmount: '0.00',
    shippingFee: '0.00',
    payAmount: '60.00',
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
        unitPrice: '60.00',
        quantity: 1,
        discountAmount: '0.00',
        actualAmount: '60.00',
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

  // 订单5: 组合商品订单 (showChildren=true)
  const order5: OrderDetail = {
    orderId: 'ORDER-005',
    userId: 'USER-001',
    orderState: OrderState.COMPLETED,
    payChannel: 2,
    payType: 1,
    payTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    totalItemQuantity: 1,
    totalAmount: '199.00',
    discountAmount: '0.00',
    shippingFee: '0.00',
    payAmount: '199.00',
    discountDetails: [],
    shippingAddress: mockAddress,
    items: [
      {
        itemId: 'ITEM-005',
        orderId: 'ORDER-005',
        itemType: ItemType.BUNDLE,
        itemState: OrderItemState.RECEIVED,
        skuId: 'SKU-BUNDLE-001',
        productId: 'PROD-BUNDLE-001',
        productName: '宠物礼包套装',
        skuAttrs: '豪华版',
        productImage: 'https://placehold.co/160x160?text=GiftBox',
        unitPrice: '199.00',
        quantity: 1,
        discountAmount: '0.00',
        actualAmount: '199.00',
        discountDetails: [],
        showChildren: true,
        children: [
          {
            itemId: 'ITEM-005-1',
            orderId: 'ORDER-005',
            parentItemId: 'ITEM-005',
            itemType: ItemType.BUNDLE_CHILD,
            itemState: OrderItemState.RECEIVED,
            skuId: 'SKU-CHILD-001',
            productId: 'PROD-001',
            productName: '狗粮',
            skuAttrs: '500g',
            productImage: 'https://placehold.co/100x100?text=DogFood',
            unitPrice: '0.00',
            quantity: 2,
            discountAmount: '0.00',
            actualAmount: '0.00',
            discountDetails: [],
          },
          {
            itemId: 'ITEM-005-2',
            orderId: 'ORDER-005',
            parentItemId: 'ITEM-005',
            itemType: ItemType.BUNDLE_CHILD,
            itemState: OrderItemState.RECEIVED,
            skuId: 'SKU-CHILD-002',
            productId: 'PROD-002',
            productName: '宠物玩具',
            skuAttrs: '小号',
            productImage: 'https://placehold.co/100x100?text=Toy',
            unitPrice: '0.00',
            quantity: 1,
            discountAmount: '0.00',
            actualAmount: '0.00',
            discountDetails: [],
          },
          {
            itemId: 'ITEM-005-3',
            orderId: 'ORDER-005',
            parentItemId: 'ITEM-005',
            itemType: ItemType.BUNDLE_CHILD,
            itemState: OrderItemState.RECEIVED,
            skuId: 'SKU-CHILD-003',
            productId: 'PROD-003',
            productName: '宠物零食',
            skuAttrs: '混合口味',
            productImage: 'https://placehold.co/100x100?text=Snack',
            unitPrice: '0.00',
            quantity: 3,
            discountAmount: '0.00',
            actualAmount: '0.00',
            discountDetails: [],
          },
        ],
      },
    ],
    createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  }

  // 订单6: 盲盒订单 - 待收货 (不显示子SKU)
  const order6: OrderDetail = {
    orderId: 'ORDER-006',
    userId: 'USER-001',
    orderState: OrderState.SHIPPED,
    payChannel: 2,
    payType: 1,
    payTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    totalItemQuantity: 1,
    totalAmount: '99.00',
    discountAmount: '0.00',
    shippingFee: '0.00',
    payAmount: '99.00',
    discountDetails: [],
    shippingAddress: mockAddress,
    items: [
      {
        itemId: 'ITEM-006',
        orderId: 'ORDER-006',
        itemType: ItemType.MYSTERY_BOX,
        itemState: OrderItemState.SHIPPED,
        skuId: 'SKU-MYSTERY-001',
        productId: 'PROD-MYSTERY-001',
        productName: '宠物盲盒福袋',
        skuAttrs: '惊喜款',
        productImage: 'https://placehold.co/160x160?text=MysteryBox',
        unitPrice: '99.00',
        quantity: 1,
        discountAmount: '0.00',
        actualAmount: '99.00',
        discountDetails: [],
        isMysteryBox: true,
        mysteryBoxOpened: false,
        showChildren: true,
        children: [
          {
            itemId: 'ITEM-006-1',
            orderId: 'ORDER-006',
            parentItemId: 'ITEM-006',
            itemType: ItemType.BUNDLE_CHILD,
            itemState: OrderItemState.SHIPPED,
            skuId: 'SKU-SECRET-001',
            productId: 'PROD-SECRET-001',
            productName: '神秘猫粮',
            skuAttrs: '1kg',
            productImage: 'https://placehold.co/100x100?text=CatFood',
            unitPrice: '0.00',
            quantity: 1,
            discountAmount: '0.00',
            actualAmount: '0.00',
            discountDetails: [],
          },
          {
            itemId: 'ITEM-006-2',
            orderId: 'ORDER-006',
            parentItemId: 'ITEM-006',
            itemType: ItemType.BUNDLE_CHILD,
            itemState: OrderItemState.SHIPPED,
            skuId: 'SKU-SECRET-002',
            productId: 'PROD-SECRET-002',
            productName: '限定版猫窝',
            skuAttrs: '粉色',
            productImage: 'https://placehold.co/100x100?text=CatBed',
            unitPrice: '0.00',
            quantity: 1,
            discountAmount: '0.00',
            actualAmount: '0.00',
            discountDetails: [],
          },
        ],
      },
    ],
    shipments: [
      {
        shipmentId: 'SHIP-006',
        orderId: 'ORDER-006',
        carrierCode: 'SF',
        carrierName: '顺丰速运',
        trackingNo: 'SF9999888877',
        shipmentState: ShipmentState.DELIVERING,
        shippedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            orderItemId: 'ITEM-006',
            productName: '宠物盲盒福袋',
            productImage: 'https://placehold.co/160x160?text=MysteryBox',
            skuAttrs: '惊喜款',
            quantity: 1,
          },
        ],
        traces: [],
      },
    ],
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
  }

  // 订单7: 盲盒订单 - 已完成未拆开 (可拆盲盒)
  const order7: OrderDetail = {
    orderId: 'ORDER-007',
    userId: 'USER-001',
    orderState: OrderState.COMPLETED,
    payChannel: 1,
    payType: 1,
    payTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    totalItemQuantity: 1,
    totalAmount: '149.00',
    discountAmount: '0.00',
    shippingFee: '0.00',
    payAmount: '149.00',
    discountDetails: [],
    shippingAddress: mockAddress,
    items: [
      {
        itemId: 'ITEM-007',
        orderId: 'ORDER-007',
        itemType: ItemType.MYSTERY_BOX,
        itemState: OrderItemState.RECEIVED,
        skuId: 'SKU-MYSTERY-002',
        productId: 'PROD-MYSTERY-002',
        productName: '豪华宠物盲盒',
        skuAttrs: '限量版',
        productImage: 'https://placehold.co/160x160?text=LuxuryBox',
        unitPrice: '149.00',
        quantity: 1,
        discountAmount: '0.00',
        actualAmount: '149.00',
        discountDetails: [],
        isMysteryBox: true,
        mysteryBoxOpened: false,
        showChildren: true,
        children: [
          {
            itemId: 'ITEM-007-1',
            orderId: 'ORDER-007',
            parentItemId: 'ITEM-007',
            itemType: ItemType.BUNDLE_CHILD,
            itemState: OrderItemState.RECEIVED,
            skuId: 'SKU-LUXURY-001',
            productId: 'PROD-LUXURY-001',
            productName: '进口狗粮',
            skuAttrs: '2kg装',
            productImage: 'https://placehold.co/100x100?text=PremiumFood',
            unitPrice: '0.00',
            quantity: 1,
            discountAmount: '0.00',
            actualAmount: '0.00',
            discountDetails: [],
          },
          {
            itemId: 'ITEM-007-2',
            orderId: 'ORDER-007',
            parentItemId: 'ITEM-007',
            itemType: ItemType.BUNDLE_CHILD,
            itemState: OrderItemState.RECEIVED,
            skuId: 'SKU-LUXURY-002',
            productId: 'PROD-LUXURY-002',
            productName: '智能饮水机',
            skuAttrs: '白色',
            productImage: 'https://placehold.co/100x100?text=Fountain',
            unitPrice: '0.00',
            quantity: 1,
            discountAmount: '0.00',
            actualAmount: '0.00',
            discountDetails: [],
          },
          {
            itemId: 'ITEM-007-3',
            orderId: 'ORDER-007',
            parentItemId: 'ITEM-007',
            itemType: ItemType.BUNDLE_CHILD,
            itemState: OrderItemState.RECEIVED,
            skuId: 'SKU-LUXURY-003',
            productId: 'PROD-LUXURY-003',
            productName: '宠物梳子',
            skuAttrs: '不锈钢',
            productImage: 'https://placehold.co/100x100?text=Brush',
            unitPrice: '0.00',
            quantity: 2,
            discountAmount: '0.00',
            actualAmount: '0.00',
            discountDetails: [],
          },
        ],
      },
    ],
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  }

  // 订单8: 盲盒订单 - 已完成已拆开
  const order8: OrderDetail = {
    orderId: 'ORDER-008',
    userId: 'USER-001',
    orderState: OrderState.COMPLETED,
    payChannel: 2,
    payType: 1,
    payTime: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    totalItemQuantity: 1,
    totalAmount: '129.00',
    discountAmount: '0.00',
    shippingFee: '0.00',
    payAmount: '129.00',
    discountDetails: [],
    shippingAddress: mockAddress,
    items: [
      {
        itemId: 'ITEM-008',
        orderId: 'ORDER-008',
        itemType: ItemType.MYSTERY_BOX,
        itemState: OrderItemState.RECEIVED,
        skuId: 'SKU-MYSTERY-003',
        productId: 'PROD-MYSTERY-003',
        productName: '宠物惊喜盲盒',
        skuAttrs: '标准版',
        productImage: 'https://placehold.co/160x160?text=SurpriseBox',
        unitPrice: '129.00',
        quantity: 1,
        discountAmount: '0.00',
        actualAmount: '129.00',
        discountDetails: [],
        isMysteryBox: true,
        mysteryBoxOpened: true,
        showChildren: true,
        children: [
          {
            itemId: 'ITEM-008-1',
            orderId: 'ORDER-008',
            parentItemId: 'ITEM-008',
            itemType: ItemType.BUNDLE_CHILD,
            itemState: OrderItemState.RECEIVED,
            skuId: 'SKU-SURPRISE-001',
            productId: 'PROD-SURPRISE-001',
            productName: '猫咪逗猫棒',
            skuAttrs: '羽毛款',
            productImage: 'https://placehold.co/100x100?text=CatToy',
            unitPrice: '0.00',
            quantity: 1,
            discountAmount: '0.00',
            actualAmount: '0.00',
            discountDetails: [],
          },
          {
            itemId: 'ITEM-008-2',
            orderId: 'ORDER-008',
            parentItemId: 'ITEM-008',
            itemType: ItemType.BUNDLE_CHILD,
            itemState: OrderItemState.RECEIVED,
            skuId: 'SKU-SURPRISE-002',
            productId: 'PROD-SURPRISE-002',
            productName: '宠物牵引绳',
            skuAttrs: '蓝色1.5m',
            productImage: 'https://placehold.co/100x100?text=Leash',
            unitPrice: '0.00',
            quantity: 1,
            discountAmount: '0.00',
            actualAmount: '0.00',
            discountDetails: [],
          },
        ],
      },
    ],
    createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  }

  // 订单9: 多SKU订单 - 测试垂直展示
  const order9: OrderDetail = {
    orderId: 'ORDER-009',
    userId: 'USER-001',
    orderState: OrderState.PAID,
    payChannel: 2,
    payType: 1,
    payTime: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    totalItemQuantity: 5,
    totalAmount: '350.00',
    discountAmount: '30.00',
    shippingFee: '0.00',
    payAmount: '320.00',
    discountDetails: [
      {
        discountId: 'D009',
        discountType: 2,
        sourceId: 'PROMO-009',
        sourceName: '满300减30',
        discountAmount: '30.00',
      },
    ],
    shippingAddress: mockAddress,
    items: [
      {
        itemId: 'ITEM-009-1',
        orderId: 'ORDER-009',
        itemType: ItemType.NORMAL,
        itemState: OrderItemState.NORMAL,
        skuId: 'SKU-009-1',
        productId: 'PROD-009-1',
        productName: '【优惠价】比乐狗粮守护者Pro鸭肉梨口味',
        skuAttrs: '鸭肉梨口味;冻干鲜肉升级版2.0;1kg',
        productImage: 'https://placehold.co/180x180?text=DogFood',
        unitPrice: '159.00',
        quantity: 1,
        discountAmount: '10.00',
        actualAmount: '149.00',
        discountDetails: [],
      },
      {
        itemId: 'ITEM-009-2',
        orderId: 'ORDER-009',
        itemType: ItemType.NORMAL,
        itemState: OrderItemState.NORMAL,
        skuId: 'SKU-009-2',
        productId: 'PROD-009-2',
        productName: '【天猫U先】比乐pro犬粮护肠冻干',
        skuAttrs: '鸭肉梨口味;200g',
        productImage: 'https://placehold.co/180x180?text=DogSnack',
        unitPrice: '39.00',
        quantity: 2,
        discountAmount: '10.00',
        actualAmount: '68.00',
        discountDetails: [],
      },
      {
        itemId: 'ITEM-009-3',
        orderId: 'ORDER-009',
        itemType: ItemType.NORMAL,
        itemState: OrderItemState.NORMAL,
        skuId: 'SKU-009-3',
        productId: 'PROD-009-3',
        productName: '【U先试用】比乐狗粮守护者Pro鸭肉梨升级幼犬',
        skuAttrs: '守护者Pro鸭肉梨;50g',
        productImage: 'https://placehold.co/180x180?text=Puppy',
        unitPrice: '19.00',
        quantity: 1,
        discountAmount: '5.00',
        actualAmount: '14.00',
        discountDetails: [],
      },
      {
        itemId: 'ITEM-009-4',
        orderId: 'ORDER-009',
        itemType: ItemType.NORMAL,
        itemState: OrderItemState.NORMAL,
        skuId: 'SKU-009-4',
        productId: 'PROD-009-4',
        productName: '宠物智能饮水机滤芯替换装',
        skuAttrs: '3只装',
        productImage: 'https://placehold.co/180x180?text=Filter',
        unitPrice: '89.00',
        quantity: 1,
        discountAmount: '5.00',
        actualAmount: '84.00',
        discountDetails: [],
      },
    ],
    createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
  }

  // 将订单添加到存储
  orders.set(order1.orderId, order1)
  orders.set(order2.orderId, order2)
  orders.set(order3.orderId, order3)
  orders.set(order4.orderId, order4)
  orders.set(order5.orderId, order5)
  orders.set(order6.orderId, order6)
  orders.set(order7.orderId, order7)
  orders.set(order8.orderId, order8)
  orders.set(order9.orderId, order9)

  // 生成更多订单用于分页测试
  const states = [
    OrderState.PENDING,
    OrderState.PAID,
    OrderState.SHIPPED,
    OrderState.COMPLETED,
    OrderState.CANCELLED,
  ]
  const productNames = [
    '优质猫粮',
    '狗狗零食',
    '宠物玩具',
    '猫砂',
    '宠物洗浴用品',
    '营养膏',
    '驱虫药',
    '宠物窝',
  ]
  const productImages = [
    'https://placehold.co/160x160?text=CatFood',
    'https://placehold.co/160x160?text=DogSnack',
    'https://placehold.co/160x160?text=Toy',
    'https://placehold.co/160x160?text=CatLitter',
    'https://placehold.co/160x160?text=Shampoo',
  ]

  for (let i = 10; i <= 30; i++) {
    const state = states[(i - 10) % states.length]
    const productIndex = i % productNames.length
    const imageIndex = i % productImages.length
    const quantity = (i % 3) + 1
    const unitPrice = 30 + (i % 10) * 10

    const orderN: OrderDetail = {
      orderId: `ORDER-${String(i).padStart(3, '0')}`,
      userId: 'USER-001',
      orderState: state,
      payChannel: ((i % 2) + 1) as 1 | 2,
      payType: 1,
      payTime:
        state !== OrderState.PENDING
          ? new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
      totalItemQuantity: quantity,
      totalAmount: (unitPrice * quantity).toFixed(2),
      discountAmount: (i % 5 === 0 ? 10 : 0).toFixed(2),
      shippingFee: '0.00',
      payAmount: (unitPrice * quantity - (i % 5 === 0 ? 10 : 0)).toFixed(2),
      discountDetails: [],
      shippingAddress: mockAddress,
      items: [
        {
          itemId: `ITEM-${String(i).padStart(3, '0')}`,
          orderId: `ORDER-${String(i).padStart(3, '0')}`,
          itemType: ItemType.NORMAL,
          itemState:
            state === OrderState.COMPLETED
              ? OrderItemState.RECEIVED
              : state === OrderState.SHIPPED
              ? OrderItemState.SHIPPED
              : OrderItemState.NORMAL,
          skuId: `SKU-${String(i).padStart(3, '0')}`,
          productId: `PROD-${String(productIndex).padStart(3, '0')}`,
          productName: productNames[productIndex],
          skuAttrs: `规格:${i % 2 === 0 ? '大包装' : '小包装'}`,
          productImage: productImages[imageIndex],
          unitPrice: unitPrice.toFixed(2),
          quantity,
          discountAmount: (i % 5 === 0 ? 10 : 0).toFixed(2),
          actualAmount: (unitPrice * quantity - (i % 5 === 0 ? 10 : 0)).toFixed(2),
          discountDetails: [],
        },
      ],
      shipments: [],
      createdAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - (i - 1) * 24 * 60 * 60 * 1000).toISOString(),
      countdown: state === OrderState.PENDING ? 1800 + i * 60 : undefined,
    }
    orders.set(orderN.orderId, orderN)
  }

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

  // --- Cart APIs (/account/carts) ---

  // GET /account/cart - 获取购物车 (Legacy or for current user context)
  if (url === '/account/cart' && String(options.method || 'GET').toUpperCase() === 'GET') {
    return { code: '0', msg: 'ok', result: clone(globalCart) }
  }

  // POST /account/carts/{cartId}/items - 添加商品
  const addItemMatch = url.match(/^\/account\/carts\/([^/]+)\/items$/)
  if (addItemMatch && String(options.method || 'POST').toUpperCase() === 'POST') {
    const cartId = addItemMatch[1] // 暂时忽略 cartId 校验
    const data = (options.data as any) || {}
    // data: { productId, skuId, quantity, purchaseType }
    // 简单实现：检查是否已存在，存在则加数量，不存在则创建
    // 注意：需配合 product 数据，这里简化为直接查找是否有相同 skuId 的 item
    // 因为前端传的是 productId/skuId，我们需要找到对应的 ItemId（如果是已存在的）
    // 或者生成新的 ItemId
    // ... Mock logic to simulate adding ...
    // 为演示，这里仅返回成功，不做实际添加逻辑(太复杂且依赖 Product)，或者简单 Mock 一个
    return { code: '0', msg: '添加成功', result: clone(globalCart) }
  }

  // POST /account/carts/{cartId}/items:batchDelete - 批量删除
  const batchDeleteMatch = url.match(/^\/account\/carts\/([^/]+)\/items:batchDelete$/)
  if (batchDeleteMatch && String(options.method || 'POST').toUpperCase() === 'POST') {
    const data = (options.data as any) || {}
    const ids = data.itemIds || []
    if (globalCart && globalCart.items) {
      globalCart.items = globalCart.items.filter((item: CartItem) => !ids.includes(item.itemId))
      globalCart = computeCart(globalCart)
    }
    return { code: '0', msg: 'deleted', result: clone(globalCart) }
  }

  // PUT /account/carts/{cartId}/items/{itemId} - 更新商品
  const updateItemMatch = url.match(/^\/account\/carts\/([^/]+)\/items\/([^/]+)$/)
  if (updateItemMatch && String(options.method || 'PUT').toUpperCase() === 'PUT') {
    const itemId = updateItemMatch[2]
    const body = (options.data as any) || {}
    const idx = globalCart.items.findIndex((item: CartItem) => item.itemId === itemId)
    if (idx !== -1) {
      if (body.quantity !== undefined) {
        const max = globalCart.items[idx].sku.maxQuantity || 99
        globalCart.items[idx].quantity = Math.min(body.quantity, max)
      }
      if (body.purchaseType !== undefined) globalCart.items[idx].purchaseType = body.purchaseType
      if (body.selected !== undefined) globalCart.items[idx].selected = body.selected
      globalCart = computeCart(globalCart)
      return { code: '0', msg: 'updated', result: clone(globalCart) }
    }
    return { code: '1', msg: 'not found', result: null }
  }

  // POST /account/carts/{cartId}/items:updateSelection - 全选/取消全选
  const updateSelectionMatch = url.match(/^\/account\/carts\/([^/]+)\/items:updateSelection$/)
  if (updateSelectionMatch && String(options.method || 'POST').toUpperCase() === 'POST') {
    const body = (options.data as any) || {}
    const selected = !!body.selected
    if (globalCart && globalCart.items) {
      globalCart.items.forEach((item: CartItem) => (item.selected = selected))
      globalCart = computeCart(globalCart)
    }
    return { code: '0', msg: 'ok', result: clone(globalCart) }
  }

  // --- Checkout Entry from Cart ---
  if (
    url.match(/^\/checkout\/entry\/cart/) &&
    String(options.method || 'GET').toUpperCase() === 'GET'
  ) {
    // 从购物车选中商品生成 OrderPreview
    const selectedItems = (globalCart.items || []).filter((ci: CartItem) => ci.selected)
    const previewItems: any[] = selectedItems.map((ci: any) => {
      const sku = clone(ci.sku)
      return {
        itemId: ci.itemId,
        quantity: ci.quantity,
        originalPrice: '0.00',
        finalPrice: '0.00',
        totalItemPrice: '0.00',
        totalItemDiscount: '0.00',
        availableQuantity: ci.availableQuantity || 99,
        sku: sku,
        discountDetails: clone(ci.discountDetails || []),
        purchaseType: ci.purchaseType,
        Autoship: {
          subscriptionFrequency: { frequency: 4, unit: 'WEEK' as const },
          subscriptionAdjustments: [],
          source: 'CHECKOUT' as const,
        },
      }
    })
    const newPreviewId = 'P-' + Date.now()
    const newPreview: any = {
      id: newPreviewId,
      subscriptionDiscount: {
        subscriptionDiscountRate: '0',
        subscriptionDiscount: '0.00',
        firstSubscription: false,
      },
      totalItemQuantity: 0,
      subtotal: '0.00',
      grandTotal: '0.00',
      shippingFee: '0.00',
      freeShippingThreshold: '49.00',
      freeShippingEligibleAmount: '0.00',
      totalDiscount: '0.00',
      discountDetails: [],
      recommendedAutoships: [
        {
          subscriptionFrequency: { frequency: 2, unit: 'WEEK' },
          subscriptionAdjustments: [],
          source: 'recommend',
        },
        {
          subscriptionFrequency: { frequency: 4, unit: 'WEEK' },
          subscriptionAdjustments: [],
          source: 'recommend',
        },
        {
          subscriptionFrequency: { frequency: 8, unit: 'WEEK' },
          subscriptionAdjustments: [],
          source: 'recommend',
        },
      ],
      items: previewItems,
    }
    previews[newPreviewId] = computePreview(newPreview)
    return { code: '0', msg: 'ok', result: { previewId: newPreviewId } }
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
            String(it.itemId) === String(sel.itemId) ||
            String(it.sku?.skuId) === String(sel.partNumber),
        )
        if (idx !== -1) {
          if (sel.quantity !== undefined) {
            const max = items[idx].sku.maxQuantity || 99
            items[idx].quantity = Math.min(Number(sel.quantity), max)
          }
          if (sel.purchaseType !== undefined)
            items[idx].purchaseType = sel.purchaseType === 1 ? 1 : 0
        }
      } else if (updateField === 'GLOBALSUBSCRIPTION' && body.globalSubscription) {
        const items = previews[previewId].items || []
        const oldIsSubscribe = items.some((it: Item) => it.purchaseType === 1)
        const freq = body.globalSubscription.fulfillmentSchedule || { frequency: 4, unit: 'WEEK' }

        if (oldIsSubscribe === body.globalSubscription.subscribe && oldIsSubscribe) {
          items.forEach((it: Item) => {
            if (it.sku?.supportsSubscription) {
              it.Autoship = it.Autoship || {
                subscriptionFrequency: freq,
                subscriptionAdjustments: [],
                source: 'CHECKOUT',
              }
              it.Autoship.subscriptionFrequency = freq
            }
          })
        }

        if (
          oldIsSubscribe !== body.globalSubscription.subscribe &&
          body.globalSubscription.subscribe
        ) {
          items.forEach((it: Item) => {
            if (it.sku?.supportsSubscription) {
              it.purchaseType = 1
              it.Autoship = it.Autoship || {
                subscriptionFrequency: freq,
                subscriptionAdjustments: [],
                source: 'CHECKOUT',
              }
              it.Autoship.subscriptionFrequency = freq
            }
          })
        }
        if (
          oldIsSubscribe !== body.globalSubscription.subscribe &&
          !body.globalSubscription.subscribe
        ) {
          items.forEach((it: Item) => {
            if (it.sku?.supportsSubscription) {
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

  // --- Pet Enum Data ---
  const petEnumsData: Record<string, PetEnums> = {
    dog: {
      breeds: [
        { id: 'breed_d1', name: '金毛寻回犬' },
        { id: 'breed_d2', name: '拉布拉多' },
        { id: 'breed_d3', name: '柴犬' },
        { id: 'breed_d4', name: '边境牧羊犬' },
        { id: 'breed_d5', name: '萨摩耶' },
        { id: 'breed_d6', name: '哈士奇' },
        { id: 'breed_d7', name: '泰迪' },
        { id: 'breed_d8', name: '柯基' },
        { id: 'breed_d9', name: '德国牧羊犬' },
        { id: 'breed_d10', name: '其他' },
      ],
      foodAllergens: [
        { id: 'fa_d1', name: '鸡肉' },
        { id: 'fa_d2', name: '牛肉' },
        { id: 'fa_d3', name: '羊肉' },
        { id: 'fa_d4', name: '小麦' },
        { id: 'fa_d5', name: '玉米' },
        { id: 'fa_d6', name: '大豆' },
        { id: 'fa_d7', name: '乳制品' },
        { id: 'fa_d8', name: '鸡蛋' },
      ],
      medications: [
        { id: 'med_d1', name: '体内驱虫药' },
        { id: 'med_d2', name: '体外驱虫药' },
        { id: 'med_d3', name: '抗生素' },
        { id: 'med_d4', name: '消炎药' },
        { id: 'med_d5', name: '关节保健品' },
        { id: 'med_d6', name: '心脏病药物' },
        { id: 'med_d7', name: '皮肤病药物' },
      ],
      drugAllergens: [
        { id: 'da_d1', name: '青霉素类' },
        { id: 'da_d2', name: '磺胺类' },
        { id: 'da_d3', name: '阿司匹林' },
        { id: 'da_d4', name: '布洛芬' },
      ],
      healthIssues: [
        { id: 'hi_d1', name: '关节炎' },
        { id: 'hi_d2', name: '肥胖' },
        { id: 'hi_d3', name: '心脏病' },
        { id: 'hi_d4', name: '皮肤病' },
        { id: 'hi_d5', name: '肠胃问题' },
        { id: 'hi_d6', name: '癫痫' },
        { id: 'hi_d7', name: '糖尿病' },
        { id: 'hi_d8', name: '肝脏问题' },
      ],
    },
    cat: {
      breeds: [
        { id: 'breed_c1', name: '英国短毛猫' },
        { id: 'breed_c2', name: '美国短毛猫' },
        { id: 'breed_c3', name: '布偶猫' },
        { id: 'breed_c4', name: '波斯猫' },
        { id: 'breed_c5', name: '暹罗猫' },
        { id: 'breed_c6', name: '缅因猫' },
        { id: 'breed_c7', name: '橘猫' },
        { id: 'breed_c8', name: '狸花猫' },
        { id: 'breed_c9', name: '折耳猫' },
        { id: 'breed_c10', name: '其他' },
      ],
      foodAllergens: [
        { id: 'fa_c1', name: '鱼类' },
        { id: 'fa_c2', name: '牛肉' },
        { id: 'fa_c3', name: '乳制品' },
        { id: 'fa_c4', name: '小麦' },
        { id: 'fa_c5', name: '玉米' },
        { id: 'fa_c6', name: '鸡蛋' },
      ],
      medications: [
        { id: 'med_c1', name: '体内驱虫药' },
        { id: 'med_c2', name: '体外驱虫药' },
        { id: 'med_c3', name: '抗生素' },
        { id: 'med_c4', name: '消炎药' },
        { id: 'med_c5', name: '泌尿系统药物' },
        { id: 'med_c6', name: '甲状腺药物' },
      ],
      drugAllergens: [
        { id: 'da_c1', name: '青霉素类' },
        { id: 'da_c2', name: '磺胺类' },
        { id: 'da_c3', name: '阿莫西林' },
      ],
      healthIssues: [
        { id: 'hi_c1', name: '泌尿问题' },
        { id: 'hi_c2', name: '肥胖' },
        { id: 'hi_c3', name: '肾脏问题' },
        { id: 'hi_c4', name: '甲状腺问题' },
        { id: 'hi_c5', name: '口腔问题' },
        { id: 'hi_c6', name: '糖尿病' },
        { id: 'hi_c7', name: '皮肤病' },
      ],
    },
  }

  // 初始化 Mock 宠物数据
  if (pets.size === 0) {
    const now = new Date()
    const pet1: PetProfile = {
      id: 'pet_001',
      avatar: 'https://placehold.co/200x200/f0ad4e/fff?text=旺财',
      name: '旺财',
      type: 'dog',
      breedId: 'breed_d1',
      breedName: '金毛寻回犬',
      birthday: '2020-03-15',
      gender: 'male',
      neutered: true,
      // 新增字段
      currentWeight: 28,
      idealWeight: 26,
      bodyCondition: 'chubby',
      activityLevel: 'moderate',
      pickyLevel: 'foodie',
      hasFoodAllergies: false,
      foodAllergyIds: [],
      onMedication: true,
      medicationIds: ['med_d1'],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: false,
      healthIssueIds: [],
      sortOrder: 0,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    }
    const pet2: PetProfile = {
      id: 'pet_002',
      avatar: 'https://placehold.co/200x200/5cb85c/fff?text=咪咪',
      name: '咪咪',
      type: 'cat',
      breedId: 'breed_c1',
      breedName: '英国短毛猫',
      birthday: '2021-08-20',
      gender: 'female',
      neutered: true,
      hasFoodAllergies: true,
      foodAllergyIds: ['fa_c1'],
      onMedication: false,
      medicationIds: [],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: false,
      healthIssueIds: [],
      sortOrder: 1,
      createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    }
    const pet3: PetProfile = {
      id: 'pet_003',
      avatar: 'https://placehold.co/200x200/0275d8/fff?text=大黄',
      name: '大黄',
      type: 'dog',
      breedId: 'breed_d3',
      breedName: '柴犬',
      birthday: '2019-06-10',
      gender: 'male',
      neutered: false,
      hasFoodAllergies: false,
      foodAllergyIds: [],
      onMedication: false,
      medicationIds: [],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: false,
      healthIssueIds: [],
      sortOrder: 2,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const pet4: PetProfile = {
      id: 'pet_004',
      avatar: 'https://placehold.co/200x200/d9534f/fff?text=小白',
      name: '小白',
      type: 'cat',
      breedId: 'breed_c3',
      breedName: '布偶猫',
      birthday: '2022-01-05',
      gender: 'female',
      neutered: true,
      hasFoodAllergies: false,
      foodAllergyIds: [],
      onMedication: false,
      medicationIds: [],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: false,
      healthIssueIds: [],
      sortOrder: 3,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const pet5: PetProfile = {
      id: 'pet_005',
      avatar: 'https://placehold.co/200x200/5bc0de/fff?text=豆豆',
      name: '豆豆',
      type: 'dog',
      breedId: 'breed_d7',
      breedName: '泰迪',
      birthday: '2021-11-20',
      gender: 'male',
      neutered: true,
      hasFoodAllergies: true,
      foodAllergyIds: ['fa_d1'],
      onMedication: false,
      medicationIds: [],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: false,
      healthIssueIds: [],
      sortOrder: 4,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const pet6: PetProfile = {
      id: 'pet_006',
      avatar: 'https://placehold.co/200x200/f7a35c/fff?text=橘子',
      name: '橘子',
      type: 'cat',
      breedId: 'breed_c7',
      breedName: '橘猫',
      birthday: '2020-09-15',
      gender: 'male',
      neutered: false,
      hasFoodAllergies: false,
      foodAllergyIds: [],
      onMedication: false,
      medicationIds: [],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: true,
      healthIssueIds: ['hi_c2'],
      sortOrder: 5,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const pet7: PetProfile = {
      id: 'pet_007',
      avatar: 'https://placehold.co/200x200/6f42c1/fff?text=二哈',
      name: '二哈',
      type: 'dog',
      breedId: 'breed_d6',
      breedName: '哈士奇',
      birthday: '2018-04-01',
      gender: 'male',
      neutered: true,
      hasFoodAllergies: false,
      foodAllergyIds: [],
      onMedication: true,
      medicationIds: ['med_d5'],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: true,
      healthIssueIds: ['hi_d1'],
      sortOrder: 6,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const pet8: PetProfile = {
      id: 'pet_008',
      avatar: 'https://placehold.co/200x200/e83e8c/fff?text=花花',
      name: '花花',
      type: 'cat',
      breedId: 'breed_c8',
      breedName: '狸花猫',
      birthday: '2019-12-25',
      gender: 'female',
      neutered: true,
      hasFoodAllergies: false,
      foodAllergyIds: [],
      onMedication: false,
      medicationIds: [],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: false,
      healthIssueIds: [],
      sortOrder: 7,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const pet9: PetProfile = {
      id: 'pet_009',
      avatar: 'https://placehold.co/200x200/20c997/fff?text=毛毛',
      name: '毛毛',
      type: 'dog',
      breedId: 'breed_d5',
      breedName: '萨摩耶',
      birthday: '2020-07-07',
      gender: 'female',
      neutered: false,
      hasFoodAllergies: false,
      foodAllergyIds: [],
      onMedication: false,
      medicationIds: [],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: false,
      healthIssueIds: [],
      sortOrder: 8,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const pet10: PetProfile = {
      id: 'pet_010',
      avatar: 'https://placehold.co/200x200/fd7e14/fff?text=阿福',
      name: '阿福',
      type: 'dog',
      breedId: 'breed_d8',
      breedName: '柯基',
      birthday: '2021-03-18',
      gender: 'male',
      neutered: true,
      hasFoodAllergies: false,
      foodAllergyIds: [],
      onMedication: false,
      medicationIds: [],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: false,
      healthIssueIds: [],
      sortOrder: 9,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    pets.set(pet1.id, pet1)
    pets.set(pet2.id, pet2)
    pets.set(pet3.id, pet3)
    pets.set(pet4.id, pet4)
    pets.set(pet5.id, pet5)
    pets.set(pet6.id, pet6)
    pets.set(pet7.id, pet7)
    pets.set(pet8.id, pet8)
    pets.set(pet9.id, pet9)
    pets.set(pet10.id, pet10)
  }

  // --- Pet APIs (/account/pets) ---

  // GET /account/pets - 获取宠物列表
  if (url.match(/^\/account\/pets$/) && String(options.method || 'GET').toUpperCase() === 'GET') {
    const petList = Array.from(pets.values()).sort((a, b) => a.sortOrder - b.sortOrder)
    return { code: '0', msg: 'ok', result: clone(petList) }
  }

  // GET /account/pets:enums - 获取枚举数据
  if (
    url.match(/^\/account\/pets:enums/) &&
    String(options.method || 'GET').toUpperCase() === 'GET'
  ) {
    const data = (options.data as any) || {}
    const type = data.type || 'dog'
    const enums = petEnumsData[type] || petEnumsData.dog
    return { code: '0', msg: 'ok', result: clone(enums) }
  }

  // POST /account/pets:reorder - 更新排序
  if (
    url.match(/^\/account\/pets:reorder$/) &&
    String(options.method || 'POST').toUpperCase() === 'POST'
  ) {
    const data = (options.data as any) || {}
    const petIds: string[] = data.petIds || []
    petIds.forEach((id, index) => {
      const pet = pets.get(id)
      if (pet) {
        pet.sortOrder = index
        pets.set(id, pet)
      }
    })
    return { code: '0', msg: 'ok', result: { success: true } }
  }

  // GET /account/pets/{petId} - 获取宠物详情
  const petDetailMatch = url.match(/^\/account\/pets\/([^/:]+)$/)
  if (petDetailMatch && String(options.method || 'GET').toUpperCase() === 'GET') {
    const petId = petDetailMatch[1]
    const pet = pets.get(petId)
    if (!pet) return { code: '1', msg: '宠物不存在', result: null }
    return { code: '0', msg: 'ok', result: clone(pet) }
  }

  // POST /account/pets - 创建宠物
  if (url.match(/^\/account\/pets$/) && String(options.method || 'POST').toUpperCase() === 'POST') {
    const data = (options.data as any) || {}
    const now = new Date()
    const newPet: PetProfile = {
      id: `pet_${Date.now()}`,
      avatar: data.avatar || 'https://placehold.co/200x200/999/fff?text=Pet',
      name: data.name || '未命名',
      type: data.type || 'dog',
      breedId: data.breedId || '',
      breedName: '',
      birthday: data.birthday || '',
      gender: data.gender || 'male',
      neutered: data.neutered || false,
      hasFoodAllergies: data.hasFoodAllergies || false,
      foodAllergyIds: data.foodAllergyIds || [],
      onMedication: data.onMedication || false,
      medicationIds: data.medicationIds || [],
      hasDrugAllergies: data.hasDrugAllergies || false,
      drugAllergyIds: data.drugAllergyIds || [],
      hasHealthIssues: data.hasHealthIssues || false,
      healthIssueIds: data.healthIssueIds || [],
      sortOrder: pets.size,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    // 设置品种名称
    const enums = petEnumsData[newPet.type] || petEnumsData.dog
    const breed = enums.breeds.find((b) => b.id === newPet.breedId)
    if (breed) newPet.breedName = breed.name
    pets.set(newPet.id, newPet)
    return { code: '0', msg: 'ok', result: clone(newPet) }
  }

  // PUT /account/pets/{petId} - 更新宠物
  if (petDetailMatch && String(options.method || 'PUT').toUpperCase() === 'PUT') {
    const petId = petDetailMatch[1]
    const pet = pets.get(petId)
    if (!pet) return { code: '1', msg: '宠物不存在', result: null }
    const data = (options.data as any) || {}
    const updatedPet: PetProfile = {
      ...pet,
      ...data,
      id: pet.id,
      sortOrder: pet.sortOrder,
      createdAt: pet.createdAt,
      updatedAt: new Date().toISOString(),
    }
    // 设置品种名称
    const enums = petEnumsData[updatedPet.type] || petEnumsData.dog
    const breed = enums.breeds.find((b) => b.id === updatedPet.breedId)
    if (breed) updatedPet.breedName = breed.name
    pets.set(petId, updatedPet)
    return { code: '0', msg: 'ok', result: clone(updatedPet) }
  }

  // DELETE /account/pets/{petId} - 删除宠物
  if (petDetailMatch && String(options.method || 'DELETE').toUpperCase() === 'DELETE') {
    const petId = petDetailMatch[1]
    if (!pets.has(petId)) return { code: '1', msg: '宠物不存在', result: null }
    pets.delete(petId)
    return { code: '0', msg: 'ok', result: { success: true } }
  }

  // --- Fresh Food Landing Page API ---

  // GET /api/fresh-food/landing - 获取营销落地页数据
  if (
    url.match(/^\/api\/fresh-food\/landing/) &&
    String(options.method || 'GET').toUpperCase() === 'GET'
  ) {
    const landingData = {
      heroImage:
        'https://placehold.co/750x900/00a86b/fff?text=🐕+鲜食定制+为你的毛孩子\\n量身打造营养方案',
      benefitImages: [
        'https://placehold.co/750x500/f8f9fa/333?text=🥗+新鲜食材+每日现做',
        'https://placehold.co/750x400/e8f5e9/333?text=📦+便捷配送+冷链直达',
        'https://placehold.co/750x400/fff3e0/333?text=🔬+科学配方+兽医认证',
        'https://placehold.co/750x350/e3f2fd/333?text=📊+定制方案+营养均衡',
      ],
      reviews: [
        {
          id: 'rev1',
          userName: '柯基妈妈',
          avatar: 'https://placehold.co/100x100/ffb74d/fff?text=🐕',
          petName: '小短腿',
          petBreed: '柯基犬',
          rating: 5,
          content:
            '自从换了鲜食，小短腿的毛发明显变好了！以前总是挑食，现在每顿都吃得干干净净。配送也很准时，解冻后直接喂，超方便！',
          images: [
            'https://placehold.co/300x300/ffe0b2/333?text=毛发更亮',
            'https://placehold.co/300x300/c8e6c9/333?text=吃得开心',
          ],
          createdAt: '2026-01-15',
        },
        {
          id: 'rev2',
          userName: '金毛爸爸',
          avatar: 'https://placehold.co/100x100/64b5f6/fff?text=🦮',
          petName: 'Lucky',
          petBreed: '金毛寻回犬',
          rating: 5,
          content:
            'Lucky之前肠胃不好，换了鲜食后消化好多了。客服还专门根据Lucky的体重和活动量调整了食谱，非常专业！',
          video: {
            url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
            cover: 'https://placehold.co/400x300/81c784/fff?text=▶️+Lucky吃饭视频',
          },
          createdAt: '2026-01-20',
        },
        {
          id: 'rev3',
          userName: '泰迪铲屎官',
          avatar: 'https://placehold.co/100x100/ba68c8/fff?text=🐩',
          petName: '巧克力',
          petBreed: '泰迪犬',
          rating: 4,
          content:
            '订阅了半年，巧克力从挑食变成了小馋猫。唯一的建议是希望能有更多口味选择，不过现有的几款已经很不错了。',
          images: ['https://placehold.co/300x300/e1bee7/333?text=期待开饭'],
          createdAt: '2026-02-01',
        },
      ],
      contactInfo: {
        title: '有疑问？联系我们',
        description: '专业营养师为您解答所有关于鲜食定制的问题',
        wechatQrCode: 'https://placehold.co/200x200/25d366/fff?text=微信扫码咨询',
        phoneNumber: '400-888-9999',
      },
      faqs: [
        {
          question: '鲜食可以保存多久？',
          answer: '冷冻状态下可保存3个月，解冻后冷藏保存3天。我们建议按需解冻，保持最佳新鲜度。',
        },
        {
          question: '如何确定适合我家狗狗的份量？',
          answer:
            '我们会根据您提供的狗狗品种、体重、年龄和活动量，由专业兽医营养师计算每日所需热量和营养配比。',
        },
        {
          question: '可以随时更改配送频率吗？',
          answer:
            '当然可以！您可以在个人中心随时调整配送频率，也可以暂停或取消订阅，完全没有任何强制条款。',
        },
        {
          question: '食材来源安全吗？',
          answer:
            '我们的所有食材均来自经过认证的供应商，人类食品级标准，通过严格的质量检测。每批次产品都有溯源记录。',
        },
        {
          question: '狗狗不喜欢吃怎么办？',
          answer:
            '我们提供7天试吃期，如果狗狗不喜欢，可以免费更换口味或全额退款。大多数狗狗在1-3天内就会爱上鲜食！',
        },
      ],
      ctaText: '开启专属鲜食之旅',
    }
    return { code: '0', msg: 'ok', result: landingData }
  }

  return null
}
