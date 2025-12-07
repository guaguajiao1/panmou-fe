<template>
  <view class="account-page">
    <CustomNavigationBar title="我的账户" />

    <scroll-view scroll-y class="scroll-view-content">
      <view v-if="accountStore.profile" class="logged-in-container">
        <view class="header">
          <text class="greeting">你好, {{ accountStore.profile.profile.nickname }}</text>
        </view>

        <view class="section-card">
          <view class="section-header" @click="goToOrders">
            <text class="section-title">你的订单</text>
            <uni-icons type="right" size="18" color="#999"></uni-icons>
          </view>
          <view v-if="recentOrders.length > 0" class="section-content-filled">
            <view
              v-for="order in recentOrders"
              :key="order.id"
              class="order-item"
              @click="goToOrders"
            >
              <view class="item-images">
                <image
                  v-for="item in order.items.slice(0, 3)"
                  :key="item.id"
                  :src="item.thumbnail"
                  class="item-image"
                  mode="aspectFill"
                ></image>
              </view>
              <view class="order-info">
                <text class="order-status">{{ order.statusText }}</text>
                <text class="order-date">预计 {{ order.arrivalDate }} 送达</text>
              </view>
            </view>
          </view>
          <view v-else class="section-content-empty">
            <text class="empty-text">你还没有最近的订单</text>
            <button class="empty-action-button" @click="goToHome">去逛逛</button>
          </view>
        </view>

        <view class="section-card">
          <view class="section-header" @click="goToAutoship">
            <text class="section-title">你的订阅</text>
            <uni-icons type="right" size="18" color="#999"></uni-icons>
          </view>
          <view v-if="nextAutoship" class="section-content-filled" @click="goToAutoship">
            <view class="autoship-item">
              <view class="item-images">
                <image
                  v-for="item in nextAutoship.subscription.items.slice(0, 3)"
                  :key="item.id"
                  :src="item.item.thumbnail"
                  class="item-image"
                  mode="aspectFill"
                ></image>
              </view>
              <view class="order-info">
                <text class="order-status">{{ nextAutoship.subscription.name }}</text>
                <text class="order-date"
                  >下次订单
                  {{ formatSmartDate(nextAutoship.subscription.fulfillment.nextShipment) }}</text
                >
              </view>
            </view>
          </view>
          <view v-else class="section-content-empty">
            <text class="empty-text">设置一个订阅，省心又省钱</text>
            <button class="empty-action-button" @click="goToHome">去设置</button>
          </view>
        </view>

        <view class="section-card">
          <view class="section-header" @click="goToPets">
            <text class="section-title">你的宠物</text>
            <uni-icons type="right" size="18" color="#999"></uni-icons>
          </view>
          <view v-if="pets.length > 0" class="section-content-filled pet-section">
            <view v-for="pet in pets" :key="pet.id" class="pet-item" @click="goToPets">
              <image :src="pet.avatar" class="pet-avatar" mode="aspectFill"></image>
              <text class="pet-name">{{ pet.name }}</text>
            </view>
            <view class="pet-item add-pet" @click="goToCreatePet">
              <view class="pet-avatar add-avatar">
                <uni-icons type="plus" size="24" color="#999"></uni-icons>
              </view>
              <text class="pet-name">添加宠物</text>
            </view>
          </view>
          <view v-else class="section-content-empty pet-empty">
            <view class="empty-text-group">
              <text class="empty-text">添加你的宠物</text>
              <text class="empty-subtext">分享它们的信息以获得个性化推荐</text>
            </view>
            <image
              src="https://placehold.co/100x100/E8F5E9/4CAF50?text=Pet"
              class="empty-image"
            ></image>
            <button class="empty-action-button" @click="goToCreatePet">添加宠物</button>
          </view>
        </view>

        <button class="sign-out-button" @click="handleSignOut">退出登录</button>
      </view>

      <view v-else class="not-logged-in-container">
        <view class="welcome-header">
          <text class="welcome-title">欢迎</text>
          <text class="welcome-subtitle">登录或创建账户，查看订单、管理宠物信息、再次购买等。</text>
          <button class="sign-in-button" @click="goToLogin">登录或创建账户</button>
        </view>
        <view class="help-center-list">
          <view class="list-item" @click="handleHelpClick('Chat')">
            <uni-icons type="chat" size="20" color="#555"></uni-icons>
            <text>在线客服</text>
            <uni-icons type="right" size="16" color="#999" class="arrow"></uni-icons>
          </view>
          <view class="list-item" @click="handleHelpClick('Call')">
            <uni-icons type="phone" size="20" color="#555"></uni-icons>
            <text>联系我们</text>
            <uni-icons type="right" size="16" color="#999" class="arrow"></uni-icons>
          </view>
          <view class="list-item" @click="handleHelpClick('Help')">
            <uni-icons type="help" size="20" color="#555"></uni-icons>
            <text>帮助文章</text>
            <uni-icons type="right" size="16" color="#999" class="arrow"></uni-icons>
          </view>
          <view class="list-item" @click="goToProtocal">
            <uni-icons type="paperclip" size="20" color="#555"></uni-icons>
            <text>服务条款</text>
            <uni-icons type="right" size="16" color="#999" class="arrow"></uni-icons>
          </view>
          <view class="list-item" @click="goToPrivacy">
            <uni-icons type="locked" size="20" color="#555"></uni-icons>
            <text>隐私政策</text>
            <uni-icons type="right" size="16" color="#999" class="arrow"></uni-icons>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAccountStore } from '@/stores'
