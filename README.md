# KCTools

在浏览器里使用的本地工具站。合并 PDF、加密与解密、文本对比、图片压缩都在本机完成。不登录，文件也不会上传到服务器。

线上站点：[https://tools.kcshen.cn](https://tools.kcshen.cn)（Cloudflare Pages 项目 `heye-tools`）。

## 技术栈

- Vite
- Vue 3
- TypeScript
- Vue Router
- [pdf-lib](https://pdf-lib.js.org/)（合并 PDF）
- Web Crypto（AES-GCM 加密）
- Canvas（压缩图片）

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

逻辑自检（不启动网页）：

```bash
npm run check:merge
npm run check:cipher
```

构建产物在 `dist/`（这个目录不进入 git）。`public/_redirects` 里的 `/* /index.html 200` 会在 Cloudflare Pages 上把前端路由交回首页入口。

## 工具与路由

| 路径 | 工具 | 怎么试 |
| --- | --- | --- |
| `/` | 工具列表 | 应看到 KCTools，以及下面五个工具卡片 |
| `/tools/merge-pdf` | 合并 PDF | 拖入多份 PDF，调整顺序后点「合并并下载」 |
| `/tools/encrypt` | 加密文件 | 选择任意文件，输入两次相同密码，下载 `.kct` |
| `/tools/decrypt` | 解密文件 | 选择刚下载的 `.kct`，输入同一条密码，得到原文件 |
| `/tools/diff` | 文本对比 | 粘贴或选择两段文本，查看并排和统一差异 |
| `/tools/compress-image` | 压缩图片 | 选择 JPEG、PNG 或 WebP，调整质量和最长边后下载 |

密码错误、不是 KCTools 加密文件、非 PDF、空文件、非图片都会给出中文提示。

## 项目结构

```text
src/
  main.ts                         应用入口
  App.vue                         页头、页脚和路由出口
  router/index.ts                 路由；工具页来自登记表
  tools/registry.ts               工具登记表（首页卡片 + 路由）
  tools/merge-pdf/                合并 PDF
  tools/crypto/                   加密与解密
  tools/diff-text/                文本对比
  tools/compress-image/           压缩图片
  components/                     站点头部、工具卡片、工具页外壳
  views/                          首页、404
  styles/global.css               全局样式
public/_redirects                 Pages 的 SPA 回退
scripts/check-merge.ts            检查 PDF 合并顺序
scripts/check-cipher.ts           检查加密往返和文本对比
```

## 如何新增工具

1. 在 `src/tools/<工具 id>/` 新建页面组件。需要处理文件时，把纯函数和页面分开。
2. 在 `src/tools/registry.ts` 的 `tools` 数组追加一项：
   - `status: 'ready'`
   - `path`，例如 `/tools/split-pdf`
   - `load: () => import('@/tools/split-pdf/SplitPdfView.vue')`
3. 首页卡片和路由都会从这份登记表生成，不用再改路由表。
4. 如果工具还没做完，可以先登记 `status: 'soon'`，并且先不填 `path`。首页会显示「即将推出」，不会放进路由。
