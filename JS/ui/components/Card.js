// Card component 
/**
 * components/Card.js - 单个卡牌组件
 * 负责单张卡牌的渲染、交互和动画
 */

class Card {
    constructor(cardData, options = {}) {
        this.id = cardData.id;
        this.value = cardData.value; // 'J', 'Q', 'K', 'joker'
        this.selected = false;
        this.clickable = options.clickable !== false;
        this.faceUp = options.faceUp !== false;
        this.element = null;
        
        // 卡牌样式配置
        this.config = {
            'J': { 
                display: 'J', 
                color: '#2c3e50', 
                symbol: '♠',
                bgColor: '#ecf0f1'
            },
            'Q': { 
                display: 'Q', 
                color: '#e74c3c', 
                symbol: '♥',
                bgColor: '#ecf0f1'
            },
            'K': { 
                display: 'K', 
                color: '#3498db', 
                symbol: '♦',
                bgColor: '#ecf0f1'
            },
            'joker': { 
                display: '★', 
                color: '#f39c12', 
                symbol: '✦',
                bgColor: '#fef9e7'
            }
        };
        
        this.callbacks = {
            onClick: options.onClick || (() => {}),
            onHover: options.onHover || (() => {}),
            onDoubleClick: options.onDoubleClick || (() => {})
        };
        
        this.createElement();
    }
    
    /**
     * 创建卡牌DOM元素
     */
    createElement() {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.cardId = this.id;
        cardDiv.dataset.value = this.value;
        
        // 设置基础样式
        this.setupBaseStyles(cardDiv);
        
        // 设置内容
        this.updateContent(cardDiv);
        
        // 设置交互
        this.setupInteractions(cardDiv);
        
        this.element = cardDiv;
        return cardDiv;
    }
    
    /**
     * 设置基础样式
     */
    setupBaseStyles(element) {
        const config = this.getConfig();
        
        element.style.cssText += `
            background-color: ${config.bgColor};
            color: ${config.color};
            border: 2px solid ${this.selected ? '#3498db' : '#bdc3c7'};
            transform: ${this.selected ? 'translateY(-8px)' : 'translateY(0)'};
            box-shadow: ${this.selected ? '0 6px 15px rgba(52, 152, 219, 0.3)' : '0 2px 5px rgba(0,0,0,0.1)'};
        `;
        
        if (!this.clickable) {
            element.classList.add('disabled');
        }
        
        if (!this.faceUp) {
            element.classList.add('hidden');
        }
    }
    
