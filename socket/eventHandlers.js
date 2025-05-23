// Event handlers 
const Room = require('../game/Room'); // 导入 Room 类
module.exports = function(socket, io, rooms) {
    // 处理创建房间请求
    socket.on('create_room', (hostId) => {
    const roomId = Math.random().toString(36).substring(2, 8); // 生成随机房间ID
    rooms.set(roomId,new Room(roomId, hostId)); // 创建房间实例
    socket.join(roomId); // 将用户加入房间
    io.to(roomId).emit('room_created', roomId); // 通知所有用户房间已创建  
    console.log(`Room ${roomId} created by host ${hostId}`); // 打印房间创建信息
   })

    // 处理加入房间请求
    socket.on('join_room', ({ roomId, playerInfo }) => {
    const room = rooms.get(roomId);
    if (!room) {
        socket.emit('error', '房间不存在');
        console.log(`Room ${roomId} does not exist`); // 打印房间不存在信息
        return;
    }
    playerInfo.id = socket.id; // 以 socket.id 作为 player 的唯一 id
    room.addPlayer(playerInfo);
    socket.join(roomId);
    io.to(roomId).emit('player_joined', playerInfo); // 通知所有用户有新玩家加入
    socket.emit('room_joined', roomId); // 通知当前用户已加入房间
    console.log(`Player ${playerInfo.name} joined room ${roomId}`); // 打印玩家加入信息
});
}


  