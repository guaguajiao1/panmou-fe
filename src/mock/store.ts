import type { AddressItem } from '@/types/address'
import { type Item, type OrderPreview } from './../types/checkout.d'
import type { Cart, CartItem } from '@/types/cart'
import type { OrderDetail, OrderSkuItem, DiscountDetail } from '@/types/order'
import type { OrderShipment, ShipmentTrace } from '@/types/logistics'
import type { PetProfile, PetEnums, EnumItem } from '@/types/pet'
import type {
  FreshPlanPageData,
  FreshFoodRatio,
  DeliveryFrequency,
  FreshFoodRecipeSku,
} from '@/types/fresh-food'

export interface FreshFoodPlan extends FreshPlanPageData {
  planId: string
  uid: string
  petId: string
  /** 用户确认后的选择 */
  ratioId?: string
  frequencyId?: string
  recipes?: { skuId: string; quantity: number }[]
}

import { OrderState, OrderItemState, ItemType, ShipmentState } from '@/types/order-state'
// Development mock server implementing Address, Cart and Checkout APIs
// Returns Data<T> objects that match the http wrapper expectations

type Data<T> = {
  code: string
  msg: string
  result: T
}

export const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms))

// In-memory stores
export const addresses: Array<any> = []
export let globalCart: any = {}
export const previews: Record<string, any> = {}
export const orders: Map<string, OrderDetail> = new Map()
export const pets: Map<string, PetProfile> = new Map()
export const plans: Map<string, FreshFoodPlan> = new Map()

// Helpers
export const clone = (v: any) => JSON.parse(JSON.stringify(v))

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
export const computePreview = (orderPreview: OrderPreview) => {
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
export const computeCart = (cart: Cart) => {
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


export const setGlobalCart = (val: any) => { globalCart = val }
