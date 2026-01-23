import type { PetProfile, PetFormData, PetEnums, PetType } from '@/types/pet'
import { http } from '@/utils/http'

/**
 * 宠物相关 API 模块
 *
 * API路径设计: /account/pets (遵循 Google API 风格)
 */
export const petApi = {
  /**
   * 获取宠物列表
   */
  list() {
    return http<PetProfile[]>({
      method: 'GET',
      url: '/account/pets',
    })
  },

  /**
   * 获取宠物详情
   */
  get(petId: string) {
    return http<PetProfile>({
      method: 'GET',
      url: `/account/pets/${petId}`,
    })
  },

  /**
   * 创建宠物
   */
  create(data: PetFormData) {
    return http<PetProfile>({
      method: 'POST',
      url: '/account/pets',
      data,
    })
  },

  /**
   * 更新宠物
   */
  update(petId: string, data: Partial<PetFormData>) {
    return http<PetProfile>({
      method: 'PUT',
      url: `/account/pets/${petId}`,
      data,
    })
  },

  /**
   * 删除宠物
   */
  delete(petId: string) {
    return http<{ success: boolean }>({
      method: 'DELETE',
      url: `/account/pets/${petId}`,
    })
  },

  /**
   * 获取指定类型的枚举数据
   */
  getEnums(type: PetType) {
    return http<PetEnums>({
      method: 'GET',
      url: `/account/pets:enums`,
      data: { type },
    })
  },

  /**
   * 更新宠物排序
   */
  reorder(petIds: string[]) {
    return http<{ success: boolean }>({
      method: 'POST',
      url: '/account/pets:reorder',
      data: { petIds },
    })
  },
}
