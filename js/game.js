/**
 * 简易贪吃蛇游戏
 * 一个简单易上手的贪吃蛇游戏实现，使用HTML Canvas和JavaScript
 */

// 游戏配置
const GAME_CONFIG = {
    gridSize: 20,      // 格子大小（像素）
    gridWidth: 15,     // 横向格子数量
    gridHeight: 15,    // 纵向格子数量
    frameRate: 10,     // 初始帧率
    maxSpeed: 15,      // 最大速度
    speedIncrement: 0.5, // 每吃一个食物的速度增加量
    colors: {
        background: '#e8f5e9',
        snake: '#4caf50',
        snakeHead: '#388e3c',
        food: '#f44336',
        grid: '#c8e6c9'
    }
};

// 方向常量
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// 游戏主类
class SnakeGame {
    constructor() {
        // 获取Canvas元素
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // 游戏状态
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.speed = GAME_CONFIG.frameRate;
        this.lastFrameTime = 0;
        this.gameLoopId = null;

        // 蛇状态
        this.snake = [];
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;
        this.food = null;

        // 初始化事件监听
        this.initEventListeners();
        this.updateScoreDisplay();

        // 更新最高分显示
        document.getElementById('highScore').textContent = this.highScore;
    }

    // 调整Canvas大小
    resizeCanvas() {
        this.canvas.width = GAME_CONFIG.gridWidth * GAME_CONFIG.gridSize;
        this.canvas.height = GAME_CONFIG.gridHeight * GAME_CONFIG.gridSize;
    }

