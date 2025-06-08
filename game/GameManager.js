// Game manager 
class GameManager {
  constructor(room) {
    this.room = room;                // 房间引用
    this.currentPlayerIndex = -1;     // 当前玩家索引
    this.targetCard = null;          // 当前目标牌
    this.lastPlayedCards = [];       // 上一次出的牌
    this.lastPlayerId = null;        // 上一个出牌的玩家ID
    this.waitingForAction = false;   // 是否等待行动
    this.roulettePlayer = null;      // 正在轮盘赌的玩家
    this.eliminatedPlayers = [];     // 已淘汰玩家
    this.currentPlayerInfo = null;   // 当前玩家信息
    this.round = 0;                  // 当前回合数

  }

  startRound() {
    // 开始新一轮，一轮指的是至少进行一次轮盘赌的那种一轮，每一轮只有一个目标牌
    this.room.deck = this.initDeck();
    this.setRandomTargetCard();
    this.room.phase = 'PLAYING';
    this.room.io.to(this.room.id).emit('round_started', { targetCard: this.targetCard });//这个或许可以省掉，算了不省了
    //前端接收到这条信息后，会触发发牌，所以就不省了，下面的可以
    //哦关于这个新一轮的信息，我认为有点不完全，可以做一个对象把所有局内信息都发过去吧
    //不过建议还是拆分一下，用state更新这个函数
    //前端接收到这条信息后，再开始发牌动画，并获取手牌信息
    this.dealCards();//发牌
    this.nextTurn(3000);//开始第一轮
  }
  // 切换到下一个玩家(要想好怎么写)
  //感觉现在的轮次上还太乱
  nextTurn(delay_time=2000) {
  this.currentPlayerIndex = this.getNextPlayerIndex();
  this.currentPlayerInfo = this.room.playersList[this.currentPlayerIndex];
  this.lastPlayerId = this.currentPlayerInfo.id;
    console.log("它的回合"+this.currentPlayerInfo.name+"他的id是"+this.currentPlayerInfo.id);
  // 更新轮数（建议只在一个完整轮后更新）
  this.round += 1;

  // 设定新一轮的计时器（2秒后开始）
    const startTime = Date.now() + delay_time;
    this.room.io.to(this.room.id).emit('start_timer', startTime); 

  // 广播新一轮
  this.syncGameState();

  if(this.currentPlayerInfo.isRobot){
    setTimeout(() => {
    //机器人出牌专门写一个函数吧
    this.handleRobotPlayCards();//机器人出牌
      
    },3000)
  }
}
getNextPlayerIndex() {
  // 获取下一个玩家索引
  let next = this.currentPlayerIndex;
  const total = this.room.playersList.length;

  do {
    next = (next + 1) % total;
  } while (this.eliminatedPlayers.includes(this.room.playersList[next].id));

  return next;
}


  handlePlayCards(playerId, cards) {
    // 处理出牌(cards是一个对象数组{id，value})
    // 检查是否是当前玩家
    console.log(cards);
    if (playerId !== this.currentPlayerInfo.id) {
      return; // 不是当前玩家，不处理
    }
    else if (cards.length < 1 || cards.length > 3) {
      return; // 出牌数量不符合要求，不处理
      
    }
    else {
      const player = this.room.players.get(playerId);
      cards.forEach((id,value) => {
        if(player.hand.find(card => card.id === id)){
          player.removeCard(id);
        }
        
      }); 

      this.lastPlayedCards = cards; // 更新上一次出的牌
      this.lastPlayerId = playerId; // 更新上一个出牌的玩家ID
      //this.room.io.to(this.room.id).emit('cards_played', { playerId: playerId, cardsNum: cards.length }); // 通知所有用户出牌
      this.nextTurn(); // 切换到下一个玩家
    }

  }

  handleChallenge(challengerId) {
    // 处理质疑
    if (challengerId!== this.currentPlayerInfo.id) {
      return; // 不是当前玩家，不处理 
    }
    else {
      this.room.io.to(this.room.id).emit('challenge_result', { playerId: challengerId }); // 通知所有用户质疑
    }
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
        playerCards.push({ id: cardId++, value: deck[randomIndex] }); // 发牌
        // 从牌堆中移除这张牌  
        deck.splice(randomIndex, 1);
      }
      players[i].setHand(playerCards); // 给玩家设置手牌
    }
  }
  //同步游戏状态
  syncGameState() {
    const players = Array.from(this.room.players.values());
    const playerSummaries = players.map(p => ({
      id: p.id,
      name: p.name,
      handCount: p.hand.length,
      bulletCount: p.bullets,
      isEliminated: this.eliminatedPlayers.includes(p.id)
    }));

    this.room.io.to(this.room.id).emit('sync_game_state', {
      gamePhase: this.room.phase,
      targetCard: this.targetCard,
      currentPlayerId: this.currentPlayerInfo?.id || null,
      lastPlayerId: this.lastPlayerId,
      roulettePlayerId: this.roulettePlayer?.id || null,
      roundNumber: this.round,
      eliminatedPlayers: this.eliminatedPlayers,
     // deskCards: this.lastPlayedCards, // 可根据阶段决定是否显示真实值
      lastPlayedCount: this.lastPlayedCards.length,
      lastDeclaredValue: this.lastDeclaredValue || null,
      // 不发真实牌面，除非是被质疑后
      players: playerSummaries,

    });
  }
   handleRobotPlayCards() {
    const player = this.room.players.get(this.currentPlayerInfo.id);
    const shouldChallenge = Math.random() < 0.5; // 50% 的概率选择质疑

    if (shouldChallenge) {
      // 选择质疑
      this.handleChallenge(player.id);
      console.log(`机器人 ${player.name} (ID: ${player.id}) 选择质疑`);
    } else {
      // 选择出牌
      const hand = player.hand;
      const cardCount = Math.floor(Math.random() * 3) + 1; // 随机 1 - 3 张牌
      const cardsToPlay = [];

      if (hand.length >= cardCount) {
        for (let i = 0; i < cardCount; i++) {
          const randomIndex = Math.floor(Math.random() * hand.length);
          cardsToPlay.push(hand.splice(randomIndex, 1)[0]);
        }
        this.handlePlayCards(player.id, cardsToPlay);
        console.log(`机器人 ${player.name} (ID: ${player.id}) 出牌 ${cardCount} 张`);
      } else {
        // 手牌不足，选择质疑
        this.handleChallenge(player.id);
        console.log(`机器人 ${player.name} (ID: ${player.id}) 手牌不足，选择质疑`);
      }
    }
  }

}
module.exports = GameManager;
