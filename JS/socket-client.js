// socket client 
import { io } from "socket.io-client";
  const socket = io("http://localhost:3000");

document.getElementById("createBtn").addEventListener("click", () => {
  createRoom(2233);
});

  function createRoom(hostId) {
    socket.emit('create_room',hostId); // 发送创建房间请求
  }
  socket.on('room_created', (roomId) => {
    console.log(`Room created with ID: ${roomId}`); // 接收创建成功的消息 
    localStorage.setItem('roomId', roomId); //把房间ID保存到本地存储中
  })



