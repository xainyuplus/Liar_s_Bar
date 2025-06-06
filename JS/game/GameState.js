/**
 * game/GameState.js - 精细化游戏状态管理
 * 专注于游戏状态的存储、更新和查询，不包含UI逻辑
 */
//增设匹配时的相关信息之后就能用，现在的比较重要的事情是，把人机的部分设计好
class GameState {
    constructor() {
        // 房间基础信息
        this.roomCode = null;
        this.playerId = null;
        this.playerName = null;
        this.isHost = false;
        
        // 游戏状态
        this.gamePhase = 'waiting'; // 'waiting', 'playing', 'challenge', 'roulette', 'over'
        this.targetCard = null;     // 当前目标牌: 'J', 'Q', 'K'
        this.currentPlayerId = null; // 当前出牌玩家ID
        this.lastPlayerId = null;    // 上一个出牌的玩家ID
        this.roulettePlayerId = null; // 正在轮盘赌的玩家ID
        this.roundNumber = 0;        // 当前回合数
        this.turnNumber = 0;         // 当前轮次数
        
        // 玩家信息 - 使用Map存储
        this.players = new Map();    // playerId -> playerInfo
        this.playersOrder = [];      // 玩家出牌顺序
        this.eliminatedPlayers = new Set(); // 已淘汰玩家ID集合
        
        // 我的信息
        this.myHand = [];           // 我的手牌数组
        this.myOriginalHp = 2;      // 我的初始生命值
        
        // 桌面信息
        this.deskCards = [];        // 桌面卡牌信息
        this.lastPlayedCount = 0;   // 上次出牌数量
        this.lastDeclaredValue = null; // 上次声称的牌值
        this.lastActualCards = [];  // 上次实际出的牌（质疑后可见）
        
        // 游戏统计
        this.gameStats = {
            startTime: null,
            endTime: null,
            totalRounds: 0,
            totalChallenges: 0,
            totalRoulettes: 0,
            playerActions: new Map() // playerId -> 行动统计
        };
        
        // 事件监听器
        this.listeners = new Map(); // eventType -> Set of listeners
        
        this.initializeEventListeners();
    }
    
    /**
     * 初始化事件监听
     */
    initializeEventListeners() {
        // 从localStorage恢复基础数据
        this.loadFromStorage();
        
        // 设置自动保存
        this.setupAutoSave();
    }
    
    /**
     * 从localStorage加载数据
     */
    loadFromStorage() {
        try {
            const gameData = JSON.parse(localStorage.getItem('gameData') || '{}');
            
            if (gameData.roomCode) this.roomCode = gameData.roomCode;
            if (gameData.playerId) this.playerId = gameData.playerId;
            if (gameData.playerName) this.playerName = gameData.playerName;
            if (gameData.isHost) this.isHost = gameData.isHost;
            
            console.log('从localStorage恢复游戏数据:', gameData);
        } catch (error) {
            console.warn('无法从localStorage恢复游戏数据:', error);
        }
    }
    
    /**
     * 保存到localStorage
     */
    saveToStorage() {
        try {
            const gameData = {
                roomCode: this.roomCode,
                playerId: this.playerId,
                playerName: this.playerName,
                isHost: this.isHost,
                timestamp: Date.now()
            };
            
            localStorage.setItem('gameData', JSON.stringify(gameData));
        } catch (error) {
            console.warn('无法保存游戏数据到localStorage:', error);
        }
    }
    
    /**
     * 设置自动保存
     */
    setupAutoSave() {
        // 每30秒自动保存一次
        setInterval(() => {
            this.saveToStorage();
        }, 30000);
        
        // 页面卸载时保存
        window.addEventListener('beforeunload', () => {
            this.saveToStorage();
        });
    }
    
    // ===== 房间状态管理 =====
    
    /**
     * 设置房间信息
     */
    setRoomInfo(roomCode, playerId, playerName, isHost = false) {
        this.roomCode = roomCode;
        this.playerId = playerId;
        this.playerName = playerName;
        this.isHost = isHost;
        
        this.saveToStorage();
    }
    
    /**
     * 重置房间状态
     */
    resetRoom() {
        this.roomCode = null;
        this.playerId = null;
        this.playerName = null;
        this.isHost = false;
        
        this.resetGame();
        localStorage.removeItem('gameData');
    }
    
    // ===== 游戏状态管理 =====
    
