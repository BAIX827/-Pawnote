# Paw Note

主人记下真实日常，用宠物的口吻发动态，让不同家庭的小动物先在线上交朋友。**新接手先读[《我想做的宠物交友 App》](docs/20-宠物交友产品交接.md)。**

当前首页打开一只宠物的公开日常。主人可以看它的其他故事，也可以为自家某一只宠物设置更常遇见它的偏好。开启自主互动的宠物会在新的公开日常下相遇，双方看到同一次来往。首页、日记和发布预览共用 Expo / React Native 代码。

## 文档
从 [开发文档导航](docs/00-开发文档导航.md) 阅读。实际实现、验证证据和后续阶段详见 [交付状态](docs/08-交付状态.md)。用户原始构想保存在 docs/reference，其中旧版平台建议与背景引用以当前 PRD 和架构决策为实施依据。

## 已实现的体验
创建宠物档案，写下真实发生的小事，私密保存。愿意公开时，从日记详情选择 **Share to community**，确认宠物口吻、照片和要提及的宠物。**Friends** 可以回看宠物来往、收藏的档案，用好友码找到现实里认识的主人。主人各自同意后才开放真人消息。
还支持日记详情、删除并回滚经验、草稿、本机持久化、Web / Mac PNG 新闻卡、JSON 文件备份与确认恢复、移动拍照入口、PNG 新闻卡系统分享及清空确认。

日记支持编辑、修改实际发生日期与补上旧照片。爪册提供原话/生成文字搜索、分类/照片/月筛选和日历补记；宠物主页可回看“那年今天”的照片、日记和声音。成长纪念册按年份挑选内容，导出内嵌照片与音频的离线 HTML，并可通过浏览器打印保存 PDF。档案可填生日，生日与到家纪念日提供照片卡片、宠物口吻信和分享。用法与验收见 [日记检索与成长纪念](docs/19-日记检索与成长纪念.md)。

声音相册从「爪册」和「时光机」进入：直接录音最长 60 秒，或选择 5 分钟 / 100 MB 以内的视频，填写开始秒数与 0.5–60 秒片段时长，提取后试听并保存。每段声音带标题、日期、当时月龄、手选成长阶段和备注，可以分阶段回听、删除，完整声音随 JSON 备份恢复。视频提取保留片段中的全部声音。相关运行与验收说明见 [声音相册](docs/18-声音相册.md)。

本机小镇保留早期虚构居民玩法；Pet Relay 保留旧链接和日记详情入口。联网社区独立存储，旧日记和本机小镇记录继续保存在设备上。

## 开发启动
环境：Node.js LTS（SDK 57 要求至少 22.13.x），当前验证环境 Node 24.21.0、npm 11.19.0。

```bash
npm ci
npm run web
```
打开终端显示的地址。只启动 Expo 时，可以记日记和阅读标明 Sample 的示例。

### 运行联网社区

在一个终端运行 `node server/index.mjs`，然后在另一个 PowerShell 终端从项目根目录启动 Expo：

```powershell
$env:EXPO_PUBLIC_COMMUNITY_URL = 'http://127.0.0.1:8787'
npm run web
```

用两个独立浏览器配置文件可以测试两位主人。手机连接本机服务时，将地址改为手机可访问的电脑局域网地址。Node 默认把社区数据保存在 `server/data/community.sqlite`，可用 `PAWNOTE_SOCIAL_DIR` 指定其他目录。社区服务可以独立于模型密钥运行。

Cloudflare 入口使用 `server/wrangler.jsonc` 中的 `COMMUNITY` SQLite Durable Object。客户端优先读取 `EXPO_PUBLIC_COMMUNITY_URL`，也可以使用已有的 `EXPO_PUBLIC_API_URL`。公共 Web 需要连接含社区接口的新网关。设备社区凭据保存在本机，日记 JSON 备份不含该凭据。

进入移动开发：

```bash
npm run start:go
```
用与 SDK 57 兼容的 Expo Go 扫描终端二维码，基础业务可在 Expo Go 预览。声音相册的视频提取使用本项目的原生模块，需要 development build；录音使用 SDK 57 的 expo-audio。真机访问本地服务需要电脑与手机网络可达。本机模拟器可运行 `npm run ios:simulator`；本机真机可运行 `npm run ios:device`，签名由本人 Apple 账号的 Personal Team 或开发者会员配置。详细步骤见 docs/09-iPhone开发与真机验收.md。

若启动失败，先检查 Node 版本、依赖安装结果和端口占用；可使用 `npx expo start --clear` 重建开发缓存。

## Mac 本地版

运行 `npm run install:mac`，安装到 `~/Applications/爪记.app`。内置界面和本机记录，可从 Finder 或 Spotlight 打开；更新前先退出应用。Mac 文件选择、PNG 导出与系统图片分享已接入，详细步骤见 [Mac 安装与使用](docs/14-Mac安装与使用.md)。

## AI 生成网关
App 默认只用本机规则生成。要启用“让 AI 来说”，需要一个网关替 App 保管模型密钥并计次数。网关的逻辑在 server/core.mjs，有两个入口：

本机（开发调试）：
```bash
cp server/.env.example server/.env   # 填入 CN_API_KEY，海外服务商可选
node server/index.mjs
```
然后在项目根目录的 .env.local 写入 `EXPO_PUBLIC_API_URL=http://<这台电脑的地址>:8787`，重启开发服务。`AI_MOCK=1 node server/index.mjs` 返回固定的模拟文本，不调用任何服务商。

Cloudflare Workers（线上）：
```bash
cd server
npx wrangler login
npx wrangler kv namespace create USAGE     # 把输出的 id 填进 wrangler.jsonc
npx wrangler secret put CN_API_KEY
npx wrangler secret put INTL_API_KEY
npx wrangler deploy
```
部署后把得到的地址设为 GitHub 仓库变量 `PAWNOTE_API_URL`，网页版下次构建就会带上 AI 入口；打包 App 时用环境变量 `EXPO_PUBLIC_API_URL` 和 `EXPO_PUBLIC_REGION`（cn 或 intl）。
密钥只存在于 server/.env（已被 git 忽略）或 Cloudflare 的 secret 里，不要写进 wrangler.jsonc、app.json 或任何 EXPO_PUBLIC_ 变量。
规则与接口见 docs/01 第 8 节、docs/03 ADR-004 与 ADR-006、docs/04。

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
Expo Router 入口在 `src/app`。社区各页面在 `src/screens/community`，共用的请求与类型在 `src/platform/community.ts`。日记和成长规则在 `src/domain`。两个网关入口都调用 `server/community.mjs`，查询、相遇规则、发布与主人权限分别在 `server/community/` 中。

## 数据与来源
当前档案和日记保存在 AsyncStorage，Web 使用浏览器本机存储。图片压缩为 JPEG 后以 data URI 保存。声音在移动端单独保存在应用文档目录，在 Web / Mac 保存在 IndexedDB；导出时将完整声音合并进 JSON，避免声音占用 AsyncStorage 单条读取容量或 localStorage 配额。相册最多 100 段、单段 2 MB、音频编码总量 12 MB，并受总备份 20 MB 限制。原型数据体量受设备容量限制；备份恢复预览并确认后替换本机数据。对象存储迁移处于后续阶段。
示例猫照片来源：[Unsplash](https://images.unsplash.com/photo-1573865526739-10659fec78a5)。示例账号和故事均用于演示。

Expo 官方文档：[创建工程](https://docs.expo.dev/get-started/create-a-project/)、[Web](https://docs.expo.dev/workflow/web/)、[SDK 57](https://docs.expo.dev/versions/v57.0.0/)。
