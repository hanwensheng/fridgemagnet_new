# Tasks

- [x] Task 1: 初始化 Taro 项目并安装核心依赖
  - [x] SubTask 1.1: 执行 `npx @tarojs/cli init .`，选择 React、TypeScript、Sass、Webpack5、默认模板（已在根目录初始化，无需子目录）
  - [x] SubTask 1.2: 确认当前目录为项目根目录，无需 `cd`
  - [x] SubTask 1.3: 安装运行时依赖：`npm install @nutui/nutui-react-taro zustand`
  - [x] SubTask 1.4: 安装开发依赖：`npm install -D tailwindcss@^3 postcss autoprefixer weapp-tailwindcss@latest thread-loader babel-plugin-import eslint prettier husky@^9 lint-staged @types/react @types/react-dom`
  - [x] 验证：`package.json` 中存在上述依赖，且 `tailwindcss` 版本为 3.x、`husky` 版本为 9.x

- [x] Task 2: 配置构建工具与路径别名
  - [x] SubTask 2.1: 编写 `config/index.ts`：配置 `projectName`、`designWidth`、设备比、`framework: 'react'`、`compiler: { type: 'webpack5', prebundle: { enable: true } }`、文件系统缓存（仅 `type` 和 `cacheDirectory`）、路径别名 `@`、`@components`、`@pages`、`@store`、`@utils`、`@styles`
  - [x] SubTask 2.2: 在 `config/index.ts` 的 `mini.webpackChain` 中注册 `weapp-tailwindcss/webpack` 插件（`rem2rpx: true`），并添加 `thread-loader`（`workers: cpus - 1`）。插件导入方式：`const { WeappTailwindcss } = require('weapp-tailwindcss/webpack')`；若提示无命名导出，改为 `const WeappTailwindcss = require('weapp-tailwindcss/webpack')`
  - [x] SubTask 2.3: 在 `config/index.ts` 的 `mini.postcss.pxtransform.config.selectorBlackList` 中加入 `nut-`，避免 NutUI 的 px 被转成 rpx
  - [x] SubTask 2.4: 确认 `config/index.ts` 的 `h5` 配置不额外注册 `weapp-tailwindcss` 插件，H5 端 Tailwind 通过 `postcss.config.js` 生效
  - [x] SubTask 2.5: 编写 `tsconfig.json`，同步配置 `baseUrl` 与 `paths`
  - [x] 验证：`npm run dev:h5` 能启动且不报路径/构建错误

- [x] Task 3: 配置 Tailwind CSS 与 NutUI 按需加载
  - [x] SubTask 3.1: 创建 `tailwind.config.js`，配置 `content: ['./src/**/*.{js,jsx,ts,tsx}']`、`theme: {}`、`plugins: []`
  - [x] SubTask 3.2: 创建 `postcss.config.js`，导出 `plugins: { tailwindcss: {}, autoprefixer: {} }`
  - [x] SubTask 3.3: 创建 `src/app.css`，写入 `@tailwind base; @tailwind components; @tailwind utilities;`
  - [x] SubTask 3.4: 在 `src/app.tsx` 顶部 `import './app.css'`（项目实际为 `src/app.ts`）
  - [x] SubTask 3.5: 创建/修改 `babel.config.js`（或 `babel.config.ts`），添加 `babel-plugin-import` 插件，配置 `@nutui/nutui-react-taro` 的 `style: 'css'` 与 `camel2DashComponentName: false`
  - [x] 验证：在页面中使用 Tailwind 类名和 NutUI `<Button>` 组件，H5 与微信小程序下样式与组件均正常

- [x] Task 4: 配置代码规范与 Git Hooks
  - [x] SubTask 4.1: 编写 `.eslintrc.js`，`extends: ['taro/react']`，关闭 `react/jsx-uses-react` 与 `react/react-in-jsx-scope`
  - [x] SubTask 4.2: 编写 `.prettierrc`，配置 `singleQuote: true`、`trailingComma: 'all'`、`printWidth: 100`、`tabWidth: 2`、`semi: true`
  - [x] SubTask 4.3: 在 `package.json` 的 `scripts` 中添加 `"lint": "eslint src --ext .js,.jsx,.ts,.tsx"`
  - [x] SubTask 4.4: 在 `package.json` 中添加 `lint-staged` 配置：`"*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"]`、`"*.{css,scss}": ["prettier --write"]`
  - [x] SubTask 4.5: 执行 `npx husky init`，然后创建 `.husky/pre-commit` 文件并写入 `npx lint-staged`（Linux/macOS：`echo "npx lint-staged" > .husky/pre-commit`；Windows PowerShell：`Set-Content -Path .husky/pre-commit -Value "npx lint-staged" -NoNewline -Encoding UTF8`）
  - [x] 验证：修改一个文件后执行 `git add . && git commit -m "test"`，看到 `lint-staged` 运行并对变更文件执行 ESLint 与 Prettier

- [x] Task 5: 创建全局配置、Store 与首页示例
  - [x] SubTask 5.1: 创建 `src/app.config.ts`，配置 `pages: ['pages/index/index']` 与 `window` 导航栏标题
  - [x] SubTask 5.2: 创建微信小程序 `project.config.json`（如需要），配置 `appid`、`projectname`、`setting`
  - [x] SubTask 5.3: 创建 `src/store/useCounterStore.ts`，提供 `count`、`increment`、`decrement`、`reset`
  - [x] SubTask 5.4: 修改 `src/pages/index/index.tsx`，引入 Zustand store、Tailwind 类名、NutUI `<Button>`，实现计数器页面
  - [x] 验证：页面能正常渲染，点击 + / - / Reset 按钮数字同步变化

- [x] Task 6: 验证跨端构建与产物
  - [x] SubTask 6.1: 运行 `npm run dev:h5`，确认无致命报错，浏览器中页面正常
  - [x] SubTask 6.2: 运行 `npm run dev:weapp`，确认无致命报错，微信开发者工具可打开 `dist/weapp`
  - [x] SubTask 6.3: 运行 `npm run build:h5`，确认产物生成在 `dist`（H5 默认输出目录）
  - [x] SubTask 6.4: 运行 `npm run build:weapp`，确认产物生成在 `dist/weapp`
  - [x] 验证：H5 产物中 Tailwind 样式以 px/rem 存在，小程序产物 `.wxss` 中 Tailwind 样式以 rpx 存在

- [x] Task 7: 整理项目结构与最终检查
  - [x] SubTask 7.1: 确保目录结构符合规范：`config/`、`src/pages/index/`、`src/components/`、`src/store/`、`src/utils/`、`src/styles/`
  - [x] SubTask 7.2: 清理构建产物：`rm -rf dist .taro_cache`（Windows 使用 `rmdir /s /q`），保留 `config/index.ts` 中的 `cacheDirectory` 配置
  - [x] SubTask 7.3: 运行 `npm run lint`，确认无 ESLint 错误
  - [x] 验证：所有 Task 1-6 的验证项均已通过，并记录在 checklist.md

# Task Dependencies

- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
- Task 4 依赖 Task 1（可在 Task 2/3 之后并行执行）
- Task 5 依赖 Task 2 与 Task 3
- Task 6 依赖 Task 5
- Task 7 依赖 Task 6
