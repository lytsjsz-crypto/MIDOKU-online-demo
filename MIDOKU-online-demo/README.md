# MIDOKU 双人联网 Demo

## 本地运行
1. 安装 Node.js
2. `npm install`
3. `npm start`
4. 浏览器打开 `http://localhost:3000`

两台设备使用同一个房间码，分别选择玩家1和玩家2。

## 当前原型
- 10章连续剧情
- 双人实时同步
- 两名玩家看到不同私人信息和不同选项
- 每人3次改变机会，改变不扣分
- 系统从中盘开始提供矛盾/虚假信息
- 强制面对面交流阶段
- 最终选择共同推进剧情

## 重要部署说明
当前同步状态保存在 Node 服务器内存中，适合本地/单实例原型测试。
Vercel Serverless 不保证 Socket.IO 长连接和内存房间状态，因此若部署到 Vercel，
正式联网版应改用 Supabase/Firebase/Ably 等实时后端，或部署到支持常驻 Node WebSocket 的服务。
