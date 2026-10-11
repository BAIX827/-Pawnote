# 爪记 · Pawnote
（原名：宠物营业中 / Paw Life Club）
真实宠物 × 轻量模拟人生 × 宠物口吻记录。

最终目标为 iOS / Android App。当前版本 v0.1 使用 Expo + React Native + TypeScript，共享 Web 和移动端代码，首发面向中国大陆，iPhone 优先，随后 Android；Web 用于核心流程预览。

## 文档
从 [开发文档导航](docs/00-开发文档导航.md) 阅读。实际实现、验证证据和后续阶段详见 [交付状态](docs/08-交付状态.md)。用户原始构想保存在 docs/reference，其中旧版平台建议与背景引用以当前 PRD 和架构决策为实施依据。

## 已实现的体验
创建与编辑多物种宠物（含兔子、蜥蜴和自定义类型） → 性格标签/行为问卷/主人描述 → 猫狗按年龄推荐或手选人生路线 → 文字/照片记录 → 四种模板表达 → 编辑 → 私密保存或本机毛圈 → 经验/身份卡 → 个人喵闻。
还支持日记详情、删除并回滚经验、草稿、本机持久化、Web SVG 新闻卡、JSON 文件备份与确认恢复、移动拍照入口、PNG 新闻卡系统分享及清空确认。

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
npm run start:go
```
用与 SDK 57 兼容的 Expo Go 扫描终端二维码，当前全部业务模块已在 iOS Expo Go 验证。需要测试独立安装包时使用 development build。真机访问本地服务需要电脑与手机网络可达。本机模拟器可运行 `npm run ios:simulator`；本机真机可运行 `npm run ios:device`，签名由本人 Apple 账号的 Personal Team 或开发者会员配置。详细步骤见 docs/09-iPhone开发与真机验收.md。

若启动失败，先检查 Node 版本、依赖安装结果和端口占用；可使用 `npx expo start --clear` 重建开发缓存。

## Mac 本地版

运行 `npm run install:mac`，安装到 `~/Applications/爪记.app`。内置界面和本机记录，可从 Finder 或 Spotlight 打开；更新前先退出应用。Mac 文件选择与导出已接入，详细步骤见 [Mac 安装与使用](docs/14-Mac安装与使用.md)。

## AI 生成网关
App 默认只用本机规则生成。要启用“让 AI 来说”，需要运行 server/ 里的网关并让 App 指向它：

```bash
cp server/.env.example server/.env   # 填入 CN_API_KEY（DeepSeek），海外服务商可选
node server/index.mjs
```
然后在项目根目录的 .env.local 写入 `EXPO_PUBLIC_API_URL=http://<网关地址>:8787`（海外包另加 `EXPO_PUBLIC_REGION=intl`），重启 `npm run web` 或开发服务。本地联调可用 `AI_MOCK=1 node server/index.mjs`，返回带“模拟 AI”字样的固定文本，不调用任何服务商。
非会员每设备每周 2 次免费 AI，规则与接口见 docs/01 第 8 节、docs/03 ADR-004、docs/04。

## 检查与打包
```bash
npm run typecheck
npm run lint
npm test
npx expo-doctor
npm run build
npx expo export --platform ios --platform android --output-dir native-export
```
Web 静态产物在 dist。native-export 包含移动端 JS/Hermes 资源，设备安装包由本机 Xcode 或 EAS 构建，真机需 Apple 签名；模拟器包只能运行于模拟器。
依赖安装按 AGENTS.md 使用 `npx expo install <package>`，保留 package-lock.json。

## 结构
src/app 为 Expo Router 页面；src/screens 为界面；src/domain 为事件、模板和成长规则；src/data 为存储；src/platform 为照片和分享适配；tests 为规则测试。

## 数据与来源
当前记录保存在 AsyncStorage，Web 使用浏览器本机存储。图片压缩为 JPEG 后以 data URI 保存。原型数据体量受设备容量限制；支持 20 MB 以内 JSON 备份恢复，预览并确认后替换本机数据。对象存储迁移处于后续阶段。
示例猫照片来源：[Unsplash](https://images.unsplash.com/photo-1573865526739-10659fec78a5)。示例账号和故事均用于演示。

Expo 官方文档：[创建工程](https://docs.expo.dev/get-started/create-a-project/)、[Web](https://docs.expo.dev/workflow/web/)、[SDK 57](https://docs.expo.dev/versions/v57.0.0/)。
