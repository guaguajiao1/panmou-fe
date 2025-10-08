<template>
  <view class="address-edit">
    <!-- 白色背景容器 -->
    <view class="form-container">
      <!-- 收货人 -->
      <view class="form-item">
        <text class="label">收货人</text>
        <input v-model="form.name" class="input" placeholder="请输入收货人姓名" />
      </view>

      <!-- 手机号 -->
      <view class="form-item phone-row">
        <text class="label">手机号</text>
        <view class="phone-input">
          <picker mode="selector" :range="countryDisplayList" @change="onCodeChange">
            <view class="code-picker">{{ selectedDisplay }}</view>
          </picker>
          <input
            v-model="form.phone"
            class="input phone"
            placeholder="请输入手机号"
            type="number"
          />
        </view>
      </view>

      <!-- 所在地区 -->
      <view class="form-item">
        <text class="label">所在地区</text>
        <picker mode="region" @change="onRegionChange">
          <view class="input region">{{ form.region || '请选择所在地区' }}</view>
        </picker>
      </view>

      <!-- 详细地址 -->
      <view class="form-item">
        <text class="label">详细地址</text>
        <input v-model="form.detail" class="input" placeholder="请输入街道、楼层、门牌号等" />
      </view>

      <!-- 设为默认地址 -->
      <view class="form-item default-row">
        <text class="label">设为默认地址</text>
        <switch
          :checked="form.isDefault"
          color="#007aff"
          @change="(e) => (form.isDefault = e.detail.value)"
        />
      </view>

      <!-- 保存按钮 -->
      <button class="save-btn" type="primary" @click="onSave">{{ saveText }}</button>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'

// Props
const props = defineProps({
  addressData: { type: Object, default: () => ({}) },
  saveText: { type: String, default: '保存' },
})

const emit = defineEmits(['save'])

// 表单数据
const form = ref({
  id: null,
  name: '',
  phone: '',
  region: '',
  detail: '',
  isDefault: false,
})

// 国家区号
const countries = ref([
  { name: '中国', code: '86' },
  { name: '美国', code: '1' },
  { name: '加拿大', code: '1' },
  { name: '日本', code: '81' },
  { name: '韩国', code: '82' },
  { name: '香港', code: '852' },
  { name: '澳门', code: '853' },
  { name: '台湾', code: '886' },
  { name: '新加坡', code: '65' },
  { name: '马来西亚', code: '60' },
  { name: '英国', code: '44' },
  { name: '德国', code: '49' },
  { name: '法国', code: '33' },
  { name: '意大利', code: '39' },
  { name: '西班牙', code: '34' },
  { name: '澳大利亚', code: '61' },
  { name: '新西兰', code: '64' },
  { name: '印度', code: '91' },
  { name: '印度尼西亚', code: '62' },
  { name: '泰国', code: '66' },
  { name: '菲律宾', code: '63' },
  { name: '越南', code: '84' },
  { name: '俄罗斯', code: '7' },
  { name: '巴西', code: '55' },
  { name: '墨西哥', code: '52' },
  { name: '南非', code: '27' },
])

const countryDisplayList = ref(countries.value.map((c) => `${c.name} +${c.code}`))
const selectedCode = ref('86')
const selectedDisplay = ref('中国 +86')

// 区号选择
const onCodeChange = (e) => {
  const index = e.detail.value
  selectedDisplay.value = countryDisplayList.value[index]
  selectedCode.value = countries.value[index].code
}

// 所在地区选择
const onRegionChange = (e) => {
  form.value.region = e.detail.value.join(' ')
}

// Watch 外部传入 addressData，自动填充表单
watch(
  () => props.addressData,
  (newData) => {
    if (newData && Object.keys(newData).length) {
      form.value.id = newData.id || null
      form.value.name = newData.name || ''
      form.value.phone = newData.phone || ''
      form.value.region =
        newData.province && newData.city && newData.district
          ? `${newData.province} ${newData.city} ${newData.district}`
          : ''
      form.value.detail = newData.details || ''
      form.value.isDefault = newData.isDefault || false

      // 更新国家区号显示
      selectedCode.value = newData.phonePrefix || '86'
      const country = countries.value.find((c) => c.code === selectedCode.value)
      selectedDisplay.value = country ? `${country.name} +${country.code}` : '中国 +86'
    }
  },
  { immediate: true, deep: true },
)

// 点击保存
const onSave = () => {
  emit('save', {
    ...form.value,
    phonePrefix: selectedCode.value,
  })
}
</script>

<style scoped>
.address-edit {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.form-container {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 50rpx;
}

.label {
  width: 180rpx;
  font-size: 28rpx;
  color: #000;
}

.input {
  flex: 1;
  font-size: 28rpx;
  color: #000;
}

.region {
  color: #000;
}

.phone-row .phone-input {
  display: flex;
  align-items: center;
  flex: 1;
}

.code-picker {
  padding-right: 20rpx;
  font-size: 28rpx;
  color: #000;
}

.phone {
  flex: 1;
}

.default-row {
  justify-content: space-between;
}

.save-btn {
  width: 100%;
  background-color: #007aff;
  color: #fff;
  font-size: 30rpx;
  margin-top: 40rpx;
  border-radius: 50rpx;
  height: 90rpx;
  line-height: 90rpx;
}
</style>
