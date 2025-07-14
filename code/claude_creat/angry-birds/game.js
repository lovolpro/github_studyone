// 游戏主类
window.AngryBirdsGame = class AngryBirdsGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 游戏状态
        this.score = 0;
        this.level = 1;
        this.birds = [];
        this.pigs = [];
        this.obstacles = [];
        this.explosions = []; // 爆炸效果数组
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
        const config = window.levelConfigs[Math.min(this.level - 1, window.levelConfigs.length - 1)];
        
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
        
        // 更新爆炸效果
        if (this.explosions && this.explosions.length > 0) {
            this.explosions.forEach(explosion => {
                if (explosion.active) {
                    explosion.alpha -= 0.01; // 爆炸效果逐渐消失
                    if (explosion.alpha <= 0) {
                        explosion.active = false;
                    }
                }
            });
            
            // 清理不活跃的爆炸效果
            this.explosions = this.explosions.filter(explosion => explosion.active);
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
        
        // 检查与猪的碰撞（无论猪是否在障碍物内部）
        let pigHit = false;
        this.pigs.forEach((pig, index) => {
            if (this.isColliding(bird, pig)) {
                this.score += 100;
                this.updateScore();
                
                // 创建爆炸效果
                this.createExplosion(pig.x, pig.y, '#90EE90', 40);
                
                this.pigs.splice(index, 1);
                this.showMessage('击中！+100分');
                
                // 添加撞击效果
                bird.vx *= 0.5;
                bird.vy *= 0.5;
                pigHit = true;
            }
        });
        
        // 如果已经击中猪，不再检查障碍物碰撞
        if (pigHit) return;
        
        // 检查与障碍物的碰撞
        this.obstacles.forEach(obstacle => {
            if (this.isBirdObstacleColliding(bird, obstacle)) {
                // 检查障碍物内是否有猪
                let pigInObstacle = false;
                this.pigs.forEach((pig, index) => {
                    if (this.isPigInObstacle(pig, obstacle)) {
                        // 如果障碍物内有猪，小鸟的速度只略微减小，增强穿透能力
                        bird.vx *= 0.9;
                        bird.vy *= 0.9;
                        pigInObstacle = true;
                        
                        // 如果小鸟速度过低，给予额外的推力以确保能击中猪
                        if (Math.abs(bird.vx) < 3 && Math.abs(bird.vy) < 3) {
                            const dx = pig.x - bird.x;
                            const dy = pig.y - bird.y;
                            const angle = Math.atan2(dy, dx);
                            bird.vx += Math.cos(angle) * 2;
                            bird.vy += Math.sin(angle) * 2;
                        }
                    }
                });
                
                // 计算小鸟的速度大小，用于伤害计算
                const birdSpeed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
                
                // 对障碍物造成伤害
                const damage = Math.min(birdSpeed * 5, 50); // 最大伤害50
                obstacle.health -= damage;
                
                // 如果障碍物被摧毁
                if (obstacle.health <= 0) {
                    // 从障碍物数组中移除
                    const index = this.obstacles.indexOf(obstacle);
                    if (index > -1) {
                        // 创建爆炸效果
                        const centerX = obstacle.x + obstacle.width / 2;
                        const centerY = obstacle.y + obstacle.height / 2;
                        this.createExplosion(centerX, centerY, '#8B4513', 50);
                        
                        this.obstacles.splice(index, 1);
                        this.score += 50; // 摧毁障碍物奖励
                        this.updateScore();
                        this.showMessage('障碍物摧毁！+50分');
                    }
                    return; // 障碍物已被摧毁，不需要继续处理碰撞
                }
                
                // 如果障碍物内没有猪，正常反弹
                if (!pigInObstacle) {
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
    
    isPigInObstacle(pig, obstacle) {
        // 检查猪是否在障碍物内部或与障碍物重叠
        return pig.x + pig.radius > obstacle.x &&
               pig.x - pig.radius < obstacle.x + obstacle.width &&
               pig.y + pig.radius > obstacle.y &&
               pig.y - pig.radius < obstacle.y + obstacle.height;
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
    
    createExplosion(x, y, color = '#FF9800', size = 30) {
        // 创建爆炸效果
        const explosion = {
            x,
            y,
            color,
            size,
            particles: [],
            alpha: 1,
            active: true
        };
        
        // 创建爆炸粒子
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            explosion.particles.push({
                x: 0,
                y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                alpha: 1
            });
        }
        
        // 添加到爆炸数组
        if (!this.explosions) this.explosions = [];
        this.explosions.push(explosion);
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
        
        // 绘制爆炸效果
        this.drawExplosions();
    }
    
    drawExplosions() {
        if (!this.explosions) return;
        
        this.explosions.forEach((explosion, index) => {
            if (!explosion.active) return;
            
            explosion.alpha -= 0.02; // 爆炸效果逐渐消失
            
            if (explosion.alpha <= 0) {
                explosion.active = false;
                return;
            }
            
            // 绘制爆炸粒子
            explosion.particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.alpha = explosion.alpha;
                
                this.ctx.globalAlpha = particle.alpha;
                this.ctx.fillStyle = explosion.color;
                this.ctx.beginPath();
                this.ctx.arc(
                    explosion.x + particle.x,
                    explosion.y + particle.y,
                    particle.size,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            });
            
            this.ctx.globalAlpha = 1;
        });
        
        // 清理不活跃的爆炸效果
        this.explosions = this.explosions.filter(explosion => explosion.active);
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