/**
 * socket-client.js - Socket.IO客户端连接和事件管理
 * 负责建立连接、处理断线重连、基础事件监听
 */

class SocketClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.gameEventHandlers = new Map();
        
        this.init();
    }
    
    /**
     * 初始化Socket连接
     */
    init() {
        try {
            this.socket = io({
                autoConnect: true,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: this.maxReconnectAttempts,
                timeout: 20000
            });
            
            this.setupBaseEvents();
            
        } catch (error) {
            console.error('Socket.IO初始化失败:', error);
        }
    }
    
    /**
     * 设置基础连接事件
     */
    setupBaseEvents() {
        // 连接成功
        this.socket.on('connect', () => {
            console.log('Socket.IO连接成功, ID:', this.socket.id);
            this.connected = true;
            this.reconnectAttempts = 0;
            
            // 尝试重新加入游戏
            this.rejoinGameIfNeeded();
            
            // 触发连接成功回调
            this.emit('socket_connected');
        });
        
        // 连接断开
        this.socket.on('disconnect', (reason) => {
            console.log('Socket.IO连接断开:', reason);
            this.connected = false;
            
            // 显示断线提示
            this.showConnectionStatus('连接已断开，尝试重连中...');
            
            this.emit('socket_disconnected', reason);
        });
        
        // 重连尝试
        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`Socket.IO重连尝试 ${attemptNumber}/${this.maxReconnectAttempts}`);
            this.reconnectAttempts = attemptNumber;
            
            this.showConnectionStatus(`重连中... (${attemptNumber}/${this.maxReconnectAttempts})`);
        });
        
        // 重连成功
        this.socket.on('reconnect', (attemptNumber) => {
            console.log('Socket.IO重连成功，尝试次数:', attemptNumber);
            this.showConnectionStatus('重连成功！', 2000);
        });
        
        // 重连失败
        this.socket.on('reconnect_failed', () => {
            console.error('Socket.IO重连失败');
            this.showConnectionStatus('连接失败，请刷新页面重试', 0);
            
            // 显示重连失败提示
            setTimeout(() => {
                if (confirm('连接失败，是否刷新页面重试？')) {
                    window.location.reload();
                }
            }, 1000);
        });
        
        // 连接错误
        this.socket.on('connect_error', (error) => {
            console.error('Socket.IO连接错误:', error);
            this.showConnectionStatus('连接服务器失败');
        });
        
        // 服务器错误消息
        this.socket.on('error', (data) => {
            console.error('服务器错误:', data);
            alert(data.message || '服务器错误');
        });
    }
    
    /**
     * 尝试重新加入游戏
     */
    rejoinGameIfNeeded() {
        const gameData = JSON.parse(localStorage.getItem('gameData') || '{}');
        
        if (gameData.roomCode && gameData.playerId) {
            console.log('尝试重新加入游戏...', gameData);
            
            this.emit('rejoin_game', {
                roomCode: gameData.roomCode,
                playerId: gameData.playerId,
                playerName: gameData.playerName
            });
        }
    }
    
    /**
     * 注册游戏事件处理器
     */
    on(eventName, handler) {
        if (this.socket) {
            this.socket.on(eventName, handler);
        }
        
        // 保存处理器引用，用于调试
        this.gameEventHandlers.set(eventName, handler);
    }
    
    /**
     * 移除事件监听器
     */
    off(eventName, handler) {
        if (this.socket) {
            this.socket.off(eventName, handler);
        }
        
        this.gameEventHandlers.delete(eventName);
    }
    
    /**
     * 发送事件到服务器
     */
    emit(eventName, data = {}) {
        if (!this.socket) {
            console.error('Socket未初始化');
            return false;
        }
        
        if (!this.connected) {
            console.warn('Socket未连接，事件将在重连后发送');
            // 可以考虑将事件加入队列，重连后发送
            return false;
        }
        
        console.log('发送Socket事件:', eventName, data);
        this.socket.emit(eventName, data);
        return true;
    }
    
    /**
     * 显示连接状态
     */
    showConnectionStatus(message, duration = 3000) {
        // 创建或更新状态提示
        let statusDiv = document.getElementById('connection-status');
        
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'connection-status';
            statusDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 10000;
                font-size: 14px;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(statusDiv);
        }
        
        statusDiv.textContent = message;
        statusDiv.style.opacity = '1';
        
        // 自动隐藏
        if (duration > 0) {
            setTimeout(() => {
                if (statusDiv) {
                    statusDiv.style.opacity = '0';
                    setTimeout(() => {
                        if (statusDiv && statusDiv.parentNode) {
                            statusDiv.parentNode.removeChild(statusDiv);
                        }
                    }, 300);
                }
            }, duration);
        }
    }
    
    /**
     * 获取连接状态
     */
    isConnected() {
        return this.connected && this.socket && this.socket.connected;
    }
    
    /**
     * 获取Socket ID
     */
    getSocketId() {
        return this.socket ? this.socket.id : null;
    }
    
    /**
     * 手动重连
     */
    reconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket.connect();
        }
    }
    
    /**
     * 断开连接
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }
    
    /**
     * 清理资源
     */
    destroy() {
        this.gameEventHandlers.clear();
        this.disconnect();
    }
}

// 创建全局Socket客户端实例
window.socketClient = new SocketClient();