    /**
     * 开始游戏
     */
    startGame(gameData) {
        this.gamePhase = 'playing';
        this.targetCard = gameData.targetCard;
        this.currentPlayerId = gameData.currentPlayerId;
        this.roundNumber = 1;
        this.turnNumber = 1;
        
        if (gameData.myHand) {
            this.myHand = gameData.myHand;
        }
        
        if (gameData.playersOrder) {
            this.playersOrder = gameData.playersOrder;
        }
        
        // 初始化游戏统计
        this.gameStats.startTime = Date.now();
        this.gameStats.totalRounds = 0;
        this.gameStats.totalChallenges = 0;
        this.gameStats.totalRoulettes = 0;
        
        this.emit('game_started', gameData);
    }
    
    /**
     * 更新游戏状态
     */
    updateGameState(stateData) {
        const changedFields = [];
        
        // 检查并更新各字段
        if (stateData.gamePhase && stateData.gamePhase !== this.gamePhase) {
            this.gamePhase = stateData.gamePhase;
            changedFields.push('gamePhase');
        }
        
        if (stateData.targetCard && stateData.targetCard !== this.targetCard) {
            this.targetCard = stateData.targetCard;
            changedFields.push('targetCard');
        }
        
        if (stateData.currentPlayerId && stateData.currentPlayerId !== this.currentPlayerId) {
            this.currentPlayerId = stateData.currentPlayerId;
            changedFields.push('currentPlayer');
        }
        
        if (stateData.roundNumber && stateData.roundNumber !== this.roundNumber) {
            this.roundNumber = stateData.roundNumber;
            changedFields.push('roundNumber');
        }
        
        if (stateData.myHand) {
            this.myHand = stateData.myHand;
            changedFields.push('myHand');
        }
        
        // 更新玩家信息
        if (stateData.players) {
            this.updatePlayers(stateData.players);
            changedFields.push('players');
        }
        
        // 触发状态变化事件
        if (changedFields.length > 0) {
            this.emit('state_changed', { changedFields, newState: this.getPublicState() });
        }
    }
    
    /**
     * 结束游戏
     */
    endGame(gameOverData) {
        this.gamePhase = 'over';
        this.gameStats.endTime = Date.now();
        
        if (gameOverData.winner) {
            this.gameStats.winner = gameOverData.winner;
        }
        
        this.emit('game_over', gameOverData);
    }
    
    /**
     * 重置游戏状态
     */
    resetGame() {
        this.gamePhase = 'waiting';
        this.targetCard = null;
        this.currentPlayerId = null;
        this.lastPlayerId = null;
        this.roulettePlayerId = null;
        this.roundNumber = 0;
        this.turnNumber = 0;
        
        this.myHand = [];
        this.deskCards = [];
        this.lastPlayedCount = 0;
        this.lastDeclaredValue = null;
        this.lastActualCards = [];
        
        this.playersOrder = [];
        this.eliminatedPlayers.clear();
        
        // 重置统计
        this.gameStats = {
            startTime: null,
            endTime: null,
            totalRounds: 0,
            totalChallenges: 0,
            totalRoulettes: 0,
            playerActions: new Map()
        };
        
        this.emit('game_reset');
    }
    
    // ===== 玩家管理 =====
    
    /**
     * 更新玩家列表
     */
    updatePlayers(playersData) {
        const oldPlayerIds = new Set(this.players.keys());
        const newPlayerIds = new Set();
        
        playersData.forEach(playerData => {
            newPlayerIds.add(playerData.id);
            
            if (this.players.has(playerData.id)) {
                // 更新现有玩家
                const existingPlayer = this.players.get(playerData.id);
                Object.assign(existingPlayer, playerData);
            } else {
                // 添加新玩家
                this.players.set(playerData.id, { ...playerData });
                this.emit('player_joined', playerData);
            }
        });
        
        // 移除离开的玩家
        oldPlayerIds.forEach(playerId => {
            if (!newPlayerIds.has(playerId)) {
                const removedPlayer = this.players.get(playerId);
                this.players.delete(playerId);
                this.emit('player_left', removedPlayer);
            }
        });
    }
    
    /**
     * 添加单个玩家
     */
    addPlayer(playerData) {
        this.players.set(playerData.id, { ...playerData });
        this.emit('player_joined', playerData);
    }
    
