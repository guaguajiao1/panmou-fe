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
// --- Address APIs (/account/addresses) ---
  if (url === '/account/addresses' && String(options.method || 'GET').toUpperCase() === 'GET') {
    return { code: '0', msg: 'ok', result: clone(addresses) }
  }

  if (url === '/account/addresses' && String(options.method || 'POST').toUpperCase() === 'POST') {
    const body = (options.data as any) || {}
    const id = Date.now()
    const item = { ...body }
    item.id = id.toString()
    if (item.isDefault) addresses.forEach((a) => (a.isDefault = 1))
    addresses.push(item)
    console.log('Address created:', item)
    return { code: '0', msg: 'created', result: item }
  }

  if (
    url.match(/^\/account\/addresses\/\d+$/) &&
    String(options.method || 'GET').toUpperCase() === 'GET'
  ) {
    const id = url.split('/').pop()
    const found = addresses.find((a) => a.id === id)
    if (found) return { code: '0', msg: 'ok', result: clone(found) }
    return { code: '1', msg: 'not found', result: null }
  }

  if (
    url.match(/^\/account\/addresses\/\d+$/) &&
    String(options.method || 'PUT').toUpperCase() === 'PUT'
  ) {
    const id = url.split('/').pop()
    const idx = addresses.findIndex((a) => a.id === id)
    if (idx === -1) return { code: '1', msg: 'not found', result: null }
    const body = (options.data as any) || {}
    addresses[idx] = { ...addresses[idx], ...body }
    if (addresses[idx].isDefault)
      addresses.forEach((a, i) => {
        if (i !== idx) a.isDefault = 1
      })
    return { code: '0', msg: 'updated', result: clone(addresses[idx]) }
  }

  if (
    url.match(/^\/account\/addresses\/\d+$/) &&
    String(options.method || 'DELETE').toUpperCase() === 'DELETE'
  ) {
    const id = url.split('/').pop()
    const idx = addresses.findIndex((a) => a.id === id)
    if (idx === -1) return { code: '1', msg: 'not found', result: null }
    const removed = addresses.splice(idx, 1)[0]
    if (removed.isDefault && addresses.length > 0) addresses[0].isDefault = 1
    console.log('Address deleted:', removed)
    console.log('Remaining addresses:', addresses)
    return { code: '0', msg: 'deleted', result: clone(removed) }
  }

  
