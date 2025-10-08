<template>
  <view class="cart-page-chewy">
    <!-- 顶部自定义导航栏 -->
    <view class="nav-bar-chewy">
      <text class="nav-title">我的购物车 ({{ totalItems }}件)</text>
      <view class="nav-subtotal">
        <text>小计: </text>
        <text class="price">¥{{ subtotal.toFixed(2) }}</text>
      </view>
    </view>

    <scroll-view scroll-y class="content-container">
      <view class="main-content">
        <!-- 顶部结算按钮和提示 -->
        <view class="top-actions">
          <button class="checkout-btn-top" @click="handleCheckout">去结算</button>
          <view class="free-shipping-progress">
            <progress
              :percent="shippingProgress"
              stroke-width="6"
              activeColor="#0072ce"
              backgroundColor="#e0e0e0"
              border-radius="3"
            />
            <text v-if="shippingDifference > 0"
              >还差 ¥{{ shippingDifference.toFixed(2) }} 即可享受免费配送</text
            >
            <text v-else class="free-shipping-unlocked">🎉 您已获得免费配送资格！</text>
          </view>
        </view>

        <!-- 购物车商品列表 -->
        <view class="items-section" v-if="cartItems.length > 0">
          <view class="section-title">您的订单</view>
          <view class="cart-item-chewy" v-for="item in cartItems" :key="item.id">
            <image :src="item.image" class="item-image" mode="aspectFill"></image>
            <view class="item-details">
              <text class="item-brand">{{ item.brand }}</text>
              <text class="item-name">{{ item.name }}</text>
              <text class="item-price">¥{{ item.price.toFixed(2) }}</text>

              <!-- Autoship 订阅选项 -->
              <view class="autoship-section">
                <view
                  class="autoship-toggle"
                  :class="{ active: item.autoship }"
                  @click="toggleAutoship(item)"
                >
                  <view class="radio-btn"></view>
                  <text>订阅并优惠 {{ item.autoshipDiscount }}%</text>
                </view>
              </view>

              <view class="item-footer">
                <!-- 数量选择 -->
                <view class="quantity-picker">
                  <picker
                    mode="selector"
                    :value="item.quantity - 1"
                    :range="quantityRange"
                    @change="onQuantityChange($event, item)"
                  >
                    <view class="picker-display">
                      数量: {{ item.quantity }} <text class="arrow">▼</text>
                    </view>
                  </picker>
                </view>
                <!-- 操作链接 -->
                <view class="action-links">
                  <text @click="removeItem(item.id)">删除</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view v-if="cartItems.length === 0" class="empty-cart-chewy">
          <image
            src="https://placehold.co/100x100/f0f0f0/cccccc?text=🐶"
            class="empty-icon"
            mode="aspectFit"
          ></image>
          <text>购物车是空的，快去给主子选购吧！</text>
          <button class="go-shopping-btn" @click="goShopping">去逛逛</button>
        </view>

        <!-- 订单摘要 -->
        <view class="order-summary" v-if="cartItems.length > 0">
          <view class="section-title">订单摘要</view>
          <view class="summary-row">
            <text>商品小计</text>
            <text>¥{{ subtotal.toFixed(2) }}</text>
          </view>
          <view class="summary-row">
            <text>订阅折扣</text>
            <text class="discount-text">- ¥{{ totalDiscount.toFixed(2) }}</text>
          </view>
          <view class="summary-row">
            <text>运费</text>
            <text>{{ shippingFee > 0 ? `¥${shippingFee.toFixed(2)}` : '免费' }}</text>
          </view>
          <view class="summary-divider"></view>
          <view class="summary-row total-row">
            <text>订单总计</text>
            <text class="total-price">¥{{ total.toFixed(2) }}</text>
          </view>
          <button class="checkout-btn-bottom" @click="handleCheckout">
            去结算 ({{ totalItems }}件)
          </button>
        </view>

        <!-- 商品推荐 -->
        <view class="recommendations">
          <view class="section-title">您可能还喜欢</view>
          <scroll-view scroll-x class="reco-scroll-view">
            <view class="reco-item" v-for="reco in recommendedItems" :key="reco.id">
              <image :src="reco.image" class="reco-image" mode="aspectFill"></image>
              <text class="reco-name" number-of-lines="2">{{ reco.name }}</text>
              <text class="reco-price">¥{{ reco.price.toFixed(2) }}</text>
              <button class="add-to-cart-btn">加入购物车</button>
            </view>
          </scroll-view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const FREE_SHIPPING_THRESHOLD = 200 // 满200免运费
