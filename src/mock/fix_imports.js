const fs = require('fs');
const path = require('path');

const files = ['user.ts', 'order.ts', 'cart.ts', 'checkout.ts', 'subscription.ts', 'plan.ts', 'goods.ts', 'other.ts'];

const wrongImport1 = /import {[\s\S]*?} from '\.\/store'/;
const rightImport = `import {
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
} from './store'`;

const wrongImport2 = "import type { FreshFoodPlan, FreshFoodRatio, DeliveryFrequency } from '@/types/fresh-food'";
const rightImport2 = "import type { FreshFoodRatio, DeliveryFrequency } from '@/types/fresh-food'";

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(wrongImport1, rightImport);
  content = content.replace(wrongImport2, rightImport2);

  fs.writeFileSync(filePath, content);
});

console.log('Imports fixed');
