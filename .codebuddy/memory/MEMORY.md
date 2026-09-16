# 项目长期记忆：fridgemagnet_new（冰箱磁贴小程序）

## 技术栈与约定
- Taro 4.2 (React 18) + webpack5 + NutUI React Taro + TailwindCSS + Sass；Zustand 状态管理。
- 设计稿宽度 375（`config/index.ts` 中 `designWidth: 375`，`deviceRatio: { 375: 2/1 }`）：**写 px 即设计稿 px，构建时自动 ×2 转 rpx**。SCSS 与 Tailwind 任意值类（如 `h-[143px]`）都遵循该规则。
- Tailwind 与 pxtransform 顺序：根目录 `postcss.config.js` 配 tailwindcss；Taro mini.postcss 里 `pxtransform.enable = true`，`selectorBlackList: ['nut-']`（即含 `nut-` 的选择器内 px 不转换）。
- 内联 `style={{}}` 中的 px 不会被 pxtransform 转换（物理 px），需要设计稿尺寸时应写在 SCSS 类或 Tailwind 类里。

## 后端接口与数据约定（bizGoods）
- 开发环境接口基址：`http://8.141.81.252:7098`（`src/api/request.ts`，生产为 `https://api.zhongjiatong.vip/api`）。调试时可直接 curl，例如 `POST /v1/bizGoods/findAllBySearch` body `{"isShow":1,"pageNum":1,"pageSize":999}`。
- **`width` / `height` 约定为毫米（mm）**，前端 `formatSizeLabel`（`src/utils/format.ts`）统一 ÷10 显示为 cm（如 `"85.0"/"40.0"` → `8.5*4cm`），并且内部用 `toFixed(3)` 收敛浮点误差（`116.2/10 = 11.620000000000001`）。所有尺寸文案（弹层、详情页 tab、订单/物流、编辑器）都复用这个函数。
- `imgLinks`（详情图）与 `modelLink3d`（3D 模型）**可能为 null / 空字符串**，所有消费端必须做空值兜底，否则会在 `product-details` 页面抛错（xr-frame / xr-model-viewer 跑在渲染层，报错表现为 `[渲染层错误] exparserScriptError`）。

## 新增一个规格尺寸时需要同步的位置（重要）
1. 弹层兜底图：`src/components/spec-select-popup/index.tsx` 的 `LOCAL_IMAGE_MAP`，key = `${width}x${height}`（后台 mm 原始值，如 `155x116.2`），值 = `@/assets/images/<cm>_<cm>cm.png`。
2. 编辑器：`src/pages-sub/editor/index.logic.ts`
   - `SIZE_OPTIONS`（`id`/`label` = `${formatSizeLabel}` 结果，如 `15.5*11.62cm`；`displayWidth/Height` = tab 图的一半，2 倍图 68 高 → 34，展示高度统一 34）；
   - `PREVIEW_BG_MAP`（规格名 → `icon_preview_bg_<尺寸>.svg`）；
   - `PREVIEW_CLASS_MAP`（规格名 → class 后缀，**尺寸去掉小数点**，如 `15.5*11.62cm` → `155x1162`）；
   - `UPLOAD_AREA_SIZE` / `PREVIEW_IMG_SIZE`（class 后缀 → 设计稿宽高）。
3. 编辑器样式：`src/pages-sub/editor/index.scss` 增加 `.upload-area--<cls>`、`.preview-wrap--<cls>`、`.preview-bg--<cls>`（=花边框 SVG viewBox 尺寸）、`.preview-img--<cls>`（= 上传区等比缩放，花边框四周各留 18px，即 wrap = img + 36）。
4. 资源：`src/assets/images/tab_<尺寸>.png`（+`_active`，2 倍图）、`src/assets/svgs/icon_preview_bg_<尺寸>.svg`、`src/assets/images/<尺寸>cm.png`（弹层兜底图）。
5. 裁剪页（`pages-sub/editor-crop`）由 URL 参数驱动，不用改。
参考实现：15.5*11.62cm（上传区 299x224、预览图 253x190、花边框 289x226）。

