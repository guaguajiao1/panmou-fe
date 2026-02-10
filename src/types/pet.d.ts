/**
 * 宠物相关类型定义
 */

/** 宠物类型 */
export type PetType = 'dog' | 'cat'

/** 性别 */
export type PetGender = 'male' | 'female'

/** 体型状况 */
export type BodyCondition = 'thin' | 'ideal' | 'chubby' | 'overweight'

/** 活动水平 */
export type ActivityLevel = 'low' | 'moderate' | 'high' | 'athlete'

/** 挑食程度 */
export type PickyLevel = 'very_picky' | 'sometimes' | 'foodie' | 'eats_all'

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

  // --- 步骤2: 体重信息 ---
  /** 当前体重(kg) */
  currentWeight?: number
  /** 理想体重(kg) */
  idealWeight?: number
  /** 体型状况 */
  bodyCondition?: BodyCondition

  // --- 步骤3: 活动水平 ---
  /** 活动水平 */
  activityLevel?: ActivityLevel

  // --- 步骤4: 挑食情况 ---
  /** 挑食程度 */
  pickyLevel?: PickyLevel

  // --- 步骤5: 食物过敏 ---
  /** 是否有食物过敏 */
  hasFoodAllergies: boolean
  /** 食物过敏原ID列表 */
  foodAllergyIds: string[]

  // --- 步骤6: 健康问题 ---
  /** 是否有健康问题 */
  hasHealthIssues: boolean
  /** 健康问题ID列表 */
  healthIssueIds: string[]

  // --- 其他 (保留但不在向导中显示) ---
  /** 是否在服药 */
  onMedication: boolean
  /** 服用的药物ID列表 */
  medicationIds: string[]
  /** 是否有药物过敏 */
  hasDrugAllergies: boolean
  /** 药物过敏ID列表 */
  drugAllergyIds: string[]

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
  // 步骤2
  currentWeight?: number
  idealWeight?: number
  bodyCondition?: BodyCondition
  // 步骤3
  activityLevel?: ActivityLevel
  // 步骤4
  pickyLevel?: PickyLevel
  // 步骤5
  hasFoodAllergies?: boolean
  foodAllergyIds: string[]
  // 步骤6
  hasHealthIssues?: boolean
  healthIssueIds: string[]
  // 其他
  onMedication: boolean
  medicationIds: string[]
  hasDrugAllergies: boolean
  drugAllergyIds: string[]
}

/** 向导模式 */
export type WizardMode = 'normal' | 'customize'

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
