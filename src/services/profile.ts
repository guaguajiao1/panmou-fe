import type { Profile, UpdateProfileRequest } from '@/types/account'
import { http } from '@/utils/http'

/**
 * 获取个人信息
 */
export const getMemberProfileAPI = () => {
  return http<Profile>({
    method: 'GET',
    url: '/member/profile',
  })
}

/**
 * 修改个人信息
 * @param data 请求体参数
 */
export const putMemberProfileAPI = (data: UpdateProfileRequest) => {
  return http<Profile>({
    method: 'PUT',
    url: '/member/profile',
    data,
  })
}
