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
        <uni-icons type="cart" size="33" color="#007aff"></uni-icons>
      </view>
    </view>

    <view class="scroll-content">
      <swiper class="swiper" circular indicator-dots autoplay>
        <swiper-item v-for="(img, index) in data.product?.images" :key="index">
          <image class="product-img" :src="img" mode="aspectFill" />
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
        <view class="option-item" @click="purchaseType = 'subscribe'">
          <view class="radio-circle" :class="{ active: purchaseType === 'subscribe' }">
            <view class="radio-dot"></view>
          </view>
          <view class="option-content">
            <view class="option-title">
              <text class="title-text">订阅</text>
              <text class="price-text">￥{{ subscriptionPrice }}</text>
            </view>
            <text class="option-desc">享受9折优惠，随时可取消</text>
          </view>
        </view>
        <view class="option-item" @click="purchaseType = 'onetime'">
          <view class="radio-circle" :class="{ active: purchaseType === 'onetime' }">
            <view class="radio-dot"></view>
          </view>
          <view class="option-content">
            <view class="option-title">
              <text class="title-text">买一次</text>
              <text class="price-text">￥{{ selectedSkuPrice.toFixed(2) }}</text>
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
          <input class="form-input" v-model="dogInfo.name" placeholder="请输入狗狗的名字" />
        </view>
        <view class="dog-field">
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
        <view class="dog-field">
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
        <view class="dog-field">
          <text class="field-label">出生日期</text>
          <picker mode="date" :value="dogInfo.birth" @change="onDateChange">
            <view class="form-input">
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
import { getProductDetail } from '@/api/product.ts' // 假设的API路径
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// --- 新增状态 ---
const purchaseType = ref<'onetime' | 'subscribe'>('onetime') // 购买类型，默认买一次
const quantity = ref(1) // 购买数量
const minQuantity = 1 // 最小购买量 (可配置)
const maxQuantity = 50 // 最大购买量 (可配置)

// 狗狗信息
const dogInfo = reactive({
  name: '',
  size: '', // small / medium / large
  allergy: '', // yes / no
  birth: '', // yyyy-mm-dd
})

const sizes = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]

const allergies = [
  { label: '有', value: 'yes' },
  { label: '无', value: 'no' },
]

const data = reactive<ProductData>({} as ProductData)
const selectedSku = reactive<Record<string, string>>({})

onLoad(async (options) => {
  const itemId = options?.itemId || '1234567890'
  const res = await getProductDetail(itemId)
  Object.assign(data, res)

  // 默认选中第一个 SKU 组合
  if (data.skuBase?.skus?.length) {
    const firstSku = data.skuBase.skus[0]
    if (firstSku) {
      const pairs = firstSku.propPath.split(';')
      pairs.forEach((pair) => {
        const [pid, vid] = pair.split(':')
        selectedSku[pid] = vid
      })
    }
  }
})
// 新增：返回上一页的函数
function goBack() {
  uni.navigateBack()
}
// skuId 计算
const selectedSkuId = computed(() => {
  // 确保所有规格都已选择
  if (data.skuBase?.props?.length !== Object.keys(selectedSku).length) {
    return null
  }
  const path = Object.entries(selectedSku)
    .map(([pid, vid]) => `${pid}:${vid}`)
    .sort() // 排序确保propPath顺序一致
    .join(';')
  return data.skuBase?.skus?.find((s) => s.propPath.split(';').sort().join(';') === path)?.skuId
})

// 价格计算 (单次购买)
const selectedSkuPrice = computed(() => {
  if (selectedSkuId.value && data.skuCore?.sku2info) {
    const priceText = data.skuCore.sku2info[selectedSkuId.value]?.priceText
    return priceText ? parseFloat(priceText.replace(/[^\d.]/g, '')) : 0
  }
  return 0
})

// --- 新增计算属性 ---
// 订阅价格 (假设为原价的9折)
const subscriptionPrice = computed(() => {
  if (selectedSkuPrice.value > 0) {
    return (selectedSkuPrice.value * 0.9).toFixed(2)
  }
  return '--'
})

// 当前显示价格
const currentPrice = computed(() => {
  if (purchaseType.value === 'subscribe') {
    return subscriptionPrice.value
  }
  return selectedSkuPrice.value > 0 ? selectedSkuPrice.value.toFixed(2) : '--'
})

// -------- 功能实现 --------

// 按 sortOrder 排序规格值
function sortValues(values: any[] = []) {
  return [...values].sort((a, b) => {
    const orderA = Number(a.sortOrder || 0)
    const orderB = Number(b.sortOrder || 0)
    return orderA - orderB
  })
}

// 点击选择规格
function selectSku(pid: string, vid: string) {
  selectedSku[pid] = vid
}

// 判断是否选中
function isSelected(pid: string, vid: string) {
  return selectedSku[pid] === vid
}

const showParams = ref(false)

// 全部参数
const allParams = computed<BasicParam[]>(() => {
  const basic = data.product?.industryParamVO?.basicParamList || []
  const enhance = data.product?.industryParamVO?.enhanceParamList || []
  return [...basic, ...enhance]
})

// 日期选择
function onDateChange(e: any) {
  dogInfo.birth = e.detail.value
}

// --- 新增方法 ---

// 减少数量
function decreaseQuantity() {
  if (quantity.value > minQuantity) {
    quantity.value--
  }
}

