<template>
  <view class="address-list-page">
    <scroll-view scroll-y class="address-scroll">
      <view v-if="addressList.length === 0" class="empty-view">
        <text>您还没有收货地址</text>
      </view>
      <view v-else class="address-list">
        <uni-swipe-action>
          <uni-swipe-action-item v-for="item in addressList" :key="item.id">
            <view class="address-item" @click="onAddressClick(item)">
              <view class="info">
                <view class="user-info">
                  <text class="name">{{ item.receiver }}</text>
                  <text class="phone">{{ item.contact }}</text>
                  <text v-if="item.isDefault" class="default-tag">默认</text>
                </view>
                <view class="location">
                  <text>{{ item.fullLocation }} {{ item.address }}</text>
                </view>
              </view>
              <view class="actions">
                <uni-icons
                  type="compose"
                  size="22"
                  color="#666"
                  @click.stop="goToEdit(item.id)"
                ></uni-icons>
              </view>
            </view>
            <template #right>
              <view class="swipe-action-buttons">
                <button class="delete-button" @click="onDelete(item.id)">删除</button>
              </view>
            </template>
          </uni-swipe-action-item>
        </uni-swipe-action>
      </view>
    </scroll-view>

    <view class="footer">
      <button class="add-button" @click="goToCreate">新建地址</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { useAddressStore } from '@/stores/modules/address'
import { addressApi } from '@/api/address'
import type { AddressItem } from '@/types/address'

const addressStore = useAddressStore()
const addressList = ref<AddressItem[]>([])
const pageSource = ref('')

onLoad((options) => {
  if (options?.source === 'checkout') {
    pageSource.value = 'checkout'
  }
})

onShow(() => {
  getAddressList()
})

const getAddressList = async () => {
  try {
    const res = await addressApi.list()
    if (res.code === '0') {
      addressList.value = res.result
    }
  } catch (error) {
    uni.showToast({ icon: 'none', title: '加载失败' })
  }
}

const onDelete = (id: string) => {
  uni.showModal({
    title: '确认删除',
    content: '您确定要删除这个地址吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const deleteRes = await addressApi.delete(id)
          if (deleteRes.code === '0') {
            uni.showToast({ icon: 'success', title: '删除成功' })
            if (addressStore.selectedAddress?.id === id) {
              // This line is now valid after fixing the store
              addressStore.changeSelectedAddress(undefined)
            }
            getAddressList()
          } else {
            uni.showToast({ icon: 'none', title: deleteRes.msg || '删除失败' })
          }
        } catch (error) {
          uni.showToast({ icon: 'none', title: '删除失败' })
        }
      }
    },
  })
}

const onAddressClick = (address: AddressItem) => {
  if (pageSource.value === 'checkout') {
    addressStore.changeSelectedAddress(address)
    uni.navigateBack()
  } else {
    goToEdit(address.id)
  }
}

const goToEdit = (id: string) => {
  uni.navigateTo({
    url: `/pages/account/address_edit/address_edit?id=${id}&source=${pageSource.value}`,
  })
}

const goToCreate = () => {
  uni.navigateTo({ url: `/pages/account/address_edit/address_edit?source=${pageSource.value}` })
}
</script>

<style lang="scss" scoped>
/* Styles are unchanged */
.address-list-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
}

.address-scroll {
  flex: 1;
  overflow-y: auto;
}

.empty-view {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
  color: #999;
}

.address-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;

  .info {
    flex: 1;
  }

  .user-info {
    display: flex;
    align-items: center;
    margin-bottom: 10rpx;
    .name {
      font-size: 30rpx;
      font-weight: 500;
      margin-right: 20rpx;
    }
    .phone {
      font-size: 28rpx;
      color: #666;
    }
    .default-tag {
      font-size: 22rpx;
      margin-left: 20rpx;
      padding: 4rpx 10rpx;
      background-color: #fdece8;
      color: #d84f1a;
      border-radius: 4rpx;
    }
  }

  .location {
    font-size: 26rpx;
    color: #333;
    line-height: 1.5;
  }

  .actions {
    padding-left: 30rpx;
  }
}

.swipe-action-buttons {
  display: flex;
  align-items: center;
  height: 100%;
  .delete-button {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 160rpx;
    height: 100%;
    background-color: #dd524d;
    color: #fff;
    border-radius: 0;
    font-size: 28rpx;
  }
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  background-color: #fff;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #eee;
}

.add-button {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 30rpx;
  color: #fff;
  background-color: #2c6fdb;
  border-radius: 40rpx;
}
</style>
