# Taro 4 + React + Webpack5 项目初始化规范

## Why

当前配置清单覆盖了 Taro 4 + React 18 + Webpack5 的主流技术栈，但存在版本兼容性陷阱、依赖遗漏、Husky 命令过时、缺少验证步骤等问题，直接交给 AI 助手执行容易在项目初始化阶段失败。本规范将原清单整理为结构化、可验证、AI 可直接执行的初始化流程。

## What Changes

- 锁定技术栈版本约束：Taro 4.x、React 18、Tailwind CSS 3.x（Taro 小程序生态暂不支持 4.x 的 `@import "tailwindcss"` 新入口）。
- 补全缺失依赖：`weapp-tailwindcss`、`thread-loader`、`babel-plugin-import`、`postcss`、`autoprefixer`。
- 修正 Tailwind CSS 集成方式：
  - 使用 `tailwindcss` 3.x 标准入口 `@tailwind` 指令，并配置 `tailwind.config.js` 的 `content`。
  - 创建 `postcss.config.js`，注册 `tailwindcss` 与 `autoprefixer`。
  - 微信小程序端通过 `weapp-tailwindcss/webpack` 插件将 rem 转为 rpx。
  - H5 端使用标准 PostCSS 流程，不强制引入 `weapp-tailwindcss`。
- 明确 Husky 版本：统一使用 Husky v9，使用 `husky init` 替代已废弃的 `husky install` / `husky add`。
- 增加 NutUI React 按需加载配置，避免全量打包。
- 补全 `app.config.ts`、`project.config.json`（微信小程序）示例。
- 增加验证步骤：分别验证 H5 与微信小程序构建、Tailwind 类名生效、NutUI 组件渲染、Zustand 状态更新、Git 提交前 hooks 执行。
- 移除原清单中可能无效的 `cache.maxAge` 字段，改用 Taro 支持的缓存配置。

## Impact

- 受影响能力：新项目脚手架生成、开发环境配置、代码规范集成、跨端构建验证。
- 受影响代码/文件：
  - `config/index.ts`
  - `config/dev.ts`、`config/prod.ts`
  - `package.json`
  - `tsconfig.json`
  - `tailwind.config.js`
  - `postcss.config.js`
  - `src/app.css`
  - `src/app.tsx`
  - `src/app.config.ts`
  - `src/store/useCounterStore.ts`
  - `src/pages/index/index.tsx`
  - `.eslintrc.js`、`.prettierrc`、`.husky/pre-commit`
  - `project.config.json`（微信小程序）

## ADDED Requirements

### Requirement: 技术栈版本约束

The system SHALL 使用以下技术栈版本：

- Taro 4.x
- React 18.x
- Webpack 5
- Tailwind CSS 3.x
- NutUI React Taro 版
- Zustand
- Husky v9

#### Scenario: 版本检查

- **WHEN** AI 助手安装依赖
- **THEN** `package.json` 中 Tailwind CSS 版本 SHALL 为 `^3.x`，Husky 版本 SHALL 为 `^9.x`

### Requirement: 完整的项目初始化

The system SHALL 提供从 0 到可运行的完整初始化步骤。

#### Scenario: 初始化成功

- **WHEN** 执行 `npx @tarojs/cli init .`（在项目根目录初始化，不使用子目录）
- **THEN** 选择 React + TypeScript + Sass + Webpack5 + 默认模板
- **AND THEN** 项目目录结构与规范一致

> 注：若当前 CLI 未提供 Taro 4.x 选项，可回退至 Taro 3.x，本规范中的 Tailwind、NutUI、Zustand 配置在 3.x 与 4.x 中保持一致。

### Requirement: Tailwind CSS 跨端生效

The system SHALL 配置 Tailwind CSS 3.x，使其在 H5 与微信小程序中均生效：

- H5 端使用标准 PostCSS 流程（`postcss.config.js` 注册 `tailwindcss` 与 `autoprefixer`）。
- 微信小程序端在标准 PostCSS 流程基础上，通过 `weapp-tailwindcss/webpack` 插件将 rem 转换为 rpx。

#### Scenario: H5 端生效

