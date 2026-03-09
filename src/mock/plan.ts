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
import { handleCartFreshFood } from './cart'

export const handle = async (url: string, options: any) => {
  // --- Fresh Food Plans API ---

  // POST /api/fresh-food/plans - 创建定制方案
  if (
    url.match(/^\/api\/fresh-food\/plans$/) &&
    String(options.method || 'POST').toUpperCase() === 'POST'
  ) {
    const data = (options.data as any) || {}
    const petId = data.petId

    // 用与 fresh_food_plan.vue loadMockData() 完全相同的数据填充
    const makeFreshSku = (
      id: string,
      name: string,
      desc: string,
      price: string,
      imageEmoji: string,
      ingredient: string,
      ingredientImage: string,
    ) => ({
      skuId: id,
      productId: id,
      strikeThroughPrice: price,
      advertisedPrice: price,
      originalPrice: price,
      originalPriceValue: Math.round(parseFloat(price) * 100), // 转换为分
      subscriptionPrice: price,
      subscriptionPriceValue: Math.round(parseFloat(price) * 100), // 转换为分
      name,
      productName: name,
      image: [`https://placehold.co/200x200/90EE90/333?text=${encodeURIComponent(imageEmoji)}`],
      desc,
      specs: '',
      type: 8,
      supportsSubscription: true,
      subscriptionDiscountRate: '0',
      subscriptionDiscount: '',
      maxQuantity: 99,
      ingredient,
      ingredientImage,
    })

    const chickenSku = makeFreshSku(
      'r1',
      '鸡肉蔬菜餐',
      '选用优质鸡胸肉，搭配新鲜时令蔬菜',
      '25.00',
      '🍗',
      '鸡肉、鸡汤、燕麦、鸡肝、羽衣甘蓝、胡萝卜、盼眸营养配方、椰子油、三文鱼油',
      'https://placehold.co/750x1200/f8f9fa/333?text=🍗+鸡肉蔬菜餐+成分详情%0A%0A鸡肉（蛋白质）%0A鸡汤（水分）%0A燕麦（碳水）%0A鸡肝（营养）%0A羽衣甘蓝（纤维）%0A胡萝卜（维生素）%0A%0A粗蛋白≥7%25%0A粗脂肪≥4.5%25%0A粗纤维≤1.5%25%0A水分≤74.5%25',
    )
    const beefSku = makeFreshSku(
      'r2',
      '牛肉红薯餐',
      '精选牛腿肉，配以香甜红薯和南瓜',
      '28.00',
      '🥩',
      '牛肉、牛肝、红薯、南瓜、菠菜、盼眸营养配方、亚麻籽油、鱼油',
      'https://placehold.co/750x1200/f8f9fa/333?text=🥩+牛肉红薯餐+成分详情%0A%0A牛肉（蛋白质）%0A牛肝（营养）%0A红薯（碳水）%0A南瓜（纤维）%0A菠菜（维生素）%0A%0A粗蛋白≥8%25%0A粗脂肪≥5%25%0A粗纤维≤1.5%25%0A水分≤73%25',
    )
    const fishSku = makeFreshSku(
      'r3',
      '三文鱼餐',
      '深海三文鱼，富含Omega-3脂肪酸',
      '32.00',
      '🐟',
      '三文鱼、鳕鱼、糙米、西兰花、蓝莓、盼眸营养配方、鱼油、橄榄油',
      'https://placehold.co/750x1200/f8f9fa/333?text=🐟+三文鱼餐+成分详情%0A%0A三文鱼（蛋白质）%0A鳕鱼（蛋白质）%0A糙米（碳水）%0A西兰花（纤维）%0A蓝莓（抗氧化）%0A%0A粗蛋白≥9%25%0A粗脂肪≥6%25%0A粗纤维≤1%25%0A水分≤72%25',
    )
    const lambSku = makeFreshSku(
      'r4',
      '羊肉糙米餐',
      '新西兰羊肉，搭配有机糙米',
      '30.00',
      '🐑',
      '羊肉、羊肝、糙米、豌豆、胡萝卜、盼眸营养配方、椰子油、鱼油',
      'https://placehold.co/750x1200/f8f9fa/333?text=🐑+羊肉糙米餐+成分详情%0A%0A羊肉（蛋白质）%0A羊肝（营养）%0A糙米（碳水）%0A豌豆（纤维）%0A胡萝卜（维生素）%0A%0A粗蛋白≥8%25%0A粗脂肪≥5.5%25%0A粗纤维≤1.5%25%0A水分≤73%25',
    )

    const ratios: FreshFoodRatio[] = [
      {
        id: 'ratio100',
        name: '100%鲜食',
        description: '完全以鲜食为主',
        percentage: 100,
        recommended: true,
        selected: true,
        image: 'https://placehold.co/60x40/00a86b/fff?text=100%25',
        frequencies: [
          {
            id: 'f100_2w',
            interval: 2,
            unit: 'week',
            label: '每2周',
            totalPacks: 14,
            deliveryDays: 14,
            shippingFee: '0',
            tag: '最划算',
            recommended: true,
            selected: true,
          },
          {
            id: 'f100_3w',
            interval: 3,
            unit: 'week',
            label: '每3周',
            totalPacks: 21,
            deliveryDays: 21,
            shippingFee: '0',
            tag: '🧊 冰箱友好',
          },
          {
            id: 'f100_4w',
            interval: 4,
            unit: 'week',
            label: '每4周',
            totalPacks: 28,
            deliveryDays: 28,
            shippingFee: '10',
          },
        ],
        recipes: [
          { sku: chickenSku as any, quantity: 0, recommended: true } as any,
          { sku: beefSku as any, quantity: 0, recommended: true } as any,
          { sku: fishSku as any, quantity: 0 } as any,
          { sku: lambSku as any, quantity: 0 } as any,
        ],
      },
      {
        id: 'ratio50',
        name: '50%鲜食',
        description: '鲜食搭配干粮',
        percentage: 50,
        image: 'https://placehold.co/60x40/ffa500/fff?text=50%25',
        frequencies: [
          {
            id: 'f50_2w',
            interval: 2,
            unit: 'week',
            label: '每2周',
            totalPacks: 7,
            deliveryDays: 14,
            shippingFee: '0',
            recommended: true,
            selected: true,
          },
          {
            id: 'f50_3w',
            interval: 3,
            unit: 'week',
            label: '每3周',
            totalPacks: 11,
            deliveryDays: 21,
            shippingFee: '5',
          },
          {
            id: 'f50_4w',
            interval: 4,
            unit: 'week',
            label: '每4周',
            totalPacks: 14,
            deliveryDays: 28,
            shippingFee: '10',
          },
        ],
        recipes: [
          { sku: chickenSku as any, quantity: 0, recommended: true } as any,
          { sku: beefSku as any, quantity: 0 } as any,
          { sku: fishSku as any, quantity: 0, recommended: true } as any,
        ],
      },
      {
        id: 'ratio25',
        name: '25%鲜食',
        description: '鲜食作为辅食',
        percentage: 25,
        image: 'https://placehold.co/60x40/6495ed/fff?text=25%25',
        frequencies: [
          {
            id: 'f25_2w',
            interval: 2,
            unit: 'week',
            label: '每2周',
            totalPacks: 4,
            deliveryDays: 14,
            shippingFee: '0',
            recommended: true,
            selected: true,
          },
          {
            id: 'f25_4w',
            interval: 4,
            unit: 'week',
            label: '每4周',
            totalPacks: 7,
            deliveryDays: 28,
            shippingFee: '10',
          },
        ],
        recipes: [
          { sku: chickenSku as any, quantity: 0, recommended: true } as any,
          { sku: beefSku as any, quantity: 0 } as any,
        ],
      },
    ] as any

    // 初始化时自动为每个频率分配好食谱数量
    ratios.forEach((ratio) => {
      ratio.frequencies.forEach((freq) => {
        let targetRecipes = ratio.recipes.filter((r) => r.recommended)
        if (targetRecipes.length === 0) {
          targetRecipes = ratio.recipes.slice(0, Math.min(3, ratio.recipes.length))
        }
        targetRecipes = targetRecipes.slice(0, 3)

        const n = freq.totalPacks
        const base = Math.floor(n / targetRecipes.length)
        const remainder = n % targetRecipes.length

        // 生成针对当前频率的一个默认的全0 sku对应表
        freq.recipeQuantityArray = ratio.recipes.map((r) => ({
          skuId: r.sku.skuId,
          quantity: 0,
        }))

        // 把计算好的包数分配进去
        targetRecipes.forEach((tr, idx) => {
          const qty = base + (idx < remainder ? 1 : 0)
          const targetItem = freq.recipeQuantityArray.find((item) => item.skuId === tr.sku.skuId)
          if (targetItem) {
            targetItem.quantity = qty
          }
        })
      })
    })

    const pet = pets.get(petId) || {
      id: petId || 'pet_mock',
      name: '小西',
      type: 'dog' as const,
      avatar: 'https://placehold.co/80x80/f5e6d3/333?text=🐕',
      breedName: '柴犬',
      birthday: '2022-05-15',
      gender: 'male' as const,
      neutered: true,
      currentWeight: 12,
      idealWeight: 11,
      bodyCondition: 'ideal',
      activityLevel: 'moderate',
      pickyLevel: 'sometimes',
      summary: '成年柴犬，体型标准，活动量适中',
    }

    const snacksConfig = {
      title: '为你的狗狗选择健康零食',
      description: '天然食材，无添加剂，每一口都是营养',
      priceNote: '首单免费，后续10元',
      list: [
        makeFreshSku(
          'snack1',
          '牛肉条',
          '',
          '39.00',
          '🥩',
          '牛肉（蛋白质）、苹果（纤维）、海盐（电解质）',
          'https://placehold.co/750x1200/f8f9fa/333?text=🥩+牛肉条+成分详情%0A%0A牛肉（蛋白质）%0A苹果（纤维）%0A海盐（电解质）%0A%0A粗蛋白≥25%25%0A粗脂肪≥8%25%0A粗纤维≤3%25%0A水分≤15%25',
        ),
        makeFreshSku(
          'snack2',
          '猪肉条',
          '',
          '35.00',
          '🥓',
          '猪肉（蛋白质）、梨（纤维）、海盐（电解质）',
          'https://placehold.co/750x1200/f8f9fa/333?text=🥓+猪肉条+成分详情%0A%0A猪肉（蛋白质）%0A梨（纤维）%0A海盐（电解质）%0A%0A粗蛋白≥22%25%0A粗脂肪≥10%25%0A粗纤维≤3%25%0A水分≤15%25',
        ),
        makeFreshSku(
          'snack3',
          '鸡肉条',
          '',
          '32.00',
          '🍗',
          '鸡肉（蛋白质）、苹果（纤维）、海盐（电解质）',
          'https://placehold.co/750x1200/f8f9fa/333?text=🍗+鸡肉条+成分详情%0A%0A鸡肉（蛋白质）%0A苹果（纤维）%0A海盐（电解质）%0A%0A粗蛋白≥28%25%0A粗脂肪≥6%25%0A粗纤维≤2%25%0A水分≤12%25',
        ),
      ],
    }

    const toysConfig = {
      toyPriceNote: '首单免费，后续10元',
      chewPriceNote: '首单免费，后续10元',
      toyCategories: [
        makeFreshSku('toy1', '毛绒玩具', '软性材料', '49.00', '🧸', '', ''),
        makeFreshSku('toy2', '耐用咀嚼玩具', '坚韧材料', '59.00', '🦴', '', ''),
        makeFreshSku('toy3', '组合盒', '蓬松又坚韧', '89.00', '📦', '', ''),
      ],
      chews: [
        makeFreshSku(
          'chew1',
          '天然牛皮磨牙棒',
          '',
          '29.00',
          '🦴',
          '天然牛皮、鸡肉粉、木薯淀粉、甘油',
          'https://placehold.co/750x1200/f8f9fa/333?text=🦴+天然牛皮磨牙棒+成分详情%0A%0A天然牛皮%0A鸡肉粉%0A木薯淀粉%0A甘油%0A%0A粗蛋白≥60%25%0A粗脂肪≥3%25%0A粗纤维≤2%25%0A水分≤16%25',
        ),
        makeFreshSku(
          'chew2',
          '鹿角磨牙棒',
          '',
          '45.00',
          '🦌',
          '天然鹿角、富含矿物质和微量元素',
          'https://placehold.co/750x1200/f8f9fa/333?text=🦌+鹿角磨牙棒+成分详情%0A%0A天然鹿角%0A钙%0A磷%0A锌%0A%0A粗蛋白≥45%25%0A粗脂肪≥1%25%0A钙≥20%25%0A磷≥10%25',
        ),
        makeFreshSku(
          'chew3',
          '洁齿磨牙骨',
          '',
          '25.00',
          '🦷',
          '大米粉、鸡肉粉、薄荷提取物、叶绿素',
          'https://placehold.co/750x1200/f8f9fa/333?text=🦷+洁齿磨牙骨+成分详情%0A%0A大米粉%0A鸡肉粉%0A薄荷提取物%0A叶绿素%0A%0A粗蛋白≥12%25%0A粗脂肪≥2%25%0A粗纤维≤5%25%0A水分≤15%25',
        ),
      ],
    }

    const planId = 'plan_' + Date.now()
    const newPlan: FreshFoodPlan = {
      planId,
      petId: pet.id,
      uid: 'USER-001',
      pet: pet as any,
      ratios: {
        list: ratios,
        wholeRatioShipNote: '为了您有时间替换为鲜食，第二个订单我们延迟一周配送，你随时可以修改。',
      },
      firstOrderDiscount: 50,
      firstOrderNote: `首单享有50%折扣（最高减100元）`,
      snacks: null,
      toys: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // 根据宠物名字模拟不同的返回数据情况
    if (pet.name === '旺财') {
      newPlan.snacks = snacksConfig as any
      newPlan.toys = toysConfig as any
    } else if (pet.name === '大黄') {
      newPlan.toys = toysConfig as any
    } else if (pet.name === '二哈') {
      newPlan.snacks = snacksConfig as any
    } else if (pet.name === '豆豆') {
      // 均无
    } else {
      // 默认全有
      newPlan.snacks = snacksConfig as any
      newPlan.toys = toysConfig as any
    }

    plans.set(planId, newPlan)
    return { code: '0', msg: 'ok', result: { planId } }
  }

  // 解析带有 query 参数的 url
  const urlParts = url.split('?')
  const path = urlParts[0]
  const queryString = urlParts[1] || ''

  // GET /api/fresh-food/plans/{planId} - 获取方案详情
  const planMatch = path.match(/^\/api\/fresh-food\/plans\/([^/]+)$/)
  if (planMatch && String(options.method || 'GET').toUpperCase() === 'GET') {
    const planId = planMatch[1]
    const plan = plans.get(planId)
    if (!plan) return { code: '1', msg: 'Plan not found', result: null }
    console.log('plan', plan)
    return { code: '0', msg: 'ok', result: clone(plan) }
  }

  // PUT /api/fresh-food/plans/{planId} - 更新定制方案
  if (planMatch && String(options.method || 'PUT').toUpperCase() === 'PUT') {
    const planId = planMatch[1]
    const plan = plans.get(planId)
    if (!plan) return { code: '1', msg: 'Plan not found', result: null }

    const data = (options.data as any) || {}
    const sel = data.planSelections
    if (sel) {
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
                  } else {
                    item.quantity = 0
                  }
                })
              }
            })
          }
        })
      }
    }

    // 根据 scene 同步数据
    const query = Object.fromEntries(
      queryString
        .split('&')
        .filter(Boolean)
        .map((p) => p.split('=').map(decodeURIComponent)),
    )
    const { scene, cartId, itemId, subscriptionId } = query

    if (scene === 'cart' && itemId && globalCart.items) {
      // 模拟更新购物车商品
      const cartItem = globalCart.items.find((i: any) => i.itemId === itemId)
      if (cartItem) {
        // 如果需要，可以在这里更新 cartItem 的价格或方案记录
        const freshFoodItem = makeCartFreshFoodItem(plan, sel)
        freshFoodItem.itemId = itemId
        globalCart.items.splice(
          globalCart.items.findIndex((i: any) => i.itemId === itemId),
          1,
          freshFoodItem,
        )
        computeCart(globalCart)
      }
    } else if (scene === 'subscription' && itemId) {
      // 模拟更新订阅商品
      console.log(
        `[Mock] Updated subscription ${subscriptionId} item ${itemId} with plan ${planId}`,
      )
    }

    return { code: '0', msg: 'ok', result: clone(plan) }
  }

  return null
}

function makeCartFreshFoodItem(plan: FreshFoodPlan, sel: any): any {
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
            values: [{ code: sel.frequencyId, name: freq?.label || sel.frequencyId, checked: 1 }],
          },
        ],
      },
      attributes: [],
      planId: plan.planId,
    },
    selected: true,
    addedPrice: priceStr,
    isEffective: true,
    purchaseType: 1,
    discountDetails: [],
  }
  return newPlanItem
}
