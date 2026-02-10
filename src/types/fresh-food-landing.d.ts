/**
 * 鲜食营销落地页类型定义
 */

/** 营销页数据 */
export interface FreshFoodLandingData {
  /** 首屏 Hero 图片 */
  heroImage: string
  /** 介绍图片列表（好处、流程、科学背书等） */
  benefitImages: string[]
  /** 用户评价列表 */
  reviews: UserReview[]
  /** 客服联系信息 */
  contactInfo: ContactInfo
  /** FAQ 列表 */
  faqs: FaqItem[]
  /** CTA 按钮文案 */
  ctaText: string
}

/** 用户评价 */
export interface UserReview {
  /** 评价ID */
  id: string
  /** 用户名 */
  userName: string
  /** 用户头像 */
  avatar: string
  /** 宠物名 */
  petName: string
  /** 宠物品种 */
  petBreed: string
  /** 评分 1-5 */
  rating: number
  /** 评价内容 */
  content: string
  /** 图片列表 */
  images?: string[]
  /** 视频 */
  video?: {
    url: string
    cover: string
  }
  /** 创建时间 */
  createdAt: string
}

/** 客服联系信息 */
export interface ContactInfo {
  /** 标题 */
  title: string
  /** 描述 */
  description: string
  /** 微信二维码 */
  wechatQrCode?: string
  /** 电话号码 */
  phoneNumber?: string
}

/** FAQ 项目 */
export interface FaqItem {
  /** 问题 */
  question: string
  /** 答案 */
  answer: string
}
