import type { ProductData } from '@/types/product'

/**
 * 模拟数据（来源于 tb 抓包）
 */
const mockData: ProductData = {
  product: {
    productId: '1234567890',
    type: 1,
    title: '天然无谷冻干鲜肉狗粮',
    customizationMode: 0,
    vagueSellCount: '2万+',
    images: [
      'https://gw.alicdn.com/imgextra/O1CN01zvM5Tg1z9NFR75FUq_!!2377316671-0-picasso.jpg_q50.jpg_.webp',
      'https://gw.alicdn.com/imgextra/O1CN01Aeda2B1z9NFHOFusr_!!2377316671.jpg_q50.jpg_.webp',
    ],
    industryParamVO: {
      basicParamList: [
        { propertyName: '品牌', valueName: '优质宠物' },
        { propertyName: '品名', valueName: '冻干鲜肉狗粮' },
        { propertyName: '净含量', valueName: '12kg / 24kg' },
        { propertyName: '口味', valueName: '牛肉蓝莓 / 鸭肉梨' },
        { propertyName: '规格类型', valueName: '正常规格' },
        { propertyName: '款式', valueName: '膨化粮' },
      ],
    },
  },
  skuBase: {
    props: [
      {
        pid: '122216494',
        name: '食品口味',
        values: [
          { vid: '39056516503', name: '牛肉蓝莓口味【冻干鲜肉升级版2.0】', sortOrder: '1' },
          { vid: '39056882016', name: '鸭肉梨口味【冻干鲜肉升级版2.0】', sortOrder: '2' },
        ],
      },
      {
        pid: '147956252',
        name: '净含量',
        values: [
          { vid: '6377934', name: '12kg', sortOrder: '1' },
          { vid: '7541528', name: '24kg', sortOrder: '2' },
        ],
      },
    ],
    skus: [
      { propPath: '122216494:39056516503;147956252:6377934', skuId: '5862282289714' },
      { propPath: '122216494:39056516503;147956252:7541528', skuId: '5862282289715' },
      { propPath: '122216494:39056882016;147956252:6377934', skuId: '5862282289716' },
      { propPath: '122216494:39056882016;147956252:7541528', skuId: '5862282289717' },
    ],
  },
  skuCore: {
    sku2info: {
      '5862282289714': {
        skuId: '5862282289714',
        productId: '1234567890',
        strikeThroughPrice: '399.00',
        advertisedPrice: '339.00',
        originalPrice: '399.00',
        originalPriceValue: 39900,
        subscriptionPrice: '339.00',
        subscriptionPriceValue: 33900,
        name: '牛肉蓝莓 12kg',
        image: [''],
        desc: '',
        specs: '',
        type: 1,
        supportsSubscription: true,
        subscriptionDiscountRate: '10',
        subscriptionDiscount: '0.00',
        maxQuantity: 99,
      },
      '5862282289715': {
        skuId: '5862282289715',
        productId: '1234567890',
        strikeThroughPrice: '769.00',
        advertisedPrice: '649.00',
        originalPrice: '769.00',
        originalPriceValue: 76900,
        subscriptionPrice: '649.00',
        subscriptionPriceValue: 64900,
        name: '牛肉蓝莓 24kg',
        image: [''],
        desc: '',
        specs: '',
        type: 1,
        supportsSubscription: true,
        subscriptionDiscountRate: '10',
        subscriptionDiscount: '0.00',
        maxQuantity: 99,
      },
      '5862282289716': {
        skuId: '5862282289716',
        productId: '1234567890',
        strikeThroughPrice: '409.00',
        advertisedPrice: '349.00',
        originalPrice: '409.00',
        originalPriceValue: 40900,
        subscriptionPrice: '349.00',
        subscriptionPriceValue: 34900,
        name: '鸭肉梨 12kg',
        image: [''],
        desc: '',
        specs: '',
        type: 1,
        supportsSubscription: true,
        subscriptionDiscountRate: '10',
        subscriptionDiscount: '0.00',
        maxQuantity: 99,
      },
      '5862282289717': {
        skuId: '5862282289717',
        productId: '1234567890',
        strikeThroughPrice: '779.00',
        advertisedPrice: '659.00',
        originalPrice: '779.00',
        originalPriceValue: 77900,
        subscriptionPrice: '659.00',
        subscriptionPriceValue: 65900,
        name: '鸭肉梨 24kg',
        image: [''],
        desc: '',
        specs: '',
        type: 1,
        supportsSubscription: true,
        subscriptionDiscountRate: '10',
        subscriptionDiscount: '0.00',
        maxQuantity: 99,
      },
    },
  },
}

/**
 * 食谱商品模拟数据
 */
const recipeMockData: Record<string, ProductData> = {
  r1: {
    product: {
      productId: 'r1',
      type: 1,
      title: '鸡肉蔬菜餐',
      customizationMode: 0,
      images: ['https://placehold.co/750x400/90EE90/333?text=🍗+鸡肉餐'],
      detailImages: ['/static/images/recipe/recipe_detail.png'],
    },
  },
  r2: {
    product: {
      productId: 'r2',
      type: 1,
      title: '牛肉红薯餐',
      customizationMode: 0,
      images: ['https://placehold.co/750x400/F4A460/333?text=🥩+牛肉餐'],
      detailImages: ['/static/images/recipe/recipe_detail.png'],
    },
  },
  r3: {
    product: {
      productId: 'r3',
      type: 1,
      title: '三文鱼餐',
      customizationMode: 0,
      images: ['https://placehold.co/750x400/FFA07A/333?text=🐟+三文鱼餐'],
      detailImages: ['/static/images/recipe/recipe_detail.png'],
    },
  },
}

/**
 * 获取商品详情
 * 开发：直接返回 mockData
 * 生产：请求后端 API
 */
export function getProductDetail(itemId: string): Promise<ProductData> {
  return new Promise((resolve, reject) => {
    if (process.env.NODE_ENV === 'development') {
      // 检查是否为食谱商品
      if (recipeMockData[itemId]) {
        resolve(recipeMockData[itemId])
      } else {
        resolve(mockData)
      }
    } else {
      // 调用后端接口
      uni.request({
        url: `https://your-api.com/product/detail?itemId=${itemId}`,
        method: 'GET',
        success: (res) => {
          resolve(res.data as ProductData)
        },
        fail: reject,
      })
    }
  })
}
