# CLAUDE.md

> 本文件是本项目与 AI 助手协作的顶层规则。任何 Agent（Claude Code、Codex 等）读取项目规则时，应以同目录下的 `AGENTS.md` 为准；`AGENTS.md` 是 `CLAUDE.md` 的符号链接，二者内容永远一致。

## 1. 项目定位：第一性原理

本项目是一个 **跨端（H5 + 微信小程序）前端应用**。从最基础的事实出发：

- **事实 1**：业务需要同时触达 H5 与微信生态用户。
- **事实 2**：React 生态在组件复用、开发效率、人才供给上具有确定性优势。
- **事实 3**：Taro 提供了以 React 语法编写、编译到多端运行时的能力，是事实上的跨端桥梁。
- **事实 4**：小程序与 H5 的运行环境、样式单位、组件实现存在本质差异，无法 100% 复用同一套代码。

由以上事实推导出本项目的**核心原则**：

1. **一份源码，多端构建**：业务代码尽量写在 `src/` 下，通过 `TARO_ENV` 与配置区分端差异，而不是维护多份代码。
2. **原子化样式优先**：Tailwind CSS 提供与运行环境无关的工具类；小程序端通过 `weapp-tailwindcss` 自动转 rpx，H5 端保持标准 rem/px。
3. **组件库按需加载**：NutUI 组件通过 `babel-plugin-import` 按需引入，避免打包全量样式与代码。
4. **状态管理最小化**：Zustand 只用于真正需要跨组件共享的状态，避免过度设计。
5. **代码规范自动化**：格式化、Lint、Git Hooks 全部自动化，减少人工审查成本。

## 2. 技术栈与版本约束

以下版本经过实际验证，**不要随意升级或替换**，除非你有明确的兼容性测试：

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Taro | 4.2.0 | 跨端编译框架 |
| UI 框架 | React | 18.x | 组件模型 |
| 语言 | TypeScript | 5.4.5 | 类型安全 |
| 构建工具 | Webpack 5 | 5.91.0 | Taro 默认 |
| 组件库 | @nutui/nutui-react-taro | ^3.0.20 | 小程序/H5 组件库 |
| 样式 | Tailwind CSS | ^3.4.19 | 原子化 CSS |
| 样式 | Sass | ^1.75.0 | 业务组件局部样式 |
| 状态 | Zustand | ^5.0.14 | 轻量状态管理 |
| 规范 | ESLint / Prettier / Husky / lint-staged | 见 package.json | 代码质量 |

**关键版本约束**：

- `weapp-tailwindcss` 必须使用 `^4.12.0`。v5 不兼容 Tailwind CSS 3.x，会导致小程序产物丢失工具类。
- `tailwindcss` 必须使用 3.x。4.x 的 `@import "tailwindcss"` 入口在 Taro 小程序生态不可用。
- `husky` 使用 v9，`npx husky init` 初始化，`.husky/pre-commit` 写入 `npx lint-staged`。

## 3. 目录结构

```
c:\Users\12130\Desktop\hnjx-hjs\fridgemagnet_new\
├── config/                 # Taro 构建配置
│   ├── index.ts            # 主配置：alias、缓存、webpackChain、prebundle
│   ├── dev.ts              # 开发环境配置
│   └── prod.ts             # 生产环境配置
├── src/                    # 业务源码
│   ├── app.ts              # 应用入口（引入 app.css / app.scss）
│   ├── app.css             # Tailwind CSS 入口（必须使用 .css）
│   ├── app.scss            # 全局 SCSS 变量/样式
│   ├── app.config.ts       # 全局页面路由与窗口配置
│   ├── index.html          # H5 入口 HTML
│   ├── pages/              # 页面
│   │   └── index/
│   │       ├── index.tsx
│   │       ├── index.scss
│   │       └── index.config.ts
│   ├── components/         # 公共组件
│   ├── store/              # Zustand stores
│   ├── utils/              # 工具函数
│   └── styles/             # 全局样式、主题变量
├── types/                  # 全局类型声明
├── patches/                # patch-package 补丁（当前：@tarojs/webpack5-prebundle）
├── .husky/                 # Git hooks
├── tailwind.config.js      # Tailwind 扫描路径
├── postcss.config.js       # Tailwind + autoprefixer
├── babel.config.js         # babel-preset-taro + babel-plugin-import
├── tsconfig.json           # TypeScript 配置与 paths
├── project.config.json     # 微信小程序项目配置
├── package.json
└── .trae/specs/            # 本项目的 spec 文档（非源码）
```

**路径别名**（`config/index.ts` 与 `tsconfig.json` 同步）：

