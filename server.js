// server entry point 
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// 内置中间件：自动解析 JSON 请求体
app.use(express.json());

// 静态文件服务
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/JS', express.static(path.join(__dirname, 'JS')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// 路由处理
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/hello', (req, res) => {
  const name = req.query.name;
  res.send(`Hello, ${name + 'Guest'}!`);
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
