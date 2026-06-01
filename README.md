# CashFlow

个人消费管理 PWA · 本地优先、零云端依赖

## 快速启动（推荐方式 A：双击）

只想看一眼/正常使用：

1. 解压后进入 `dist/` 文件夹
2. **双击 `start.command`**
3. 浏览器自动打开 `http://localhost:4173`
4. iPhone 与 Mac 同一 WiFi 时，用 iPhone Safari 打开 `http://<Mac的IP>:4173` 即可（脚本启动时会显示 IP）
5. 在 iPhone Safari → 分享 → "添加到主屏幕"，从桌面打开就是全屏 App 效果

> Windows 用户：进入 dist 目录，命令行执行 `python -m http.server 4173`，浏览器打开 `http://localhost:4173`

---

## 方式 B：开发模式（要改代码）

```bash
# 1. 安装依赖（首次）
npm install

# 2. 启动开发服务器
npm run dev

# 3. 修改代码后会自动热更新

# 4. 重新构建生产版本
npm run build
# 产物在 dist/，把它放到任何静态服务器都能跑（GitHub Pages / Vercel / Cloudflare Pages / 自建 nginx）
```

---

## 一键部署到 Vercel（公网访问，免费）

最简单：

1. 把整个项目推到 GitHub
2. 打开 https://vercel.com → 用 GitHub 登录 → Import 这个仓库 → 点 Deploy（不用改任何配置）
3. 30 秒后拿到一个 `https://cashflow-xxx.vercel.app` 域名，全球访问

Cloudflare Pages 同理。

---

## 数据说明

- 所有数据存储于浏览器 IndexedDB，**不会上传任何服务器**
- 不同浏览器/设备数据不互通
- 备份：进入 App → 设置 → 「导出备份」会下载一个 JSON
- 恢复：进入 App → 设置 → 「从备份恢复」选 JSON 文件
- 建议把 JSON 存到 iCloud Drive / 网盘，定期备份

---

## 项目结构

```
cashflow/
├── dist/                  # 构建产物（可直接部署）
│   ├── start.command      # 一键启动脚本（Mac）
│   ├── index.html
│   ├── assets/
│   └── ...
├── src/
│   ├── main.tsx           # 入口
│   ├── App.tsx            # 路由
│   ├── store.ts           # 全局状态管理（轻量自实现）
│   ├── db.ts              # IndexedDB 封装
│   ├── types.ts           # 类型定义
│   ├── utils.ts           # 工具函数
│   ├── components/
│   │   └── TabBar.tsx     # 底部 Tab
│   └── pages/
│       ├── Home.tsx       # 首页（预算+最近记录）
│       ├── AddTx.tsx      # 快速记账
│       ├── TxList.tsx     # 流水列表
│       ├── Budget.tsx     # 预算管理
│       ├── CategoryManager.tsx  # 分类管理
│       └── Settings.tsx   # 设置（备份/恢复）
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 技术栈

- React 18 + TypeScript
- Vite 5（构建）
- Tailwind 3（样式）
- idb（IndexedDB 封装）
- react-router-dom（HashRouter，方便部署到任何静态路径）
- vite-plugin-pwa（Service Worker + manifest）

构建产物 gzip 后约 **63KB**。
