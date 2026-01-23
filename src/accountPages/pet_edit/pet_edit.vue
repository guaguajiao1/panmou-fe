<template>
  <view class="pet-edit-page">
    <CustomNavigationBar :title="isEdit ? '编辑宠物' : '添加宠物'" />

    <scroll-view scroll-y class="form-scroll">
      <view class="form-container">
        <!-- 头像上传 -->
        <view class="avatar-section" @click="chooseAvatar">
          <image class="avatar-preview" :src="formData.avatar || defaultAvatar" mode="aspectFill" />
          <view class="avatar-overlay">
            <uni-icons type="camera" size="28" color="#fff" />
          </view>
          <text class="avatar-tip">点击上传头像</text>
        </view>

        <!-- 基本信息 -->
        <view class="form-section">
          <view class="section-title">基本信息</view>

          <view class="form-item">
            <text class="label required">名称</text>
            <input
              v-model="formData.name"
              class="input"
              placeholder="请输入宠物名称"
              maxlength="20"
            />
          </view>

          <view class="form-item">
            <text class="label required">类型</text>
            <view class="type-selector">
              <view
                class="type-option"
                :class="{ active: formData.type === 'dog' }"
                @click="changeType('dog')"
              >
                🐕 狗
              </view>
              <view
                class="type-option"
                :class="{ active: formData.type === 'cat' }"
                @click="changeType('cat')"
              >
                🐈 猫
              </view>
            </view>
          </view>

          <view class="form-item" @click="showBreedPicker = true">
            <text class="label required">品种</text>
            <view class="picker-value">
              <text>{{ selectedBreedName || '请选择品种' }}</text>
              <uni-icons type="right" size="18" color="#999" />
            </view>
          </view>

          <view class="form-item" @click="showDatePicker = true">
            <text class="label required">生日</text>
            <view class="picker-value">
              <text>{{ formData.birthday || '请选择生日' }}</text>
              <uni-icons type="right" size="18" color="#999" />
            </view>
          </view>

          <view class="form-item">
            <text class="label required">性别</text>
            <view class="gender-selector">
              <view
                class="gender-option male"
                :class="{ active: formData.gender === 'male' }"
                @click="formData.gender = 'male'"
              >
                ♂ 公
              </view>
              <view
                class="gender-option female"
                :class="{ active: formData.gender === 'female' }"
                @click="formData.gender = 'female'"
              >
                ♀ 母
              </view>
            </view>
          </view>

          <view class="form-item">
            <text class="label">是否绝育</text>
            <switch
              :checked="formData.neutered"
              @change="formData.neutered = $event.detail.value"
            />
          </view>
        </view>

        <!-- 健康信息 -->
        <view class="form-section">
          <view class="section-title">健康信息</view>

          <!-- 食物过敏 -->
          <view class="form-item">
            <text class="label">是否有食物过敏</text>
            <switch
              :checked="formData.hasFoodAllergies"
              @change="formData.hasFoodAllergies = $event.detail.value"
            />
          </view>
          <view
            v-if="formData.hasFoodAllergies"
            class="sub-form-item"
            @click="showFoodAllergenPicker = true"
          >
            <text class="sub-label">过敏原</text>
            <view class="picker-value">
              <text>{{ selectedFoodAllergenNames || '请选择' }}</text>
              <uni-icons type="right" size="18" color="#999" />
            </view>
          </view>

          <!-- 服药 -->
          <view class="form-item">
            <text class="label">是否在服药</text>
            <switch
              :checked="formData.onMedication"
              @change="formData.onMedication = $event.detail.value"
            />
          </view>
          <view
            v-if="formData.onMedication"
            class="sub-form-item"
            @click="showMedicationPicker = true"
          >
            <text class="sub-label">服用的药</text>
            <view class="picker-value">
              <text>{{ selectedMedicationNames || '请选择' }}</text>
              <uni-icons type="right" size="18" color="#999" />
            </view>
          </view>

          <!-- 药物过敏 -->
          <view class="form-item">
            <text class="label">是否有药物过敏</text>
            <switch
              :checked="formData.hasDrugAllergies"
              @change="formData.hasDrugAllergies = $event.detail.value"
            />
          </view>
          <view
            v-if="formData.hasDrugAllergies"
            class="sub-form-item"
            @click="showDrugAllergenPicker = true"
          >
            <text class="sub-label">过敏药物</text>
            <view class="picker-value">
              <text>{{ selectedDrugAllergenNames || '请选择' }}</text>
              <uni-icons type="right" size="18" color="#999" />
            </view>
          </view>

          <!-- 健康问题 -->
          <view class="form-item">
            <text class="label">是否有健康问题</text>
            <switch
              :checked="formData.hasHealthIssues"
              @change="formData.hasHealthIssues = $event.detail.value"
            />
          </view>
          <view
            v-if="formData.hasHealthIssues"
            class="sub-form-item"
            @click="showHealthIssuePicker = true"
          >
            <text class="sub-label">健康问题</text>
            <view class="picker-value">
              <text>{{ selectedHealthIssueNames || '请选择' }}</text>
              <uni-icons type="right" size="18" color="#999" />
            </view>
          </view>
        </view>

        <!-- 删除按钮 -->
        <button v-if="isEdit" class="delete-btn" @click="deletePet">删除宠物</button>
      </view>
    </scroll-view>

    <!-- 保存按钮 -->
    <view class="footer-actions">
      <button class="save-btn" :disabled="!canSave" @click="savePet">
        {{ isEdit ? '保存修改' : '添加宠物' }}
      </button>
    </view>

    <!-- 品种选择器 -->
    <uni-popup ref="breedPopup" type="bottom" @change="onPopupChange">
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

    <!-- 多选弹窗组件 -->
    <uni-popup ref="multiSelectPopup" type="bottom">
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">{{ multiSelectTitle }}</text>
          <text class="popup-close" @click="closeMultiSelect">完成</text>
        </view>
        <scroll-view scroll-y class="popup-list">
          <view
            v-for="item in multiSelectOptions"
            :key="item.id"
            class="popup-item"
            :class="{ selected: multiSelectValue.includes(item.id) }"
            @click="toggleMultiSelect(item.id)"
          >
            <text>{{ item.name }}</text>
            <uni-icons
              v-if="multiSelectValue.includes(item.id)"
              type="checkmarkempty"
              size="20"
              color="#004a99"
            />
          </view>
        </scroll-view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { petApi } from '@/api/pet'
