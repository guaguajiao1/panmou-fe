<template>
  <view class="box">
    <view
      class="item"
      v-for="item in list"
      :key="item.productId"
      @click="goProductDetail(item.productId)"
    >
      <image :src="item.promoImage" mode="aspectFit" />
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PromoProduct } from '@/types/shop'
defineProps<{
  list: PromoProduct[]
}>()

function goProductDetail(productId: string) {
  uni.navigateTo({ url: `/pages/product/product?productId=${productId}` })
}
</script>

<style lang="scss" scoped>
.box {
  width: 90%; // 占屏幕 90%
  margin: 0 auto; // 居中
  display: flex;
  flex-wrap: wrap; // 自动换行
  justify-content: space-between; // 两列均匀分布
  box-sizing: border-box;
}

.item {
  width: 100%; // 两列 → 留点间距（不是死板的50%）
  height: 750rpx; // 高度可以自己定
  margin-bottom: 20rpx; // 行间距
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  border-radius: 12upx;
  box-shadow: 0 4upx 12upx rgba(0, 0, 0, 0.05);

  image {
    width: 100%;
    height: 100%;
    border-radius: 12rpx;
    object-fit: cover; // 保持图片比例
  }
}
.box {
  width: 90%; // 占屏幕 90%
  margin: 0 auto; // 居中
  display: flex;
  flex-wrap: wrap; // 自动换行
  justify-content: space-between; // 两列均匀分布
  box-sizing: border-box;
}

.item {
  width: 100%; // 两列 → 留点间距（不是死板的50%）
  height: 750rpx; // 高度可以自己定
  margin-bottom: 20rpx; // 行间距
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  border-radius: 12upx;
  box-shadow: 0 4upx 12upx rgba(0, 0, 0, 0.05);

  image {
    width: 100%;
    height: 100%;
    border-radius: 12rpx;
    object-fit: cover; // 保持图片比例
  }
}
</style>
