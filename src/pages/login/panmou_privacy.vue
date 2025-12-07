<template>
  <view class="page-container" v-if="pageReady">
    <CustomNavigationBar title="隐私协议" />
    <scroll-view scroll-y class="scroll-view-content">
      <article class="article">
        <h1 class="h1 tac">盼眸隐私权政策</h1>
        <p class="p tac">更新日期：2025年11月8日</p>
        <p class="p tac">生效日期：2025年11月8日</p>

        <h2 class="h2">引言</h2>
        <p class="p">
          欢迎使用“盼眸”！我们深知个人信息对您的重要性，并会尽全力保护您的个人信息安全可靠。我们致力于维持您对我们的信任，恪守以下原则，保护您的个人信息：权责一致原则、目的明确原则、选择同意原则、最少够用原则、确保安全原则、主体参与原则、公开透明原则等。
        </p>
        <p class="p">
          本《隐私权政策》旨在说明我们如何收集、使用、存储、共享和转让您的个人信息，以及我们为您提供的访问、更新、删除和保护这些信息的方式。
        </p>

        <h2 class="h2">一、 我们如何收集和使用您的个人信息</h2>
        <p class="p">我们会出于本政策所述的以下目的，收集和使用您的个人信息：</p>
        <h4 class="h4">1. 帮助您成为我们的用户</h4>
        <p class="p">
          当您注册盼眸账户时，我们将通过微信小程序授权获取您的**手机号码**，作为您的登录账户。这是实现登录所必需的。
        </p>
        <h4 class="h4">2. 向您提供商品或服务（核心功能）</h4>
        <p class="p">
          <strong class="strong">（1）下单与交付：</strong>
          当您在本平台购买商品（包括食品、玩具、药品等）或设置“订阅”（Autoship）时，您需要提供
          <strong class="strong">收货人姓名、收货地址、联系电话</strong>。
          我们收集这些信息是为了帮助您顺利完成交易、保障您的交易安全、查询订单信息、提供物流服务。
        </p>
        <p class="p">
          <strong class="strong">（2）支付功能：</strong>
          我们并不会收集您的支付密码或银行卡信息。您的支付是在微信支付服务中完成的，我们仅从微信支付获取与您的支付状态相关的信息。
        </p>
        <h4 class="h4">3. 客户服务与安全保障</h4>
        <p class="p">
          为保障您的账户安全，我们的客服在与您联系时，可能会使用您的账户信息与您核实身份。我们也可能保存您的通信/通话记录，以便解决问题。
        </p>

        <h2 class="h2">二、 我们如何共享、转让、公开披露您的个人信息</h2>
        <h4 class="h4">1. 共享</h4>
        <p class="p">我们不会与任何公司、组织和个人分享您的个人信息，但以下情况除外：</p>
        <p class="p">（1）获得您的明确同意后；</p>
        <p class="p">
          （2）
          <strong class="strong">与必要的服务提供商共享：</strong>
          为实现商品配送，我们必须将您的订单信息和收货信息（姓名、地址、电话）共享给第三方物流服务商（如顺丰、京东物流等）。
        </p>
        <p class="p">（3）法律法规规定的其他情形。</p>
        <h4 class="h4">2. 转让</h4>
        <p class="p">
          我们不会将您的个人信息转让给任何公司、组织和个人，但如果盼眸平台发生合并、收购或破产清算，可能涉及到个人信息的转让，届时我们将要求新的持有您个人信息的公司、组织继续受本隐私政策的约束。
        </p>
        <h4 class="h4">3. 公开披露</h4>
        <p class="p">我们仅会在法律法规要求或获得您明确同意的情况下，公开披露您的个人信息。</p>

        <h2 class="h2">三、 我们如何保护您的个人信息</h2>
        <p class="p">
          我们已使用符合业界标准的安全防护措施保护您提供的个人信息，防止数据遭到未经授权的访问、公开披露、使用、修改、损坏或丢失。例如，我们会使用
          SSL/TLS 协议对数据进行加密传输。
        </p>

        <h2 class="h2">四、 您的权利</h2>
        <p class="p">
          您有权访问、更正、删除您的个人信息，以及撤回您的同意授权。您可以通过本平台的“我的账户”或联系客服来执行这些操作。
        </p>

        <h2 class="h2">五、 联系我们</h2>
        <p class="p">
          如您对本隐私政策有任何疑问、意见或建议，您可以通过本平台提供的在线客服或发送邮件至
          `support@panmou.com`（示例邮箱）与我们联系。
        </p>
      </article>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { onReady, onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'

const pageReady = ref(false)

onShow(() => {
  pageReady.value = true
  console.log('pageReady', pageReady)
})
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}
.scroll-view-content {
  flex: 1;
  height: 100%;
}

.article {
  padding: 20rpx 30rpx;
  font-size: 28rpx;
  line-height: 1.7;
}

.h1,
.h2,
.h3,
.h4 {
  font-weight: bold;
  margin: 30rpx 0 15rpx;
  color: #333;
}

.h1 {
  font-size: 40rpx;
}

.h2 {
  font-size: 36rpx;
}

.h3 {
  font-size: 32rpx;
}

.h4 {
  font-size: 30rpx;
}

.p {
  margin-bottom: 20rpx;
  color: #555;
}

.strong {
  font-weight: bold;
  color: #333;
}

.tac {
  text-align: center;
  text-indent: 0;
}
</style>
