# iPhone 开发与真机验收
2026-10-11 · iPhone 优先，随后 Android。用户设备 iPhone 17 Pro，系统自述“最新版本”，实际版本在连接手机时记录。

## 当前路径
用户当前没有 Apple Developer 付费会员，先完成本机开发与模拟器验证，再进行个人手机测试。
- Expo SDK 57、expo-dev-client 与本机 Xcode 工程生成流程已准备。
- 开发标识暂用 `com.baricy.pawlife.dev`；正式商店标识在发布前确认。
- 原生目录由 `expo prebuild` / `expo run:ios` 自动生成并忽略提交，配置放在 app.json。
- iPhone 首发，iPad 原生适配暂缓。
- SDK 57 的 iOS 基线为 16.4+。
- 已接入拍照、图库、完整新闻卡 PNG 系统分享、JSON 文件备份与确认恢复；真机权限与相机结果待验收。

## 立即在 iPhone 试用：Expo Go
1. 在 iPhone 安装官方 Expo Go，确认其支持 SDK 57。
2. 电脑与手机连接同一 Wi-Fi；在项目目录执行 `npm run start:go`。
3. 用 iPhone 相机扫描终端二维码，打开 Expo Go。保持电脑和开发服务运行。
4. 若连接失败，检查手机与电脑网络互通、VPN 与防火墙；二维码地址应指向电脑局域网地址。
5. 建立自己的宠物，写一条日常，保存后导出备份。当前数据保存在该设备，网页数据可通过 JSON 备份迁移。

Expo Go 是当前快速测试入口。独立 App 的图标、签名、完整冷启动与权限文案仍要使用项目自己的原生构建验收。开发客户端启动用 `npm run start:ios-dev`。

## 本机模拟器
1. 确认 Xcode 已初始化并安装一个 iOS Simulator runtime。
2. 在项目目录执行 `npm ci`，随后 `npm run ios:simulator`。
3. Expo 自动生成 iOS 工程、安装 Pods、编译并启动模拟器应用。
4. Release 构建内嵌业务代码，可在关闭 Metro 后继续测试冷启动与本机保存。
5. 创建宠物、写日常、保存，检查界面、键盘、安全区域、恢复与分享面板。

首次编译需下载原生依赖。模拟器产物用于模拟器运行，真机安装需要单独的设备构建与签名。

本轮原生构建在 React Native 预编译归档下载阶段持续缓慢，已停止该次构建。当前模拟器验收改用官方 Expo Go SDK 57。测试环境为 Xcode 27.0 / iOS 27.0 模拟器；验收日志见 [11-移动端阶段验收](11-移动端阶段验收.md)。

Expo Go 模拟器替代入口：先执行 `REACT_NATIVE_PACKAGER_HOSTNAME=localhost npx expo start --go --lan --port 8081`，在已安装的 SDK 57 Expo Go 中输入 `exp://localhost:8081`。此 localhost 命令只用于模拟器；手机使用上方 `start:go` 命令。

## 本机 iPhone：免费个人账号优先
1. 连接 iPhone，按设备提示信任电脑；在 Xcode 登录自己的 Apple Account。
2. 用 `npm run ios:device` 选择手机并尝试自动签名。
3. 若提示团队缺失，打开自动生成的 ios 工作区，在 Signing & Capabilities 中选择自己的 Personal Team，并启用自动签名。
4. 按系统提示开启 Developer Mode；重新构建安装到 iPhone 17 Pro。
5. 记录手机实际 iOS 版本、构建日期与测试结果。个人签名通常 7 天到期，需要重新构建安装。

账号、证书与配置描述文件交给 Xcode/系统管理。当前不创建账号或购买会员。

## xtool 备选安装
用户提出使用 xtool。官方仓库列出 `xtool install` 安装 IPA，`xtool dev` 构建 SwiftPM 应用。当前工程为 Expo/React Native，保留 Expo/Xcode 构建路线；xtool 对本项目 IPA 的签名与安装兼容性需要实测，获得设备构建后按 `xtool help install` 的实际参数操作。当前尚未生成可安装的真机 IPA。

## 后续 EAS 与发布
付费开发者会员与 Expo 项目准备后，再执行 `npx eas-cli@latest login`、`build:configure`、`device:create`，用 `npm run build:ios:development` 生成真机开发包。现有 eas.json 保留 development、development-simulator、preview、production profiles。

## 第一轮设备任务
- 冷启动 → 创建宠物 → 保存 → 退出重启，档案与草稿保留。
- 输入 500 字日常与 2000 字故事，弹出/收起键盘，编辑器和按钮可访问。
- 图库选择、取消、更换、移除；25 MB 输入限制、JPEG 压缩与失败提示。
- 相机允许、拒绝、再次进入、拍照取消；iPhone 高分辨率照片正常保存。
- 四种表达切换和编辑保留，修改原始描述后重新生成。
- 私密保存和主动发布本机动态；每个事件只加一次经验。
- 删除取消、确认后经验回滚。
- 新闻卡 PNG 包含完整正文、图片与虚构标识；分享取消和保存到文件结果。
- JSON 导出实际文件；导入有效/损坏/大于 20 MB 备份；预览取消、替换确认、重启后保留；恢复写入失败保留原记录。
- Dynamic Island / 底部 Home indicator 安全区域。

## 失败时检查
- Pods 下载失败：记录失败 URL 和错误，检查网络及 CocoaPods；保留源码后重试。
- 无法签名：确认 Personal Team、Bundle ID、手机信任状态；个人签名到期后重建。
- native module missing：依赖变化后重新生成和构建原生应用。
- 新闻按钮不可用：等待照片加载完成；加载失败时检查原始记录。
- 导入失败：确认 JSON 由本应用导出、版本为 1、文件大小不超过 20 MB，检查设备空间。

## 官方来源
[Expo Go](https://docs.expo.dev/get-started/start-developing/) · [SDK 57 基线](https://docs.expo.dev/versions/v57.0.0/) · [Expo 本机构建](https://docs.expo.dev/guides/local-app-development/) · [Apple Personal Team](https://developer.apple.com/help/account/basics/about-your-developer-account) · [xtool 官方仓库](https://github.com/xtool-org/xtool) · [EAS 配置](https://docs.expo.dev/build/eas-json/) · [Developer Mode](https://docs.expo.dev/guides/ios-developer-mode/)


## 2026-10-12 iOS 27 / Xcode 27 启动闪退与场景生命周期
- 现象：用 Xcode 27 构建的开发包在 iOS 27 模拟器上一启动就退出，崩溃栈停在 UIKit 的 `_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`。
- 原因：iOS 27 SDK 要求 App 采用 UIScene 生命周期。Expo SDK 57 的工程模板仍在 AppDelegate 里创建窗口，Info.plist 没有场景清单，于是系统在启动时直接终止。与业务代码无关。
- 处理（Expo 官方 expo/fyi 的 ios-scene-lifecycle 指引）：expo 保持在 57.0.23 以上；安装 expo-build-properties 并在 app.json 的插件里设置 `ios.enableSceneSupport: true`；执行 `npx expo prebuild --clean` 重新生成 ios/，再重新构建。ios/ 是生成目录，不手改。
- 这是 SDK 57 上的过渡开关；升级到 SDK 58 后默认采用场景生命周期，届时移除该设置。
- EAS 云构建同样受影响：用带 Xcode 27 的镜像构建时必须带上这个设置。
