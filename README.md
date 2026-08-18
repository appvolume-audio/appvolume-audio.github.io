# AppVolume Website

AppVolume 的响应式产品官网。站点使用原生 HTML、CSS 和 JavaScript，不依赖额外构建工具，也不会影响现有 Xcode 工程。

## 本地预览

在项目根目录运行：

```bash
python3 -m http.server 4173 --directory Website
```

然后访问 `http://127.0.0.1:4173/`。

更新日志模块可通过 `http://127.0.0.1:4173/changelog/` 直接访问；部署到 GitHub Pages 后对应 `https://appvolume-audio.github.io/changelog/`。

## 内容边界

- 页面依据当前 SwiftUI、CoreAudio、StoreKit 与本地化实现编写。
- 当前发布基线为 AppVolume 1.0.0，发布日期为 2026-08-14。
- 页头和底部下载按钮均指向正式 Mac App Store 商品页：<https://apps.apple.com/app/appvolume/id6800678477>。
- 免费版可控制最多两个活跃 App 的独立音量与静音；应用级输出路由和不限 App 控制属于一次性买断的 AppVolume Pro。
- 更新日志同时展示已发布版本和公开规划。规划项不代表具体交付版本或日期承诺。

## 国际化

- 首次访问按浏览器首选语言列表匹配；中文环境显示简体中文，其他环境默认英文。
- 右上角可选择“自动（系统）”“简体中文”或“English”，手动选择会保存在浏览器中。
- 文案集中在 `i18n.js`，新增语言时补充消息表和语言选项即可。
