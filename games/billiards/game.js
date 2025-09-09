import { CONFIG, clamp } from './js/config.js';
import { Ball } from './js/ball.js';
import { Physics } from './js/physics.js';
import { Renderer } from './js/renderer.js';
import { InputHandler } from './js/input.js';

/**
 * 台球游戏主类 - 游戏逻辑协调中心
 */
class BilliardsGame {
    constructor() {
        // DOM 元素
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.powerFill = document.getElementById('powerFill');
        this.fpsDisplay = document.getElementById('fpsDisplay');
        this.pottedDisplay = document.getElementById('pottedBalls');
        this.debugToggle = document.getElementById('debugToggle');

        // 游戏状态
        this.balls = [];
        this.cueBall = null;
        this.isDragging = false;
        this.dragEnd = { x: 0, y: 0 };
        this.power = 0;
        this.maxPower = 50;
        this.debug = false;
        this.potted = []; // 已进球编号

        // 预测路径数据
        this.predictedPath = [];            // 白球预测路径
        this.predictedTargetPath = [];      // 目标球预测路径
        this.predictedImpactPoint = null;   // 首次碰撞点

        // 性能计数
        this.frameCount = 0;
        this.currentFrame = 0;  // 添加当前帧计数器
        this.lastFpsTime = performance.now();
        this.lastTimestamp = performance.now();

        // 台球桌配置
        const pocketRadius = 28;        // 增大边袋半径
        const cornerPocketRadius = 32;  // 增大角袋半径
        const cornerOffset = 15;
        const sideOffset = 25;

        this.tableOffsetX = 400;
        this.tableOffsetY = 150;
        this.tableWidth = 800;
        this.tableHeight = 400;
        this.railHeight = CONFIG.railHeight;

        // 球袋位置
        this.pockets = [
            { x: this.tableOffsetX + cornerOffset, y: this.tableOffsetY + cornerOffset, radius: cornerPocketRadius },
            { x: this.tableOffsetX + this.tableWidth / 2, y: this.tableOffsetY + sideOffset, radius: pocketRadius - 2 },
            { x: this.tableOffsetX + this.tableWidth - cornerOffset, y: this.tableOffsetY + cornerOffset, radius: cornerPocketRadius },
            { x: this.tableOffsetX + cornerOffset, y: this.tableOffsetY + this.tableHeight - cornerOffset, radius: cornerPocketRadius },
            { x: this.tableOffsetX + this.tableWidth / 2, y: this.tableOffsetY + this.tableHeight - sideOffset, radius: pocketRadius - 2 },
            { x: this.tableOffsetX + this.tableWidth - cornerOffset, y: this.tableOffsetY + this.tableHeight - cornerOffset, radius: cornerPocketRadius }
        ];

        // 初始化子系统
        this.physics = new Physics(this.tableOffsetX, this.tableOffsetY, this.tableWidth, this.tableHeight, this.railHeight);
        this.renderer = new Renderer(this.ctx, this.canvas, this.tableWidth, this.tableHeight,
                                   this.tableOffsetX, this.tableOffsetY, this.railHeight, this.pockets);
        this.inputHandler = new InputHandler(this.canvas, this);

        // 初始化游戏
        this.initBalls();
        this.gameLoop();
    }

    /**
     * 初始化台球位置
     */
    initBalls() {
        // 创建白球（主球）
        this.cueBall = new Ball(this.tableOffsetX + 150, this.tableOffsetY + 200, 15, 'white', 1, 0);
        this.balls.push(this.cueBall);

        // 定义球的配置：[颜色, 是否为条纹球]
        const ballConfigs = [
            ['#FFD700', false], // 1号球 - 黄色 (全色)
            ['#0000FF', false], // 2号球 - 蓝色 (全色)
            ['#FF0000', false], // 3号球 - 红色 (全色)
            ['#800080', false], // 4号球 - 紫色 (全色)
            ['#FFA500', false], // 5号球 - 橙色 (全色)
            ['#008000', false], // 6号球 - 绿色 (全色)
            ['#8B0000', false], // 7号球 - 深红色 (全色)
            ['#000000', false], // 8号球 - 黑色 (全色)
            ['#FFD700', true],  // 9号球 - 黄色条纹 (半花色)
            ['#0000FF', true],  // 10号球 - 蓝色条纹 (半花色)
            ['#FF0000', true],  // 11号球 - 红色条纹 (半花色)
            ['#800080', true],  // 12号球 - 紫色条纹 (半花色)
            ['#FFA500', true],  // 13号球 - 橙色条纹 (半花色)
            ['#008000', true],  // 14号球 - 绿色条纹 (半花色)
            ['#8B0000', true]   // 15号球 - 深红色条纹 (半花色)
        ];

        // 生成三角形排列的所有位置
        const positions = [];
        const startX = this.tableOffsetX + 600;
        const startY = this.tableOffsetY + 200;
        const spacing = 31;

        for (let row = 0; row < 5; row++) {
            for (let col = 0; col <= row; col++) {
                const x = startX + row * spacing;
                const y = startY + (col - row / 2) * spacing;
                positions.push({ x, y });
            }
        }

        // 创建彩球
        ballConfigs.forEach((config, index) => {
            const [color, isStripe] = config;
            const { x, y } = positions[index];
            const ball = new Ball(x, y, 15, color, 1, index + 1);
            ball.isStripe = isStripe;
            this.balls.push(ball);
        });
    }

