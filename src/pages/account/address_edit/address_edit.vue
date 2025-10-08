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

// 模拟 API 获取详情
const fetchAddressDetail = (id) => {
  uni.showLoading({ title: '加载中...' })
  setTimeout(() => {
    const mockData = {
      id: id,
      name: '张三',
      phone: '13800138000',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      details: '科技园路1号',
      isDefault: true,
    }
    addressDetail.value = mockData
    uni.hideLoading()
  }, 500)
}

// 点击取消按钮返回
const onCancel = () => {
  uni.navigateBack()
}

// 处理保存事件
const handleSave = (formData) => {
  console.log('页面接收到保存事件，数据为:', formData)
  uni.showLoading({ title: '保存中...' })

  // 模拟保存请求
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: '保存成功', icon: 'success' })

    // ✅ 延时返回上一页，让 toast 显示更自然
    setTimeout(() => {
      uni.navigateBack()
    }, 800)
  }, 500)
}
</script>

<style lang="scss" scoped>
.page-container {
  background-color: #f7f8fa;
  min-height: 100vh;
}
</style>