## 价格与促销规则（2026-09-15 起，替代 getPrice）
- **`/v1/bizOrder/getPrice` 的阶梯价字段（firstPrice / secondPrice / otherPrice）已废弃**，该接口现在**只用于取运费 `deliveryPrice`**，且只在确认订单页调用（`src/pages-sub/order-confirm/index.logic.ts`）。商品价格一律取 `productApi.getGoodsList()`（`/v1/bizGoods/findAllBySearch`）的 `price` 字段（按规格区分）。
- **促销规则（前端计算，常量在 `src/pages-sub/order-confirm/index.logic.ts` 顶部）**：
  - `DISCOUNT_RATE = 0.8`：订单 ≥2 件时，先遍历找出**最低价**那件保持原价（价格并列时取遍历到的第一个），其余商品按 8 折（`toFixed(2)`）。
  - `FREE_SHIPPING_AMOUNT = 40`：**满 40 元包邮**（按折后商品金额 `totalPrice` 判断，调整成折前合计就把判断换成 `originalTotal`）；未满时收 `getPrice().deliveryPrice`（接口未返回前按 0 处理，会出现短暂"包邮"文案）；0 件 → 0 元。
  - 应付 = 折后商品额 + 运费；原价合计用于展示与优惠计算（优惠 = 原价合计 − 折后合计）。
- 弹层（`src/components/spec-select-popup`）卡片单价显示该规格自己的 `price`，底部促销文案写死为常量 `PRICE_TIP`（不再依赖接口）。
- 数据流：`goods.price` → 弹层 `selectedItems.price` → 编辑器 `specList.price` → `orderData.specs.price` → 确认订单页。链路里的 price 是**“选择时的快照”**（编辑器、草稿 `fridge_magnet_editor_drafts` 都会长期保存），所以**确认页首次进入时会静默拉一次 `productApi.getGoodsList(undefined, {showLoading:false, showError:false})`，按 `pkId` 覆盖为线上最新价，快照价只作兜底**（拉不到/商品下架时回退，差异 >0.001 时 `console.warn`）；新增取价相关逻辑时保持“线上优先、快照兜底”。
- 金额文案：**底部（确认页底栏 `order-total-label`、优惠明细弹层底部 `coupon-detail-total-label`）统一用「合计」**；确认页汇总卡片第一行仍叫「总计」（值是折前 `originalTotal`）。
- 线上在售商品价（2026-09-15 实测）：39 / 39 / 39（55x70、30x45、85x40）+ 139（155x116.2）。因商品最低价 39，**订单 ≥2 件时折后 ≥70.2 恒超 40 元门槛 → 必然包邮**，所以 `CouponDetailPopup` 底部传 `totalPrice`（不含运费）与底栏 `finalTotal` 恒等，暂无不一致风险（若上架 <22.22 元规格或提高包邮门槛则会破，届时改成传 `finalTotal`）。
- 注意：确认页的金额只是前端展示，实付以后端 `saveAppend`/`payOrder` 结果为准，两边规则需一致。

## 尺寸单位与小数（实测结论）
- 本项目 `postcss-pxtransform` **不会四舍五入**：只是 ×2 转 rpx 并保留小数（`unitPrecision: 5`）。实测 `152.3px → 304.6rpx`、`17.7px → 35.4rpx`、`0.5px → 1rpx`。CSS、rpx 都支持小数。
- 但 **canvas / 裁剪输出尺寸只能是整数**（`PREVIEW_IMG_SIZE` → `editor-crop` 的 canvas），若它和 SCSS 里的显示尺寸不一致，`<Image mode='aspectFit'>` 会等比缩放 → 留出 0.3~1px 透明边，而照片是压在花边框透明内窗之上的 → 表现为"缝隙"。**结论：裁剪输出尺寸必须与显示尺寸完全一致，且优先用整数。**
- 想让照片盖住花边内窗、彻底免除 hairline：给内边图 +1px 溢出（或 left/top 各 -1px），照片 `z-index: 1` 高于花边框，放大/偏移是安全的。

## 环境：Git 远程与认证（2026-09-15 已修）
- 远端仓库 `hanwensheng/fridgemagnet_new`，**remote 已从 HTTPS 改为 SSH**：`git@github.com:hanwensheng/fridgemagnet_new.git`（原 HTTPS 推送报 `Invalid username or token. Password authentication is not supported`，因钥匙串里存的是普通密码而非 PAT）。
- SSH 密钥：`~/.ssh/hanwensheng-GitHub`（`~/.ssh/config` 由 SourceTree 生成，`Host github.com` + `PreferredAuthentications publickey` + `UseKeychain yes`）；`ssh -T git@github.com` → `Hi hanwensheng!` 认证正常。这台机器**不要**再用 HTTPS + PAT 推送。
- `~/.gitconfig` 里失效的 `credential.helper=manager`（未安装 Git Credential Manager，会打印 `is not a git command`）已 `--unset`；现在唯一生效的是 system `/opt/homebrew/etc/gitconfig` 的 `osxkeychain`。
- 注意：SourceTree 推送时若不识别 OpenSSH 配置，需在「偏好设置 → Git → SSH 客户端」选择 OpenSSH 并指定该私钥。

