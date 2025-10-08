<template>
  <view class="address-list-page">
    <uni-nav-bar
      left-icon="back"
      background-color="#fff"
      color="#007aff"
      :title="navTitle"
      @clickLeft="onCancel"
    />
    <scroll-view scroll-y class="address-scroll-view">
      <!-- 空状态 -->
      <view class="empty-view" v-if="addresses.length === 0 && !isLoading">
        <uni-icons type="map-pin-ellipse" size="60" color="#c0c0c0"></uni-icons>
        <text class="tip">还没有收货地址</text>
      </view>

      <!-- 地址列表 -->
      <view class="address-item" v-for="item in addresses" :key="item.id">
        <view class="info-wrapper">
          <view class="line-1">
            <text class="name">{{ item.name }}</text>
            <text class="phone">{{ item.phone }}</text>
          </view>
          <view class="line-2">
            <uni-tag
              v-if="item.isDefault"
              text="默认"
              type="error"
              size="mini"
              :inverted="true"
            ></uni-tag>
            <text class="address-text"
              >{{ item.province }}{{ item.city }}{{ item.district }}{{ item.details }}</text
            >
          </view>
        </view>
        <view class="action-wrapper">
          <view class="set-default">
            <radio
              :checked="item.isDefault"
              @click.stop="setAsDefault(item)"
              :color="themeColor"
            /><text>默认地址</text>
          </view>
          <view class="actions">
            <view class="action-btn" @click.stop="editAddress(item.id)">
              <uni-icons type="compose" size="20" color="#999"></uni-icons>
              <text>编辑</text>
            </view>
            <view class="action-btn" @click.stop="deleteAddress(item.id)">
              <uni-icons type="trash" size="20" color="#999"></uni-icons>
              <text>删除</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部新增按钮 -->
    <view class="footer">
      <button class="add-button" @click="addAddress">+ 新建收货地址</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const themeColor = '#2c6fdb' // 定义主题色，用于组件
const isLoading = ref(false)
const addresses = ref([])
const navTitle = ref('收货地址')

// 模拟从服务端获取地址列表的API
const fetchAddressesAPI = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = [
        {
          id: 1,
          name: '张三',
          phone: '138****8888',
          province: '广东省',
          city: '深圳市',
          district: '南山区',
          details: '科技园路1号',
          isDefault: true,
        },
        {
          id: 2,
          name: '李四',
          phone: '139****9999',
          province: '北京市',
          city: '北京市',
          district: '海淀区',
          details: '中关村大街100号',
          isDefault: false,
        },
      ]
      resolve({ success: true, data: mockData })
    }, 500)
  })
}

const fetchAddresses = async () => {
  isLoading.value = true
  const res = await fetchAddressesAPI()
  if (res.success) {
    addresses.value = res.data
  }
  isLoading.value = false
}

onShow(() => {
  fetchAddresses()
})

const setAsDefault = (selectedItem) => {
  if (selectedItem.isDefault) return
  uni.showLoading({ title: '设置中...' })
  setTimeout(() => {
    addresses.value.forEach((item) => {
      item.isDefault = item.id === selectedItem.id
    })
    uni.hideLoading()
    uni.showToast({ title: '设置成功', icon: 'success' })
  }, 300)
}

const deleteAddress = (id) => {
  uni.showModal({
    title: '确认删除',
    content: '您确定要删除这个地址吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' })
        setTimeout(() => {
          addresses.value = addresses.value.filter((item) => item.id !== id)
          uni.hideLoading()
          uni.showToast({ title: '删除成功', icon: 'success' })
        }, 300)
      }
    },
  })
}

// --- (已修改) ---
const editAddress = (id) => {
  uni.navigateTo({
    url: `/pages/account/address_edit/address_edit?id=${id}`,
  })
}

// --- (已修改) ---
const addAddress = () => {
  uni.navigateTo({
    url: '/pages/account/address_edit/address_edit',
  })
}

// 点击取消按钮返回
const onCancel = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
$theme-color: #2c6fdb; // 定义一个局部主题色变量

.address-list-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: $uni-bg-color;
}
.address-scroll-view {
  flex: 1;
  padding-bottom: 140rpx;
}
.address-item {
  background-color: $uni-bg-color;
  margin: $uni-spacing-col-lg;
  border-radius: $uni-border-radius-lg;
  padding: 30rpx;
  .info-wrapper {
    padding-bottom: $uni-spacing-col-lg;
    border-bottom: 1px solid $uni-bg-color-hover;
    .line-1 {
      display: flex;
      align-items: baseline;
      margin-bottom: $uni-spacing-col-base;
      .name {
        font-size: $uni-font-size-lg;
        font-weight: bold;
        margin-right: 20rpx;
      }
      .phone {
        font-size: $uni-font-size-base;
        color: $uni-text-color;
      }
    }
    .line-2 {
      display: flex;
      align-items: flex-start;
      .address-text {
        font-size: $uni-font-size-base;
        color: $uni-text-color;
        line-height: 1.5;
        margin-left: $uni-spacing-row-base;
      }
    }
  }
  .action-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: $uni-spacing-col-lg;
    .set-default {
      display: flex;
      align-items: center;
      font-size: $uni-font-size-sm;
    }
    .actions {
      display: flex;
      .action-btn {
        display: flex;
        align-items: center;
        margin-left: 40rpx;
        font-size: $uni-font-size-sm;
        color: $uni-text-color;
        text {
          margin-left: $uni-spacing-row-sm;
        }
      }
    }
  }
}
.empty-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 30vh;
  .tip {
    color: $uni-text-color-disable;
    margin-top: $uni-spacing-col-lg;
  }
}
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: $uni-bg-color;
  padding: 20rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  .add-button {
    background-color: $theme-color;
    color: $uni-text-color-inverse;
    border-radius: 40rpx;
    height: 80rpx;
    line-height: 80rpx;
  }
}
</style>
