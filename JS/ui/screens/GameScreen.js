// Game screen 
/**
 * screens/GameScreen.js - 游戏屏幕管理
 * 负责游戏界面的整体布局和显示逻辑
 */

class GameScreen {
    constructor() {
        this.playersContainer = document.getElementById('other-players');
        this.deskContainer = document.getElementById('desk-cards');
        this.deskInfo = document.getElementById('desk-info');
        
        this.playerHands = new Map(); // playerId -> Hand instance
        
        this.init();
    }
    
    /**
     * 初始化游戏屏幕
     */
    init() {
        this.setupContainers();
    }
    
    /**
     * 设置容器
     */
    setupContainers() {
        if (this.playersContainer) {
            this.playersContainer.style.cssText += `
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            `;
        }
        
        if (this.deskContainer) {
            this.deskContainer.style.cssText += `
                display: flex;
                gap: 8px;
                justify-content: center;
                min-height: 60px;
                align-items: center;
            `;
        }
    }
    
    /**
     * 更新玩家显示
     */
    updatePlayers(players) {
        if (!this.playersContainer) return;
        
        // 清空现有内容
        this.playersContainer.innerHTML = '';
        this.playerHands.clear();
        
        players.forEach(player => {
            const playerElement = this.createPlayerElement(player);
            this.playersContainer.appendChild(playerElement);
        });
    }
    
    /**
     * 创建玩家元素
     */
    createPlayerElement(player) {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-info';
        playerDiv.dataset.playerId = player.id;
        
        // 添加状态样式
        if (player.id === window.gameState?.currentPlayerId) {
            playerDiv.classList.add('current-player');
        }
        
        if (player.isAlive === false) {
            playerDiv.classList.add('eliminated');
        }
        
        // 创建玩家头部
        const headerDiv = document.createElement('div');
        headerDiv.className = 'player-header';
        headerDiv.innerHTML = `
            <span class="player-name">${player.name}${player.isHost ? ' (房主)' : ''}</span>
            <span class="player-hp">❤️ ${player.hp || 2}</span>
        `;
        
        // 创建手牌容器
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'player-cards';
        cardsContainer.id = `player-cards-${player.id}`;
        
        // 创建该玩家的Hand实例
        const playerHand = new Hand(cardsContainer, {
            selectable: false,
            faceUp: false,
            maxSelection: 0
        });
        
        // 设置手牌（显示为背面）
        const hiddenCards = Array(player.handCount || 0).fill(null).map((_, index) => ({
            id: `hidden-${player.id}-${index}`,
            value: 'unknown'
        }));
        
        playerHand.setCards(hiddenCards);
        this.playerHands.set(player.id, playerHand);
        
        playerDiv.appendChild(headerDiv);
        playerDiv.appendChild(cardsContainer);
        
        return playerDiv;
    }
    
    /**
     * 更新桌面卡牌
     */
    updateDeskCards(deskCards) {
        if (!this.deskContainer || !this.deskInfo) return;
        
        // 清空现有内容
        this.deskContainer.innerHTML = '';
        
        if (!deskCards || deskCards.length === 0) {
            this.deskInfo.textContent = '桌面: 等待出牌';
            this.deskContainer.innerHTML = '<div style="color: #7f8c8d; font-style: italic;">桌面无牌</div>';
            return;
        }
        
        // 更新桌面信息
        const gameState = window.gameState;
        if (gameState && gameState.lastPlayerId) {
            const lastPlayer = gameState.getPlayer(gameState.lastPlayerId);
            const playerName = lastPlayer ? lastPlayer.name : '未知玩家';
            this.deskInfo.textContent = `${playerName} 声称出了 ${gameState.lastPlayedCount} 张 ${gameState.lastDeclaredValue}`;
        }
        
        // 渲染桌面卡牌
        deskCards.forEach((cardData, index) => {
            const cardElement = this.createDeskCard(cardData, index);
            this.deskContainer.appendChild(cardElement);
        });
    }
    
    /**
     * 创建桌面卡牌
     */
    createDeskCard(cardData, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.index = index;
        
        if (cardData.revealed && cardData.value) {
            // 显示真实卡牌（质疑后）
            const card = new Card({
                id: `desk-${index}`,
                value: cardData.value
            }, {
                clickable: false,
                faceUp: true
            });
            return card.getElement();
        } else {
            // 显示背面（正常出牌）
            cardDiv.classList.add('hidden');
            cardDiv.textContent = '?';
            cardDiv.style.cssText = `
                background-color: #34495e;
                color: #7f8c8d;
                width: 35px;
                height: 50px;
                display: flex;
                justify-content: center;
                align-items: center;
                border: 1px solid #7f8c8d;
                border-radius: 4px;
                font-weight: bold;
            `;
        }
        
        return cardDiv;
    }
    
