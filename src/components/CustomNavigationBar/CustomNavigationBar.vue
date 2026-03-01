<script setup lang="ts">
import { computed } from 'vue'

// 定义组件的属性
const props = defineProps<{
  // 导航栏标题内容
  title: string
}>()

// 获取系统信息，特别是状态栏高度
const { statusBarHeight } = uni.getSystemInfoSync()

// 导航栏内容高度
const navContentHeight = 50

// 计算整个导航栏的高度，用于顶部 Padding 或 margin
const navBarHeight = computed(() => {
  // 加上状态栏高度
  return (statusBarHeight || 0) + navContentHeight
})

// 后退/关闭按钮点击事件
const navigateBack = () => {
  // uni.navigateBack() 用于返回上一页或关闭当前页面
  uni.navigateBack({
    delta: 1,
    success: () => {
      console.log('返回上一页成功')
    },

    fail: (err) => {
      // 核心：在这里打印失败日志
      console.error('navigateBack 失败，无法返回上一页。原因:', err.errMsg || err)

      // 常见的 errMsg 可能是:
      // "navigateBack:fail cannot navigate back at the first page."

      // 如果栈内没有页面可返回（比如当前页是首页），则跳转到首页
      uni.switchTab({ url: '/pages/shop/shop' })
    },
  })
}
</script>

<template>
  <view :style="{ height: navBarHeight + 'px' }" class="navbar-placeholder"></view>

  <view class="navbar-container" :style="{ height: navBarHeight + 'px' }">
    <view :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="navbar-content" :style="{ height: navContentHeight + 'px' }">
      <view class="navbar-left">
        <uni-icons
          class="close-icon"
          type="closeempty"
          size="22"
          color="#007aff"
          @click="navigateBack"
        ></uni-icons>
      </view>

      <view class="navbar-title">
        <text class="title-text">{{ props.title }}</text>
      </view>

      <view class="navbar-right"></view>
    </view>
  </view>
</template>

<style lang="scss">
// 导航栏容器样式
.navbar-container {
  /* 关键：固定在顶部 */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999; /* 确保在最上层 */
  background-color: #ffffff; /* 背景色：白色 */

  /* 底部分隔线，1rpx 细线 */
  border-bottom: 1rpx solid #e0e0e0;
}

// 导航栏内容（包括图标和标题）
.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx; /* 左右边距 */
  box-sizing: content-box;
}

// 左侧返回按钮
.navbar-left {
  width: 80rpx;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

// 中间标题
.navbar-title {
  flex: 1;
  text-align: center;
  /* 防止标题被左右按钮挤压 */
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  .title-text {
    font-size: 32rpx;
    font-weight: bold;
    color: #004a99; /* 标题颜色：蓝色 */
  }
}

// 右侧占位，确保标题可以居中对齐
.navbar-right {
  width: 80rpx; /* 宽度与左侧图标保持一致 */
}

// 占位元素，防止内容被固定导航栏遮挡
.navbar-placeholder {
  /* height 属性由 template 中的内联 style 动态设置 */
  background-color: transparent;
}
</style>
