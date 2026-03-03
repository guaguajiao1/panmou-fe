<template>
  <view class="landing-page">
    <CustomNavigationBar title="狗狗鲜食订阅" show-back />

    <!-- 加载状态 -->
    <view v-if="isLoading" class="loading-container">
      <uni-load-more status="loading" />
    </view>

    <template v-else-if="landingData">
      <!-- 内容滚动区域 -->
      <scroll-view scroll-y class="content-scroll">
        <!-- 1. Hero 首屏图片 -->
        <image class="hero-image" :src="landingData.heroImage" mode="widthFix" />

        <!-- 2. 介绍图片区域 -->
        <view class="benefit-section">
          <image
            v-for="(img, index) in landingData.benefitImages"
            :key="index"
            class="benefit-image"
            :src="img"
            mode="widthFix"
          />
        </view>

        <!-- 3. 用户评价区域 -->
        <view v-if="landingData.reviews && landingData.reviews.length > 0" class="reviews-section">
          <view class="section-header">
            <text class="section-title">🌟 真实用户评价</text>
          </view>
          <view class="reviews-list">
            <view v-for="review in landingData.reviews" :key="review.id" class="review-card">
              <!-- 用户信息 -->
              <view class="review-header">
                <image class="review-avatar" :src="review.avatar" mode="aspectFill" />
                <view class="review-user-info">
                  <text class="review-user-name">{{ review.userName }}</text>
                  <text class="review-pet-info">{{ review.petName }} · {{ review.petBreed }}</text>
                </view>
                <view class="review-rating">
                  <text
                    v-for="i in 5"
                    :key="i"
                    class="star"
                    :class="{ filled: i <= review.rating }"
                  >
                    {{ i <= review.rating ? '★' : '☆' }}
                  </text>
                </view>
              </view>
              <!-- 评价内容 -->
              <text class="review-content">{{ review.content }}</text>
              <!-- 图片 -->
              <view v-if="review.images && review.images.length > 0" class="review-images">
                <image
                  v-for="(img, imgIndex) in review.images"
                  :key="imgIndex"
                  class="review-image"
                  :src="img"
                  mode="aspectFill"
                  @click="previewImage(review.images, imgIndex)"
                />
              </view>
              <!-- 视频 -->
              <view v-if="review.video" class="review-video" @click="playVideo(review.video.url)">
                <image class="video-cover" :src="review.video.cover" mode="aspectFill" />
                <view class="video-play-btn">
                  <text class="play-icon">▶</text>
                </view>
              </view>
              <!-- 时间 -->
              <text class="review-date">{{ review.createdAt }}</text>
            </view>
          </view>
        </view>

        <!-- 4. 联系客服区域 -->
        <view class="contact-section">
          <text class="contact-title">{{ landingData.contactInfo.title }}</text>
          <text class="contact-desc">{{ landingData.contactInfo.description }}</text>
          <view class="contact-actions">
            <view v-if="landingData.contactInfo.wechatQrCode" class="contact-qrcode">
              <image
                class="qrcode-image"
                :src="landingData.contactInfo.wechatQrCode"
                mode="aspectFit"
              />
              <text class="qrcode-hint">微信扫码咨询</text>
            </view>
            <view
              v-if="landingData.contactInfo.phoneNumber"
              class="contact-phone"
              @click="callPhone"
            >
              <uni-icons type="phone-filled" size="24" color="#00a86b" />
              <text class="phone-number">{{ landingData.contactInfo.phoneNumber }}</text>
            </view>
          </view>
        </view>

        <!-- 5. FAQ 区域 -->
        <view class="faq-section">
          <view class="section-header">
            <text class="section-title">❓ 常见问题</text>
          </view>
          <view class="faq-list">
            <view
              v-for="(faq, index) in landingData.faqs"
              :key="index"
              class="faq-item"
              :class="{ expanded: expandedFaq === index }"
              @click="toggleFaq(index)"
            >
              <view class="faq-question">
                <text class="faq-q-text">{{ faq.question }}</text>
                <uni-icons :type="expandedFaq === index ? 'up' : 'down'" size="18" color="#999" />
              </view>
              <view v-if="expandedFaq === index" class="faq-answer">
                <text class="faq-a-text">{{ faq.answer }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 底部占位 -->
        <view class="footer-placeholder" />
      </scroll-view>

      <!-- 6. 底部固定 CTA 按钮 -->
      <view class="footer-cta">
        <button class="cta-button" @click="goToCustomize">
          {{ landingData.ctaText }}
        </button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { FreshFoodLandingData } from '@/types/fresh-food-landing'
import { freshFoodLandingApi } from '@/api/fresh-food-landing'

const isLoading = ref(false)
const landingData = ref<FreshFoodLandingData | null>(null)
const expandedFaq = ref<number | null>(null)

// 加载数据
const loadData = async () => {
  isLoading.value = true
  try {
    const res = await freshFoodLandingApi.getLandingData()
    if (res && res.code === '0') {
      landingData.value = res.result
    }
  } catch (e) {
    console.error('加载营销页数据失败', e)
  } finally {
    isLoading.value = false
  }
}

// 预览图片
const previewImage = (images: string[], current: number) => {
  uni.previewImage({
    urls: images,
    current,
  })
}

// 播放视频
const playVideo = (url: string) => {
  uni.navigateTo({
    url: `/pages/video-player/video-player?url=${encodeURIComponent(url)}`,
    fail: () => {
      // 如果没有视频播放页，直接用系统打开
      uni.showModal({
        title: '视频播放',
        content: '即将跳转播放视频',
        success: (res) => {
          if (res.confirm) {
            // #ifdef H5
            window.open(url)
            // #endif
          }
        },
      })
    },
  })
}

// 拨打电话
const callPhone = () => {
  if (landingData.value?.contactInfo.phoneNumber) {
    uni.makePhoneCall({
      phoneNumber: landingData.value.contactInfo.phoneNumber,
    })
  }
}

// 切换 FAQ 展开状态
const toggleFaq = (index: number) => {
  expandedFaq.value = expandedFaq.value === index ? null : index
}

// 跳转到定制页面
const goToCustomize = () => {
  uni.navigateTo({
    url: '/freshFoodPages/fresh_food_pets/fresh_food_pets?type=dog',
  })
}

onLoad(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.landing-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #fff;
}

.loading-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-scroll {
  flex: 1;
}

// Hero 区域
.hero-image {
  width: 100%;
  display: block;
}

// 介绍图片区域
.benefit-section {
  .benefit-image {
    width: 100%;
    display: block;
  }
}

// 评价区域
.reviews-section {
  padding: 40rpx 24rpx;
  background-color: #fafafa;
}

.section-header {
  margin-bottom: 24rpx;

  .section-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #1a1a1a;
  }
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.review-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.review-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.review-user-info {
  flex: 1;
  margin-left: 16rpx;

  .review-user-name {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
  }

  .review-pet-info {
    font-size: 24rpx;
    color: #999;
  }
}

.review-rating {
  .star {
    font-size: 28rpx;
    color: #ddd;

    &.filled {
      color: #ffb800;
    }
  }
}

.review-content {
  display: block;
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 16rpx;
}

.review-images {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;

  .review-image {
    width: 180rpx;
    height: 180rpx;
    border-radius: 8rpx;
  }
}

.review-video {
  position: relative;
  margin-bottom: 16rpx;

  .video-cover {
    width: 100%;
    height: 300rpx;
    border-radius: 12rpx;
  }

  .video-play-btn {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80rpx;
    height: 80rpx;
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    .play-icon {
      color: #fff;
      font-size: 32rpx;
      margin-left: 6rpx;
    }
  }
}

.review-date {
  font-size: 22rpx;
  color: #bbb;
}

// 联系客服区域
.contact-section {
  padding: 48rpx 24rpx;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  text-align: center;
}

.contact-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12rpx;
}

