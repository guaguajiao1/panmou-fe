import type { Data } from '@/types/product'

/**
 * 模拟数据（来源于 tb 抓包）
 */
const mockData: Data = {
  item: {
    itemId: '1234567890',
    title: '天然无谷冻干鲜肉狗粮',
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
      '5862282289714': { price: { priceText: '319' }, quantity: '200' },
      '5862282289715': { price: { priceText: '619' }, quantity: '100' },
      '5862282289716': { price: { priceText: '329' }, quantity: '150' },
      '5862282289717': { price: { priceText: '629' }, quantity: '50' },
    },
    skuItem: {
      itemStatus: '0',
      renderSku: 'true',
      unitBuy: '1',
    },
  },
}

/**
 * 食谱商品模拟数据
 */
const recipeMockData: Record<string, Data> = {
  r1: {
    item: {
      itemId: 'r1',
      title: '鸡肉蔬菜餐',
      images: ['https://placehold.co/750x400/90EE90/333?text=🍗+鸡肉餐'],
      detailImages: ['/static/images/recipe/recipe_detail.png'],
    },
  },
  r2: {
    item: {
      itemId: 'r2',
      title: '牛肉红薯餐',
      images: ['https://placehold.co/750x400/F4A460/333?text=🥩+牛肉餐'],
      detailImages: ['/static/images/recipe/recipe_detail.png'],
    },
  },
  r3: {
    item: {
      itemId: 'r3',
      title: '三文鱼餐',
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
export function getProductDetail(itemId: string): Promise<Data> {
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
          resolve(res.data as Data)
        },
        fail: reject,
      })
    }
  })
}
