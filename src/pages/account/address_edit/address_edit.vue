<template>
  <view class="page-container">
    <!-- 顶部导航栏：带返回和取消 -->
    <uni-nav-bar
      left-icon="back"
      background-color="#fff"
      color="#007aff"
      :title="navTitle"
      @clickLeft="onCancel"
    />

    <!-- 地址表单组件 -->
    <AddressForm :address-data="addressDetail" :saveText="saveButtonText" @save="handleSave" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AddressForm from '@/components/AddressForm/AddressForm.vue'
import { http } from '@/utils/http'
import { useAddressStore } from '@/stores/modules/address'

const addressDetail = ref({})
const navTitle = ref('新建收货地址')
const saveButtonText = ref('保存')

// 页面加载逻辑
onLoad((options) => {
  if (options.id) {
    navTitle.value = '编辑收货地址'
    saveButtonText.value = '保存修改'
    fetchAddressDetail(options.id)
  } else {
    navTitle.value = '新建收货地址'
    saveButtonText.value = '保存'
  }
})

const addressStore = useAddressStore()

// Fetch detail from API (mocked in dev)
const fetchAddressDetail = async (id) => {
  uni.showLoading({ title: '加载中...' })
  try {
    const res = await http({ url: `/address/detail?id=${id}`, method: 'GET' })
    if (res && res.code === '0') {
      addressDetail.value = res.result || {}
    } else {
      addressDetail.value = {}
    }
  } catch (e) {
    console.warn('fetchAddressDetail error', e)
    addressDetail.value = {}
  }
  uni.hideLoading()
}
// 处理保存事件，从子组件 AddressForm 收到 formData
const handleSave = async (formData) => {
  uni.showLoading({ title: '保存中...' })
  try {
    const payload = {
      ...formData,
      region: formData.region,
    }
    const res = await http({ url: '/address/create', method: 'POST', data: payload })
    if (res && res.code === '0') {
      const created = res.result
      uni.hideLoading()
      uni.showToast({ title: '保存成功', icon: 'success' })
      addressStore.changeSelectedAddress(created)
      setTimeout(() => {
        uni.navigateBack()
      }, 600)
    } else {
      uni.hideLoading()
      uni.showToast({ title: res?.msg || '保存失败', icon: 'none' })
    }
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '保存失败', icon: 'none' })
    console.warn('save address error', e)
  }
}

function onCancel() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.page-container {
  background-color: #f7f8fa;
  min-height: 100vh;
}
</style>