```
@          -> src
@components -> src/components
@pages      -> src/pages
@store      -> src/store
@utils      -> src/utils
@styles     -> src/styles
```

## 4. 核心配置文件说明

### 4.1 `config/index.ts`

- `designWidth: 375`：设计稿基准宽度。
- `outputRoot`: H5 输出到 `dist`，微信小程序输出到 `dist/weapp`。
- `cache`: 文件系统缓存，目录 `.taro_cache`。
- `mini.webpackChain`: 注册 `weapp-tailwindcss/webpack` 插件（`rem2rpx: true`）与 `thread-loader`。
- `mini.postcss.pxtransform.selectorBlackList: ['nut-']`：NutUI 的 px 单位不被转成 rpx。
- `h5.webpackChain`: 不注册 `weapp-tailwindcss`，H5 端 Tailwind 走标准 PostCSS 流程。

### 4.2 Tailwind CSS 配置

- `tailwind.config.js`：`content: ['./src/**/*.{js,jsx,ts,tsx}']`。
- `postcss.config.js`：注册 `tailwindcss` 与 `autoprefixer`。
- `src/app.css`：Tailwind 入口，使用 `@tailwind base/components/utilities`。
- `src/app.ts`：引入 `app.css`。

**禁止**：在 SCSS 文件中维护 Tailwind 入口；业务组件的 `.scss` 只写局部样式。

### 4.3 NutUI 按需加载

`babel.config.js` 中配置 `babel-plugin-import`：

```js
['import', {
  libraryName: '@nutui/nutui-react-taro',
  libraryDirectory: 'dist/es/packages',
  style: 'css',
  camel2DashComponentName: false,
}, 'nutui-react-taro']
```

页面中直接按命名导入：`import { Button } from '@nutui/nutui-react-taro'`。

## 5. 开发工作流

### 5.1 启动开发

```bash
# H5
npm run dev:h5

# 微信小程序
npm run dev:weapp
```

### 5.2 生产构建

```bash
npm run build:h5      # 产物在 dist/
npm run build:weapp   # 产物在 dist/weapp/
```

**注意**：H5 构建会清空 `dist/`。如需同时保留两端产物，先 `build:h5` 再 `build:weapp`。

### 5.3 新增页面

1. 在 `src/pages/` 下创建目录。
2. 创建 `index.tsx` 与 `index.config.ts`。
3. 在 `src/app.config.ts` 的 `pages` 数组中注册路径。

### 5.4 状态管理

- 只在真正跨组件共享的状态使用 Zustand。
- Store 文件放在 `src/store/`，命名 `useXxxStore.ts`。
- 页面内局部状态优先使用 `useState` / `useReducer`。

### 5.5 Git 提交

#### 5.5.1 提交前检查

- 提交前 `.husky/pre-commit` 会自动触发 `lint-staged`。
- `lint-staged` 对变更的 `*.{js,jsx,ts,tsx}` 执行 `eslint --fix` + `prettier --write`。
- 对变更的 `*.{css,scss}` 执行 `prettier --write`。

#### 5.5.2 提交信息格式

**所有提交信息必须使用简体中文**，格式如下：

```text
<类型>: <简短描述>

<详细说明（可选）>
```

#### 5.5.3 类型前缀

| 类型 | 含义 | 使用场景 |
|------|------|----------|
| `feat` | 新功能 | 新增业务功能、新增页面、新增组件 |
| `fix` | 修复 bug | 修复线上或开发环境的问题 |
| `docs` | 文档更新 | 更新 README、CLAUDE.md、注释、使用说明 |
| `style` | 代码格式 | 仅调整格式，不影响代码逻辑 |
| `refactor` | 重构 | 不修改外部行为，优化内部实现 |
| `perf` | 性能优化 | 提升性能、减少包体积、优化构建速度 |
| `test` | 测试相关 | 新增或修改测试用例 |
| `chore` | 构建/工具/依赖 | 更新依赖、调整构建配置、CI/CD 变更 |

#### 5.5.4 提交信息示例

```text
feat: 添加用户登录功能

fix: 修复购物车数量显示错误

docs: 更新 CLAUDE.md 的 Git 提交规范

refactor: 重构订单状态管理逻辑

chore: 升级 weapp-tailwindcss 到 4.x
```

#### 5.5.5 注意事项

- 简短描述应以动词开头，明确说明本次提交做了什么。
- 不要写无意义的提交信息，如 `update`、`fix bug`、`提交代码`。
- 如果一次修改包含多种类型，优先拆分提交；无法拆分时使用最主要类型。

## 6. 跨端开发原则

