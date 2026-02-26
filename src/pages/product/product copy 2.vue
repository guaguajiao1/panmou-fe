<template>
  <view class="product-detail-container">
    <view class="top-bar-fixed">
      <uni-icons
        class="close-icon"
        type="closeempty"
        size="22"
        color="#007aff"
        @click="goBack"
      ></uni-icons>
      <view class="search-bar">
        <uni-icons class="search-icon" type="search" size="18" color="#808080"></uni-icons>
        <text class="search-placeholder">搜索商品</text>
      </view>
      <view class="cart-icon-wrapper">
        <uni-icons type="cart" size="22" color="#007aff"></uni-icons>
      </view>
    </view>

    <view class="scroll-content">
      <swiper class="swiper" circular indicator-dots autoplay>
        <swiper-item v-for="(img, index) in data.product?.images" :key="index">
          <image class="product-img" :src="img" mode="aspectFit" />
        </swiper-item>
      </swiper>

      <view class="info">
        <text class="title">{{ data.product?.title }}</text>
        <text class="sales">已售 {{ data.product?.vagueSellCount }}</text>
      </view>

      <view v-if="allParams.length > 0" class="param-preview" @click="showParams = true">
        <view class="param-inline">
          <view v-for="(param, idx) in allParams" :key="idx" class="param-preview-item">
            <text class="param-name">{{ param.propertyName }}</text>
            <text class="param-value">{{ param.valueName }}</text>
          </view>
        </view>
        <view class="param-more">
          <text class="more-text"></text>
          <text class="arrow"></text>
        </view>
      </view>

      <view v-if="showParams" class="modal-overlay" @click="showParams = false">
        <view class="modal-sheet" @click.stop>
          <view class="sheet-header">
            <text class="sheet-title">商品参数</text>
            <text class="sheet-close" @click="showParams = false">关闭</text>
          </view>
          <scroll-view class="sheet-content" scroll-y>
            <view class="sheet-row" v-for="(p, idx) in allParams" :key="idx">
              <text class="sheet-name">{{ p.propertyName }}</text>
              <text class="sheet-value">{{ p.valueName }}</text>
            </view>
          </scroll-view>
        </view>
      </view>

      <view class="sku-section" v-for="prop in data.skuBase?.props" :key="prop.pid">
        <view class="sku-title">{{ prop.name }}</view>
        <view class="sku-values">
          <view
            v-for="val in sortValues(prop.values)"
            :key="val.vid"
            class="sku-value"
            :class="{ active: isSelected(prop.pid, val.vid) }"
            @click="selectSku(prop.pid, val.vid)"
          >
            {{ val.name }}
          </view>
        </view>
      </view>

      <view class="purchase-options">
        <view class="option-item subscribe-option" @click="purchaseType = 'subscribe'">
          <view class="radio-circle" :class="{ active: purchaseType === 'subscribe' }">
            <view class="radio-dot"></view>
          </view>
          <view class="option-details">
            <view class="detail-line line-1">
              <uni-icons type="refreshempty" size="18" color="#333"></uni-icons>
              <text class="subscribe-title">订阅</text>
              <view class="tags">
                <text class="tag">简单</text>
                <text class="tag">重复发送</text>
              </view>
            </view>
            <view class="detail-line">
              <text class="price-large">￥{{ subscriptionPrice }}</text>
              <text class="price-label">这次订单</text>
            </view>
            <view class="detail-line">
              <text class="discount-tag">优惠50%</text>
              <text class="discount-desc">第一次订阅订单</text>
            </view>
            <view class="divider"></view>
            <view class="detail-line line-5">
              <text class="future-price">￥{{ futurePrice }} (-5%)</text>
              <text class="future-label">未来订单</text>
            </view>
            <view class="benefits-list">
              <text class="benefit-item">每一单持续优惠5%</text>
              <text class="benefit-item">获取快递在日历</text>
              <text class="benefit-item">随时跳过、修改、取消</text>
            </view>
          </view>
        </view>

        <view class="option-item" @click="purchaseType = 'onetime'">
          <view class="radio-circle" :class="{ active: purchaseType === 'onetime' }">
            <view class="radio-dot"></view>
          </view>
          <view class="option-content">
            <view class="option-title">
              <text class="title-text">买一次</text>
              <text class="price-text"
                >￥{{ selectedSkuPrice > 0 ? selectedSkuPrice.toFixed(2) : '--' }}</text
              >
            </view>
          </view>
        </view>

        <view class="quantity-selector">
          <text class="quantity-label">数量</text>
          <view class="stepper">
            <button
              class="stepper-btn"
              @click="decreaseQuantity"
              :disabled="quantity <= minQuantity"
            >
              -
            </button>
            <input class="stepper-input" type="number" v-model="quantity" @blur="onQuantityBlur" />
            <button
              class="stepper-btn"
              @click="increaseQuantity"
              :disabled="quantity >= maxQuantity"
            >
              +
            </button>
          </view>
        </view>
      </view>

      <view class="dog-info">
        <view class="dog-title">请向我们介绍你的狗狗</view>
        <view class="dog-field">
          <text class="field-label">狗名字</text>
          <input
            class="form-input"
            :class="{ 'is-error': dogInfoErrors.name }"
            v-model="dogInfo.name"
            placeholder="请输入狗狗的名字"
          />
        </view>
        <view class="dog-field" :class="{ 'is-error': dogInfoErrors.size }">
          <text class="field-label">狗大小</text>
          <view class="field-options">
            <view
              v-for="size in sizes"
              :key="size.value"
              class="option-box"
              :class="{ active: dogInfo.size === size.value }"
              @click="dogInfo.size = size.value"
            >
              {{ size.label }}
            </view>
          </view>
        </view>
        <view class="dog-field" :class="{ 'is-error': dogInfoErrors.allergy }">
          <text class="field-label">过敏</text>
          <view class="field-options">
            <view
              v-for="allergy in allergies"
              :key="allergy.value"
              class="option-box"
              :class="{ active: dogInfo.allergy === allergy.value }"
              @click="dogInfo.allergy = allergy.value"
            >
              {{ allergy.label }}
            </view>
          </view>
        </view>
        <view class="dog-field" :class="{ 'is-error': dogInfoErrors.birth }">
          <text class="field-label">出生日期</text>
          <picker mode="date" :value="dogInfo.birth" @change="onDateChange">
            <view class="form-input" :class="{ 'is-error': dogInfoErrors.birth }">
              {{ dogInfo.birth || '请选择日期' }}
            </view>
          </picker>
        </view>
      </view>
    </view>

    <view class="bottom-bar-fixed">
      <button class="action-btn" @click="handleMainAction">
        {{ purchaseType === 'subscribe' ? '立即订阅' : '加入购物车' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { ProductData, BasicParam } from '@/types/product'
import { getProductDetail } from '@/api/product.ts'
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const purchaseType = ref<'onetime' | 'subscribe'>('onetime')
const quantity = ref(1)
const minQuantity = 1
const maxQuantity = 50
const showParams = ref(false)
const data = reactive<ProductData>({} as ProductData)
const selectedSku = reactive<Record<string, string>>({})

const dogInfo = reactive({
  name: '',
  size: 'small',
  allergy: 'no',
  birth: '',
})
const dogInfoErrors = reactive({
  name: false,
  size: false,
  allergy: false,
  birth: false,
})
const sizes = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]
const allergies = [
  { label: '无', value: 'no' },
  { label: '有', value: 'yes' },
]

onLoad(async (options) => {
  const itemId = options?.itemId || '1234567890'
  const res = await getProductDetail(itemId)
  Object.assign(data, res)

  if (data.skuBase?.skus?.length) {
    const firstSku = data.skuBase.skus[0]
    if (firstSku) {
      firstSku.propPath.split(';').forEach((pair) => {
        const [pid, vid] = pair.split(':')
        selectedSku[pid] = vid
      })
    }
  }
})

// --- 计算属性 ---
const selectedSkuId = computed(() => {
  if (data.skuBase?.props?.length !== Object.keys(selectedSku).length) return null
  const path = Object.entries(selectedSku)
    .map(([pid, vid]) => `${pid}:${vid}`)
    .sort()
    .join(';')
  return data.skuBase?.skus?.find((s) => s.propPath.split(';').sort().join(';') === path)?.skuId
})

const selectedSkuPrice = computed(() => {
  if (selectedSkuId.value && data.skuCore?.sku2info) {
    const priceText = data.skuCore.sku2info[selectedSkuId.value]?.priceText
    return priceText ? parseFloat(priceText.replace(/[^\d.]/g, '')) : 0
  }
  return 0
})

const subscriptionPrice = computed(() =>
  selectedSkuPrice.value > 0 ? (selectedSkuPrice.value * 0.9).toFixed(2) : '--',
)

const futurePrice = computed(() =>
  selectedSkuPrice.value > 0 ? (selectedSkuPrice.value * 0.95).toFixed(2) : '--',
)

const allParams = computed<BasicParam[]>(() => [
  ...(data.product?.industryParamVO?.basicParamList || []),
  ...(data.product?.industryParamVO?.enhanceParamList || []),
])

// --- 方法 ---
function sortValues(values: any[] = []) {
  return [...values].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
}
function selectSku(pid: string, vid: string) {
  selectedSku[pid] = vid
}
function isSelected(pid: string, vid: string) {
  return selectedSku[pid] === vid
}
function onDateChange(e: any) {
  dogInfo.birth = e.detail.value
}
function decreaseQuantity() {
  if (quantity.value > minQuantity) quantity.value--
}
function increaseQuantity() {
  if (quantity.value < maxQuantity) quantity.value++
}
function onQuantityBlur(e: any) {
  let val = parseInt(e.detail.value, 10)
  if (isNaN(val) || val < minQuantity) val = minQuantity
  else if (val > maxQuantity) val = maxQuantity
  quantity.value = val
}
function goBack() {
  uni.navigateBack()
}

function validateDogInfo(): boolean {
  Object.keys(dogInfoErrors).forEach((key) => {
    dogInfoErrors[key as keyof typeof dogInfoErrors] = false
  })

  let isValid = true
  let toastShown = false

  const showError = (field: keyof typeof dogInfoErrors, message: string) => {
    dogInfoErrors[field] = true
    isValid = false
    if (!toastShown) {
      uni.showToast({ title: message, icon: 'none' })
      toastShown = true
    }
  }

  if (!dogInfo.name.trim()) showError('name', '请输入狗狗的名字')
  if (!dogInfo.size) showError('size', '请选择狗大小')
  if (!dogInfo.allergy) showError('allergy', '请选择过敏情况')
  if (!dogInfo.birth) showError('birth', '请选择出生日期')

  return isValid
}

function handleMainAction() {
  if (!selectedSkuId.value) {
    uni.showToast({ title: '请选择完整的规格', icon: 'none' })
    return
  }
  if (!validateDogInfo()) {
    return
  }
  if (purchaseType.value === 'subscribe') {
    uni.showToast({ title: `订阅成功`, icon: 'success' })
  } else {
    uni.showToast({ title: '已加入购物车', icon: 'success' })
  }
}
</script>

<style lang="scss" scoped>
/* =========== 页面整体布局 =========== */
.product-detail-container {
  background: $uni-bg-color;
  padding-bottom: 120rpx;
  padding-top: 88rpx;
}

.scroll-content {
  background-color: $uni-bg-color;
}

/* =========== 顶部固定栏 =========== */
.top-bar-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 88rpx;
  background: $uni-bg-color;
  display: flex;
  align-items: center;
  padding: 0 $uni-spacing-row-base;
  padding-top: var(--status-bar-height);
  z-index: 999;
  border-bottom: 1px solid $uni-border-color;
  box-sizing: content-box;
}
.close-icon {
  margin-right: 20rpx;
}
.search-bar {
  flex: 1;
  height: 60rpx;
  background: $uni-bg-color-grey;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  margin-right: 20rpx;
}
.search-icon {
  margin-right: 10rpx;
}
.search-placeholder {
  color: $uni-text-color-placeholder;
  font-size: $uni-font-size-base;
}
.cart-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* =========== 主要内容区域 (按顺序) =========== */
/* 1. 轮播图 */
.swiper {
  height: 563rpx;
}
.swiper-item {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f8f8;
}
.product-img {
  width: 100%;
  height: 100%;
}

