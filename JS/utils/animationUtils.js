// Animation utils 
//这里会写一些动画组件的工具函数，比如：创建窗口之类的

// Animation utils 
//这里会写一些动画组件的工具函数，比如：创建窗口之类的

function playersDiv(roomID) {
    const playersDiv = document.createElement('div'); // 创建一个新的 div 元素
    playersDiv.id = "playersDiv"; 
    playersDiv.style.display = 'flex'; 
    playersDiv.style.flexDirection = 'column'; // 设置为垂直布局
    playersDiv.style.alignItems = 'center'; // 水平居中
    playersDiv.style.position = 'relative'; 

     // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.id = 'closeButton';
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.fontSize = '24px';
    closeButton.style.border = 'none';
    //closeButton.style.background = 'transparent';
    closeButton.style.cursor = 'pointer';
     playersDiv.appendChild(closeButton);



    const roomId = document.createElement('span'); 
    roomId.textContent = roomID; 
    playersDiv.appendChild(roomId); // 将房间ID添加到 div 中

    const avatarsContainer = document.createElement('div');
    avatarsContainer.style.display = 'flex';
    avatarsContainer.style.justifyContent = 'space-around'; // 头像水平分布
    avatarsContainer.style.width = '100%';

    for(let i = 0; i < 4; i++){
        const playerDiv = document.createElement('div'); 
        playerDiv.classList.add('player_avatar'); // 添加一个类名，用于样式设置
        avatarsContainer.appendChild(playerDiv); // 将新创建的 div 元素添加到容器中
    }
    playersDiv.appendChild(avatarsContainer);

    const startButton = document.createElement('button');
    startButton.id = 'startButton';
    startButton.textContent = '开始游戏';
    playersDiv.appendChild(startButton);

    return playersDiv; // 返回创建的 div 元素
}