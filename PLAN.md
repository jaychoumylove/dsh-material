# 计划：dsh-material —— 复刻 JetBrains「Material Theme UI」的 DSH 主题插件

## 0. 目标与范围

在 `/Users/qucaixian/dsh-material` 下新建一个独立、可安装的 DSH 插件包 `dsh-material-theme`，装进当前 DSH Desktop（`dsh-plugin-desktop` 2.0.10 / `@deepseek-ai/dsh` 0.1.5-rc.2）的 `desktop` profile，视觉风格参照 JetBrains 的 Material Theme UI：

- **多配色方案**：Ocean / Palenight / Darker / Deep Ocean（深色）+ Lighter（浅色），跟随 DSH 自带的 浅色/深色/系统 偏好自动切换；
- **Material 强调色**：12 色材质调色板（蓝/紫/青/绿/黄/橙/粉/红/蓝绿/靛蓝/棕/灰），选中色贯穿品牌色、按钮、链接、焦点环、选中文本；
- **Material 语法高亮**：把 Oceanic 系语法色（keyword `#C792EA`、string `#C3E88D`、function `#82AAFF`、number `#F78C6C` …）写进 `--shiki-*`，聊天里的代码块直接变成 Material 风格；
- **设置行**：在「设置 → 通用 → 外观」里追加一行「Material Theme」，点选配色/强调色即时生效并持久化；
- **Material 质感**：用 `--dsw-elevation-*` / `--dsw-shadow-*` / 边框与层级的阶梯，做出"卡片浮起 + 扁平"的材质感。

约束：不改 DSH 安装目录里的任何文件；只新增上述目录 + 一次插件安装；可一键卸载。

## 1. 已核对的关键事实（实现依据，均已实测读源码）

| 事实 | 位置 |
|---|---|
| 第三方主题插件通过 `ctx.theme.overrideTokens(source, tokens)` 叠层改 token；每个 token 必须是 `{light, dark}` 对，裸字符串会抛错 | `@deepseek-ai/dsh-client-ui-theme/lib/client.js`（`ThemeRuntime`） |
| 内置 `light/DARK/system` 之外的 `setTheme(id)` 不会被持久化；Appearance 行只有 3 个格子，第三方主题无法出现在那里 | `ui-theme/lib/client.js:1493-1500`（`id:"appearance", order:10`）、`order:11` 是字号行 |
| 追加设置行的唯一入口：`ctx.slots.inject("settings.general.item", () => ctx.slots.register({name,id,order,locale,inject}, Component))`，`inject` 返回的键会变成组件 props（不需要 store） | `dshmarket/client/client.js` 的 `settings.plugins.tab` / `settings.general.item` 注册；`ui-theme` 的同名槽注册 |
| 客户端 bundle 格式（宿主按 package.json `exports["./client"]` 取文件，`/plugins/<pkg>/client.js` 下发） | `dshmarket/client/client.js` 首行：`window.__ModuleLoader__.load({ id, factory: (require) => {…return module.exports} })` |
| 包必须声明 `dsh.bundle.patch`（指向 `cordis.patch.yml`）+ `dsh.client`，否则只按普通依赖安装、不会被加载 | `@deepseek-ai/dsh-app-boot/lib/index.js:869` 起 |
| patch 文件格式 | `dshmarket/cordis.patch.yml`：`- insert: [{ id: dsh-market, name: 'dshmarket' }]` |
| 插件装进 `desktop` profile，`dsh.profile.bundles` 现有 `@deepseek-ai/dsh-base, @deepseek-ai/dsh-web-app, dshmarket, billion-context, dsh-net-proxy`；`patchReload: live` | `~/.dsh/profiles/desktop/package.json` |
| `react` / `react/jsx-runtime` 由 shell seed 提供，bundle 里直接 `require` 即可（dshmarket 未声明 external） | `dshmarket/client/client.js:29,32` |
| 设置行组件的 props 契约：`locale` + `inject: () => ({ t })`，组件实参拿到 `{t, ...}` | `dshmarket` 的 `plugins.bundle.config` 注册处 |
| CLI：`node "<app>/node_modules/@deepseek-ai/dsh/lib/bin.js" plugin --profile desktop add <spec>`（bin 名 `dsh`） | `@deepseek-ai/dsh/package.json` |