const DEFAULT_SHIPPING_FEE = 10

// 模拟购物车数据
const cartItems = ref([
  {
    id: 1,
    brand: '皇家',
    name: '成犬粮 贵宾犬专用',
    image: 'https://placehold.co/120x120/e8e8e8/333?text=Food',
    price: 188.0,
    quantity: 1,
    autoship: true,
    autoshipDiscount: 5, // 5%
  },
  {
    id: 2,
    brand: 'KONG',
    name: '经典葫芦漏食玩具',
    image: 'https://placehold.co/120x120/e8e8e8/333?text=Toy',
    price: 79.0,
    quantity: 2,
    autoship: false,
    autoshipDiscount: 5,
  },
])

// 模拟推荐商品数据
const recommendedItems = ref([
  {
    id: 101,
    name: '宠物洁齿水',
    image: 'https://placehold.co/150x150/eee/333?text=Water',
    price: 65.0,
  },
  {
    id: 102,
    name: '超吸水宠物尿垫',
    image: 'https://placehold.co/150x150/eee/333?text=Pad',
    price: 45.0,
  },
  {
    id: 103,
    name: '天然猫薄荷玩具',
    image: 'https://placehold.co/150x150/eee/333?text=Catnip',
    price: 29.0,
  },
  {
    id: 104,
    name: '狗狗零食大礼包',
    image: 'https://placehold.co/150x150/eee/333?text=Snack',
    price: 99.0,
  },
])

const quantityRange = computed(() => Array.from({ length: 10 }, (_, i) => i + 1))

// 计算属性
const totalItems = computed(() => cartItems.value.reduce((sum, item) => sum + item.quantity, 0))
const subtotal = computed(() =>
  cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
)
const totalDiscount = computed(() => {
  return cartItems.value.reduce((sum, item) => {
    if (item.autoship) {
      return sum + item.price * item.quantity * (item.autoshipDiscount / 100)
    }
    return sum
  }, 0)
})
const finalSubtotal = computed(() => subtotal.value - totalDiscount.value)
const shippingFee = computed(() =>
  finalSubtotal.value >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE,
)
const total = computed(() => finalSubtotal.value + shippingFee.value)
const shippingDifference = computed(() =>
  Math.max(0, FREE_SHIPPING_THRESHOLD - finalSubtotal.value),
)
const shippingProgress = computed(() => {
  return Math.min(100, (finalSubtotal.value / FREE_SHIPPING_THRESHOLD) * 100)
})

