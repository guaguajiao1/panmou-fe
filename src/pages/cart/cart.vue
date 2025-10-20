<template>
  <view class="cart-page">
    <!-- 顶部自定义导航栏 -->
    <CustomNavigationBar title="购物车"></CustomNavigationBar>

    <!-- 滚动区域 -->
    <scroll-view scroll-y class="scroll-view-container">
      <!-- 购物车商品列表 -->
      <view class="cart-item" v-for="item in cartItems" :key="item.id">
        <!-- 删除图标 -->
        <view class="delete-icon" @click="removeItem(item.id)">
          <uni-icons type="trash" size="22" :color="$uni - text - color - grey"></uni-icons>
        </view>

        <!-- 商品主信息区域 (结构调整) -->
        <view class="item-main">
          <image
            :src="item.image"
            class="item-image"
            mode="aspectFill"
            @click="goToProductDetail(item)"
          ></image>

          <!-- 右侧内容 -->
          <view class="item-content-wrapper">
            <view class="item-info" @click="goToProductDetail(item)">
              <text class="item-name">{{ item.name }}</text>
              <text class="item-specs">{{ item.specs }}</text>
            </view>

            <!-- 中部操作区 -->
            <view class="item-controls">
              <!-- 数量选择器 -->
              <view class="quantity-stepper">
                <button @click="decreaseQuantity(item)" :disabled="item.quantity <= 1">-</button>
                <text>{{ item.quantity }}</text>
                <button @click="increaseQuantity(item)">+</button>
              </view>
              <!-- 价格显示 -->
              <view class="price-info">
                <text class="current-price"
                  >¥{{ calculateItemPrice(item).current.toFixed(2) }}</text
                >
                <text
                  class="original-price"
                  v-if="item.originalPrice > calculateItemPrice(item).current"
                >
                  ¥{{ item.originalPrice.toFixed(2) }}
                </text>
              </view>
            </view>

            <!-- 购买方式选择 -->
            <view class="purchase-type-selector">
              <view
                class="type-option"
                :class="{ active: item.purchaseType === 'once' }"
                @click="togglePurchaseType(item, 'once')"
              >
                <view class="radio-circle"></view>
                <text
                  >买一次<text v-if="item.onceDiscount > 0" class="save-highlight"
                    >省{{ item.onceDiscount }}%（-¥{{ getSavedAmount(item, 'once') }}）</text
                  ></text
                >
              </view>
              <view
                class="type-option"
                :class="{ active: item.purchaseType === 'subscribe' }"
                @click="togglePurchaseType(item, 'subscribe')"
                v-if="item.supportsSubscription"
              >
                <view class="radio-circle"></view>
                <text
                  >订阅并<text class="save-highlight"
                    >省{{ item.subscriptionDiscount }}%（-¥{{
                      getSavedAmount(item, 'subscribe')
                    }}）</text
                  ></text
                >
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="cartItems.length === 0" class="empty-cart">
        <image
          src="https://placehold.co/100x100/f0f0f0/cccccc?text=🐾"
          class="empty-icon"
          mode="aspectFit"
        ></image>
        <text>购物车还是空的哦</text>
        <button class="go-shopping-btn" @click="goShopping">去逛逛</button>
      </view>
    </scroll-view>

    <!-- 底部结算栏 -->
    <view class="cart-footer" v-if="cartItems.length > 0">
      <view class="subtotal-info">
        <text class="subtotal-label">合计:</text>
        <view class="subtotal-price">
          <text class="final-price">¥{{ finalSubtotal.toFixed(2) }}</text>
          <text class="original-total" v-if="totalDiscount > 0"
            >已省 ¥{{ totalDiscount.toFixed(2) }}</text
          >
        </view>
      </view>
      <button class="checkout-button" @click="handleCheckout">去结算 ({{ totalItems }})</button>
      <!-- 免运费进度条 -->
      <view class="shipping-progress-wrapper" v-if="cartItems.length > 0">
        <view class="progress-bar">
          <view class="progress-bar-inner" :style="{ width: shippingProgress + '%' }"></view>
        </view>
        <text class="progress-text" v-if="shippingDifference > 0">
          还差 <text class="highlight">¥{{ shippingDifference.toFixed(2) }}</text> 即可免运费
        </text>
        <text class="progress-text success" v-else> 🎉 已满足免运费条件 </text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

// --- 配置项 ---
const freeShippingThreshold = ref(50)

