<template>
  <view class="subscription-list">
    <CustomNavigationBar title="Subscription List" />

    <scroll-view scroll-y class="scroll-view-content">
      <view class="subscription-item" v-for="sub in subscriptions" :key="sub.subscription.id">
        <text class="subscription-title">{{ sub.subscription.name }}</text>
        <text class="subscription-frequency">{{
          getFrequencyStr(sub.subscription.fulfillment.frequency)
        }}</text>
        <view class="item-images-container">
          <image
            v-for="item in sub.subscription.items"
            :key="item.id"
            :src="item.item.thumbnail"
            class="item-image"
            mode="aspectFill"
          />
        </view>
        <view class="next-order"> {{ sub.subscription.fulfillment.nextShipment }}</view>
        <view class="shipping-address">
          Shipping Address: {{ sub.subscription.address.fullLocation }},
        </view>
        <button class="edit-subscription" @click="goToSubscriptionDetail(sub.subscription.id)">
          edit
        </button>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { SimpleAutoshipData } from '@/types/subscription'
import { computed, ref } from 'vue'
import { subscriptionApi } from '@/api/subscription'
import { onLoad } from '@dcloudio/uni-app'

const subscriptions = ref<Array<SimpleAutoshipData>>([])

onLoad((optionss) => {
  subscriptions.value = [
    {
      subscription: {
        id: 'sub_001',
        name: 'Autoship #1',
        fulfillment: {
          frequency: { interval: 2, unit: 'weeks' },
          nextShipment: '2024-07-15',
        },
        items: [
          {
            id: 'item_001',
            item: {
              thumbnail: 'https://placehold.co/160x160?text=Panmou',
            },
          },
          {
            id: 'item_002',
            item: {
              thumbnail: 'https://placehold.co/160x160?text=Hello',
            },
          },
        ],
        address: {
          fullLocation: '123 Main St, Springfield, IL',
        },
      },
    },
  ]
})

function getFrequencyStr(frequency: { interval: number; unit: string }) {
  return `${frequency.interval} ${frequency.unit}`
}

const goToSubscriptionDetail = (id: string) => {
  uni.navigateTo({
    url: `/pages/subscription/subscription?id=${id}`,
  })
}
async function getSubscriptions(state: string) {
  const res = await subscriptionApi.getSubscriptions(state)
  if (res.code === '0') {
    subscriptions.value = res.result as Array<SimpleAutoshipData>
  } else {
    console.error('Failed to fetch subscriptions:', res.msg)
  }
}
</script>

<style lang="scss">
.scroll-view-content {
  padding: $uni-spacing-col-base;
  box-sizing: border-box;
  display: block;
}
.subscription-item {
  background-color: $uni-bg-color;
  border-radius: $uni-border-radius-lg;
  padding: $uni-spacing-col-lg $uni-spacing-row-lg;
  margin-bottom: $uni-spacing-col-lg;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid $uni-border-color;
}
.subscription-title {
  display: block;
  font-size: $uni-font-size-lg;
  font-weight: bold;
  color: $uni-text-color;
  margin-bottom: $uni-spacing-col-sm;
}
.subscription-frequency {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-text-color-grey;
}

.item-images-container {
  display: flex;
  flex-wrap: wrap;
  gap: $uni-spacing-row-base;
  margin: $uni-spacing-col-lg 0;
}

.item-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: $uni-border-radius-base;
  background-color: $uni-bg-color-grey; /* 图片加载时的占位背景 */
}

.next-order,
.shipping-address {
  font-size: $uni-font-size-sm;
  color: $uni-text-color-grey;
  margin-top: $uni-spacing-col-sm;
  display: block;
}

.edit-subscription {
  margin-top: $uni-spacing-col-lg;
  background-color: $uni-color-primary;
  color: $uni-text-color-inverse;
  font-size: $uni-font-size-base;
  height: 40px;
  line-height: 40px;
  border-radius: 20px;
}
</style>
