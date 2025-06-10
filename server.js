// server entry point 
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const app = express();
const port = 3000;
const Room = require('./game/Room'); // 导入 Room 类
const rooms = new Map(); // 存储所有房间的对象
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
socketManager(io,rooms); // 注册 socket 事件处理函数



const random_Name = [
  "Luna",
  "Ethan",
  "Aria",
  "Oliver",
  "Scarlett",
  "Leo",
  "Aurora",
  "Mason",
  "Isabella",
  "Caleb",
  "Zoe",
  "Henry",
  "Violet",
  "Jackson",
  "Stella"
];

const random_Avatar = [
  "avatar1.png",
  "avatar2.png",
  "avatar3.png",
  "avatar4.png",
  "avatar5.png",
  "avatar6.png",
  "avatar7.png",
  "avatar8.png",
  "avatar9.png",
  "avatar10.png"
];

//获取随机身份信息（名字，头像，形象数组），返回一个对象
//我觉得这样肯定不行啊，迟早会用完
app.get('/getRandomIdentity', (req, res) => {
  const randomName = random_Name[Math.floor(Math.random() * random_Name.length)];
  const randomAvatar = random_Avatar[Math.floor(Math.random() * random_Avatar.length)];
  random_Name.slice(random_Name.indexOf(randomName), 1); //删除已经被使用的名字
  random_Avatar.slice(random_Avatar.indexOf(randomAvatar), 1); //删除已经被使用的头像
  //玩家形象用五个随机数字（0-10）表示，具体的渲染在前端
  const randomOverLook = [];
  for (let i = 0; i < 5; i++) {
    randomOverLook.push(Math.floor(Math.random() * 4)); //随机生成0-4的数字
  }
  res.json({ name: randomName, avatar: randomAvatar, OverLook: randomOverLook });
})

// 启动服务器
server.listen(port, () => {
  console.log(`Server running at ${port}`);
});
//这里之前写的是app.listen,是不行的，必须server