// --- 响应式数据 ---
const cartItems = ref([
  {
    id: 1,
    name: '亮白洁牙咀嚼棒 (小型犬)',
    specs: '30支/盒',
    image: 'https://placehold.co/100x100/e8e8e8/333?text=Chews',
    originalPrice: 40.0, // 原价
    quantity: 1,
    supportsSubscription: true,
    subscriptionDiscount: 15, // 订阅优惠15%
    onceDiscount: 5, // “买一次”优惠5%
    purchaseType: 'subscribe',
  },
  {
    id: 2,
    name: '六月惊喜玩具订阅盒',
    specs: '小型犬 / 无过敏',
    image: 'https://placehold.co/100x100/e8e8e8/333?text=Box',
    originalPrice: 55.0,
    quantity: 1,
    supportsSubscription: true,
    subscriptionDiscount: 20,
    onceDiscount: 0,
    purchaseType: 'once',
  },
  {
    id: 3,
    name: '天然剑麻猫抓板',
    specs: '大号 / 附赠猫薄荷',
    image: 'https://placehold.co/100x100/e8e8e8/333?text=Scratch',
    originalPrice: 30.0,
    quantity: 1,
    supportsSubscription: false,
    subscriptionDiscount: 0,
    onceDiscount: 0,
    purchaseType: 'once',
  },
])

// --- 计算属性 ---
const totalItems = computed(() => cartItems.value.reduce((sum, item) => sum + item.quantity, 0))

const finalSubtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => {
    return sum + calculateItemPrice(item).current * item.quantity
  }, 0)
})

const totalDiscount = computed(() => {
  const originalTotal = cartItems.value.reduce(
    (sum, item) => sum + item.originalPrice * item.quantity,
    0,
  )
  const discount = originalTotal - finalSubtotal.value
  return discount > 0 ? discount : 0
})

const shippingProgress = computed(() => {
  const progress = (finalSubtotal.value / freeShippingThreshold.value) * 100
  return Math.min(progress, 100)
})

const shippingDifference = computed(() =>
  Math.max(0, freeShippingThreshold.value - finalSubtotal.value),
)

// --- 方法 ---
const calculateItemPrice = (item) => {
  let current
  if (item.purchaseType === 'subscribe' && item.supportsSubscription) {
    current = item.originalPrice * (1 - item.subscriptionDiscount / 100)
  } else {
    // “买一次”作为默认情况，应用其对应的折扣
    current = item.originalPrice * (1 - item.onceDiscount / 100)
  }
  return { current }
}

const getSavedAmount = (item, type) => {
  const discountPercent = type === 'subscribe' ? item.subscriptionDiscount : item.onceDiscount
  if (discountPercent > 0) {
    const saved = item.originalPrice * (discountPercent / 100)
    return saved.toFixed(2)
  }
  return '0.00'
}

const increaseQuantity = (item) => item.quantity++
const decreaseQuantity = (item) => {
  if (item.quantity > 1) item.quantity--
}

const removeItem = (itemId) => {
  cartItems.value = cartItems.value.filter((item) => item.id !== itemId)
  uni.showToast({ title: '已删除', icon: 'none' })
}

const togglePurchaseType = (item, type) => {
  // 切换购买方式
  item.purchaseType = type
}

const goToProductDetail = (item) => uni.navigateTo({ url: `/pages/product/detail?id=${item.id}` })
const handleCheckout = () => uni.navigateTo({ url: `/pages/checkout/checkout` })
const navigateBack = () => uni.navigateBack()
const goShopping = () => uni.switchTab({ url: '/pages/index/index' })
</script>

<style lang="scss" scoped>
// 定义主题色，覆盖 uni.scss 的 primary
$theme-color: #2c6fdb;

.cart-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: $uni-bg-color-grey;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, sans-serif;
}

.custom-nav-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $uni-spacing-col-base $uni-spacing-row-lg;
  padding-top: var(--status-bar-height);
  background-color: $uni-bg-color;
  position: relative;
  border-bottom: 1px solid #eee;

  .title {
    font-size: $uni-font-size-lg;
    font-weight: 600;
    color: $uni-text-color;
  }

  .close-icon {
    position: absolute;
    left: $uni-spacing-row-lg;
    top: 50%;
    transform: translateY(-50%);
    padding-top: var(--status-bar-height);
    font-size: 48rpx;
    font-weight: 300;
    color: $uni-color-primary;
  }
}

.shipping-progress-wrapper {
  padding: $uni-spacing-col-base $uni-spacing-row-lg;
  background-color: $uni-bg-color;
  margin-bottom: 30rpx;
  .progress-bar {
    height: 15px;
    background-color: #e9e9e9;
    border-radius: $uni-border-radius-lg;
    overflow: hidden;
    .progress-bar-inner {
      height: 100%;
      background-color: $theme-color;
      border-radius: $uni-border-radius-lg;
      transition: width 0.3s ease;
    }
  }
  .progress-text {
    font-size: $uni-font-size-base;
    color: $uni-text-color;
    text-align: center;
    margin-top: $uni-spacing-col-base;
    .highlight {
      color: $uni-color-warning;
      font-weight: bold;
    }
    &.success {
      color: $theme-color;
    }
  }
}