### 6.1 样式单位

- **H5**：Tailwind 默认 1rem = 16px，工具类输出 rem/px。
- **小程序**：`weapp-tailwindcss` 自动将 rem 转换为 rpx（如 1rem -> 32rpx）。
- **手动写 px**：小程序构建会通过 `pxtransform` 自动转 rpx；NutUI 的 `nut-` 类名被黑名单保护，保持 px。

#### Tailwind Spacing 使用规范（重要）

Tailwind spacing 数值 = N × 0.25rem，**不是** N px。例如 `mx-10` = 2.5rem = 40px（H5）/ 80rpx（小程序）。

为降低心智负担，**本项目统一使用任意值语法** `[Npx]` 直接指定像素值：

```tsx
// ❌ 不用（需要心算 rem/rpx 换算）
<View className='mx-10 mt-16 px-4' />

// ✅ 用任意值直接写 px
<View className='mx-[10px] mt-[16px] px-[4px]' />
```

换算参考：
| Tailwind class | 实际值 | H5 (16px根) | 小程序 (rpx) |
|---|---|---|---|
| `mx-1` | 0.25rem | 4px | 8rpx |
| `mx-4` | 1rem | 16px | 32rpx |
| `mx-10` | 2.5rem | 40px | 80rpx |

### 6.2 环境判断

```ts
import Taro from '@tarojs/taro';

// 运行时判断
if (process.env.TARO_ENV === 'weapp') { /* 小程序专有逻辑 */ }
if (process.env.TARO_ENV === 'h5') { /* H5 专有逻辑 */ }
```

### 6.3 组件选择

- 优先使用 `@tarojs/components` 提供的基础组件（`View`、`Text`、`Button` 等）。
- 业务组件优先使用 NutUI。
- 避免直接引入 DOM 专属库或小程序专属 API 到通用组件中。

### 6.4 页面布局规范（自定义导航 + TabBar）

本项目采用**全自定义导航栏**与**自定义 TabBar**，不使用小程序原生导航与原生 TabBar。

#### 6.4.1 BasePage 页面容器（强制）

**所有页面必须**使用 `src/components/base-page/index.tsx` 作为根容器包裹，它已内置处理以下逻辑：

- **状态栏 + 导航栏占位**：自动读取系统信息计算状态栏高度与导航栏高度，避免内容被遮挡。
- **底部安全区适配**：自动计算 iPhone X 及以上机型的底部安全区，并预留对应 padding。
- **底部固定栏支持**：支持传入底部固定栏组件，自动叠加安全区高度。
- **内置自定义导航栏**：传入 `navTitle` 等属性即可自动渲染 `BaseNavBar`，无需在每个页面单独引入导航组件。

**基础用法示例**：

```tsx
import BasePage from '@/components/base-page';

export default function MyPage() {
  return (
    <BasePage navTitle='页面标题'>
      <View>页面内容</View>
    </BasePage>
  );
}
```

**带底部固定栏示例**：

```tsx
<BasePage
  navTitle='订单确认'
  bottomBarHeight={50}
  bottomBarComponent={<View className='submit-bar'>提交订单</View>}
  safeAreaBackgroundColor='#fff'
>
  <View>页面内容</View>
</BasePage>
```

**常用属性说明**：

| 属性 | 说明 | 默认值 |
|------|------|--------|
| `navTitle` | 导航栏标题，传入后自动显示导航栏 | `''`（不显示导航栏） |
| `navShowBack` | 是否显示返回按钮 | `true` |
| `navBackgroundColor` | 导航栏背景色 | `#ffffff` |
| `navTextColor` | 导航栏文字/图标颜色 | `#000000` |
| `navFixed` | 导航栏是否 fixed 定位 | `true` |
| `backgroundColor` | 页面背景色 | `#f5f5f5` |
| `padding` | 页面内容区内边距 | `'0'` |
| `paddingBottomSafe` | 是否启用底部安全区适配 | `true` |
| `bottomBarHeight` | 底部固定栏高度（不含安全区） | 自动测量 |
| `bottomBarComponent` | 底部固定栏组件 | — |
| `safeAreaBackgroundColor` | 底部安全区占位背景色 | 继承 `backgroundColor` |

#### 6.4.2 自定义导航栏

- 导航栏由 `BaseNavBar` 组件实现，**已内置于 BasePage**，页面开发者无需直接引用。
- 小程序端通过 `Taro.getMenuButtonBoundingClientRect()` 获取胶囊按钮位置，自动对齐右侧胶囊；H5 端按标准高度渲染。
- 如需在页面中控制导航栏（如动态修改标题、显示/隐藏返回按钮），通过 BasePage 的 props 传入即可。

