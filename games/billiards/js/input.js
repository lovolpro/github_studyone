import { CONFIG } from './config.js';

/**
 * 输入处理器类 - 负责处理用户输入（鼠标、键盘）
 */
export class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragEnd = { x: 0, y: 0 };
        this.power = 0;
        this.maxPower = 50;

        // 绑定事件
        this.bindEvents();
    }

    /**
     * 绑定所有输入事件
     */
    bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // 调试控制绑定
        const debugToggle = document.getElementById('debugToggle');
        debugToggle?.addEventListener('change', () => {
            this.game.setDebug(debugToggle.checked);
        });
    }

    /**
     * 处理鼠标按下事件
     */
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 检查是否点击了白球附近区域
        const cueBall = this.game.getCueBall();
        const dist = Math.sqrt((mouseX - cueBall.x) ** 2 + (mouseY - cueBall.y) ** 2);

        if (dist < cueBall.radius + 100 && this.game.allBallsStopped()) { // 扩大可点击区域
            this.isDragging = true;
            this.dragStart = { x: cueBall.x, y: cueBall.y }; // 起点设为白球中心
            this.dragEnd = { x: mouseX, y: mouseY }; // 终点为鼠标位置
            this.power = 0;

            // 通知游戏开始拖拽
            this.game.setDragging(true);
        }
    }

    /**
     * 处理鼠标移动事件
     */
    handleMouseMove(e) {
        if (this.isDragging) {
            const rect = this.canvas.getBoundingClientRect();
            this.dragEnd = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            // 计算台球杆拖拽距离作为力度
            const cueBall = this.game.getCueBall();
            const dx = this.dragEnd.x - cueBall.x;
            const dy = this.dragEnd.y - cueBall.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.power = Math.min(distance / 5, this.maxPower);

            // 更新游戏状态
            this.game.updateDragState(this.dragEnd, this.power);
        }
    }

    /**
     * 处理鼠标释放事件
     */
    handleMouseUp() {
        if (this.isDragging) {
            // 计算击球参数并执行击球
            this.shoot();

            // 重置拖拽状态
            this.isDragging = false;
            this.power = 0;

            // 通知游戏结束拖拽
            this.game.setDragging(false);
            this.game.clearPrediction();
        }
    }

    /**
     * 处理键盘按下事件
     */
    handleKeyDown(e) {
        if (e.key.toLowerCase() === 'd') {
            this.game.toggleDebug();
            const debugToggle = document.getElementById('debugToggle');
            if (debugToggle) debugToggle.checked = this.game.getDebug();
        }
    }

    /**
     * 执行击球
     */
    shoot() {
        const cueBall = this.game.getCueBall();
        const dx = this.dragEnd.x - cueBall.x;
        const dy = this.dragEnd.y - cueBall.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            // 计算击球角度（从白球指向拖拽终点）
            const angle = Math.atan2(dy, dx);

            // 根据台球杆拖拽距离计算力度
            const pullBackDistance = Math.min(distance * 0.8, CONFIG.cue.maxPullBack);
            const maxPullBack = CONFIG.cue.maxPullBack;
            const powerRatio = pullBackDistance / maxPullBack;

            // 基础力度（基于台球杆拖拽距离）
            const force = powerRatio * CONFIG.cue.maxForce;

            // 击球偏移效果 - 基于击球点位置
            const hitOffset = this.calculateHitOffset();

            // 计算击球方向（白球朝向鼠标拖拽的方向移动）
            const shootAngle = angle; // 直接使用从白球指向鼠标的角度
            const baseVx = Math.cos(shootAngle) * force;
            const baseVy = Math.sin(shootAngle) * force;

            // 添加击球偏移效果
            cueBall.vx = baseVx + hitOffset.vx;
            cueBall.vy = baseVy + hitOffset.vy;

            // 添加旋转效果
            cueBall.spin = hitOffset.spin;

            // console.log(`击球力度: ${force.toFixed(2)}, 角度: ${(shootAngle * 180 / Math.PI).toFixed(1)}°`);
        }
    }

    /**
     * 计算击球偏移效果
     */
    calculateHitOffset() {
        // 基于台球杆拖拽方向计算击球效果
        const cueBall = this.game.getCueBall();
        const dx = this.dragEnd.x - cueBall.x;
        const dy = this.dragEnd.y - cueBall.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 计算击球角度的细微偏差
        let offsetX = 0;
        let offsetY = 0;
        let spin = 0;

        if (distance > 10) {
            // 基于鼠标位置相对于白球的偏移计算旋转
            // 如果鼠标在白球的左侧或右侧，产生侧旋
            const angle = Math.atan2(dy, dx);
            const angleDeviation = (Math.random() - 0.5) * 0.1; // 轻微的随机偏差

            offsetX = Math.cos(angle + angleDeviation) * 0.2;
            offsetY = Math.sin(angle + angleDeviation) * 0.2;

            // 计算侧旋效果
            spin = (dx / distance) * 0.05; // 水平分量影响侧旋
        }

        return {
            vx: offsetX,
            vy: offsetY,
            spin: spin
        };
    }

    /**
     * 获取当前拖拽状态
     */
    getDragState() {
        return {
            isDragging: this.isDragging,
            dragStart: this.dragStart,
            dragEnd: this.dragEnd,
            power: this.power
        };
    }

    /**
     * 获取当前力度
     */
    getPower() {
        return this.power;
    }

    /**
     * 获取最大力度
     */
    getMaxPower() {
        return this.maxPower;
    }
}
