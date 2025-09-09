import { CONFIG } from './config.js';

export class Ball {
    constructor(x, y, radius, color, mass = 1, number = null, isStripe = false) {
        this.x = x; this.y = y;
        this.vx = 0; this.vy = 0;
        this.radius = radius; this.color = color;
        this.mass = mass; this.number = number;
        this.isStripe = isStripe;
        this.friction = CONFIG.physics.friction;
        this.spin = 0;
        this.lastCollisionFrame = 0; // 用于调试描边
    }

    update(pockets, railHeight = CONFIG.railHeight, dt = 1) {
        // 安全检查：确保数值有效
        if (isNaN(this.vx) || isNaN(this.vy) || isNaN(this.x) || isNaN(this.y)) {
            console.warn('球的位置或速度出现NaN，重置');
            this.vx = this.vy = 0;
            if (isNaN(this.x) || isNaN(this.y)) {
                this.x = 400; this.y = 300; // 重置到安全位置
            }
            return;
        }

        // 旋转 -> 线速度
        if (this.spin) {
            this.vx += this.spin * CONFIG.physics.spinToVelocity * dt;
            this.spin *= Math.pow(CONFIG.physics.spinDecay, dt);
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.vx *= Math.pow(this.friction, dt);
        this.vy *= Math.pow(this.friction, dt);

        if (Math.abs(this.vx) < CONFIG.physics.minVelocity) this.vx = 0;
        if (Math.abs(this.vy) < CONFIG.physics.minVelocity) this.vy = 0;
        if (Math.abs(this.spin) < 0.01) this.spin = 0;

        // 入口吸附逻辑（在墙体碰撞前应用，使其更易进入袋口）
        this.applyPocketAttraction(pockets);

        this.handleWallCollisions(pockets, railHeight);
        this.enforceBoundaries(railHeight);
    }

    // 强制边界约束，防止球跑出桌面
    enforceBoundaries(railHeight) {
        const game = window.game || this.game;
        const tableOffsetX = game ? game.tableOffsetX : 400;
        const tableOffsetY = game ? game.tableOffsetY : 150;
        const tableWidth = game ? game.tableWidth : 800;
        const tableHeight = game ? game.tableHeight : 400;

        // 确保球不会跑出左边界
        if (this.x - this.radius < tableOffsetX + railHeight) {
            this.x = tableOffsetX + railHeight + this.radius;
            if (this.vx < 0) this.vx = 0;
        }

        // 确保球不会跑出右边界
        if (this.x + this.radius > tableOffsetX + tableWidth - railHeight) {
            this.x = tableOffsetX + tableWidth - railHeight - this.radius;
            if (this.vx > 0) this.vx = 0;
        }

        // 确保球不会跑出上边界
        if (this.y - this.radius < tableOffsetY + railHeight) {
            this.y = tableOffsetY + railHeight + this.radius;
            if (this.vy < 0) this.vy = 0;
        }

        // 确保球不会跑出下边界
        if (this.y + this.radius > tableOffsetY + tableHeight - railHeight) {
            this.y = tableOffsetY + tableHeight - railHeight - this.radius;
            if (this.vy > 0) this.vy = 0;
        }
    }

    handleWallCollisions(pockets, railHeight) {
        const game = window.game || this.game;
        const tableOffsetX = game ? game.tableOffsetX : 400;
        const tableOffsetY = game ? game.tableOffsetY : 150;
        const tableWidth = game ? game.tableWidth : 800;
        const tableHeight = game ? game.tableHeight : 400;

        const nearPocketMouth = () => {
            // 只要有一个袋子足够近就视为开口区域
            return pockets.some(p => {
                const dx = this.x - p.x;
                const dy = this.y - p.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const isCorner = p.radius >= 26;
                const factor = (isCorner ? CONFIG.pocket.cornerFactor : CONFIG.pocket.attractRadiusFactor);
                let mouthRadius = p.radius * factor + (isCorner ? CONFIG.pocket.cornerMouthExtra : CONFIG.pocket.sideMouthExtra);
                return dist < mouthRadius;
            });
        };

        const wallRest = CONFIG.physics.wallRestitution;

        // 上下墙
        if (this.y - this.radius <= tableOffsetY + railHeight) {
            if (!nearPocketMouth()) {
                this.vy = -this.vy * wallRest;
                this.y = tableOffsetY + railHeight + this.radius;
                this.addWallSpin();
            }
        }
        if (this.y + this.radius >= tableOffsetY + tableHeight - railHeight) {
            if (!nearPocketMouth()) {
                this.vy = -this.vy * wallRest;
                this.y = tableOffsetY + tableHeight - railHeight - this.radius;
                this.addWallSpin();
            }
        }
        // 左右墙
        if (this.x - this.radius <= tableOffsetX + railHeight) {
            if (!nearPocketMouth()) {
                this.vx = -this.vx * wallRest;
                this.x = tableOffsetX + railHeight + this.radius;
                this.addWallSpin();
            }
        }
        if (this.x + this.radius >= tableOffsetX + tableWidth - railHeight) {
            if (!nearPocketMouth()) {
                this.vx = -this.vx * wallRest;
                this.x = tableOffsetX + tableWidth - railHeight - this.radius;
                this.addWallSpin();
            }
        }
    }

    // 检查球是否在球袋的影响范围内（包括开口区域）
    isInPocketInfluence(pocketX, pocketY, pocketRadius) {
        const dx = this.x - pocketX;
        const dy = this.y - pocketY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 如果球接近球袋，计算是否在"抓取"范围内
        // 角袋使用更大的影响范围
        let influenceRadius;
        if (pocketRadius >= 26) {
            // 角袋 - 更大的影响范围
            influenceRadius = pocketRadius + this.radius + 12;
        } else {
            // 边袋 - 标准影响范围
            influenceRadius = pocketRadius + this.radius + 8;
        }

        if (distance < influenceRadius) {
            // 检查球的速度方向是否朝向球袋
            const velocityMagnitude = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (velocityMagnitude > 0.5) {
                // 计算速度方向与球袋方向的夹角
                const velocityAngle = Math.atan2(this.vy, this.vx);
                const pocketAngle = Math.atan2(dy, dx);
                const angleDiff = Math.abs(velocityAngle - pocketAngle);

                // 如果速度方向大致朝向球袋，则认为在影响范围内
                return angleDiff < Math.PI / 3; // 60度范围内
            }
            return distance < pocketRadius + this.radius;
        }

        return false;
    }

    // 添加碰撞后的旋转效果
    addWallSpin() {
        // 碰撞后添加轻微的随机偏移，模拟真实的碰撞效果
        const spinEffect = (Math.random() - 0.5) * 0.3;
        this.vx += spinEffect;
        this.vy += spinEffect;
    }

    // 球袋吸引逻辑
    applyPocketAttraction(pockets) {
        for (const p of pockets) {
            const dx = p.x - this.x;
            const dy = p.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const isCorner = p.radius >= 26;
            const factor = (isCorner ? CONFIG.pocket.cornerFactor : CONFIG.pocket.attractRadiusFactor + 0.4); // 边袋额外放大吸引范围
            const attractRadius = p.radius * factor;
            if (dist < attractRadius && dist > 1) {
                const normX = dx / dist;
                const normY = dy / dist;
                // 根据距离线性减弱吸力
                const strength = CONFIG.pocket.attractStrength * (1 - dist / attractRadius);
                // 对于速度很小的球, 增强吸力帮助其坠入袋内
                const velocityMag = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
                const speedBoost = velocityMag < CONFIG.pocket.minVelocityAttract ? 1.5 : 1.0;
                this.vx += normX * strength * speedBoost;
                this.vy += normY * strength * speedBoost;
                // 进入吸引区稍作额外减速，模拟掉落
                this.vx *= CONFIG.pocket.slowFactorInside;
                this.vy *= CONFIG.pocket.slowFactorInside;
            }
        }
    }

    draw(ctx, debug = false) {
        if (this.isStripe) {
            // 绘制半花色球（条纹球）
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 绘制彩色条纹
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.clip();

            // 绘制三条彩色条纹
            const stripeWidth = this.radius * 0.8;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - stripeWidth/2, this.y - this.radius, stripeWidth, this.radius * 2);
            ctx.fillRect(this.x - stripeWidth/2 - this.radius * 0.6, this.y - this.radius, stripeWidth * 0.4, this.radius * 2);
            ctx.fillRect(this.x - stripeWidth/2 + this.radius * 0.6, this.y - this.radius, stripeWidth * 0.4, this.radius * 2);

            ctx.restore();
        } else {
            // 绘制全色球
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // 给球加个高光效果
        ctx.beginPath();
        ctx.arc(this.x - this.radius/3, this.y - this.radius/3, this.radius/4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        // 绘制球号
        if (this.number !== null) {
            // 为半花色球使用白色圆圈背景
            if (this.isStripe) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = 'white';
                ctx.fill();
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            ctx.fillStyle = this.isStripe ? 'black' : 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 给文字添加描边
            ctx.strokeStyle = this.isStripe ? 'white' : 'black';
            ctx.lineWidth = 2;
            ctx.strokeText(this.number.toString(), this.x, this.y);
            ctx.fillText(this.number.toString(), this.x, this.y);
        }

        // Debug: 速度向量
        if (debug && (this.vx || this.vy)) {
            ctx.strokeStyle = CONFIG.debugColors.velocity;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.vx * 4, this.y + this.vy * 4);
            ctx.stroke();
        }
    }

    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    isColliding(other) {
        return this.distanceTo(other) < this.radius + other.radius;
    }
}
