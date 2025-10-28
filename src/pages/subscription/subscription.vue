<template>
  <view class="page-container">
    <!-- 2. 增加自定义导航栏 -->
    <CustomNavigationBar title="订阅详情"></CustomNavigationBar>

    <!-- 加载状态 -->
    <view v-if="isLoading && !subscriptionData" class="loading-placeholder">
      <uni-load-more status="loading"></uni-load-more>
    </view>

    <!-- 页面内容 -->
    <scroll-view v-if="subscriptionData" scroll-y class="scroll-view-content">
      <!-- 1. 订阅名、rename紧挨着, 可编辑 -->
      <view class="subscription-name-bar">
        <input
          v-if="isRenaming"
          v-model="tempSubscriptionName"
          class="subscription-name-input"
          auto-focus
        />
        <text v-else class="subscription-name">{{ subscriptionData.subscription.name }}</text>
        <button class="btn-text-link btn-rename" @click="handleRenameClick">
          {{ isRenaming ? '保存' : '重命名' }}
        </button>
      </view>

      <!-- 4. 展示successMessage -->
      <view v-if="successMessage" class="success-banner">
        <uni-icons type="checkbox-filled" color="#4cd964" size="20"></uni-icons>
        <text>{{ successMessage }}</text>
        <uni-icons
          type="closeempty"
          color="#666"
          size="16"
          @click="successMessage = ''"
        ></uni-icons>
      </view>

      <!-- 5. 下次订单管理 -->
      <uni-card padding="15px" margin="10px">
        <view class="section">
          <text class="section-label">下次订单</text>
          <!-- 0 & 2. 智能日期格式, 字体已加粗 -->
          <text class="section-value-large">{{
            formatSmartDate(subscriptionData.subscription.fulfillment.nextShipment)
          }}</text>
          <!-- 0 & 2. 智能日期时间格式, 字体加粗 -->
          <text class="section-subtitle">
            请在
            <text class="text-bold">{{
              formatDateTime(subscriptionData.subscription.authorizationDate)
            }}</text>
            前编辑或跳过
          </text>
          <text class="section-subtitle">
            将在
            <text class="text-bold">{{
              formatSmartDate(subscriptionData.subscription.fulfillment.nextShipment)
            }}</text>
            处理付款
          </text>
          <view class="button-group-row">
            <button class="btn-secondary" @click="handleOrderNow">立即配送</button>
            <button class="btn-secondary" @click="openSkipOrderPopup">跳过订单</button>
          </view>
          <view class="button-group-row" style="margin-top: 10px">
            <button class="btn-primary btn-full" @click="openChangeDatePopup">更改日期</button>
          </view>
        </view>
      </uni-card>

      <!-- 配送频率 -->
      <uni-card padding="15px" margin="10px" class="frequency-card">
        <view class="row-flex-between">
          <view>
            <text class="section-label">配送频率</text>
            <!-- 3. 字体加大加粗加黑 -->
            <text class="section-value text-bold">{{
              formatFrequency(subscriptionData.subscription.fulfillment.frequency)
            }}</text>
          </view>
          <!-- 1 & 4. 按钮加长 -->
          <button class="btn-text-link btn-long" @click="openChangeFreqPopup">更改</button>
        </view>
      </uni-card>

      <!-- 上次订单 -->
      <uni-card padding="15px" margin="10px" v-if="subscriptionData.subscription.orders.length > 0">
        <view class="row-flex-between">
          <view>
            <text class="section-label">上次订单</text>
            <!-- 0 & 4. 智能日期格式, 字体加大加粗加黑 -->
            <text class="section-value text-bold">{{
              formatSmartDate(subscriptionData.subscription.orders[0].placed)
            }}</text>
          </view>
          <!-- 1 & 4. 按钮加长 -->
          <button
            class="btn-text-link btn-long"
            @click="goToOrderDetails(subscriptionData.subscription.orders[0].id)"
          >
            查看
          </button>
        </view>
      </uni-card>

      <!-- 7. next order商品列表 -->
      <view class="list-title">
        <!-- 0 & 5. 智能日期格式 -->
        下次订单 {{ formatSmartDate(subscriptionData.subscription.fulfillment.nextShipment) }}
      </view>
      <uni-card
        v-for="item in activeItems"
        :key="item.fulfillmentItemId"
        padding="15px"
        margin="10px"
      >
        <view class="item-row">
          <image :src="item.item.thumbnail" class="item-image" mode="aspectFit"></image>
          <view class="item-info">
            <text class="item-name">{{ item.item.name }}</text>
            <!-- 7. 划线价 -->
            <view class="item-price-row">
              <text class="item-price-final">{{ getItemDisplayPrice(item).finalPrice }}</text>
              <text v-if="getItemDisplayPrice(item).originalPrice" class="item-price-original">
                {{ getItemDisplayPrice(item).originalPrice }}
              </text>
            </view>
            <!-- 7. QuantityInput -->
            <view class="quantity-stepper">
              <QuantityInput
                :modelValue="item.quantity"
                :min="1"
                :max="100"
                @change="onQuantityChange(item, $event)"
                :inputWidth="60"
                :inputHeight="30"
                :size="24"
              />
            </view>
          </view>
        </view>
        <!-- 7. 按钮平分空间 -->
        <view class="item-actions">
          <button class="btn-text-link" @click="openSkipItemPopup(item)">跳过一次</button>
          <button class="btn-text-link">替换</button>
          <button class="btn-text-link btn-remove" @click="openRemoveItemPopup(item)">移除</button>
        </view>
      </uni-card>

      <!-- 6. 添加更多商品框 (高度加倍) -->
      <view class="add-more-items-card" @click="navigateToAddItems">
        <uni-icons type="plus" size="24" class="add-item-icon"></uni-icons>
        <text>添加更多商品</text>
      </view>

      <!-- 7. skiped once商品列表 -->
      <template v-if="skippedItems.length > 0">
        <view class="list-title">已跳过商品</view>
        <uni-card
          v-for="item in skippedItems"
          :key="item.fulfillmentItemId"
          padding="15px"
          margin="10px"
        >
          <view class="skipped-item-tag">
            <uni-icons type="calendar-filled" color="#4cd964" size="16"></uni-icons>
            <text>已跳过一次</text>
          </view>
          <view class="item-row">
            <image :src="item.item.thumbnail" class="item-image" mode="aspectFit"></image>
            <view class="item-info">
              <text class="item-name">{{ item.item.name }}</text>
              <view class="item-price-row">
                <text class="item-price-final">{{ getItemDisplayPrice(item).finalPrice }}</text>
                <text v-if="getItemDisplayPrice(item).originalPrice" class="item-price-original">
                  {{ getItemDisplayPrice(item).originalPrice }}
                </text>
              </view>
              <view class="quantity-stepper">
                <QuantityInput
                  :modelValue="item.quantity"
                  :min="1"
                  :max="100"
                  @change="onQuantityChange(item, $event)"
                  :inputWidth="60"
                  :inputHeight="30"
                  :size="24"
                />
              </view>
            </view>
          </view>
          <view class="item-actions">
            <button class="btn-text-link" @click="handleAddBackItem(item)">加回</button>
            <button class="btn-text-link">替换</button>
            <button class="btn-text-link btn-remove" @click="openRemoveItemPopup(item)">
              移除
            </button>
          </view>
        </uni-card>
      </template>

      <!-- 7. 免运费进度条 -->
      <!-- 5. 文字移动到进度条上方 -->
      <view class="shipping-progress-wrapper">
        <text class="progress-text" v-if="shippingDifference > 0">
          还差 <text class="highlight">¥{{ shippingDifference.toFixed(2) }}</text> 即可免运费
        </text>
        <text class="progress-text success" v-else> 🎉 已满足免运费条件 </text>
        <view class="progress-bar">
          <view class="progress-bar-inner" :style="{ width: shippingProgress + '%' }"></view>
        </view>
      </view>

      <!-- 订单总览 -->
      <uni-card padding="15px" margin="10px">
        <view class="summary-row">
          <text>商品小计</text>
          <text>${{ subscriptionData.subscription.totalProduct }}</text>
        </view>
        <view class="summary-row">
          <text>运费</text>
          <text>${{ subscriptionData.subscription.totalShipping }}</text>
        </view>
        <view class="summary-row">
          <text>预估税费</text>
          <text>${{ estimatedTax }}</text>
        </view>
        <view class="summary-divider"></view>
        <view class="summary-row summary-total">
          <text>订单总计</text>
          <text>${{ subscriptionData.subscription.totalOrder }}</text>
        </view>
      </uni-card>

      <!-- 5. 增加收货地址header -->
      <view class="list-title">收货地址</view>
      <!-- 8. 配送地址 -->
      <view class="section-card address-section" @click="goToAddressManagement">
        <view class="address-display">
          <view class="address-info">
            <view class="address-line-1">
              <text class="name">{{ subscriptionData.subscription.address.receiver }}</text>
              <text class="phone">{{ subscriptionData.subscription.address.contact }}</text>
            </view>
            <view class="address-line-2">
              <text class="default-tag" v-if="subscriptionData.subscription.address.isDefault">
                默认
              </text>
              <text> {{ subscriptionData.subscription.address.fullLocation }} </text>
            </view>
            <view class="address-line-3">
              <text>{{ subscriptionData.subscription.address.address }}</text>
            </view>
          </view>
          <uni-icons type="right" size="18" color="#999"></uni-icons>
        </view>
      </view>

      <!-- 8. 删除 Promote code, Gift Card, Payment -->

      <!-- 节省横幅 -->
      <view class="savings-banner">
        <text class="savings-text">
          您在 Autoship 订单上已累计节省 ${{
            subscriptionData.currentUser.lifetimeSavings.amountSaved.amount
          }}！
        </text>
      </view>

      <!-- 取消订阅 -->
      <view class="cancel-section">
        <text class="cancel-prompt">不再需要 {{ subscriptionData.subscription.name }} 了？</text>
        <button class="btn-text-link btn-cancel-subscription" @click="handleCancelSubscription">
          取消此 Autoship
        </button>
      </view>
    </scroll-view>

    <!-- 弹窗：修改下次订单日期 -->
    <uni-popup
      ref="changeDatePopupRef"
      type="bottom"
      background-color="#fff"
      border-radius="10px 10px 0 0"
    >
      <view class="popup-content popup-calendar">
        <view class="popup-header">
          <text class="popup-title">更改下次订单日期</text>
          <uni-icons
            type="closeempty"
            size="24"
            @click="closePopup('changeDatePopupRef')"
          ></uni-icons>
        </view>
        <!-- [MODIFIED] 3. 尝试添加 end-date -->
        <uni-calendar
          :date="tempSelectedDate"
          :insert="true"
          :start-date="minChangeDate"
          :end-date="maxChangeDate"
          @change="onCalendarChange"
        />
        <view class="popup-footer">
          <button class="btn-secondary" @click="closePopup('changeDatePopupRef')">取消</button>
          <button class="btn-primary" @click="saveNewDate">保存</button>
        </view>
      </view>
    </uni-popup>

    <!-- 弹窗：跳过下次订单 -->
    <uni-popup ref="skipOrderPopupRef" type="center" :is-mask-click="false">
      <view class="popup-content popup-center">
        <view class="popup-header">
          <text class="popup-title">跳过下次订单？</text>
          <uni-icons
            type="closeempty"
            size="24"
            @click="closePopup('skipOrderPopupRef')"
          ></uni-icons>
        </view>
        <view class="popup-body">
          <text class="popup-text">这将更新您的下次订单日期。</text>
          <view class="popup-date-box">
            <text class="popup-date-label">新订单日期</text>
            <text class="popup-date-value">
              <!-- 0. 智能日期格式 -->
              {{
                subscriptionData
                  ? formatSmartDate(subscriptionData.subscription.fulfillment.followingShipment)
                  : ''
              }}
            </text>
          </view>
        </view>
        <view class="popup-footer-column">
          <button class="btn-primary" @click="handleSkipOrder">跳过订单</button>
          <button class="btn-secondary" @click="closePopup('skipOrderPopupRef')">取消</button>
        </view>
      </view>
    </uni-popup>

    <!-- 3. 弹窗：修改配送频率 -->
    <uni-popup
      ref="changeFreqPopupRef"
      type="bottom"
      background-color="#fff"
      border-radius="10px 10px 0 0"
    >
      <view class="popup-content popup-frequency">
        <view class="popup-header">
          <text class="popup-title">更改配送频率</text>
          <uni-icons
            type="closeempty"
            size="24"
            @click="closePopup('changeFreqPopupRef')"
          ></uni-icons>
        </view>
        <scroll-view scroll-y style="max-height: 400px">
          <!-- 3. 修复: 替换为 <radio-group> -->
          <radio-group @change="onFrequencyRadioChange">
            <label
              v-for="(item, index) in frequencyOptions"
              :key="index"
              class="frequency-option"
              :class="{ 'is-checked': tempSelectedFrequencyInterval === item.value }"
            >
              <!-- 2. Radio 移到前面 -->
              <radio :value="item.value" :checked="tempSelectedFrequencyInterval === item.value" />
              <view class="frequency-option-content">
                <!-- 2. 文本加大加宽 -->
                <view class="frequency-option-text">{{ item.text }}</view>
                <!-- 2. 日期水平排列 -->
                <view
                  v-if="tempSelectedFrequencyInterval === item.value"
                  class="frequency-preview-dates"
                >
                  <view class="preview-date-item">
                    <text class="preview-date-label">下次订单</text>
                    <text class="preview-date-value">
                      <!-- 2. 日期不显示星期 -->
                      {{
                        getFrequencyPreviewDates(item.originalFrequency, true).nextDateFormatted
                      }}</text
                    >
                  </view>
                  <view class="preview-date-item">
                    <text class="preview-date-label">后续订单</text>
                    <text class="preview-date-value">
                      {{
                        getFrequencyPreviewDates(item.originalFrequency, true)
                          .followingDateFormatted
                      }}</text
                    >
                  </view>
                </view>
              </view>
            </label>
          </radio-group>
        </scroll-view>
        <view class="popup-footer">
          <button class="btn-secondary" @click="closePopup('changeFreqPopupRef')">取消</button>
          <button class="btn-primary" @click="saveNewFrequency">保存</button>
        </view>
      </view>
    </uni-popup>

    <!-- 弹窗：跳过单个商品 -->
    <uni-popup ref="skipItemPopupRef" type="center" :is-mask-click="false">
      <view class="popup-content popup-center" v-if="selectedItem">
        <view class="popup-header">
          <text class="popup-title">跳过此商品一次？</text>
          <uni-icons
            type="closeempty"
            size="24"
            @click="closePopup('skipItemPopupRef')"
          ></uni-icons>
        </view>
        <view class="popup-body">
          <view class="popup-item-info">
            <image
              :src="selectedItem.item.thumbnail"
              class="popup-item-image"
              mode="aspectFit"
            ></image>
            <text class="popup-item-name">{{ selectedItem.item.name }}</text>
          </view>
          <view class="popup-date-box">
            <text class="popup-date-label">新订单日期</text>
            <text class="popup-date-value">
              <!-- 0. 智能日期格式 -->
              {{
                subscriptionData
                  ? formatSmartDate(subscriptionData.subscription.fulfillment.followingShipment)
                  : ''
              }}
            </text>
          </view>
          <text class="popup-text-small"> 跳过此商品可能会影响您的优惠或免运费资格。 </text>
          <text class="popup-text-small">您可以稍后随时将其加回。</text>
        </view>
        <view class="popup-footer-column">
          <button class="btn-primary" @click="handleSkipItem">跳过一次</button>
          <button class="btn-secondary" @click="closePopup('skipItemPopupRef')">取消</button>
        </view>
      </view>
    </uni-popup>

    <!-- 弹窗：移除单个商品 -->
    <uni-popup ref="removeItemPopupRef" type="center" :is-mask-click="false">
      <view class="popup-content popup-center" v-if="selectedItem">
        <view class="popup-header">
          <text class="popup-title">移除此商品？</text>
          <uni-icons
            type="closeempty"
            size="24"
            @click="closePopup('removeItemPopupRef')"
          ></uni-icons>
        </view>
        <view class="popup-body">
          <view class="popup-item-info">
            <image
              :src="selectedItem.item.thumbnail"
              class="popup-item-image-large"
              mode="aspectFit"
            ></image>
            <text class="popup-item-name">{{ selectedItem.item.name }}</text>
          </view>
          <text class="popup-text">如果您只是暂时不需要，可以“跳过一次”。</text>
        </view>
        <view class="popup-footer-column">
          <button class="btn-danger" @click="handleRemoveItem">移除商品</button>
          <button class="btn-secondary" @click="closePopup('removeItemPopupRef')">保留商品</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { subscriptionApi } from '@/api/subscription'
