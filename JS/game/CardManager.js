// Card manager 
/**
 * CardManager.js - 前端卡牌管理
 * 负责卡牌的显示、选择、交互和UI反馈
 */

class CardManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.selectedCards = [];  // 当前选中的卡牌ID数组
        this.maxSelectCount = 3;  // 最大可选卡牌数量
        
        // 卡牌显示配置
        this.cardConfig = {
            'J': { display: 'J', color: '#2c3e50', symbol: '♠' },
            'Q': { display: 'Q', color: '#e74c3c', symbol: '♥' },
            'K': { display: 'K', color: '#3498db', symbol: '♦' },
            'joker': { display: '★', color: '#f39c12', symbol: '✦' }
        };
    }
    
    /**
     * 渲染我的手牌
     */
    renderMyHand() {
        const handContainer = document.getElementById('my-hand');
        if (!handContainer) return;
        
        handContainer.innerHTML = '';
        
        if (!this.gameState.myHand || this.gameState.myHand.length === 0) {
            handContainer.innerHTML = '<div style="color: #7f8c8d; font-style: italic;">没有手牌</div>';
            return;
        }
        
        this.gameState.myHand.forEach((card, index) => {
            const cardElement = this.createCardElement(card, true);
            cardElement.addEventListener('click', () => this.toggleCardSelection(card.id));
            handContainer.appendChild(cardElement);
        });
        
        this.updateSelectedCards();
    }
    
    /**
     * 渲染其他玩家的手牌（背面）
     */
    renderPlayerHand(playerId, container) {
        if (!container) return;
        
        container.innerHTML = '';
        
        const player = this.gameState.getPlayer(playerId);
        if (!player || player.handCount === 0) {
            container.innerHTML = '<div style="color: #7f8c8d; font-style: italic; font-size: 12px;">无手牌</div>';
            return;
        }
        
        // 显示背面卡牌
        for (let i = 0; i < player.handCount; i++) {
            const cardElement = this.createHiddenCardElement();
            container.appendChild(cardElement);
        }
    }
    
    /**
     * 渲染桌面卡牌
     */
    renderDeskCards() {
        const deskContainer = document.getElementById('desk-cards');
        const deskInfo = document.getElementById('desk-info');
        
        if (!deskContainer || !deskInfo) return;
        
        deskContainer.innerHTML = '';
        
        if (this.gameState.deskCards.length === 0) {
            deskInfo.textContent = '桌面: 等待出牌';
            deskContainer.innerHTML = '<div style="color: #7f8c8d; font-style: italic;">桌面无牌</div>';
            return;
        }
        
        // 更新桌面信息
        const lastPlayer = this.gameState.getPlayer(this.gameState.lastPlayerId);
        const playerName = lastPlayer ? lastPlayer.name : '未知玩家';
        deskInfo.textContent = `${playerName} 声称出了 ${this.gameState.lastPlayedCount} 张 ${this.gameState.lastDeclaredValue}`;
        
        // 渲染桌面卡牌
        this.gameState.deskCards.forEach((card, index) => {
            let cardElement;
            if (card.revealed) {
                // 显示真实卡牌（质疑后）
                cardElement = this.createCardElement({id: `desk-${index}`, value: card.value}, false);
            } else {
                // 显示背面（出牌时）
                cardElement = this.createHiddenCardElement();
                cardElement.textContent = '?';
            }
            deskContainer.appendChild(cardElement);
        });
    }
    
    /**
     * 创建卡牌元素
     */
    createCardElement(card, selectable = false) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.cardId = card.id;
        cardDiv.dataset.value = card.value;
        
        // 获取卡牌配置
        const config = this.cardConfig[card.value] || { display: '?', color: '#7f8c8d', symbol: '' };
        
        // 设置卡牌内容和样式
        cardDiv.textContent = config.display;
        cardDiv.style.color = config.color;
        
        // 如果卡牌可选择，添加相关样式和事件
        if (selectable) {
            cardDiv.style.cursor = 'pointer';
            cardDiv.setAttribute('tabindex', '0');
            
            // 检查是否已选中
            if (this.selectedCards.includes(card.id)) {
                cardDiv.classList.add('selected');
            }
            
            // 如果不是我的回合，禁用卡牌
            if (!this.gameState.isMyTurn()) {
                cardDiv.classList.add('disabled');
                cardDiv.style.cursor = 'not-allowed';
            }
        } else {
            cardDiv.classList.add('disabled');
        }
        
        return cardDiv;
    }
    
    /**
     * 创建隐藏卡牌元素（背面）
     */
    createHiddenCardElement() {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card hidden';
        cardDiv.textContent = '?';
        return cardDiv;
    }
    
    /**
     * 切换卡牌选择状态
     */
    toggleCardSelection(cardId) {
        // 检查是否轮到我
        if (!this.gameState.isMyTurn()) {
            return;
        }
        
        const index = this.selectedCards.indexOf(cardId);
        
        if (index !== -1) {
            // 取消选择
            this.selectedCards.splice(index, 1);
        } else {
            // 选择卡牌
            if (this.selectedCards.length >= this.maxSelectCount) {
                // 如果已达最大选择数，替换最早选择的卡牌
                this.selectedCards.shift();
            }
            this.selectedCards.push(cardId);
        }
        
        this.updateSelectedCards();
        this.notifySelectionChange();
    }
    
    /**
     * 更新选中卡牌的视觉状态
     */
    updateSelectedCards() {
        const handContainer = document.getElementById('my-hand');
        if (!handContainer) return;
        
        // 更新所有卡牌的选中状态
        handContainer.querySelectorAll('.card').forEach(cardEl => {
            const cardId = cardEl.dataset.cardId;
            if (this.selectedCards.includes(cardId)) {
                cardEl.classList.add('selected');
            } else {
                cardEl.classList.remove('selected');
            }
        });
    }
    
    /**
     * 通知选择变化（触发UI更新）
     */
    notifySelectionChange() {
        if (window.updateActionPanel) {
            window.updateActionPanel();
        }
    }
    
    /**
     * 获取选中的卡牌信息
     */
    getSelectedCards() {
        return this.selectedCards.map(cardId => {
            return this.gameState.myHand.find(card => card.id === cardId);
        }).filter(card => card !== undefined);
    }
    
    /**
     * 获取选中卡牌的ID数组
     */
    getSelectedCardIds() {
        return [...this.selectedCards];
    }
    
    /**
     * 清空选中状态
     */
    clearSelection() {
        this.selectedCards = [];
        this.updateSelectedCards();
        this.notifySelectionChange();
    }
    
    /**
     * 验证出牌是否合法
     */
    validatePlayCards() {
        if (this.selectedCards.length === 0) {
            return { valid: false, message: '请至少选择一张卡牌' };
        }
        
        if (this.selectedCards.length > 3) {
            return { valid: false, message: '最多只能出3张卡牌' };
        }
        
        if (!this.gameState.isMyTurn()) {
            return { valid: false, message: '现在不是您的回合' };
        }
        
        return { valid: true };
    }
    
    /**
     * 获取卡牌显示名称
     */
    getCardDisplayName(cardValue) {
        const config = this.cardConfig[cardValue];
        return config ? config.display : cardValue;
    }
    
    /**
     * 检查卡牌是否为目标牌或万能牌
     */
    isValidCard(cardValue, targetCard) {
        return cardValue === targetCard || cardValue === 'joker';
    }
    
    /**
     * 分析选中卡牌的组成
     */
    analyzeSelectedCards() {
        const selectedCards = this.getSelectedCards();
        const analysis = {
            total: selectedCards.length,
            byType: {},
            hasJoker: false,
            allSameType: true,
            firstType: null
        };
        
        selectedCards.forEach(card => {
            const value = card.value;
            analysis.byType[value] = (analysis.byType[value] || 0) + 1;
            
            if (value === 'joker') {
                analysis.hasJoker = true;
            }
            
            if (analysis.firstType === null) {
                analysis.firstType = value;
            } else if (analysis.firstType !== value && value !== 'joker') {
                analysis.allSameType = false;
            }
        });
        
        return analysis;
    }
    
    /**
     * 渲染卡牌统计信息（调试用）
     */
    renderCardStats() {
        const analysis = this.analyzeSelectedCards();
        console.log('选中卡牌分析:', analysis);
        return analysis;
    }
    
    /**
     * 根据游戏状态更新卡牌交互性
     */
    updateCardInteractivity() {
        const handContainer = document.getElementById('my-hand');
        if (!handContainer) return;
        
        const canInteract = this.gameState.isMyTurn() && this.gameState.gamePhase === 'playing';
        
        handContainer.querySelectorAll('.card').forEach(cardEl => {
            if (canInteract) {
                cardEl.classList.remove('disabled');
                cardEl.style.cursor = 'pointer';
            } else {
                cardEl.classList.add('disabled');
                cardEl.style.cursor = 'not-allowed';
            }
        });
    }
    
    /**
     * 添加卡牌动画效果
     */
    animateCardPlay(cardIds) {
        const handContainer = document.getElementById('my-hand');
        if (!handContainer) return;
        
        cardIds.forEach(cardId => {
            const cardEl = handContainer.querySelector(`[data-card-id="${cardId}"]`);
            if (cardEl) {
                // 添加出牌动画
                cardEl.style.transition = 'all 0.5s ease-out';
                cardEl.style.transform = 'translateY(-100px) scale(0.8)';
                cardEl.style.opacity = '0';
                
                // 动画结束后移除元素
                setTimeout(() => {
                    if (cardEl.parentNode) {
                        cardEl.parentNode.removeChild(cardEl);
                    }
                }, 500);
            }
        });
    }
}

// 全局卡牌管理器实例
window.cardManager = new CardManager(window.gameState);