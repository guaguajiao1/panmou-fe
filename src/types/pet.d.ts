/**
 * 宠物相关类型定义
 */

/** 宠物类型 */
export type PetType = 'dog' | 'cat'

/** 性别 */
export type PetGender = 'male' | 'female'

/** 宠物信息 */
export interface PetProfile {
  /** 宠物ID */
  id: string
  /** 头像URL */
  avatar: string
  /** 名称 */
  name: string
  /** 类型 */
  type: PetType
  /** 品种ID */
  breedId: string
  /** 品种名称 */
  breedName?: string
  /** 生日 */
  birthday: string
  /** 性别 */
  gender: PetGender
  /** 是否绝育 */
  neutered: boolean
  /** 是否有食物过敏 */
  hasFoodAllergies: boolean
  /** 食物过敏原ID列表 */
  foodAllergyIds: string[]
  /** 是否在服药 */
  onMedication: boolean
  /** 服用的药物ID列表 */
  medicationIds: string[]
  /** 是否有药物过敏 */
  hasDrugAllergies: boolean
  /** 药物过敏ID列表 */
  drugAllergyIds: string[]
  /** 是否有健康问题 */
  hasHealthIssues: boolean
  /** 健康问题ID列表 */
  healthIssueIds: string[]
  /** 排序顺序 */
  sortOrder: number
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/** 创建/更新宠物参数 */
export interface PetFormData {
  avatar?: string
  name: string
  type: PetType
  breedId: string
  birthday: string
  gender: PetGender
  neutered: boolean
  hasFoodAllergies: boolean
  foodAllergyIds: string[]
  onMedication: boolean
  medicationIds: string[]
  hasDrugAllergies: boolean
  drugAllergyIds: string[]
  hasHealthIssues: boolean
  healthIssueIds: string[]
}

/** 枚举项 */
export interface EnumItem {
  id: string
  name: string
}

/** 宠物枚举数据 */
export interface PetEnums {
  /** 品种列表 */
  breeds: EnumItem[]
  /** 食物过敏原列表 */
  foodAllergens: EnumItem[]
  /** 药物列表 */
  medications: EnumItem[]
  /** 药物过敏原列表 */
  drugAllergens: EnumItem[]
  /** 健康问题列表 */
  healthIssues: EnumItem[]
}
