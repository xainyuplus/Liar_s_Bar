// main.js 
//这里有必要完成玩家的初始化，指的是获取id，昵称，头像等信息，（从数据库中提取，现在就算了）
/**
 * main.js - 主控制器和页面入口
 * 负责初始化整个应用，协调各个模块的工作
 */

class GameController {
    constructor() {
        this.initialized = false;
        this.components = {
            socketClient: null,
            gameState: null,
            myHand: null,
            gameScreen: null
        };
        
        this.eventHandlers = new Map();
        this.initPromise = null;
        
        // 绑定方法的上下文
        this.boundMethods = {
            handleSocketEvents: this.handleSocketEvents.bind(this),
            handleGameStateEvents: this.handleGameStateEvents.bind(this),
            handleUIEvents: this.handleUIEvents.bind(this)
        };
        
        this.init();
    }
    
    /**
     * 初始化应用
     */
    async init() {
        if (this.initPromise) {
            return this.initPromise;
        }
        
        this.initPromise = this._doInit();
        return this.initPromise;
    }
    
    /**
     * 执行初始化
     */
    async _doInit() {
        try {
            console.log('开始初始化游戏控制器...');
            
            // 1. 等待DOM加载完成
            await this.waitForDOM();
            
            // 2. 检查依赖
            this.checkDependencies();
            
            // 3. 初始化组件
            this.initializeComponents();
            
            // 4. 设置事件监听
            this.setupEventListeners();
            
            // 5. 恢复游戏状态
            await this.restoreGameState();
            
            // 6. 初始化UI
            this.initializeUI();
            
            this.initialized = true;
            console.log('游戏控制器初始化完成');
            
        } catch (error) {
            console.error('游戏控制器初始化失败:', error);
            this.handleInitError(error);
            throw error;
        }
    }
    
    /**
     * 等待DOM加载完成
     */
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    /**
     * 检查依赖
     */
    checkDependencies() {
        const required = ['socketClient', 'gameState', 'Hand', 'Card'];
        const missing = [];
        
        required.forEach(dep => {
            if (!window[dep]) {
                missing.push(dep);
            }
        });
        
        if (missing.length > 0) {
            throw new Error(`缺少依赖: ${missing.join(', ')}`);
        }
    }
    
    /**
     * 初始化组件
     */
    initializeComponents() {
        // 获取已存在的全局实例
        this.components.socketClient = window.socketClient;
        this.components.gameState = window.gameState;
        
        // 初始化我的手牌组件
        const myHandContainer = document.getElementById('my-hand');
        if (myHandContainer) {
            this.components.myHand = new Hand(myHandContainer, {
                selectable: true,
                faceUp: true,
                maxSelection: 3,
                onCardSelect: this.boundMethods.handleCardSelect.bind(this),
                onSelectionChange: this.boundMethods.handleSelectionChange.bind(this)
            });
        }
        
        // 初始化游戏屏幕管理器
        this.components.gameScreen = new GameScreen();
        
        console.log('组件初始化完成');
    }
    
    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // Socket事件
        this.boundMethods.handleSocketEvents();
        
        // 游戏状态事件
        this.boundMethods.handleGameStateEvents();
        
        // UI事件
        this.boundMethods.handleUIEvents();
        
