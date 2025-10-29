<template>
  <view class="address-list-page">
    <CustomNavigationBar title="收货地址"></CustomNavigationBar>

    <scroll-view scroll-y class="address-scroll">
      <view v-if="addressList.length === 0" class="empty-view">
        <text>您还没有收货地址</text>
      </view>

      <view v-else class="address-list">
        <view class="address-item" v-for="item in addressList" :key="item.id">
          <view
            class="selector"
            v-if="selectorSources.includes(pageSource)"
            @click.stop="onAddressClick(item)"
          >
            <radio
              :checked="item.id === currentSelectedId"
              :color="uniColorPrimary"
              style="transform: scale(0.85)"
            />
          </view>

          <view class="info" @click="onAddressClick(item)">
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
              :color="iconColor"
              @click="goToEdit(item.id)"
            ></uni-icons>

            <uni-icons
              class="delete-icon"
              type="trash"
              size="22"
              :color="iconColor"
              @click="onDelete(item.id)"
            ></uni-icons>
          </view>
        </view>
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

const iconColor = '#666'
const uniColorPrimary = '#004a99'

const addressStore = useAddressStore()
const addressList = ref<AddressItem[]>([])
const pageSource = ref('')
const currentSelectedId = ref<string | null>(null)

const selectorSources = ['checkout', 'subscription']

onLoad((options) => {
  if (options?.source) {
    pageSource.value = options.source
  }

  if (options?.id) {
    currentSelectedId.value = options.id
  }
})

onShow(() => {
  getAddressList()
})

const getAddressList = async () => {
  try {
    const res = await addressApi.list()
    let rawList: AddressItem[] = res.result || []
    if (currentSelectedId.value) {
      const selectedAddress = rawList.find((item) => item.id === currentSelectedId.value)

      if (selectedAddress) {
        const otherAddresses = rawList.filter((item) => item.id !== currentSelectedId.value)
        addressList.value = [selectedAddress, ...otherAddresses]
      } else {
        addressList.value = rawList
      }
    } else {
      addressList.value = rawList
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
          const isDeletingSelected = currentSelectedId.value === id

          const deleteRes = await addressApi.delete(id)
          if (deleteRes.code === '0') {
            uni.showToast({ icon: 'success', title: '删除成功' })

            if (isDeletingSelected) {
              const listRes = await addressApi.list()
              const newList: AddressItem[] = listRes.result || []

              if (newList.length === 0) {
                addressList.value = []
                currentSelectedId.value = null
                addressStore.changeSelectedAddress(undefined)
                return
              }

              let newSelectedAddress = newList.find((item) => item.isDefault === 1)

              if (!newSelectedAddress) {
                newSelectedAddress = newList[0]
              }

              currentSelectedId.value = newSelectedAddress.id
              addressStore.changeSelectedAddress(newSelectedAddress)

              const otherAddresses = newList.filter((item) => item.id !== newSelectedAddress.id)
              addressList.value = [newSelectedAddress, ...otherAddresses]
            } else {
              getAddressList()
            }
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
  if (selectorSources.includes(pageSource.value)) {
    currentSelectedId.value = address.id
    addressStore.changeSelectedAddress(address)
    uni.navigateBack()
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
.address-list-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: $uni-bg-color-grey;
}

.address-scroll {
  flex: 1;
  overflow-y: auto;
}

.address-list {
  padding: $uni-spacing-row-base;
}

.empty-view {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
  color: $uni-text-color-grey;
}

.address-item {
  display: flex;
  align-items: center;
  padding: $uni-spacing-row-lg;
  background-color: $uni-bg-color;
  border-bottom: none;
  border-radius: $uni-border-radius-lg;
  margin-bottom: $uni-spacing-row-base;

  .selector {
    margin-right: $uni-spacing-row-base;
    margin-left: -5rpx;
  }

  .info {
    flex: 1;
  }

  .user-info {
    display: flex;
    align-items: center;
    margin-bottom: $uni-spacing-col-base;
    .name {
      font-size: $uni-font-size-lg;
      font-weight: bold;
      color: $uni-text-color;
      margin-right: $uni-spacing-row-base;
    }
    .phone {
      font-size: $uni-font-size-lg;
      font-weight: bold;
      color: $uni-text-color;
    }
    .default-tag {
      font-size: $uni-font-size-sm;
      margin-left: $uni-spacing-row-base;
      padding: $uni-spacing-col-sm $uni-spacing-row-base;
      background-color: mix($uni-color-primary, $uni-bg-color, 10%);
      color: $uni-color-primary;
      border-radius: $uni-border-radius-sm;
    }
  }

  .location {
    font-size: $uni-font-size-base;
    color: $uni-text-color;
    line-height: 1.5;
  }

  .actions {
    display: flex;
    align-items: center;
    padding-left: $uni-spacing-row-lg;

    .delete-icon {
      margin-left: $uni-spacing-row-lg;
    }
  }
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: $uni-spacing-row-base;
  background-color: $uni-bg-color;
  padding-bottom: calc($uni-spacing-row-base + constant(safe-area-inset-bottom));
  padding-bottom: calc($uni-spacing-row-base + env(safe-area-inset-bottom));
  border-top: 1rpx solid $uni-border-color;
}

.add-button {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  font-size: $uni-font-size-lg;
  color: $uni-text-color-inverse;
  background-color: $uni-color-primary;
  border-radius: 40rpx;
}
</style>