/* 2. 标题/销量 */
.info {
  margin: $uni-spacing-col-base 0;
  padding: 0 $uni-spacing-row-lg;
}
.title {
  font-size: $uni-font-size-title;
  font-weight: bold;
  color: $uni-color-title;
}
.sales {
  color: $uni-text-color-grey;
  margin-left: $uni-spacing-row-base;
}

/* 4. 商品参数 */
.param-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $uni-spacing-row-base;
  border-top: 1px solid $uni-border-color;
  border-bottom: 1px solid $uni-border-color;
}
.param-inline {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.param-preview-item {
  margin-right: 30rpx;
  flex-shrink: 0;
}
.param-name {
  font-size: $uni-font-size-sm;
  color: $uni-text-color;
  display: block;
}
.param-value {
  font-size: $uni-font-size-base;
  color: $uni-text-color-grey;
  display: block;
  max-width: 200rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
.param-more {
  display: flex;
  align-items: center;
  margin-left: $uni-spacing-row-base;
  width: 40rpx;
  justify-content: flex-end;
}
.arrow {
  display: inline-block;
  width: 12rpx;
  height: 12rpx;
  border-top: 2px solid $uni-text-color-grey;
  border-right: 2px solid $uni-text-color-grey;
  transform: rotate(45deg);
  margin-right: 10rpx;
}

/* 4.1. 参数弹层 Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: $uni-bg-color-mask;
  display: flex;
  justify-content: flex-end;
  flex-direction: column;
  z-index: 1000;
}
.modal-sheet {
  background: $uni-bg-color;
  border-top-left-radius: $uni-border-radius-lg;
  border-top-right-radius: $uni-border-radius-lg;
  max-height: 80%;
}
.sheet-header {
  display: flex;
  justify-content: space-between;
  padding: $uni-spacing-row-lg;
  border-bottom: 1px solid $uni-border-color;
}
.sheet-title {
  font-size: $uni-font-size-lg;
  font-weight: bold;
  color: $uni-color-title;
}
.sheet-close {
  font-size: $uni-font-size-base;
  color: $uni-color-error;
}
.sheet-content {
  padding: $uni-spacing-row-lg;
  max-height: 60vh;
}
.sheet-row {
  display: flex;
  padding: $uni-spacing-col-sm 0;
  border-bottom: 1px solid $uni-bg-color-grey;
}
.sheet-name {
  width: 30%;
  flex-shrink: 0;
  font-size: $uni-font-size-base;
  color: $uni-text-color;
}
.sheet-value {
  flex: 1;
  font-size: $uni-font-size-base;
  color: $uni-text-color-grey;
  padding-left: 20rpx;
  word-break: break-word;
}

/* 5. SKU规格选择 */
.sku-section {
  margin: $uni-spacing-col-lg 0;
  padding: 0 $uni-spacing-row-lg;
}
.sku-title {
  font-size: $uni-font-size-base;
  margin-bottom: $uni-spacing-col-base;
}
.sku-values {
  display: flex;
  flex-wrap: wrap;
}
.sku-value {
  padding: $uni-spacing-col-base $uni-spacing-row-base;
  border: 1px solid $uni-border-color;
  border-radius: $uni-border-radius-lg;
  margin-right: $uni-spacing-row-base;
  margin-bottom: $uni-spacing-col-base;
  color: $uni-text-color;
  background-color: $uni-bg-color;
  &.active {
    border-color: $uni-color-primary;
    color: $uni-color-primary;
    background-color: mix($uni-color-primary, #ffffff, 10%);
  }
}

/* 6. 购买类型 */
.purchase-options {
  background: $uni-bg-color;
  border-top: 20rpx solid $uni-bg-color-grey;
  padding: $uni-spacing-row-lg;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: $uni-spacing-row-base;
  border: 1px solid $uni-border-color;
  border-radius: $uni-border-radius-lg;
  margin-bottom: $uni-spacing-row-base;
  background: $uni-bg-color;

  &.subscribe-option {
    padding-top: 30rpx;
    padding-bottom: 30rpx;
  }
}

.radio-circle {
  margin-top: 6rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: $uni-border-radius-circle;
  border: 1px solid $uni-text-color-grey;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: $uni-spacing-row-base;
  transition: all 0.2s;
  flex-shrink: 0;
  &.active {
    border-color: $uni-color-primary;
    .radio-dot {
      transform: scale(1);
    }
  }
}

.radio-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: $uni-border-radius-circle;
  background-color: $uni-color-primary;
  transform: scale(0);
  transition: transform 0.2s;
}

/* 6.1 订阅选项详情 */
.option-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.detail-line {
  display: flex;
  align-items: baseline;
  margin-bottom: 10rpx;
}
.line-1 {
  align-items: center;
  margin-bottom: 20rpx;
}

.subscribe-title {
  font-size: $uni-font-size-lg;
  font-weight: bold;
  color: $uni-text-color;
  margin-left: 10rpx;
}
.tags {
  display: flex;
}
.tag {
  font-size: $uni-font-size-sm;
  color: $uni-text-color; /* 变为黑色 */
  margin-left: 10rpx;
}
.price-large {
  font-size: 36rpx;
  color: $uni-color-error;
  font-weight: bold;
}
.price-label {
  font-size: $uni-font-size-sm;
  color: $uni-color-error;
  margin-left: 10rpx;
}
.discount-tag {
  color: $uni-color-error;
  font-size: $uni-font-size-sm; /* 变为小字体 */
  font-weight: bold; /* 字体加粗 */
}
.discount-desc {
  color: $uni-text-color;
  font-size: $uni-font-size-base;
  margin-left: 10rpx;
}
.divider {
  height: 1px;
  background-color: $uni-border-color;
  margin: 20rpx 0;
}
.line-5 {
}
.future-price {
  font-size: $uni-font-size-base;
  color: $uni-text-color;
}
.future-label {
  font-size: $uni-font-size-sm; /* 变为小字体 */
  color: $uni-text-color; /* 确保是黑色 */
  margin-left: 10rpx; /* 增加左边距 */
}
.benefits-list {
  margin-top: 10rpx;
}
.benefit-item {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-text-color;
  margin-top: 8rpx;
  &::before {
    content: '•';
    margin-right: 10rpx;
  }
}

/* 6.2 买一次选项 */
.option-content {
  flex: 1;
}
.option-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .title-text {
    font-size: $uni-font-size-base;
    font-weight: bold;
    color: $uni-color-title;
  }
  .price-text {
    font-size: $uni-font-size-base;
    font-weight: bold;
    color: $uni-color-error;
  }
}

/* 7. 数量选择器 */
.quantity-selector {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: $uni-spacing-row-lg;
  margin-top: $uni-spacing-row-base;
  border-top: 1px solid $uni-border-color;
  gap: 20rpx;
}
.quantity-label {
  font-size: $uni-font-size-base;
  color: $uni-color-title;
}
.stepper {
  display: flex;
  align-items: center;
}
.stepper-btn {
  width: 50rpx;
  height: 50rpx;
  background-color: $uni-bg-color-grey;
  border: 1px solid $uni-border-color;
  color: $uni-text-color;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 36rpx;
  padding: 0;
  line-height: 50rpx;
  margin: 0;
  &[disabled] {
    color: $uni-text-color-disable;
    background-color: $uni-bg-color-hover;
  }
}
.stepper-input {
  width: 80rpx;
  height: 50rpx;
  text-align: center;
  border-top: 1px solid $uni-border-color;
  border-bottom: 1px solid $uni-border-color;
  font-size: $uni-font-size-base;
  margin: 0;
  min-height: 50rpx;
}

/* 8. 狗狗信息表单 */
.dog-info {
  background: $uni-bg-color;
  padding: $uni-spacing-row-lg;
  border-top: 20rpx solid $uni-bg-color-grey;
}
.dog-title {
  font-size: $uni-font-size-title;
  font-weight: bold;
  margin-bottom: $uni-spacing-col-base;
  color: $uni-color-title;
}
.dog-field {
  margin-bottom: $uni-spacing-col-base;
}
.field-label {
  font-size: $uni-font-size-base;
  margin-bottom: $uni-spacing-col-sm;
  display: block;
  color: $uni-text-color;
}
.field-options {
  display: flex;
}
.option-box {
  padding: $uni-spacing-col-base $uni-spacing-row-base;
  border: 1px solid $uni-border-color;
  border-radius: $uni-border-radius-lg;
  margin-right: $uni-spacing-row-base;
  color: $uni-text-color;
  background-color: $uni-bg-color;
  &.active {
    border-color: $uni-color-primary;
    color: $uni-color-primary;
    background-color: mix($uni-color-primary, #ffffff, 10%);
  }
}
.form-input {
  display: block;
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  border: 1px solid $uni-border-color;
  border-radius: $uni-border-radius-lg;
  padding: 0 $uni-spacing-row-base;
  font-size: $uni-font-size-base;
  box-sizing: border-box;
  background: $uni-bg-color;
  color: $uni-text-color;
}

/* 8.1 错误状态样式 */
.form-input.is-error {
  border-color: $uni-color-error !important;
}
.dog-field.is-error .field-label {
  color: $uni-color-error;
}

/* =========== 底部固定操作栏 =========== */
.bottom-bar-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $uni-bg-color;
  padding: 10rpx 30rpx;
  padding-bottom: calc(10rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(10rpx + env(safe-area-inset-bottom));
  z-index: 999;
  border-top: 1px solid $uni-border-color;
}

.action-btn {
  width: 100%;
  height: 70rpx;
  line-height: 70rpx;
  font-size: $uni-font-size-lg;
  color: $uni-text-color-inverse;
  background: $uni-color-primary;
  border-radius: 40rpx;
  border: none;
  &:after {
    border: none;
  }
}
</style>