        // 页面生命周期事件
        this.setupPageLifecycleEvents();
    }
    
    /**
     * 处理Socket事件
     */
    handleSocketEvents() {
        const socket = this.components.socketClient;
        
        // 连接状态事件
        socket.on('socket_connected', () => {
            console.log('Socket连接成功');
            this.updateConnectionStatus(true);
        });
        
        socket.on('socket_disconnected', () => {
            console.log('Socket连接断开');
            this.updateConnectionStatus(false);
        });
        
        // 房间事件
        socket.on('room_joined', (data) => {
            this.components.gameState.setRoomInfo(
                data.roomCode, 
                data.playerId, 
                data.playerName,
                data.isHost
            );
            this.updateUI();
        });
        
        socket.on('player_joined', (data) => {
            this.components.gameState.addPlayer(data.player);
            this.updateUI();
        });
        
        socket.on('player_left', (data) => {
            this.components.gameState.removePlayer(data.playerId);
            this.updateUI();
        });
        
        // 游戏状态事件
        socket.on('game_started', (data) => {
            this.components.gameState.startGame(data);
            this.switchToGameScreen();
        });
        
        socket.on('game_state', (data) => {
            this.components.gameState.updateGameState(data);
            this.updateUI();
        });
        
        socket.on('your_turn', (data) => {
            this.handleMyTurn(data);
        });
        
        // 游戏行动事件
        socket.on('cards_played', (data) => {
            this.components.gameState.handleCardsPlayed(data);
            this.updateUI();
        });
        
        socket.on('challenge_result', (data) => {
            this.components.gameState.handleChallengeResult(data);
            this.showChallengeResult(data);
        });
        
        socket.on('trust_accepted', (data) => {
            this.components.gameState.handleTrustAccepted(data);
            this.updateUI();
        });
        
        // 轮盘赌事件
        socket.on('roulette_start', (data) => {
            this.components.gameState.startRoulette(data);
            this.showRouletteModal(data);
        });
        
        socket.on('roulette_result', (data) => {
            this.components.gameState.handleRouletteResult(data);
            this.handleRouletteResult(data);
        });
        
        // 游戏结束事件
        socket.on('player_eliminated', (data) => {
            this.components.gameState.eliminatePlayer(data.playerId);
            this.showPlayerEliminated(data);
        });
        
        socket.on('game_over', (data) => {
            this.components.gameState.endGame(data);
            this.showGameOver(data);
        });
    }
    
    /**
     * 处理游戏状态事件
     */
    handleGameStateEvents() {
        const gameState = this.components.gameState;
        
        gameState.addEventListener('state_changed', (data) => {
            this.updateUI();
        });
        
        gameState.addEventListener('game_started', () => {
            this.switchToGameScreen();
        });
        
        gameState.addEventListener('game_over', (data) => {
            this.showGameOver(data);
        });
    }
    
    /**
     * 处理UI事件
     */
    handleUIEvents() {
        // 绑定按钮事件
        this.bindButtonEvents();
        
        // 绑定键盘事件
        this.bindKeyboardEvents();
        
        // 绑定窗口事件
        this.bindWindowEvents();
    }
    
    /**
     * 绑定按钮事件
     */
    bindButtonEvents() {
        // 出牌按钮
        const playCardsBtn = document.getElementById('play-cards-btn');
        if (playCardsBtn) {
            playCardsBtn.addEventListener('click', () => this.playCards());
        }
        
        // 质疑按钮
        const challengeBtn = document.getElementById('challenge-btn');
        if (challengeBtn) {
            challengeBtn.addEventListener('click', () => this.challenge());
        }
        
        // 信任按钮
        const trustBtn = document.getElementById('trust-btn');
        if (trustBtn) {
            trustBtn.addEventListener('click', () => this.trust());
        }
        
        // 轮盘赌按钮
        const spinBtn = document.getElementById('spin-btn');
        if (spinBtn) {
            spinBtn.addEventListener('click', () => this.spinRoulette());
        }
        
        // 返回大厅按钮
        const returnBtn = document.querySelector('button[onclick="returnToLobby()"]');
        if (returnBtn) {
            returnBtn.removeAttribute('onclick');
            returnBtn.addEventListener('click', () => this.returnToLobby());
        }
        
        // 再来一局按钮
        const playAgainBtn = document.querySelector('button[onclick="playAgain()"]');
        if (playAgainBtn) {
            playAgainBtn.removeAttribute('onclick');
            playAgainBtn.addEventListener('click', () => this.playAgain());
        }
    }
    
    /**
     * 绑定键盘事件
     */
    bindKeyboardEvents() {
        document.addEventListener('keydown', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return; // 不处理输入框中的按键
            }
            
            switch (event.key) {
                case 'Enter':
                case ' ':
                    if (this.components.gameState.isMyTurn()) {
                        event.preventDefault();
                        this.playCards();
                    }
                    break;
                    
                case '1':
                    if (this.components.gameState.canChallengeOrTrust()) {
                        event.preventDefault();
                        this.challenge();
                    }
                    break;
                    
                case '2':
                    if (this.components.gameState.canChallengeOrTrust()) {
                        event.preventDefault();
                        this.trust();
                    }
                    break;
                    
                case 'Escape':
                    // 清空选择
                    if (this.components.myHand) {
                        this.components.myHand.clearSelection();
                    }
                    break;
                    
                case 'a':
                case 'A':
                    // 全选（调试用）
                    if (event.ctrlKey && this.components.myHand) {
                        event.preventDefault();
                        this.components.myHand.selectAll();
                    }
                    break;
            }
        });
    }
    
    /**
     * 绑定窗口事件
     */
    bindWindowEvents() {
        // 页面卸载前保存状态
        window.addEventListener('beforeunload', () => {
            this.components.gameState.saveToStorage();
        });
        
        // 窗口失焦/获焦
        window.addEventListener('focus', () => {
            this.updateUI(); // 重新获取焦点时刷新UI
        });
        
        // 网络状态变化
        window.addEventListener('online', () => {
            console.log('网络已连接');
            if (this.components.socketClient) {
                this.components.socketClient.reconnect();
            }
        });
        
        window.addEventListener('offline', () => {
            console.log('网络已断开');
        });
    }
    
    /**
     * 设置页面生命周期事件
     */
    setupPageLifecycleEvents() {
        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // 页面变为可见时刷新状态
                this.updateUI();
            }
        });
    }
    
    /**
     * 恢复游戏状态
     */
    async restoreGameState() {
        // GameState会自动从localStorage恢复基础信息
        // 这里处理UI相关的恢复逻辑
        
        const gameData = JSON.parse(localStorage.getItem('gameData') || '{}');
        
        if (gameData.roomCode && gameData.playerId) {
            console.log('尝试恢复游戏状态...', gameData);
            // Socket连接成功后会自动尝试重新加入游戏
        }
    }
    
    /**
     * 初始化UI
     */
    initializeUI() {
        this.updateUI();
        
        // 显示欢迎信息
        if (this.components.gameState.playerName) {
            console.log(`欢迎, ${this.components.gameState.playerName}!`);
        }
    }
    
    // ===== 游戏操作方法 =====
    
    /**
     * 出牌
     */
    playCards() {
        if (!this.components.gameState.isMyTurn()) {
            this.showMessage('现在不是您的回合', 'warning');
            return;
        }
        
        const selectedCards = this.components.myHand.getSelectedCardIds();
        if (selectedCards.length === 0 || selectedCards.length > 3) {
            this.showMessage('请选择1-3张卡牌', 'warning');
            return;
        }
        
        const targetCard = this.components.gameState.targetCard;
        
        // 发送出牌请求
        this.components.socketClient.emit('play_cards', {
            roomCode: this.components.gameState.roomCode,
            cards: selectedCards,
            declaredValue: targetCard
        });
        
        // 清空选择
        this.components.myHand.clearSelection();
        
        this.showMessage(`出了 ${selectedCards.length} 张 ${targetCard}`, 'info');
    }
    
    /**
     * 质疑
     */
    challenge() {
        if (!this.components.gameState.canChallengeOrTrust()) {
            this.showMessage('现在不能质疑', 'warning');
            return;
        }
        
        const lastPlayer = this.components.gameState.getPlayer(this.components.gameState.lastPlayerId);
        const playerName = lastPlayer ? lastPlayer.name : '未知玩家';
        
        if (confirm(`确定要质疑 ${playerName} 吗？\n失败将进入轮盘赌！`)) {
            this.components.socketClient.emit('challenge', {
                roomCode: this.components.gameState.roomCode
            });
        }
    }
    
    /**
     * 信任
     */
    trust() {
        if (!this.components.gameState.canChallengeOrTrust()) {
            this.showMessage('现在不能选择信任', 'warning');
            return;
        }
        
        this.components.socketClient.emit('trust', {
            roomCode: this.components.gameState.roomCode
        });
    }
    
    /**
     * 轮盘赌
     */
    spinRoulette() {
        if (!this.components.gameState.isMyRoulette()) {
            this.showMessage('不是您的轮盘赌回合', 'warning');
            return;
        }
        
        this.components.socketClient.emit('spin_roulette', {
            roomCode: this.components.gameState.roomCode
        });
        
        // 隐藏开枪按钮
        const spinBtn = document.getElementById('spin-btn');
        if (spinBtn) {
            spinBtn.style.display = 'none';
        }
        
        // 显示轮盘动画
        const rouletteWheel = document.getElementById('roulette-wheel');
        if (rouletteWheel) {
            rouletteWheel.classList.add('spinning');
        }
    }
    
    /**
     * 再来一局
     */
    playAgain() {
        if (!this.components.gameState.isHost) {
            this.showMessage('只有房主可以重新开始游戏', 'warning');
            return;
        }
        
        this.components.socketClient.emit('restart_game', {
            roomCode: this.components.gameState.roomCode
        });
    }
    
    /**
     * 返回大厅
     */
    returnToLobby() {
        if (confirm('确定要离开游戏返回大厅吗？')) {
            // 发送离开房间请求
            this.components.socketClient.emit('leave_room', {
                roomCode: this.components.gameState.roomCode
            });
            
            // 清理状态
            this.components.gameState.resetRoom();
            
            // 跳转到首页
            window.location.href = 'index.html';
        }
    }
    
    // ===== UI更新方法 =====
    
    /**
     * 更新整体UI
     */
    updateUI() {
        if (!this.initialized) return;
        
        try {
            this.updateGameInfo();
            this.updatePlayersDisplay();
            this.updateMyHand();
            this.updateDeskDisplay();
            this.updateActionPanel();
        } catch (error) {
            console.error('更新UI时出错:', error);
        }
    }
    
    /**
     * 更新游戏信息
     */
    updateGameInfo() {
        const targetCardEl = document.getElementById('target-card');
        const currentPlayerEl = document.getElementById('current-player');
        
        if (targetCardEl && this.components.gameState.targetCard) {
            targetCardEl.textContent = this.components.gameState.targetCard;
        }
        
        if (currentPlayerEl) {
            const currentPlayer = this.components.gameState.getCurrentPlayer();
            if (currentPlayer) {
                if (this.components.gameState.isMyTurn()) {
                    currentPlayerEl.textContent = '轮到您出牌';
                    currentPlayerEl.style.color = '#27ae60';
                } else {
                    currentPlayerEl.textContent = `等待 ${currentPlayer.name} 出牌`;
                    currentPlayerEl.style.color = '#3498db';
                }
            }
        }
    }
    
    /**
     * 更新玩家显示
     */
    updatePlayersDisplay() {
        if (this.components.gameScreen) {
            this.components.gameScreen.updatePlayers(this.components.gameState.getOtherPlayers());
        }
    }
    
    /**
     * 更新我的手牌
     */
    updateMyHand() {
        if (this.components.myHand) {
            this.components.myHand.setCards(this.components.gameState.myHand);
            this.components.myHand.setSelectable(this.components.gameState.isMyTurn());
        }
    }
    
    /**
     * 更新桌面显示
     */
    updateDeskDisplay() {
        if (this.components.gameScreen) {
            this.components.gameScreen.updateDeskCards(this.components.gameState.deskCards);
        }
    }
    
    /**
     * 更新操作面板
     */
    updateActionPanel() {
        const playCardsBtn = document.getElementById('play-cards-btn');
        const challengeBtn = document.getElementById('challenge-btn');
        const trustBtn = document.getElementById('trust-btn');
        const actionMessage = document.getElementById('action-message');
        
        if (!playCardsBtn || !challengeBtn || !trustBtn || !actionMessage) return;
        
        // 重置按钮状态
        playCardsBtn.disabled = true;
        challengeBtn.disabled = true;
        trustBtn.disabled = true;
        
        if (this.components.gameState.gamePhase === 'playing') {
            if (this.components.gameState.isMyTurn()) {
                // 轮到我出牌
                actionMessage.textContent = '请选择1-3张卡牌并出牌';
                
                const selectedCount = this.components.myHand ? this.components.myHand.getSelectedCardIds().length : 0;
                playCardsBtn.textContent = `出牌 (${selectedCount}/3)`;
                playCardsBtn.disabled = selectedCount === 0 || selectedCount > 3;
                
            } else if (this.components.gameState.canChallengeOrTrust()) {
                // 轮到我质疑或信任
                const lastPlayer = this.components.gameState.getPlayer(this.components.gameState.lastPlayerId);
                const playerName = lastPlayer ? lastPlayer.name : '未知玩家';
                
                actionMessage.textContent = `${playerName} 声称出了 ${this.components.gameState.lastPlayedCount} 张 ${this.components.gameState.lastDeclaredValue}，您选择？`;
                
                challengeBtn.disabled = false;
                trustBtn.disabled = false;
                
            } else {
                // 等待其他玩家操作
                const currentPlayer = this.components.gameState.getCurrentPlayer();
                if (currentPlayer) {
                    actionMessage.textContent = `等待 ${currentPlayer.name} 操作...`;
                }
            }
        } else if (this.components.gameState.gamePhase === 'roulette') {
            const roulettePlayer = this.components.gameState.getPlayer(this.components.gameState.roulettePlayerId);
            const playerName = roulettePlayer ? roulettePlayer.name : '未知玩家';
            actionMessage.textContent = `${playerName} 正在进行俄罗斯轮盘赌...`;
        }
    }
    
    // ===== 事件处理方法 =====
    
    /**
     * 处理卡牌选择
     */
    handleCardSelect(card, selected) {
        // 卡牌选择时的反馈可以在这里处理
        this.updateActionPanel();
    }
    
    /**
     * 处理选择变化
     */
    handleSelectionChange(selectedCards, count) {
        this.updateActionPanel();
        
        // 可以在这里添加选择反馈音效等
        if (count > 0) {
            // 播放选择音效
            this.playSound('select');
        }
    }
    
    /**
     * 处理我的回合
     */
    handleMyTurn(data) {
        this.updateUI();
        this.showMessage('轮到您出牌了！', 'info', 3000);
        
        // 播放提示音
        this.playSound('your_turn');
        
        // 浏览器通知
        this.showBrowserNotification('骗子酒馆', '轮到您出牌了！');
    }
    
    /**
     * 显示质疑结果
     */
    showChallengeResult(data) {
        const challengerName = this.components.gameState.getPlayer(data.challengerId)?.name || '未知';
        const challengedName = this.components.gameState.getPlayer(data.challengedId)?.name || '未知';
        
        let message, type;
        if (data.success) {
            message = `质疑成功！${challengedName} 出的牌包含非目标牌！`;
            type = 'success';
        } else {
            message = `质疑失败！${challengedName} 出的都是 ${this.components.gameState.lastDeclaredValue}！`;
            type = 'error';
        }
        
        this.showMessage(message, type, 5000);
        this.updateUI();
    }
    
    /**
     * 显示轮盘赌模态框
     */
    showRouletteModal(data) {
        const modal = document.getElementById('roulette-modal');
        const playerNameEl = document.getElementById('roulette-player');
        const spinBtn = document.getElementById('spin-btn');
        
        if (!modal) return;
        
        const player = this.components.gameState.getPlayer(data.playerId);
        const playerName = player ? player.name : '未知玩家';
        
        if (playerNameEl) {
            playerNameEl.textContent = `${playerName} 正在进行俄罗斯轮盘赌...`;
        }
        
        if (spinBtn) {
            if (this.components.gameState.isMyRoulette()) {
                spinBtn.style.display = 'block';
            } else {
                spinBtn.style.display = 'none';
            }
        }
        
        modal.classList.remove('hidden');
        
        // 播放轮盘赌音效
        this.playSound('roulette');
    }
    
    /**
     * 处理轮盘赌结果
     */
    handleRouletteResult(data) {
        const playerName = this.components.gameState.getPlayer(data.playerId)?.name || '未知玩家';
        
        // 更新轮盘结果显示
        const resultEl = document.getElementById('roulette-result');
        if (resultEl) {
            if (data.hit) {
                resultEl.textContent = '💥 中弹！';
                resultEl.style.color = '#e74c3c';
            } else {
                resultEl.textContent = '🍀 幸运！';
                resultEl.style.color = '#27ae60';
            }
        }
        
        // 播放结果音效
        this.playSound(data.hit ? 'hit' : 'miss');
        
        // 延迟关闭模态框
        setTimeout(() => {
            this.hideRouletteModal();
            
            if (data.hit) {
                this.showMessage(`${playerName} 中弹淘汰！`, 'error', 3000);
            } else {
                this.showMessage(`${playerName} 幸运生还！`, 'success', 3000);
            }
            
            this.updateUI();
        }, 2000);
    }
    
    /**
     * 隐藏轮盘赌模态框
     */
    hideRouletteModal() {
        const modal = document.getElementById('roulette-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        // 重置轮盘状态
        const rouletteWheel = document.getElementById('roulette-wheel');
        const resultEl = document.getElementById('roulette-result');
        const spinBtn = document.getElementById('spin-btn');
        
        if (rouletteWheel) {
            rouletteWheel.classList.remove('spinning');
        }
        
        if (resultEl) {
            resultEl.textContent = '';
        }
        
        if (spinBtn) {
            spinBtn.style.display = 'none';
        }
    }
    
    /**
     * 显示玩家淘汰
     */
    showPlayerEliminated(data) {
        const playerName = this.components.gameState.getPlayer(data.playerId)?.name || '未知玩家';
        this.showMessage(`${playerName} 被淘汰！`, 'error', 3000);
        this.updateUI();
    }
    
    /**
     * 显示游戏结束
     */
    showGameOver(data) {
        const gameOverScreen = document.getElementById('game-over-screen');
        const winnerDisplay = document.getElementById('winner-display');
        const gameStats = document.getElementById('game-stats');
        
        if (!gameOverScreen || !winnerDisplay) return;
        
        const winner = this.components.gameState.getPlayer(data.winnerId);
        const winnerName = winner ? winner.name : '未知玩家';
        
        winnerDisplay.textContent = `🎉 ${winnerName} 获胜！`;
        
        if (gameStats && data.stats) {
            const duration = Math.floor((Date.now() - this.components.gameState.gameStats.startTime) / 1000);
            gameStats.innerHTML = `
                <p>游戏时长: ${this.formatDuration(duration)}</p>
                <p>总回合数: ${data.stats.rounds || this.components.gameState.roundNumber}</p>
                <p>质疑次数: ${data.stats.challenges || this.components.gameState.gameStats.totalChallenges}</p>
            `;
        }
        
        // 切换到游戏结束界面
        this.switchGamePhase('over');
        
        // 播放胜利/失败音效
        if (data.winnerId === this.components.gameState.playerId) {
            this.playSound('victory');
        } else {
            this.playSound('defeat');
        }
    }
    
    /**
     * 切换游戏阶段
     */
    switchGamePhase(phase) {
        const gamePlayingScreen = document.getElementById('game-playing');
        const gameOverScreen = document.getElementById('game-over-screen');
        
        if (phase === 'playing') {
            if (gamePlayingScreen) gamePlayingScreen.classList.remove('hidden');
            if (gameOverScreen) gameOverScreen.classList.add('hidden');
        } else if (phase === 'over') {
            if (gamePlayingScreen) gamePlayingScreen.classList.add('hidden');
            if (gameOverScreen) gameOverScreen.classList.remove('hidden');
        }
    }
    
    /**
     * 切换到游戏屏幕
     */
    switchToGameScreen() {
        this.switchGamePhase('playing');
        this.updateUI();
    }
    
    // ===== 工具方法 =====
    
    /**
     * 显示消息
     */
    showMessage(message, type = 'info', duration = 3000) {
        // 创建消息提示
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-toast message-${type}`;
        messageDiv.textContent = message;
        
        // 设置样式
        messageDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${this.getMessageColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10001;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(messageDiv);
        
        // 动画显示
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(0)';
        }, 10);
        
        // 自动隐藏
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, duration);
    }
    
    /**
     * 获取消息颜色
     */
    getMessageColor(type) {
        const colors = {
            'info': '#3498db',
            'success': '#27ae60',
            'warning': '#f39c12',
            'error': '#e74c3c'
        };
        return colors[type] || colors.info;
    }
    
    /**
     * 播放音效
     */
    playSound(soundType) {
        // 这里可以实现音效播放逻辑
        if (window.soundManager) {
            window.soundManager.play(soundType);
        }
    }
    
    /**
     * 显示浏览器通知
     */
    showBrowserNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: 'assets/images/icon.png',
                badge: 'assets/images/badge.png'
            });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showBrowserNotification(title, body);
                }
            });
        }
    }
    
    /**
     * 格式化时间
     */
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * 更新连接状态
     */
    updateConnectionStatus(connected) {
        // 可以在页面上显示连接状态指示器
        const statusIndicator = document.getElementById('connection-indicator');
        if (statusIndicator) {
            statusIndicator.className = connected ? 'connected' : 'disconnected';
            statusIndicator.title = connected ? '已连接' : '连接断开';
        }
    }
    
    /**
     * 处理初始化错误
     */
    handleInitError(error) {
        console.error('初始化错误:', error);
        
        // 显示错误页面或重试按钮
        const errorMessage = `
            <div style="text-align: center; padding: 50px; color: #e74c3c;">
                <h2>游戏加载失败</h2>
                <p>错误信息: ${error.message}</p>
                <button onclick="window.location.reload()" style="
                    background: #3498db; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 5px; 
                    cursor: pointer;
                ">重新加载</button>
            </div>
        `;
        
        document.body.innerHTML = errorMessage;
    }
    
    /**
     * 获取调试信息
     */
    getDebugInfo() {
        return {
            initialized: this.initialized,
            components: Object.keys(this.components).reduce((acc, key) => {
                acc[key] = !!this.components[key];
                return acc;
            }, {}),
            gameState: this.components.gameState ? this.components.gameState.exportStateForDebug() : null,
            socketConnected: this.components.socketClient ? this.components.socketClient.isConnected() : false
        };
    }
    
    /**
     * 销毁控制器
     */
    destroy() {
        // 清理事件监听器
        this.eventHandlers.clear();
        
        // 销毁组件
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        
        this.components = {};
        this.initialized = false;
        
        console.log('GameController已销毁');
    }
}

// 创建全局控制器实例
window.gameController = new GameController();

// 开发环境调试工具
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    window.debugController = {
        getInfo: () => window.gameController.getDebugInfo(),
        restart: () => {
            window.gameController.destroy();
            window.gameController = new GameController();
        },
        components: () => window.gameController.components
    };
    
    console.log('调试工具已加载，使用 window.debugController 访问');
}

// 确保在DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM加载完成，游戏控制器启动中...');
    });
} else {
    console.log('DOM已加载，游戏控制器启动中...');
}