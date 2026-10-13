# Mac 安装与使用

版本：0.1.0 · 2026-10-11。

Mac 本地版复用 Expo Web 界面，以 macOS AppKit + WKWebView 承载，页面随应用打包。应用图标统一使用 `assets/pawnote-icon-outline.png`：白底黑色爪印线条、日记横线和纸页折角。其他候选和模板图标已清理。

## 打开

安装位置：`~/Applications/爪记.app`。在 Finder 的个人“应用程序”文件夹双击爪记，或用 Spotlight 搜索“爪记”。首次进入可创建宠物或体验橘总的生活。

本机记录由此应用独立保存。现有浏览器里的记录可先导出 JSON 备份，再在 Mac App 的“设置 → 恢复备份”导入。

页面、记录、本机规则生成可离线使用。AI 生成仍需要配置并运行网关。选择照片和恢复备份使用 Mac 文件选择面板；导出日记卡和 JSON 备份使用 Mac 保存面板。爪报可保存 PNG 图片，也可直接打开 Mac 系统分享菜单；选择分享对象由本人操作。爪格和爪信卡继续使用各自原有的导出入口。

菜单快捷键：⌘Q 退出，⌘R 重新载入，⌘1 返回首页，⌘[ 后退，⌘] 前进。窗口大小会被记住，关窗后可点 Dock 图标重新显示。

## 更新与构建

需要 macOS 13+、Node 和 Xcode 命令行工具；产物对应运行构建的电脑架构。当前为 Apple Silicon。

```bash
npm run build:mac
npm run install:mac
```

更新前先退出爪记。安装脚本只替换应用程序，本机记录保留。普通启动只使用 macOS 系统框架和内置页面。

构建程序放在 `~/Library/Caches/com.baricy.pawnote/build/爪记.app`，安装到 `~/Applications/爪记.app`。可安装压缩包位于 `artifacts/macos/爪记-Mac.zip`。签名为本机 ad-hoc；公开分发的 Developer ID 签名与公证留待发布阶段处理。

项目位于 iCloud 文件夹，因此签名操作放在本机缓存目录，避免文件同步附带的属性影响签名。

## 检查

```bash
npm run lint
npm run typecheck
"$HOME/Applications/爪记.app/Contents/MacOS/Pawnote" --smoke-test
```

运行检查使用独立的临时 WebKit 数据空间，覆盖页面加载、示例宠物、日记保存、本机存储、子路由、缺失资源、路径限制与原生备份下载。测试数据在进程退出后丢弃。

如果窗口报“本机页面服务启动失败”，先退出其他爪记进程再重试；应用固定使用 `127.0.0.1:47831`。固定地址让更新和重启后的本机记录保持在同一存储空间。测试专用端口为 47832。

实现依据：[Expo Web 导出](https://docs.expo.dev/guides/publishing-websites/)、[Apple WKWebView](https://developer.apple.com/documentation/webkit/wkwebview)、[Apple NWListener](https://developer.apple.com/documentation/network/nwlistener)。