// 方法
const toggleAutoship = (item) => {
  item.autoship = !item.autoship
}
const onQuantityChange = (event, item) => {
  item.quantity = Number(event.detail.value) + 1
}
const removeItem = (itemId) => {
  cartItems.value = cartItems.value.filter((item) => item.id !== itemId)
  uni.showToast({ title: '已删除', icon: 'none' })
}
const handleCheckout = () => {
  uni.navigateTo({ url: '/pages/checkout/checkout' })
}
const goShopping = () => {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.cart-page-chewy {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f2f2f2;
}

.nav-bar-chewy {
  background-color: #ffffff;
  padding: 20rpx 30rpx;
  padding-top: var(--status-bar-height);
  border-bottom: 1px solid #ddd;
  text-align: center;
  .nav-title {
    font-size: 32rpx;
    font-weight: bold;
  }
  .nav-subtotal {
    font-size: 26rpx;
    color: #555;
    .price {
      font-weight: bold;
      color: #e67e22;
    }
  }
}

.content-container {
  flex: 1;
  overflow-y: auto;
}

.main-content {
  padding: 24rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: bold;
  margin-bottom: 24rpx;
  padding-left: 10rpx;
}

.top-actions {
  background-color: #fff;
  padding: 30rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  .checkout-btn-top {
    background-color: #0072ce;
    color: #fff;
    border-radius: 12rpx;
    height: 90rpx;
    line-height: 90rpx;
    font-size: 32rpx;
    margin-bottom: 30rpx;
  }
  .free-shipping-progress {
    text-align: center;
    font-size: 26rpx;
    color: #555;
    progress {
      margin-bottom: 16rpx;
    }
    .free-shipping-unlocked {
      color: #27ae60;
      font-weight: bold;
    }
  }
}

.items-section {
  background-color: #fff;
  padding: 30rpx;
  border-radius: 16rpx;
}

.cart-item-chewy {
  display: flex;
  padding: 24rpx 0;
  border-bottom: 1px solid #f2f2f2;
  &:last-child {
    border-bottom: none;
  }

  .item-image {
    width: 200rpx;
    height: 200rpx;
    border-radius: 8rpx;
    margin-right: 24rpx;
    flex-shrink: 0;
  }

  .item-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    .item-brand {
      font-size: 26rpx;
      color: #0072ce;
      font-weight: bold;
    }
    .item-name {
      font-size: 28rpx;
      color: #333;
      margin: 8rpx 0;
    }
    .item-price {
      font-size: 30rpx;
      font-weight: bold;
      color: #d35400;
      margin-bottom: 16rpx;
    }
  }

  .autoship-section {
    background-color: #f9f9f9;
    border: 1px solid #eee;
    border-radius: 12rpx;
    padding: 16rpx;
    margin-bottom: 16rpx;
    .autoship-toggle {
      display: flex;
      align-items: center;
      font-size: 26rpx;
      color: #333;
      .radio-btn {
        width: 32rpx;
        height: 32rpx;
        border: 1px solid #ccc;
        border-radius: 50%;
        margin-right: 16rpx;
        position: relative;
      }
      &.active .radio-btn {
        border-color: #0072ce;
        &::after {
          content: '';
          position: absolute;
          width: 20rpx;
          height: 20rpx;
          background-color: #0072ce;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      }
    }
  }

  .item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    .quantity-picker {
      .picker-display {
        border: 1px solid #ccc;
        padding: 8rpx 20rpx;
        border-radius: 8rpx;
        font-size: 26rpx;
        .arrow {
          color: #999;
          margin-left: 8rpx;
        }
      }
    }
    .action-links text {
      color: #0072ce;
      font-size: 26rpx;
      margin-left: 24rpx;
    }
  }
}

.empty-cart-chewy {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  color: #666;
  background-color: #fff;
  border-radius: 16rpx;
  .empty-icon {
    width: 150rpx;
    height: 150rpx;
    margin-bottom: 30rpx;
  }
  .go-shopping-btn {
    margin-top: 40rpx;
    background-color: #ff9900;
    color: white;
    border-radius: 40rpx;
    padding: 0 60rpx;
    height: 80rpx;
    line-height: 80rpx;
    font-size: 30rpx;
  }
}

.order-summary {
  background-color: #fff;
  padding: 30rpx;
  border-radius: 16rpx;
  margin-top: 24rpx;
  .summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 28rpx;
    color: #333;
    margin-bottom: 20rpx;
    .discount-text {
      color: #27ae60;
    }
  }
  .summary-divider {
    height: 1px;
    background-color: #eee;
    margin: 20rpx 0;
  }
  .total-row {
    font-weight: bold;
    font-size: 32rpx;
    .total-price {
      color: #d35400;
    }
  }
  .checkout-btn-bottom {
    margin-top: 20rpx;
    background-color: #0072ce;
    color: #fff;
    border-radius: 12rpx;
    height: 90rpx;
    line-height: 90rpx;
    font-size: 32rpx;
  }
}

.recommendations {
  margin-top: 24rpx;
  .reco-scroll-view {
    white-space: nowrap;
  }
  .reco-item {
    display: inline-block;
    width: 280rpx;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-right: 20rpx;
    vertical-align: top;
    .reco-image {
      width: 100%;
      height: 240rpx;
      border-radius: 8rpx;
      margin-bottom: 16rpx;
    }
    .reco-name {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 26rpx;
      color: #333;
      white-space: normal;
      height: 72rpx;
      line-height: 36rpx;
    }
    .reco-price {
      display: block;
      font-size: 28rpx;
      font-weight: bold;
      color: #d35400;
      margin: 12rpx 0;
    }
    .add-to-cart-btn {
      width: 100%;
      height: 60rpx;
      line-height: 60rpx;
      font-size: 24rpx;
      background-color: #fff;
      color: #0072ce;
      border: 1px solid #0072ce;
      border-radius: 30rpx;
    }
  }
}
</style>