    /**
     * 高亮当前玩家
     */
    highlightCurrentPlayer(currentPlayerId) {
        // 移除所有当前玩家样式
        this.playersContainer.querySelectorAll('.player-info').forEach(el => {
            el.classList.remove('current-player');
        });
        
        // 添加当前玩家样式
        const currentPlayerEl = this.playersContainer.querySelector(`[data-player-id="${currentPlayerId}"]`);
        if (currentPlayerEl) {
            currentPlayerEl.classList.add('current-player');
        }
    }
    
    /**
     * 更新玩家生命值
     */
    updatePlayerHP(playerId, hp) {
        const playerEl = this.playersContainer.querySelector(`[data-player-id="${playerId}"]`);
        if (playerEl) {
            const hpEl = playerEl.querySelector('.player-hp');
            if (hpEl) {
                hpEl.textContent = `❤️ ${hp}`;
                
                // 添加生命值变化动画
                hpEl.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => {
                    hpEl.style.animation = '';
                }, 500);
            }
            
            // 如果生命值为0，标记为淘汰
            if (hp <= 0) {
                playerEl.classList.add('eliminated');
            }
        }
    }
    
    /**
     * 标记玩家为淘汰
     */
    eliminatePlayer(playerId) {
        const playerEl = this.playersContainer.querySelector(`[data-player-id="${playerId}"]`);
        if (playerEl) {
            playerEl.classList.add('eliminated');
            
            // 添加淘汰动画
            playerEl.style.animation = 'fadeOut 1s ease-out';
            setTimeout(() => {
                playerEl.style.animation = '';
            }, 1000);
        }
    }
    
    /**
     * 播放桌面卡牌翻转动画
     */
    flipDeskCards() {
        const cardElements = this.deskContainer.querySelectorAll('.card');
        
        cardElements.forEach((cardEl, index) => {
            setTimeout(() => {
                cardEl.style.transition = 'transform 0.3s';
                cardEl.style.transform = 'rotateY(180deg)';
                
                setTimeout(() => {
                    cardEl.style.transform = 'rotateY(0deg)';
                }, 150);
            }, index * 100);
        });
    }
    
    /**
     * 清空桌面
     */
    clearDesk() {
        if (this.deskContainer) {
            this.deskContainer.innerHTML = '<div style="color: #7f8c8d; font-style: italic;">桌面无牌</div>';
        }
        
        if (this.deskInfo) {
            this.deskInfo.textContent = '桌面: 等待出牌';
        }
    }
    
    /**
     * 获取玩家手牌组件
     */
    getPlayerHand(playerId) {
        return this.playerHands.get(playerId);
    }
    
    /**
     * 更新特定玩家的手牌数量
     */
    updatePlayerHandCount(playerId, handCount) {
        const playerHand = this.playerHands.get(playerId);
        if (playerHand) {
            const hiddenCards = Array(handCount).fill(null).map((_, index) => ({
                id: `hidden-${playerId}-${index}`,
                value: 'unknown'
            }));
            
            playerHand.setCards(hiddenCards);
        }
    }
    
    /**
     * 销毁游戏屏幕
     */
    destroy() {
        // 清理所有Hand实例
        this.playerHands.forEach(hand => {
            hand.destroy();
        });
        this.playerHands.clear();
        
        // 清空容器
        if (this.playersContainer) {
            this.playersContainer.innerHTML = '';
        }
        
        if (this.deskContainer) {
            this.deskContainer.innerHTML = '';
        }
        
        console.log('GameScreen已销毁');
    }
}

// 添加CSS动画
if (!document.querySelector('#gamescreen-animations')) {
    const style = document.createElement('style');
    style.id = 'gamescreen-animations';
    style.textContent = `
        @keyframes fadeOut {
            0% { opacity: 1; transform: scale(1); }
            100% { opacity: 0.3; transform: scale(0.95); }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .player-info.eliminated {
            opacity: 0.5;
            filter: grayscale(100%);
        }
        
        .player-info.current-player {
            border-color: #3498db;
            box-shadow: 0 0 10px rgba(52, 152, 219, 0.3);
        }
    `;
    document.head.appendChild(style);
}

// 导出GameScreen类
window.GameScreen = GameScreen;