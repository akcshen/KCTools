# 合页

在浏览器里使用的本地小工具站。第一个工具是**合并 PDF**：按你排好的顺序把多份 PDF 合成一份并下载。文件不会上传，也不需要登录。

## 技术栈

- Vite
- Vue 3
- TypeScript
- Vue Router
- [pdf-lib](https://pdf-lib.js.org/)（纯前端合并，无后端）

## 安装与本地运行

需要 Node.js 22+。

```bash
npm install
npm run dev
```

开发服务器默认地址：[http://127.0.0.1:43123](http://127.0.0.1:43123)

构建并用本地预览：

```bash
npm run build
npm run preview
```

合并逻辑自检（不启动网页）：

```bash
npm run check:merge
```

构建产物在 `dist/`（这个目录不进入 git）。

## 发布到 Cloudflare Pages

需要已经登录、并且有 Pages 写权限的 Cloudflare 账号。`public/_redirects` 会把直接打开的前端路由交回 `index.html`。

```bash
npm run build
npx wrangler pages deploy dist --project-name heye --branch main
```

生产地址会是 `https://heye.pages.dev`（如果项目名已被占用，换一个小写名字）。

## 项目结构

```text
src/
  main.ts                 应用入口
  App.vue                 页头、页脚和路由出口
  router/index.ts         路由；工具页来自登记表
  tools/registry.ts       工具登记表（首页卡片 + 路由）
  tools/merge-pdf/        合并 PDF 页面与合并函数
  components/             站点头部、工具卡片
  views/                  首页、404
  styles/global.css       全局样式
scripts/check-merge.ts    用 pdf-lib 生成样本并检查合并顺序
```

## 如何新增工具

1. 在 `src/tools/<工具 id>/` 新建页面组件。需要处理文件时，把纯函数和页面分开。
2. 在 `src/tools/registry.ts` 的 `tools` 数组追加一项：
   - `status: 'ready'`
   - `path`，例如 `/tools/split-pdf`
   - `load: () => import('@/tools/split-pdf/SplitPdfView.vue')`
3. 首页卡片和路由都会从这份登记表生成，不用再改路由表。
4. 如果工具还没做完，可以先登记 `status: 'soon'`，并且先不填 `path`。首页会显示「即将推出」，不会放进路由。

## 合并 PDF 怎么用

1. 打开首页，进入「合并 PDF」。
2. 把多份 PDF 拖进区域，或点击选择。可以一次选多个。
3. 拖动左侧把手，或用「上移 / 下移」调整顺序。排在上面的文件会先进入结果。
4. 不需要的文件点「移除」。
5. 点「合并并下载」。处理过程在当前浏览器里完成。
6. 若没有自动下载，用结果区的「再次下载」。

不是 PDF、空文件、没有页面、已加密或已损坏的文件会给出中文提示，并且不会被悄悄合并进去。
