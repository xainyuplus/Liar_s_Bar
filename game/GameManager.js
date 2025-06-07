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
    this.room.deck = this.initDeck();
    this.setRandomTargetCard();
    this.currentPlayerIndex = 0;//这个应该有点问题，以后改
    this.room.io.to(this.room.id).emit('round_started', { targetCard: this.targetCard });
    //哦关于这个新一轮的信息，我认为有点不完全，可以做一个对象把所有局内信息都发过去吧
    //不过建议还是拆分一下，用state更新这个函数
    //信息包括当前玩家，每个玩家的牌数，子弹数，是否存活
    const startTime = Date.now() + 2000;
    this.room.io.to(this.room.id).emit('start_timer', startTime); // 30秒倒计时
    //前端接收到这条信息后，再开始发牌动画，并获取手牌信息
    this.dealCards();//发牌
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
  // 初始化完整牌堆并洗牌
  initDeck() {
    // 创建完整牌组（4个玩家，每人5张，共20张）
    const fullDeck = [];
    const cardTypes = ["A", "Q", "K", "joker"];
    const counts = [6, 6, 6, 2]; // 每种牌的数量

    for (let i = 0; i < cardTypes.length; i++) {
      for (let j = 0; j < counts[i]; j++) {
        fullDeck.push(cardTypes[i]);
      }
    }

    // 洗牌算法（Fisher-Yates）
    for (let i = fullDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
    }

    return fullDeck;
  }
  setRandomTargetCard() {
    // 设置随机目标牌
    const cards = ["A", "Q", "K"]
    const randomIndex = Math.floor(Math.random() * cards.length);
    this.targetCard = cards[randomIndex];
  }
  
  dealCards() {
    //发牌
    const players = Array.from(this.room.players.values()); // 获取所有玩家
    const deck = this.room.deck; // 获取牌堆
    const cardsPerPlayer = 5; // 每位玩家发5张牌
    let cardId = 0; // 初始化唯一的牌ID
    for (let i = 0; i < players.length; i++) {
      const playerCards = []; // 每位玩家的牌
      for (let j = 0; j < cardsPerPlayer; j++) {
        const randomIndex = Math.floor(Math.random() * deck.length); // 随机选择一张牌
              playerCards.push({id:cardId++,value:deck[randomIndex] }); // 发牌
        // 从牌堆中移除这张牌  
        deck.splice(randomIndex, 1);
      } 
      players[i].setHand(playerCards); // 给玩家设置手牌
    }
  }

}
module.exports = GameManager;