import { onShow } from '@dcloudio/uni-app'
import type { SimpleAutoshipData } from '@/types/subscription'

// 1. 获取登录信息
const accountStore = useAccountStore()

// --- 4. 定义数据结构 ---
interface OrderSummary {
  id: string
  statusText: string
  arrivalDate: string
  items: Array<{ id: string; thumbnail: string }>
}

interface PetProfile {
  id: string
  name: string
  avatar: string
}

type AutoshipSummary = SimpleAutoshipData // 复用订阅列表的数据结构

// --- Mock 数据 ---
const recentOrders = ref<OrderSummary[]>([])
const nextAutoship = ref<AutoshipSummary | null>(null)
const pets = ref<PetProfile[]>([])
const isLoading = ref(true)

// --- 生命周期 ---
onShow(() => {
  // 页面显示时，根据登录状态决定是否加载数据
  if (accountStore.profile) {
    fetchAccountData()
  } else {
    // 未登录，清空数据
    isLoading.value = false
    recentOrders.value = []
    nextAutoship.value = null
    pets.value = []
  }
})

// --- Mock 数据获取 ---
const fetchAccountData = () => {
  isLoading.value = true
  // 模拟 API 延迟
  setTimeout(() => {
    // --- MOCK CASE 1: 用户有数据 (用于测试) ---
    recentOrders.value = [
      {
        id: 'order_123',
        statusText: '运输中',
        arrivalDate: '11月10日',
        items: [
          { id: 'p_001', thumbnail: 'https://placehold.co/100x100/007aff/fff?text=狗粮' },
          { id: 'p_002', thumbnail: 'https://placehold.co/100x100/4cd964/fff?text=玩具' },
        ],
      },
    ]
    nextAutoship.value = {
      subscription: {
        id: 'sub_001',
        name: '狗狗的每月补给',
        state: 'ACTIVE',
        fulfillment: {
          frequency: { interval: 4, unit: 'Week' },
          nextShipment: '2025-12-15',
        },
        items: [
          {
            id: 'item_001',
            item: {
              id: 'p_001',
              name: '狗粮',
              quantity: 1,
              partNumber: '123',
              thumbnail: 'https://placehold.co/100x100/007aff/fff?text=狗粮',
            },
          },
        ],
        address: {
          id: 'addr_001',
          receiver: '张三',
          contact: '13800138000',
          provinceCode: '310000',
          cityCode: '310100',
          countyCode: '310115',
          address: 'xxx路 123号',
          isDefault: 1,
          fullLocation: '上海市浦东新区 123号',
        },
      },
      currentUser: {
        lifetimeSavings: {
          amountSaved: { amount: 0, currency: 'USD' },
          savingsSinceMonths: 0,
          savingsSinceYear: 0,
        },
        isPullForwardOptOut: false,
      },
    }
    pets.value = [
      { id: 'pet_001', name: '旺财', avatar: 'https://placehold.co/100x100/f0ad4e/fff?text=旺财' },
    ]

    // --- MOCK CASE 2: 用户无数据 (用于测试 Req 3.1) ---
    // recentOrders.value = []
    // nextAutoship.value = null
    // pets.value = []

    isLoading.value = false
  }, 500)
}

// --- 事件处理器 ---

const goToLogin = () => {
  uni.navigateTo({ url: '/pages/login/login' })
}

const handleSignOut = () => {
  uni.showModal({
    title: '提示',
    content: '您确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        accountStore.clearProfile()
      }
    },
  })
}

// 导航
const goToOrders = () => uni.navigateTo({ url: '/pages/order/list' }) // 假设路径
const goToAutoship = () => uni.navigateTo({ url: '/pages/subscription/list' }) // 假设路径
const goToPets = () => uni.navigateTo({ url: '/pages/pet/list' }) // 假设路径
const goToCreatePet = () => uni.navigateTo({ url: '/pages/pet/create' }) // 假设路径
const goToHome = () => uni.switchTab({ url: '/pages/index/index' }) // 假设主页路径

// 帮助中心
const handleHelpClick = (type: string) => {
  uni.showToast({ title: `点击了 ${type}`, icon: 'none' })
}
const goToProtocal = () => uni.navigateTo({ url: '/pages/login/panmou_protocal' }) // 假设路径
const goToPrivacy = () => uni.navigateTo({ url: '/pages/login/panmou_privacy' }) // 假设路径