    /**
     * 移除玩家
     */
    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            this.players.delete(playerId);
            this.emit('player_left', player);
        }
    }
    
    /**
     * 淘汰玩家
     */
    eliminatePlayer(playerId) {
        this.eliminatedPlayers.add(playerId);
        
        const player = this.players.get(playerId);
        if (player) {
            player.isAlive = false;
            player.hp = 0;
            this.emit('player_eliminated', player);
        }
    }
    
    // ===== 出牌相关 =====
    
    /**
     * 处理玩家出牌
     */
    handleCardsPlayed(playData) {
        this.lastPlayerId = playData.playerId;
        this.lastPlayedCount = playData.cardCount;
        this.lastDeclaredValue = playData.declaredValue;
        this.currentPlayerId = playData.nextPlayerId;
        this.turnNumber++;
        
        // 更新桌面卡牌显示（隐藏具体内容）
        this.deskCards = new Array(playData.cardCount).fill({ hidden: true });
        
        // 如果是我出的牌，从手牌中移除
        if (playData.playerId === this.playerId && playData.removedCards) {
            playData.removedCards.forEach(cardId => {
                const index = this.myHand.findIndex(card => card.id === cardId);
                if (index !== -1) {
                    this.myHand.splice(index, 1);
                }
            });
        }
        
        // 更新玩家手牌数量
        const player = this.players.get(playData.playerId);
        if (player) {
            player.handCount = playData.remainingCards;
        }
        
        // 更新统计
        this.updatePlayerActionStats(playData.playerId, 'play', {
            cardCount: playData.cardCount,
            declaredValue: playData.declaredValue
        });
        
        this.emit('cards_played', playData);
    }
    
    /**
     * 处理质疑结果
     */
    handleChallengeResult(challengeData) {
        this.gameStats.totalChallenges++;
        
        // 显示实际卡牌
        if (challengeData.actualCards) {
            this.lastActualCards = challengeData.actualCards;
            this.deskCards = challengeData.actualCards.map(cardValue => ({
                value: cardValue,
                revealed: true
            }));
        }
        
        // 设置轮盘赌目标
        if (challengeData.success) {
            this.roulettePlayerId = challengeData.challengedId;
        } else {
            this.roulettePlayerId = challengeData.challengerId;
        }
        
        // 更新统计
        this.updatePlayerActionStats(challengeData.challengerId, 'challenge', {
            success: challengeData.success,
            target: challengeData.challengedId
        });
        
        this.emit('challenge_result', challengeData);
    }
    
    /**
     * 处理信任
     */
    handleTrustAccepted(trustData) {
        // 清空桌面
        this.clearDesk();
        
        // 开始新回合
        this.startNewRound(trustData.nextRound);
        
        this.updatePlayerActionStats(trustData.trustingPlayerId, 'trust');
        this.emit('trust_accepted', trustData);
    }
    
    // ===== 轮盘赌相关 =====
    
    /**
     * 开始轮盘赌
     */
    startRoulette(rouletteData) {
        this.gamePhase = 'roulette';
        this.roulettePlayerId = rouletteData.playerId;
        this.gameStats.totalRoulettes++;
        
        this.emit('roulette_start', rouletteData);
    }
    
    /**
     * 处理轮盘赌结果
     */
    handleRouletteResult(resultData) {
        this.gamePhase = 'playing';
        
        if (resultData.hit) {
            // 玩家被淘汰
            this.eliminatePlayer(resultData.playerId);
            
            // 更新玩家生命值
            const player = this.players.get(resultData.playerId);
            if (player) {
                player.hp = Math.max(0, player.hp - 1);
                if (player.hp === 0) {
                    player.isAlive = false;
                }
            }
        }
        
        this.roulettePlayerId = null;
        
        // 清空桌面，开始新回合
        this.clearDesk();
        if (resultData.nextRound) {
            this.startNewRound(resultData.nextRound);
        }
        
        this.updatePlayerActionStats(resultData.playerId, 'roulette', {
            hit: resultData.hit
        });
        
        this.emit('roulette_result', resultData);
    }
    
    // ===== 回合管理 =====
    
    /**
     * 开始新回合
     */
    startNewRound(roundData) {
        if (roundData.targetCard) {
            this.targetCard = roundData.targetCard;
        }
        
        if (roundData.currentPlayerId) {
            this.currentPlayerId = roundData.currentPlayerId;
        }
        
        this.roundNumber++;
        this.turnNumber = 1;
        this.gameStats.totalRounds++;
        
        this.emit('new_round', roundData);
    }
    
    /**
     * 清空桌面
     */
    clearDesk() {
        this.deskCards = [];
        this.lastPlayerId = null;
        this.lastPlayedCount = 0;
        this.lastDeclaredValue = null;
        this.lastActualCards = [];
    }
    
    // ===== 查询方法 =====
    
    /**
     * 是否轮到我出牌
     */
    isMyTurn() {
        return this.currentPlayerId === this.playerId && this.gamePhase === 'playing';
    }
    
    /**
     * 是否可以质疑/信任
     */
    canChallengeOrTrust() {
        return this.lastPlayerId && 
               this.lastPlayerId !== this.playerId && 
               this.gamePhase === 'playing' &&
               this.deskCards.length > 0;
    }
    
    /**
     * 是否轮到我进行轮盘赌
     */
    isMyRoulette() {
        return this.roulettePlayerId === this.playerId && this.gamePhase === 'roulette';
    }
    
    /**
     * 获取玩家信息
     */
    getPlayer(playerId) {
        return this.players.get(playerId);
    }
    
    /**
     * 获取我的信息
     */
    getMyInfo() {
        return this.players.get(this.playerId);
    }
    
    /**
     * 获取当前玩家
     */
    getCurrentPlayer() {
        return this.players.get(this.currentPlayerId);
    }
    
    /**
     * 获取其他玩家
     */
    getOtherPlayers() {
        return Array.from(this.players.values()).filter(player => player.id !== this.playerId);
    }
    
    /**
     * 获取存活玩家
     */
    getAlivePlayers() {
        return Array.from(this.players.values()).filter(player => player.isAlive !== false);
    }
    
    /**
     * 获取已淘汰玩家
     */
    getEliminatedPlayers() {
        return Array.from(this.players.values()).filter(player => player.isAlive === false);
    }
    
    // ===== 统计相关 =====
    
    /**
     * 更新玩家行动统计
     */
    updatePlayerActionStats(playerId, actionType, actionData = {}) {
        if (!this.gameStats.playerActions.has(playerId)) {
            this.gameStats.playerActions.set(playerId, {
                plays: 0,
                challenges: 0,
                trusts: 0,
                roulettes: 0,
                successfulChallenges: 0,
                rouletteHits: 0
            });
        }
        
        const stats = this.gameStats.playerActions.get(playerId);
        
        switch (actionType) {
            case 'play':
                stats.plays++;
                break;
            case 'challenge':
                stats.challenges++;
                if (actionData.success) {
                    stats.successfulChallenges++;
                }
                break;
            case 'trust':
                stats.trusts++;
                break;
            case 'roulette':
                stats.roulettes++;
                if (actionData.hit) {
                    stats.rouletteHits++;
                }
                break;
        }
    }
    
    /**
     * 获取游戏统计
     */
    getGameStats() {
        const duration = this.gameStats.endTime ? 
            (this.gameStats.endTime - this.gameStats.startTime) / 1000 : 
            (Date.now() - this.gameStats.startTime) / 1000;
        
        return {
            ...this.gameStats,
            duration: Math.floor(duration),
            playerCount: this.players.size,
            alivePlayerCount: this.getAlivePlayers().length
        };
    }
    
    // ===== 事件系统 =====
    
    /**
     * 添加事件监听器
     */
    addEventListener(eventType, listener) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(listener);
    }
    
    /**
     * 移除事件监听器
     */
    removeEventListener(eventType, listener) {
        if (this.listeners.has(eventType)) {
            this.listeners.get(eventType).delete(listener);
        }
    }
    
    /**
     * 触发事件
     */
    emit(eventType, data = {}) {
        if (this.listeners.has(eventType)) {
            this.listeners.get(eventType).forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`事件监听器错误 [${eventType}]:`, error);
                }
            });
        }
    }
    
    // ===== 导出状态 =====
    
    /**
     * 获取公共状态（可以发送给其他模块的状态）
     */
    getPublicState() {
        return {
            roomCode: this.roomCode,
            playerId: this.playerId,
            playerName: this.playerName,
            isHost: this.isHost,
            gamePhase: this.gamePhase,
            targetCard: this.targetCard,
            currentPlayerId: this.currentPlayerId,
            lastPlayerId: this.lastPlayerId,
            roulettePlayerId: this.roulettePlayerId,
            roundNumber: this.roundNumber,
            turnNumber: this.turnNumber,
            players: Array.from(this.players.values()),
            myHandCount: this.myHand.length,
            deskCards: this.deskCards,
            lastPlayedCount: this.lastPlayedCount,
            lastDeclaredValue: this.lastDeclaredValue,
            gameStats: this.getGameStats()
        };
    }
    
    /**
     * 获取完整状态（包含敏感信息，仅内部使用）
     */
    getFullState() {
        return {
            ...this.getPublicState(),
            myHand: this.myHand,
            lastActualCards: this.lastActualCards,
            playersOrder: this.playersOrder,
            eliminatedPlayers: Array.from(this.eliminatedPlayers)
        };
    }
    
    /**
     * 导出状态用于调试
     */
    exportStateForDebug() {
        return {
            ...this.getFullState(),
            listeners: Array.from(this.listeners.keys()),
            timestamp: Date.now()
        };
    }
    
    /**
     * 验证状态完整性
     */
    validateState() {
        const errors = [];
        
        // 检查必要字段
        if (!this.roomCode) errors.push('缺少房间代码');
        if (!this.playerId) errors.push('缺少玩家ID');
        
        // 检查玩家数据一致性
        if (this.playerId && !this.players.has(this.playerId)) {
            errors.push('当前玩家不在玩家列表中');
        }
        
        if (this.currentPlayerId && !this.players.has(this.currentPlayerId)) {
            errors.push('当前出牌玩家不存在');
        }
        
        // 检查游戏状态逻辑
        if (this.gamePhase === 'playing' && !this.targetCard) {
            errors.push('游戏进行中但没有目标牌');
        }
        
        if (this.gamePhase === 'roulette' && !this.roulettePlayerId) {
            errors.push('轮盘赌阶段但没有指定玩家');
        }
        
        // 检查桌面状态
        if (this.lastPlayerId && this.deskCards.length === 0) {
            errors.push('有最后出牌玩家但桌面无牌');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * 修复状态不一致问题
     */
    repairState() {
        const validation = this.validateState();
        
        if (validation.valid) {
            return { repaired: false, message: '状态正常' };
        }
        
        let repaired = false;
        const repairs = [];
        
        // 修复玩家数据
        if (this.currentPlayerId && !this.players.has(this.currentPlayerId)) {
            this.currentPlayerId = null;
            repaired = true;
            repairs.push('重置当前玩家');
        }
        
        if (this.roulettePlayerId && !this.players.has(this.roulettePlayerId)) {
            this.roulettePlayerId = null;
            this.gamePhase = 'playing';
            repaired = true;
            repairs.push('重置轮盘赌状态');
        }
        
        // 修复桌面状态
        if (this.lastPlayerId && this.deskCards.length === 0) {
            this.lastPlayerId = null;
            this.lastPlayedCount = 0;
            this.lastDeclaredValue = null;
            repaired = true;
            repairs.push('重置桌面状态');
        }
        
        return {
            repaired: repaired,
            repairs: repairs,
            message: repaired ? `修复了 ${repairs.length} 个问题` : '无法自动修复'
        };
    }
    
    /**
     * 清理过期数据
     */
    cleanup() {
        // 清理空的事件监听器
        this.listeners.forEach((listeners, eventType) => {
            if (listeners.size === 0) {
                this.listeners.delete(eventType);
            }
        });
        
        // 清理过期的localStorage数据
        try {
            const gameData = JSON.parse(localStorage.getItem('gameData') || '{}');
            if (gameData.timestamp && (Date.now() - gameData.timestamp) > 24 * 60 * 60 * 1000) {
                // 24小时后清理
                localStorage.removeItem('gameData');
            }
        } catch (error) {
            console.warn('清理localStorage时出错:', error);
        }
    }
    
    /**
     * 销毁状态管理器
     */
    destroy() {
        this.listeners.clear();
        this.players.clear();
        this.eliminatedPlayers.clear();
        this.gameStats.playerActions.clear();
        
        // 清理定时器等资源
        this.cleanup();
        
        console.log('GameState已销毁');
    }
}

// 创建全局游戏状态实例
window.gameState = new GameState();

// 开发环境下的调试工具
/* if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    window.debugGameState = {
        getState: () => window.gameState.exportStateForDebug(),
        validateState: () => window.gameState.validateState(),
        repairState: () => window.gameState.repairState(),
        clearStorage: () => {
            localStorage.removeItem('gameData');
            console.log('已清理localStorage');
        }
    };
    
    console.log('调试工具已加载，使用 window.debugGameState 访问');
} */