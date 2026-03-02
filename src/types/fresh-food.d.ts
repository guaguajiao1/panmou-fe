/**
 * 鲜食定制相关类型定义
 */

import type { PetType } from './pet'
import type { Sku } from './product'

/** 配送频率选项 */
export interface DeliveryFrequency {
  /** 频率ID */
  id: string
  /** 间隔数值 */
  interval: number
  /** 间隔单位 */
  unit: 'week' | 'month'
  /** 显示文本 */
  label: string
  /** 该占比+频率下的总袋数 n */
  totalPacks: number
  /** 配送周期天数（用于计算每日花费） */
  deliveryDays: number
  /** 固定运费（格式化字符串） */
  shippingFee: string
  /** 标签，如"最划算"、"冰箱友好" */
  tag?: string
  /** 是否推荐 */
  recommended?: boolean
}

/** 鲜食食谱SKU（包装Sku，附带用户选择数量） */
export interface FreshFoodRecipeSku {
  /** 食谱SKU（type=8 鲜食SKU） */
  sku: Sku
  /** 用户选择的数量（步进器控制） */
  quantity: number
  /** 是否推荐 */
  recommended?: boolean
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
  /** 该占比下的可选配送频率 */
  frequencies: DeliveryFrequency[]
  /** 该占比下的可选食谱SKU列表 */
  recipes: FreshFoodRecipeSku[]
}

/** 加入购物车/结算的请求参数 */
export interface FreshFoodOrderParams {
  /** 宠物ID */
  petId: string
  /** 选择的占比ID */
  ratioId: string
  /** 选择的配送频率ID */
  frequencyId: string
  /** 选择的食谱列表及数量 */
  recipes: { skuId: string; quantity: number }[]
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
  /** 占比配置 */
  ratios: {
    /** 可选占比列表（每个占比含各自的频率和食谱） */
    list: FreshFoodRatio[]
    /** 当前选择的占比ID */
    selected: string
  }
  /** 首单折扣百分比 */
  firstOrderDiscount: number
  /** 后续订单提示 */
  futureOrderNote: string
}