#### 6.4.3 自定义 TabBar

- 项目使用**自定义 TabBar** 替代小程序原生 TabBar，确保 H5 与小程序视觉与交互一致。
- TabBar 组件独立实现，通常在 `app.config.ts` 中配置 `tabBar.custom = true`（小程序端），并在 `src/components/custom-tab-bar/` 或同级目录维护。
- 页面级组件**不直接引用 TabBar**，TabBar 的全局显示/隐藏由框架级逻辑统一控制。
- TabBar 高度与安全区处理遵循与 BasePage 一致的逻辑，避免重复计算。

## 7. 代码规范

### 7.1 ESLint

- 配置在 `.eslintrc.js`，`extends: ['taro/react']`。
- 已关闭 `react/jsx-uses-react` 与 `react/react-in-jsx-scope`（React 18 + JSX Transform）。
- 配置文件（`*.config.js`、`config/**/*.ts`）关闭 `import/no-commonjs`。

### 7.2 Prettier

- 配置在 `.prettierrc`。
- `singleQuote: true`、`trailingComma: 'all'`、`printWidth: 100`、`tabWidth: 2`、`semi: true`、`jsxSingleQuote: true`。

### 7.3 命名与风格

- 组件文件：PascalCase（如 `MyComponent.tsx`）。
- 页面目录：小写（如 `src/pages/index/`）。
- Store 文件：`useXxxStore.ts`。
- 工具函数：camelCase。
- 样式文件：与组件/页面同名，`.scss`。

## 8. 已知补丁与注意事项

### 8.1 `@tarojs/webpack5-prebundle` 补丁

开启 `prebundle: { enable: true }` 后，`@tarojs/webpack5-prebundle@4.2.0` 会把 `roots: appPath`（字符串）传给 `enhanced-resolve@5.x`，但后者要求 `roots` 为数组，导致构建报错。通过 `patch-package` 修复为 `roots: [appPath]`，补丁位于：

```
patches/@tarojs+webpack5-prebundle+4.2.0.patch
```

`package.json` 中配置了 `postinstall: "patch-package"`，`npm install` 后自动应用。

### 8.2 不要做的事

- 不要升级 `tailwindcss` 到 4.x。
- 不要升级 `weapp-tailwindcss` 到 5.x。
- 不要删除 `patches/` 目录中的补丁。
- 不要把 Tailwind 入口放到 `.scss` 文件中。
- 不要在 H5 配置中注册 `weapp-tailwindcss` 插件。

## 9. 决策记录（ADR）

| 决策 | 原因 |
|------|------|
| Taro 4.2 + React 18 | 跨端统一 + React 生态成熟 |
| Tailwind CSS 3.x | 原子化样式、多端单位可转换、社区成熟 |
| weapp-tailwindcss 4.x | 与 Tailwind 3.x 兼容，自动 rem->rpx |
| NutUI React Taro | 官方适配 Taro，组件覆盖小程序与 H5 |
| Zustand | API 极简，无样板代码，满足本项目状态需求 |
| Husky v9 + lint-staged | 提交前自动保证代码质量 |
| patch-package | 修复 Taro 4.2 prebundle 的 roots 类型问题 |

## 10. editor ↔ editor-crop 裁剪页面流程

### 10.1 数据流全景

```
editor（制作页）
  │ 点击上传区 → handleChooseImage
  │   ├─ 已有图片 → 读 cropStateMap 取原图 URL → navigateToCrop
  │   └─ 无图片   → Taro.chooseImage → 原图 → navigateToCrop
  │
  ▼ navigateTo（URL 参数: imageUrl, itemIndex, width, height, previewW, previewH）
editor-crop（裁剪页）
  │ mount useEffect
  │   ├─ 检查 cropStateMap[itemIndex] 存在 → 恢复原图 + transform
  │   └─ 不存在 → URL 参数初始化，reset transform
  │
  │ 用户编辑（缩放/旋转/拖拽/翻转）
  │
  │ 点保存 → handleConfirm
  │   ├─ 按需渲染 <Canvas type='2d'>（避免挂载时 this._getData 错误）
  │   ├─ 等 150ms canvas 挂载
  │   ├─ 第一遍渲染 → 预览图（previewW×previewH，花边框贴合）
  │   ├─ 第二遍渲染 → 上传图（cropW×cropH，工作区实物比例）
  │   ├─ 存 cropResult { imageUrl, uploadUrl } 到内存
  │   ├─ 存 cropStateMap[itemIndex] = { originalImageUrl, transform, imgW, imgH }
  │   └─ navigateBack
  │
  ▼ useDidShow
editor（制作页）
  ├─ uploadMap[itemIndex] = imageUrl      → 预览区显示，花边框贴合
  └─ uploadFileMap[itemIndex] = uploadUrl  → 提交订单时上传，实物比例正确
```

