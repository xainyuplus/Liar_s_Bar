// Event handlers 
const Room = require('../game/Room'); // 导入 Room 类
module.exports = function (socket, io, rooms) {
    // 处理创建房间请求
    socket.on('create_room', (hostId) => {
        const roomId = Math.random().toString(36).substring(2, 8); // 生成随机房间ID
        rooms.set(roomId, new Room(roomId, hostId, io)); // 创建房间实例
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
        if(!playerInfo.isRobot){
        playerInfo.id = socket.id; // 以 socket.id 作为 player 的唯一 id
        }
        else{
         //  playerInfo.id =socket.id+playerInfo.name; 
        }
        
        room.addPlayer(playerInfo);
        socket.join(roomId);
        socket.emit('room_joined', { roomId: roomId, id: playerInfo.id }); // 通知当前用户已加入房间
        io.to(roomId).emit('player_joined', {
            playerInfo: playerInfo,
            playerList: room.playersList
        })
        console.log(`Player ${playerInfo.name} joined room ${roomId}`); // 打印玩家加入信息
        if (playerInfo.isHost) {
            room.hostId = socket.id;
        }
        
    });

    // 处理开始游戏请求
    socket.on('start_game', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', '房间不存在');
            console.log(`Room ${roomId} does not exist`); // 打印房间不存在信息
            return;
        }
        else if (room.hostId !== socket.id) {
            socket.emit('error', '只有房主才能开始游戏');
            console.log(`Only the host can start the game in room ${roomId}`); // 打印只有房主才能开始游戏信息
            return;
        }
        else if (room.playersList.length < 4) {
            socket.emit('error', '需要四个玩家才能开始游戏');
            console.log(`At least two players are required to start the game in room ${roomId}`); // 打印至少需要两个玩家才能开始游戏信息
            return;
        }
        else {
            room.startGame(); // 开始游戏
            io.to(roomId).emit('game_started', roomId); // 通知所有用户游戏已开始
            console.log(`Game started in room ${roomId}`); // 打印游戏开始信息 
        }

    })

    //处理发牌
    socket.on('deal_cards', ({ playerId, roomId }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', '房间不存在');
            console.log(`Room ${roomId} does not exist`); // 打印房间不存在信息
            return;
        }
        else {
            socket.emit('cards_dealt', room.players.get(playerId).hand)
        }


    })

    // 处理玩家出牌请求
    socket.on('play_cards', ({playerId, roomId, cards }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', '房间不存在');
            console.log(`Room ${roomId} does not exist`); // 打印房间不存在信息
            return;
        }
        else {
            room.gameManager.handlePlayCards(playerId,cards); // 处理出牌
            //io.to(roomId).emit('cards_played', { playerId: playerId, cardsNum: cardsInfo.length }); // 通知所有用户出牌
            //我在思考，我有必要把这个信息同步给前端吗？
            //发牌后呢肯定要更新gamestate，主要是牌桌上显示几张牌，然后更新倒计时和当前玩家
            //这个时候，前端就可以根据这个信息来更新UI了，所以我觉得没必要再发一次
           // console.log(`Player ${playerId} played cards ${cards} in room ${roomId}`); // 打印玩家出牌信息 
        }

    })
    // 处理质疑请求
    socket.on('challenge', ({ roomId }) => {

    })
    //处理信任
    socket.on('trust', ({ roomId }) => {

    })
    //进行轮盘赌
    socket.on('spin_roulette', ({ roomId }) => {

    })
    //离开房间
    socket.on('leave_room', ({ roomId }) => {

    })
    // 重新连接
    socket.on('reconnect', ({ roomId }) => {

    })

}