import type {
  AutoshipData,
  Item,
  Frequency,
  FrequencyPairing,
  Payment,
  UpdateSubscriptionParams,
  UpdateType,
  // 5. 从 subscription 移除
} from '@/types/subscription'
// 5. 修复 AddressItem 导入路径
import type { AddressItem } from '@/types/address'

// 定义 HTTP 响应类型
type Data<T> = {
  code: string
  msg: string
  result: T
}

// 2. 修复日期不可选: 更新 Mock 数据日期到未来 (2025年12月)
const userJsonData = {
  data: {
    autoship: {
      subscription: {
        id: '8216735700',
        fulfillmentRequestId: '9401704878',
        name: 'Autoship #1',
        authorizationDate: '2025-12-04', // [MODIFIED] 2
        startDate: '2025-11-01', // [MODIFIED] 2
        fulfillment: {
          nextShipment: '2025-12-06', // [MODIFIED] 2
          followingShipment: '2026-01-10', // [MODIFIED] 2
          frequency: {
            unit: 'Week',
            interval: 5,
          },
          frequencyPairings: [
            { frequency: { interval: 1, unit: 'Week' }, date: '2025-12-13' }, // [MODIFIED] 2
            { frequency: { interval: 2, unit: 'Week' }, date: '2025-12-20' }, // [MODIFIED] 2
            { frequency: { interval: 3, unit: 'Week' }, date: '2025-12-27' }, // [MODIFIED] 2
            { frequency: { interval: 4, unit: 'Week' }, date: '2026-01-03' }, // [MODIFIED] 2
            { frequency: { interval: 5, unit: 'Week' }, date: '2026-01-10' }, // [MODIFIED] 2
            { frequency: { interval: 6, unit: 'Week' }, date: '2026-01-17' }, // [MODIFIED] 2
            { frequency: { interval: 7, unit: 'Week' }, date: '2026-01-24' }, // [MODIFIED] 2
            { frequency: { interval: 8, unit: 'Week' }, date: '2026-01-31' }, // [MODIFIED] 2
            { frequency: { interval: 5, unit: 'Mon' }, date: '2026-05-06' }, // [MODIFIED] 2
          ],
        },
        address: {
          id: '298395228',
          address1: '13775 GERANIUM AVE',
          address2: 'APT 4N',
          city: 'FLUSHING',
          state: 'NY',
          postalCode: '11355-4102',
          country: 'US',
          name: 'lucky',
          phoneNumber: '8578804033',
        },
        amountDue: {
          amount: 35.2,
          currency: 'USD',
        },
        blocked: false,
        blocks: [],
        currency: 'USD',
        items: [
          {
            adjustments: [
              { type: 'ShippingAmount', amount: '2.48' },
              { type: 'ShippingTax', amount: '0.08' },
              { type: 'ShippingTax', amount: '0.07' },
              { type: 'ShippingTax', amount: '0.07' },
              { type: 'SalesTax', amount: '0.6' },
              { type: 'SalesTax', amount: '0.68' },
              { type: 'SalesTax', amount: '0.05' },
            ],
            siteId: '10',
            totalAdjustments: '0.00',
            totalDiscountAdjustment: '0.00',
            totalProduct: '19.02',
            price: '14.99',
            quantity: 1,
            skipNext: false,
            item: {
              id: '131879',
              name: 'Wobble Wag Giggle Ball Dog Toy',
              thumbnail:
                'https://image.chewy.com/catalog/general/images/as-seen-on-tv-wobble-wag-giggle-ball-dog-toy/img-313416._SS144_V1_.jpeg',
            },
          },
          {
            adjustments: [
              { type: 'ShippingAmount', amount: '2.47' },
              { type: 'Promotion', amount: '-0.65' },
              { type: 'ShippingTax', amount: '0.08' },
              { type: 'ShippingTax', amount: '0.07' },
              { type: 'ShippingTax', amount: '0.07' },
              { type: 'SalesTax', amount: '0.52' },
              { type: 'SalesTax', amount: '0.58' },
              { type: 'SalesTax', amount: '0.05' },
            ],
            siteId: '10',
            totalAdjustments: '-0.65',
            totalDiscountAdjustment: '-0.65',
            totalProduct: '16.18',
            price: '12.99',
            quantity: 1,
            skipNext: false,
            item: {
              id: '201429',
              name: 'Giraffe Bobberz Plush Squeaky Dog Toy, Large/X-Large',
              thumbnail:
                'https://image.chewy.com/catalog/general/images/frisco-giraffe-bobberz-plush-squeaky-dog-toy-largex-large/img-733118._SS144_V1_.jpeg',
            },
          },
          {
            adjustments: [],
            siteId: '10',
            totalAdjustments: '0.00',
            totalDiscountAdjustment: '0.00',
            totalProduct: '9.99',
            price: '9.99',
            quantity: 1,
            skipNext: true,
            item: {
              id: '301450',
              name: 'Frisco Hide and Seek Plush Chewy Box Toy',
              thumbnail:
                'https://image.chewy.com/catalog/product-images/174743_MAIN._SS144_V1605888200_.jpg',
            },
          },
        ],
        orders: [
          { id: '1697820544', status: 'DEPOSITED', placed: '2025-11-01', shipped: '2025-11-02' }, // [MODIFIED] 2
        ],
        totalOrder: '35.20',
        totalProduct: '27.98',
        totalShipping: '4.95',
        totalTax: '2.48',
        totalTaxShipping: '0.44',
        totalLoyaltyHealthcareAdjustment: { amount: 0, currency: 'USD' },
        totalLoyaltyRewardsAdjustment: { amount: 0, currency: 'USD' },
        totalLoyaltyEarnedRewards: { amount: 0, currency: 'USD' },
        orderedWithinLastSevenDays: true,
        placed: '2025-11-01', // [MODIFIED] 2
        paymentFailureCount: 0,
        payments: [
          {
            paymentMethodType: 'APPLEPAY',
            instructionId: '72d28955-c97f-4273-a94a-dc19aad3ad10',
            walletId: '96e8dfcf-c1d9-4b56-9f9a-f2d715986618',
            paymentMethod: {
              id: '72d289T2d28955-c97f-4273-a94a-dc19aad3ad10',
              detail: { __typename: 'ApplePay' },
            },
          },
        ],
        promos: [],
        subscriptions: [
          { lastChildOrderStatus: 'S', properties: { planType: null }, paymentFailureCount: 0 },
          { lastChildOrderStatus: 'S', properties: { planType: null }, paymentFailureCount: 0 },
        ],
      },
      currentUser: {
        lifetimeSavings: {
          amountSaved: { amount: 26, currency: 'USD' },
        },
      },
      paymentMethods: [
        {
          id: '0a83362e-aff0-3b1b-af09-bd1b098a55dd',
          paymentMethodType: 'ACCOUNTBALANCE',
          detail: {
            id: '0a83362e-aff0-3b1b-af09-bd1b098a55dd',
            balance: { amount: 0, currency: 'USD' },
          },
        },
      ],
    },
  },
}

