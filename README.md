# uni-app-demo — 项目概览

这是一个基于 `uni-app` + `Vue 3` + `TypeScript` 的示例工程，适配多平台（H5、小程序、App）。此 README 提供项目结构、关键文件、运行与部署建议，方便快速上手与阅读代码。

## 快速结构概览

- 入口与配置
  - 入口： `src/main.ts`
  - 全局 App： `src/App.vue`
  - 路由与页面配置： `src/pages.json`
  - 平台/发布配置： `src/manifest.json`
  - Vite 配置： `vite.config.ts`
  - 包管理与锁文件： `package.json`、`pnpm-lock.yaml`

- 页面示例
  - 首页： `src/pages/index/index.vue`
  - 商品页： `src/pages/product/product.vue`
  - 下单页： `src/pages/place_order/place_order.vue`
  - 购物车： `src/pages/cart/cart.vue`
  - 店铺组件： `src/pages/shop/components/promo.vue`

- 网络与 API
  - 网络层： `src/utils/http.ts`（拦截器、`baseURL` 等）
  - 商品相关 API： `src/api/product.ts`

- 状态管理与样式
  - 状态管理： `src/stores/index.ts`（以及 `src/stores/modules` 下的模块）
  - 类型定义： `src/types/`（例如 `product.d.ts`、`shop.d.ts`）
  - 全局样式变量： `src/uni.scss`

- 部署与 CI
  - 本地部署脚本： `deploy.sh`
  - CI/发布配置： `deploy.yml`

## 关键说明

- 网络层与拦截器：网络请求封装在 `src/utils/http.ts`，项目通过拦截器实现统一的请求/响应处理与错误逻辑。
- API 约定：商品接口在 `src/api/product.ts`，前端页面通过这些接口获取数据并渲染。
- 页面注册与构建：页面在 `src/pages` 目录编排，通过 `src/pages.json` 注册以支持 uni-app 多端打包。

## 常用命令（参考 `package.json`）

下面命令取决于项目 package.json 中的脚本（以 pnpm/npm 为例）：

```powershell
# 安装依赖
pnpm install

# 启动 H5 开发（示例，视 package.json 而定）
pnpm run dev:h5

# 类型检查
pnpm run tsc

# 打包（示例，视 package.json 而定）
pnpm run build
```

> 如果你使用 npm，请把 `pnpm` 替换为 `npm` 或 `yarn`。

## 阅读建议（按顺序）
1. `src/main.ts`、`src/App.vue` —— 应用入口与全局逻辑。
2. `src/utils/http.ts` —— 网络层、拦截器与错误处理。
3. `src/api/product.ts` —— 商品相关接口示例。
4. `src/stores` —— 状态管理实现与使用示例。
5. `src/pages` —— 各页面实现逻辑与组件交互。

## 后续可选工作
- 我可以把 README 扩展为「开发者指南」，包括详细运行步骤、调试说明和常见问题排查。
- 如果需要，我可以为项目添加一个简短的本地启动脚本（`.vscode/tasks.json`）或补充更详细的命令示例。

---

如果你希望我把 README 中的某一部分改成英文、加入截图或补充更多运行细节（例如 HBuilderX 的打包步骤），告诉我需要的重点，我会继续完善。