- **WHEN** 运行 `npm run dev:h5`
- **THEN** 页面中 Tailwind 类名（如 `flex`、`text-blue-600`）正常渲染，单位为 px/rem

#### Scenario: 微信小程序端生效

- **WHEN** 运行 `npm run dev:weapp`
- **THEN** 生成的 `.wxss` 中包含对应 rpx 单位样式

### Requirement: PostCSS 配置

The system SHALL 创建 `postcss.config.js`，注册 `tailwindcss` 与 `autoprefixer` 插件。

#### Scenario: 配置检查

- **WHEN** 查看 `postcss.config.js`
- **THEN** 文件导出 `plugins: { tailwindcss: {}, autoprefixer: {} }`

### Requirement: NutUI 按需加载

The system SHALL 配置 NutUI React 组件库的按需引入，避免全量打包。

#### Scenario: 构建产物检查

- **WHEN** 执行生产构建
- **THEN** 产物中仅包含已使用组件的样式与代码

### Requirement: 代码规范与 Git Hooks

The system SHALL 配置 ESLint、Prettier、Husky v9、lint-staged，并在提交前自动修复代码。

#### Scenario: 提交前自动检查

- **WHEN** 执行 `git commit`
- **THEN** `.husky/pre-commit` hook 触发 `npx lint-staged`
- **AND THEN** 对变更文件执行 ESLint --fix 与 Prettier --write

### Requirement: 路径别名

The system SHALL 在 `config/index.ts` 与 `tsconfig.json` 中同步配置路径别名。

#### Scenario: 别名生效

- **WHEN** 在代码中使用 `@/store/useCounterStore`
- **THEN** TypeScript 与 Webpack 均能正确解析

### Requirement: Zustand 状态管理示例

The system SHALL 提供一个可运行的 Zustand Store 示例，并在首页展示状态读写。

#### Scenario: 状态更新

- **WHEN** 点击 + / - / Reset 按钮
- **THEN** 页面数字同步更新

### Requirement: 构建验证

The system SHALL 分别验证 H5 与微信小程序的开发和生产构建成功。

#### Scenario: 开发构建

- **WHEN** 运行 `npm run dev:h5` 和 `npm run dev:weapp`
- **THEN** 均无致命报错

#### Scenario: 生产构建

- **WHEN** 运行 `npm run build:h5` 和 `npm run build:weapp`
- **THEN** 均成功生成产物

## MODIFIED Requirements

### Requirement: 原清单的 Tailwind 入口

原清单要求使用 `src/app.css` 并写入 `@import "tailwindcss"`。

**修改后**：使用 Tailwind CSS 3.x 标准入口：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

并在 `tailwind.config.js` 中配置 `content` 扫描路径。

### Requirement: 原清单的 Husky 初始化命令

原清单使用 `npx husky install` 和 `npx husky add`。

**修改后**：Husky v9 使用 `npx husky init` 初始化，并通过写入 `.husky/pre-commit` 文件创建 hook：

```bash
npx husky init
```

```bash
# Linux / macOS
echo "npx lint-staged" > .husky/pre-commit

# Windows PowerShell
Set-Content -Path .husky/pre-commit -Value "npx lint-staged" -NoNewline -Encoding UTF8
```

### Requirement: 原清单的缓存配置

原清单在 `cache` 中设置了 `maxAge`。

**修改后**：仅保留 Taro 支持的 `type` 与 `cacheDirectory`，不设置 `maxAge`。

### Requirement: 在 SCSS 文件中维护 Tailwind 入口

原清单的样式方案为 `SCSS + Tailwind CSS`，但未明确 Tailwind 入口位置。

**修改后**：Tailwind CSS 入口统一放在 `src/app.css`，业务组件局部样式仍可使用 `.scss` 文件。

## REMOVED Requirements

### Requirement: 使用 `tailwindcss-taro` 包

**Reason**：该包名在 npm 上不存在或并非官方推荐方案，易造成安装失败。
**Migration**：改用官方组合 `tailwindcss` 3.x + `weapp-tailwindcss` + `postcss` + `autoprefixer`。
