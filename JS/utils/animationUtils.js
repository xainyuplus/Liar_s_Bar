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

    const avatarsContainer = document.createElement('div');//头像容器
    avatarsContainer.id = 'avatarsContainer';
    avatarsContainer.style.display = 'flex';
    avatarsContainer.style.justifyContent = 'space-around'; // 头像水平分布
    avatarsContainer.style.width = '100%';

    const namesContainer = document.createElement('div');//玩家名字容器
    namesContainer.id = 'namesContainer';
    namesContainer.style.display = 'flex';
    namesContainer.style.justifyContent ='space-around'; // 名字水平分布
    namesContainer.style.width = '100%';


    for(let i = 0; i < 4; i++){
        
        const avatar = document.createElement('img');
        avatar.src = './assets/images/avatars/avatar0.png'; // 设置头像图片路径
        avatar.setAttribute('data-avatar', false);
        avatar.style.width = '60px'; // 设置头像宽度
        avatar.style.height = '60px'; // 设置头像高度
        avatar.style.margin = '10px'; // 设置头像之间的间距
        avatarsContainer.appendChild(avatar); // 将头像添加到容器中
        
        const playerName = document.createElement('span'); // 创建一个新的 span 元素
        playerName.textContent = '玩家' + (i + 1); // 设置 span 元素的文本内容为 '玩家1' 或 '玩家2' 等
        playerName.style.margin = '10px'; // 设置 span 元素的边距为 '10px'
        namesContainer.appendChild(playerName); // 将 span 元素添加到 div 中
        
    }
    playersDiv.appendChild(avatarsContainer);
    playersDiv.appendChild(namesContainer);

    const startButton = document.createElement('button');
    startButton.id = 'startButton';
    startButton.textContent = '开始游戏';
    playersDiv.appendChild(startButton);

    return playersDiv; // 返回创建的 div 元素
}