## 2. 目录结构（全部新建）

```
/Users/qucaixian/dsh-material/
├── package.json          # name dsh-material-theme@0.1.0, exports["./client"], dsh.bundle.patch, dsh.client
├── cordis.patch.yml      # - insert: [{ id: dsh-material-theme, name: dsh-material-theme }]
├── index.js              # 宿主半边：无副作用的 cordis 插件（export const name / export function apply）
├── client/client.js      # 唯一真源：palettes + 100% token 映射 + ThemeRuntime 接线 + 设置行组件
├── scripts/
│   ├── extract-token-names.mjs   # 从 ui-theme 的 design-platform CSS 抽出 --dsw-* / --shiki-* 全量名单
│   ├── check.mjs                 # 语法检查 + token 覆盖校验 + 本地假宿主试跑
│   └── install.sh                # 安装 / 卸载（含重启提示与回退路径）
├── src/token-names.json  # 由 extract 生成，check 读它做覆盖断言
├── README.md             # 用法、配色、卸载、故障排查
└── PLAN.md               # 本文件
```

## 3. 实现设计

### 3.1 配色（参照 Material Theme UI 的原始色板）

| 方案 | 层级基色 | 面板/浮层 | 文本 | 边框 | 来源 |
|---|---|---|---|---|---|
| Ocean（默认深色） | `#0F111A` | `#131629` → `#1A1E33` → `#232842` | `#A6ACCD` (dim `#676E95`) | `#1E2237` / `#2A2F49` | Material Ocean 色板（已联网核对：pane_bg `#0f111a`，pane_fg `#a6accd`） |
| Palenight | `#292D3E` | `#2E3348` → `#343A55` | `#A6ACCD` | `#3B4060` | `#292D3E` 经典 Palenight |
| Darker | `#212121` | `#2A2A2A` → `#333333` | `#EEFFFF` | `#3A3A3A` | Material Theme Darker |
| Deep Ocean | `#090A0F` | `#0E1017` → `#141823` | `#A6ACCD` | `#1A1E2C` | Material Theme Deep Ocean |
| Lighter（浅色） | `#FAFAFA` | `#FFFFFF` → `#F0F0F0` | `#546E7A` | `#E0E0E0` | Material Theme Lighter |

强调色（12）：蓝 `#82AAFF`、紫 `#C792EA`、青 `#89DDFF`、绿 `#C3E88D`、黄 `#FFCB6B`、橙 `#F78C6C`、粉 `#FF5370`、红 `#E57373`、蓝绿 `#4DB6AC`、靛蓝 `#7986CB`、棕 `#BCAAA4`、灰 `#90A4AE`。强调色同时派生：hover（提亮/加深 8%）、dimmed（与底色 30% 混合）、`-foreground`（按对比度选白/黑）。

语法色（Material Theme / Oceanic）：keyword `#C792EA`、string `#C3E88D`、comment `#676E95`（浅色 `#8DA3A8`）、function `#82AAFF`、number `#F78C6C`、constant `#FFCB6B`、parameter `#F78C6C`、punctuation `#89DDFF`、link `#82AAFF`。

### 3.2 token 映射策略（完整性由脚本保证）

`client/client.js` 里用「函数式映射」而不是手抄 100 个键：`tokensFor({scheme, variant, accent})` 返回该方案下的 `Record<tokenName, {light,dark}>`。映射覆盖：

1. `--dsw-alias-bg-*`（base/layer-1..3/mask/overlay/skeleton/module-platform/multi-select）
2. `--dsw-alias-border-*`（l1..l4/inverted/inverted2/l2-darkmode-thin）
3. `--dsw-alias-brand-*`、`--dsw-alias-button-*`、`--dsw-alias-interactive-*`、`--dsw-alias-link-*`
4. `--dsw-alias-label-*`、`--dsw-alias-markdown-*`、`--dsw-alias-scrollbar-*`
5. `--dsw-alias-state-*`（error/success/warn/business）、`--dsw-alias-toast-bg`、`--dsw-alias-tooltip-bg`
6. `--dsw-specific-*`（bubble/input/menu/selector/sidebar/nav-item/tip）
7. `--shiki-*`（含 `--shiki-foreground/background`）
8. 阴影/层级：`--dsw-shadow-lv1..lv3`、`--dsw-elevation-*` 调到 Material 的「柔和双阴影」

