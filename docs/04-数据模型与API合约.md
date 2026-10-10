# 数据模型与 API 合约
版本：0.1 · 2026-10-10 · 云端设计草案

## 领域实体
User：id、认证身份、createdAt、settings、deletionRequestedAt。
Pet：id、ownerId、name、species(cat/dog/rabbit/lizard/hamster/guineaPig/bird/turtle/snake/fish/other)、speciesName?、ageMonths?、ageRecordedAt?、avatarAssetId、personality、personalitySource?、questionnaire?、route(campus/work)、routeSource?、role、createdAt。
LifeEvent：id、petId、ownerId、description、category、photoAssetId、occurredAt、createdAt、petSnapshot、visibility、deletedAt。
Story：id、eventId、style(diary/life/social/news)、text、title、generator(template/ai/user)、version、createdAt、editedAt。
Post：id、eventId、storyId、authorPetId、visibility(friends)、moderationState、createdAt。
Friendship：id、requesterUserId、recipientUserId、status(pending/accepted/blocked)。
Reaction：postId、actorPetId、type(like)；复合键防重复。
Comment：id、postId、authorPetId、text、moderationState、createdAt、deletedAt。
XPTransaction：eventId、petId、delta(+20)、createdAt；eventId 唯一。
Report：id、reporterUserId、targetType、targetId、reason、status、handledAt。
Asset：id、ownerId、objectKey、mimeType、byteSize、moderationState、createdAt。

v0.1 用包含 Pet、LifeEvent、四种故事、本机发布标志的 JSON 状态；持久化有 schemaVersion。ownerId、好友和审核字段在联机阶段启用。

## 关系与一致性
Pet 1:N LifeEvent；LifeEvent 1:N Story；LifeEvent 0:1 Post（首版只允许一条动态）。
成长 = 未删除事件数 ×20；等级 = floor(XP/100)+1。
保存事件和 XP 应作为同一事务处理；客户端提供 eventId / idempotency key。
删除事件同时撤回 Post、删除相关衍生 Story/新闻并移除 XP；云端图片对象通过后台任务清理。
宠物历史快照含 name/species/speciesName/ageMonths/ageRecordedAt/personality/personalitySource/questionnaire/route/routeSource/role，旧记录保留创建时身份。

## API v1（待实现）
所有接口 HTTPS，Bearer session；ownerId 由服务端会话决定。
- GET /v1/me；DELETE /v1/me：当前账号与删除请求。
- POST /v1/pets；PATCH /v1/pets/:id：创建和修改宠物。
- POST /v1/assets/upload-url：返回限时上传地址；上传完成经审核后可用。
- POST /v1/story-drafts：{petId,description,category,style} → {text,title,generator,promptVersion}。
- POST /v1/events：{id,petId,description,category,assetId?,occurredAt,selectedStyle,stories} → {event,xp,level}。
- GET /v1/pets/:id/events?cursor=…：本人私密日记分页。
- DELETE /v1/events/:id：撤回事件及衍生内容，幂等。
- POST /v1/posts：{eventId,storyId,visibility:"friends"} → pending/approved 状态。
- GET /v1/feed?cursor=…：仅已审核且当前用户有权查看的动态。
- PUT /v1/posts/:id/like；DELETE /v1/posts/:id/like。
- POST /v1/posts/:id/comments：主人主动提交文本；DELETE /v1/comments/:id。
- POST /v1/friend-invitations；POST /v1/friend-invitations/:token/accept。
- POST /v1/reports；PUT /v1/users/:id/block。

错误体：{code,message,requestId,retryable}。400 输入、401 登录、403 无权访问、404 无资源、409 冲突、413 图片过大、429 限流、503 生成不可用。
正式版需要端点输入 schema、数据库迁移和端到端鉴权测试。本文件提供边界，当前静态原型不运行这些端点。

## 原型存储限制
使用 AsyncStorage，Web 落到浏览器本机存储；压缩图片以 data URI 保存。设备清理、浏览器清理或换设备会影响可见数据。
只适合小规模原型；联机阶段将图片迁移到对象存储，客户端只保留缓存和离线队列。
导出 JSON 含照片和全部记录；恢复备份已实现 schema 校验及显式覆盖确认（上限 20 MB）。


## 可选档案扩展兼容（2026-10-11）
本地 schemaVersion 继续为 1。新增字段为可选，旧猫狗档案与历史快照可以直接读取；旧人格字符串也保持有效。新客户端生成的扩展备份应使用同版本或更新的客户端恢复。
- personality：1–60 字主人描述，标签和问卷总结也存为该字符串。
- personalitySource：tag/custom/questionnaire；问卷来源需 questionnaire={version:1,answers:number[5]}。0–2 为题目选项，3 为不确定；至少 3 题为明确观察。
- ageMonths：0–1200 的整数；ageRecordedAt：填报时间 UTC。年龄为录入时年龄快照，后续版本若改为生日或动态年龄需要明确迁移规则。
- routeSource：age/manual。age 模式限定猫狗且年龄必填，route 与 12 个月阈值一致；manual 模式可选任意路线。
- speciesName：other 类型必填 1–20 字。物种枚举之外的备份输入被拒绝。
新字段进入事件 petSnapshot 和 JSON 备份。生成签名加入 speciesName 和 ageMonths，变更档案仍需重新生成草稿。


## AI 网关接口（2026-10-11，已实现于 server/）
独立于上文 API v1 草案，当前无会话鉴权，以 deviceId 区分设备。
- GET /v1/quota?deviceId=… → {quota}。
- POST /v1/pet-voice：{deviceId, region:"cn"|"intl", description(1–500), pet:{name, species, speciesName?, personality, route, role, owner, self}} → {stories, quota}。stories 为 diary/life/social/news 四项，每项 {title,text,generator:"ai",edited:false}；news 正文由网关追加虚构娱乐报道标识。
- quota：{member:boolean, used:number, limit:number|null, remaining:number|null, resetsAt:ISO 时间}。会员的 limit 与 remaining 为 null。
- 错误：400 {error:"bad_request",field}；409 {error:"busy"} 同一设备已有请求在进行；429 {error:"quota_exhausted",quota}；502 {error:"generation_failed"} 服务商失败或返回内容不合格，不扣次数；503 {error:"not_configured"}。

## 本地数据扩展（2026-10-11）
schemaVersion 仍为 1，新增内容向后兼容：
- Pet.ownerTitle?：1–10 字，宠物对主人的称呼；进入快照、备份与生成签名。
- Story.generator：新增取值 "ai"，原有 "template" 表示本机规则生成。
- 设备标识单独保存在本机存储键 pawlife.deviceId，不进入备份。
