const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.ts');
const content = fs.readFileSync(serverFile, 'utf8');

const storeEndIdx = content.indexOf('export const mockRequest');

let storeTs = content.slice(0, storeEndIdx);
storeTs = storeTs.replace('const clone = (v: any) => JSON.parse(JSON.stringify(v))', 'export const clone = (v: any) => JSON.parse(JSON.stringify(v))');
storeTs = storeTs.replace('const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms))', 'export const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms))');

storeTs = storeTs.replace('const addresses: Array<any> = []', 'export const addresses: Array<any> = []');
storeTs = storeTs.replace('let globalCart: any = {}', 'export let globalCart: any = {}');
storeTs += '\r\nexport const setGlobalCart = (val: any) => { globalCart = val }\r\n';

storeTs = storeTs.replace('const previews: Record<string, any> = {}', 'export const previews: Record<string, any> = {}');
storeTs = storeTs.replace('const orders: Map<string, OrderDetail> = new Map()', 'export const orders: Map<string, OrderDetail> = new Map()');
storeTs = storeTs.replace('const pets: Map<string, PetProfile> = new Map()', 'export const pets: Map<string, PetProfile> = new Map()');
storeTs = storeTs.replace('const plans: Map<string, FreshFoodPlan> = new Map()', 'export const plans: Map<string, FreshFoodPlan> = new Map()');

storeTs = storeTs.replace('const computePreview = (orderPreview: OrderPreview) => {', 'export const computePreview = (orderPreview: OrderPreview) => {');
storeTs = storeTs.replace('const computeCart = (cart: Cart) => {', 'export const computeCart = (cart: Cart) => {');

fs.writeFileSync(path.join(__dirname, 'store.ts'), storeTs);


const reqBodyStart = content.indexOf('{', storeEndIdx) + 1;
const reqBodyEnd = content.lastIndexOf('}');
const reqBody = content.substring(reqBodyStart, reqBodyEnd);

function getSlice(startMarker, endMarker) {
    const start = reqBody.indexOf(startMarker);
    if (start === -1) return '';
    const end = endMarker ? reqBody.indexOf(endMarker, start) : reqBody.lastIndexOf('return null');
    return reqBody.slice(start, end === -1 ? reqBody.length : end);
}

const addressCode = getSlice('// --- Address APIs', '// --- Cart APIs');
const cartCode = getSlice('// --- Cart APIs', '// --- POST /checkout');
const checkoutCode = getSlice('// --- POST /checkout', '// Product detail fallback');
const goodsCode = getSlice('// Product detail fallback', '// --- Order APIs');
const orderCode = getSlice('// --- Order APIs', '// --- Account Auth APIs');
const userCode = getSlice('// --- Account Auth APIs', '// --- Pet Enum Data');
const petCode = getSlice('// --- Pet Enum Data', '// --- Fresh Food Landing Page API');
const landingCode = getSlice('// --- Fresh Food Landing Page API', '// --- Fresh Food Plans API');
const planCode = getSlice('// --- Fresh Food Plans API', null);


function wrapHandler(code) {
    return `import { delay, clone, addresses, globalCart, setGlobalCart, previews, orders, pets, plans, computePreview, computeCart } from './store'
import type { CartItem } from '@/types/cart'
import { OrderState, OrderItemState, ItemType, ShipmentState } from '@/types/order-state'
import type { PetEnums, PetProfile } from '@/types/pet'
import type { FreshFoodPlan, FreshFoodRatio, DeliveryFrequency } from '@/types/fresh-food'
import type { Item } from '@/types/checkout.d'

export const handle = async (url: string, options: any) => {
${code}
  return null;
}
`;
}

fs.writeFileSync(path.join(__dirname, 'user.ts'), wrapHandler(userCode));
fs.writeFileSync(path.join(__dirname, 'order.ts'), wrapHandler(orderCode));
fs.writeFileSync(path.join(__dirname, 'cart.ts'), wrapHandler(cartCode));
fs.writeFileSync(path.join(__dirname, 'checkout.ts'), wrapHandler(checkoutCode));
fs.writeFileSync(path.join(__dirname, 'subscription.ts'), wrapHandler(landingCode));
fs.writeFileSync(path.join(__dirname, 'plan.ts'), wrapHandler(planCode));
fs.writeFileSync(path.join(__dirname, 'goods.ts'), wrapHandler(goodsCode));
fs.writeFileSync(path.join(__dirname, 'other.ts'), wrapHandler(addressCode + '\n' + petCode));

console.log('Split successful');
