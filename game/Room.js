// Room management 
const GameManager = require('./GameManager');
const Player = require('./Player');
class Room {
  constructor(id, hostId) {
    this.id = id;                // 房间ID
    this.hostId = hostId;        // 房主ID
    this.players =new Map();           // 玩家列表
    this.gameManager = new GameManager(this);      // 游戏状态
    this.deck = null;            // 牌堆
    this.phase = 'WAITING';      // 房间阶段：WAITING, PLAYING, ENDED
    this.spectators = [];        // 观众（非玩家）
    this.settings = {            // 游戏设置
      maxPlayers: 8,
      timeLimit: 30,             // 行动时间限制（秒）
      reconnectWindow: 30        // 断线重连窗口期（秒）
    };
  }
  
 addPlayer(playerInfo) {
    const player = new Player(playerInfo);
    this.players.set(player.id, player);
  }

  
  removePlayer(playerId) {
    // 移除玩家
    const isRemoved = this.players.delete(playerId);
    if (isRemoved) {
      console.log(`玩家 ${playerId} 已从房间 ${this.id} 中移除`);
    } else {
      console.log(`未找到玩家 ${playerId}，移除失败`);
    }
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

module.exports = Room;