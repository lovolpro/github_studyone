// 游戏类
class AngryBirdsGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 游戏状态
        this.score = 0;
        this.level = 1;
        this.birds = [];
        this.pigs = [];
        this.obstacles = [];
        this.currentBird = null;
        this.isAiming = false;
        this.isDragging = false;
        this.gameRunning = false;
        
        // 物理参数
        this.gravity = 0.5;
        this.friction = 0.98;
        this.slingshot = { x: 150, y: 400 };
        this.trajectoryPoints = [];
        
        // 鼠标位置
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadLevel();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // 按钮事件
        document.getElementById('launchBtn').addEventListener('click', () => this.launchBird());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetLevel());
        
        // 阻止右键菜单
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        
        if (this.currentBird && this.isNearSlingshot(this.mouseX, this.mouseY)) {
            this.isDragging = true;
            this.isAiming = true;
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        
        if (this.isDragging && this.currentBird) {
            // 限制拖拽距离
            const dx = this.mouseX - this.slingshot.x;
            const dy = this.mouseY - this.slingshot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 100;
            
            if (distance > maxDistance) {
                const angle = Math.atan2(dy, dx);
                this.mouseX = this.slingshot.x + Math.cos(angle) * maxDistance;
                this.mouseY = this.slingshot.y + Math.sin(angle) * maxDistance;
            }
            
            this.currentBird.x = this.mouseX;
            this.currentBird.y = this.mouseY;
            
            // 更新力量显示
            const power = Math.min(distance / maxDistance * 100, 100);
            this.updatePowerMeter(power);
            
            // 计算轨迹预测
            this.calculateTrajectory();
        }
    }
    
    handleMouseUp(e) {
        if (this.isDragging && this.currentBird) {
            this.launchBird();
        }
        this.isDragging = false;
    }
    
    isNearSlingshot(x, y) {
        const distance = Math.sqrt((x - this.slingshot.x) ** 2 + (y - this.slingshot.y) ** 2);
        return distance < 80;
    }
    
    launchBird() {
        if (!this.currentBird || !this.isAiming) return;
        
        const dx = this.slingshot.x - this.currentBird.x;
        const dy = this.slingshot.y - this.currentBird.y;
        
        this.currentBird.vx = dx * 0.2;
        this.currentBird.vy = dy * 0.2;
        this.currentBird.launched = true;
        
        this.isAiming = false;
        this.isDragging = false;
        this.gameRunning = true;
        this.trajectoryPoints = [];
        
        // 准备下一只鸟
        setTimeout(() => {
            this.prepareNextBird();
        }, 3000);
    }
    
    prepareNextBird() {
        if (this.birds.length > 0) {
            this.currentBird = this.birds.shift();
            this.currentBird.x = this.slingshot.x;
            this.currentBird.y = this.slingshot.y;
            this.isAiming = true;
        } else {
            this.checkGameState();
        }
    }
    
    calculateTrajectory() {
        if (!this.currentBird) return;
        
        this.trajectoryPoints = [];
        const dx = this.slingshot.x - this.currentBird.x;
        const dy = this.slingshot.y - this.currentBird.y;
        
        let x = this.currentBird.x;
        let y = this.currentBird.y;
        let vx = dx * 0.2;
        let vy = dy * 0.2;
        
        for (let i = 0; i < 30; i++) {
            x += vx;
            y += vy;
            vy += this.gravity;
            vx *= this.friction;
            
            if (y > this.canvas.height - 50) break;
            
            this.trajectoryPoints.push({ x, y });
        }
    }
    
    updatePowerMeter(power) {
        const powerFill = document.getElementById('powerFill');
        const powerValue = document.getElementById('powerValue');
        powerFill.style.width = power + '%';
        powerValue.textContent = Math.round(power);
    }
    
    loadLevel() {
        this.birds = [];
        this.pigs = [];
        this.obstacles = [];
        
        // 创建小鸟
        for (let i = 0; i < 3; i++) {
            this.birds.push(new Bird(50 + i * 30, 500, 'red'));
        }
        
        // 根据关卡创建猪和障碍物
        this.createLevelStructure();
        
        // 设置当前小鸟
        this.prepareNextBird();
    }
    
    createLevelStructure() {
        const levelConfigs = [
            // 第1关
            [
                { type: 'pig', x: 800, y: 450 },
                { type: 'obstacle', x: 750, y: 400, width: 100, height: 100 },
                { type: 'pig', x: 950, y: 450 }
            ],
            // 第2关
            [
                { type: 'obstacle', x: 700, y: 350, width: 20, height: 150 },
                { type: 'obstacle', x: 800, y: 350, width: 20, height: 150 },
                { type: 'obstacle', x: 720, y: 340, width: 80, height: 20 },
                { type: 'pig', x: 760, y: 450 },
                { type: 'pig', x: 900, y: 450 }
            ],
            // 第3关及以上
            [
                { type: 'obstacle', x: 650, y: 300, width: 20, height: 200 },
                { type: 'obstacle', x: 750, y: 300, width: 20, height: 200 },
                { type: 'obstacle', x: 850, y: 300, width: 20, height: 200 },
                { type: 'obstacle', x: 670, y: 290, width: 180, height: 20 },
                { type: 'pig', x: 700, y: 450 },
                { type: 'pig', x: 760, y: 450 },
                { type: 'pig', x: 820, y: 450 }
            ]
        ];
        
        const config = levelConfigs[Math.min(this.level - 1, levelConfigs.length - 1)];
        
        config.forEach(item => {
            if (item.type === 'pig') {
                this.pigs.push(new Pig(item.x, item.y));
            } else if (item.type === 'obstacle') {
                this.obstacles.push(new Obstacle(item.x, item.y, item.width, item.height));
            }
        });
    }
    
    update() {
        // 更新所有运动中的小鸟
        this.birds.forEach(bird => {
            if (bird.launched) {
                bird.update();
                this.checkCollisions(bird);
            }
        });
        
        // 更新当前小鸟
        if (this.currentBird && this.currentBird.launched) {
            this.currentBird.update();
            this.checkCollisions(this.currentBird);
        }
        
        // 检查游戏状态
        this.checkGameState();
    }
    
    checkCollisions(bird) {
        // 检查与地面碰撞
        if (bird.y > this.canvas.height - 50 - bird.radius) {
            bird.y = this.canvas.height - 50 - bird.radius;
            bird.vy *= -0.6;
            bird.vx *= 0.8;
            
            if (Math.abs(bird.vy) < 2) {
                bird.vy = 0;
                bird.vx *= 0.9;
            }
        }
        
        // 检查与边界碰撞
        if (bird.x < bird.radius) {
            bird.x = bird.radius;
            bird.vx *= -0.8;
        }
        if (bird.x > this.canvas.width - bird.radius) {
            bird.x = this.canvas.width - bird.radius;
            bird.vx *= -0.8;
        }
        
        // 检查与猪的碰撞
        this.pigs.forEach((pig, index) => {
            if (this.isColliding(bird, pig)) {
                this.score += 100;
                this.updateScore();
                this.pigs.splice(index, 1);
                this.showMessage('击中！+100分');
                
                // 添加撞击效果
                bird.vx *= 0.5;
                bird.vy *= 0.5;
            }
        });
        
        // 检查与障碍物的碰撞
        this.obstacles.forEach(obstacle => {
            if (this.isBirdObstacleColliding(bird, obstacle)) {
                // 简单的碰撞响应
                if (bird.x < obstacle.x) {
                    bird.x = obstacle.x - bird.radius;
                    bird.vx *= -0.6;
                } else if (bird.x > obstacle.x + obstacle.width) {
                    bird.x = obstacle.x + obstacle.width + bird.radius;
                    bird.vx *= -0.6;
                }
                
                if (bird.y < obstacle.y) {
                    bird.y = obstacle.y - bird.radius;
                    bird.vy *= -0.6;
                } else if (bird.y > obstacle.y + obstacle.height) {
                    bird.y = obstacle.y + obstacle.height + bird.radius;
                    bird.vy *= -0.6;
                }
            }
        });
    }
    
    isColliding(bird, pig) {
        const dx = bird.x - pig.x;
        const dy = bird.y - pig.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < bird.radius + pig.radius;
    }
    
    isBirdObstacleColliding(bird, obstacle) {
        return bird.x + bird.radius > obstacle.x &&
               bird.x - bird.radius < obstacle.x + obstacle.width &&
               bird.y + bird.radius > obstacle.y &&
               bird.y - bird.radius < obstacle.y + obstacle.height;
    }
    
    checkGameState() {
        // 检查是否获胜
        if (this.pigs.length === 0) {
            this.score += this.birds.length * 50; // 剩余小鸟奖励
            this.updateScore();
            this.showMessage('过关！');
            setTimeout(() => {
                this.nextLevel();
            }, 2000);
            return;
        }
        
        // 检查是否失败
        if (this.birds.length === 0 && (!this.currentBird || (this.currentBird.launched && Math.abs(this.currentBird.vx) < 0.1 && Math.abs(this.currentBird.vy) < 0.1))) {
            this.showMessage('游戏结束！');
            setTimeout(() => {
                this.resetLevel();
            }, 2000);
        }
    }
    
    nextLevel() {
        this.level++;
        this.updateLevel();
        this.loadLevel();
    }
    
    resetLevel() {
        this.loadLevel();
        this.gameRunning = false;
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateLevel() {
        document.getElementById('level').textContent = this.level;
    }
    
    showMessage(text) {
        let messageEl = document.querySelector('.game-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'game-message';
            document.body.appendChild(messageEl);
        }
        
        messageEl.textContent = text;
        messageEl.classList.add('show');
        
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 2000);
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.drawBackground();
        
        // 绘制弹弓
        this.drawSlingshot();
        
        // 绘制轨迹预测
        if (this.isAiming && this.trajectoryPoints.length > 0) {
            this.drawTrajectory();
        }
        
        // 绘制障碍物
        this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
        
        // 绘制猪
        this.pigs.forEach(pig => pig.draw(this.ctx));
        
        // 绘制小鸟
        this.birds.forEach(bird => {
            if (bird.launched) bird.draw(this.ctx);
        });
        
        // 绘制当前小鸟
        if (this.currentBird) {
            this.currentBird.draw(this.ctx);
        }
        
        // 绘制剩余小鸟
        this.drawRemainingBirds();
    }
    
    drawBackground() {
        // 天空
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.6);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#B0E0E6');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.6);
        
        // 地面
        const groundGradient = this.ctx.createLinearGradient(0, this.canvas.height * 0.6, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#90EE90');
        groundGradient.addColorStop(1, '#228B22');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.canvas.height * 0.6, this.canvas.width, this.canvas.height * 0.4);
        
        // 云朵
        this.drawClouds();
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        // 云朵1
        this.ctx.beginPath();
        this.ctx.arc(200, 100, 30, 0, Math.PI * 2);
        this.ctx.arc(230, 90, 40, 0, Math.PI * 2);
        this.ctx.arc(260, 100, 30, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 云朵2
        this.ctx.beginPath();
        this.ctx.arc(800, 80, 25, 0, Math.PI * 2);
        this.ctx.arc(825, 75, 35, 0, Math.PI * 2);
        this.ctx.arc(850, 80, 25, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawSlingshot() {
        // 弹弓支架
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(this.slingshot.x - 30, this.slingshot.y + 50);
        this.ctx.lineTo(this.slingshot.x - 15, this.slingshot.y - 80);
        this.ctx.moveTo(this.slingshot.x + 30, this.slingshot.y + 50);
        this.ctx.lineTo(this.slingshot.x + 15, this.slingshot.y - 80);
        this.ctx.stroke();
        
        // 弹弓橡皮筋
        if (this.currentBird && this.isAiming) {
            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(this.slingshot.x - 15, this.slingshot.y - 80);
            this.ctx.lineTo(this.currentBird.x, this.currentBird.y);
            this.ctx.lineTo(this.slingshot.x + 15, this.slingshot.y - 80);
            this.ctx.stroke();
        }
    }
    
    drawTrajectory() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.trajectoryPoints.forEach((point, index) => {
            if (index % 3 === 0) { // 每隔3个点绘制一个
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    drawRemainingBirds() {
        this.birds.forEach((bird, index) => {
            if (!bird.launched) {
                const x = 50 + index * 35;
                const y = 550;
                
                this.ctx.fillStyle = bird.color;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 15, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 眼睛
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(x - 5, y - 3, 3, 0, Math.PI * 2);
                this.ctx.arc(x + 5, y - 3, 3, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = 'black';
                this.ctx.beginPath();
                this.ctx.arc(x - 5, y - 3, 1, 0, Math.PI * 2);
                this.ctx.arc(x + 5, y - 3, 1, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 小鸟类
class Bird {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.launched = false;
    }
    
    update() {
        if (this.launched) {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.5; // 重力
            this.vx *= 0.998; // 空气阻力
        }
    }
    
    draw(ctx) {
        // 小鸟身体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 眼睛
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 7, this.y - 5, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 7, this.y - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 7, this.y - 5, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 7, this.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 嘴巴
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 3);
        ctx.lineTo(this.x - 8, this.y + 8);
        ctx.lineTo(this.x + 8, this.y + 8);
        ctx.closePath();
        ctx.fill();
        
        // 眉毛（愤怒表情）
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - 12, this.y - 10);
        ctx.lineTo(this.x - 2, this.y - 15);
        ctx.moveTo(this.x + 12, this.y - 10);
        ctx.lineTo(this.x + 2, this.y - 15);
        ctx.stroke();
    }
}

// 猪类
class Pig {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 25;
    }
    
    draw(ctx) {
        // 猪身体
        ctx.fillStyle = '#90EE90';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 边框
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 眼睛
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 5, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 5, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 鼻子
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 3, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 鼻孔
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y + 3, 1, 0, Math.PI * 2);
        ctx.arc(this.x + 2, this.y + 3, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // 耳朵
        ctx.fillStyle = '#90EE90';
        ctx.beginPath();
        ctx.arc(this.x - 15, this.y - 15, 6, 0, Math.PI * 2);
        ctx.arc(this.x + 15, this.y - 15, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 障碍物类
class Obstacle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    draw(ctx) {
        // 木头纹理效果
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#DEB887');
        gradient.addColorStop(0.5, '#D2B48C');
        gradient.addColorStop(1, '#CD853F');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 边框
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // 木头纹理线条
        ctx.strokeStyle = '#A0522D';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.height; i += 10) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + i);
            ctx.lineTo(this.x + this.width, this.y + i);
            ctx.stroke();
        }
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new AngryBirdsGame();
});