// 映射地址
const rawAddress = userJsonData.data.autoship.subscription.address
const mockAddress: AddressItem = {
  id: rawAddress.id,
  receiver: rawAddress.name,
  contact: rawAddress.phoneNumber,
  address: `${rawAddress.address1} ${rawAddress.address2 || ''}`.trim(),
  fullLocation: `${rawAddress.city}, ${rawAddress.state} ${rawAddress.postalCode}`,
  provinceCode: rawAddress.state,
  cityCode: rawAddress.city,
  countyCode: '', // 抓包数据没有区/县编码
  isDefault: 1, // 假设是默认
}

// 6. 修复 Mock AutoshipData 构造
const mockAutoshipData: AutoshipData = {
  currentUser: {
    lifetimeSavings: {
      amountSaved: { amount: 26, currency: 'usd' },
      savingsSinceMonths: 100,
      savingsSinceYear: 200,
    },
  },
  paymentMethods: [
    {
      id: '0a83362e-aff0-3b1b-af09-bd1b098a55dd',
      paymentMethodType: 'ACCOUNTBALANCE',
      detail: {
        id: '0a83362e-aff0-3b1b-af09-bd1b098a55dd',
        balance: { amount: 0, currency: 'USD' },
      },
    },
  ],
  subscription: {
    ...userJsonData.data.autoship.subscription, // 展开抓包数据中的所有 subscription 字段
    address: mockAddress, // 覆盖 address
    // 7. 修复 Item 类型
    items: userJsonData.data.autoship.subscription.items.map((item: any) => ({
      ...item,
      // 1. 修复 adjustments (补充 null)
      adjustments: item.adjustments.map((adj: any) => ({
        type: adj.type,
        amount: adj.amount,
        code: adj.code || null,
        id: adj.id || null,
        description: adj.description || null,
        shortDescription: adj.shortDescription || null,
        displayLevel: adj.displayLevel || null,
      })),
      // 2. 修复 item details (补充默认值)
      item: {
        id: item.item.id,
        name: item.item.name,
        thumbnail: item.item.thumbnail,
        partNumber: item.item.partNumber || '',
        brand: item.item.brand || '',
        description: item.item.description || '',
        isGiftCard: item.item.isGiftCard || false,
        isPharma: item.item.isPharma || false,
        isVetDiet: item.item.isVetDiet || false,
        isFrozen: item.item.isFrozen || false,
        isSingleTablet: item.item.isSingleTablet || false,
        isAutoshipAllowed: item.item.isAutoshipAllowed || true,
        petTypes: item.item.petTypes || [],
        rxFrequency: item.item.rxFrequency || {},
        foodFlavor: item.item.foodFlavor || [],
        size: item.item.size || [],
      },
      // 3. 修复 Item 根属性 (补充默认值)
      fulfillmentItemId: item.fulfillmentItemId || `item-${item.item.id}`,
      bundleComponentItems: item.bundleComponentItems || [],
      isVirtualBundle: item.isVirtualBundle || false,
      autoAdd: item.autoAdd || false,
      contactVet: item.contactVet || false,
      clinic: item.clinic || {},
      pet: item.pet || {},
      oosReplacement: item.oosReplacement || { isOos: false, alternatives: [] },
      oneTime: item.oneTime || false,
      subscriptionId: item.subscriptionId || userJsonData.data.autoship.subscription.id,
    })) as Item[], // 类型断言
  },
}
// End Mock Data

