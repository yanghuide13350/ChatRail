# ChatRail

**ChatRail · AI 对话导航侧栏**

ChatRail 会在主流 AI 聊天站点右侧注入一条“对话导航轨”，自动提取用户消息摘要，支持一键跳转与当前定位，帮助你在长对话中快速回到关键节点。

## 主要特性

- 右侧悬浮导航轨，不遮挡对话内容
- 自动识别用户消息并生成摘要列表
- 高亮当前会话位置，点击快速跳转
- Shadow DOM 隔离样式，兼容各站点布局

## 支持平台

- ChatGPT
- Claude
- Gemini
- DeepSeek
- 豆包 (Doubao)
- Grok
- 元宝 (Yuanbao)

## 安装与使用（加载扩展）

1. 克隆或下载本仓库
2. 打开 Chrome/Edge 扩展页面（`chrome://extensions` / `edge://extensions`）
3. 打开“开发者模式”
4. 点击“加载已解压的扩展程序”，选择项目根目录
5. 访问任一支持的平台，右侧导航条会自动出现

## 结构说明

- `index.js`：扩展内容脚本（实际注入）
- `constants.ts`：平台选择器配置（TS/React 版本）
- `manifest.json`：Chrome 扩展清单
- `App.tsx` / `components`：导航 UI 组件
