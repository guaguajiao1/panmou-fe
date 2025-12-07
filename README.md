# uni-app-demo

A cross-platform application built with **Uni-app**, **Vue 3**, **Vite**, and **TypeScript**. This project demonstrates a comprehensive setup for developing applications that run on iOS, Android, H5, and various Mini Programs (WeChat, Alipay, etc.).

## 🚀 Technology Stack

- **Framework**: [Uni-app](https://uniapp.dcloud.io/) (Vue 3 + Vite)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Pinia](https://pinia.vuejs.org/) + [pinia-plugin-persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/)
- **UI Library**: [Uni-ui](https://uniapp.dcloud.io/component/uniui/uni-ui.html)
- **CSS Preprocessor**: SCSS
- **Linting & Formatting**: ESLint, Prettier

## 📂 Directory Structure

```
├── src
│   ├── accountPages        # Subpackage: User account related pages
│   ├── api                 # API interfaces
│   ├── components          # Global components
│   ├── mock                # Mock data
│   ├── orderPages          # Subpackage: Order related pages
│   ├── pages               # Main package pages (TabBar pages)
│   ├── services            # Service layer
│   ├── static              # Static assets
│   ├── stores              # Pinia stores
│   ├── types               # TypeScript type definitions
│   ├── utils               # Utility functions
│   ├── App.vue             # Root component
│   ├── main.ts             # Entry file
│   ├── manifest.json       # Project configuration (AppID, permissions, etc.)
│   ├── pages.json          # Page routing and window configuration
│   └── uni.scss            # Global SCSS variables
├── .editorconfig           # Editor configuration
├── .eslintrc.cjs           # ESLint configuration
├── .prettierrc.json        # Prettier configuration
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (>= 16.0.0)
- pnpm (recommended) or npm/yarn
- HBuilderX (optional, but recommended for uni-app development)

### Installation

```bash
# Install dependencies
pnpm install
```

### Running the Project

```bash
# Run on H5 (Development)
pnpm dev:h5

# Run on WeChat Mini Program (Development)
pnpm dev:mp-weixin

# Run App (Development)
pnpm dev:app
```

## 📜 Scripts

| Script            | Description                                 |
| :---------------- | :------------------------------------------ |
| `dev:h5`          | Run H5 in development mode                  |
| `dev:mp-weixin`   | Run WeChat Mini Program in development mode |
| `dev:app`         | Run App in development mode                 |
| `build:h5`        | Build H5 for production                     |
| `build:mp-weixin` | Build WeChat Mini Program for production    |
| `build:app`       | Build App for production                    |
| `tsc`             | Run TypeScript type checking                |
| `lint`            | Run ESLint to fix code style issues         |

## 📱 Features

- **TabBar Navigation**:

  - **Home** (`pages/shop/shop`)
  - **Subscription** (`pages/subscription-list/subscription-list`)
  - **My Profile** (`pages/my/my`)

- **Subpackages**:

  - **accountPages**: Settings, Profile, Address management.
  - **orderPages**: Checkout, Order Detail, Payment, Order List.

- **State Management**:
  - Global state management using Pinia.
  - Persistent state support.

## 📄 License

[MIT](LICENSE)
