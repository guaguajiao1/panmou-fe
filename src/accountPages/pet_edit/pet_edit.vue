<template>
  <view class="pet-wizard-page">
    <CustomNavigationBar :title="navTitle" />

    <!-- 进度条 -->
    <view class="progress-bar">
      <view class="progress-track">
        <view class="progress-fill" :style="{ width: progressWidth }" />
      </view>
      <text class="progress-text">{{ currentStep }}/{{ totalSteps }}</text>
    </view>

    <!-- 步骤内容 -->
    <scroll-view scroll-y class="wizard-content">
      <StepBasicInfo
        v-if="currentStep === 1"
        :model-value="formData"
        :breed-name="selectedBreedName"
        :locked-type="lockedType"
        :is-edit="isEdit"
        @update:model-value="updateFormData"
        @show-breed-picker="showBreedPicker = true"
        @show-date-picker="showDatePicker = true"
      />
      <StepWeight
        v-else-if="currentStep === 2"
        :model-value="formData"
        :pet-name="formData.name || '宠物'"
        :pet-type="formData.type"
        @update:model-value="updateFormData"
      />
      <StepActivity
        v-else-if="currentStep === 3"
        :model-value="formData"
        :pet-name="formData.name || '宠物'"
        :pet-type="formData.type"
        @update:model-value="updateFormData"
      />
      <StepPicky
        v-else-if="currentStep === 4"
        :model-value="formData"
        :pet-name="formData.name || '宠物'"
        :pet-type="formData.type"
        @update:model-value="updateFormData"
      />
      <StepAllergy
        v-else-if="currentStep === 5"
        :model-value="formData"
        :pet-name="formData.name || '宠物'"
        :pet-type="formData.type"
        :allergens="enums.foodAllergens"
        @update:model-value="updateFormData"
      />
      <StepHealth
        v-else-if="currentStep === 6"
        :model-value="formData"
        :pet-name="formData.name || '宠物'"
        :pet-type="formData.type"
        :health-issues="enums.healthIssues"
        @update:model-value="updateFormData"
      />
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="wizard-footer">
      <button v-if="currentStep > 1" class="btn-back" @click="prevStep">上一步</button>
      <button
        v-if="currentStep < totalSteps"
        class="btn-next"
        :disabled="!canProceed"
        @click="nextStep"
      >
        下一步
      </button>
      <button
        v-if="currentStep === totalSteps"
        class="btn-save"
        :disabled="!canProceed"
        @click="saveAndContinue"
      >
        {{ isCustomize ? '制定鲜食' : '保存' }}
      </button>
    </view>

    <!-- 品种选择器 -->
    <uni-popup ref="breedPopup" type="bottom" @change="onBreedPopupChange">
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">选择品种</text>
          <text class="popup-close" @click="showBreedPicker = false">完成</text>
        </view>
        <scroll-view scroll-y class="popup-list">
          <view
            v-for="item in enums.breeds"
            :key="item.id"
            class="popup-item"
            :class="{ selected: formData.breedId === item.id }"
            @click="selectBreed(item)"
          >
            <text>{{ item.name }}</text>
            <uni-icons
              v-if="formData.breedId === item.id"
              type="checkmarkempty"
              size="20"
              color="#004a99"
            />
          </view>
        </scroll-view>
      </view>
    </uni-popup>

    <!-- 日期选择器 -->
    <uni-popup ref="datePopup" type="bottom">
      <view class="popup-content date-picker">
        <view class="popup-header">
          <text class="popup-title">选择生日</text>
          <text class="popup-close" @click="showDatePicker = false">完成</text>
        </view>
        <picker-view :value="datePickerValue" class="picker-view" @change="onDateChange">
          <picker-view-column>
            <view v-for="year in years" :key="year" class="picker-item">{{ year }}年</view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="month in 12" :key="month" class="picker-item">{{ month }}月</view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="day in 31" :key="day" class="picker-item">{{ day }}日</view>
          </picker-view-column>
        </picker-view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { petApi } from '@/api/pet'
import { freshFoodApi } from '@/api/fresh-food'
import type { PetFormData, PetEnums, WizardMode, EnumItem, PetType } from '@/types/pet'
import StepBasicInfo from './components/StepBasicInfo.vue'
import StepWeight from './components/StepWeight.vue'
import StepActivity from './components/StepActivity.vue'
import StepPicky from './components/StepPicky.vue'
import StepAllergy from './components/StepAllergy.vue'
import StepHealth from './components/StepHealth.vue'