import type { PetProfile, PetEnums, PetType, EnumItem } from '@/types/pet'

const defaultAvatar = 'https://placehold.co/200x200/f0f0f0/999?text=Pet'

// 状态
const petId = ref('')
const isEdit = computed(() => !!petId.value)
const isLoading = ref(false)

// 表单数据
const formData = reactive({
  avatar: '',
  name: '',
  type: 'dog' as PetType,
  breedId: '',
  birthday: '',
  gender: 'male' as 'male' | 'female',
  neutered: false,
  hasFoodAllergies: false,
  foodAllergyIds: [] as string[],
  onMedication: false,
  medicationIds: [] as string[],
  hasDrugAllergies: false,
  drugAllergyIds: [] as string[],
  hasHealthIssues: false,
  healthIssueIds: [] as string[],
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
const multiSelectPopup = ref()
const showBreedPicker = ref(false)
const showDatePicker = ref(false)
const showFoodAllergenPicker = ref(false)
const showMedicationPicker = ref(false)
const showDrugAllergenPicker = ref(false)
const showHealthIssuePicker = ref(false)

// 多选弹窗状态
const multiSelectTitle = ref('')
const multiSelectOptions = ref<EnumItem[]>([])
const multiSelectValue = ref<string[]>([])
const multiSelectField = ref('')

// 日期选择
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 30 }, (_, i) => currentYear - i)
const datePickerValue = ref([0, 0, 0])

// 计算属性
const canSave = computed(() => formData.name && formData.breedId && formData.birthday)

