<template>
  <view class="form-container">
    <view class="form-item">
      <text class="label required">收货人</text>
      <input
        v-model.trim="form.receiver"
        class="input"
        placeholder="请输入收货人姓名"
        :maxlength="25"
      />
    </view>

    <view class="form-item phone-row">
      <text class="label required">手机号</text>
      <view class="phone-input">
        <picker mode="selector" :range="countryDisplayList" @change="onCodeChange">
          <view class="code-picker">{{ selectedDisplay }}</view>
        </picker>
        <input
          v-model.trim="form.contact"
          class="input phone"
          placeholder="请输入手机号"
          type="number"
          :maxlength="11"
        />
      </view>
    </view>

    <view class="form-item">
      <text class="label required">所在地区</text>
      <picker mode="region" @change="onRegionChange">
        <view class="input region" :class="{ 'placeholder-color': !form.fullLocation }">
          {{ form.fullLocation || '请选择所在地区' }}
        </view>
      </picker>
    </view>

    <view class="form-item">
      <text class="label required">详细地址</text>
      <input
        v-model.trim="form.address"
        class="input"
        placeholder="请输入街道、楼层、门牌号等"
        :maxlength="120"
      />
    </view>

    <view class="form-item default-row">
      <text class="label">设为默认地址</text>
      <switch
        :checked="form.isDefault === 1"
        :color="uniColorPrimary"
        @change="(e) => (form.isDefault = e.detail.value ? 1 : 0)"
      />
    </view>

    <button class="save-btn" type="primary" @click="onSave">
      {{ saveText }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { AddressItem } from '@/types/address'

// 用于 v-bind:color 的 JS 变量
// (这个值需要与 uni.scss 中的 $uni-color-primary 保持一致)
const uniColorPrimary = '#004a99'

// Props
const props = defineProps({
  addressData: { type: Object, default: () => ({}) },
  saveText: { type: String, default: '保存' },
})

const emit = defineEmits(['save'])

// 表单数据
const form = ref<AddressItem>({
  id: '',
  receiver: '',
  contact: '',
  provinceCode: '',
  cityCode: '',
  countyCode: '',
  address: '',
  isDefault: 0,
  fullLocation: '',
})

// Watch
watch(
  () => props.addressData,
  (newData) => {
    if (newData && Object.keys(newData).length) {
      form.value = {
        id: newData.id || '',
        receiver: newData.receiver || '',
        contact: newData.contact || '',
        provinceCode: newData.provinceCode || '',
        cityCode: newData.cityCode || '',
        countyCode: newData.countyCode || '',
        address: newData.address || '',
        isDefault: newData.isDefault || 0,
        fullLocation: newData.fullLocation || '',
      }
      if (newData.fullLocation) {
        form.value.fullLocation = newData.fullLocation
      } else if (newData.provinceCode) {
        form.value.fullLocation = '请重新选择地区'
      }
    } else {
      // 重置表单
      form.value = {
        id: '',
        receiver: '',
        contact: '',
        provinceCode: '',
        cityCode: '',
        countyCode: '',
        address: '',
        isDefault: 0,
        fullLocation: '',
      }
    }
  },
  { immediate: true, deep: true },
)

// 国家区号
const countries = ref([{ name: '中国', code: '86' }])
const countryDisplayList = computed(() => countries.value.map((c) => `${c.name} +${c.code}`))
const selectedCode = ref('86')
const selectedDisplay = ref('中国 +86')
const onCodeChange = (e: any) => {
  const index = e.detail.value
  selectedDisplay.value = countryDisplayList.value[index]
  selectedCode.value = countries.value[index].code
}

// 所在地区选择
const onRegionChange = (e: any) => {
  // e.detail.value 是一个包含省市区名称的数组
  form.value.fullLocation = e.detail.value.join(' ')
  // e.detail.code 是一个包含省市区编码的数组
  const [provinceCode, cityCode, countyCode] = e.detail.code
  form.value.provinceCode = provinceCode
  form.value.cityCode = cityCode
  form.value.countyCode = countyCode
}

// ---- 表单校验逻辑 ----
const validateReceiver = computed(() => {
  const len = form.value.receiver.trim().length
  return len > 0 && len <= 25
})

const validateContact = computed(() => {
  const phone = form.value.contact.trim()
  if (selectedCode.value === '86') {
    return /^[1][3-9]\d{9}$/.test(phone)
  }
  return phone.length > 0
})

const validateRegion = computed(() => {
  return form.value.provinceCode && form.value.cityCode && form.value.countyCode
})

const validateAddress = computed(() => {
  const address = form.value.address.trim()
  const len = address.length
  if (len < 2 || len > 120) {
    return false
  }

  const illegalCharRegex = /[^\u4e00-\u9fa5\w\s-#\uff08\uff09()]/g

  if (illegalCharRegex.test(address)) {
    return false
  }
  return true
})

// 点击保存
const onSave = () => {
  if (!validateReceiver.value) {
    uni.showToast({ title: '收货人姓名需1-25个字', icon: 'none' })
    return
  }
  if (!validateContact.value) {
    uni.showToast({ title: '请输入正确的11位手机号', icon: 'none' })
    return
  }
  if (!validateRegion.value) {
    uni.showToast({ title: '请选择所在地区', icon: 'none' })
    return
  }
  if (!validateAddress.value) {
    uni.showToast({ title: '详细地址需2-120字且不含特殊符号', icon: 'none' })
    return
  }

  // @ts-ignore
  emit('save', { ...form.value })
}
</script>

<style lang="scss" scoped>
/* 样式调整为类似 section-card */
.form-container {
  background-color: $uni-bg-color;
  border-radius: $uni-spacing-col-base;
  padding: $uni-spacing-row-lg;
  margin-bottom: $uni-spacing-row-base;
}

.form-item {
  display: flex;
  align-items: center;
  padding: $uni-spacing-row-base 0;
  font-size: $uni-font-size-base;
  border-bottom: 1rpx solid $uni-bg-color-grey;
}
.form-item.default-row,
.form-item:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
}
.form-item:nth-last-of-type(2) {
  padding-bottom: $uni-spacing-row-lg;
}

.label {
  width: 180rpx;
  color: $uni-text-color;
}

.label.required::before {
  content: '*';
  color: $uni-color-error;
  margin-right: 4rpx;
}

.input {
  flex: 1;
  color: $uni-text-color;
}

.region {
  color: $uni-text-color;
}
.region.placeholder-color {
  color: $uni-text-color-placeholder;
}

.phone-row .phone-input {
  display: flex;
  align-items: center;
  flex: 1;
}

.code-picker {
  padding-right: $uni-spacing-row-base;
  color: $uni-text-color;
}

.phone {
  flex: 1;
}

.default-row {
  justify-content: space-between;
}

.save-btn {
  width: 100%;
  background-color: $uni-color-primary;
  color: $uni-text-color-inverse;
  font-size: $uni-font-size-paragraph;
  margin-top: $uni-img-size-sm;
  border-radius: 50rpx;
  height: 90rpx;
  line-height: 90rpx;
  transition: opacity 0.3s;
  opacity: 1 !important;
}
</style>
