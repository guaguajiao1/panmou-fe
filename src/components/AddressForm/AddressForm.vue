<template>
  <view class="form-container">
    <view class="form-item">
      <text class="label">收货人</text>
      <input v-model="form.receiver" class="input" placeholder="请输入收货人姓名" />
    </view>

    <view class="form-item phone-row">
      <text class="label">手机号</text>
      <view class="phone-input">
        <picker mode="selector" :range="countryDisplayList" @change="onCodeChange">
          <view class="code-picker">{{ selectedDisplay }}</view>
        </picker>
        <input
          v-model="form.contact"
          class="input phone"
          placeholder="请输入手机号"
          type="number"
        />
      </view>
    </view>

    <view class="form-item">
      <text class="label">所在地区</text>
      <picker mode="region" @change="onRegionChange">
        <view class="input region">{{ displayRegion || '请选择所在地区' }}</view>
      </picker>
    </view>

    <view class="form-item">
      <text class="label">详细地址</text>
      <input v-model="form.address" class="input" placeholder="请输入街道、楼层、门牌号等" />
    </view>

    <view class="form-item default-row">
      <text class="label">设为默认地址</text>
      <switch
        :checked="form.isDefault === 1"
        color="#2c6fdb"
        @change="(e) => (form.isDefault = e.detail.value ? 1 : 0)"
      />
    </view>

    <button class="save-btn" type="primary" @click="onSave">{{ saveText }}</button>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { AddressParams } from '@/types/address'

// Props
const props = defineProps({
  addressData: { type: Object, default: () => ({}) },
  saveText: { type: String, default: '保存' },
})

const emit = defineEmits(['save'])

// 表单数据
const form = ref<AddressParams>({
  receiver: '',
  contact: '',
  provinceCode: '',
  cityCode: '',
  countyCode: '',
  address: '',
  isDefault: 0,
})

// 用于UI展示的地区名称
const displayRegion = ref('')

// Watch 外部传入 addressData，自动填充表单
watch(
  () => props.addressData,
  (newData) => {
    if (newData && Object.keys(newData).length) {
      form.value = {
        receiver: newData.receiver || '',
        contact: newData.contact || '',
        provinceCode: newData.provinceCode || '',
        cityCode: newData.cityCode || '',
        countyCode: newData.countyCode || '',
        address: newData.address || '',
        isDefault: newData.isDefault || 0,
      }
      if (newData.fullLocation) {
        displayRegion.value = newData.fullLocation.split(' ')[0]
      }
    }
  },
  { immediate: true, deep: true },
)

// 国家区号 (逻辑保持不变)
const countries = ref([{ name: '中国', code: '86' }]) // Simplified for example
const countryDisplayList = computed(() => countries.value.map((c) => `${c.name} +${c.code}`))
const selectedCode = ref('86')
const selectedDisplay = ref('中国 +86')
const onCodeChange = (e) => {
  const index = e.detail.value
  selectedDisplay.value = countryDisplayList.value[index]
  selectedCode.value = countries.value[index].code
}

// 所在地区选择
const onRegionChange = (e) => {
  // e.detail.value 是一个包含省市区名称的数组
  displayRegion.value = e.detail.value.join(' ')
  // e.detail.code 是一个包含省市区编码的数组
  const [provinceCode, cityCode, countyCode] = e.detail.code
  form.value.provinceCode = provinceCode
  form.value.cityCode = cityCode
  form.value.countyCode = countyCode
}

// 点击保存
const onSave = () => {
  // @ts-ignore
  emit('save', { ...form.value })
}
</script>

<style scoped>
/* 样式调整为类似 section-card */
.form-container {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 50rpx;
  font-size: 28rpx;
}
.form-item:last-child {
  margin-bottom: 0;
}

.label {
  width: 180rpx;
  color: #333;
}

.input {
  flex: 1;
  color: #333;
}

.region {
  color: #333;
}
.region[value=''] {
  color: #808080;
}

.phone-row .phone-input {
  display: flex;
  align-items: center;
  flex: 1;
}

.code-picker {
  padding-right: 20rpx;
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
  background-color: #2c6fdb;
  color: #fff;
  font-size: 30rpx;
  margin-top: 40rpx;
  border-radius: 50rpx;
  height: 90rpx;
  line-height: 90rpx;
}
</style>
