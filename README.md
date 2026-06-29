# fridgemagnet_new

一个基于 **Taro 4 + React 18 + TypeScript** 的跨端（H5 + 微信小程序）前端项目，使用 Tailwind CSS、NutUI、Zustand 构建。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 跨端框架 | Taro 4.2.0 | 编译到 H5 / 微信小程序等多端 |
| UI 框架 | React 18.x | 组件模型 |
| 语言 | TypeScript 5.4.5 | 类型安全 |
| 构建工具 | Webpack 5 | Taro 默认 |
| 组件库 | @nutui/nutui-react-taro | 适配 Taro 的组件库 |
| 样式 | Tailwind CSS 3.x + Sass | 原子化 CSS + 局部样式 |
| 状态管理 | Zustand 5.x | 轻量状态管理 |
| 代码规范 | ESLint + Prettier + Husky + lint-staged | 提交前自动格式化与检查 |

## 快速开始

```bash
# 安装依赖
npm install

# 启动 H5 开发服务
npm run dev:h5

# 启动微信小程序开发构建
npm run dev:weapp
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev:h5` | H5 开发模式 |
| `npm run dev:weapp` | 微信小程序开发模式 |
| `npm run build:h5` | H5 生产构建，产物在 `dist/` |
| `npm run build:weapp` | 微信小程序生产构建，产物在 `dist/weapp/` |
| `npm run lint` | 运行 ESLint 检查 |

## 目录结构

```
.
├── config/                 # Taro 构建配置
├── src/                    # 业务源码
│   ├── app.ts              # 应用入口
│   ├── app.css             # Tailwind CSS 入口
│   ├── app.config.ts       # 全局页面路由
│   ├── pages/              # 页面
│   ├── components/         # 公共组件
│   ├── store/              # Zustand stores
│   ├── utils/              # 工具函数
│   └── styles/             # 全局样式
├── types/                  # 全局类型声明
├── patches/                # patch-package 补丁
├── tailwind.config.js      # Tailwind 配置
├── postcss.config.js       # PostCSS 配置
├── babel.config.js         # Babel 配置（含 NutUI 按需加载）
├── tsconfig.json           # TypeScript 配置
├── project.config.json     # 微信小程序项目配置
├── CLAUDE.md / AGENTS.md   # 项目协作规则（必读）
└── README.md               # 本文件
```

## 路径别名

```
@          -> src
@components -> src/components
@pages      -> src/pages
@store      -> src/store
@utils      -> src/utils
@styles     -> src/styles
```

## 跨端开发说明

- **H5**：Tailwind 工具类输出标准 `rem/px`。
- **微信小程序**：通过 `weapp-tailwindcss` 自动将 `rem` 转换为 `rpx`。
- **NutUI 组件**：通过 `babel-plugin-import` 按需引入，样式独立加载。
- **环境判断**：使用 `process.env.TARO_ENV` 区分运行环境。

## 代码规范

- 提交前会自动触发 `lint-staged`，执行 ESLint --fix 与 Prettier --write。
- 提交信息必须使用**简体中文**，格式为 `<类型>: <简短描述>`。
- 类型前缀：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`chore`。
- 详细规范见 [CLAUDE.md](CLAUDE.md)。

## 注意事项

- 不要升级 `tailwindcss` 到 4.x。
- 不要升级 `weapp-tailwindcss` 到 5.x。
- 不要删除 `patches/` 目录中的补丁。
- H5 构建会清空 `dist/`，如需同时保留两端产物，先 `build:h5` 再 `build:weapp`。

## 项目规则

更多项目约定、第一性原理推导、决策记录详见 [CLAUDE.md](CLAUDE.md)。
