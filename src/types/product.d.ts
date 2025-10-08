import { ProductDetail } from './product.d'

// 商品SKU
export interface Sku {
  skuId: string
  spec: string
  price: number
  images: string[]
}

// 商品
export interface ProductDetail {
  productId: string
  name: string
  skus: Sku[]
}

// ---------- 最外层：data ----------
export interface Data {
  seller?: Seller
  item?: Item
  skuBase?: SkuBase
  skuCore?: SkuCore // 对应抓包中的 sku 详情（抓包有时命名为 skuCo，接口里使用 skuCore）
  params?: Record<string, any>
  [key: string]: any
}

/* ================== seller ================== */
export interface Seller {
  creditLevel?: string
  creditLevelIcon?: string
  encryptUid?: string
  evaluates?: SellerEvaluate[] // 抓包例子: [{ level, levelText, score, title, type }]
  pcShopUrl?: string
  sellerId?: string
  sellerNick?: string
  sellerType?: string
  shopIcon?: string
  startsIcon?: string
  userId?: string

  // 额外在抓包中也见到的店铺展示字段
  shopId?: string
  shopName?: string
  shopUrl?: string
  starNum?: string
  overallScore?: string
  labelList?: Array<{ contentDesc?: string }>

  [key: string]: any
}

export interface SellerEvaluate {
  level?: string
  levelText?: string
  score?: string
  title?: string
  type?: string
}

/* ================== item ================== */
export interface Item {
  // 基本展示
  itemId?: string
  spuId?: string
  title?: string
  titleIcon?: string
  images?: string[] // 图片 url 列表
  bottomIcons?: any[] // 抓包通常为 []
  qrCode?: string
  vagueSellCount?: string // 如 "2万+"

  // 视频、悬浮图标等
  videos?: Video[]
  rightFloatIcons?: RightFloatIcon[]

  // 各类 VO / 辅助对象（抓包里都有出现）
  titleVO?: TitleVO
  debugVO?: { host?: string; traceId?: string }
  umpPriceLogV?: any
  deliveryVO?: DeliveryVO
  commentListVO?: any
  pcFrontSkuQuantityLimitVO?: any
  buyParamVO?: any

  // plusView / feature / headAtmosphere 等
  plusViewVO?: any
  feature?: Record<string, any>
  headAtmosphereBeltVO?: any

  // 行业参数（规格/参数表）
  industryParamVO?: IndustryParamVO

  // 预留：其它可能字段
  [key: string]: any
}

export interface Video {
  actionEvent?: any // 抓包里为复杂对象（exposureArgs / openUrlEventArgs 等）
  videoId?: string
  videoThumbnailURL?: string
  weexRecommendUrl?: string
  [key: string]: any
}

export interface RightFloatIcon {
  disabled?: string // 抓包里为 "false" 字符串
  events?: Array<{ fields?: Record<string, any>; type?: string }>
  iconUrl?: string
  type?: string
  href?: string
  image?: { gifAnimated?: string; imageUrl?: string }
  title?: { text?: string }
  text?: string
  [key: string]: any
}

export interface TitleVO {
  salesDesc?: string // 如 "已售 2万+"
  subTitles?: Array<{ title?: string }>
  title?: { title?: string }
  [key: string]: any
}

export interface DeliveryVO {
  addressId?: string
  agingDesc?: string
  agingDescColor?: string
  agingDescIcon?: string
  areaId?: string
  deliverToCity?: string
  deliveryFromAddr?: string
  deliveryToAddr?: string
  deliveryToDistrict?: string
  freight?: string
  [key: string]: any
}

export interface IndustryParamVO {
  basicParamList?: BasicParam[] // 抓包示例：品牌、品名、净含量、口味 等
  enhanceParamList?: BasicParam[]
  bizCode?: string
  hit?: string
  [key: string]: any
}

export interface BasicParam {
  propertyName?: string // 如 "净含量"
  valueName?: string // 如 "12kg 24kg"
  [key: string]: any
}

/* ================== skuBase ================== */
/**
 * skuBase 示例结构来自抓包：
 * {
 *   components: [],
 *   props: [ { pid, name, values: [ { vid, name, ... } ] }, ... ],
 *   skus: [ { propPath, skuId }, ... ]
 * }
 */
export interface SkuBase {
  components?: any[] // 抓包通常为空数组
  props?: SkuProp[] // 规格维度（如 食品口味、净含量）
  skus?: SkuMapping[] // propPath <-> skuId 映射
  [key: string]: any
}

export interface SkuProp {
  comboProperty?: string // 抓包为 "false"
  hasGroupTags?: string
  hasImage?: string
  name?: string // 规格名，如 "食品口味"
  packProp?: string
  pid: string // 属性 id，如 "122216494"
  shouldGroup?: string
  values?: SkuPropValue[] // 值数组
  [key: string]: any
}

export interface SkuPropValue {
  comboPropertyValue?: string
  name?: string // 值名称，如 "鸭肉梨口味"
  sortOrder?: string
  vid?: string // 值 id
  [key: string]: any
}

export interface SkuMapping {
  propPath: string // 抓包形式： "12221649439056516503;1479562526377934"
  skuId: string // sku id，如 "5862282289714"
}

/* ================== skuCore（抓包中的 skuCo / sku 详情映射） ================== */
/**
 * 抓包示例：
 * "skuCo": { "sku2info": { "5862282289716": { ... }, "5862282289715": { ... } }, "skuItem": { itemStatus, renderSku, unitBuy } }
 */
export interface SkuCore {
  sku2info: { [skuId: string]: Sku2Info }
  skuItem?: SkuItemInfo
  [key: string]: any
}

export interface Sku2Info {
  cartParam?: { addCartCheck?: string } // 如 { addCartCheck: "true" }
  itemApplyParams?: string // 抓包里为 JSON 字符串（优惠券等）
  price?: PriceInfo // price / subPrice 对象
  quantity?: string // 如 "200"
  quantityDisplayValue?: string // 如 "1"
  quantityText?: string // 如 "有货"
  subPrice?: PriceInfo
  deliveryVO?: any
  map?: any
  [key: string]: any
}

export interface PriceInfo {
  priceColorNew?: string
  priceMoney?: string // 抓包中的金额字符串，如 "45870"（单位分/或格式取决抓包）
  priceText?: string // 如 "458.7"
  priceTitle?: string
  priceTitleColor?: string
  priceBgColor?: string // 子价位有时包含
  [key: string]: any
}

export interface SkuItemInfo {
  itemStatus?: string // 如 "0"
  renderSku?: string // 如 "true"
  unitBuy?: string // 如 "1"
  [key: string]: any
}
