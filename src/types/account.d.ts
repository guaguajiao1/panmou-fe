export type LoginResult = {
  /** 手机号 */
  mobile: string
  /** auth token*/
  token: string

  profile: Profile
}

/** 个人资料 */
export type Profile = {
  /** 用户ID */
  uid: string
  /** 昵称 */
  nickname: string
  /** 头像  */
  avatar: string
  /** 账户名  */
  account: string
  /** 性别 */
  gender?: Gender
  /** 生日 */
  birthday?: string
  /** 省市区 */
  fullLocation?: string
  /** 职业 */
  profession?: string
}
/** 性别 */
export type Gender = '保密' | '女' | '男'

/** 修改个人资料request */
export type UpdateProfileRequest = Pick<
  Profile,
  'nickname' | 'gender' | 'birthday' | 'profession'
> & {
  /** 省份编码 */
  provinceCode?: string
  /** 城市编码 */
  cityCode?: string
  /** 区/县编码 */
  countyCode?: string
}

/** ProfileParams 别名 */
export type ProfileParams = UpdateProfileRequest