const selectedBreedName = computed(() => {
  const breed = enums.breeds.find((b) => b.id === formData.breedId)
  return breed?.name || ''
})

const selectedFoodAllergenNames = computed(() => {
  return (
    formData.foodAllergyIds
      .map((id) => enums.foodAllergens.find((a) => a.id === id)?.name)
      .filter(Boolean)
      .join('、') || ''
  )
})

const selectedMedicationNames = computed(() => {
  return (
    formData.medicationIds
      .map((id) => enums.medications.find((m) => m.id === id)?.name)
      .filter(Boolean)
      .join('、') || ''
  )
})

const selectedDrugAllergenNames = computed(() => {
  return (
    formData.drugAllergyIds
      .map((id) => enums.drugAllergens.find((a) => a.id === id)?.name)
      .filter(Boolean)
      .join('、') || ''
  )
})

const selectedHealthIssueNames = computed(() => {
  return (
    formData.healthIssueIds
      .map((id) => enums.healthIssues.find((h) => h.id === id)?.name)
      .filter(Boolean)
      .join('、') || ''
  )
})

// 监听弹窗控制
watch(showBreedPicker, (val) => {
  val ? breedPopup.value?.open() : breedPopup.value?.close()
})

watch(showDatePicker, (val) => {
  val ? datePopup.value?.open() : datePopup.value?.close()
})

watch(showFoodAllergenPicker, (val) => {
  if (val)
    openMultiSelect('食物过敏原', enums.foodAllergens, formData.foodAllergyIds, 'foodAllergyIds')
})

watch(showMedicationPicker, (val) => {
  if (val) openMultiSelect('服用的药', enums.medications, formData.medicationIds, 'medicationIds')
})

watch(showDrugAllergenPicker, (val) => {
  if (val)
    openMultiSelect('过敏药物', enums.drugAllergens, formData.drugAllergyIds, 'drugAllergyIds')
})

watch(showHealthIssuePicker, (val) => {
  if (val)
    openMultiSelect('健康问题', enums.healthIssues, formData.healthIssueIds, 'healthIssueIds')
})

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
        hasFoodAllergies: pet.hasFoodAllergies,
        foodAllergyIds: pet.foodAllergyIds || [],
        onMedication: pet.onMedication,
        medicationIds: pet.medicationIds || [],
        hasDrugAllergies: pet.hasDrugAllergies,
        drugAllergyIds: pet.drugAllergyIds || [],
        hasHealthIssues: pet.hasHealthIssues,
        healthIssueIds: pet.healthIssueIds || [],
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

const changeType = async (type: PetType) => {
  if (formData.type === type) return
  formData.type = type
  formData.breedId = ''
  formData.foodAllergyIds = []
  formData.medicationIds = []
  formData.drugAllergyIds = []
  formData.healthIssueIds = []
  await loadEnums(type)
}

const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      formData.avatar = res.tempFilePaths[0]
    },
  })
}

const selectBreed = (item: EnumItem) => {
  formData.breedId = item.id
  showBreedPicker.value = false
}

const onDateChange = (e: any) => {
  const val = e.detail.value
  datePickerValue.value = val
  const year = years[val[0]]
  const month = String(val[1] + 1).padStart(2, '0')
  const day = String(val[2] + 1).padStart(2, '0')
  formData.birthday = `${year}-${month}-${day}`
}

const onPopupChange = (e: any) => {
  if (!e.show) {
    showBreedPicker.value = false
  }
}

const openMultiSelect = (title: string, options: EnumItem[], value: string[], field: string) => {
  multiSelectTitle.value = title
  multiSelectOptions.value = options
  multiSelectValue.value = [...value]
  multiSelectField.value = field
  multiSelectPopup.value?.open()
}

const toggleMultiSelect = (id: string) => {
  const idx = multiSelectValue.value.indexOf(id)
  if (idx === -1) {
    multiSelectValue.value.push(id)
  } else {
    multiSelectValue.value.splice(idx, 1)
  }
}

