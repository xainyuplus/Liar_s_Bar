@echo off
REM 创建前端主文件
echo. > index.html

REM 创建 CSS 文件夹和文件
mkdir CSS
echo /* main css */ > CSS\main.css
echo /* lobby css */ > CSS\lobby.css
echo /* game css */ > CSS\game.css

REM 创建 JS 文件夹及子结构
mkdir JS
echo // main.js >> JS\main.js
echo // socket client >> JS\socket-client.js

mkdir JS\ui
mkdir JS\ui\components
echo // Card component >> JS\ui\components\Card.js
echo // Hand area >> JS\ui\components\Hand.js
echo // Player list >> JS\ui\components\PlayerList.js
echo // Roulette modal >> JS\ui\components\RouletteModal.js

mkdir JS\ui\screens
echo // Lobby screen >> JS\ui\screens\LobbyScreen.js
echo // Game screen >> JS\ui\screens\GameScreen.js

mkdir JS\game
echo // Game state manager >> JS\game\GameState.js
echo // Card manager >> JS\game\CardManager.js

mkdir JS\utils
echo // Animation utils >> JS\utils\animationUtils.js
echo // Sound manager >> JS\utils\soundManager.js

REM 创建资源文件夹及子结构
mkdir assets
mkdir assets\images
mkdir assets\images\cards
mkdir assets\images\backgrounds
mkdir assets\images\avatars
mkdir assets\sounds

REM 创建后端主文件
echo // server entry point > server.js

REM 创建 Socket.IO 后端结构
mkdir socket
echo // Socket connection manager > socket\socketManager.js
echo // Event handlers > socket\eventHandlers.js

REM 创建后端游戏逻辑结构
mkdir game
echo // Room management > game\Room.js
echo // Player class > game\Player.js
echo // Deck logic > game\Deck.js
echo // Game manager > game\GameManager.js

REM 创建数据库操作结构（可选）
mkdir db
mkdir db\models
echo // User model > db\models\User.js
echo // Game record model > db\models\GameRecord.js

mkdir db\controllers
echo // Data controllers > db\controllers\.gitkeep

echo 所有前后端目录与文件创建完毕！
pause