    /**
     * 更新卡牌内容
     */
    updateContent(element) {
        if (!this.faceUp) {
            element.innerHTML = '<span style="color: #7f8c8d;">?</span>';
            return;
        }
        
        const config = this.getConfig();
        
        // 创建卡牌内容结构
        element.innerHTML = `
            <div class="card-content">
                <div class="card-value">${config.display}</div>
                <div class="card-symbol">${config.symbol}</div>
            </div>
        `;
        
        // 设置内容样式
        const contentDiv = element.querySelector('.card-content');
        if (contentDiv) {
            contentDiv.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                font-weight: bold;
            `;
        }
        
        const valueDiv = element.querySelector('.card-value');
        if (valueDiv) {
            valueDiv.style.fontSize = '16px';
        }
        
        const symbolDiv = element.querySelector('.card-symbol');
        if (symbolDiv) {
            symbolDiv.style.fontSize = '12px';
            symbolDiv.style.marginTop = '2px';
        }
    }
    
    /**
     * 设置交互事件
     */
    setupInteractions(element) {
        if (!this.clickable) return;
        
        // 点击事件
        element.addEventListener('click', (event) => {
            event.preventDefault();
            this.handleClick();
        });
        
        // 双击事件
        element.addEventListener('dblclick', (event) => {
            event.preventDefault();
            this.callbacks.onDoubleClick(this);
        });
        
        // 悬停效果
        element.addEventListener('mouseenter', () => {
            if (this.clickable && !this.selected) {
                element.style.transform = 'translateY(-3px)';
                element.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
            }
            this.callbacks.onHover(this, true);
        });
        
        element.addEventListener('mouseleave', () => {
            if (this.clickable && !this.selected) {
                element.style.transform = 'translateY(0)';
                element.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            }
            this.callbacks.onHover(this, false);
        });
        
        // 键盘支持
        element.setAttribute('tabindex', '0');
        element.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.handleClick();
            }
        });
    }
    
    /**
     * 处理点击事件
     */
    handleClick() {
        if (!this.clickable) return;
        
        this.toggle();
        this.callbacks.onClick(this);
    }
    
    /**
     * 切换选中状态
     */
    toggle() {
        this.setSelected(!this.selected);
    }
    
    /**
     * 设置选中状态
     */
    setSelected(selected) {
        this.selected = selected;
        this.updateVisualState();
    }
    
    /**
     * 更新视觉状态
     */
    updateVisualState() {
        if (!this.element) return;
        
        const config = this.getConfig();
        
        if (this.selected) {
            this.element.style.border = '2px solid #3498db';
            this.element.style.transform = 'translateY(-8px)';
            this.element.style.boxShadow = '0 6px 15px rgba(52, 152, 219, 0.3)';
            this.element.style.backgroundColor = '#e8f4fd';
        } else {
            this.element.style.border = '2px solid #bdc3c7';
            this.element.style.transform = 'translateY(0)';
            this.element.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            this.element.style.backgroundColor = config.bgColor;
        }
    }
    
    /**
     * 设置可点击状态
     */
    setClickable(clickable) {
        this.clickable = clickable;
        
        if (this.element) {
            if (clickable) {
                this.element.classList.remove('disabled');
                this.element.style.cursor = 'pointer';
                this.element.style.opacity = '1';
            } else {
                this.element.classList.add('disabled');
                this.element.style.cursor = 'not-allowed';
                this.element.style.opacity = '0.6';
            }
        }
    }
    
    /**
     * 翻转卡牌
     */
    flip(faceUp) {
        this.faceUp = faceUp;
        this.updateContent(this.element);
        
        if (this.element) {
            if (faceUp) {
                this.element.classList.remove('hidden');
            } else {
                this.element.classList.add('hidden');
            }
        }
    }
    
    /**
     * 播放出牌动画
     */
    playAnimation(animationType = 'play') {
        if (!this.element) return;
        
        switch (animationType) {
            case 'play':
                this.animatePlay();
                break;
            case 'deal':
                this.animateDeal();
                break;
            case 'flip':
                this.animateFlip();
                break;
            case 'shake':
                this.animateShake();
                break;
        }
    }
    
    /**
     * 出牌动画
     */
    animatePlay() {
        this.element.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.element.style.transform = 'translateY(-100px) scale(0.8) rotateZ(15deg)';
        this.element.style.opacity = '0';
        
        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }, 600);
    }
    
    /**
     * 发牌动画
     */
    animateDeal() {
        this.element.style.opacity = '0';
        this.element.style.transform = 'translateX(-200px) rotateY(180deg)';
        this.element.style.transition = 'all 0.8s ease-out';
        
        setTimeout(() => {
            this.element.style.opacity = '1';
            this.element.style.transform = 'translateX(0) rotateY(0deg)';
        }, 100);
    }
    
    /**
     * 翻牌动画
     */
    animateFlip() {
        this.element.style.transition = 'transform 0.3s';
        this.element.style.transform = 'rotateY(90deg)';
        
        setTimeout(() => {
            this.updateContent(this.element);
            this.element.style.transform = 'rotateY(0deg)';
        }, 150);
    }
    
    /**
     * 震动动画
     */
    animateShake() {
        this.element.style.animation = 'cardShake 0.5s ease-in-out';
        
        setTimeout(() => {
            this.element.style.animation = '';
        }, 500);
    }
    
    /**
     * 获取卡牌配置
     */
    getConfig() {
        return this.config[this.value] || {
            display: '?',
            color: '#7f8c8d',
            symbol: '',
            bgColor: '#ecf0f1'
        };
    }
    
    /**
     * 获取DOM元素
     */
    getElement() {
        return this.element;
    }
    
    /**
     * 销毁卡牌
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.callbacks = null;
    }
    
    /**
     * 获取卡牌数据
     */
    getData() {
        return {
            id: this.id,
            value: this.value,
            selected: this.selected,
            faceUp: this.faceUp
        };
    }
}

// 添加CSS动画
if (!document.querySelector('#card-animations')) {
    const style = document.createElement('style');
    style.id = 'card-animations';
    style.textContent = `
        @keyframes cardShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        .card {
            transition: all 0.2s ease;
        }
        
        .card.disabled {
            pointer-events: none;
        }
        
        .card.hidden {
            background-color: #34495e !important;
            color: #7f8c8d !important;
        }
    `;
    document.head.appendChild(style);
}

// 导出Card类
window.Card = Card;