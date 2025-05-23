// Game manager 
class GameManager {
  constructor(room) {
    this.room = room;                // 房间引用
    this.currentPlayerIndex = 0;     // 当前玩家索引
    this.targetCard = null;          // 当前目标牌
    this.lastPlayedCards = [];       // 上一次出的牌
    this.lastPlayerId = null;        // 上一个出牌的玩家ID
    this.waitingForAction = false;   // 是否等待行动
    this.roulettePlayer = null;      // 正在轮盘赌的玩家
    this.eliminatedPlayers = [];     // 已淘汰玩家
  }
  
  startRound() {
    // 开始新一轮
    this.setRandomTargetCard();
  }
  
  handlePlayCards(playerId, cardIds, declaredValue) {
    // 处理出牌
  }
  
  handleChallenge(challengerId) {
    // 处理质疑
  }
  
  handleTrust(playerId) {
    // 处理信任
  }
  
  startRoulette(playerId) {
    // 开始轮盘赌
  }
  
  handleSpinResult(playerId, hit) {
    // 处理轮盘赌结果
  }
  
  checkGameOver() {
    // 检查游戏是否结束
  }
}
module.exports = GameManager;
