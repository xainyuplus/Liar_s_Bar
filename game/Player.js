// Player class 
class Player {
  constructor({ id, name, avatar, isHost = false ,isRobot = false}) {
    this.id = id;                 // 唯一标识，通常是 socket.id 或自定义的 playerId
    this.name = name;             // 昵称
    this.avatar = avatar;         // 头像 URL 或文件名
    this.hand = [];               // 手牌数组，卡牌对象如 { id, value }
    this.isHost = isHost;         // 是否为房主
    this.isAlive = true;          // 玩家是否还在游戏中
    this.connected = true;        // 是否连接中
    this.lastAction = Date.now(); // 最后操作时间
    this.isRobot =false;         // 是否为机器人
    this.bullets=6; // 子弹数量
  }


  removeCard(cardId) {
    this.hand = this.hand.filter(c => c.id !== cardId);
  }

  setHand(cards) {
    this.hand = cards;
  }

  disconnect() {
    this.connected = false;
  }

  reconnect() {
    this.connected = true;
    this.lastAction = Date.now();
  }

  markDead() {
    this.isAlive = false;
  }

  updateActionTime() {
    this.lastAction = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
      hand: this.hand,
      isHost: this.isHost,
      isRobot:this.isRobot,
      isAlive: this.isAlive,
      connected: this.connected,
      lastAction: this.lastAction,
    };
  }
}

module.exports = Player;
