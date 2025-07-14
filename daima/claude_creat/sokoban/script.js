document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const resetButton = document.getElementById('reset-button');

    // 游戏配置
    const TILE_SIZE = 35;
    const TILES = {
        WALL: 1,
        FLOOR: 0,
        PLAYER: 2,
        BOX: 3,
        TARGET: 4,
        BOX_ON_TARGET: 5,
        PLAYER_ON_TARGET: 6,
    };

    // 多关卡设计
    const levels = [
        // 第一关
        [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 1, 0, 0, 0, 1],
            [1, 0, 2, 4, 0, 1, 0, 1],
            [1, 1, 0, 1, 3, 0, 0, 1],
            [1, 0, 0, 3, 0, 1, 1, 1],
            [1, 0, 1, 0, 4, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
        ],
        // 第二关 - 更复杂的布局
        [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 4, 3, 0, 3, 4, 0, 1],
            [1, 1, 1, 0, 2, 0, 1, 1, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 0, 4, 3, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
        ]
    ];

    // 游戏状态
    let gameState = {
        currentLevel: 0,
        level: [],
        playerPosition: { x: 0, y: 0 },
        moves: 0,
        history: []
    };

    // 初始化游戏
    function initGame() {
        // 深拷贝当前关卡数据
        gameState.level = JSON.parse(JSON.stringify(levels[gameState.currentLevel]));
        gameState.moves = 0;
        gameState.history = [];
        updateUI();
        createBoard();
    }

    // 更新UI元素
    function updateUI() {
        // 添加关卡和移动次数信息
        const container = document.getElementById('game-container');
        let infoElement = document.getElementById('game-info');
        
        if (!infoElement) {
            infoElement = document.createElement('div');
            infoElement.id = 'game-info';
            container.insertBefore(infoElement, gameBoard);
        }
        
        infoElement.innerHTML = `关卡: ${gameState.currentLevel + 1} | 移动次数: ${gameState.moves}`;
    }

    // 创建游戏板
    function createBoard() {
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${gameState.level[0].length}, ${TILE_SIZE}px)`;
        gameBoard.style.gridTemplateRows = `repeat(${gameState.level.length}, ${TILE_SIZE}px)`;

        for (let y = 0; y < gameState.level.length; y++) {
            for (let x = 0; x < gameState.level[y].length; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.x = x;
                cell.dataset.y = y;

                switch (gameState.level[y][x]) {
                    case TILES.WALL:
                        cell.classList.add('wall');
                        break;
                    case TILES.FLOOR:
                        cell.classList.add('floor');
                        break;
                    case TILES.PLAYER:
                        cell.classList.add('player');
                        gameState.playerPosition = { x, y };
                        break;
                    case TILES.BOX:
                        cell.classList.add('box');
                        break;
                    case TILES.TARGET:
                        cell.classList.add('target');
                        break;
                    case TILES.BOX_ON_TARGET:
                        cell.classList.add('box-on-target');
                        break;
                    case TILES.PLAYER_ON_TARGET:
                        cell.classList.add('player');
                        cell.classList.add('target');
                        gameState.playerPosition = { x, y };
                        break;
                }
                gameBoard.appendChild(cell);
            }
        }
    }

    // 移动玩家
    function movePlayer(dx, dy) {
        // 保存移动前的状态
        gameState.history.push(JSON.parse(JSON.stringify(gameState.level)));
        
        const newX = gameState.playerPosition.x + dx;
        const newY = gameState.playerPosition.y + dy;

        // 检查是否撞墙
        if (gameState.level[newY][newX] === TILES.WALL) {
            gameState.history.pop(); // 撤销保存的状态
            return false;
        }

        // 检查是否推箱子
        if (gameState.level[newY][newX] === TILES.BOX || gameState.level[newY][newX] === TILES.BOX_ON_TARGET) {
            const nextBoxX = newX + dx;
            const nextBoxY = newY + dy;

            // 检查箱子是否可以移动
            if (gameState.level[nextBoxY][nextBoxX] === TILES.WALL || 
                gameState.level[nextBoxY][nextBoxX] === TILES.BOX || 
                gameState.level[nextBoxY][nextBoxX] === TILES.BOX_ON_TARGET) {
                gameState.history.pop(); // 撤销保存的状态
                return false;
            }

            // 移动箱子
            gameState.level[newY][newX] = gameState.level[newY][newX] === TILES.BOX ? TILES.FLOOR : TILES.TARGET;
            gameState.level[nextBoxY][nextBoxX] = gameState.level[nextBoxY][nextBoxX] === TILES.TARGET ? TILES.BOX_ON_TARGET : TILES.BOX;
        }

        // 移动玩家
        gameState.level[gameState.playerPosition.y][gameState.playerPosition.x] = 
            gameState.level[gameState.playerPosition.y][gameState.playerPosition.x] === TILES.PLAYER_ON_TARGET ? TILES.TARGET : TILES.FLOOR;
        gameState.level[newY][newX] = gameState.level[newY][newX] === TILES.TARGET ? TILES.PLAYER_ON_TARGET : TILES.PLAYER;

        // 更新玩家位置
        gameState.playerPosition = { x: newX, y: newY };
        gameState.moves++;
        
        updateUI();
        createBoard();
        checkWin();
        return true;
    }

    // 检查是否获胜
    function checkWin() {
        let boxesOnTarget = 0;
        let totalTargets = 0;

        for (let y = 0; y < gameState.level.length; y++) {
            for (let x = 0; x < gameState.level[y].length; x++) {
                if (gameState.level[y][x] === TILES.TARGET || gameState.level[y][x] === TILES.PLAYER_ON_TARGET) {
                    totalTargets++;
                }
                if (gameState.level[y][x] === TILES.BOX_ON_TARGET) {
                    boxesOnTarget++;
                    totalTargets++;
                }
            }
        }

        if (boxesOnTarget === totalTargets && totalTargets > 0) {
            setTimeout(() => {
                alert(`恭喜！你完成了第 ${gameState.currentLevel + 1} 关，用了 ${gameState.moves} 步！`);
                
                // 进入下一关
                if (gameState.currentLevel < levels.length - 1) {
                    gameState.currentLevel++;
                    initGame();
                } else {
                    alert('恭喜你通关了所有关卡！');
                    gameState.currentLevel = 0;
                    initGame();
                }
            }, 100);
        }
    }

    // 撤销移动
    function undoMove() {
        if (gameState.history.length > 0) {
            gameState.level = gameState.history.pop();
            gameState.moves = Math.max(0, gameState.moves - 1);
            updateUI();
            createBoard();
        }
    }

    // 重置当前关卡
    function resetLevel() {
        initGame();
    }

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        let moved = false;
        
        switch (e.key) {
            case 'ArrowUp':
                moved = movePlayer(0, -1);
                break;
            case 'ArrowDown':
                moved = movePlayer(0, 1);
                break;
            case 'ArrowLeft':
                moved = movePlayer(-1, 0);
                break;
            case 'ArrowRight':
                moved = movePlayer(1, 0);
                break;
            case 'z':
            case 'Z':
                if (e.ctrlKey) undoMove();
                break;
            case 'r':
            case 'R':
                resetLevel();
                break;
        }
        
        if (moved) {
            e.preventDefault(); // 防止页面滚动
        }
    });

    // 重置按钮
    resetButton.addEventListener('click', resetLevel);

    // 添加撤销按钮
    const container = document.getElementById('game-container');
    const undoButton = document.createElement('button');
    undoButton.id = 'undo-button';
    undoButton.textContent = '撤销';
    undoButton.addEventListener('click', undoMove);
    container.insertBefore(undoButton, resetButton.nextSibling);

    // 初始化游戏
    initGame();
});