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
  // --- Cart APIs (/account/carts) ---

  // GET /account/cart - 获取购物车 (Legacy or for current user context)
  if (url === '/account/cart' && String(options.method || 'GET').toUpperCase() === 'GET') {
    return { code: '0', msg: 'ok', result: clone(globalCart) }
  }

  // POST /account/carts/{cartId}/items - 添加商品（支持普通商品 + 鲜食 Plan）
  const addItemMatch = url.match(/^\/account\/carts\/([^/]+)\/items$/)
  if (addItemMatch && String(options.method || 'POST').toUpperCase() === 'POST') {
    const cartId = addItemMatch[1]
    const data = (options.data as any) || {}

    // 1. 处理普通 items 数组
    const items = data.items || []
    items.forEach((itemInfo: any) => {
      const existingIdx = globalCart.items.findIndex(
        (item: CartItem) =>
          item.sku.skuId === itemInfo.skuId && item.purchaseType === itemInfo.purchaseType,
      )
      if (existingIdx !== -1) {
        globalCart.items[existingIdx].quantity += itemInfo.quantity
      } else {
        const newItem: any = {
          itemId: 'item_' + Date.now() + Math.floor(Math.random() * 1000),
          quantity: itemInfo.quantity || 1,
          originalPrice: '0.00',
          finalPrice: '0.00',
          totalItemPrice: '0.00',
          totalItemDiscount: '0.00',
          availableQuantity: 99,
          sku: {
            skuId: itemInfo.skuId,
            productId: itemInfo.productId || itemInfo.skuId,
            productName: '商品 ' + itemInfo.skuId,
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
            attributes: [],
          },
          selected: true,
          addedPrice: '100.00',
          isEffective: true,
          purchaseType: itemInfo.purchaseType || 0,
          discountDetails: [],
        }
        globalCart.items.unshift(newItem)
      }
    })

    // 2. 处理鲜食计划
    const freshFoodItem = handleCartFreshFood(data)
    if (freshFoodItem) {
      globalCart.items.unshift(freshFoodItem)
    }
    // 兼容旧格式：直接传 productId/skuId
    if (!data.items && !data.planId && data.skuId) {
      // 旧逻辑兜底
    }

    setGlobalCart(computeCart(globalCart))
    return { code: '0', msg: '添加成功', result: clone(globalCart) }
  }

  // POST /account/carts/{cartId}/items:batchDelete - 批量删除
  const batchDeleteMatch = url.match(/^\/account\/carts\/([^/]+)\/items:batchDelete$/)
  if (batchDeleteMatch && String(options.method || 'POST').toUpperCase() === 'POST') {
    const data = (options.data as any) || {}
    const ids = data.itemIds || []
    if (globalCart && globalCart.items) {
      globalCart.items = globalCart.items.filter((item: CartItem) => !ids.includes(item.itemId))
      setGlobalCart(computeCart(globalCart))
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
      setGlobalCart(computeCart(globalCart))
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
      setGlobalCart(computeCart(globalCart))
    }
    return { code: '0', msg: 'ok', result: clone(globalCart) }
  }

  return null
}

export function handleCartFreshFood(data: any): any {
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
      // 查找占比和频率名称
      const ratio = plan.ratios.list.find((r: any) => r.id === sel.ratioId)
      const freq = ratio?.frequencies?.find((f: any) => f.id === sel.frequencyId)

      // 生成 specs 文本，如 "鸡肉蔬菜餐 7袋, 牛肉红薯餐 7袋"
      const specsText = (sel.recipes || [])
        .map((r: any) => {
          const recipeSku = ratio?.recipes?.find((rs: any) => rs.sku.skuId === r.skuId)
          const name = recipeSku?.sku?.name || r.skuId
          return `${name} ${r.quantity}袋`
        })
        .join(', ')

      // 计算总价
      let totalPrice = 0
      ;(sel.recipes || []).forEach((r: any) => {
        const recipeSku = ratio?.recipes?.find((rs: any) => rs.sku.skuId === r.skuId)
        totalPrice += parseFloat(recipeSku?.sku?.originalPrice || '0') * r.quantity
      })
      const priceStr = totalPrice.toFixed(2)

      const newPlanItem: any = {
        itemId: 'item_' + Date.now() + Math.floor(Math.random() * 1000),
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
          productName: '为您准备的鲜食定制方案',
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
          attributes: [],
          planId: data.planId,
        },
        selected: true,
        addedPrice: priceStr,
        isEffective: true,
        purchaseType: 1,
        discountDetails: [],
      }
      return newPlanItem
    }
  }
  return null
}