// 状态
const petId = ref('')
const mode = ref<WizardMode>('normal')
const lockedType = ref<PetType | ''>('') // 锁定的宠物类型，不可修改
const currentStep = ref(1)
const totalSteps = 6
const isLoading = ref(false)

const isEdit = computed(() => !!petId.value)
const isCustomize = computed(() => mode.value === 'customize')
const canSkip = computed(() => mode.value === 'normal')

const navTitle = computed(() => {
  if (isEdit.value) return '编辑宠物'
  return isCustomize.value ? '创建宠物档案' : '添加宠物'
})

const progressWidth = computed(() => `${(currentStep.value / totalSteps) * 100}%`)

// 表单数据
const formData = reactive<PetFormData>({
  avatar: '',
  name: '',
  type: 'dog',
  breedId: '',
  birthday: '',
  gender: 'male',
  neutered: false,
  currentWeight: undefined,
  idealWeight: undefined,
  bodyCondition: undefined,
  activityLevel: undefined,
  pickyLevel: undefined,
  hasFoodAllergies: undefined,
  foodAllergyIds: [],
  hasHealthIssues: undefined,
  healthIssueIds: [],
  onMedication: false,
  medicationIds: [],
  hasDrugAllergies: false,
  drugAllergyIds: [],
})

// 枚举数据
const enums = reactive<PetEnums>({
  breeds: [],
  foodAllergens: [],
  medications: [],
  drugAllergens: [],
  healthIssues: [],
})

// 弹窗控制
const breedPopup = ref()
const datePopup = ref()
const showBreedPicker = ref(false)
const showDatePicker = ref(false)

// 日期选择
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 30 }, (_, i) => currentYear - i)
const datePickerValue = ref([0, 0, 0])

// 计算属性
const selectedBreedName = computed(() => {
  const breed = enums.breeds.find((b) => b.id === formData.breedId)
  return breed?.name || ''
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return formData.name && formData.breedId && formData.birthday
    case 2:
      if (!isCustomize.value) return true
      return formData.currentWeight && formData.bodyCondition
    case 3:
      if (!isCustomize.value) return true
      return !!formData.activityLevel
    case 4:
      if (!isCustomize.value) return true
      return !!formData.pickyLevel
    case 5:
      // 必须明确选择有或没有过敏
      if (formData.hasFoodAllergies === undefined) return false
      return !formData.hasFoodAllergies || formData.foodAllergyIds.length > 0
    case 6:
      // 必须明确选择有或没有健康问题
      if (formData.hasHealthIssues === undefined) return false
      return !formData.hasHealthIssues || formData.healthIssueIds.length > 0
    default:
      return true
  }
})

// 监听弹窗控制
watch(showBreedPicker, (val) => {
  val ? breedPopup.value?.open() : breedPopup.value?.close()
})

watch(showDatePicker, (val) => {
  val ? datePopup.value?.open() : datePopup.value?.close()
})

// 监听类型切换，重新加载枚举
watch(
  () => formData.type,
  async (newType) => {
    formData.breedId = ''
    formData.foodAllergyIds = []
    formData.healthIssueIds = []
    await loadEnums(newType)
  },
)

// 方法
const loadEnums = async (type: PetType) => {
  try {
    const res = await petApi.getEnums(type)
    if (res && res.code === '0') {
      Object.assign(enums, res.result)
    }
  } catch (e) {
    console.error('加载枚举数据失败', e)
  }
}

