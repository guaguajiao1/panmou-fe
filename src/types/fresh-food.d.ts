/**
 * 鲜食定制相关类型定义
 */

import type { PetType } from './pet'

/** 鲜食方案类型 */
export type FreshFoodPlanType = 'full_meals' | 'mixer' | 'topper' | 'sampler'

/** 配送频率单位 */
export type FrequencyUnit = 'week' | 'month'

/** 鲜食方案 */
export interface FreshFoodPlan {
  /** 方案ID */
  id: string
  /** 方案类型 */
  type: FreshFoodPlanType
  /** 方案名称 */
  name: string
  /** 描述 */
  description: string
  /** 图片URL */
  image: string
  /** 每日份量描述 */
  portionDescription: string
  /** 是否为试吃盒 */
  isSampler: boolean
  /** 是否推荐 */
  recommended?: boolean
}

/** 配送频率选项 */
export interface DeliveryFrequency {
  /** 频率ID */
  id: string
  /** 间隔数值 */
  interval: number
  /** 间隔单位 */
  unit: FrequencyUnit
  /** 显示文本 */
  label: string
  /** 每日价格 */
  pricePerDay: number
  /** 每次配送包数 */
  packsPerDelivery: number
  /** 标签，如"最划算"、"冰箱友好" */
  tag?: string
}

/** 食谱 */
export interface Recipe {
  /** 食谱ID */
  id: string
  /** 食谱名称 */
  name: string
  /** 描述 */
  description: string
  /** 图片URL */
  image: string
  /** 主要成分 */
  ingredients: string[]
  /** 营养成分 */
  nutrition?: string
  /** 是否选中 */
  selected?: boolean
  /** 是否推荐 */
  recommended?: boolean
}

/** 鲜食推荐结果 */
export interface FreshFoodRecommendation {
  /** 宠物ID */
  petId: string
  /** 宠物名称 */
  petName: string
  /** 宠物类型 */
  petType: PetType
  /** 宠物描述摘要 */
  petSummary: string
  /** 可选方案列表 */
  plans: FreshFoodPlan[]
  /** 配送频率选项 */
  frequencies: DeliveryFrequency[]
  /** 可选食谱 */
  recipes: Recipe[]
  /** 首单折扣百分比 */
  firstOrderDiscount: number
}

/** 添加购物车/结算请求 */
export interface FreshFoodOrderRequest {
  /** 宠物ID */
  petId: string
  /** 选择的方案ID */
  planId: string
  /** 选择的配送频率ID */
  frequencyId: string
  /** 选择的食谱ID列表 */
  recipeIds: string[]
}

/** 添加购物车响应 */
export interface AddToCartResponse {
  success: boolean
  cartItemId?: string
  message?: string
}

/** 立即结算响应 */
export interface CheckoutResponse {
  success: boolean
  orderId?: string
  checkoutUrl?: string
  message?: string
}

/** 鲜食占比选项 */
export interface FreshFoodRatio {
  /** 占比ID */
  id: string
  /** 名称，如"100%鲜食" */
  name: string
  /** 描述 */
  description: string
  /** 占比百分比 */
  percentage: number
  /** 是否推荐 */
  recommended?: boolean
  /** 说明图片 */
  image?: string
}

/** 价格矩阵项 (占比×频率的笛卡尔积) */
export interface PriceMatrixItem {
  /** 占比ID */
  ratioId: string
  /** 频率ID */
  frequencyId: string
  /** 每日价格 */
  dailyPrice: number
  /** 划线价总价 */
  originalTotal: number
  /** 优惠后总价 */
  discountedTotal: number
}

/** 零食商品 */
export interface SnackProduct {
  /** 商品ID */
  id: string
  /** 名称 */
  name: string
  /** 英文名 */
  nameEn: string
  /** 图片 */
  image: string
  /** 成分列表 */
  ingredients: string[]
  /** 营养成分链接/说明 */
  nutritionFacts?: string
  /** 价格 */
  price: number
  /** 是否选中 */
  selected?: boolean
}

/** 玩具类型 */
export interface ToyCategory {
  /** 类型ID */
  id: string
  /** 名称 */
  name: string
  /** 英文名 */
  nameEn: string
  /** 图片 */
  image: string
  /** 描述 */
  description: string
  /** 是否选中 */
  selected?: boolean
  /** 数量 */
  quantity?: number
  /** 价格 */
  price: number
}

/** 磨牙棒商品 */
export interface ChewProduct {
  /** 商品ID */
  id: string
  /** 名称 */
  name: string
  /** 图片 */
  image: string
  /** 价格 */
  price: number
  /** 选择数量 */
  quantity: number
}

/** 统一页面数据结构 */
export interface FreshPlanPageData {
  /** 宠物信息 */
  pet: {
    id: string
    name: string
    type: PetType
    avatar: string
    breedName: string
    birthday: string
    gender: 'male' | 'female'
    neutered: boolean
    currentWeight?: number
    idealWeight?: number
    bodyCondition?: string
    activityLevel?: string
    pickyLevel?: string
    summary: string
  }
  /** 食谱配置 */
  recipes: {
    /** 可选食谱列表 */
    list: Recipe[]
    /** 已选择的食谱ID */
    selected: string[]
    /** 最多可选数量 */
    maxSelectable: number
  }
  /** 占比配置 */
  ratios: {
    /** 可选占比列表 */
    list: FreshFoodRatio[]
    /** 当前选择的占比ID */
    selected: string
  }
  /** 频率配置 */
  frequencies: {
    /** 可选频率列表 */
    list: DeliveryFrequency[]
    /** 当前选择的频率ID */
    selected: string
  }
  /** 价格矩阵 */
  priceMatrix: PriceMatrixItem[]
  /** 首单折扣百分比 */
  firstOrderDiscount: number
  /** 后续订单提示 */
  futureOrderNote: string
  /** 零食配置 */
  snacks?: {
    /** 零食列表 */
    list: SnackProduct[]
    /** 已选择的零食ID */
    selected: string | null
  }
  /** 玩具配置 */
  toys?: {
    /** 玩具类型列表 */
    categories: ToyCategory[]
    /** 已选择的类型ID */
    selected: string | null
  }
  /** 磨牙棒配置 */
  chews?: {
    /** 磨牙棒列表 */
    list: ChewProduct[]
  }
}