// API 数据
const subscriptionData = ref<AutoshipData | null>(null)
const isLoading = ref(true)
const subscriptionId = ref('')
const successMessage = ref('')
const FREE_SHIPPING_THRESHOLD = 49.0

// 1. 重命名状态
const isRenaming = ref(false)
const tempSubscriptionName = ref('')

// 弹窗 Refs
type PopupRef = InstanceType<typeof UniPopup> | null
const changeDatePopupRef = ref<PopupRef>(null)
const skipOrderPopupRef = ref<PopupRef>(null)
const changeFreqPopupRef = ref<PopupRef>(null)
const skipItemPopupRef = ref<PopupRef>(null)
const removeItemPopupRef = ref<PopupRef>(null)

// 弹窗内部状态
const tempSelectedDate = ref('')
const tempSelectedFrequency = ref<Frequency | null>(null)
// 3. 频率 Bug 修复: v-model 类型改为 string
const tempSelectedFrequencyInterval = ref<string | null>(null)
const selectedItem = ref<Item | null>(null)

// --- 1. 数据加载 ---
onLoad(async (options) => {
  const id = options?.id

  // 使用 Mock Data
  subscriptionData.value = mockAutoshipData
  subscriptionId.value = mockAutoshipData.subscription.id
  // 初始化弹窗的默认值
  // [MODIFIED] 2. 日期弹窗默认值=minChangeDate (将在下面 openChangeDatePopup 中设置，因为 minChangeDate 是 computed)
  tempSelectedFrequency.value = mockAutoshipData.subscription.fulfillment.frequency
  // 3. 频率 Bug 修复: 初始化 v-model
  tempSelectedFrequencyInterval.value =
    mockAutoshipData.subscription.fulfillment.frequency.unit +
    '-' +
    mockAutoshipData.subscription.fulfillment.frequency.interval
  isLoading.value = false
  // 注释掉 API 调用
  // await fetchSubscriptionDetails(id || 'default-id')
})