const loadPet = async (id: string) => {
  isLoading.value = true
  try {
    const res = await petApi.get(id)
    if (res && res.code === '0') {
      const pet = res.result
      Object.assign(formData, {
        avatar: pet.avatar,
        name: pet.name,
        type: pet.type,
        breedId: pet.breedId,
        birthday: pet.birthday,
        gender: pet.gender,
        neutered: pet.neutered,
        currentWeight: pet.currentWeight,
        idealWeight: pet.idealWeight,
        bodyCondition: pet.bodyCondition,
        activityLevel: pet.activityLevel,
        pickyLevel: pet.pickyLevel,
        hasFoodAllergies: pet.hasFoodAllergies,
        foodAllergyIds: pet.foodAllergyIds || [],
        hasHealthIssues: pet.hasHealthIssues,
        healthIssueIds: pet.healthIssueIds || [],
        onMedication: pet.onMedication,
        medicationIds: pet.medicationIds || [],
        hasDrugAllergies: pet.hasDrugAllergies,
        drugAllergyIds: pet.drugAllergyIds || [],
      })
      await loadEnums(pet.type)
    }
  } catch (e) {
    console.error('加载宠物详情失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

// 处理子组件的表单数据更新
const updateFormData = (newData: PetFormData) => {
  Object.assign(formData, newData)
}

const selectBreed = (item: EnumItem) => {
  formData.breedId = item.id
  showBreedPicker.value = false
}

const onBreedPopupChange = (e: any) => {
  if (!e.show) {
    showBreedPicker.value = false
  }
}

const onDateChange = (e: any) => {
  const val = e.detail.value
  datePickerValue.value = val
  const year = years[val[0]]
  const month = String(val[1] + 1).padStart(2, '0')
  const day = String(val[2] + 1).padStart(2, '0')
  formData.birthday = `${year}-${month}-${day}`
}

const saveAndContinue = async () => {
  if (!canProceed.value) return

  isLoading.value = true
  try {
    const data = { ...formData }
    let res
    if (isEdit.value) {
      res = await petApi.update(petId.value, data)
    } else {
      res = await petApi.create(data)
    }

    if (res && res.code === '0') {
      if (isCustomize.value) {
        // 定制模式：先创建鲜食方案，再跳转到方案页
        const savedPetId = res.result.id
        const planRes = await freshFoodApi.createPlan({ petId: savedPetId })
        if (planRes && planRes.code === '0') {
          const planId = planRes.result.planId
          uni.redirectTo({
            url: `/freshFoodPages/fresh_food_plan/fresh_food_plan?planId=${planId}`,
          })
        } else {
          uni.showToast({ title: '创建鲜食方案失败', icon: 'none' })
        }
      } else {
        // 普通模式：返回列表
        uni.showToast({ title: isEdit.value ? '保存成功' : '添加成功', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1500)
      }
    } else {
      uni.showToast({ title: res?.msg || '操作失败', icon: 'none' })
    }
  } catch (e) {
    console.error('保存宠物失败', e)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

// 页面加载
onLoad(async (options) => {
  if (options?.mode === 'customize') {
    mode.value = 'customize'
  }
  // 处理锁定的宠物类型
  if (options?.lockedType === 'dog' || options?.lockedType === 'cat') {
    lockedType.value = options.lockedType
    formData.type = options.lockedType
  }
  if (options?.id) {
    petId.value = options.id
    await loadPet(options.id)
  } else {
    await loadEnums(formData.type)
  }
})
</script>

<style lang="scss" scoped>
.pet-wizard-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.progress-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;

  .progress-track {
    flex: 1;
    height: 8rpx;
    background-color: #e0e0e0;
    border-radius: 4rpx;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: #004a99;
    border-radius: 4rpx;
    transition: width 0.3s ease;
  }

  .progress-text {
    margin-left: 20rpx;
    font-size: 24rpx;
    color: #666;
  }
}

.wizard-content {
  flex: 1;
  height: 0; // 重要：配合flex:1让scroll-view正确计算高度
}

.wizard-footer {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

  button {
    flex: 1;
    height: 88rpx;
    line-height: 88rpx;
    border-radius: 44rpx;
    font-size: 30rpx;

    &::after {
      border: none;
    }
  }

  .btn-back {
    background-color: #f5f5f5;
    color: #666;
  }

  .btn-skip {
    background-color: transparent;
    color: #999;
    border: 1rpx solid #ddd;
  }

  .btn-next,
  .btn-save {
    background-color: #004a99;
    color: #fff;

    &[disabled] {
      background-color: #ccc;
    }
  }
}

// 弹窗样式
.popup-content {
  background-color: #fff;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 70vh;

  &.date-picker {
    height: 500rpx;
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;

  .popup-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
  }

  .popup-close {
    font-size: 28rpx;
    color: #004a99;
  }
}

.popup-list {
  max-height: 60vh;
}

.popup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
  font-size: 28rpx;
  color: #333;

  &.selected {
    color: #004a99;
    background-color: #f0f7ff;
  }
}

.picker-view {
  height: 400rpx;
}

.picker-item {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 32rpx;
  color: #333;
}
</style>
