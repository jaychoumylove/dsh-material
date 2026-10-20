# 发布到 DSH 插件市场（1024Store / dshfind）

DSH Desktop 的社区市场**只从 npm 官方 registry 安装**：目录条目提供 npm 包名 → Host 用
npm `latest` 解析出精确稳定版本 → 校验该 manifest 声明了合法的 `dsh.bundle.patch` → 才允许
一键安装。只有 GitHub 仓库、没有 npm 包的条目会被收录但只能浏览，不能安装。

所以一次完整的上架是三件事：

1. **把包发布到 npm**（这一步让它可安装）
2. **给仓库打 `dsh-plugin` topic**（让目录的自动发现能扫到它）
3. **提一个 catalog PR**（让它在 deepseek1024.com 上有中文分类和描述；合并后自动同步）

---

## 1. 发布到 npm

包名 `dsh-material-theme`（2026-10-21 查过，npm 上仍未被占用）。

```sh
cd /Users/qucaixian/dsh-material
./scripts/check.mjs 2>/dev/null || node scripts/check.mjs   # 发布前先跑校验
npm login                       # 或：export NPM_TOKEN=... && npm config set //registry.npmjs.org/:_authToken=$NPM_TOKEN
npm publish --access public
```

验收：

```sh
curl -s https://registry.npmjs.org/dsh-material-theme/latest | head -c 400
# 应返回 name/version=0.2.3，且 dsh.bundle.patch = "./cordis.patch.yml"
```

npm 包内容由 `package.json` 的 `files` 决定（`index.js`、`client/`、`cordis.patch.yml`、
`README.md`、`LICENSE`），`npm pack --dry-run` 可预览：6 个文件、约 27 kB。

发版后：

```sh
dsh plugin --profile desktop add dsh-material-theme@latest
```

## 2. 打 topic：`dsh-plugin`

在 <https://github.com/jaychoumylove/dsh-material/settings> 的 **Topics** 里加 `dsh-plugin`
（有 token 时也可以一条命令）：

```sh
curl -X PUT https://api.github.com/repos/jaychoumylove/dsh-material/topics \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -d '{"names":["dsh-plugin","dsh-theme","material-theme","dsh-desktop"]}'
```

1024Store 的自动收集任务会扫这个 topic，静态校验仓库根目录的 `package.json` +
`dsh.bundle.patch` 和 patch 文件是否存在（只读文件，不执行代码）。

## 3. 提 catalog PR（可选，但推荐）

目标仓库：<https://github.com/imsai-sh/awesome-deepseek-harness-plugins>
要加的文件：`catalog/plugins/jaychoumylove--dsh-material.json`
内容见本仓库 `market/catalog-plugins/jaychoumylove--dsh-material.json`（id 为
`jaychoumylove/dsh-material`，分类 `theme`）。

规则要点（来自该仓库 CONTRIBUTING）：

- PR 只允许新增/修改 `catalog/plugins/*.json` 一个文件，不要动 README、workflow
- 文件名 = id 各段小写、非字母数字转 `-`、段间用 `--` 连接
- 描述要中性具体，不要促销语；`added` 填提交日期
- 通过 `Plugin submission review / static-review` 且恰好新增一个条目后会被自动 squash-merge，
  随后 CI 自动同步到线上目录，无需人工步骤

一行命令版本（需要 `GITHUB_TOKEN`）：

```sh
gh repo fork imsai-sh/awesome-deepseek-harness-plugins --clone
# 复制 catalog-plugins 里的 json 到 catalog/plugins/，然后
gh pr create --title "Add jaychoumylove/dsh-material" --body-file market/PULL_REQUEST.md
```

## 4. dshfind（可选）

<https://dshfind.com> 是另一个可选来源，走它自己的收录流程；Desktop 市场里换来源即可看到。
npm 包发布 + `dsh-plugin` topic 通常已经足以被这类来源扫到。

## 状态

- [x] 仓库：<https://github.com/jaychoumylove/dsh-material>
- [x] 包已就绪（`private` 已移除、`publishConfig` / `repository` / `license` 就位）
- [x] catalog 条目与 PR 描述已写好（`market/`）
- [ ] npm 发布（需要 npm 凭据）
- [ ] 加 `dsh-plugin` topic（需要 GitHub 凭据）
- [ ] 提 catalog PR（需要 GitHub 凭据）