async function fetchSubscriptionDetails(id: string) {
  isLoading.value = true
  if (!id) {
    uni.showToast({ title: '无效的订阅ID', icon: 'none' })
    uni.navigateBack()
    return
  }
  subscriptionId.value = id

  try {
    const res = (await subscriptionApi.getSubscriptionDetails(id)) as unknown as Data<AutoshipData> // 类型断言
    if (res.code === '0') {
      subscriptionData.value = res.result
      tempSelectedDate.value = res.result.subscription.fulfillment.nextShipment // 保持 API 加载时的逻辑
      tempSelectedFrequency.value = res.result.subscription.fulfillment.frequency
      tempSelectedFrequencyInterval.value =
        res.result.subscription.fulfillment.frequency.unit +
        '-' +
        res.result.subscription.fulfillment.frequency.interval
    } else {
      throw new Error(res.msg || '加载失败')
    }
  } catch (error: any) {
    console.error('fetchSubscriptionDetails error:', error)
    uni.showToast({ title: error.message || '加载失败，请稍后重试', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

// --- 2. 核心：更新订阅 ---
async function callUpdateApi(
  params: Omit<UpdateSubscriptionParams, 'subscriptionId'>,
  successMsg: string,
) {
  if (!subscriptionData.value) return

  // 在 Mock 模式下模拟 API 行为
  if (subscriptionId.value === mockAutoshipData.subscription.id) {
    uni.showLoading({ title: '正在处理...' })
    await new Promise((resolve) => setTimeout(resolve, 500))

    const type = (params as any).type // 使用 as any 容纳新 type
    if (type === 'SKIP_ONCE_ITEM' && params.itemId) {
      const item = subscriptionData.value.subscription.items.find(
        (i) => i.fulfillmentItemId === params.itemId,
      )
      if (item) item.skipNext = true
    } else if (type === 'ADD_BACK_ITEM' && params.itemId) {
      const item = subscriptionData.value.subscription.items.find(
        (i) => i.fulfillmentItemId === params.itemId,
      )
      if (item) item.skipNext = false
    } else if (type === 'CHANGE_NEXTORDER_DATE' && params.nextOrderDate) {
      subscriptionData.value.subscription.fulfillment.nextShipment = params.nextOrderDate
    } else if (type === 'CHANGE_FREQUENCY' && params.frequency) {
      subscriptionData.value.subscription.fulfillment.frequency = params.frequency
    }
    // 1. 添加重命名 Mock 逻辑
    else if (type === 'CHANGE_SUBSCRIPTION_NAME' && (params as any).newName) {
      subscriptionData.value.subscription.name = (params as any).newName
    }

    uni.hideLoading()
    closeAllPopups()
    if (successMsg.startsWith('商品已跳过')) {
      successMessage.value = successMsg
      setTimeout(() => (successMessage.value = ''), 5000)
    } else {
      uni.showToast({ title: successMsg, icon: 'success' })
    }
    return // 结束模拟调用
  }
  // --- END Mock 模式 ---

  uni.showLoading({ title: '正在处理...' })
  try {
    const fullParams: UpdateSubscriptionParams = {
      ...params,
      subscriptionId: subscriptionData.value.subscription.id,
    }
    const res = (await subscriptionApi.updateSubscription(
      subscriptionId.value,
      fullParams,
    )) as unknown as Data<AutoshipData>

    if (res.code === '0') {
      subscriptionData.value = res.result
      closeAllPopups()
      if (successMsg.startsWith('商品已跳过')) {
        successMessage.value = successMsg
        setTimeout(() => (successMessage.value = ''), 5000)
      } else {
        uni.showToast({ title: successMsg, icon: 'success' })
      }
    } else {
      throw new Error(res.msg || '操作失败')
    }
  } catch (error: any) {
    console.error('callUpdateApi error:', error)
    uni.showToast({ title: error.message || '操作失败，请重试', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

// --- 3. 弹窗控制 ---
function closePopup(refName: keyof typeof popupRefs) {
  const ref = popupRefs[refName]
  ref.value?.close()
}

function closeAllPopups() {
  Object.values(popupRefs).forEach((ref) => ref.value?.close())
  selectedItem.value = null
}

const popupRefs = {
  changeDatePopupRef,
  skipOrderPopupRef,
  changeFreqPopupRef,
  skipItemPopupRef,
  removeItemPopupRef,
}

// --- 4. 事件处理器 - 打开弹窗 ---
function openChangeDatePopup() {
  if (!subscriptionData.value) return
  // [MODIFIED] 2. 设置默认选中日期为最小可选日期
  tempSelectedDate.value = minChangeDate.value
  changeDatePopupRef.value?.open()
}

function openSkipOrderPopup() {
  skipOrderPopupRef.value?.open()
}

function openChangeFreqPopup() {
  if (!subscriptionData.value) return
  tempSelectedFrequency.value = subscriptionData.value.subscription.fulfillment.frequency
  tempSelectedFrequencyInterval.value =
    subscriptionData.value.subscription.fulfillment.frequency.unit +
    '-' +
    subscriptionData.value.subscription.fulfillment.frequency.interval
  changeFreqPopupRef.value?.open()
}

function openSkipItemPopup(item: Item) {
  selectedItem.value = item
  skipItemPopupRef.value?.open()
}

function openRemoveItemPopup(item: Item) {
  selectedItem.value = item
  removeItemPopupRef.value?.open()
}

// --- 5. 事件处理器 - 弹窗内操作 ---

// 1. 重命名点击
async function handleRenameClick() {
  if (!subscriptionData.value) return

  if (isRenaming.value) {
    // 点击 "保存"
    if (
      !tempSubscriptionName.value ||
      tempSubscriptionName.value === subscriptionData.value.subscription.name
    ) {
      isRenaming.value = false
      return // 没有变化，直接退出
    }
    await callUpdateApi(
      {
        type: 'CHANGE_SUBSCRIPTION_NAME',
        newName: tempSubscriptionName.value,
      } as any, // 使用 as any 绕过 d.ts 限制
      '订阅已重命名',
    )
    isRenaming.value = false
  } else {
    // 点击 "重命名"
    isRenaming.value = true
    tempSubscriptionName.value = subscriptionData.value.subscription.name
  }
}

function navigateToAddItems() {
  uni.showToast({ title: '跳转到添加商品页 (未实现)', icon: 'none' })
}

// 8. 跳转到地址管理
const goToAddressManagement = () => {
  uni.navigateTo({ url: '/pages/account/address_list/address_list?source=subscription' })
}

// 4. 跳转到订单详情
function goToOrderDetails(orderId: string) {
  console.log('Mock: Navigating to order details for ID:', orderId)
  // uni.navigateTo({ url: `/pages/order/details?id=${orderId}` });
}

// 修改日期
function onCalendarChange(e: { fulldate: string }) {
  tempSelectedDate.value = e.fulldate
}
async function saveNewDate() {
  await callUpdateApi(
    {
      type: 'CHANGE_NEXTORDER_DATE',
      nextOrderDate: tempSelectedDate.value,
    },
    '订单日期已更新',
  )
}

// 跳过订单
async function handleSkipOrder() {
  await callUpdateApi({ type: 'SKIP_NEXTORDER' }, '订单已跳过')
}

// 立即下单
async function handleOrderNow() {
  await callUpdateApi({ type: 'ORDER_NOW' }, '订单已提交')
}

// 3. 修复: 替换为 radio-group 处理器
function onFrequencyRadioChange(e: { detail: { value: string } }) {
  const newIntervalKey = e.detail.value
  tempSelectedFrequencyInterval.value = newIntervalKey

  const pairing = frequencyOptions.value.find((f) => f.value === newIntervalKey)
  if (pairing) {
    tempSelectedFrequency.value = pairing.originalFrequency
  }
}
async function saveNewFrequency() {
  if (!tempSelectedFrequency.value) return
  await callUpdateApi(
    {
      type: 'CHANGE_FREQUENCY',
      frequency: tempSelectedFrequency.value,
    },
    '配送频率已更新',
  )
}

// 跳过商品
async function handleSkipItem() {
  if (!selectedItem.value) return
  await callUpdateApi(
    {
      type: 'SKIP_ONCE_ITEM',
      itemId: selectedItem.value.fulfillmentItemId,
    },
    `商品已跳过: ${selectedItem.value.item.name}`,
  )
}

// 加回商品
async function handleAddBackItem(item: Item) {
  await callUpdateApi(
    {
      type: 'ADD_BACK_ITEM',
      itemId: item.fulfillmentItemId,
    },
    '商品已加回订单',
  )
}

// 移除商品
async function handleRemoveItem() {
  if (!selectedItem.value) return
  await callUpdateApi(
    {
      type: 'REMOVE_ITEM',
      itemId: selectedItem.value.fulfillmentItemId,
    },
    '商品已移除',
  )
}

// 改变数量
function onQuantityChange(item: Item, newQuantity: number) {
  console.log(`Item ${item.item.name} quantity changed to ${newQuantity}`)
  uni.showToast({ title: `数量变为 ${newQuantity} (API未实现)`, icon: 'none' })
  // 模拟更新
  if (subscriptionId.value === mockAutoshipData.subscription.id) {
    item.quantity = newQuantity
  }
}

// 取消订阅
async function handleCancelSubscription() {
  uni.showModal({
    title: '确认取消',
    content: `你确定要取消 ${subscriptionData.value?.subscription.name} 吗?`,
    confirmColor: '#d9534f',
    success: async (res) => {
      if (res.confirm) {
        await callUpdateApi({ type: 'CANCEL_SUBSCRIPTION' }, '订阅已取消')
        // uni.navigateBack();
      }
    },
  })
}

// --- 6. 计算属性和格式化 ---

// 7. 拆分商品列表
const activeItems = computed(() => {
  if (!subscriptionData.value) return []
  return subscriptionData.value.subscription.items.filter((item) => !item.skipNext)
})
const skippedItems = computed(() => {
  if (!subscriptionData.value) return []
  return subscriptionData.value.subscription.items.filter((item) => item.skipNext)
})

// 7. 计算划线价
const getItemDisplayPrice = (item: Item) => {
  const price = parseFloat(item.price)
  const discount = parseFloat(item.totalDiscountAdjustment) || 0
  if (discount < 0) {
    const final = (price + discount).toFixed(2)
    return {
      finalPrice: `$${final}`,
      originalPrice: `$${item.price}`,
    }
  }
  return {
    finalPrice: `$${item.price}`,
    originalPrice: null,
  }
}

// 7. 重命名为 shippingDifference
const shippingDifference = computed(() => {
  if (!subscriptionData.value) return 0
  const total = parseFloat(subscriptionData.value.subscription.totalOrder)
  const shortfall = FREE_SHIPPING_THRESHOLD - total
  return shortfall > 0 ? shortfall : 0
})

// 7. 添加 shippingProgress
const shippingProgress = computed(() => {
  if (!subscriptionData.value) return 0
  const total = parseFloat(subscriptionData.value.subscription.totalOrder)
  const progress = (total / FREE_SHIPPING_THRESHOLD) * 100
  return Math.min(progress, 100)
})

// 预估税费
const estimatedTax = computed(() => {
  if (!subscriptionData.value) return '0.00'
  const tax = parseFloat(subscriptionData.value.subscription.totalTax) || 0
  const shippingTax = parseFloat(subscriptionData.value.subscription.totalTaxShipping) || 0
  return (tax + shippingTax).toFixed(2)
})

// 6. 频率助手函数
function addFrequencyToDate(date: Date, freq: Frequency): Date {
  const newDate = new Date(date.getTime())
  if (freq.unit === 'Week') {
    newDate.setDate(newDate.getDate() + freq.interval * 7)
  } else if (freq.unit === 'Mon') {
    // 抓包数据中有 'Mon'
    newDate.setMonth(newDate.getMonth() + freq.interval)
  }
  return newDate
}

// 6. 计算频率预览日期
// 2. 添加 noWeekday 参数
function getFrequencyPreviewDates(freq: Frequency, noWeekday = false) {
  if (!subscriptionData.value) return { nextDateFormatted: '', followingDateFormatted: '' }

  const pairing = subscriptionData.value.subscription.fulfillment.frequencyPairings.find(
    (p) => p.frequency.interval === freq.interval && p.frequency.unit === freq.unit,
  )

  if (!pairing) return { nextDateFormatted: 'N/A', followingDateFormatted: 'N/A' }

  const nextDate = new Date(pairing.date)
  const followingDate = addFrequencyToDate(nextDate, freq)
  const formatFunc = noWeekday ? formatShortDateWithoutWeekday : formatSmartDate

  return {
    nextDateFormatted: formatFunc(nextDate.toISOString()),
    followingDateFormatted: formatFunc(followingDate.toISOString()),
  }
}

// 频率选项
const frequencyOptions = computed(() => {
  if (!subscriptionData.value) return []
  return subscriptionData.value.subscription.fulfillment.frequencyPairings.map((pairing) => ({
    // 3. 频率 Bug 修复: 使用组合键
    value: pairing.frequency.unit + '-' + pairing.frequency.interval,
    text: formatFrequency(pairing.frequency),
    originalFrequency: pairing.frequency,
  }))
})

// 1. 日期规则: 当前日期 + 2
const minChangeDate = computed(() => {
  const today = new Date()
  today.setDate(today.getDate() + 2) // 1.
  return today.toISOString().split('T')[0]
})

// [MODIFIED] 3. 新增: 最大可选日期 (例如: 5年后)
const maxChangeDate = computed(() => {
  const today = new Date()
  today.setFullYear(today.getFullYear() + 5)
  return today.toISOString().split('T')[0]
})

// 0 & 3. 新的智能日期格式化函数
function formatSmartDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()

  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC', // 假设传入的是UTC日期
  }

  if (date.getFullYear() !== now.getFullYear()) {
    options.year = 'numeric'
  }

  const datePart = date.toLocaleDateString('zh-CN', options)
  const weekdayPart = date.toLocaleDateString('zh-CN', { weekday: 'long', timeZone: 'UTC' })

  return `${datePart} ${weekdayPart}`
}

// 2. 新增: 不带星期的日期格式
function formatShortDateWithoutWeekday(dateStr: string): string {
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
  return date.toLocaleDateString('zh-CN', options)
}

// 0 & 3. 更新日期时间格式化函数
function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()

  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: 'UTC', // 假设传入的是UTC日期
  }

  if (date.getFullYear() !== now.getFullYear()) {
    options.year = 'numeric'
  }

  const dateTimePart = date.toLocaleString('zh-CN', options)
  const weekdayPart = date.toLocaleDateString('zh-CN', { weekday: 'long', timeZone: 'UTC' })

  // 检查是否已包含星期 (toLocaleString 可能会自动包含)
  if (dateTimePart.includes(weekdayPart.slice(2))) {
    return dateTimePart
  }

  return `${dateTimePart} ${weekdayPart}`
}

// (原 formatShortDate 已被 formatSmartDate 替代)

function formatFrequency(freq: Frequency): string {
  if (!freq) return ''
  const unit = freq.unit === 'Week' ? '周' : freq.unit === 'Mon' ? '个月' : freq.unit
  return `每 ${freq.interval} ${unit}`
}

function formatPayment(payment: Payment): string {
  if (!payment) return 'N/A'
  switch (payment.paymentMethodType) {
    case 'APPLEPAY':
      return 'Apple Pay'
    case 'CREDITCARD':
      return '信用卡'
    default:
      return payment.paymentMethodType
  }
}
</script>

<style lang="scss" scoped>
// 页面和滚动容器
page {
  background-color: $uni-bg-color-grey;
}
.page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.scroll-view-content {
  flex: 1;
  height: 100%;
  box-sizing: border-box;
}
.loading-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

// 1. 订阅名称
.subscription-name-bar {
  display: flex;
  justify-content: flex-start; // 1
  gap: $uni-spacing-row-base; // 1
  align-items: center;
  padding: $uni-spacing-col-lg $uni-spacing-row-lg;
  background-color: $uni-bg-color;
  border-bottom: 1px solid mix($uni-border-color, $uni-bg-color, 20%);
  .subscription-name {
    font-size: $uni-font-size-title;
    color: $uni-text-color;
    font-weight: bold;
  }
  // 1. 输入框样式
  .subscription-name-input {
    font-size: $uni-font-size-title;
    color: $uni-text-color;
    font-weight: bold;
    border-bottom: 1px solid $uni-color-primary;
    flex: 1;
    padding: 0;
  }
  .btn-rename {
    font-size: $uni-font-size-sm !important;
    flex-shrink: 0; // 防止按钮被压缩
  }
}

// 2. 加粗文本
.text-bold {
  font-weight: bold;
  color: $uni-text-color;
}

// 通用按钮样式
button {
  font-size: $uni-font-size-base;
  border-radius: 22px; // 9
  padding: 0 $uni-spacing-row-lg;
  height: 44px; // 9
  line-height: 44px; // 9
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  &::after {
    border: none;
  }
}

.btn-primary {
  background-color: $uni-color-primary;
  color: $uni-text-color-inverse;
}
.btn-secondary {
  background-color: $uni-bg-color;
  color: $uni-color-primary;
  border: 1px solid $uni-color-primary;
}
.btn-danger {
  background-color: $uni-color-error;
  color: $uni-text-color-inverse;
}
.btn-text-link {
  // 1. 按钮样式: 半圆形(药丸形)
  background-color: $uni-bg-color;
  color: $uni-color-primary;
  border: 1px solid $uni-color-primary;
  margin: 0;
  height: 40px; // 1
  line-height: 40px; // 1
  font-size: $uni-font-size-base;
  border-radius: 20px; // 1 (height / 2)
  padding: 0 $uni-spacing-row-lg; // 1 (增加内边距)

  // 1 & 4. 加长按钮
  &.btn-long {
    padding: 0 $uni-spacing-row-lg * 2;
  }

  &.btn-rename {
    font-size: $uni-font-size-sm;
    height: 32px; // 1
    line-height: 32px; // 1
    border-radius: 16px; // 1
  }

  &.btn-remove {
    color: $uni-color-error;
    border-color: $uni-color-error; // 边框也变红
  }
}
.btn-full {
  width: 100%;
}
.button-group-row {
  display: flex;
  gap: $uni-spacing-row-base;
  margin-top: $uni-spacing-row-lg;
  > button {
    flex: 1;
  }
}

// 卡片内样式
:deep(.uni-card) {
  border-radius: $uni-border-radius-lg !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin: $uni-spacing-row-base !important;
  padding: $uni-spacing-row-lg !important;
}

.section {
  display: flex;
  flex-direction: column;
}
.section-label {
  font-size: $uni-font-size-base;
  color: $uni-text-color-grey;
  margin-bottom: $uni-spacing-col-sm;
}
.section-value {
  font-size: $uni-font-size-lg;
  color: $uni-text-color;
  font-weight: 500; // 默认
  // 3 & 4. 加粗
  &.text-bold {
    font-weight: bold;
    color: $uni-text-color;
  }
}
// 2. 配送频率字体加大
.frequency-card .section-value {
  font-size: 20px;
}
.section-value-large {
  font-size: 22px;
  color: $uni-text-color;
  font-weight: bold;
}
.section-subtitle {
  font-size: $uni-font-size-sm;
  color: $uni-text-color-grey;
  margin-top: $uni-spacing-col-sm;
}
.row-flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  > view {
    display: flex;
    flex-direction: column;
  }
  uni-icons {
    color: $uni-text-color-grey;
  }
}

// 列表标题
.list-title {
  font-size: $uni-font-size-lg;
  font-weight: bold;
  color: $uni-text-color;
  padding: $uni-spacing-row-lg $uni-spacing-row-lg 5px $uni-spacing-row-lg;
}

// 商品列表项
.item-row {
  display: flex;
  gap: $uni-spacing-row-lg;
}
.item-image {
  width: 80px;
  height: 80px;
  border-radius: $uni-border-radius-base;
  flex-shrink: 0;
  background-color: #eee;
}
.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.item-name {
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.item-price-row {
  display: flex;
  align-items: flex-end;
  gap: $uni-spacing-row-base;
  margin-top: $uni-spacing-col-sm;
}
.item-price-final {
  font-size: $uni-font-size-lg;
  color: $uni-text-color;
  font-weight: bold;
}
.item-price-original {
  font-size: $uni-font-size-sm;
  color: $uni-text-color-grey;
  text-decoration: line-through;
}

.quantity-stepper {
  margin-top: $uni-spacing-col-base;
  display: flex;
  justify-content: flex-start;
}

.item-actions {
  display: flex;
  justify-content: space-between;
  gap: $uni-spacing-row-base;
  margin-top: $uni-spacing-row-lg;
  padding-top: $uni-spacing-row-lg;
  border-top: 1px solid mix($uni-border-color, $uni-bg-color, 20%);
  > .btn-text-link {
    flex: 1;
    text-align: center;
  }
}
.skipped-item-tag {
  display: flex;
  align-items: center;
  gap: $uni-spacing-row-sm;
  background-color: mix($uni-color-success, $uni-bg-color, 15%);
  color: $uni-color-success;
  font-size: $uni-font-size-sm;
  font-weight: 500;
  padding: $uni-spacing-col-sm $uni-spacing-col-base;
  border-radius: $uni-border-radius-base;
  margin-bottom: $uni-spacing-row-base;
  width: fit-content;
}

.add-more-items-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $uni-spacing-row-base;
  margin: $uni-spacing-row-base;
  // 6. 高度加倍
  padding: ($uni-spacing-row-lg * 2) $uni-spacing-row-lg;
  background-color: $uni-bg-color;
  border: 1px dashed $uni-color-primary;
  border-radius: $uni-border-radius-lg;
  color: $uni-color-primary;
  font-size: $uni-font-size-base;
  font-weight: 500;
  .add-item-icon {
    color: $uni-color-primary;
  }
}

// 7. 免运费进度条
.shipping-progress-wrapper {
  background-color: $uni-bg-color;
  padding: $uni-spacing-row-lg;
  // 4. 布局调整
  margin: ($uni-spacing-row-lg * 2) $uni-spacing-row-base 0 $uni-spacing-row-base;
  border-radius: $uni-border-radius-lg;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  // 5. 文字样式
  .progress-text {
    font-size: $uni-font-size-sm;
    color: $uni-text-color-grey;
    margin-bottom: $uni-spacing-col-base; // 5
    display: block;
    text-align: left; // 5
    .highlight {
      color: $uni-color-error;
      font-weight: 500;
    }
    &.success {
      color: $uni-color-success;
      font-weight: 500;
    }
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background-color: $uni-bg-color-grey;
    border-radius: 4px;
    overflow: hidden;
  }
  .progress-bar-inner {
    height: 100%;
    background-color: $uni-color-success;
    border-radius: 4px;
    transition: width 0.3s ease;
  }
}

// 订单总览
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: $uni-font-size-base;
  color: $uni-text-color-grey;
  margin-bottom: $uni-spacing-col-base;
}
.summary-divider {
  height: 1px;
  background-color: mix($uni-border-color, $uni-bg-color, 20%);
  margin: $uni-spacing-row-base 0;
}
.summary-total {
  font-size: $uni-font-size-lg;
  font-weight: bold;
  color: $uni-text-color;
}

// 8. 配送地址
.section-card {
  // 通用卡片样式 (用于地址)
  background-color: $uni-bg-color;
  margin: $uni-spacing-row-base;
  border-radius: $uni-border-radius-lg;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.address-section {
  padding: $uni-spacing-row-lg;
  // 5. 布局调整
  margin-top: 0 !important;
}
.address-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .address-info {
    flex: 1;
    font-size: $uni-font-size-base;
    color: $uni-text-color;
  }
  .address-line-1 {
    display: flex;
    align-items: center;
    gap: $uni-spacing-row-base;
    margin-bottom: $uni-spacing-col-sm;
    .name {
      font-size: $uni-font-size-lg;
      font-weight: bold;
    }
    .phone {
      font-size: $uni-font-size-base;
      color: $uni-text-color-grey;
    }
  }
  .address-line-2 {
    display: flex;
    align-items: center;
    gap: $uni-spacing-row-sm;
    font-size: $uni-font-size-sm;
    color: $uni-text-color-grey;
    .default-tag {
      background-color: mix($uni-color-primary, $uni-bg-color, 10%);
      color: $uni-color-primary;
      font-size: 10px;
      padding: 2px 4px;
      border-radius: $uni-border-radius-sm;
    }
  }
  .address-line-3 {
    margin-top: $uni-spacing-col-sm;
    font-size: $uni-font-size-base;
  }
}

// 底部区域
.savings-banner {
  background-color: mix($uni-color-success, $uni-bg-color, 15%);
  border: 1px solid $uni-color-success;
  border-radius: $uni-border-radius-lg;
  padding: $uni-spacing-row-lg;
  margin: $uni-spacing-row-base;
  .savings-text {
    color: $uni-color-success;
    font-size: $uni-font-size-base;
    font-weight: 500;
    text-align: center;
  }
}
.cancel-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  padding-bottom: 40px;
  .cancel-prompt {
    font-size: $uni-font-size-base;
    color: $uni-text-color-grey;
    margin-bottom: $uni-spacing-row-base;
  }
  .btn-cancel-subscription {
    // 9. 确保 "取消" 按钮是纯文本, 覆盖 .btn-text-link
    background-color: transparent;
    border: none;
    color: $uni-color-error;
    font-weight: 500;
    line-height: 1.5;
    padding: 0; // 移除 .btn-text-link 带来的 padding
  }
}

// 顶部成功横幅
.success-banner {
  display: flex;
  align-items: center;
  gap: $uni-spacing-row-base;
  background-color: mix($uni-color-success, $uni-bg-color, 15%);
  color: $uni-color-success;
  padding: $uni-spacing-col-lg $uni-spacing-row-lg;
  font-size: $uni-font-size-base;
  font-weight: 500;
  uni-icons:last-child {
    margin-left: auto;
  }
}

// --- 弹窗样式 ---
.popup-content {
  background-color: $uni-bg-color;
  border-radius: 10px 10px 0 0;
  display: flex;
  flex-direction: column;
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $uni-spacing-row-lg;
  border-bottom: 1px solid mix($uni-border-color, $uni-bg-color, 20%);
  .popup-title {
    font-size: $uni-font-size-lg;
    font-weight: bold;
    color: $uni-text-color;
  }
  uni-icons {
    color: $uni-text-color-grey;
  }
}
.popup-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.popup-text {
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  margin-bottom: $uni-spacing-row-lg;
}
.popup-text-small {
  font-size: $uni-font-size-sm;
  color: $uni-text-color-grey;
  margin-top: $uni-spacing-row-base;
}
.popup-date-box {
  background-color: $uni-bg-color-grey;
  border-radius: $uni-border-radius-lg;
  padding: $uni-spacing-row-lg;
  margin: $uni-spacing-row-lg 0;
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  .popup-date-label {
    font-size: $uni-font-size-sm;
    color: $uni-text-color-grey;
    display: block;
    margin-bottom: $uni-spacing-row-sm;
  }
  .popup-date-value {
    font-size: 20px;
    font-weight: bold;
    color: $uni-text-color;
  }
}
.popup-footer {
  display: flex;
  gap: $uni-spacing-row-base;
  padding: $uni-spacing-row-lg;
  border-top: 1px solid mix($uni-border-color, $uni-bg-color, 20%);
  > button {
    flex: 1;
  }
}
.popup-footer-column {
  display: flex;
  flex-direction: column;
  gap: $uni-spacing-row-base;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
  > button {
    width: 100%;
  }
}

// 居中弹窗特定样式
.popup-center {
  width: 90vw;
  max-width: 340px;
  border-radius: $uni-border-radius-lg;
  .popup-header {
    border-bottom: none;
    padding-bottom: 0;
  }
  .popup-footer-column {
    padding-top: 0;
  }
  .popup-item-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $uni-spacing-row-base;
    margin-bottom: $uni-spacing-row-lg;
  }
  .popup-item-image {
    width: 80px;
    height: 80px;
  }
  .popup-item-image-large {
    width: 120px;
    height: 120px;
  }
  .popup-item-name {
    font-size: $uni-font-size-base;
    font-weight: 500;
  }
}

