import type { AddressItem } from './address'

export interface OrderPreviewItem {
  productId: number | string
  skuId?: number | string
  name?: string
  specs?: string
  image?: string
  originalPrice: number
  quantity: number
  supportsSubscription?: boolean
  subscriptionDiscount?: number
  onceDiscount?: number
  purchaseType?: 'once' | 'subscribe'
}

export interface OrderPreviewSummary {
  subtotal: number
  totalDiscount: number
  shippingFee: number
  total: number
}

export interface FrequencyOptions {
  weeks: string[]
  months: string[]
  default: string
}

export interface OrderPreview {
  orderItems: OrderPreviewItem[]
  orderSummary: OrderPreviewSummary
  frequencyOptions: FrequencyOptions
  shippingAddress?: AddressItem
}
