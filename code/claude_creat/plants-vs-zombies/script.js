// 植物大战僵尸游戏类
class PlantsVsZombiesGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 动态调整canvas尺寸
        this.adjustCanvasSize();
        
        // 游戏状态
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.score = 0;
        this.sunPoints = 50;
        this.currentWave = 1;
        this.waveProgress = 0;
        this.zombieKills = 0;
        
        // 游戏对象数组
        this.plants = [];
        this.zombies = [];
        this.projectiles = [];
        this.suns = [];
        this.explosions = [];
        
        // 游戏网格
        this.rows = 5;
        this.cols = 9;
        this.cellWidth = this.canvas.width / this.cols;
        this.cellHeight = this.canvas.height / this.rows;
        this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(null));
        
        // 选中的植物类型
        this.selectedPlant = null;
        this.shovelMode = false;
        this.plantCooldowns = {};
        
        // UI元素
        this.plantPreview = document.getElementById('plantPreview');
        this.plantingIndicator = document.getElementById('plantingIndicator');
        
        // 鼠标状态
        this.mouseX = 0;
        this.mouseY = 0;
        this.hoveredCell = { row: -1, col: -1 };
        
        // 游戏时间
        this.gameTime = 0;
        this.lastSunSpawn = 0;
        this.lastZombieSpawn = 0;
        
        // 僵尸生成配置
        this.zombieSpawnRate = 5000; // 5秒生成一只僵尸
        this.zombiesPerWave = 10;
        this.zombiesSpawned = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.startSunProduction();
        this.gameLoop();
        this.addMessageStyles();
    }
    
    setupEventListeners() {
        // 植物选择
        document.querySelectorAll('.plant-card').forEach(card => {
            card.addEventListener('click', () => this.selectPlant(card));
        });
        
        // 画布事件
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleCanvasMouseLeave());
        
        // 游戏控制按钮
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartModalBtn').addEventListener('click', () => this.restartGame());
        
        // 铲子
        document.getElementById('shovelContainer').addEventListener('click', () => this.toggleShovel());
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // 窗口大小调整
        window.addEventListener('resize', () => {
            this.adjustCanvasSize();
            // 重新计算网格尺寸
            this.cellWidth = this.canvas.width / this.cols;
            this.cellHeight = this.canvas.height / this.rows;
        });
    }
    
    selectPlant(card) {
        const plantType = card.dataset.plant;
        const cost = parseInt(card.dataset.cost);
        const cooldown = parseInt(card.dataset.cooldown);
        
        // 检查冷却时间
        if (this.plantCooldowns[plantType] && Date.now() - this.plantCooldowns[plantType] < cooldown) {
            const remainingTime = Math.ceil((cooldown - (Date.now() - this.plantCooldowns[plantType])) / 1000);
            this.showMessage(`${this.getPlantName(plantType)}冷却中！还需${remainingTime}秒`);
            return;
        }
        
        if (this.sunPoints >= cost && !card.classList.contains('disabled')) {
            // 如果点击的是已选中的植物，则取消选择
            if (this.selectedPlant === plantType) {
                this.clearSelection();
                return;
            }
            
            // 清除之前的选择
            this.clearSelection();
            
            // 选择新植物
            card.classList.add('selected');
            this.selectedPlant = plantType;
            
            // 显示种植指示器
            this.showPlantingIndicator(plantType);
            
            // 更新鼠标样式
            this.canvas.style.cursor = 'crosshair';
        } else if (this.sunPoints < cost) {
            this.showMessage(`太阳不足！需要${cost}点，当前${this.sunPoints}点`);
            // 添加太阳不足的视觉提示
            this.shakeSunCounter();
        }
    }
    
    shakeSunCounter() {
        const sunCounter = document.querySelector('.sun-counter');
        sunCounter.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            sunCounter.style.animation = '';
        }, 500);
    }
    
    showPlantingIndicator(plantType) {
        const indicator = this.plantingIndicator;
        const iconEl = indicator.querySelector('.indicator-icon');
        const textEl = indicator.querySelector('.indicator-text');
        
        // 设置植物图标
        const plantIcons = {
            sunflower: '🌻',
            peashooter: '🌿',
            wallnut: '🥜',
            repeater: '🌱',
            snowpea: '❄️',
            cherrybomb: '🍒'
        };
        
        iconEl.textContent = plantIcons[plantType] || '🌱';
        textEl.textContent = `选择位置种植${this.getPlantName(plantType)}`;
        
        indicator.classList.add('show');
    }
    
    hidePlantingIndicator() {
        this.plantingIndicator.classList.remove('show');
    }
    
    getPlantName(plantType) {
        const names = {
            sunflower: '向日葵',
            peashooter: '豌豆射手',
            wallnut: '坚果墙',
            repeater: '双发射手',
            snowpea: '寒冰射手',
            cherrybomb: '樱桃炸弹'
        };
        return names[plantType] || '植物';
    }
    
    toggleShovel() {
        this.shovelMode = !this.shovelMode;
        this.selectedPlant = null;
        
        // 清除植物选择
        document.querySelectorAll('.plant-card').forEach(c => c.classList.remove('selected'));
        
        // 更新铲子样式
        const shovelContainer = document.getElementById('shovelContainer');
        if (this.shovelMode) {
            shovelContainer.classList.add('selected');
            this.showMessage('选择要移除的植物');
        } else {
            shovelContainer.classList.remove('selected');
        }
        
        // 隐藏种植指示器
        this.hidePlantingIndicator();
    }
    
    handleCanvasMouseMove(e) {
        if (!this.gameRunning) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        
        // 转换为网格坐标
        const col = Math.floor(this.mouseX / this.cellWidth);
        const row = Math.floor(this.mouseY / this.cellHeight);
        
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.hoveredCell = { row, col };
            
            // 更新鼠标样式
            if (this.selectedPlant) {
                if (this.grid[row][col]) {
                    this.canvas.style.cursor = 'not-allowed';
                } else {
                    this.canvas.style.cursor = 'crosshair';
                }
            } else if (this.shovelMode) {
                if (this.grid[row][col]) {
                    this.canvas.style.cursor = 'pointer';
                } else {
                    this.canvas.style.cursor = 'not-allowed';
                }
            } else {
                // 检查是否悬停在太阳上
                let onSun = false;
                for (let sun of this.suns) {
                    const distance = Math.sqrt((this.mouseX - sun.x) ** 2 + (this.mouseY - sun.y) ** 2);
                    if (distance < sun.radius) {
                        onSun = true;
                        break;
                    }
                }
                this.canvas.style.cursor = onSun ? 'pointer' : 'default';
            }
            
            // 显示植物预览
            if (this.selectedPlant && !this.grid[row][col]) {
                this.showPlantPreview(col, row);
            } else {
                this.hidePlantPreview();
            }
        } else {
            this.hoveredCell = { row: -1, col: -1 };
            this.hidePlantPreview();
            this.canvas.style.cursor = 'default';
        }
    }
    
    handleCanvasMouseLeave() {
        this.hoveredCell = { row: -1, col: -1 };
        this.hidePlantPreview();
    }
    
    showPlantPreview(col, row) {
        const x = col * this.cellWidth + this.cellWidth / 2;
        const y = row * this.cellHeight + this.cellHeight / 2;
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasRect = this.canvas.parentElement.getBoundingClientRect();
        
        const previewX = rect.left - canvasRect.left + x - 25;
        const previewY = rect.top - canvasRect.top + y - 25;
        
        const plantIcons = {
            sunflower: '🌻',
            peashooter: '🌿',
            wallnut: '🥜',
            repeater: '🌱',
            snowpea: '❄️',
            cherrybomb: '🍒'
        };
        
        this.plantPreview.style.left = previewX + 'px';
        this.plantPreview.style.top = previewY + 'px';
        this.plantPreview.textContent = plantIcons[this.selectedPlant] || '🌱';
        this.plantPreview.classList.add('show');
    }
    
    hidePlantPreview() {
        this.plantPreview.classList.remove('show');
    }
    
    handleKeyboard(e) {
        if (!this.gameRunning) return;
        
        // 数字键快速选择植物
        const plantKeys = {
            '1': 'sunflower',
            '2': 'peashooter', 
            '3': 'wallnut',
            '4': 'repeater',
            '5': 'snowpea',
            '6': 'cherrybomb'
        };
        
        if (plantKeys[e.key]) {
            const card = document.querySelector(`[data-plant="${plantKeys[e.key]}"]`);
            if (card) this.selectPlant(card);
        }
        
        // 空格键快速选择铲子
        if (e.key === ' ') {
            e.preventDefault();
            this.toggleShovel();
        }
        
        // ESC键取消选择
        if (e.key === 'Escape') {
            this.clearSelection();
        }
        
        // Q键快速取消选择（额外的快捷键）
        if (e.key.toLowerCase() === 'q') {
            this.clearSelection();
        }
    }
    
    handleCanvasClick(e) {
        if (!this.gameRunning) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 首先检查是否点击到太阳
        if (this.handleSunClick(e)) {
            return; // 如果点击到太阳，不进行植物种植操作
        }
        
        // 转换为网格坐标
        const col = Math.floor(x / this.cellWidth);
        const row = Math.floor(y / this.cellHeight);
        
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            if (this.shovelMode) {
                this.removePlant(row, col);
            } else if (this.selectedPlant && !this.grid[row][col]) {
                this.plantSeed(row, col);
            } else if (this.selectedPlant && this.grid[row][col]) {
                this.showMessage('这里已经有植物了！');
                this.shakeCell(row, col);
            } else if (!this.selectedPlant && !this.shovelMode) {
                this.showMessage('请先选择一个植物！');
            }
        }
    }
    
    handleSunClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 检查是否点击到太阳
        for (let i = this.suns.length - 1; i >= 0; i--) {
            const sun = this.suns[i];
            const distance = Math.sqrt((x - sun.x) ** 2 + (y - sun.y) ** 2);
            
            if (distance < sun.radius) {
                this.collectSun(i);
                return true; // 返回true表示点击到了太阳
            }
        }
        return false; // 返回false表示没有点击到太阳
    }
    
    shakeCell(row, col) {
        // 添加网格震动效果
        const x = col * this.cellWidth;
        const y = row * this.cellHeight;
        
        // 创建震动粒子效果
        for (let i = 0; i < 3; i++) {
            const particle = {
                x: x + this.cellWidth / 2,
                y: y + this.cellHeight / 2,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 15,
                maxLife: 15,
                color: '#FF5722',
                type: 'warning'
            };
            
            if (!this.particles) this.particles = [];
            this.particles.push(particle);
        }
    }
    
    plantSeed(row, col) {
        const plantData = this.getPlantData(this.selectedPlant);
        
        if (this.sunPoints >= plantData.cost) {
            const x = col * this.cellWidth + this.cellWidth / 2;
            const y = row * this.cellHeight + this.cellHeight / 2;
            
            const plant = new Plant(x, y, this.selectedPlant, plantData);
            this.plants.push(plant);
            this.grid[row][col] = plant;
            
            this.sunPoints -= plantData.cost;
            
            // 设置冷却时间
            const cooldown = parseInt(document.querySelector(`[data-plant="${this.selectedPlant}"]`).dataset.cooldown);
            this.plantCooldowns[this.selectedPlant] = Date.now();
            this.startPlantCooldown(this.selectedPlant, cooldown);
            
            // 种植特效
            this.createPlantingEffect(x, y);
            
            // 播放种植音效（如果有的话）
            this.playSound('plant');
            
            this.updateUI();
            
            const plantName = this.getPlantName(this.selectedPlant);
            this.showMessage(`种植了${plantName}！`);
            
            // 立即清除选择状态
            this.clearSelection();
        } else {
            this.showMessage('太阳不足！需要 ' + plantData.cost + ' 点太阳');
        }
    }
    
    clearSelection() {
        // 清除植物选择
        this.selectedPlant = null;
        document.querySelectorAll('.plant-card').forEach(c => c.classList.remove('selected'));
        
        // 清除铲子选择
        this.shovelMode = false;
        document.getElementById('shovelContainer').classList.remove('selected');
        
        // 隐藏UI提示
        this.hidePlantingIndicator();
        this.hidePlantPreview();
        
        // 更新鼠标样式
        this.canvas.style.cursor = 'default';
    }
    
    startPlantCooldown(plantType, duration) {
        const card = document.querySelector(`[data-plant="${plantType}"]`);
        if (!card) return;
        
        card.classList.add('cooldown');
        
        let elapsed = 0;
        const interval = setInterval(() => {
            elapsed += 100;
            const percent = (elapsed / duration) * 100;
            
            card.style.setProperty('--cooldown-percent', `${100 - percent}%`);
            
            if (elapsed >= duration) {
                clearInterval(interval);
                card.classList.remove('cooldown');
                card.style.removeProperty('--cooldown-percent');
            }
        }, 100);
    }
    
    createPlantingEffect(x, y) {
        // 创建种植特效粒子
        for (let i = 0; i < 8; i++) {
            const particle = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 30,
                maxLife: 30,
                color: `hsl(${Math.random() * 60 + 60}, 70%, 60%)`
            };
            
            if (!this.particles) this.particles = [];
            this.particles.push(particle);
        }
    }
    
    removePlant(row, col) {
        if (this.grid[row][col]) {
            const plant = this.grid[row][col];
            
            // 移除植物
            const plantIndex = this.plants.findIndex(p => p === plant);
            if (plantIndex !== -1) {
                this.plants.splice(plantIndex, 1);
            }
            this.grid[row][col] = null;
            
            // 创建移除特效
            this.createRemovalEffect(plant.x, plant.y);
            
            // 播放移除音效
            this.playSound('shovel');
            
            this.updateUI();
            this.showMessage(`移除了${this.getPlantName(plant.type)}！`);
        }
    }
    
    createRemovalEffect(x, y) {
        // 创建移除特效
        for (let i = 0; i < 6; i++) {
            const particle = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 20,
                maxLife: 20,
                color: '#8D6E63'
            };
            
            if (!this.particles) this.particles = [];
            this.particles.push(particle);
        }
    }
    
    playSound(type) {
        // 音效播放功能的改进版本
        try {
            // 使用Web Audio API创建简单的音效
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 根据不同类型设置不同音效
            switch(type) {
                case 'plant':
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                    break;
                    
                case 'shovel':
                    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.15);
                    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                    break;
                    
                case 'collect':
                    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.08);
                    gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
                    break;
                    
                default:
                    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            }
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            
        } catch (error) {
            // 如果Web Audio API不可用，输出到控制台
            console.log(`Playing sound: ${type}`);
        }
    }
    
    getPlantData(type) {
        const plantTypes = {
            sunflower: { cost: 50, health: 300, damage: 0, shootRate: 0, sunProduction: 25, range: 0 },
            peashooter: { cost: 100, health: 300, damage: 20, shootRate: 1500, sunProduction: 0, range: 8 },
            wallnut: { cost: 50, health: 4000, damage: 0, shootRate: 0, sunProduction: 0, range: 0 },
            repeater: { cost: 200, health: 300, damage: 20, shootRate: 750, sunProduction: 0, range: 8 },
            snowpea: { cost: 175, health: 300, damage: 20, shootRate: 1500, sunProduction: 0, range: 8, slow: true },
            cherrybomb: { cost: 150, health: 300, damage: 1800, shootRate: 0, sunProduction: 0, range: 1, explosive: true }
        };
        
        return plantTypes[type] || plantTypes.peashooter;
    }
    
    startGame() {
        this.gameRunning = true;
        this.gameOver = false;
        this.gamePaused = false;
        
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('gameOverModal').style.display = 'none';
    }
    
    restartGame() {
        // 重置游戏状态
        this.gameRunning = false;
        this.gameOver = false;
        this.gamePaused = false;
        this.score = 0;
        this.sunPoints = 50;
        this.currentWave = 1;
        this.waveProgress = 0;
        this.zombiesSpawned = 0;
        this.gameTime = 0;
        this.zombieKills = 0;
        
        // 清空游戏对象
        this.plants = [];
        this.zombies = [];
        this.projectiles = [];
        this.suns = [];
        this.explosions = [];
        this.particles = [];
        this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(null));
        
        // 重置UI状态
        this.selectedPlant = null;
        this.shovelMode = false;
        this.plantCooldowns = {};
        this.hoveredCell = { row: -1, col: -1 };
        
        // 清除所有选择状态
        document.querySelectorAll('.plant-card').forEach(c => {
            c.classList.remove('selected', 'cooldown');
            c.style.removeProperty('--cooldown-percent');
        });
        document.getElementById('shovelContainer').classList.remove('selected');
        
        // 隐藏UI元素
        this.hidePlantingIndicator();
        this.hidePlantPreview();
        
        this.updateUI();
        
        document.getElementById('startBtn').style.display = 'inline-block';
        document.getElementById('gameOverModal').style.display = 'none';
    }
    
    togglePause() {
        if (this.gameRunning && !this.gameOver) {
            this.gamePaused = !this.gamePaused;
            const btn = document.getElementById('pauseBtn');
            btn.textContent = this.gamePaused ? '继续' : '暂停';
        }
    }
    
    startSunProduction() {
        // 定期生成太阳
        setInterval(() => {
            if (this.gameRunning && !this.gamePaused) {
                this.spawnSun();
            }
        }, 10000); // 每10秒生成一个太阳
    }
    
    spawnSun() {
        const x = Math.random() * (this.canvas.width - 60) + 30;
        const sun = new Sun(x, -30, 25);
        this.suns.push(sun);
    }
    
    collectSun(index) {
        this.sunPoints += this.suns[index].value;
        this.suns.splice(index, 1);
        this.playSound('collect');
        this.updateUI();
        this.showMessage(`+${this.suns[index]?.value || 25} 太阳！`);
    }
    
    spawnZombie() {
        if (this.zombiesSpawned >= this.zombiesPerWave) {
            return;
        }
        
        const row = Math.floor(Math.random() * this.rows);
        const y = row * this.cellHeight + this.cellHeight / 2;
        const zombie = new Zombie(this.canvas.width + 50, y);
        
        this.zombies.push(zombie);
        this.zombiesSpawned++;
    }
    
    update(deltaTime) {
        if (!this.gameRunning || this.gamePaused || this.gameOver) return;
        
        this.gameTime += deltaTime;
        
        // 生成僵尸
        if (this.gameTime - this.lastZombieSpawn > this.zombieSpawnRate) {
            this.spawnZombie();
            this.lastZombieSpawn = this.gameTime;
        }
        
        // 更新波次进度
        this.waveProgress = (this.zombiesSpawned / this.zombiesPerWave) * 100;
        this.updateWaveProgress();
        
        // 更新植物
        this.plants.forEach(plant => {
            plant.update(deltaTime);
            
            // 植物射击
            if (plant.canShoot()) {
                const target = this.findTarget(plant);
                if (target) {
                    plant.shoot();
                    this.createProjectile(plant, target);
                }
            }
            
            // 向日葵生产太阳
            if (plant.type === 'sunflower' && plant.canProduceSun()) {
                plant.produceSun();
                const sun = new Sun(plant.x, plant.y, 25);
                this.suns.push(sun);
            }
            
            // 樱桃炸弹爆炸
            if (plant.type === 'cherrybomb' && plant.shouldExplode()) {
                this.explodeCherryBomb(plant);
            }
        });
        
        // 更新僵尸
        this.zombies.forEach(zombie => {
            zombie.update(deltaTime);
            
            // 检查僵尸是否到达左边界
            if (zombie.x < -50) {
                this.gameOver = true;
                this.showGameOver();
            }
        });
        
        // 更新子弹
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime);
        });
        
        // 更新太阳
        this.suns.forEach(sun => {
            sun.update(deltaTime);
        });
        
        // 更新爆炸效果
        this.explosions.forEach(explosion => {
            explosion.update(deltaTime);
        });
        
        // 碰撞检测
        this.checkCollisions();
        
        // 清理无效对象
        this.cleanup();
        
        // 检查波次完成
        this.checkWaveComplete();
    }
    
    findTarget(plant) {
        const plantRow = Math.floor((plant.y - this.cellHeight / 2) / this.cellHeight);
        
        // 寻找同一行的僵尸
        for (let zombie of this.zombies) {
            const zombieRow = Math.floor((zombie.y - this.cellHeight / 2) / this.cellHeight);
            
            if (zombieRow === plantRow && zombie.x > plant.x) {
                const distance = zombie.x - plant.x;
                if (distance <= plant.range * this.cellWidth) {
                    return zombie;
                }
            }
        }
        
        return null;
    }
    
    createProjectile(plant, target) {
        let projectile;
        
        if (plant.type === 'snowpea') {
            projectile = new Projectile(plant.x + 20, plant.y, plant.damage, 'snowpea');
        } else if (plant.type === 'repeater') {
            // 连发豌豆射手发射两颗豌豆
            projectile = new Projectile(plant.x + 20, plant.y, plant.damage, 'pea');
            this.projectiles.push(projectile);
            
            setTimeout(() => {
                const secondProjectile = new Projectile(plant.x + 20, plant.y, plant.damage, 'pea');
                this.projectiles.push(secondProjectile);
            }, 100);
            return;
        } else {
            projectile = new Projectile(plant.x + 20, plant.y, plant.damage, 'pea');
        }
        
        this.projectiles.push(projectile);
    }
    
    explodeCherryBomb(plant) {
        // 创建爆炸效果
        const explosion = new Explosion(plant.x, plant.y, 150);
        this.explosions.push(explosion);
        
        // 对范围内的僵尸造成伤害
        this.zombies.forEach(zombie => {
            const distance = Math.sqrt((zombie.x - plant.x) ** 2 + (zombie.y - plant.y) ** 2);
            if (distance <= 150) {
                zombie.takeDamage(plant.damage);
            }
        });
        
        // 移除樱桃炸弹
        const plantIndex = this.plants.findIndex(p => p === plant);
        if (plantIndex !== -1) {
            this.plants.splice(plantIndex, 1);
            
            // 清空网格
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    if (this.grid[row][col] === plant) {
                        this.grid[row][col] = null;
                        break;
                    }
                }
            }
        }
    }
    
    checkCollisions() {
        // 子弹与僵尸碰撞
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            for (let j = this.zombies.length - 1; j >= 0; j--) {
                const zombie = this.zombies[j];
                
                if (projectile.x >= zombie.x - 25 && projectile.x <= zombie.x + 25 &&
                    projectile.y >= zombie.y - 25 && projectile.y <= zombie.y + 25) {
                    
                    // 造成伤害
                    zombie.takeDamage(projectile.damage);
                    
                    // 冰豌豆减速效果
                    if (projectile.type === 'snowpea') {
                        zombie.slow();
                    }
                    
                    // 移除子弹
                    this.projectiles.splice(i, 1);
                    break;
                }
            }
        }
        
        // 僵尸与植物碰撞
        for (let zombie of this.zombies) {
            const col = Math.floor((zombie.x - this.cellWidth / 2) / this.cellWidth);
            const row = Math.floor((zombie.y - this.cellHeight / 2) / this.cellHeight);
            
            if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                const plant = this.grid[row][col];
                
                if (plant && zombie.x <= plant.x + 30) {
                    zombie.attack(plant);
                    
                    if (plant.health <= 0) {
                        // 移除植物
                        const plantIndex = this.plants.findIndex(p => p === plant);
                        if (plantIndex !== -1) {
                            this.plants.splice(plantIndex, 1);
                        }
                        this.grid[row][col] = null;
                    }
                }
            }
        }
    }
    
    cleanup() {
        // 移除死亡的僵尸
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            if (this.zombies[i].health <= 0) {
                this.score += 100;
                this.zombieKills++;
                this.zombies.splice(i, 1);
            }
        }
        
        // 移除超出边界的子弹
        this.projectiles = this.projectiles.filter(p => p.x < this.canvas.width + 50);
        
        // 移除落地的太阳
        this.suns = this.suns.filter(s => s.y < this.canvas.height + 50);
        
        // 移除完成的爆炸效果
        this.explosions = this.explosions.filter(e => !e.finished);
        
        // 更新粒子系统
        if (this.particles) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const particle = this.particles[i];
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life--;
                
                if (particle.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        }
    }
    
    checkWaveComplete() {
        if (this.zombiesSpawned >= this.zombiesPerWave && this.zombies.length === 0) {
            this.currentWave++;
            this.zombiesSpawned = 0;
            this.waveProgress = 0;
            this.zombieSpawnRate = Math.max(2000, this.zombieSpawnRate - 200); // 加快生成速度
            this.zombiesPerWave += 2; // 增加僵尸数量
            
            // 奖励太阳点数
            this.sunPoints += 50;
            this.updateUI();
        }
    }
    
    showGameOver() {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverModal').style.display = 'block';
    }
    
    updateUI() {
        document.getElementById('sunPoints').textContent = this.sunPoints;
        document.getElementById('score').textContent = this.score;
        document.getElementById('currentWave').textContent = this.currentWave;
        document.getElementById('zombieKills').textContent = this.zombieKills;
        document.getElementById('plantsCount').textContent = this.plants.length;
        
        // 更新植物卡片状态
        document.querySelectorAll('.plant-card').forEach(card => {
            const cost = parseInt(card.dataset.cost);
            const plantType = card.dataset.plant;
            const cooldown = parseInt(card.dataset.cooldown);
            
            // 检查太阳是否足够
            if (this.sunPoints < cost) {
                card.classList.add('disabled');
            } else {
                card.classList.remove('disabled');
            }
            
            // 检查冷却时间
            if (this.plantCooldowns[plantType] && Date.now() - this.plantCooldowns[plantType] < cooldown) {
                card.classList.add('cooldown');
            } else {
                card.classList.remove('cooldown');
            }
        });
    }
    
    updateWaveProgress() {
        document.getElementById('waveProgress').style.width = this.waveProgress + '%';
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格高亮
        this.drawGridHighlight();
        
        // 绘制植物
        this.plants.forEach(plant => plant.draw(this.ctx));
        
        // 绘制僵尸
        this.zombies.forEach(zombie => zombie.draw(this.ctx));
        
        // 绘制子弹
        this.projectiles.forEach(projectile => projectile.draw(this.ctx));
        
        // 绘制太阳
        this.suns.forEach(sun => sun.draw(this.ctx));
        
        // 绘制爆炸效果
        this.explosions.forEach(explosion => explosion.draw(this.ctx));
        
        // 绘制粒子效果
        this.drawParticles();
        
        // 绘制暂停提示
        if (this.gamePaused) {
            this.drawPauseOverlay();
        }
    }
    
    drawGridHighlight() {
        if (this.hoveredCell.row >= 0 && this.hoveredCell.col >= 0) {
            const x = this.hoveredCell.col * this.cellWidth;
            const y = this.hoveredCell.row * this.cellHeight;
            
            // 基础网格高亮
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x + 1, y + 1, this.cellWidth - 2, this.cellHeight - 2);
            
            if (this.selectedPlant && !this.grid[this.hoveredCell.row][this.hoveredCell.col]) {
                // 可种植区域 - 绿色高亮
                this.ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
                this.ctx.fillRect(x, y, this.cellWidth, this.cellHeight);
                
                // 添加种植指示圆圈
                this.ctx.strokeStyle = '#4CAF50';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.arc(x + this.cellWidth/2, y + this.cellHeight/2, 30, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                
            } else if (this.selectedPlant && this.grid[this.hoveredCell.row][this.hoveredCell.col]) {
                // 不可种植区域 - 红色高亮
                this.ctx.fillStyle = 'rgba(244, 67, 54, 0.4)';
                this.ctx.fillRect(x, y, this.cellWidth, this.cellHeight);
                
                // 添加禁止符号
                this.ctx.strokeStyle = '#F44336';
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.arc(x + this.cellWidth/2, y + this.cellHeight/2, 25, 0, Math.PI * 2);
                this.ctx.moveTo(x + this.cellWidth/2 - 18, y + this.cellHeight/2 - 18);
                this.ctx.lineTo(x + this.cellWidth/2 + 18, y + this.cellHeight/2 + 18);
                this.ctx.stroke();
                
            } else if (this.shovelMode && this.grid[this.hoveredCell.row][this.hoveredCell.col]) {
                // 可移除区域 - 橙色高亮
                this.ctx.fillStyle = 'rgba(255, 87, 34, 0.3)';
                this.ctx.fillRect(x, y, this.cellWidth, this.cellHeight);
                
                // 添加铲子指示
                this.ctx.strokeStyle = '#FF5722';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([3, 3]);
                this.ctx.beginPath();
                this.ctx.arc(x + this.cellWidth/2, y + this.cellHeight/2, 25, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                
            } else if (this.shovelMode && !this.grid[this.hoveredCell.row][this.hoveredCell.col]) {
                // 空地但铲子模式 - 灰色高亮
                this.ctx.fillStyle = 'rgba(158, 158, 158, 0.3)';
                this.ctx.fillRect(x, y, this.cellWidth, this.cellHeight);
            }
        }
    }
    
    drawParticles() {
        if (!this.particles) return;
        
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.globalAlpha = alpha;
            
            if (particle.type === 'warning') {
                // 警告粒子使用特殊样式
                this.ctx.fillStyle = particle.color;
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // 添加闪烁效果
                if (Math.sin(Date.now() / 100) > 0) {
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else {
                // 普通粒子
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('按暂停按钮继续游戏', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        // 画垂直线
        for (let i = 0; i <= this.cols; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellWidth, 0);
            this.ctx.lineTo(i * this.cellWidth, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 画水平线
        for (let i = 0; i <= this.rows; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellHeight);
            this.ctx.lineTo(this.canvas.width, i * this.cellHeight);
            this.ctx.stroke();
        }
    }
    
    gameLoop() {
        const currentTime = Date.now();
        const deltaTime = currentTime - (this.lastTime || currentTime);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // 添加消息样式到CSS中的方法
    addMessageStyles() {
        if (!document.querySelector('#messageStyles')) {
            const style = document.createElement('style');
            style.id = 'messageStyles';
            style.textContent = `
                .game-message {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 15px 25px;
                    border-radius: 10px;
                    font-size: 1.2rem;
                    font-weight: bold;
                    z-index: 1000;
                    display: none;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    border: 2px solid #4CAF50;
                }
                
                .game-message.show {
                    display: block;
                    animation: messageSlideIn 0.5s ease-out;
                }
                
                @keyframes messageSlideIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    showMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'game-message';
        messageEl.textContent = text;
        document.body.appendChild(messageEl);
        
        // 显示消息
        requestAnimationFrame(() => {
            messageEl.classList.add('show');
        });
        
        // 自动隐藏消息
        setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(messageEl);
            }, 500);
        }, 2000);
    }
    
    adjustCanvasSize() {
        const gameField = this.canvas.parentElement;
        const fieldRect = gameField.getBoundingClientRect();
        
        // 计算可用空间
        const maxWidth = Math.min(900, fieldRect.width - 40);
        const maxHeight = Math.min(500, fieldRect.height - 40);
        
        // 保持9:5的比例
        const aspectRatio = 9 / 5;
        let canvasWidth = maxWidth;
        let canvasHeight = maxWidth / aspectRatio;
        
        if (canvasHeight > maxHeight) {
            canvasHeight = maxHeight;
            canvasWidth = maxHeight * aspectRatio;
        }
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';
    }
}

// 植物类
class Plant {
    constructor(x, y, type, data) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.health = data.health;
        this.maxHealth = data.health;
        this.damage = data.damage;
        this.shootRate = data.shootRate;
        this.sunProduction = data.sunProduction;
        this.range = data.range;
        this.slow = data.slow || false;
        this.explosive = data.explosive || false;
        
        this.lastShot = 0;
        this.lastSunProduction = 0;
        this.planted = Date.now();
        
        // 缓存相关
        this.cachedCanvas = null;
        this.cachedCtx = null;
        this.lastDrawnHealth = this.health;
        this.lastDrawnTime = null;
    }
    
    update(deltaTime) {
        // 植物更新逻辑
    }
    
    canShoot() {
        if (this.damage === 0) return false;
        const now = Date.now();
        return now - this.lastShot > this.shootRate;
    }
    
    shoot() {
        this.lastShot = Date.now();
    }
    
    canProduceSun() {
        const now = Date.now();
        return now - this.lastSunProduction > 24000; // 24秒生产一个太阳
    }
    
    produceSun() {
        this.lastSunProduction = Date.now();
    }
    
    shouldExplode() {
        if (this.type !== 'cherrybomb') return false;
        return Date.now() - this.planted > 1500; // 1.5秒后爆炸
    }
    
    takeDamage(damage) {
        this.health -= damage;
    }
    
    draw(ctx) {
        // 动态植物或需要实时更新的植物直接绘制
        if (this.type.includes('cherry') || this.type.includes('snow') || this.health < this.maxHealth) {
            this.drawPlantBody(ctx);
        } else {
            // 静态植物使用缓存
            if (this.lastDrawnHealth === this.health && this.lastDrawnTime && Date.now() - this.lastDrawnTime < 100) {
                if (this.cachedCanvas) {
                    ctx.drawImage(this.cachedCanvas, this.x - 30, this.y - 30);
                    return;
                }
            }
            
            // 创建缓存canvas
            if (!this.cachedCanvas) {
                this.cachedCanvas = document.createElement('canvas');
                this.cachedCanvas.width = 60;
                this.cachedCanvas.height = 60;
                this.cachedCtx = this.cachedCanvas.getContext('2d');
            }
            
            // 在缓存canvas上绘制
            this.cachedCtx.clearRect(0, 0, 60, 60);
            this.cachedCtx.save();
            this.cachedCtx.translate(30, 30);
            this.drawPlantOnly(this.cachedCtx);
            this.cachedCtx.restore();
            
            // 绘制到主canvas
            ctx.drawImage(this.cachedCanvas, this.x - 30, this.y - 30);
            
            this.lastDrawnHealth = this.health;
            this.lastDrawnTime = Date.now();
        }
        
        // 绘制健康条
        this.drawHealthBar(ctx);
    }
    
    drawPlantBody(ctx) {
        // 绘制植物（包含位置变换）
        ctx.save();
        ctx.translate(this.x, this.y);
        this.drawPlantOnly(ctx);
        ctx.restore();
    }
    
    drawPlantOnly(ctx) {
        // 绘制植物本体（不包含位置变换）
        switch (this.type) {
            case 'sunflower':
                this.drawSunflower(ctx);
                break;
            case 'peashooter':
                this.drawPeashooter(ctx);
                break;
            case 'wallnut':
                this.drawWallnut(ctx);
                break;
            case 'repeater':
                this.drawRepeater(ctx);
                break;
            case 'snowpea':
                this.drawSnowPea(ctx);
                break;
            case 'cherrybomb':
                this.drawCherryBomb(ctx);
                break;
        }
    }
    
    drawHealthBar(ctx) {
        // 绘制植物健康条
        const healthPercent = this.health / this.maxHealth;
        const barWidth = 40;
        const barHeight = 4;
        
        if (healthPercent < 1) {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - barWidth/2, this.y - 35, barWidth, barHeight);
            
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x - barWidth/2, this.y - 35, barWidth * healthPercent, barHeight);
        }
    }
}

// 僵尸类
class Zombie {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.health = 200;
        this.maxHealth = 200;
        this.speed = 0.5;
        this.damage = 100;
        this.attackRate = 1000; // 1秒攻击一次
        this.lastAttack = 0;
        this.isSlowed = false;
        this.slowDuration = 0;
        this.originalSpeed = this.speed;
        
        // 动画
        this.walkFrame = 0;
        this.lastFrameTime = 0;
    }
    
    update(deltaTime) {
        // 更新减速效果
        if (this.isSlowed) {
            this.slowDuration -= deltaTime;
            if (this.slowDuration <= 0) {
                this.isSlowed = false;
                this.speed = this.originalSpeed;
            }
        }
        
        // 移动
        this.x -= this.speed;
        
        // 更新动画帧
        this.lastFrameTime += deltaTime;
        if (this.lastFrameTime > 200) {
            this.walkFrame = (this.walkFrame + 1) % 4;
            this.lastFrameTime = 0;
        }
    }
    
    attack(plant) {
        const now = Date.now();
        if (now - this.lastAttack > this.attackRate) {
            plant.takeDamage(this.damage);
            this.lastAttack = now;
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
    }
    
    slow() {
        this.isSlowed = true;
        this.slowDuration = 5000; // 5秒减速
        this.speed = this.originalSpeed * 0.3;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 绘制健康条
        const healthPercent = this.health / this.maxHealth;
        const barWidth = 40;
        const barHeight = 4;
        
        ctx.fillStyle = 'red';
        ctx.fillRect(-barWidth/2, -35, barWidth, barHeight);
        
        ctx.fillStyle = 'green';
        ctx.fillRect(-barWidth/2, -35, barWidth * healthPercent, barHeight);
        
        // 绘制僵尸身体
        ctx.fillStyle = this.isSlowed ? '#B3E5FC' : '#9E9E9E';
        ctx.beginPath();
        ctx.roundRect(-15, -10, 30, 20, 5);
        ctx.fill();
        
        // 头部
        ctx.fillStyle = '#8BC34A';
        ctx.beginPath();
        ctx.arc(0, -20, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // 眼睛
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(-5, -22, 2, 0, Math.PI * 2);
        ctx.arc(5, -22, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 嘴巴
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(0, -15, 3, 0, Math.PI);
        ctx.fill();
        
        // 腿部动画
        const legOffset = Math.sin(this.walkFrame) * 3;
        ctx.fillStyle = '#795548';
        ctx.fillRect(-8, 10, 6, 15 + legOffset);
        ctx.fillRect(2, 10, 6, 15 - legOffset);
        
        // 减速效果
        if (this.isSlowed) {
            ctx.fillStyle = 'rgba(173, 216, 230, 0.5)';
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// 子弹类
class Projectile {
    constructor(x, y, damage, type) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.type = type;
        this.speed = 5;
    }
    
    update(deltaTime) {
        this.x += this.speed;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.type === 'snowpea') {
            // 冰豌豆
            ctx.fillStyle = '#81D4FA';
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // 冰霜效果
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 普通豌豆
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // 高光
            ctx.fillStyle = '#8BC34A';
            ctx.beginPath();
            ctx.arc(-2, -2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// 太阳类
class Sun {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = 20;
        this.speed = 1;
        this.targetY = Math.random() * 400 + 100;
        this.collected = false;
        
        // 动画
        this.glowSize = 0;
        this.glowDirection = 1;
    }
    
    update(deltaTime) {
        if (this.y < this.targetY) {
            this.y += this.speed;
        }
        
        // 发光动画
        this.glowSize += this.glowDirection * 0.5;
        if (this.glowSize > 5 || this.glowSize < 0) {
            this.glowDirection *= -1;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 发光效果
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius + this.glowSize);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.7, '#FFA500');
        gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + this.glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 主体
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 光芒
        ctx.strokeStyle = '#FF8C00';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * (this.radius + 2), Math.sin(angle) * (this.radius + 2));
            ctx.lineTo(Math.cos(angle) * (this.radius + 8), Math.sin(angle) * (this.radius + 8));
            ctx.stroke();
        }
        
        // 数值
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.value.toString(), 0, 5);
        
        ctx.restore();
    }
}

// 爆炸类
class Explosion {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.maxRadius = radius;
        this.currentRadius = 0;
        this.opacity = 1;
        this.finished = false;
        this.duration = 600; // 0.6秒
        this.startTime = Date.now();
    }
    
    update(deltaTime) {
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        
        if (progress >= 1) {
            this.finished = true;
            return;
        }
        
        this.currentRadius = this.maxRadius * progress;
        this.opacity = 1 - progress;
    }
    
    draw(ctx) {
        if (this.finished) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // 爆炸效果
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.currentRadius);
        gradient.addColorStop(0, '#FF5722');
        gradient.addColorStop(0.3, '#FF9800');
        gradient.addColorStop(0.6, '#FFC107');
        gradient.addColorStop(1, 'rgba(255, 193, 7, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// CanvasRenderingContext2D.roundRect polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
    };
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new PlantsVsZombiesGame();
});
