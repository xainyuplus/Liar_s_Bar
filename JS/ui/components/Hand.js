// Hand area 
/**
 * components/Hand.js - 手牌区域组件
 * 负责管理一组卡牌的显示和交互
 */

class Hand {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.cards = new Map(); // cardId -> Card instance
        this.selectedCards = new Set();
        this.maxSelection = options.maxSelection || 3;
        this.selectable = options.selectable !== false;
        this.faceUp = options.faceUp !== false;
        
        this.callbacks = {
            onCardSelect: options.onCardSelect || (() => {}),
            onSelectionChange: options.onSelectionChange || (() => {}),
            onCardDoubleClick: options.onCardDoubleClick || (() => {})
        };
        
        this.setupContainer();
    }
    
    /**
     * 设置容器样式
     */
    setupContainer() {
        if (!this.container) return;
        
        this.container.style.cssText += `
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            min-height: 60px;
            padding: 10px;
        `;
        
        // 添加空状态提示
        this.updateEmptyState();
    }
    
    /**
     * 设置手牌数据
     */
    setCards(cardsData) {
        this.clear();
        
        if (!cardsData || cardsData.length === 0) {
            this.updateEmptyState();
            return;
        }
        
        cardsData.forEach((cardData, index) => {
            this.addCard(cardData, index * 100); // 添加延迟动画
        });
    }
    
    /**
     * 添加单张卡牌
     */
    addCard(cardData, delay = 0) {
        if (!cardData || this.cards.has(cardData.id)) return;
        
        const card = new Card(cardData, {
            clickable: this.selectable,
            faceUp: this.faceUp,
            onClick: (cardInstance) => this.handleCardClick(cardInstance),
            onDoubleClick: (cardInstance) => this.handleCardDoubleClick(cardInstance)
        });
        
        this.cards.set(cardData.id, card);
        
        // 添加到容器
        setTimeout(() => {
            if (this.container) {
                this.container.appendChild(card.getElement());
                card.playAnimation('deal');
            }
        }, delay);
        
        this.updateEmptyState();
    }
    
    /**
     * 移除单张卡牌
     */
    removeCard(cardId, animate = true) {
        const card = this.cards.get(cardId);
        if (!card) return;
        
        // 从选中集合中移除
        this.selectedCards.delete(cardId);
        
        if (animate) {
            card.playAnimation('play');
        } else {
            card.destroy();
        }
        
        this.cards.delete(cardId);
        this.updateEmptyState();
        this.notifySelectionChange();
    }
    
    /**
     * 移除多张卡牌
     */
    removeCards(cardIds, animate = true) {
        cardIds.forEach((cardId, index) => {
            setTimeout(() => {
                this.removeCard(cardId, animate);
            }, index * 100);
        });
    }
    
    /**
     * 处理卡牌点击
     */
    handleCardClick(card) {
        if (!this.selectable) return;
        
        const cardId = card.id;
        const wasSelected = this.selectedCards.has(cardId);
        
        if (wasSelected) {
            // 取消选择
            this.selectedCards.delete(cardId);
            card.setSelected(false);
        } else {
            // 选择卡牌
            if (this.selectedCards.size >= this.maxSelection) {
                // 如果已达最大选择数，取消最早选择的卡牌
                const firstSelected = Array.from(this.selectedCards)[0];
                this.selectedCards.delete(firstSelected);
                const firstCard = this.cards.get(firstSelected);
                if (firstCard) {
                    firstCard.setSelected(false);
                }
            }
            
            this.selectedCards.add(cardId);
            card.setSelected(true);
        }
        
        this.callbacks.onCardSelect(card, !wasSelected);
        this.notifySelectionChange();
    }
    
    /**
     * 处理卡牌双击
     */
    handleCardDoubleClick(card) {
        this.callbacks.onCardDoubleClick(card);
    }
    
    /**
     * 通知选择变化
     */
    notifySelectionChange() {
        const selectedCardsData = this.getSelectedCards();
        this.callbacks.onSelectionChange(selectedCardsData, this.selectedCards.size);
    }
    
    /**
     * 获取选中的卡牌
     */
    getSelectedCards() {
        return Array.from(this.selectedCards).map(cardId => {
            const card = this.cards.get(cardId);
            return card ? card.getData() : null;
        }).filter(card => card !== null);
    }
    
    /**
     * 获取选中的卡牌ID
     */
    getSelectedCardIds() {
        return Array.from(this.selectedCards);
    }
    
    /**
     * 清空选择
     */
    clearSelection() {
        this.selectedCards.forEach(cardId => {
            const card = this.cards.get(cardId);
            if (card) {
                card.setSelected(false);
            }
        });
        
        this.selectedCards.clear();
        this.notifySelectionChange();
    }
    
    /**
     * 选择所有卡牌
     */
    selectAll() {
        if (!this.selectable) return;
        
        this.clearSelection();
        
        const cardIds = Array.from(this.cards.keys());
        const toSelect = cardIds.slice(0, this.maxSelection);
        
        toSelect.forEach(cardId => {
            const card = this.cards.get(cardId);
            if (card) {
                card.setSelected(true);
                this.selectedCards.add(cardId);
            }
        });
        
        this.notifySelectionChange();
    }
    
    /**
     * 设置可选择状态
     */
    setSelectable(selectable) {
        this.selectable = selectable;
        
        this.cards.forEach(card => {
            card.setClickable(selectable);
        });
    }
    
    /**
     * 翻转所有卡牌
     */
    flipCards(faceUp) {
        this.faceUp = faceUp;
        
        this.cards.forEach((card, cardId) => {
            setTimeout(() => {
                card.flip(faceUp);
            }, Math.random() * 300);
        });
    }
    
    /**
     * 设置最大选择数量
     */
    setMaxSelection(maxSelection) {
        this.maxSelection = maxSelection;
        
        // 如果当前选择数量超过新的最大值，移除多余的选择
        if (this.selectedCards.size > maxSelection) {
            const selectedArray = Array.from(this.selectedCards);
            const toRemove = selectedArray.slice(maxSelection);
            
            toRemove.forEach(cardId => {
                const card = this.cards.get(cardId);
                if (card) {
                    card.setSelected(false);
                }
                this.selectedCards.delete(cardId);
            });
            
            this.notifySelectionChange();
        }
    }
    
    /**
     * 更新空状态显示
     */
    updateEmptyState() {
        if (!this.container) return;
        
        let emptyDiv = this.container.querySelector('.hand-empty');
        
        if (this.cards.size === 0) {
            // 显示空状态
            if (!emptyDiv) {
                emptyDiv = document.createElement('div');
                emptyDiv.className = 'hand-empty';
                emptyDiv.style.cssText = `
                    color: #7f8c8d;
                    font-style: italic;
                    text-align: center;
                    padding: 20px;
                    width: 100%;
                `;
                emptyDiv.textContent = this.faceUp ? '无手牌' : '等待发牌...';
                this.container.appendChild(emptyDiv);
            }
        } else {
            // 移除空状态
            if (emptyDiv) {
                emptyDiv.remove();
            }
        }
    }
    
    /**
     * 排序卡牌
     */
    sortCards(compareFn) {
        if (!this.container) return;
        
        const cardElements = Array.from(this.container.querySelectorAll('.card'));
        const cardsData = Array.from(this.cards.values()).map(card => card.getData());
        
        // 排序
        cardsData.sort(compareFn || ((a, b) => {
            const order = { 'J': 1, 'Q': 2, 'K': 3, 'joker': 4 };
            return (order[a.value] || 0) - (order[b.value] || 0);
        }));
        
        // 重新排列DOM元素
        cardsData.forEach((cardData, index) => {
            const card = this.cards.get(cardData.id);
            if (card && card.getElement()) {
                this.container.appendChild(card.getElement());
            }
        });
    }
    
    /**
     * 统计卡牌
     */
    getCardStats() {
        const stats = {
            total: this.cards.size,
            selected: this.selectedCards.size,
            byType: {}
        };
        
        this.cards.forEach(card => {
            const value = card.value;
            stats.byType[value] = (stats.byType[value] || 0) + 1;
        });
        
        return stats;
    }
    
    /**
     * 播放整体动画
     */
    playAnimation(animationType = 'shuffle') {
        switch (animationType) {
            case 'shuffle':
                this.animateShuffle();
                break;
            case 'fan':
                this.animateFan();
                break;
            case 'stack':
                this.animateStack();
                break;
        }
    }
    
    /**
     * 洗牌动画
     */
    animateShuffle() {
        const cardElements = Array.from(this.container.querySelectorAll('.card'));
        
        cardElements.forEach((element, index) => {
            setTimeout(() => {
                element.style.transition = 'transform 0.3s ease-in-out';
                element.style.transform = `translateY(${Math.random() * 20 - 10}px) rotateZ(${Math.random() * 10 - 5}deg)`;
                
                setTimeout(() => {
                    element.style.transform = 'translateY(0) rotateZ(0deg)';
                }, 300);
            }, index * 50);
        });
    }
    
    /**
     * 扇形展开动画
     */
    animateFan() {
        const cardElements = Array.from(this.container.querySelectorAll('.card'));
        const totalCards = cardElements.length;
        
        cardElements.forEach((element, index) => {
            const angle = (index - (totalCards - 1) / 2) * 5; // 每张牌间隔5度
            const translateY = Math.abs(angle) * 2; // 弧形效果
            
            element.style.transition = 'transform 0.5s ease-out';
            element.style.transform = `rotateZ(${angle}deg) translateY(-${translateY}px)`;
            element.style.transformOrigin = 'center bottom';
        });
    }
    
    /**
     * 叠牌动画
     */
    animateStack() {
        const cardElements = Array.from(this.container.querySelectorAll('.card'));
        
        cardElements.forEach((element, index) => {
            element.style.transition = 'transform 0.4s ease-out';
            element.style.transform = `translateX(${index * 2}px) translateY(${index * -1}px)`;
            element.style.zIndex = cardElements.length - index;
        });
    }
    
    /**
     * 高亮特定卡牌
     */
    highlightCards(cardIds, highlightClass = 'highlighted') {
        // 先移除所有高亮
        this.cards.forEach(card => {
            const element = card.getElement();
            if (element) {
                element.classList.remove(highlightClass);
            }
        });
        
        // 添加新的高亮
        cardIds.forEach(cardId => {
            const card = this.cards.get(cardId);
            if (card) {
                const element = card.getElement();
                if (element) {
                    element.classList.add(highlightClass);
                }
            }
        });
    }
    
    /**
     * 清空所有卡牌
     */
    clear() {
        this.cards.forEach(card => {
            card.destroy();
        });
        
        this.cards.clear();
        this.selectedCards.clear();
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        this.updateEmptyState();
    }
    
    /**
     * 获取卡牌数量
     */
    getCardCount() {
        return this.cards.size;
    }
    
    /**
     * 检查是否有指定卡牌
     */
    hasCard(cardId) {
        return this.cards.has(cardId);
    }
    
    /**
     * 获取指定卡牌
     */
    getCard(cardId) {
        return this.cards.get(cardId);
    }
    
    /**
     * 获取所有卡牌数据
     */
    getAllCards() {
        return Array.from(this.cards.values()).map(card => card.getData());
    }
    
    /**
     * 设置卡牌提示
     */
    setCardTooltip(cardId, tooltip) {
        const card = this.cards.get(cardId);
        if (card) {
            const element = card.getElement();
            if (element) {
                element.title = tooltip;
            }
        }
    }
    
    /**
     * 销毁手牌区域
     */
    destroy() {
        this.clear();
        this.callbacks = null;
        this.container = null;
    }
}

// 添加CSS样式
if (!document.querySelector('#hand-styles')) {
    const style = document.createElement('style');
    style.id = 'hand-styles';
    style.textContent = `
        .hand-empty {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }
        
        .card.highlighted {
            border-color: #f1c40f !important;
            box-shadow: 0 0 20px rgba(241, 196, 15, 0.6) !important;
            animation: glow 1.5s infinite alternate;
        }
        
        @keyframes glow {
            from { box-shadow: 0 0 20px rgba(241, 196, 15, 0.6); }
            to { box-shadow: 0 0 30px rgba(241, 196, 15, 0.9); }
        }
    `;
    document.head.appendChild(style);
}

// 导出Hand类
window.Hand = Hand;