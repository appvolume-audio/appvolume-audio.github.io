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
- 下载按钮暂时展示真实的开发状态，没有虚构尚未提供的 Mac App Store 链接。
- 发布时只需将“查看发布状态”按钮替换为实际下载或商店地址。

## 国际化

- 首次访问按浏览器首选语言列表匹配；中文环境显示简体中文，其他环境默认英文。
- 右上角可选择“自动（系统）”“简体中文”或“English”，手动选择会保存在浏览器中。
- 文案集中在 `i18n.js`，新增语言时补充消息表和语言选项即可。
