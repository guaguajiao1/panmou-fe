import type { AddressItem, AddressParams } from '@/types/address'
import { http } from '@/utils/http'

/**
 * 账户相关的API请求 - 收货地址模块
 *
 * API路径设计: /account/addresses
 * 版本前缀 /v1 由请求拦截器统一处理
 */
export const addressApi = {
  /**
   * 获取当前账户的收货地址列表
   */
  list() {
    return http<AddressItem[]>({
      method: 'GET',
      url: '/account/addresses',
    })
  },

  /**
   * 为当前账户添加新的收货地址
   * @param data 地址信息
   */
  create(data: AddressParams) {
    return http({
      method: 'POST',
      url: '/account/addresses',
      data,
    })
  },

  /**
   * 获取当前账户的指定收货地址详情
   * @param id 地址的唯一标识ID
   */
  getById(id: string) {
    return http<AddressItem>({
      method: 'GET',
      url: `/account/addresses/${id}`,
    })
  },

  /**
   * 修改当前账户的指定收货地址
   * @param id 地址的唯一标识ID
   * @param data 要更新的地址信息
   */
  update(id: string, data: AddressParams) {
    return http({
      method: 'PUT', // 使用PUT更新
      url: `/account/addresses/${id}`,
      data,
    })
  },

  /**
   * 删除当前账户的指定收货地址
   * @param id 地址的唯一标识ID
   */
  delete(id: string) {
    return http({
      method: 'DELETE',
      url: `/account/addresses/${id}`,
    })
  },
}

// --- 使用方式 ---
// import { addressApi } from '@/api/address' // 假设文件路径
//
// // 获取列表
// const addressList = await addressApi.list()
//
// // 创建地址
// await addressApi.create({ ... })
//
// // 删除ID为 '123' 的地址
// await addressApi.delete('123')
