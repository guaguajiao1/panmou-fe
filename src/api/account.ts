import type { LoginResult, Profile, ProfileParams } from '@/types/account'
import { http } from '@/utils/http'

// --- 为函数参数定义类型别名，使代码更清晰 ---

/** 微信小程序登录参数 */
type WxLoginParams = {
  /** 微信获取手机号的 code */
  code: string
}

/**
 * 账户相关的API请求 - 认证与用户资料模块
 *
 * API路径设计: /account
 * - 登录相关: /account/auth
 * - 用户资料: /account/profile
 */
export const accountApi = {
  // ==================== 认证相关 ====================

  /**
   * 微信小程序手机号登录
   * 使用微信 getPhoneNumber 获取的 code 进行登录
   * @param params 登录参数
   */
  loginByWxPhone(params: WxLoginParams) {
    return http<LoginResult>({
      method: 'POST',
      url: '/account/auth/wx-phone',
      data: params,
    })
  },

  /**
   * 微信小程序静默登录
   * 使用 wx.login 获取的 code 进行静默登录
   * @param params 登录参数
   */
  loginByWxSilent(params: WxLoginParams) {
    return http<LoginResult>({
      method: 'POST',
      url: '/account/auth/wx-silent',
      data: params,
    })
  },

  /**
   * 退出登录
   */
  logout() {
    return http<void>({
      method: 'POST',
      url: '/account/auth/logout',
    })
  },

  // ==================== 用户资料 ====================

  /**
   * 获取当前用户资料
   */
  getProfile() {
    return http<Profile>({
      method: 'GET',
      url: '/account/profile',
    })
  },

  /**
   * 更新当前用户资料
   * @param data 要更新的资料字段
   */
  updateProfile(data: ProfileParams) {
    return http<Profile>({
      method: 'PUT',
      url: '/account/profile',
      data,
    })
  },

  /**
   * 更新用户头像
   * @param avatarUrl 新头像的URL
   */
  updateAvatar(avatarUrl: string) {
    return http<{ avatar: string }>({
      method: 'PUT',
      url: '/account/profile/avatar',
      data: { avatar: avatarUrl },
    })
  },
}
