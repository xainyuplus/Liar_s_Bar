// server entry point 
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const app = express();
const port = 3000;

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



// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
