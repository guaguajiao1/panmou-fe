import type { LoginResult } from '@/types/account'
import { http } from '@/utils/http'

/**
 * 登录 API 集合
 */
export const loginApi = {
  /**
   * 微信小程序登录
   * @description 对应新版登录，使用 wx.login 获取的 code 或 getPhoneNumber 获取的 code
   * @param code 微信登录凭证或动态令牌
   */
  loginWxMin(code: string) {
    return http<LoginResult>({
      method: 'GET',
      url: '/login/wxMin',
      data: {
        code, // http 工具库会自动将 GET 请求的 data 转换为 query 参数
      },
    })
  },
}
