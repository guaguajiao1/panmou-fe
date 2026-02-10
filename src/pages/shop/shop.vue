<template>
  <view>
    <Promo
      :list="[
        {
          productId: '1',
          promoImage:
            'https://assets.barkbox.com/assets/barkbox_app/views/home/cms/carousel/bb_carousel_0@1x-56f176fe36a5483dc492eef246f97678764070ef1bc0f13ee313ff7c6ac54e91.jpg',
          target: '',
        },
        {
          productId: '2',
          promoImage:
            'https://assets.barkbox.com/assets/barkbox_app/views/home/cms/carousel/bb_carousel_2@1x-21b7ff32580bea846198faa434b52a12b30de5d22de1ed7c3849a8a7161ca772.jpg',
          target: '',
        },
      ]"
    />
  </view>
  <view class="navigate_fresh_food">
    <button class="fresh-food-btn" @click="goFreshFood()">🍖 定制鲜食</button>
  </view>
  <view class="navigate_cart">
    <button @click="goCart()">Go to Cart</button>
  </view>
  <view class="navigate_checkout">
    <button @click="goPlaceOrder()">Go to Place Order</button>
  </view>
  <view class="navigate_subscription">
    <button @click="goSubscription()">Go to Subscription</button>
  </view>
  <view class="navigate_sub_list">
    <button @click="goSubList()">Go to Sub list</button>
  </view>
</template>

<script lang="ts" setup>
import Promo from './components/promo.vue'

function goFreshFood() {
  uni.navigateTo({
    url: '/freshFoodPages/fresh_food_landing/fresh_food_landing',
  })
}

function goCart() {
  uni.navigateTo({
    url: '/pages/cart/cart',
  })
}

function goChewyCart() {
  uni.navigateTo({
    url: '/pages/chewy_cart/chewy_cart',
  })
}

function goPlaceOrder() {
  uni.navigateTo({
    url: '/orderPages/checkout/checkout?previewId=1',
  })
}

function goSubscription() {
  uni.navigateTo({
    url: '/pages/subscription/subscription',
  })
}

function goSubList() {
  uni.switchTab({
    url: '/pages/subscription-list/subscription-list',
  })
}
</script>

<style lang="scss">
.navigate_fresh_food {
  margin: 20rpx;

  .fresh-food-btn {
    background: linear-gradient(135deg, #00c853 0%, #00e676 100%);
    color: #fff;
    border: none;
    border-radius: 12rpx;
    font-size: 32rpx;
    font-weight: 600;
  }
}
</style>
