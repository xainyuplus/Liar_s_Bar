// Game manager 
class GameManager {
  constructor(room) {
    this.room = room;                // 房间引用
    this.currentPlayerIndex = null;     // 当前玩家索引
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
    if(this.eliminatedPlayers.length === 3){
      const alivePlayers = Array.from(this.room.players.values())
        .filter(player => !this.eliminatedPlayers.includes(player.id))
        .map(player => ({
          id: player.id,
          name: player.name,
          avatar: player.avatar
        }));

      // 发送游戏结束事件和存活玩家信息
      this.room.io.to(this.room.id).emit('game_over', { alivePlayers });
      return; 
    }
    else{
    this.room.deck = this.initDeck();
    this.setRandomTargetCard();
    this.room.phase = 'PLAYING';
    this.room.io.to(this.room.id).emit('round_started', { targetCard: this.targetCard });//这个或许可以省掉，算了不省了
    //前端接收到这条信息后，会触发发牌，所以就不省了，下面的可以
    //哦关于这个新一轮的信息，我认为有点不完全，可以做一个对象把所有局内信息都发过去吧
    //不过建议还是拆分一下，用state更新这个函数
    //前端接收到这条信息后，再开始发牌动画，并获取手牌信息
    this.dealCards();//发牌
    this.firstTurn(3000);//开始第一轮
    }

  }


  firstTurn(delay_time=2000) {
    console.log("first turn");
    if( this.currentPlayerIndex === null){
      this.currentPlayerIndex=-1;
    }
    this.currentPlayerIndex = this.getNextPlayerIndex();
    this.lastPlayerId = null; // 上一个出牌的玩家ID
    this.currentPlayerInfo = this.room.playersList[this.currentPlayerIndex];
    //this.room.io.to(this.room.id).emit('first_turn', { playerId: this.currentPlayerInfo.id });//通知第一个玩家
    this.round = 1; // 第一轮
    // 设定新一轮的计时器（2秒后开始）
    const startTime = Date.now() + delay_time;
    this.room.io.to(this.room.id).emit('start_timer', startTime); 
    this.syncGameState();//同步游戏状态
      if(this.currentPlayerInfo.isRobot){
    setTimeout(() => {
    //机器人出牌专门写一个函数吧
    this.handleRobotPlayCards();//机器人出牌
      
    },3000)
  }
  }
  // 切换到下一个玩家(要想好怎么写)
  //感觉现在的轮次上还太乱
  nextTurn(delay_time=2000) {
    console.log("next turn");
  this.lastPlayerId = this.currentPlayerInfo.id;
  this.currentPlayerIndex = this.getNextPlayerIndex();
  this.currentPlayerInfo = this.room.playersList[this.currentPlayerIndex];
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
      cards.forEach(({id,value}) => {
        if(player.hand.find(card => card.id === id)){
          player.removeCard(id);
        }
        
      }); 

      this.lastPlayedCards = cards; // 更新上一次出的牌
      this.lastPlayerId = playerId; // 更新上一个出牌的玩家ID
      this.room.io.to(this.room.id).emit('cards_played', { playerId: playerId, cardsNum: cards.length }); // 通知所有用户出牌
      this.nextTurn(); // 切换到下一个玩家
    }

  }

  handleChallenge(challengerId) {
    // 处理质疑
    if (challengerId!== this.currentPlayerInfo.id) {
      return; // 不是当前玩家，不处理 
    }
    else {
      //这个事件包括1.质疑者id，上次出的牌，上一个出牌的玩家id，质疑结果
      //是true或者false
      const data={
        challengerId:challengerId,
        lastPlayedCards:this.lastPlayedCards,
        lastPlayerId:this.lastPlayerId,
        result:null
      }
      //这里有个判断质疑结果的部分
      // 检查上一次出的牌中是否存在目标牌和小丑牌之外的牌
      const hasOtherCard = this.lastPlayedCards.some(card => 
        card.value!== this.targetCard && card.value!== 'joker'
      );
      // 如果存在其他牌，质疑成功，结果为 true；否则质疑失败，结果为 false
      data.result = hasOtherCard; 
      this.room.io.to(this.room.id).emit('challenge_result', data); // 通知所有用户质疑

      //延迟4s后，处理质疑结果
      setTimeout(() => {
        if(data.result){
          //质疑成功，上一个出牌的玩家进入轮盘赌
          this.startRoulette(this.lastPlayerId);
        }
        else{
          this.startRoulette(challengerId);
        }
      }, 4000); // 延迟 4 秒
    }
  }


  startRoulette(playerId) {
    // 开始轮盘赌
    const roulettePlayer = this.room.players.get(playerId); // 设置轮盘赌的玩家
    if(roulettePlayer.bullets===roulettePlayer.deadNum){
      //如果子弹数等于死亡数，直接死亡
      roulettePlayer.markDead();//标记死亡 
      this.eliminatedPlayers.push(playerId);//加入淘汰列表
      this.room.io.to(this.room.id).emit('roulette_result', { playerId: playerId,result:true }); // 通知所有用户
      
    }
    else{
      this.room.io.to(this.room.id).emit('roulette_result', { playerId: playerId, result:false}); // 通知所有用户
      
    }
    roulettePlayer.bullets-=1; // 子弹数减一
    // console.log(`轮盘赌结束后，玩家 ${playerId} 的子弹数: ${this.room.players.get(playerId).bullets}`);
    // 延迟 4 秒后，开始下一轮
    setTimeout(() => {
     this.startRound(); // 开始下一轮 
    },4000);
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
    let shouldChallenge = Math.random() < 0.5; // 50% 的概率选择质疑
    if(this.lastPlayerId===null){
      //如果上一个出牌的玩家id是null，那么这个机器人就不质疑
      shouldChallenge=false;
    }

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
