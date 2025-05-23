// server entry point 
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const app = express();
const port = 3000;
const Room = require('./game/Room'); // 导入 Room 类
const rooms = {}; // 存储所有房间的对象
const socketManager = require('./socket/socketManager'); // 导入 socket 注册函数
// 内置中间件：自动解析 JSON 请求体
app.use(express.json());

// 创建 HTTP 和 WebSocket 服务器
const server = http.createServer(app);
const io = new Server(server);



// 静态文件服务
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/JS', express.static(path.join(__dirname, 'JS')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// 路由处理
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// WebSocket 连接处理
socketManager(io); // 注册 socket 事件处理函数

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
