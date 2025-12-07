<script setup lang="ts">
import { loginApi } from '@/services/login'
import { useAccountStore } from '@/stores'
import type { LoginResult } from '@/types/account'
import { ref } from 'vue'

const primaryColor = '#004a99'
// #ifdef MP-WEIXIN
// 获取用户手机号码
const handleGetPhoneNumber: UniHelper.ButtonOnGetphonenumber = async (ev) => {
  // 1. 协议检查 (保留)
  await validateTermsAgreement()

  console.log('MOCK 登录已触发')

  // 2. [MOCK] 创建一份模拟的用户数据
  // (这份数据是基于你上传的 account.d.ts 文件中的 LoginResult 类型)
  const mockLoginResult: LoginResult = {
    mobile: '13800138000',
    token: 'mock-token-123456789abcdef',
    profile: {
      uid: 'mock-uid-123',
      nickname: '盼眸用户',
      avatar: 'https://placehold.co/220x220/E8F5E9/4CAF50?text=盼眸',
      account: 'panmou_user',
      gender: '保密',
      birthday: '2000-01-01',
      fullLocation: '广东省 深圳市 南山区',
    },
  }

  // 3. [MOCK] 直接调用登录成功，并传入模拟数据
  handleLoginSuccess(mockLoginResult)

  // 4. (注释掉所有真实的 API 调用)
  // const code = ev.detail.code
  // if (!code) {
  //   uni.showToast({ icon: 'none', title: '登录失败，未获取到 code' })
  //   return
  // }
  // const res = await loginApi.loginWxMin(code)
  // handleLoginSuccess(res.result)
}
// #endif

const handleLoginSuccess = (profile: LoginResult) => {
  // 保存会员信息
  const accountStore = useAccountStore()
  accountStore.setProfile(profile)
  // 成功提示
  uni.showToast({ icon: 'success', title: '登录成功' })
  setTimeout(() => {
    // 页面跳转
    uni.navigateBack()
  }, 500)
}

// 请先阅读并勾选协议
const hasAgreedToTerms = ref(false)
const showTermsShake = ref(false)
const validateTermsAgreement = async () => {
  if (!hasAgreedToTerms.value) {
    uni.showToast({
      icon: 'none',
      title: '请先阅读并勾选协议',
    })
    // 震动提示
    showTermsShake.value = true
    setTimeout(() => {
      showTermsShake.value = false
    }, 500)
    // 返回错误
    return Promise.reject(new Error('请先阅读并勾选协议'))
  }
}
</script>

<template>
  <view class="login-view">
    <CustomNavigationBar title="登录/注册" />
    <view class="logo">
      <image src="https://placehold.co/500x500/E8F5E9/4CAF50?text=panmou"></image>
    </view>
    <view class="login">
      <!-- 小程序端授权登录 -->
      <!-- #ifdef MP-WEIXIN -->
      <view class="button-privacy-wrap">
        <button
          :hidden="hasAgreedToTerms"
          class="button-opacity button phone"
          @tap="validateTermsAgreement"
        >
          请先阅读并勾选协议
        </button>
        <button
          class="button phone"
          open-type="getPhoneNumber"
          @getphonenumber="handleGetPhoneNumber"
        >
          <text class="icon icon-phone"></text>
          手机号快捷登录
        </button>
      </view>
      <!-- #endif -->
    </view>

    <view class="tips" :class="{ animate__shakeY: showTermsShake }">
      <label class="label">
        <radio
          class="radio"
          :checked="hasAgreedToTerms"
          @tap="hasAgreedToTerms = !hasAgreedToTerms"
          :color="primaryColor"
        />
        <text>登录/注册即视为你同意盼眸</text>
      </label>
      <navigator class="link" hover-class="none" url="./panmou_protocal">《服务条款》</navigator>
      和
      <navigator class="link" hover-class="none" url="./panmou_privacy">《隐私协议》</navigator>
    </view>
  </view>
</template>

<style lang="scss">
page {
  height: 100%;
}

.login-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  background-color: #fff;
}

.logo {
  text-align: center;
  image {
    width: 350rpx;
    height: 350rpx;
    margin-top: 5vh;
  }
}

.login {
  display: flex;
  flex-direction: column;
  padding: 40rpx 40rpx 40rpx;

  .button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 80rpx;
    font-size: 28rpx;
    border-radius: 72rpx;
    color: #fff;
    .icon {
      font-size: 40rpx;
      margin-right: 6rpx;
    }
  }

  .phone {
    background-color: $uni-color-primary;
  }
}

@keyframes animate__shakeY {
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(0, -5rpx);
  }
  100% {
    transform: translate(0, 0);
  }
}

.animate__shakeY {
  animation: animate__shakeY 0.2s ease-in-out 3;
}

.button-privacy-wrap {
  position: relative;
  .button-opacity {
    opacity: 0;
    position: absolute;
    z-index: 1;
  }
}

.tips {
  position: absolute;
  bottom: 80rpx;
  left: 20rpx;
  right: 20rpx;
  font-size: 22rpx;
  color: #999;
  text-align: center;

  .radio {
    transform: scale(0.6);
    margin-right: -4rpx;
    margin-top: -4rpx;
    vertical-align: middle;
  }

  .link {
    display: inline;
    color: $uni-color-primary;
  }
}
</style>
