// Socket connection manager 
const eventHandlers = require('./eventHandlers'); // 导入事件处理函数

module.exports =function(io){
     io.on('connection', socket => {
    console.log('New socket connected:', socket.id);
    eventHandlers(socket); // 把具体的事件监听分发出去
  });

}