    // 初始化事件监听
    initEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // 桌面端按钮控制
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());

        // 移动端按钮控制
        document.getElementById('upBtn').addEventListener('click', () => this.setDirection(DIRECTIONS.UP));
        document.getElementById('downBtn').addEventListener('click', () => this.setDirection(DIRECTIONS.DOWN));
        document.getElementById('leftBtn').addEventListener('click', () => this.setDirection(DIRECTIONS.LEFT));
        document.getElementById('rightBtn').addEventListener('click', () => this.setDirection(DIRECTIONS.RIGHT));

        // 移动端触摸控制
        this.setupTouchControls();
    }

    // 设置触摸控制
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, false);

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, false);

        this.canvas.addEventListener('touchend', (e) => {
            if (!this.isRunning || this.isPaused) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // 判断是横向滑动还是纵向滑动
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // 横向滑动
                if (deltaX > 0 && this.direction !== DIRECTIONS.LEFT) {
                    this.setDirection(DIRECTIONS.RIGHT);
                } else if (deltaX < 0 && this.direction !== DIRECTIONS.RIGHT) {
                    this.setDirection(DIRECTIONS.LEFT);
                }
            } else {
                // 纵向滑动
                if (deltaY > 0 && this.direction !== DIRECTIONS.UP) {
                    this.setDirection(DIRECTIONS.DOWN);
                } else if (deltaY < 0 && this.direction !== DIRECTIONS.DOWN) {
                    this.setDirection(DIRECTIONS.UP);
                }
            }

            e.preventDefault();
        }, false);
    }

    // 处理键盘按键
    handleKeyPress(e) {
        if (!this.isRunning) {
            if (e.key === 'Enter' || e.code === 'Space') {
                this.startGame();
                return;
            }
        }

        if (this.isRunning && !this.isPaused) {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.direction !== DIRECTIONS.DOWN) {
                        this.setDirection(DIRECTIONS.UP);
                    }
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.direction !== DIRECTIONS.UP) {
                        this.setDirection(DIRECTIONS.DOWN);
                    }
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.direction !== DIRECTIONS.RIGHT) {
                        this.setDirection(DIRECTIONS.LEFT);
                    }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.direction !== DIRECTIONS.LEFT) {
                        this.setDirection(DIRECTIONS.RIGHT);
                    }
                    break;
            }
        }

        // 暂停控制
        if (e.key === 'p' || e.key === 'P' || e.code === 'Space') {
            this.togglePause();
        }
    }

    // 设置移动方向
    setDirection(newDirection) {
        // 确保不能直接掉头
        if (
            (this.direction === DIRECTIONS.UP && newDirection === DIRECTIONS.DOWN) ||
            (this.direction === DIRECTIONS.DOWN && newDirection === DIRECTIONS.UP) ||
            (this.direction === DIRECTIONS.LEFT && newDirection === DIRECTIONS.RIGHT) ||
            (this.direction === DIRECTIONS.RIGHT && newDirection === DIRECTIONS.LEFT)
        ) {
            return;
        }
        
        this.nextDirection = newDirection;
    }

    // 开始游戏
    startGame() {
        if (this.isRunning) return;

        // 隐藏游戏结束屏幕
        document.getElementById('gameOverScreen').style.display = 'none';

        // 重置游戏状态
        this.score = 0;
        this.updateScoreDisplay();
        this.speed = GAME_CONFIG.frameRate;
        this.isRunning = true;
        this.isPaused = false;

        // 重置蛇的位置和方向
        const centerX = Math.floor(GAME_CONFIG.gridWidth / 2);
        const centerY = Math.floor(GAME_CONFIG.gridHeight / 2);
        
        this.snake = [
            { x: centerX, y: centerY },
            { x: centerX - 1, y: centerY },
            { x: centerX - 2, y: centerY }
        ];
        
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;

        // 生成食物
        this.generateFood();

        // 更新按钮状态
        document.getElementById('startBtn').textContent = '重新开始';
        document.getElementById('pauseBtn').textContent = '暂停';

        // 启动游戏循环
        this.gameLoop(0);
    }

    // 重新开始游戏
    restartGame() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
        }
        this.startGame();
    }

    // 暂停/继续游戏
    togglePause() {
        if (!this.isRunning) return;

        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? '继续' : '暂停';

        if (!this.isPaused) {
            this.lastFrameTime = performance.now();
            this.gameLoop(this.lastFrameTime);
        }
    }

    // 生成食物
    generateFood() {
        // 生成随机位置
        let x, y;
        let validPosition = false;

        while (!validPosition) {
            x = Math.floor(Math.random() * GAME_CONFIG.gridWidth);
            y = Math.floor(Math.random() * GAME_CONFIG.gridHeight);
            
            // 确保食物不会生成在蛇身上
            validPosition = true;
            for (const segment of this.snake) {
                if (segment.x === x && segment.y === y) {
                    validPosition = false;
                    break;
                }
            }
        }

        this.food = { x, y };
    }

    // 更新分数显示
    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('finalScore').textContent = this.score;
    }

    // 游戏主循环
    gameLoop(timestamp) {
        if (!this.isRunning) return;
        if (this.isPaused) {
            this.gameLoopId = requestAnimationFrame((t) => this.gameLoop(t));
            return;
        }

        // 控制游戏速度
        const deltaTime = timestamp - this.lastFrameTime;
        const frameDelay = 1000 / this.speed;

        if (deltaTime < frameDelay) {
            this.gameLoopId = requestAnimationFrame((t) => this.gameLoop(t));
            return;
        }

        this.lastFrameTime = timestamp;

        // 更新游戏状态
        this.update();
        
        // 绘制游戏
        this.render();

        // 继续游戏循环
        this.gameLoopId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    // 更新游戏状态
    update() {
        // 应用下一个方向
        this.direction = this.nextDirection;

        // 移动蛇
        const head = { 
            x: this.snake[0].x + this.direction.x, 
            y: this.snake[0].y + this.direction.y 
        };

        // 检查碰撞
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }

        // 在蛇前面添加新的头部
        this.snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            // 吃到食物，增加分数
            this.score++;
            this.updateScoreDisplay();
            
            // 增加速度，但不超过最大速度
            this.speed = Math.min(GAME_CONFIG.maxSpeed, this.speed + GAME_CONFIG.speedIncrement);
            
            // 生成新食物
            this.generateFood();
            
            // 不移除尾部，蛇会变长
        } else {
            // 没吃到食物，移除尾部
            this.snake.pop();
        }
    }

    // 检查碰撞
    checkCollision(head) {
        // 检查墙壁碰撞
        if (
            head.x < 0 || 
            head.x >= GAME_CONFIG.gridWidth || 
            head.y < 0 || 
            head.y >= GAME_CONFIG.gridHeight
        ) {
            return true;
        }

        // 检查自身碰撞（除了尾部，因为尾部会移动）
        for (let i = 0; i < this.snake.length - 1; i++) {
            if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
                return true;
            }
        }

        return false;
    }

    // 游戏结束
    gameOver() {
        this.isRunning = false;
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            document.getElementById('highScore').textContent = this.highScore;
        }
        
        // 显示游戏结束屏幕
        document.getElementById('gameOverScreen').style.display = 'flex';
    }

    // 绘制游戏
    render() {
        const { ctx, canvas } = this;
        const { gridSize, colors } = GAME_CONFIG;

        // 清空画布
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制网格
        this.drawGrid();

        // 绘制食物
        ctx.fillStyle = colors.food;
        ctx.fillRect(
            this.food.x * gridSize,
            this.food.y * gridSize,
            gridSize,
            gridSize
        );

        // 绘制蛇
        for (let i = 0; i < this.snake.length; i++) {
            // 给头部一个不同的颜色
            ctx.fillStyle = i === 0 ? colors.snakeHead : colors.snake;
            
            ctx.fillRect(
                this.snake[i].x * gridSize,
                this.snake[i].y * gridSize,
                gridSize,
                gridSize
            );
            
            // 给方块添加边框，让它们看起来更分明
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(
                this.snake[i].x * gridSize,
                this.snake[i].y * gridSize,
                gridSize,
                gridSize
            );
        }
    }

    // 绘制网格
    drawGrid() {
        const { ctx, canvas } = this;
        const { gridSize, gridWidth, gridHeight, colors } = GAME_CONFIG;

        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 0.5;

        // 绘制垂直线
        for (let x = 0; x <= gridWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(x * gridSize, 0);
            ctx.lineTo(x * gridSize, gridHeight * gridSize);
            ctx.stroke();
        }

        // 绘制水平线
        for (let y = 0; y <= gridHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * gridSize);
            ctx.lineTo(gridWidth * gridSize, y * gridSize);
            ctx.stroke();
        }
    }
}

// 当页面加载完成后初始化游戏
window.addEventListener('load', () => {
    const game = new SnakeGame();
});