`scripts/check.mjs` 会用 `src/token-names.json` 断言：**每个方案都覆盖全部别名 token**；缺失项输出清单并以非 0 退出；多余的（拼错的）token 名也报错。允许白名单（`--dsw-linear-gradient-think`、`--dsw-mask-blur` 这类与材质无关的项可保留原值不覆盖）。

### 3.3 运行时行为

```js
// client/client.js 骨架
window.__ModuleLoader__.load({ id: "dsh-material-theme", factory: (require) => {
  const react = require("react");                   // shell seed 提供
  const exports = {};

  const NS = "materialTheme";
  const KEY = "dsh.material.v1";                     // { dark, light, accent, enabled }
  const readConfig = () => ({ dark: "ocean", light: "lighter", accent: "purple", enabled: true, ...safeParse(localStorage) });
  const apply = (theme, cfg) => disposer = theme.overrideTokens("dsh-material-theme", tokensFor(cfg)); // 覆盖同一 source 即替换旧层

  exports.inject = ["slots", "locale", "theme"];
  exports.name = "dsh-material-theme";
  exports.apply = (ctx) => {
    let cfg = readConfig();
    if (cfg.enabled) apply(ctx.theme, cfg);          // 启动即生效（Dark→Ocean / Light→Lighter）
    ctx.effect(() => ctx.locale.register(NS, { zh: DICT.zh, en: DICT.en }), "material-theme: dictionaries");
    ctx.slots.inject("settings.general.item", () => ctx.slots.register({
      name: "settings.general.item", id: "material", order: 12, locale: NS,
      inject: () => ({ t }),
    }, () => react.createElement(MaterialRow, { cfg, t, onPick })));
    // onPick: 更新 cfg → localStorage → 重新 apply()
  };
  exports.__lib = { tokensFor, VARIANTS, ACCENTS };  // 供 check.mjs 读取
  return exports;
}});
```

要点：
- 用 `{light, dark}` 双值覆盖，所以用户切「浅色/深色/跟随系统」时自动换到 Lighter / 选定深色方案，**不需要监听 `theme/change`、不与内置主题抢 `setTheme`**；
- 持久化走 `localStorage`（跟 m3-monet 同类做法），刷新/重启保留；
- 提供 `window.__dshMaterial = { get, setDark, setLight, setAccent, disable }` 兜底入口（设置行万一渲染异常也能用）；
- `disable()` 调 overrideTokens 返回的 disposer 收层，恢复原生外观。

### 3.4 设置行 UI（Material 观感）

- 标题：「Material Theme」+ 一句话说明（自动跟随浅/深色）；
- 五个配色 chip：色块 + 名称，选中态 = 强调色描边 + 勾；
- 12 个强调色圆点：选中态圆环；
- 实时预览：点击立刻 `apply()`（覆盖层替换，不重载）；
- 每个 chip/圆点有 `aria-label` 和 `title`，键盘可操作（role=button, tabIndex, Enter/Space）；
- 若 slots/locale 契约与预期不符：回退方案 = 去掉该行，仅 `window.__dshMaterial` + 默认配色（见 §6）。

### 3.5 不对 DSH 做的改动

- 不改内置 Appearance 行、不改 `~/.dsh/profiles/desktop` 之外的文件；
- 不注册自定义 `theme` id 到 ThemeRuntime（避免和覆盖层叠出双份效果）；纯覆盖层方案；
- 不注入全局 CSS 覆盖（v1 只靠 token）；如视觉验收后仍缺材质感，再单独做 §7 的 Phase 2。

## 4. 实施步骤

