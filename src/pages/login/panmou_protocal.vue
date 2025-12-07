<template>
  <view class="page-container">
    <CustomNavigationBar title="服务条款" />
    <scroll-view scroll-y class="scroll-view-content">
      <article class="article">
        <h1 class="h1 tac">盼眸用户服务协议</h1>
        <p class="p tac">版本生效日期：2025年11月8日</p>

        <h2 class="h2">一、 导言</h2>
        <p class="p">
          欢迎您使用“盼眸”宠物生活平台（以下简称“本平台”）！本协议是您与本平台运营方之间关于您注册、登录、使用本平台服务所订立的协议。
          <strong class="strong">
            在注册成为盼眸用户前，请您务必仔细阅读并充分理解本协议的全部内容，特别是免除或限制责任的条款、法律适用和争议解决条款（通常以加粗形式提示）。
          </strong>
          当您点击“同意”或实际使用本平台服务时，即表示您已阅读、理解并同意接受本协议的全部内容。
        </p>

        <h2 class="h2">二、 账户注册与使用</h2>
        <p class="p">
          1.
          您确认，在您完成注册程序或以其他本平台允许的方式实际使用服务时，您应当是具备完全民事权利能力和完全民事行为能力的自然人。
        </p>
        <p class="p">
          2.
          您在注册时需要提供您的手机号码以完成实名验证。您应确保所提供的资料真实、准确、完整、合法有效。
        </p>
        <p class="p">
          3.
          您的账户仅限您本人使用，不得以任何形式转让、赠与、出借或售卖。您应对您账户项下的所有行为（包括但不限于在线签署协议、购买商品、发表评论）承担法律责任。
        </p>

        <h2 class="h2">三、 平台服务内容</h2>
        <p class="p">
          1.
          本平台为您提供宠物食品、玩具、药品、日用品等商品的浏览、查询、购买、订阅（Autoship）、评价及售后等服务。
        </p>
        <p class="p">
          2.
          <strong class="strong">商品信息：</strong>
          本平台展示的商品信息（包括价格、库存、介绍）可能随时发生变化，本平台不作特别通知。
        </p>
        <p class="p">
          3.
          <strong class="strong">合同成立：</strong>
          当您作为消费者为生活消费需要下单并支付货款的情况下，您的订单即为一份购买合同。
        </p>
        <p class="p">
          4.
          <strong class="strong">配送服务：</strong>
          本平台或合作第三方物流将负责将商品配送到您指定的收货地址。请您务必填写准确的收货人、联系方式和地址。因您信息填写错误或不详尽导致配送延迟或失败的，本平台不承担责任。
        </p>
        <p class="p">
          5.
          <strong class="strong">药品销售（特别提示）：</strong>
          本平台销售的宠物处方药，您在购买时即承诺您已获得专业兽医师的指导，并已仔细阅读药品说明书。本平台仅作为销售方，不承担因您错误用药导致的一切后果。
        </p>

        <h2 class="h2">四、 用户行为规范</h2>
        <p class="p">
          您承诺在使用本平台服务时，严格遵守国家法律法规、社会主义制度、国家利益、公民合法权益、公共秩序、社会道德风尚和信息真实性等七条底线，不得利用本平台从事任何违法违规活动，包括但不限于：
        </p>
        <p class="p">
          1. 发布、传送、传播任何虚假、骚扰性、侮辱性、恐吓性、庸俗淫秽或任何其他非法信息资料；
        </p>
        <p class="p">2. 恶意刷单、恶意评价、恶意退货等扰乱平台正常交易秩序的行为；</p>
        <p class="p">
          3. 利用任何技术手段（如爬虫、机器人）非法抓取、复制、干扰本平台信息内容或正常运行；
        </p>
        <p class="p">4. 侵犯他人的专利权、著作权、商标权、名誉权或其他任何合法权益。</p>

        <h2 class="h2">五、 责任限制与免责</h2>
        <p class="p">
          1.
          本平台将尽最大努力保障系统稳定运行。但因不可抗力（如自然灾害、政府行为、黑客攻击、网络服务中断）导致的服务中断或数据丢失，本平台在法律允许的范围内免责。
        </p>
        <p class="p">
          2. 本平台不对您因第三方（如物流公司延误、支付系统故障）造成的任何损失承担责任。
        </p>

        <h2 class="h2">六、 法律适用与争议解决</h2>
        <p class="p">
          本协议的订立、执行、解释及争议的解决均适用中华人民共和国法律。如双方就本协议内容或其执行发生任何争议，双方应尽力友好协商解决；协商不成时，任何一方均可向本平台运营方住所地有管辖权的人民法院提起诉讼。
        </p>
      </article>
    </scroll-view>
  </view>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
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
