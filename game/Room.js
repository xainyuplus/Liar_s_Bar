// Room management 
class Room {
  constructor(id, hostId) {
    this.id = id;                // 房间ID
    this.hostId = hostId;        // 房主ID
    this.players = [];           // 玩家列表
    this.gameState = null;       // 游戏状态
    this.deck = null;            // 牌堆
    this.phase = 'WAITING';      // 房间阶段：WAITING, PLAYING, ENDED
    this.spectators = [];        // 观众（非玩家）
    this.settings = {            // 游戏设置
      maxPlayers: 8,
      timeLimit: 30,             // 行动时间限制（秒）
      reconnectWindow: 30        // 断线重连窗口期（秒）
    };
  }
  
  addPlayer(player) {
    // 添加玩家
  }
  
  removePlayer(playerId) {
    // 移除玩家
  }
  
  startGame() {
    // 开始游戏
  }
  
  handlePlayerAction(playerId, action, data) {
    // 处理玩家行动
  }
  
  broadcastState() {
    // 广播游戏状态
  }
}
