# 数据模型与 API 合约
版本：0.1 · 2026-10-10 · 云端设计草案

## 领域实体
User：id、认证身份、createdAt、settings、deletionRequestedAt。
Pet：id、ownerId、name、species(cat/dog)、avatarAssetId、personality、route(campus/work)、role、createdAt。
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
宠物历史快照含 name/species/personality/route/role，旧记录保留创建时身份。

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
导出 JSON 含照片和全部记录；恢复备份需要 schema 校验及显式覆盖确认（后续实现）。