## NutUI Popup 使用要点
- `Popup` 的 `className` 作用于 `.nut-popup` 根节点，NutUI 给该节点内联了 `display: block/block`，所以**用 SCSS 设 `display: flex` 会被内联样式覆盖**（必要时需 `!important`）。
- `.nut-popup` 自身是 `position: fixed; bottom: 0; left: 0; width: 100%`，因此弹层内的 `position: absolute` 子元素会相对弹层定位（可直接用于底部悬浮按钮）。
- 弹层内做滚动内容的项目惯例：使用 `<ScrollView scrollY>`（参考 `src/components/coupon-detail-popup`、`src/components/region-picker`），并为滚动容器设定确定高度。
- 关闭按钮实际类名是 `.nut-popup-title-right`（另有 `.nut-popup__close-icon` 兜底样式）。

## 调试技巧：定位小程序“[渲染层错误]”的源码位置
- 渲染层报错栈形如 `at d (WAWebview.js:1:712020)`，`1:col` 是压缩文件的列号，可直接反查。
- 基础库包：`~/Library/Application Support/微信开发者工具/<hash>/WeappVendor/<版本>.wxvpkg`，文件内容**未压缩**；格式为 `[4B 文件数]` + 每条 `[4B nameLen][name][4B offset][4B size]`（offset 连续）。用 node 按 offset/size 取出 `WAWebview.js` 后按列号切片即可看到源码。
- 已确认的已知问题：`exparser` 的 `wx-touchtrack` 行为（内置 `scroll-view`/`movable-view`/`picker-view`/`slider`/`swiper` 使用）里 `Array.from(e.touches)` 未判空；开发者工具用鼠标模拟滚动时派发的合成 touchend/touchmove 不带 `touches`，会抛 `undefined is not iterable`（`exparserScriptError`）。真机触摸事件必带 `touches`，属开发者工具问题，不必改业务代码；若必须规避，可把该处 `ScrollView` 换成 `View + overflow-y:auto`（绕过 wx-touchtrack）。
- 已知环境问题：xr-frame（3D 模型）在开发者工具里会请求 `__dev__/ENGINE_WASM.js|wasm`、`draco_mini.js`、`draco_decoder.wasm`，工具把 `__dev__/*` 解析到项目输出目录 `dist/weapp/__dev__/`（不存在）→ 500 + `RuntimeError: Aborted(both async and sync fetching of the wasm failed)`。排查入口：开发者工具日志 `~/Library/Application Support/微信开发者工具/<hash>/WeappLog/logs/*.log`（关键字 `onProxyError`）。只影响开发者工具里的 3D 展示，真机由客户端内置引擎提供。
- 该问题的机制：开发者工具的 `__dev__` 专用路由只认绝对路径 `/__dev__/*`，而 xr-frame 引擎用相对路径取 wasm（变成 `/appservice/__dev__/*.wasm`）→ 走兜底代理 → 去项目目录找 → ENOENT/500。开发者工具自带这 4 个文件（app.asar 的 `/js/vendor/{ENGINE_WASM.js,ENGINE_WASM.wasm,draco_mini.js,draco_decoder.wasm}`，可解析 asar 索引 offset 后按 `dataStart=16+jsonSize`（4 字节对齐）直接提取）。**已验证有效的临时修复**（2026-09-15）：把 4 个文件放到 `dist/weapp/__dev__/`（dist 已 gitignore，全新编译/清缓存可能被清，清了要重新放）；正规修复：换稳定版/更新的开发者工具。
- 复发原因：Taro 构建会重建输出目录，`dist/weapp/__dev__/` 会被清掉，所以"放文件"这种手工兜底不持久；持久方案 = `scripts/xr-engine-patch.mjs` 提取到 `.wx-dev-engine/`（gitignore）+ `config/index.ts` 的 `copy.patterns` 每次构建自动补 → 但 2.9MB 会进主包，需配 `project.config.json` 的 `packOptions.ignore` 排除 `__dev__`（该排除是否影响模拟器读取待验证）。
- 该 bug 是**开发者工具 2026-09-07 那版更新引入的回归**（app.asar 时间戳 2026-09-07 17:41，版本 2.02.2608040）：同一天之前的老版本可以正常预览 3D。
- **推荐开发者工具版本：2.01.2510290（2026/03/25）** —— 用户实测换到这个版本后 3D 预览正常，`dist/weapp/__dev__/` 兜底文件已删除（老版本自带正确路由）；建议不要随手升级到 2.02.x。若将来升级后又出现 `__dev__` wasm 500，再按上面的提取方法补文件。