// 3. 频率弹窗
.popup-frequency {
  // 3. 修复: <radio-group> 样式
  .frequency-option {
    display: flex; // 使用 flex 布局
    align-items: center; // 垂直居中
    padding: $uni-spacing-col-lg $uni-spacing-row-lg;
    border-bottom: 1px solid mix($uni-border-color, $uni-bg-color, 20%);

    // 2. Radio 按钮样式 (如果需要覆盖默认)
    radio {
      margin-right: $uni-spacing-row-base; // 与文本的间距
      transform: scale(0.8); // 稍微缩小一点
    }

    &.is-checked {
      background-color: mix($uni-color-primary, $uni-bg-color, 10%); // 选中背景色
    }
  }
  .frequency-option-content {
    flex: 1; // 占据剩余空间
    display: flex;
    flex-direction: column;
  }
  .frequency-option-text {
    // [MODIFIED] 1. 字体加大, 宽度调整
    font-size: $uni-font-size-lg + 2px; // 1
    font-weight: 500; // 1
    color: $uni-text-color;
    flex-basis: 50%; // 1
    margin-bottom: $uni-spacing-col-base; // 为日期留出空间
  }
  .frequency-preview-dates {
    display: flex; // 2. 水平排列
    gap: $uni-spacing-row-base; // 日期间隔
    background-color: $uni-bg-color-grey;
    border-radius: $uni-border-radius-base;
    padding: $uni-spacing-row-base $uni-spacing-row-lg;
    margin-top: $uni-spacing-col-base;

    .preview-date-item {
      // 2. 每个日期占一半
      flex: 1;
      text-align: center;
    }
    .preview-date-label {
      display: block;
      font-size: $uni-font-size-sm;
      color: $uni-text-color-grey;
      margin-bottom: $uni-spacing-col-sm;
    }
    .preview-date-value {
      font-size: $uni-font-size-base; // 2. 加大日期字体
      color: $uni-text-color;
      font-weight: bold; // 2. 加粗
    }
  }
  // 隐藏默认的 radio 圆点 (小程序/App) - 保留
  // #ifdef MP || APP-PLUS
  radio ::v-deep .uni-radio-input {
    // 可能需要调整样式以适配新布局, 但隐藏逻辑不变
    margin-right: 5px; // 示例调整
  }
  // #endif
  // 隐藏默认的 radio 圆点 (H5) - 保留
  // #ifdef H5
  input[type='radio'] {
    // 可能需要调整样式以适配新布局, 但隐藏逻辑不变
  }
  // #endif
}

// 日历弹窗
.popup-calendar {
  padding-bottom: env(safe-area-inset-bottom);
  // 2. 修复 "今天" 按钮位置
  :deep(.uni-calendar__header-btn-box) {
    justify-content: flex-start;
    padding-left: $uni-spacing-row-base;
  }
}
</style>
