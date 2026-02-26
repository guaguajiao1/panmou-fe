<template>
  <view class="cart-item-wrapper">
    <view class="card-content">
      <!-- 复选框 (仅购物车模式且为有效商品时) -->
      <view class="checkbox-area" v-if="scene === 'cart' && isCartItem" @click.stop="toggleSelect">
        <view
          class="checkbox"
          :class="{ checked: isCartItem && (props.item as CartItem).selected }"
        ></view>
      </view>

      <ProductCard v-bind="productProps" @click="onGoToProductDetail">
        <!-- 操作区: 根据 scene + 是否定制化 展示不同按钮 -->
        <template v-if="!isCustomization">
          <!-- 普通商品 -->

          <!-- 订阅切换 (cart / checkout) -->
          <view class="subscription-row" v-if="sku.supportsSubscription">
            <view
              class="subscription-toggle"
              :class="{ active: props.item.purchaseType === 1 }"
              @click.stop="onToggleSubscription"
            >
              <view class="radio-circle"></view>
              <text class="toggle-text">订阅</text>
              <text v-if="subscriptionSavingText" class="subscription-discount-text">
                {{ subscriptionSavingText }}
              </text>
            </view>
          </view>

          <!-- 步进器 + 删除 -->
          <view class="stepper-row">
            <QuantityInput
              :modelValue="props.item.quantity"
              :min="1"
              :max="sku.maxQuantity || 99"
              @change="onQuantityChange"
              :inputWidth="100"
              :inputHeight="50"
              :size="28"
            />
            <view class="card-actions">
              <button v-if="scene === 'cart'" class="delete-button" @click.stop="onDelete">
                删除
              </button>
            </view>
          </view>
        </template>

        <template v-else>
          <!-- 鲜食定制化: 自定义 + (cart时)删除 -->
          <view class="action-row">
            <button class="action-button" @click.stop="onCustomize">自定义</button>
            <button v-if="scene === 'cart'" class="delete-button" @click.stop="onDelete">
              删除
            </button>
          </view>
        </template>
      </ProductCard>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CartItem } from '@/types/cart'
import type { Item } from '@/types/checkout'
import type { ProductCardProps } from '@/types/product'
import type { InputNumberBoxEvent } from '@/components/QuantityInput/QuantityInput.d.ts'
import ProductCard from '@/components/ProductCard/ProductCard.vue'

interface Props {
  item: CartItem | Item
  scene: 'cart' | 'checkout'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'setQuantity', payload: { item: CartItem | Item; quantity: number }): void
  (e: 'delete', item: CartItem | Item): void
  (e: 'togglePurchaseType', payload: { item: CartItem | Item; type: 0 | 1 }): void
  (e: 'goToProductDetail', productId: string): void
  (e: 'select', item: CartItem): void
  (e: 'customize', item: CartItem | Item): void
}>()

/** 判断是否为购物车类型 */
const isCartItem = computed(() => 'selected' in props.item)

/** 获取 sku 信息 (类型安全) */
const sku = computed(() => props.item.sku || ({} as any))

/** 判断是否为鲜食定制化商品 */
const isCustomization = computed(() => {
  const c = sku.value.customization
  return !!c && Array.isArray(c.items) && c.items.length > 0
})

/** 将业务数据映射为 ProductCard 展示 props */
const productProps = computed<ProductCardProps>(() => {
  const item = props.item
  const s = sku.value

  // originalPrice 只在和 finalPrice 不同时展示
  const finalPrice = s.finalPrice ?? ''
  const originalPrice =
    s.originalPrice && s.originalPrice !== finalPrice ? s.originalPrice : undefined

  // totalDiscount: 从 discountDetails 中汇总, 保持自洽
  const details = item.discountDetails ?? []
  let discountSum = 0
  details.forEach((d: any) => {
    const amt = parseFloat(d.amount)
    if (!isNaN(amt) && amt < 0) {
      discountSum += Math.abs(amt)
    }
  })
  const totalDiscount = discountSum > 0 ? `-¥${discountSum.toFixed(2)}` : undefined

  // 商品总价 = 原价 × 数量 (折扣前)
  const qty = item.quantity || 1
  const basePriceNum = parseFloat(s.originalPrice || s.finalPrice || '0')
  const totalPrice = (basePriceNum * qty).toFixed(2)

  return {
    itemId: item.itemId,
    image: s.image?.[0] ?? '',
    name: s.name ?? '',
    specs: s.specs,
    finalPrice,
    originalPrice,
    quantity: qty,
    totalPrice,
    totalDiscount,
    discountDetails: details.length > 0 ? details : undefined,
  }
})