// 辅助函数 (格式化日期)
function formatSmartDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }
  if (date.getFullYear() !== now.getFullYear()) {
    options.year = 'numeric'
  }
  const datePart = date.toLocaleDateString('zh-CN', options)
  const weekdayPart = date.toLocaleDateString('zh-CN', { weekday: 'long', timeZone: 'UTC' })
  return `${datePart} ${weekdayPart}`
}
</script>

<style lang="scss" scoped>
/* 页面背景 */
.account-page {
  background-color: $uni-bg-color-grey;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.scroll-view-content {
  flex: 1;
  height: 100%;
  background-color: $uni-bg-color-grey;
}

/* 登录后 */
.logged-in-container {
  padding: $uni-spacing-row-lg;
}
.header {
  padding: 20rpx 0;
  .greeting {
    font-size: 44rpx;
    font-weight: bold;
    color: $uni-text-color;
  }
}

/* Amazon 风格卡片 */
.section-card {
  background-color: $uni-bg-color;
  border-radius: $uni-border-radius-lg;
  padding: $uni-spacing-row-lg;
  margin-bottom: $uni-spacing-col-lg;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $uni-spacing-col-lg;
  .section-title {
    font-size: $uni-font-size-lg;
    font-weight: bold;
    color: $uni-text-color;
  }
}

/* 订单和订阅 (有数据) */
.section-content-filled {
  .item-images {
    display: flex;
    gap: $uni-spacing-row-base;
    margin-bottom: $uni-spacing-col-base;
  }
  .item-image {
    width: 100rpx;
    height: 100rpx;
    border-radius: $uni-border-radius-base;
    background-color: $uni-bg-color-grey;
  }
  .order-info {
    display: flex;
    flex-direction: column;
  }
  .order-status {
    font-size: $uni-font-size-base;
    color: $uni-text-color;
    font-weight: 500;
  }
  .order-date {
    font-size: $uni-font-size-sm;
    color: $uni-text-color-grey;
  }
}

/* Pet (有数据) */
.pet-section {
  display: flex;
  flex-wrap: wrap;
  gap: $uni-spacing-row-lg;
}
.pet-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $uni-spacing-col-sm;
}
.pet-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: $uni-bg-color-grey;
}
.pet-name {
  font-size: $uni-font-size-sm;
  color: $uni-text-color;
}
.add-avatar {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px dashed $uni-border-color;
}

/* 内容为空 (引导创建) */
.section-content-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $uni-spacing-col-lg 0;
  gap: $uni-spacing-col-base;
  .empty-text {
    font-size: $uni-font-size-base;
    color: $uni-text-color;
  }
  .empty-subtext {
    font-size: $uni-font-size-sm;
    color: $uni-text-color-grey;
  }
  .empty-action-button {
    font-size: $uni-font-size-base;
    color: $uni-text-color;
    background-color: $uni-bg-color;
    border: 1px solid $uni-border-color;
    border-radius: 40rpx;
    height: 70rpx;
    line-height: 70rpx;
    margin-top: $uni-spacing-col-base;
    &::after {
      border: none;
    }
  }
}
.pet-empty {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  .empty-text-group {
    display: flex;
    flex-direction: column;
  }
  .empty-image {
    width: 100rpx;
    height: 100rpx;
    flex-shrink: 0;
  }
  .empty-action-button {
    width: 100%;
    margin-top: $uni-spacing-col-lg;
  }
}

/* 退出登录 */
.sign-out-button {
  background-color: $uni-bg-color;
  color: $uni-color-error;
  border: 1px solid $uni-border-color;
  border-radius: $uni-border-radius-lg;
  font-size: $uni-font-size-base;
  height: 80rpx;
  line-height: 80rpx;
  margin-top: $uni-spacing-col-lg;
  &::after {
    border: none;
  }
}

/* 未登录 */
.not-logged-in-container {
  padding: $uni-spacing-row-lg;
}
.welcome-header {
  padding: $uni-spacing-row-lg;
  background-color: $uni-bg-color;
  border-radius: $uni-border-radius-lg;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $uni-spacing-col-base;

  .welcome-title {
    font-size: 40rpx;
    font-weight: bold;
    color: $uni-text-color;
  }
  .welcome-subtitle {
    font-size: $uni-font-size-sm;
    color: $uni-text-color-grey;
    text-align: center;
    width: 80%;
  }
  .sign-in-button {
    width: 100%;
    height: 80rpx;
    line-height: 80rpx;
    border-radius: 40rpx;
    background-color: $uni-color-primary;
    color: $uni-text-color-inverse;
    font-size: $uni-font-size-base;
    margin-top: $uni-spacing-col-base;
  }
}

.help-center-list {
  margin-top: $uni-spacing-col-lg;
  background-color: $uni-bg-color;
  border-radius: $uni-border-radius-lg;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .list-item {
    display: flex;
    align-items: center;
    padding: $uni-spacing-row-lg;
    gap: $uni-spacing-row-lg;
    border-bottom: 1px solid $uni-bg-color-grey;
    font-size: $uni-font-size-base;
    color: $uni-text-color;

    &:last-child {
      border-bottom: none;
    }

    .arrow {
      margin-left: auto;
    }
  }
}
</style>