.contact-desc {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 32rpx;
}

.contact-actions {
  display: flex;
  justify-content: center;
  gap: 48rpx;
}

.contact-qrcode {
  display: flex;
  flex-direction: column;
  align-items: center;

  .qrcode-image {
    width: 200rpx;
    height: 200rpx;
    border-radius: 12rpx;
    background-color: #fff;
  }

  .qrcode-hint {
    margin-top: 12rpx;
    font-size: 24rpx;
    color: #666;
  }
}

.contact-phone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .phone-number {
    margin-top: 12rpx;
    font-size: 28rpx;
    font-weight: 600;
    color: #00a86b;
  }
}

// FAQ 区域
.faq-section {
  padding: 40rpx 24rpx;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.faq-item {
  background-color: #f8f8f8;
  border-radius: 12rpx;
  overflow: hidden;
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;

  .faq-q-text {
    flex: 1;
    font-size: 28rpx;
    font-weight: 500;
    color: #333;
  }
}

.faq-answer {
  padding: 0 24rpx 24rpx;

  .faq-a-text {
    font-size: 26rpx;
    color: #666;
    line-height: 1.6;
  }
}

// 底部占位
.footer-placeholder {
  height: 140rpx;
}

// 底部固定 CTA
.footer-cta {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.cta-button {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #00a86b 0%, #00c853 100%);
  color: #fff;
  font-size: 34rpx;
  font-weight: 700;
  border-radius: 48rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