/** 订阅省钱文案 (与价格计算自洽) */
const subscriptionSavingText = computed(() => {
  const s = sku.value
  if (!s.supportsSubscription) return ''
  const discount = parseFloat(s.subscriptionDiscount)
  if (!discount || discount <= 0) return ''
  return `省 ¥${discount.toFixed(2)}`
})

const onQuantityChange = (event: InputNumberBoxEvent) => {
  let newValue = event.value
  const max = sku.value.maxQuantity || 99
  if (newValue > max) {
    newValue = max
    uni.showToast({ title: '购买数量不能超过限购数量', icon: 'none' })
  }
  if (newValue !== props.item.quantity) {
    emit('setQuantity', { item: props.item, quantity: newValue })
  }
}

const onToggleSubscription = () => {
  const newType = props.item.purchaseType === 1 ? 0 : 1
  emit('togglePurchaseType', { item: props.item, type: newType })
}

const onDelete = () => {
  emit('delete', props.item)
}

const onGoToProductDetail = () => {
  const productId = sku.value.productId
  if (productId) {
    emit('goToProductDetail', productId)
  }
}

const toggleSelect = () => {
  if (isCartItem.value) {
    emit('select', props.item as CartItem)
  }
}

const onCustomize = () => {
  emit('customize', props.item)
}
</script>

<style lang="scss" scoped>
.cart-item-wrapper {
  margin-bottom: $uni-spacing-col-base;
}

.card-content {
  display: flex;
  align-items: flex-start;

  :deep(.product-card) {
    flex: 1;
    border-radius: 0;
    margin-bottom: 0;
    box-shadow: none;
  }
}

.subscription-row {
  margin-top: $uni-spacing-col-sm;
  padding-top: $uni-spacing-col-sm;
  display: flex;
  align-items: center;
  min-height: 50rpx;
}

.subscription-toggle {
  display: flex;
  align-items: center;
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  cursor: pointer;
  padding: 10rpx 0;

  .radio-circle {
    width: 32rpx;
    height: 32rpx;
    border-radius: 50%;
    border: 2rpx solid $uni-border-color;
    margin-right: 12rpx;
    position: relative;
    box-sizing: border-box;
  }

  &.active {
    .radio-circle {
      border-color: $uni-color-primary;
      background-color: $uni-color-primary;

      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 12rpx;
        height: 12rpx;
        background-color: #fff;
        border-radius: 50%;
      }
    }
  }

  .toggle-text {
    font-weight: 500;
  }

  .subscription-discount-text {
    margin-left: 16rpx;
    color: $uni-color-error;
    font-size: 24rpx;
    font-weight: 500;
  }
}

.stepper-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rpx;
}

.card-actions {
  display: flex;
  align-items: center;
}

.action-row {
  display: flex;
  align-items: center;
  margin-top: 30rpx;
  gap: 20rpx;
}

.action-button {
  font-size: 28rpx;
  color: $uni-color-primary;
  background-color: #fff;
  border: 1rpx solid $uni-color-primary;
  border-radius: 32rpx;
  padding: 0;
  width: 200rpx;
  height: 64rpx;
  line-height: 62rpx;
  text-align: center;

  &::after {
    border: none;
  }
}

.delete-button {
  font-size: 28rpx;
  color: $uni-color-primary;
  background-color: #fff;
  border: 1rpx solid $uni-color-primary;
  border-radius: 32rpx;
  padding: 0;
  width: 200rpx;
  height: 64rpx;
  line-height: 62rpx;
  margin-left: 20rpx;
  text-align: center;

  &::after {
    border: none;
  }
}

.checkbox-area {
  display: flex;
  align-items: center;
  padding-right: 16rpx;
  padding-top: 100rpx; // 对齐商品图片中心
  flex-shrink: 0;

  .checkbox {
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    border: 3rpx solid #ccc;
    position: relative;
    transition: all 0.2s;

    &.checked {
      background-color: $uni-color-primary;
      border-color: $uni-color-primary;

      &::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #fff;
        font-size: 24rpx;
        font-weight: bold;
      }
    }
  }
}
</style>