const closeMultiSelect = () => {
  const field = multiSelectField.value as keyof typeof formData
  if (field && Array.isArray(formData[field])) {
    ;(formData[field] as string[]) = [...multiSelectValue.value]
  }
  multiSelectPopup.value?.close()
  showFoodAllergenPicker.value = false
  showMedicationPicker.value = false
  showDrugAllergenPicker.value = false
  showHealthIssuePicker.value = false
}

const savePet = async () => {
  if (!canSave.value) return

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
      uni.showToast({ title: isEdit.value ? '保存成功' : '添加成功', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 1500)
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

const deletePet = async () => {
  const { confirm } = await uni.showModal({
    title: '提示',
    content: '确定要删除这只宠物吗？',
  })
  if (!confirm) return

  try {
    const res = await petApi.delete(petId.value)
    if (res && res.code === '0') {
      uni.showToast({ title: '删除成功', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 1500)
    }
  } catch (e) {
    uni.showToast({ title: '删除失败', icon: 'none' })
  }
}

// 页面加载
onLoad(async (options) => {
  if (options?.id) {
    petId.value = options.id
    await loadPet(options.id)
  } else {
    await loadEnums('dog')
  }
})
</script>

<style lang="scss" scoped>
.pet-edit-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.form-scroll {
  flex: 1;
}

.form-container {
  padding: 20rpx;
}

// 头像区域
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  position: relative;

  .avatar-preview {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background-color: #f0f0f0;
  }

  .avatar-overlay {
    position: absolute;
    top: 40rpx;
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .avatar-tip {
    margin-top: 16rpx;
    font-size: 24rpx;
    color: #999;
  }
}

// 表单区域
.form-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;

  .section-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 24rpx;
    padding-left: 12rpx;
    border-left: 6rpx solid #004a99;
  }
}

.form-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .label {
    font-size: 28rpx;
    color: #333;

    &.required::before {
      content: '*';
      color: #f56c6c;
      margin-right: 4rpx;
    }
  }

  .input {
    flex: 1;
    text-align: right;
    font-size: 28rpx;
    color: #333;
  }

  .picker-value {
    display: flex;
    align-items: center;
    gap: 8rpx;
    color: #666;
    font-size: 28rpx;
  }
}

.sub-form-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0 20rpx 40rpx;
  border-bottom: 1rpx solid #f0f0f0;

  .sub-label {
    font-size: 26rpx;
    color: #666;
  }

  .picker-value {
    display: flex;
    align-items: center;
    gap: 8rpx;
    color: #999;
    font-size: 26rpx;
    max-width: 400rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// 类型选择器
.type-selector {
  display: flex;
  gap: 16rpx;

  .type-option {
    padding: 16rpx 32rpx;
    border-radius: 24rpx;
    font-size: 26rpx;
    background-color: #f5f5f5;
    color: #666;
    transition: all 0.2s;

    &.active {
      background-color: #004a99;
      color: #fff;
    }
  }
}

// 性别选择器
.gender-selector {
  display: flex;
  gap: 16rpx;

  .gender-option {
    padding: 16rpx 32rpx;
    border-radius: 24rpx;
    font-size: 26rpx;
    background-color: #f5f5f5;
    color: #666;
    transition: all 0.2s;

    &.male.active {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    &.female.active {
      background-color: #fce4ec;
      color: #c2185b;
    }
  }
}

// 删除按钮
.delete-btn {
  margin-top: 40rpx;
  background-color: #fff;
  color: #f56c6c;
  border: 1rpx solid #f56c6c;
  border-radius: 12rpx;
  font-size: 28rpx;
  height: 88rpx;
  line-height: 88rpx;

  &::after {
    border: none;
  }
}

// 底部操作
.footer-actions {
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

  .save-btn {
    background-color: #004a99;
    color: #fff;
    border-radius: 44rpx;
    font-size: 32rpx;
    height: 88rpx;
    line-height: 88rpx;

    &::after {
      border: none;
    }

    &[disabled] {
      background-color: #ccc;
    }
  }
}

// 弹窗
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
