import {
  delay,
  clone,
  addresses,
  globalCart,
  setGlobalCart,
  previews,
  orders,
  pets,
  plans,
  computePreview,
  computeCart,
  type FreshFoodPlan,
} from './store'
import type { CartItem } from '@/types/cart'
import { OrderState, OrderItemState, ItemType, ShipmentState } from '@/types/order-state'
import type { PetEnums, PetProfile } from '@/types/pet'
import type { FreshFoodRatio, DeliveryFrequency } from '@/types/fresh-food'
import type { Item } from '@/types/checkout.d'

export const handle = async (url: string, options: any) => {
// Product detail fallback (simple)
  if (url.startsWith('/product/detail')) {
    return {
      code: '0',
      msg: 'ok',
      result: {
        id: 100,
        name: '模拟商品',
        image: 'https://placehold.co/200x200',
        price: 99.0,
        stock: 100,
      },
    }
  }

  
  return null;
}
