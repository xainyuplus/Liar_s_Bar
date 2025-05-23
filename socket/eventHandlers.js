// Event handlers 


module.exports = function(io) {
    // 处理创建房间请求
    socket.on('create_room', (hostId) => {
    const roomId = Math.random().toString(36).substr(2, 9); // 生成随机房间ID
    rooms[roomId] = new Room(roomId, hostId); // 创建房间实例
    socket.join(roomId); // 将用户加入房间
    io.to(roomId).emit('room_created', roomId); // 通知所有用户房间已创建  
    console.log(`Room ${roomId} created by host ${hostId}`); // 打印房间创建信息
   })
}


  