// --- Pet Enum Data ---
  const petEnumsData: Record<string, PetEnums> = {
    dog: {
      breeds: [
        { id: 'breed_d1', name: '金毛寻回犬' },
        { id: 'breed_d2', name: '拉布拉多' },
        { id: 'breed_d3', name: '柴犬' },
        { id: 'breed_d4', name: '边境牧羊犬' },
        { id: 'breed_d5', name: '萨摩耶' },
        { id: 'breed_d6', name: '哈士奇' },
        { id: 'breed_d7', name: '泰迪' },
        { id: 'breed_d8', name: '柯基' },
        { id: 'breed_d9', name: '德国牧羊犬' },
        { id: 'breed_d10', name: '其他' },
      ],
      foodAllergens: [
        { id: 'fa_d1', name: '鸡肉' },
        { id: 'fa_d2', name: '牛肉' },
        { id: 'fa_d3', name: '羊肉' },
        { id: 'fa_d4', name: '小麦' },
        { id: 'fa_d5', name: '玉米' },
        { id: 'fa_d6', name: '大豆' },
        { id: 'fa_d7', name: '乳制品' },
        { id: 'fa_d8', name: '鸡蛋' },
      ],
      medications: [
        { id: 'med_d1', name: '体内驱虫药' },
        { id: 'med_d2', name: '体外驱虫药' },
        { id: 'med_d3', name: '抗生素' },
        { id: 'med_d4', name: '消炎药' },
        { id: 'med_d5', name: '关节保健品' },
        { id: 'med_d6', name: '心脏病药物' },
        { id: 'med_d7', name: '皮肤病药物' },
      ],
      drugAllergens: [
        { id: 'da_d1', name: '青霉素类' },
        { id: 'da_d2', name: '磺胺类' },
        { id: 'da_d3', name: '阿司匹林' },
        { id: 'da_d4', name: '布洛芬' },
      ],
      healthIssues: [
        { id: 'hi_d1', name: '关节炎' },
        { id: 'hi_d2', name: '肥胖' },
        { id: 'hi_d3', name: '心脏病' },
        { id: 'hi_d4', name: '皮肤病' },
        { id: 'hi_d5', name: '肠胃问题' },
        { id: 'hi_d6', name: '癫痫' },
        { id: 'hi_d7', name: '糖尿病' },
        { id: 'hi_d8', name: '肝脏问题' },
      ],
    },
    cat: {
      breeds: [
        { id: 'breed_c1', name: '英国短毛猫' },
        { id: 'breed_c2', name: '美国短毛猫' },
        { id: 'breed_c3', name: '布偶猫' },
        { id: 'breed_c4', name: '波斯猫' },
        { id: 'breed_c5', name: '暹罗猫' },
        { id: 'breed_c6', name: '缅因猫' },
        { id: 'breed_c7', name: '橘猫' },
        { id: 'breed_c8', name: '狸花猫' },
        { id: 'breed_c9', name: '折耳猫' },
        { id: 'breed_c10', name: '其他' },
      ],
      foodAllergens: [
        { id: 'fa_c1', name: '鱼类' },
        { id: 'fa_c2', name: '牛肉' },
        { id: 'fa_c3', name: '乳制品' },
        { id: 'fa_c4', name: '小麦' },
        { id: 'fa_c5', name: '玉米' },
        { id: 'fa_c6', name: '鸡蛋' },
      ],
      medications: [
        { id: 'med_c1', name: '体内驱虫药' },
        { id: 'med_c2', name: '体外驱虫药' },
        { id: 'med_c3', name: '抗生素' },
        { id: 'med_c4', name: '消炎药' },
        { id: 'med_c5', name: '泌尿系统药物' },
        { id: 'med_c6', name: '甲状腺药物' },
      ],
      drugAllergens: [
        { id: 'da_c1', name: '青霉素类' },
        { id: 'da_c2', name: '磺胺类' },
        { id: 'da_c3', name: '阿莫西林' },
      ],
      healthIssues: [
        { id: 'hi_c1', name: '泌尿问题' },
        { id: 'hi_c2', name: '肥胖' },
        { id: 'hi_c3', name: '肾脏问题' },
        { id: 'hi_c4', name: '甲状腺问题' },
        { id: 'hi_c5', name: '口腔问题' },
        { id: 'hi_c6', name: '糖尿病' },
        { id: 'hi_c7', name: '皮肤病' },
      ],
    },
  }

  // 初始化 Mock 宠物数据
  if (pets.size === 0) {
    const now = new Date()
    const pet1: PetProfile = {
      id: 'pet_001',
      avatar: 'https://placehold.co/200x200/f0ad4e/fff?text=旺财',
      name: '旺财',
      type: 'dog',
      breedId: 'breed_d1',
      breedName: '金毛寻回犬',
      birthday: '2020-03-15',
      gender: 'male',
      neutered: true,
      // 新增字段
      currentWeight: 28,
      idealWeight: 26,
      bodyCondition: 'chubby',
      activityLevel: 'moderate',
      pickyLevel: 'foodie',
      hasFoodAllergies: false,
      foodAllergyIds: [],
      onMedication: true,
      medicationIds: ['med_d1'],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: false,
      healthIssueIds: [],
      sortOrder: 0,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    }
    const pet2: PetProfile = {
      id: 'pet_002',
      avatar: 'https://placehold.co/200x200/5cb85c/fff?text=咪咪',
      name: '咪咪',
      type: 'cat',
      breedId: 'breed_c1',
      breedName: '英国短毛猫',
      birthday: '2021-08-20',
      gender: 'female',
      neutered: true,
      hasFoodAllergies: true,
      foodAllergyIds: ['fa_c1'],
      onMedication: false,
      medicationIds: [],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: false,
      healthIssueIds: [],
      sortOrder: 1,
      createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    }
    const pet3: PetProfile = {
      id: 'pet_003',
      avatar: 'https://placehold.co/200x200/0275d8/fff?text=大黄',
      name: '大黄',
      type: 'dog',
      breedId: 'breed_d3',
      breedName: '柴犬',
      birthday: '2019-06-10',
      gender: 'male',
      neutered: false,
      hasFoodAllergies: false,
      foodAllergyIds: [],
      onMedication: false,
      medicationIds: [],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: false,
      healthIssueIds: [],
      sortOrder: 2,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const pet4: PetProfile = {
      id: 'pet_004',
      avatar: 'https://placehold.co/200x200/d9534f/fff?text=小白',
      name: '小白',
      type: 'cat',
      breedId: 'breed_c3',
      breedName: '布偶猫',
      birthday: '2022-01-05',
      gender: 'female',
      neutered: true,
      hasFoodAllergies: false,
      foodAllergyIds: [],
      onMedication: false,
      medicationIds: [],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: false,
      healthIssueIds: [],
      sortOrder: 3,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const pet5: PetProfile = {
      id: 'pet_005',
      avatar: 'https://placehold.co/200x200/5bc0de/fff?text=豆豆',
      name: '豆豆',
      type: 'dog',
      breedId: 'breed_d7',
      breedName: '泰迪',
      birthday: '2021-11-20',
      gender: 'male',
      neutered: true,
      hasFoodAllergies: true,
      foodAllergyIds: ['fa_d1'],
      onMedication: false,
      medicationIds: [],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: false,
      healthIssueIds: [],
      sortOrder: 4,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const pet6: PetProfile = {
      id: 'pet_006',
      avatar: 'https://placehold.co/200x200/f7a35c/fff?text=橘子',
      name: '橘子',
      type: 'cat',
      breedId: 'breed_c7',
      breedName: '橘猫',
      birthday: '2020-09-15',
      gender: 'male',
      neutered: false,
      hasFoodAllergies: false,
      foodAllergyIds: [],
      onMedication: false,
      medicationIds: [],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: true,
      healthIssueIds: ['hi_c2'],
      sortOrder: 5,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const pet7: PetProfile = {
      id: 'pet_007',
      avatar: 'https://placehold.co/200x200/6f42c1/fff?text=二哈',
      name: '二哈',
      type: 'dog',
      breedId: 'breed_d6',
      breedName: '哈士奇',
      birthday: '2018-04-01',
      gender: 'male',
      neutered: true,
      hasFoodAllergies: false,
      foodAllergyIds: [],
      onMedication: true,
      medicationIds: ['med_d5'],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: true,
      healthIssueIds: ['hi_d1'],
      sortOrder: 6,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const pet8: PetProfile = {
      id: 'pet_008',
      avatar: 'https://placehold.co/200x200/e83e8c/fff?text=花花',
      name: '花花',
      type: 'cat',
      breedId: 'breed_c8',
      breedName: '狸花猫',
      birthday: '2019-12-25',
      gender: 'female',
      neutered: true,
      hasFoodAllergies: false,
      foodAllergyIds: [],
      onMedication: false,
      medicationIds: [],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: false,
      healthIssueIds: [],
      sortOrder: 7,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const pet9: PetProfile = {
      id: 'pet_009',
      avatar: 'https://placehold.co/200x200/20c997/fff?text=毛毛',
      name: '毛毛',
      type: 'dog',
      breedId: 'breed_d5',
      breedName: '萨摩耶',
      birthday: '2020-07-07',
      gender: 'female',
      neutered: false,
      hasFoodAllergies: false,
      foodAllergyIds: [],
      onMedication: false,
      medicationIds: [],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: false,
      healthIssueIds: [],
      sortOrder: 8,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const pet10: PetProfile = {
      id: 'pet_010',
      avatar: 'https://placehold.co/200x200/fd7e14/fff?text=阿福',
      name: '阿福',
      type: 'dog',
      breedId: 'breed_d8',
      breedName: '柯基',
      birthday: '2021-03-18',
      gender: 'male',
      neutered: true,
      hasFoodAllergies: false,
      foodAllergyIds: [],
      onMedication: false,
      medicationIds: [],
      hasDrugAllergies: false,
      drugAllergyIds: [],
      hasHealthIssues: false,
      healthIssueIds: [],
      sortOrder: 9,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    pets.set(pet1.id, pet1)
    pets.set(pet2.id, pet2)
    pets.set(pet3.id, pet3)
    pets.set(pet4.id, pet4)
    pets.set(pet5.id, pet5)
    pets.set(pet6.id, pet6)
    pets.set(pet7.id, pet7)
    pets.set(pet8.id, pet8)
    pets.set(pet9.id, pet9)
    pets.set(pet10.id, pet10)
  }

  // --- Pet APIs (/account/pets) ---

  // GET /account/pets - 获取宠物列表
  if (url.match(/^\/account\/pets$/) && String(options.method || 'GET').toUpperCase() === 'GET') {
    const petList = Array.from(pets.values()).sort((a, b) => a.sortOrder - b.sortOrder)
    return { code: '0', msg: 'ok', result: clone(petList) }
  }

  // GET /account/pets:enums - 获取枚举数据
  if (
    url.match(/^\/account\/pets:enums/) &&
    String(options.method || 'GET').toUpperCase() === 'GET'
  ) {
    const data = (options.data as any) || {}
    const type = data.type || 'dog'
    const enums = petEnumsData[type] || petEnumsData.dog
    return { code: '0', msg: 'ok', result: clone(enums) }
  }

  // POST /account/pets:reorder - 更新排序
  if (
    url.match(/^\/account\/pets:reorder$/) &&
    String(options.method || 'POST').toUpperCase() === 'POST'
  ) {
    const data = (options.data as any) || {}
    const petIds: string[] = data.petIds || []
    petIds.forEach((id, index) => {
      const pet = pets.get(id)
      if (pet) {
        pet.sortOrder = index
        pets.set(id, pet)
      }
    })
    return { code: '0', msg: 'ok', result: { success: true } }
  }

  // GET /account/pets/{petId} - 获取宠物详情
  const petDetailMatch = url.match(/^\/account\/pets\/([^/:]+)$/)
  if (petDetailMatch && String(options.method || 'GET').toUpperCase() === 'GET') {
    const petId = petDetailMatch[1]
    const pet = pets.get(petId)
    if (!pet) return { code: '1', msg: '宠物不存在', result: null }
    return { code: '0', msg: 'ok', result: clone(pet) }
  }

  // POST /account/pets - 创建宠物
  if (url.match(/^\/account\/pets$/) && String(options.method || 'POST').toUpperCase() === 'POST') {
    const data = (options.data as any) || {}
    const now = new Date()
    const newPet: PetProfile = {
      id: `pet_${Date.now()}`,
      avatar: data.avatar || 'https://placehold.co/200x200/999/fff?text=Pet',
      name: data.name || '未命名',
      type: data.type || 'dog',
      breedId: data.breedId || '',
      breedName: '',
      birthday: data.birthday || '',
      gender: data.gender || 'male',
      neutered: data.neutered || false,
      hasFoodAllergies: data.hasFoodAllergies || false,
      foodAllergyIds: data.foodAllergyIds || [],
      onMedication: data.onMedication || false,
      medicationIds: data.medicationIds || [],
      hasDrugAllergies: data.hasDrugAllergies || false,
      drugAllergyIds: data.drugAllergyIds || [],
      hasHealthIssues: data.hasHealthIssues || false,
      healthIssueIds: data.healthIssueIds || [],
      sortOrder: pets.size,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    // 设置品种名称
    const enums = petEnumsData[newPet.type] || petEnumsData.dog
    const breed = enums.breeds.find((b) => b.id === newPet.breedId)
    if (breed) newPet.breedName = breed.name
    pets.set(newPet.id, newPet)
    return { code: '0', msg: 'ok', result: clone(newPet) }
  }

  // PUT /account/pets/{petId} - 更新宠物
  if (petDetailMatch && String(options.method || 'PUT').toUpperCase() === 'PUT') {
    const petId = petDetailMatch[1]
    const pet = pets.get(petId)
    if (!pet) return { code: '1', msg: '宠物不存在', result: null }
    const data = (options.data as any) || {}
    const updatedPet: PetProfile = {
      ...pet,
      ...data,
      id: pet.id,
      sortOrder: pet.sortOrder,
      createdAt: pet.createdAt,
      updatedAt: new Date().toISOString(),
    }
    // 设置品种名称
    const enums = petEnumsData[updatedPet.type] || petEnumsData.dog
    const breed = enums.breeds.find((b) => b.id === updatedPet.breedId)
    if (breed) updatedPet.breedName = breed.name
    pets.set(petId, updatedPet)
    return { code: '0', msg: 'ok', result: clone(updatedPet) }
  }

  // DELETE /account/pets/{petId} - 删除宠物
  if (petDetailMatch && String(options.method || 'DELETE').toUpperCase() === 'DELETE') {
    const petId = petDetailMatch[1]
    if (!pets.has(petId)) return { code: '1', msg: '宠物不存在', result: null }
    pets.delete(petId)
    return { code: '0', msg: 'ok', result: { success: true } }
  }

  
  return null;
}
