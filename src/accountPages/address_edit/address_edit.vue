<template>
  <view class="address-edit-page">
    <CustomNavigationBar :title="title"></CustomNavigationBar>
    <AddressForm :address-data="formData" @save="onSave" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AddressForm from '@/components/AddressForm/AddressForm.vue'
import { addressApi } from '@/api/address'
import type { AddressItem } from '@/types/address'
import { useAddressStore } from '@/stores/modules/address'

const formData = ref<Partial<AddressItem>>({})
const pageSource = ref('')
const addressStore = useAddressStore()
const title = ref('')

// 页面加载时，获取ID和来源
onLoad(async (options) => {
  if (options) {
    pageSource.value = options.source || ''
    const addressId = options.id
    // 如果有 id，说明是编辑模式，需要获取地址详情
    if (addressId) {
      title.value = '编辑地址'
      await getAddressDetail(addressId)
    } else {
      title.value = '新建地址'
    }
  }
})

// 获取地址详情（编辑时调用）
const getAddressDetail = async (id: string) => {
  uni.showLoading({ title: '加载中...' })
  try {
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
const onSave = async (data: AddressItem) => {
  const addressId = formData.value.id

  uni.showLoading({ title: '保存中...' })
  try {
    if (addressId) {
      // 编辑地址
      const res = await addressApi.update(addressId, data)
      if (res.code === '0') {
        handleSaveSuccess(res.result as AddressItem)
      } else {
        uni.showToast({ icon: 'none', title: res.msg || '保存失败' })
      }
    } else {
      // 新建地址
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
  if (pageSource.value === 'checkout' || pageSource.value === 'subscription') {
    // 更新 Pinia store 中的地址
    addressStore.changeSelectedAddress(savedAddress)
    console.log('Address saved and selected in store. savedAddress=', savedAddress)
    uni.navigateBack({ delta: 2 })
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
