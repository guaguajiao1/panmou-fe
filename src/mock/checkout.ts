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
  // --- POST /checkout/entry/direct 立即购买/快结算 ---
  if (
    url.match(/^\/checkout\/entry\/direct$/) &&
    String(options.method || 'POST').toUpperCase() === 'POST'
  ) {
    const data = (options.data as any) || {}
    const previewItems: any[] = []

    // 1. 处理普通 items
    ;(data.items || []).forEach((itemInfo: any) => {
      previewItems.push({
        itemId: 'd_item_' + Date.now() + Math.random(),
        quantity: itemInfo.quantity || 1,
        originalPrice: '100.00',
        finalPrice: '100.00',
        totalItemPrice: (100 * (itemInfo.quantity || 1)).toFixed(2),
        totalItemDiscount: '0.00',
        availableQuantity: 99,
        sku: {
          skuId: itemInfo.skuId,
          productId: itemInfo.productId || itemInfo.skuId,
          strikeThroughPrice: '100.00',
          advertisedPrice: '100.00',
          originalPrice: '100.00',
          subscriptionPrice: '90.00',
          name: '商品 ' + itemInfo.skuId,
          image: ['https://placehold.co/200x200/ccc/333?text=Item'],
          desc: '',
          specs: '',
          type: 1,
          supportsSubscription: true,
          subscriptionDiscountRate: '10',
          subscriptionDiscount: '',
          maxQuantity: 99,
        },
        discountDetails: [],
        purchaseType: itemInfo.purchaseType || 0,
        Autoship: {
          subscriptionFrequency: { frequency: 4, unit: 'WEEK' as const },
          subscriptionAdjustments: [],
          source: 'CHECKOUT' as const,
        },
      })
    })

    // 2. 处理鲜食计划
    const freshFoodItem = handleCheckoutFreshFood(data)
    if (freshFoodItem) {
      previewItems.push(freshFoodItem)
    }

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
      recommendedAutoships: [],
      items: previewItems,
    }
    previews[newPreviewId] = computePreview(newPreview)
    return { code: '0', msg: 'ok', result: { previewId: newPreviewId } }
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

  return null
}

export function handleCheckoutFreshFood(data: any): any {
  if (data.planId) {
    const plan = plans.get(data.planId)
    const sel = data.planSelections
    if (plan && sel) {
      plan.ratioId = sel.ratioId
      plan.frequencyId = sel.frequencyId
      plan.recipes = sel.recipes
      plan.updatedAt = new Date().toISOString()

      // 持久化选项记录到 plan
      if (plan.ratios?.list) {
        plan.ratios.list.forEach((r) => {
          r.selected = r.id === sel.ratioId
          if (r.selected && r.frequencies) {
            r.frequencies.forEach((f) => {
              f.selected = f.id === sel.frequencyId
              if (f.selected && f.recipeQuantityArray) {
                f.recipeQuantityArray.forEach((item: any) => {
                  const matched = sel.recipes?.find((sr: any) => sr.skuId === item.skuId)
                  if (matched) {
                    item.quantity = matched.quantity
                    item.productId = matched.productId || item.productId
                  } else {
                    item.quantity = 0
                  }
                })
              }
            })
          }
        })
      }
      // ---------------------------------
      const ratio = plan.ratios.list.find((r: any) => r.id === sel.ratioId)
      const freq = ratio?.frequencies?.find((f: any) => f.id === sel.frequencyId)
      const specsText = (sel.recipes || [])
        .map((r: any) => {
          const recipeSku = ratio?.recipes?.find((rs: any) => rs.sku.skuId === r.skuId)
          const name = recipeSku?.sku?.name || r.skuId
          return `${name} ${r.quantity}袋`
        })
        .join(', ')

      let totalPrice = 0
      ;(sel.recipes || []).forEach((r: any) => {
        const recipeSku = ratio?.recipes?.find((rs: any) => rs.sku.skuId === r.skuId)
        totalPrice += parseFloat(recipeSku?.sku?.originalPrice || '0') * r.quantity
      })
      const priceStr = totalPrice.toFixed(2)

      return {
        itemId: 'd_item_' + Date.now() + Math.random(),
        quantity: 1,
        originalPrice: priceStr,
        finalPrice: priceStr,
        totalItemPrice: priceStr,
        totalItemDiscount: '0.00',
        availableQuantity: 99,
        sku: {
          skuId: 'fresh_skuid',
          productId: 'fresh_productid',
          strikeThroughPrice: priceStr,
          advertisedPrice: priceStr,
          originalPrice: priceStr,
          subscriptionPrice: priceStr,
          name: '为您准备的鲜食定制方案',
          image: ['https://placehold.co/200x200/90EE90/333?text=%F0%9F%A5%97+%E9%B2%9C%E9%A3%9F'],
          desc: plan.pet?.name ? `${plan.pet.name}的专属定制` : '鲜食定制方案',
          specs: specsText,
          type: 8,
          supportsSubscription: true,
          subscriptionDiscountRate: '0',
          subscriptionDiscount: '',
          maxQuantity: 1,
          customization: {
            items: [
              {
                code: 'ratio',
                name: '鲜食占比',
                mode: 0,
                displayMode: 0,
                values: [{ code: sel.ratioId, name: ratio?.name || sel.ratioId, checked: 1 }],
              },
              {
                code: 'frequency',
                name: '配送周期',
                mode: 0,
                displayMode: 0,
                values: [
                  { code: sel.frequencyId, name: freq?.label || sel.frequencyId, checked: 1 },
                ],
              },
            ],
          },
          planId: data.planId,
        },
        discountDetails: [],
        purchaseType: 1,
        Autoship: {
          subscriptionFrequency: { frequency: 4, unit: 'WEEK' as const },
          subscriptionAdjustments: [],
          source: 'CHECKOUT' as const,
        },
      }
    }
  }
}