### 10.2 尺寸体系（关键！）

三个尺寸各自独立、用途不同：

| 尺寸 | 来源 | 示例（85×40mm） | 用途 |
|------|------|----------------|------|
| 工作区 `cropW×cropH` | `UPLOAD_AREA_SIZE` | 299×202 | 裁剪页编辑画布、Canvas 上传图输出 |
| 预览区 `previewW×previewH` | `PREVIEW_IMG_SIZE` | 250×155 | Canvas 预览图输出，与花边 SVG 内框一致 |
| 实物印刷 | 产品规格 | 85×40mm | 后台强制缩放，本前端不处理 |

**原则**：
- 工作区尺寸 = 实物等比例（前端保证输出比例正确，避免后台缩放变形）
- 预览区尺寸 = CSS 写死，与花边 SVG 内框像素值一致
- 上传用 `uploadFileMap`（工作区尺寸），预览用 `uploadMap`（预览区尺寸）

### 10.3 双路 Canvas 输出

`handleConfirm` 中 Canvas 渲染两次（复用同一个 `<Canvas type='2d'>` 节点）：

```
renderToCanvas(canvasW, canvasH, isPreview):
  ├─ canvas.width/height = canvasW/H × dpr
  ├─ 白底 fillRect
  │
  ├─ isPreview ? 等比缩放 + 居中 :
  │     s = min(canvasW/cropW, canvasH/cropH)
  │     offsetX = (canvasW - cropW*s) / 2
  │     ctx.translate(offsetX, offsetY); ctx.scale(s, s)
  │
  └─ 然后统一在 work-area 坐标系绘制：
       ctx.translate(cropW/2 + translateX, cropH/2 + translateY)
       ctx.rotate / ctx.scale / ctx.drawImage
```

| 输出 | 尺寸 | 变量 | 等比缩放？ |
|------|------|------|-----------|
| 预览图 | previewW×previewH | `imageUrl` → `uploadMap` | ✅ s < 1，工作区等比缩小 |
| 上传图 | cropW×cropH | `uploadUrl` → `uploadFileMap` | ❌ s = 1，直接 1:1 |

### 10.4 状态记忆（内存，非持久化）

裁剪编辑状态不持久化到 Storage，避免跨会话残留。使用模块级变量 `cropStateMap`（`src/pages/editor/crop-state.ts`）：

```ts
// 裁剪页保存
setCropState(itemIndex, { originalImageUrl, transform, imgW, imgH });

// 裁剪页关闭 → 清空
handleClose → removeCropState(itemIndex);

// 编辑器删除规格 → 清空
handleMenuClick('delete') → removeCropState(activeItem.index);

// 再次进入裁剪页 → 恢复原图 + transform
getCropState(itemIndex) → setImageUrl(originalImageUrl) + setTransform(...)
```

- **裁剪结果**（`CropResult`）也是一次性信号，读完即清
- 后续做草稿箱功能时再选择性持久化

### 10.5 Canvas 渲染注意事项

- `<Canvas type='2d'>` 按需渲染（`canvasVisible` 状态控制），**不要在页面 mount 时就渲染**，否则小程序引擎可能报 `this._getData is not a function`
- H5 端不做 Canvas 裁剪，降级直接传原图（`process.env.TARO_ENV === 'h5'` 跳过 Canvas 逻辑）
- `canvasToTempFilePath` 返回的图片物理像素 = 逻辑像素 × DPR

### 10.6 关键文件

| 文件 | 作用 |
|------|------|
| `src/pages/editor/index.logic.ts` | 编辑器主逻辑，`UPLOAD_AREA_SIZE`、`PREVIEW_IMG_SIZE`、`uploadMap`/`uploadFileMap` |
| `src/pages/editor/crop-state.ts` | 裁剪状态/结果共享内存模块 |
| `src/pages/editor-crop/index.logic.ts` | 裁剪页逻辑，Canvas 双路渲染、手势处理、变换计算 |
| `src/pages/editor-crop/index.tsx` | 裁剪页视图，隐藏 Canvas 节点 |
| `src/pages/editor-crop/useGestureHandler.ts` | 手势处理（拖拽、缩放、旋转） |
| `src/pages/editor/index.scss` | 各规格花边预览 CSS 尺寸（`upload-area--`、`preview-wrap--`、`preview-bg--`、`preview-img--`） |
