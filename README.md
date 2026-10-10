# 毛孩营业中 · Paw Life Club
真实宠物 × 轻量模拟人生 × 宠物口吻记录。

最终目标为 iOS / Android App。当前版本 v0.1 使用 Expo + React Native + TypeScript，共享 Web 和移动端代码，优先提供 Web 核心流程体验。

## 文档
从 [开发文档导航](docs/00-开发文档导航.md) 阅读。实际实现、验证证据和后续阶段详见 [交付状态](docs/08-交付状态.md)。用户原始构想保存在 docs/reference，其中旧版平台建议与背景引用以当前 PRD 和架构决策为实施依据。

## 已实现的体验
创建与编辑宠物 → 文字/照片记录 → 四种模板表达 → 编辑 → 私密保存或本机毛圈 → 经验/身份卡 → 个人喵闻。
还支持日记详情、删除并回滚经验、草稿、本机持久化、Web SVG 新闻卡、JSON 数据备份与清空确认。

本机毛圈只展示本人主动发布的选中表达。真实账号、好友动态、点赞、评论、审核、云同步和服务端 AI 处于后续阶段。

## 开发启动
环境：Node.js LTS（SDK 57 要求至少 22.13.x），当前验证环境 Node 24.21.0、npm 11.19.0。

```bash
npm ci
npm run web
```
打开终端打印的本地地址。首次进入创建自己的宠物，或选择“先看看橘总的示例生活”。浏览器和设备各自保存本机数据。

进入移动开发：

```bash
npm start
```
按 Expo CLI 提示使用与 SDK 57 兼容的 Expo Go / development build。真机访问本地服务需要电脑与手机网络可达。开发构建、签名和内测安排在 M2，应用标识和开发者账号需先配置。

若启动失败，先检查 Node 版本、依赖安装结果和端口占用；可使用 `npx expo start --clear` 重建开发缓存。

## 检查与打包
```bash
npm run typecheck
npm run lint
npm test
npx expo-doctor
npm run build
npx expo export --platform ios --platform android --output-dir native-export
```
Web 静态产物在 dist。native-export 包含移动端 JS/Hermes 资源，设备安装包需要后续 EAS build 与签名。
依赖安装按 AGENTS.md 使用 `npx expo install <package>`，保留 package-lock.json。

## 结构
src/app 为 Expo Router 页面；src/screens 为界面；src/domain 为事件、模板和成长规则；src/data 为存储；src/platform 为照片和分享适配；tests 为规则测试。

## 数据与来源
当前记录保存在 AsyncStorage，Web 使用浏览器本机存储。图片压缩为 JPEG 后以 data URI 保存。原型数据体量受设备容量限制；备份导入和对象存储迁移在后续实现。
示例猫照片来源：[Unsplash](https://images.unsplash.com/photo-1573865526739-10659fec78a5)。示例账号和故事均用于演示。

Expo 官方文档：[创建工程](https://docs.expo.dev/get-started/create-a-project/)、[Web](https://docs.expo.dev/workflow/web/)、[SDK 57](https://docs.expo.dev/versions/v57.0.0/)。
