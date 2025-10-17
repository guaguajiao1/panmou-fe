<template>
  <view class="address-edit-page">
    <AddressForm :address-data="formData" @save="onSave" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AddressForm from '@/components/AddressForm/AddressForm.vue'
import { addressApi } from '@/api/address' // 导入 addressApi
import type { AddressItem, AddressParams } from '@/types/address'
import { useAddressStore } from '@/stores/modules/address'

const formData = ref<Partial<AddressItem>>({})
const pageSource = ref('') // 页面来源
const addressStore = useAddressStore()

// 页面加载时，获取ID和来源
onLoad(async (options) => {
  if (options) {
    pageSource.value = options.source || ''
    const addressId = options.id
    // 如果有 id，说明是编辑模式，需要获取地址详情
    if (addressId) {
      uni.setNavigationBarTitle({ title: '编辑地址' })
      await getAddressDetail(addressId)
    } else {
      uni.setNavigationBarTitle({ title: '新建地址' })
    }
  }
})

// 获取地址详情（编辑时调用）
const getAddressDetail = async (id: string) => {
  uni.showLoading({ title: '加载中...' })
  try {
    // 【重构】使用 addressApi.getById() 替代 http 请求
    const res = await addressApi.getById(id)
    if (res.code === '0') {
      formData.value = res.result
    } else {
      uni.showToast({ icon: 'none', title: res.msg || '加载失败' })
    }
  } catch (error) {
    uni.showToast({ icon: 'none', title: '加载失败' })
  } finally {
    uni.hideLoading()
  }
}

// 点击保存按钮的回调
const onSave = async (data: AddressParams) => {
  const addressId = formData.value.id

  uni.showLoading({ title: '保存中...' })
  try {
    if (addressId) {
      // 编辑地址
      // 【重构】使用 addressApi.update() 替代 http 请求
      const res = await addressApi.update(addressId, data)
      if (res.code === '0') {
        handleSaveSuccess(res.result as AddressItem)
      } else {
        uni.showToast({ icon: 'none', title: res.msg || '保存失败' })
      }
    } else {
      // 新建地址
      // 【重构】使用 addressApi.create() 替代 http 请求
      const res = await addressApi.create(data)
      if (res.code === '0') {
        handleSaveSuccess(res.result as AddressItem)
      } else {
        uni.showToast({ icon: 'none', title: res.msg || '保存失败' })
      }
    }
  } catch (error) {
    uni.showToast({ icon: 'none', title: '保存失败' })
  } finally {
    uni.hideLoading()
  }
}

// 处理保存成功后的逻辑
const handleSaveSuccess = (savedAddress: AddressItem) => {
  uni.showToast({ icon: 'success', title: '保存成功' })

  // 如果来源是结算页，需要特殊处理
  if (pageSource.value === 'checkout') {
    // 更新 Pinia store 中的地址
    addressStore.changeSelectedAddress(savedAddress)
    // 根据是新建还是编辑，决定返回几层
    const delta = formData.value.id ? 1 : 2 // 编辑返回1层，新建返回2层
    uni.navigateBack({ delta })
  } else {
    // 其他情况，直接返回上一页（地址列表）
    uni.navigateBack()
  }
}
</script>

<style lang="scss" scoped>
.address-edit-page {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding: 20rpx;
  box-sizing: border-box;
}
</style>