// 增加数量
function increaseQuantity() {
  if (quantity.value < maxQuantity) {
    quantity.value++
  }
}

// 处理输入框失焦事件，确保数量在范围内
function onQuantityBlur(e: any) {
  let val = parseInt(e.detail.value, 10)
  if (isNaN(val) || val < minQuantity) {
    val = minQuantity
  } else if (val > maxQuantity) {
    val = maxQuantity
  }
  quantity.value = val
}

// 统一处理底部按钮点击事件
function handleMainAction() {
  if (!selectedSkuId.value) {
    uni.showToast({ title: '请选择完整的规格', icon: 'none' })
    return
  }

  if (purchaseType.value === 'subscribe') {
    // 执行订阅逻辑
    console.log(`订阅商品: SKU ID = ${selectedSkuId.value}, 数量 = ${quantity.value}`)
    uni.showToast({ title: `订阅成功`, icon: 'success' })
    // uni.navigateTo({ url: `/pages/order/confirm?skuId=${selectedSkuId.value}&quantity=${quantity.value}&type=subscribe` })
  } else {
    // 执行加入购物车逻辑
    console.log(`加入购物车: SKU ID = ${selectedSkuId.value}, 数量 = ${quantity.value}`)
    uni.showToast({ title: '已加入购物车', icon: 'success' })
  }
}
</script>

<style lang="scss" scoped>
/* =========== 页面整体布局 =========== */
.product-detail-container {
  background: $uni-bg-color;
  padding-bottom: 160rpx; /* 为底部固定栏留出空间 */
  padding-top: 100rpx; /* 为顶部固定栏留出空间 */
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
  height: 100rpx;
  background: $uni-bg-color;
  display: flex;
  align-items: center;
  padding: 0 $uni-spacing-row-base;
  padding-top: var(--status-bar-height); /* 适配刘海屏 */
  z-index: 999;
  border-bottom: 1px solid $uni-border-color;
  box-sizing: content-box;
}

/* 新增：关闭按钮样式 */
.close-icon {
  margin-right: 20rpx; /* 与搜索框拉开距离 */
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
}

/* =========== 主要内容区域 (按顺序) =========== */

/* 1. 轮播图 */
.swiper {
  height: 750rpx;
}

.product-img {
  width: 100%;
  height: 750rpx;
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

/* 3. 价格 */
.price {
  font-size: 40rpx;
  color: $uni-color-error;
  margin: $uni-spacing-col-lg 0;
  padding: 0 $uni-spacing-row-lg;
  font-weight: bold;
}

.currency {
  font-size: $uni-font-size-lg;
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
  flex-shrink: 0; /* 新增：防止属性名被压缩 */
  padding: $uni-spacing-col-base 0;
  border-bottom: 1px solid $uni-bg-color-grey;
}
.sheet-name {
  width: 30%;
  font-size: $uni-font-size-base;
  color: $uni-text-color;
}
.sheet-value {
  flex: 1;
  font-size: $uni-font-size-base;
  color: $uni-text-color; /* 改为灰色 */
  padding-left: 20rpx; /* 保持与属性名的间距 */
  word-break: break-word; /* 新增：允许长单词或URL等内容自动换行，防止截断 */
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
  background-color: $uni-bg-color-grey;
  &.active {
    border-color: $uni-color-primary;
    color: $uni-color-primary;
    background-color: mix($uni-color-primary, #ffffff, 10%);
  }
}

/* 6. 购买类型 (订阅/买一次) */
.purchase-options {
  padding: $uni-spacing-row-lg;
  margin: 30rpx 0;
  background: mix($uni-color-primary, #ffffff, 5%);
  border-radius: $uni-border-radius-lg;
  margin-left: $uni-spacing-row-lg;
  margin-right: $uni-spacing-row-lg;
}
.option-item {
  display: flex;
  align-items: center;
  padding: $uni-spacing-row-base;
  border: 1px solid $uni-border-color;
  border-radius: $uni-border-radius-lg;
  margin-bottom: $uni-spacing-row-base;
  background: $uni-bg-color;
  &:last-child {
    margin-bottom: 0;
  }
}
.radio-circle {
  width: 36rpx;
  height: 36rpx;
  border-radius: $uni-border-radius-circle;
  border: 1px solid $uni-text-color-grey;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: $uni-spacing-row-base;
  transition: all 0.2s;
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
.option-desc {
  font-size: $uni-font-size-sm;
  color: $uni-text-color-grey;
  margin-top: 5rpx;
}

/* 7. 数量选择器 */
.quantity-selector {
  display: flex;
  justify-content: center; /* 修改：将 space-between 改为 center 实现居中 */
  align-items: center;
  padding: $uni-spacing-row-lg;
  border-top: 1px solid $uni-border-color; /* 提示：如果移入后不再需要顶部分隔线，可以移除此行 */
  gap: 20rpx; /* 新增：在 "数量" 标签和 stepper 之间创建一个固定的间距 */
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
  margin: 30rpx;
  background: $uni-bg-color-grey;
  padding: $uni-spacing-row-lg;
  border-radius: $uni-border-radius-lg;
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
  font-size: $uni-font-size-lg;
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

/* =========== 底部固定操作栏 =========== */
.bottom-bar-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $uni-bg-color;
  padding: 15rpx 30rpx;
  padding-bottom: calc(15rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(15rpx + env(safe-area-inset-bottom));
  z-index: 999;
  border-top: 1px solid $uni-border-color;
}

.action-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
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