1. **建目录** `mkdir -p /Users/qucaixian/dsh-material/{client,scripts,src}`；同时请你在左侧边栏把工作区切到 `dsh-material`（会话工作区是会话级设置，我无法在此会话内改写；我全程用绝对路径操作，不阻塞）。
2. 写 `package.json`、`cordis.patch.yml`、`index.js`、`README.md`。
3. 写 `client/client.js`（配色 + 全量 token 映射 + 覆盖接线 + 设置行）。
4. `node scripts/extract-token-names.mjs` 生成 `src/token-names.json`（从已安装的 `ui-theme/lib/client.js` 里抽全量别名/`shiki` token 名）。
5. `node scripts/check.mjs`：`node --check client/client.js`、token 覆盖断言、用假 `window/require` 试跑一次 factory 并抽样断言 `tokensFor` 输出（如 `bg-base` 深色 = `#0F111A`、强调色随 accent 变化）。
6. 安装：`node "/Applications/DSH Desktop.app/Contents/Resources/app/node_modules/@deepseek-ai/dsh/lib/bin.js" plugin --profile desktop add file:/Users/qucaixian/dsh-material`，确认 `~/.dsh/profiles/desktop/package.json` 的 `dsh.profile.bundles` 里出现 `dsh-material-theme`。
7. 重启 DSH Desktop，`curl -s http://127.0.0.1:43120/ | grep -c dsh-material-theme` 确认启动清单位含本插件；`curl -sI http://127.0.0.1:43120/plugins/dsh-material-theme/client.js` 应为 200。
8. 与你一起看效果：设置 → 通用 → 外观 出现「Material Theme」行；切配色/强调色即时生效；切浅色方案正常；控制台无报错。

## 5. 验收标准

- [ ] 安装后外观变为 Material Ocean（深色）/ Lighter（浅色），代码块语法色为 Oceanic 配色；
- [ ] 外观行下方出现「Material Theme」设置行，5 个配色 + 12 个强调色可点，选择持久化（重启后仍在）；
- [ ] 12 个强调色能正确影响主按钮、链接、焦点环、选中态；
- [ ] 浅色/深色/跟随系统切换时自动换到对应 Material 方案，无闪烁异常；
- [ ] `scripts/check.mjs` 全绿：token 覆盖率 100%（白名单除外）、无手误 token 名、factory 可执行；
- [ ] 卸载 `... plugin --profile desktop remove dsh-material-theme` 后恢复原生外观、无残留。

## 6. 风险与回退

| 风险 | 应对 |
|---|---|
| `dsh plugin add file:` 在 desktop profile 上不被支持/行为异常 | 回退：`cd ~/.dsh/profiles/desktop && pnpm add file:/Users/qucaixian/dsh-material`，再手工把 `dsh-material-theme` 加进 `dsh.profile.bundles`，重启 |
| 客户端图在安装后不刷新（需重启） | 明确告知需重启 DSH Desktop；`patchReload: live` 只覆盖 profile 层改动，新依赖的 bundle 由启动期组合 |
| slots 注册契约（`inject` 注入 props / locale）与预期不同 | 设置行降级：不注册槽，仅用 `window.__dshMaterial` 切换；配色/语法/持久化不受影响 |
| 某些 token 在运行时被 ThemePresenter 之外的模块读取 | 覆盖层本身就是官方扩展点；缺失/多余 token 由 check 脚本兜底 |
| 改到不该改的地方 | 所有写入限制在 `/Users/qucaixian/dsh-material`；DSH 侧只有一次 `plugin add`（可逆） |

## 7. 不做的事（本计划范围外）

- 发布到 DSH 社区市场（需要独立 GitHub 仓库 + 稳定 semver + `dsh.bundle` 合规审计）；
- 替换内置 Appearance 行、主题动画、组件级 ripple；
- 改动 DSH 源码或安装内的 `node_modules`；
- Phase 2（可选，验收后再说）：基于 `[data-slot=...]` 等稳定属性做一层 CSS 材质化（圆角 12px 卡片、2px 强调色侧条、hover 抬升）。

## 8. 假设

- 你的截图是 DSH Web GUI（`http://127.0.0.1:43120`，desktop profile），主题在重启后生效；
- 允许我运行 `dsh plugin add/remove` 与读取 `~/.dsh/profiles/desktop`；
- 允许联网（已用于核对 Material Ocean 色值）。