    /**
     * 主游戏循环
     */
    gameLoop() {
        const now = performance.now();
        const dtMs = now - this.lastTimestamp;
        // 归一化到 60fps 基准帧 (约16.67ms) => dt = 1 表示一帧
        const dt = clamp(dtMs / 16.6667, 0.2, 3);
        this.lastTimestamp = now;
        this.currentFrame++;  // 增加帧计数器

        // 物理更新
        this.physics.checkCollisions(this.balls, this.currentFrame);
        this.balls.forEach(ball => ball.update(this.pockets, this.railHeight, dt));
        this.physics.checkPockets(this.balls, this.pockets, this.cueBall, {
            tableOffsetX: this.tableOffsetX,
            tableOffsetY: this.tableOffsetY,
            tableWidth: this.tableWidth,
            tableHeight: this.tableHeight
        }, {
            onCueBallPocketed: () => {
                console.log('白球进袋');
            },
            onBallPocketed: (ball) => {
                console.log(`${ball.number}号球进袋`);
                if (ball.number) {
                    this.potted.push(ball.number);
                }
                this.updateScoreboard();
            }
        });

        // 渲染
        this.renderer.draw(
            this.balls,
            this.isDragging,
            this.cueBall,
            this.dragEnd,
            this.predictedPath,
            this.predictedTargetPath,
            this.predictedImpactPoint,
            this.debug
        );

        // FPS 统计
        this.frameCount++;
        if (now - this.lastFpsTime >= 500) { // 半秒刷新
            const fps = (this.frameCount * 1000) / (now - this.lastFpsTime);
            if (this.fpsDisplay) this.fpsDisplay.textContent = fps.toFixed(0);
            this.frameCount = 0;
            this.lastFpsTime = now;
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    // ========== 公共接口方法（供 InputHandler 调用） ==========

    /**
     * 获取白球引用
     */
    getCueBall() {
        return this.cueBall;
    }

    /**
     * 检查所有球是否停止
     */
    allBallsStopped() {
        return this.balls.every(ball =>
            Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.1
        );
    }

    /**
     * 设置拖拽状态
     */
    setDragging(isDragging) {
        this.isDragging = isDragging;
    }

    /**
     * 更新拖拽状态和预测
     */
    updateDragState(dragEnd, power) {
        this.dragEnd = dragEnd;
        this.power = power;
        this.updatePowerBar();
        this.updatePrediction();
    }

    /**
     * 清除预测路径
     */
    clearPrediction() {
        this.predictedPath = [];
        this.predictedTargetPath = [];
        this.predictedImpactPoint = null;
    }

    /**
     * 切换调试模式
     */
    toggleDebug() {
        this.debug = !this.debug;
    }

    /**
     * 设置调试模式
     */
    setDebug(debug) {
        this.debug = debug;
    }

    /**
     * 获取调试状态
     */
    getDebug() {
        return this.debug;
    }

    // ========== 私有辅助方法 ==========

    /**
     * 更新力度条显示
     */
    updatePowerBar() {
        const percentage = (this.power / this.maxPower) * 100;
        if (this.powerFill) this.powerFill.style.width = percentage + '%';
    }

    /**
     * 更新计分板显示
     */
    updateScoreboard() {
        if (this.pottedDisplay) {
            this.pottedDisplay.textContent = this.potted.length ? this.potted.join(', ') : '无';
        }
    }

    /**
     * 更新预测路径
     */
    updatePrediction() {
        if (!this.isDragging) return;

        this.predictedPath = [];
        this.predictedTargetPath = [];
        this.predictedImpactPoint = null;

        // 使用物理引擎计算预测路径
        const prediction = this.physics.predictPaths(
            this.cueBall,
            this.dragEnd,
            this.balls.filter(b => b !== this.cueBall),
            this.pockets
        );

        this.predictedPath = prediction.cueBallPath;
        this.predictedTargetPath = prediction.targetBallPath;
        this.predictedImpactPoint = prediction.impactPoint;
    }

    /**
     * 重启游戏
     */
    restart() {
        // 重置游戏状态
        this.balls = [];
        this.isDragging = false;
        this.power = 0;
        this.updatePowerBar();
        this.clearPrediction();
        this.potted = [];
        this.updateScoreboard();

        // 重新初始化球的位置
        this.initBalls();
    }
}

// 初始化游戏
const game = new BilliardsGame();

// 设置全局引用以便调试
window.game = game;
