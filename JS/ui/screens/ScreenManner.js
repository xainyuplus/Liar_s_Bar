/**
 * ScreenManager.js - 统一屏幕管理器
 * 负责管理所有游戏场景的切换和状态
 */

class ScreenManager {
    constructor() {
        this.currentScreen = 'lobby';
        this.screens = new Map();
        this.history = ['lobby'];
        this.maxHistory = 10;
        
        this.init();
    }
    
    /**
     * 初始化屏幕管理器
     */
    init() {
        // 注册所有屏幕
        this.registerScreen('lobby', {
            element: document.getElementById('lobby-screen'),
            onEnter: this.onEnterLobby.bind(this),
            onExit: this.onExitLobby.bind(this)
        });
        
        this.registerScreen('waiting', {
            element: document.getElementById('waiting-room-screen'),
            onEnter: this.onEnterWaiting.bind(this),
            onExit: this.onExitWaiting.bind(this)
        });
        
        this.registerScreen('game', {
            element: document.getElementById('game-screen'),
            onEnter: this.onEnterGame.bind(this),
            onExit: this.onExitGame.bind(this)
        });
        
        this.registerScreen('game-over', {
            element: document.getElementById('game-over-screen'),
            onEnter: this.onEnterGameOver.bind(this),
            onExit: this.onExitGameOver.bind(this)
        });
        
        // 初始显示大厅
        this.showScreen('lobby');
    }
    
    /**
     * 注册屏幕
     */
    registerScreen(name, config) {
        this.screens.set(name, {
            element: config.element,
            onEnter: config.onEnter || (() => {}),
            onExit: config.onExit || (() => {}),
            data: {}
        });
    }
    
    /**
     * 显示指定屏幕
     */
    showScreen(screenName, data = {}) {
        const screen = this.screens.get(screenName);
        if (!screen || !screen.element) {
            console.error(`屏幕不存在: ${screenName}`);
            return false;
        }
        
        // 执行当前屏幕的退出逻辑
        if (this.currentScreen !== screenName) {
            const currentScreenObj = this.screens.get(this.currentScreen);
            if (currentScreenObj) {
                currentScreenObj.onExit(data);
            }
        }
        
        // 隐藏所有屏幕
        this.screens.forEach((screenObj, name) => {
            if (screenObj.element) {
                screenObj.element.classList.add('hidden');
                screenObj.element.classList.remove('active');
            }
        });
        
        // 显示目标屏幕
        screen.element.classList.remove('hidden');
        screen.element.classList.add('active');
        
        // 更新body类名
        document.body.className = `screen-${screenName}`;
        
        // 记录历史
        if (this.currentScreen !== screenName) {
            this.history.push(screenName);
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }
        }
        
        // 更新当前屏幕
        const previousScreen = this.currentScreen;
        this.currentScreen = screenName;
        
        // 执行进入逻辑
        screen.data = data;
        screen.onEnter(data, previousScreen);
        