.scroll-view-container {
  flex: 1;
  overflow-y: auto;
  padding: $uni-spacing-col-lg $uni-spacing-row-lg;
  box-sizing: border-box;
}

.cart-item {
  background-color: $uni-bg-color;
  border-radius: $uni-border-radius-lg;
  padding: $uni-spacing-row-lg;
  margin-bottom: $uni-spacing-col-lg;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  position: relative;

  .delete-icon {
    position: absolute;
    top: $uni-spacing-row-base;
    right: $uni-spacing-row-base;
    z-index: 2;
  }

  .item-main {
    display: flex;
  }

  .item-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: $uni-border-radius-base;
    margin-right: $uni-spacing-row-base;
    flex-shrink: 0;
    background-color: #f4f4f4;
    cursor: pointer;
  }

  .item-content-wrapper {
    flex: 1;
  }

  .item-info {
    padding-right: 40rpx; // 为删除按钮留出空间
    cursor: pointer;
    .item-name {
      display: block; // 确保标题独占一行
      font-size: $uni-font-size-base;
      font-weight: 600;
      color: $uni-text-color;
      margin-bottom: $uni-spacing-col-sm;
    }
    .item-specs {
      display: block; // 确保规格独占一行
      font-size: $uni-font-size-sm;
      color: $uni-text-color-grey;
    }
  }

  .purchase-type-selector {
    margin-top: $uni-spacing-col-lg;
    .type-option {
      display: flex;
      align-items: center;
      padding: $uni-spacing-col-sm 0;
      font-size: $uni-font-size-sm;
      .radio-circle {
        width: 16px;
        height: 16px;
        border-radius: $uni-border-radius-circle;
        border: 1px solid $uni-border-color;
        margin-right: $uni-spacing-row-base;
        position: relative;
      }
      .save-highlight {
        color: $uni-color-error;
        font-weight: bold;
        margin-left: $uni-spacing-row-sm;
      }
      &.active {
        .radio-circle {
          border-color: $theme-color;
          &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            border-radius: $uni-border-radius-circle;
            background-color: $theme-color;
          }
        }
      }
    }
  }

  .item-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 50rpx;
  }

  .quantity-stepper {
    display: flex;
    align-items: center;
    border: 1px solid #ddd;
    border-radius: 30rpx;
    button {
      background-color: transparent;
      padding: 0;
      margin: 0 20rpx;
      font-size: 40rpx;
      line-height: 50rpx;
      width: 50rpx;
      height: 50rpx;
      color: $uni-text-color;
      &:after {
        display: none;
      }
      &[disabled] {
        color: $uni-text-color-disable;
      }
    }
    text {
      font-size: $uni-font-size-base;
      font-weight: 500;
      min-width: 60rpx;
      text-align: center;
    }
  }

  .price-info {
    text-align: right;
    .current-price {
      font-size: 32rpx;
      font-weight: bold;
      color: $theme-color;
    }
    .original-price {
      font-size: 24rpx;
      color: #999;
      text-decoration: line-through;
      display: block;
    }
  }
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  color: $uni-text-color-grey;
  .empty-icon {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: $uni-spacing-col-lg;
  }
  .go-shopping-btn {
    margin-top: $uni-spacing-col-lg;
    background-color: $theme-color;
    color: $uni-text-color-inverse;
    border-radius: 40rpx;
    padding: 0 60rpx;
    height: 80rpx;
    line-height: 80rpx;
    font-size: $uni-font-size-base;
  }
}

.cart-footer {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: $uni-bg-color;
  padding: $uni-spacing-col-base $uni-spacing-row-lg;
  padding-bottom: calc($uni-spacing-col-base + constant(safe-area-inset-bottom));
  padding-bottom: calc($uni-spacing-col-base + env(safe-area-inset-bottom));
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .subtotal-info {
    display: flex;
    align-items: baseline;
    .subtotal-label {
      font-size: $uni-font-size-base;
      color: $uni-text-color;
    }
    .subtotal-price {
      margin-left: $uni-spacing-row-sm;
      .final-price {
        font-size: 40rpx;
        font-weight: bold;
        color: $uni-text-color;
        margin-right: $uni-spacing-row-sm;
      }
      .original-total {
        font-size: $uni-font-size-sm;
        color: $uni-text-color-grey;
      }
    }
  }
  .checkout-button {
    width: 280rpx;
    height: 88rpx;
    line-height: 88rpx;
    background-color: $theme-color;
    color: $uni-text-color-inverse;
    border-radius: 44rpx;
    font-size: $uni-font-size-lg;
    font-weight: 500;
    text-align: center;
    padding: 0;
    margin: 0;
    &:after {
      display: none;
    }
  }
}
</style>
