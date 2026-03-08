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
// --- Fresh Food Landing Page API ---

  // GET /api/fresh-food/landing - 获取营销落地页数据
  if (
    url.match(/^\/api\/fresh-food\/landing/) &&
    String(options.method || 'GET').toUpperCase() === 'GET'
  ) {
    const landingData = {
      heroImage:
        'https://placehold.co/750x900/00a86b/fff?text=🐕+鲜食定制+为你的毛孩子\\n量身打造营养方案',
      benefitImages: [
        'https://placehold.co/750x500/f8f9fa/333?text=🥗+新鲜食材+每日现做',
        'https://placehold.co/750x400/e8f5e9/333?text=📦+便捷配送+冷链直达',
        'https://placehold.co/750x400/fff3e0/333?text=🔬+科学配方+兽医认证',
        'https://placehold.co/750x350/e3f2fd/333?text=📊+定制方案+营养均衡',
      ],
      reviews: [
        {
          id: 'rev1',
          userName: '柯基妈妈',
          avatar: 'https://placehold.co/100x100/ffb74d/fff?text=🐕',
          petName: '小短腿',
          petBreed: '柯基犬',
          rating: 5,
          content:
            '自从换了鲜食，小短腿的毛发明显变好了！以前总是挑食，现在每顿都吃得干干净净。配送也很准时，解冻后直接喂，超方便！',
          images: [
            'https://placehold.co/300x300/ffe0b2/333?text=毛发更亮',
            'https://placehold.co/300x300/c8e6c9/333?text=吃得开心',
          ],
          createdAt: '2026-01-15',
        },
        {
          id: 'rev2',
          userName: '金毛爸爸',
          avatar: 'https://placehold.co/100x100/64b5f6/fff?text=🦮',
          petName: 'Lucky',
          petBreed: '金毛寻回犬',
          rating: 5,
          content:
            'Lucky之前肠胃不好，换了鲜食后消化好多了。客服还专门根据Lucky的体重和活动量调整了食谱，非常专业！',
          video: {
            url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
            cover: 'https://placehold.co/400x300/81c784/fff?text=▶️+Lucky吃饭视频',
          },
          createdAt: '2026-01-20',
        },
        {
          id: 'rev3',
          userName: '泰迪铲屎官',
          avatar: 'https://placehold.co/100x100/ba68c8/fff?text=🐩',
          petName: '巧克力',
          petBreed: '泰迪犬',
          rating: 4,
          content:
            '订阅了半年，巧克力从挑食变成了小馋猫。唯一的建议是希望能有更多口味选择，不过现有的几款已经很不错了。',
          images: ['https://placehold.co/300x300/e1bee7/333?text=期待开饭'],
          createdAt: '2026-02-01',
        },
      ],
      contactInfo: {
        title: '有疑问？联系我们',
        description: '专业营养师为您解答所有关于鲜食定制的问题',
        wechatQrCode: 'https://placehold.co/200x200/25d366/fff?text=微信扫码咨询',
        phoneNumber: '400-888-9999',
      },
      faqs: [
        {
          question: '鲜食可以保存多久？',
          answer: '冷冻状态下可保存3个月，解冻后冷藏保存3天。我们建议按需解冻，保持最佳新鲜度。',
        },
        {
          question: '如何确定适合我家狗狗的份量？',
          answer:
            '我们会根据您提供的狗狗品种、体重、年龄和活动量，由专业兽医营养师计算每日所需热量和营养配比。',
        },
        {
          question: '可以随时更改配送频率吗？',
          answer:
            '当然可以！您可以在个人中心随时调整配送频率，也可以暂停或取消订阅，完全没有任何强制条款。',
        },
        {
          question: '食材来源安全吗？',
          answer:
            '我们的所有食材均来自经过认证的供应商，人类食品级标准，通过严格的质量检测。每批次产品都有溯源记录。',
        },
        {
          question: '狗狗不喜欢吃怎么办？',
          answer:
            '我们提供7天试吃期，如果狗狗不喜欢，可以免费更换口味或全额退款。大多数狗狗在1-3天内就会爱上鲜食！',
        },
      ],
      ctaText: '开启专属鲜食之旅',
    }
    return { code: '0', msg: 'ok', result: landingData }
  }

  
  return null;
}