        console.log(`切换到屏幕: ${screenName}`);
        return true;
    }
    
    /**
     * 返回上一个屏幕
     */
    goBack() {
        if (this.history.length > 1) {
            this.history.pop(); // 移除当前屏幕
            const previousScreen = this.history[this.history.length - 1];
            this.showScreen(previousScreen);
        }
    }
    
    /**
     * 获取当前屏幕
     */
    getCurrentScreen() {
        return this.currentScreen;
    }
    
    /**
     * 获取屏幕历史
     */
    getHistory() {
        return [...this.history];
    }
    
    // ===== 屏幕生命周期方法 =====
    
    /**
     * 进入大厅屏幕
     */
    onEnterLobby(data, previousScreen) {
        // 重置表单
        document.getElementById('player-name').value = '';
        document.getElementById('room-code').value = '';
        
        // 重置房间选项
        selectRoomOption('create');
        
        // 如果是从游戏中返回，清理游戏状态
        if (previousScreen === 'game' || previousScreen === 'waiting') {
            if (window.gameState) {
                window.gameState.resetRoom();
            }
        }
        
        // 聚焦到昵称输入框
        setTimeout(() => {
            document.getElementById('player-name').focus();
        }, 100);
    }
    
    /**
     * 退出大厅屏幕
     */
    onExitLobby(data) {
        // 可以在这里保存表单数据等
    }
    
    /**
     * 进入等待房间屏幕
     */
    onEnterWaiting(data, previousScreen) {
        // 显示房间代码
        if (data.roomCode) {
            document.getElementById('room-code-display').textContent = data.roomCode;
        }
        
        // 更新玩家列表
        this.updateWaitingPlayers(data.players || []);
        
        // 显示/隐藏开始游戏按钮
        const startBtn = document.getElementById('start-game-host-btn');
        const waitingMsg = document.getElementById('waiting-message');
        
        if (data.isHost) {
            startBtn.classList.remove('hidden');
            waitingMsg.textContent = '点击开始游戏';
        } else {
            startBtn.classList.add('hidden');
            waitingMsg.textContent = '等待房主开始游戏...';
        }
    }
    
    /**
     * 退出等待房间屏幕
     */
    onExitWaiting(data) {
        // 清理等待室状态
    }
    
    /**
     * 进入游戏屏幕
     */
    onEnterGame(data, previousScreen) {
        // 初始化游戏界面
        if (window.gameController) {
            window.gameController.updateUI();
        }
        
        // 开始游戏音效
        if (window.soundManager) {
            window.soundManager.play('game_start');
        }
    }
    
    /**
     * 退出游戏屏幕
     */
    onExitGame(data) {
        // 可以在这里保存游戏设置等
    }
    
    /**
     * 进入游戏结束屏幕
     */
    onEnterGameOver(data, previousScreen) {
        // 显示胜利者
        if (data.winner) {
            const winnerDisplay = document.getElementById('winner-display');
            if (winnerDisplay) {
                winnerDisplay.textContent = `🎉 ${data.winner.name} 获胜！`;
            }
        }
        
        // 显示游戏统计
        this.updateGameOverStats(data.stats);
        
        // 显示最终排名
        this.updateFinalRanking(data.finalRanking);
        
        // 播放结束音效
        if (window.soundManager) {
            const isWinner = data.winner && data.winner.id === window.gameState?.playerId;
            window.soundManager.play(isWinner ? 'victory' : 'defeat');
        }
    }
    
    /**
     * 退出游戏结束屏幕
     */
    onExitGameOver(data) {
        // 清理结束画面
    }
    
    // ===== 辅助方法 =====
    
    /**
     * 更新等待室玩家列表
     */
    updateWaitingPlayers(players) {
        const container = document.getElementById('waiting-players-grid');
        const countEl = document.getElementById('player-count');
        
        if (!container) return;
        
        container.innerHTML = '';
        countEl.textContent = players.length;
        
        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'waiting-player';
            playerDiv.innerHTML = `
                <div class="player-avatar">👤</div>
                <div class="player-name">${player.name}</div>
                <div class="player-status">${player.isHost ? '👑 房主' : '✅ 已准备'}</div>
            `;
            container.appendChild(playerDiv);
        });
        
        // 添加空位置
        const maxPlayers = 8;
        for (let i = players.length; i < maxPlayers; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'waiting-player empty';
            emptyDiv.innerHTML = `
                <div class="player-avatar">⚬</div>
                <div class="player-name">等待加入...</div>
                <div class="player-status">-</div>
            `;
            container.appendChild(emptyDiv);
        }
    }
    
    /**
     * 更新游戏结束统计
     */
    updateGameOverStats(stats) {
        const statsContainer = document.getElementById('game-stats');
        if (!statsContainer || !stats) return;
        
        const duration = this.formatDuration(stats.duration || 0);
        
        statsContainer.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">游戏时长:</span>
                <span class="stat-value">${duration}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">总回合数:</span>
                <span class="stat-value">${stats.rounds || 0}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">质疑次数:</span>
                <span class="stat-value">${stats.challenges || 0}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">轮盘赌次数:</span>
                <span class="stat-value">${stats.roulettes || 0}</span>
            </div>
        `;
    }
    
    /**
     * 更新最终排名
     */
    updateFinalRanking(ranking) {
        const rankingContainer = document.getElementById('final-ranking');
        if (!rankingContainer || !ranking) return;
        
        rankingContainer.innerHTML = `
            <h3>🏆 最终排名</h3>
            <div class="ranking-list">
                ${ranking.map((player, index) => `
                    <div class="ranking-item ${player.id === window.gameState?.playerId ? 'my-rank' : ''}">
                        <span class="rank">${this.getRankIcon(index + 1)}</span>
                        <span class="player-name">${player.name}</span>
                        <span class="elimination-info">${player.eliminationRound ? `第${player.eliminationRound}回合淘汰` : '获胜'}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * 获取排名图标
     */
    getRankIcon(rank) {
        const icons = {
            1: '🥇',
            2: '🥈', 
            3: '🥉'
        };
        return icons[rank] || `#${rank}`;
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
     * 显示模态框
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('active');
            
            // 添加背景点击关闭
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modalId);
                }
            });
        }
    }
    
    /**
     * 隐藏模态框
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('active');
        }
    }
    
    /**
     * 显示轮盘赌模态框
     */
    showRouletteModal(playerId) {
        const player = window.gameState?.getPlayer(playerId);
        const playerName = player ? player.name : '未知玩家';
        
        document.getElementById('roulette-player').textContent = `${playerName} 正在进行轮盘赌...`;
        
        // 显示/隐藏开枪按钮
        const spinBtn = document.getElementById('spin-btn');
        if (window.gameState?.isMyRoulette()) {
            spinBtn.classList.remove('hidden');
        } else {
            spinBtn.classList.add('hidden');
        }
        
        // 重置轮盘状态
        document.getElementById('roulette-result').textContent = '';
        document.getElementById('roulette-wheel').classList.remove('spinning');
        
        this.showModal('roulette-modal');
    }
    
    /**
     * 隐藏轮盘赌模态框
     */
    hideRouletteModal() {
        this.hideModal('roulette-modal');
    }
    
    /**
     * 显示游戏菜单
     */
    showGameMenu() {
        this.showModal('game-menu-modal');
    }
    
    /**
     * 关闭游戏菜单
     */
    closeGameMenu() {
        this.hideModal('game-menu-modal');
    }
    
    /**
     * 检查屏幕是否存在
     */
    hasScreen(screenName) {
        return this.screens.has(screenName);
    }
    
    /**
     * 获取屏幕数据
     */
    getScreenData(screenName) {
        const screen = this.screens.get(screenName);
        return screen ? screen.data : null;
    }
    
    /**
     * 设置屏幕数据
     */
    setScreenData(screenName, data) {
        const screen = this.screens.get(screenName);
        if (screen) {
            screen.data = { ...screen.data, ...data };
        }
    }
    
    /**
     * 添加屏幕切换动画
     */
    addTransitionEffect(fromScreen, toScreen) {
        // 可以在这里添加屏幕切换的动画效果
        const fromElement = this.screens.get(fromScreen)?.element;
        const toElement = this.screens.get(toScreen)?.element;
        
        if (fromElement && toElement) {
            // 添加淡出效果
            fromElement.style.transition = 'opacity 0.3s ease-out';
            fromElement.style.opacity = '0';
            
            setTimeout(() => {
                fromElement.classList.add('hidden');
                fromElement.style.opacity = '1';
                fromElement.style.transition = '';
                
                // 添加淡入效果
                toElement.style.opacity = '0';
                toElement.classList.remove('hidden');
                toElement.style.transition = 'opacity 0.3s ease-in';
                
                setTimeout(() => {
                    toElement.style.opacity = '1';
                    setTimeout(() => {
                        toElement.style.transition = '';
                    }, 300);
                }, 50);
            }, 300);
        }
    }
    
    /**
     * 响应式屏幕适配
     */
    handleResize() {
        const currentScreenObj = this.screens.get(this.currentScreen);
        if (currentScreenObj && currentScreenObj.onResize) {
            currentScreenObj.onResize();
        }
    }
    
    /**
     * 键盘快捷键处理
     */
    handleKeyboard(event) {
        // ESC键返回上一屏幕
        if (event.key === 'Escape') {
            // 如果有模态框打开，先关闭模态框
            const activeModals = document.querySelectorAll('.modal.active');
            if (activeModals.length > 0) {
                activeModals.forEach(modal => {
                    modal.classList.remove('active');
                    modal.classList.add('hidden');
                });
                return;
            }
            
            // 否则返回上一屏幕
            if (this.currentScreen !== 'lobby') {
                this.goBack();
            }
        }
        
        // F11切换全屏
        if (event.key === 'F11') {
            event.preventDefault();
            this.toggleFullscreen();
        }
    }
    
    /**
     * 切换全屏
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('无法进入全屏模式:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    /**
     * 获取调试信息
     */
    getDebugInfo() {
        return {
            currentScreen: this.currentScreen,
            history: this.history,
            screens: Array.from(this.screens.keys()),
            screenData: Object.fromEntries(
                Array.from(this.screens.entries()).map(([name, screen]) => [name, screen.data])
            )
        };
    }
    
    /**
     * 销毁屏幕管理器
     */
    destroy() {
        // 移除事件监听器
        window.removeEventListener('resize', this.handleResize.bind(this));
        window.removeEventListener('keydown', this.handleKeyboard.bind(this));
        
        // 清理屏幕数据
        this.screens.clear();
        this.history = [];
        
        console.log('ScreenManager已销毁');
    }
}

// 创建全局屏幕管理器实例
window.screenManager = new ScreenManager();

// 绑定全局事件
window.addEventListener('resize', () => {
    window.screenManager.handleResize();
});

window.addEventListener('keydown', (event) => {
    window.screenManager.handleKeyboard(event);
});

// 全局函数（供HTML中的onclick使用）
window.showScreen = (screenName, data) => window.screenManager.showScreen(screenName, data);
window.showRouletteModal = (playerId) => window.screenManager.showRouletteModal(playerId);
window.hideRouletteModal = () => window.screenManager.hideRouletteModal();
window.showGameMenu = () => window.screenManager.showGameMenu();
window.closeGameMenu = () => window.screenManager.closeGameMenu();

// 开发环境调试工具
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    window.debugScreenManager = {
        getInfo: () => window.screenManager.getDebugInfo(),
        showScreen: (name, data) => window.screenManager.showScreen(name, data),
        getCurrentScreen: () => window.screenManager.getCurrentScreen(),
        getHistory: () => window.screenManager.getHistory()
    };
    
    console.log('屏幕管理器调试工具已加载，使用 window.debugScreenManager 访问');
}