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
// --- Account Auth APIs (/account/auth) ---

  // 微信小程序手机号登录 POST /account/auth/wx-phone
  if (
    url.match(/^\/account\/auth\/wx-phone$/) &&
    String(options.method || 'POST').toUpperCase() === 'POST'
  ) {
    return {
      code: '0',
      msg: 'ok',
      result: {
        mobile: '13888888888',
        token: 'mock-token-' + Date.now(),
        profile: {
          uid: '888',
          nickname: '盼眸用户',
          avatar: 'https://pcapi-xiaotuxian-front-devtest.itheima.net/miniapp/uploads/avatar_3.jpg',
          account: 'panmou_user',
          gender: '男',
          birthday: '1995-01-01',
          fullLocation: '北京市 市辖区 东城区',
          profession: '工程师',
        },
      },
    }
  }

  // 微信小程序静默登录 POST /account/auth/wx-silent
  if (
    url.match(/^\/account\/auth\/wx-silent$/) &&
    String(options.method || 'POST').toUpperCase() === 'POST'
  ) {
    return {
      code: '0',
      msg: 'ok',
      result: {
        mobile: '13888888888',
        token: 'mock-token-' + Date.now(),
        profile: {
          uid: '888',
          nickname: '盼眸用户',
          avatar: 'https://pcapi-xiaotuxian-front-devtest.itheima.net/miniapp/uploads/avatar_3.jpg',
          account: 'panmou_user',
          gender: '男',
        },
      },
    }
  }

  // 退出登录 POST /account/auth/logout
  if (
    url.match(/^\/account\/auth\/logout$/) &&
    String(options.method || 'POST').toUpperCase() === 'POST'
  ) {
    return { code: '0', msg: 'ok', result: null }
  }

  // --- Account Profile APIs (/account/profile) ---

  // 获取用户资料 GET /account/profile
  if (
    url.match(/^\/account\/profile$/) &&
    String(options.method || 'GET').toUpperCase() === 'GET'
  ) {
    return {
      code: '0',
      msg: 'ok',
      result: {
        uid: '888',
        nickname: '盼眸用户',
        avatar: 'https://pcapi-xiaotuxian-front-devtest.itheima.net/miniapp/uploads/avatar_3.jpg',
        account: 'panmou_user',
        gender: '男',
        birthday: '1995-01-01',
        fullLocation: '北京市 市辖区 东城区',
        profession: '工程师',
      },
    }
  }

  // 更新用户资料 PUT /account/profile
  if (
    url.match(/^\/account\/profile$/) &&
    String(options.method || 'PUT').toUpperCase() === 'PUT'
  ) {
    const data = (options.data as any) || {}
    return {
      code: '0',
      msg: 'ok',
      result: {
        uid: '888',
        nickname: data.nickname || '盼眸用户',
        avatar: 'https://pcapi-xiaotuxian-front-devtest.itheima.net/miniapp/uploads/avatar_3.jpg',
        account: 'panmou_user',
        gender: data.gender || '男',
        birthday: data.birthday || '1995-01-01',
        fullLocation: '北京市 市辖区 东城区',
        profession: data.profession || '工程师',
      },
    }
  }

  // 更新用户头像 PUT /account/profile/avatar
  if (
    url.match(/^\/account\/profile\/avatar$/) &&
    String(options.method || 'PUT').toUpperCase() === 'PUT'
  ) {
    const data = (options.data as any) || {}
    return {
      code: '0',
      msg: 'ok',
      result: {
        avatar:
          data.avatar ||
          'https://pcapi-xiaotuxian-front-devtest.itheima.net/miniapp/uploads/avatar_3.jpg',
      },
    }
  }

  // --- Legacy APIs (保持向后兼容) ---

  // 旧版登录 POST /login/wxMin
  if (url.match(/^\/login\/wxMin/) && String(options.method || 'POST').toUpperCase() === 'POST') {
    return {
      code: '0',
      msg: 'ok',
      result: {
        mobile: '13888888888',
        token: 'mock-token-' + Date.now(),
        profile: {
          uid: '888',
          nickname: '盼眸用户',
          avatar: 'https://pcapi-xiaotuxian-front-devtest.itheima.net/miniapp/uploads/avatar_3.jpg',
          account: 'panmou_user',
          gender: '男',
        },
      },
    }
  }

  // 旧版用户资料 GET /member/profile
  if (url.match(/^\/member\/profile/) && String(options.method || 'GET').toUpperCase() === 'GET') {
    return {
      code: '0',
      msg: 'ok',
      result: {
        uid: '888',
        nickname: '盼眸用户',
        avatar: 'https://pcapi-xiaotuxian-front-devtest.itheima.net/miniapp/uploads/avatar_3.jpg',
        account: 'panmou_user',
        gender: '男',
        birthday: '1995-01-01',
        fullLocation: '北京市 市辖区 东城区',
        profession: '工程师',
      },
    }
  }

  // 旧版用户资料 PUT /member/profile
  if (url.match(/^\/member\/profile/) && String(options.method || 'PUT').toUpperCase() === 'PUT') {
    const data = (options.data as any) || {}
    return {
      code: '0',
      msg: 'ok',
      result: {
        uid: '888',
        nickname: data.nickname || '盼眸用户',
        avatar: 'https://pcapi-xiaotuxian-front-devtest.itheima.net/miniapp/uploads/avatar_3.jpg',
        account: 'panmou_user',
        gender: data.gender || '男',
        birthday: data.birthday || '1995-01-01',
        fullLocation: '北京市 市辖区 东城区',
        profession: data.profession || '工程师',
      },
    }
  }

  
  return null;
}
