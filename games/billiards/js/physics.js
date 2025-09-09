import { CONFIG } from './config.js';

export class Physics {
    constructor(tableOffsetX, tableOffsetY, tableWidth, tableHeight, railHeight) {
        this.tableOffsetX = tableOffsetX;
        this.tableOffsetY = tableOffsetY;
        this.tableWidth = tableWidth;
        this.tableHeight = tableHeight;
        this.railHeight = railHeight;
    }

    checkCollisions(balls, frameCount = 0) {
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                const ball1 = balls[i];
                const ball2 = balls[j];

                if (ball1.isColliding(ball2)) {
                    // 防止在同一帧内重复处理碰撞
                    if (ball1.lastCollisionFrame !== frameCount || ball2.lastCollisionFrame !== frameCount) {
                        this.resolveBallCollision(ball1, ball2, frameCount);
                    }
                }
            }
        }
    }

    resolveBallCollision(ball1, ball2, frameCount = 0) {
        // 分离重叠的球
        const dx = ball2.x - ball1.x;
        const dy = ball2.y - ball1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 防止除零错误
        if (distance < 0.001) {
            // 如果球完全重叠，给它们一个小的随机分离
            ball1.x += (Math.random() - 0.5) * 2;
            ball1.y += (Math.random() - 0.5) * 2;
            ball2.x += (Math.random() - 0.5) * 2;
            ball2.y += (Math.random() - 0.5) * 2;
            return;
        }

        const overlap = ball1.radius + ball2.radius - distance;

        if (overlap > 0) {
            const separationX = (dx / distance) * overlap * 0.5;
            const separationY = (dy / distance) * overlap * 0.5;

            ball1.x -= separationX;
            ball1.y -= separationY;
            ball2.x += separationX;
            ball2.y += separationY;
        }

        // 计算碰撞角度
        const angle = Math.atan2(dy, dx);
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        // 旋转速度向量到碰撞坐标系
        const vx1 = ball1.vx * cos + ball1.vy * sin;
        const vy1 = ball1.vy * cos - ball1.vx * sin;
        const vx2 = ball2.vx * cos + ball2.vy * sin;
        const vy2 = ball2.vy * cos - ball2.vx * sin;

        // 更真实的弹性碰撞计算
        const restitution = CONFIG.physics.collisionRestitution;

        const finalVx1 = ((ball1.mass - ball2.mass) * vx1 + 2 * ball2.mass * vx2) / (ball1.mass + ball2.mass) * restitution;
        const finalVx2 = ((ball2.mass - ball1.mass) * vx2 + 2 * ball1.mass * vx1) / (ball1.mass + ball2.mass) * restitution;

        // 安全检查：确保计算结果是有效数字
        if (isNaN(finalVx1) || isNaN(finalVx2) || !isFinite(finalVx1) || !isFinite(finalVx2)) {
            console.warn('碰撞计算产生无效数值，跳过此次碰撞');
            return;
        }

        // 旋转回原坐标系
        ball1.vx = finalVx1 * cos - vy1 * sin;
        ball1.vy = vy1 * cos + finalVx1 * sin;
        ball2.vx = finalVx2 * cos - vy2 * sin;
        ball2.vy = vy2 * cos + finalVx2 * sin;

        // 再次检查结果
        if (isNaN(ball1.vx) || isNaN(ball1.vy) || isNaN(ball2.vx) || isNaN(ball2.vy)) {
            console.warn('速度计算产生NaN，重置速度');
            ball1.vx = ball1.vy = ball2.vx = ball2.vy = 0;
            return;
        }

        // 增强力量传递效果
        const impactMagnitude = Math.sqrt(vx1 * vx1 + vy1 * vy1);
        if (impactMagnitude > 1) {
            ball2.vx *= CONFIG.physics.enhancementFactor;
            ball2.vy *= CONFIG.physics.enhancementFactor;
        }

        // 传递旋转效果
        if (ball1.spin) {
            const spinTransfer = ball1.spin * 0.4; // 增加旋转传递效率
            ball2.spin = (ball2.spin || 0) + spinTransfer;
            ball1.spin *= 0.6; // 原球保留更少旋转
        }

        // 碰撞声音效果的准备（可以在后续添加音频）
        const impactForce = Math.sqrt(finalVx1 * finalVx1 + finalVx2 * finalVx2);
        ball1.lastCollisionFrame = frameCount;
        ball2.lastCollisionFrame = frameCount;
        // 可以根据impactForce播放不同强度的碰撞音效
    }

    checkPockets(balls, pockets, cueBall, tableConfig, callbacks = {}) {
        const ballsToRemove = []; // 收集需要移除的球，避免在循环中直接修改数组

        for (let i = balls.length - 1; i >= 0; i--) {
            const ball = balls[i];

            for (let pocketIndex = 0; pocketIndex < pockets.length; pocketIndex++) {
                const pocket = pockets[pocketIndex];
                const dx = ball.x - pocket.x;
                const dy = ball.y - pocket.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // 区分角袋和边袋的进袋条件
                let pocketThreshold;
                if (pocketIndex === 0 || pocketIndex === 2 || pocketIndex === 3 || pocketIndex === 5) {
                    // 角袋（索引0,2,3,5）- 更宽松的进袋条件
                    pocketThreshold = pocket.radius - ball.radius + 12 + CONFIG.pocket.cornerMouthExtra;
                } else {
                    // 边袋（索引1,4）- 标准进袋条件
                    pocketThreshold = pocket.radius - ball.radius + 8 + CONFIG.pocket.sideMouthExtra;
                }

                const captureDistance = pocketThreshold + CONFIG.pocket.captureExtra;
                if (distance < captureDistance) {
                    if (ball === cueBall) {
                        // 白球进袋，重新放置到开球区域
                        ball.x = tableConfig.tableOffsetX + 150;
                        ball.y = tableConfig.tableOffsetY + tableConfig.tableHeight / 2;
                        ball.vx = 0; ball.vy = 0; ball.spin = 0;
                        if (callbacks.onCueBallPocketed) {
                            try {
                                callbacks.onCueBallPocketed();
                            } catch (e) {
                                console.error('白球进袋回调错误:', e);
                            }
                        }
                    } else {
                        // 其他球进袋，标记为移除
                        ballsToRemove.push({ ball, index: i });
                        if (callbacks.onBallPocketed) {
                            try {
                                callbacks.onBallPocketed(ball);
                            } catch (e) {
                                console.error('球进袋回调错误:', e);
                            }
                        }
                    }
                    break;
                }
            }
        }

        // 安全地移除球（从后往前移除，避免索引问题）
        ballsToRemove.sort((a, b) => b.index - a.index);
        ballsToRemove.forEach(item => {
            if (item.index >= 0 && item.index < balls.length && balls[item.index] === item.ball) {
                balls.splice(item.index, 1);
            }
        });
    }

    allBallsStopped(balls) {
        return balls.every(ball =>
            Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.1
        );
    }

    // 预测物理运动（用于瞄准辅助）
    predictPath(startX, startY, startVx, startVy, radius, balls, pockets, tableConfig) {
        const path = [];
        let x = startX, y = startY;
        let vx = startVx, vy = startVy;
        const r = radius;

        for (let i = 0; i < CONFIG.prediction.steps; i++) {
            x += vx;
            y += vy;
            vx *= CONFIG.physics.friction;
            vy *= CONFIG.physics.friction;

            if (i % CONFIG.prediction.sample === 0) path.push({x, y});

            // 反弹
            if (y - r <= tableConfig.tableOffsetY + CONFIG.railHeight ||
                y + r >= tableConfig.tableOffsetY + tableConfig.tableHeight - CONFIG.railHeight) {
                vy = -vy * CONFIG.physics.wallRestitution;
            }
            if (x - r <= tableConfig.tableOffsetX + CONFIG.railHeight ||
                x + r >= tableConfig.tableOffsetX + tableConfig.tableWidth - CONFIG.railHeight) {
                vx = -vx * CONFIG.physics.wallRestitution;
            }

            // 碰撞其它球（只检测最近的第一次）
            for (const ball of balls) {
                const dx2 = x - ball.x, dy2 = y - ball.y;
                const d2 = dx2*dx2 + dy2*dy2;
                const rr = (r + ball.radius)*(r + ball.radius);
                if (d2 < rr) {
                    const d = Math.sqrt(d2) || 0.0001;
                    const nx = dx2 / d;
                    const ny = dy2 / d;
                    // 简化碰撞计算用于预测
                    const v1n = vx * nx + vy * ny;
                    const tvx = nx * v1n * CONFIG.physics.collisionRestitution;
                    const tvy = ny * v1n * CONFIG.physics.collisionRestitution;

                    path.push({x: ball.x, y: ball.y, impact: true});
                    return { path, targetBall: { x: ball.x, y: ball.y, vx: tvx, vy: tvy, radius: ball.radius } };
                }
            }

            if (Math.abs(vx) < CONFIG.physics.minVelocity && Math.abs(vy) < CONFIG.physics.minVelocity) break;
        }

        return { path, targetBall: null };
    }

    predictTargetPath(targetBall, pockets, tableConfig) {
        const path = [];
        let { x: tx, y: ty, vx: tvx, vy: tvy } = targetBall;
        const tr = targetBall.radius;

        for (let step = 0; step < CONFIG.prediction.targetSteps; step++) {
            tx += tvx;
            ty += tvy;
            tvx *= CONFIG.physics.friction;
            tvy *= CONFIG.physics.friction;

            if (step % (CONFIG.prediction.sample*2) === 0) {
                path.push({x: tx, y: ty});
            }

            // 反弹
            if (ty - tr <= tableConfig.tableOffsetY + CONFIG.railHeight ||
                ty + tr >= tableConfig.tableOffsetY + tableConfig.tableHeight - CONFIG.railHeight) {
                tvy = -tvy * CONFIG.physics.wallRestitution;
            }
            if (tx - tr <= tableConfig.tableOffsetX + CONFIG.railHeight ||
                tx + tr >= tableConfig.tableOffsetX + tableConfig.tableWidth - CONFIG.railHeight) {
                tvx = -tvx * CONFIG.physics.wallRestitution;
            }

            // 进袋检测
            for (let pocketIndex = 0; pocketIndex < pockets.length; pocketIndex++) {
                const pocket = pockets[pocketIndex];
                const pdx = tx - pocket.x;
                const pdy = ty - pocket.y;
                const pd = Math.sqrt(pdx*pdx + pdy*pdy);
                let pocketThreshold = pocket.radius - tr + (pocketIndex === 0 || pocketIndex === 2 || pocketIndex === 3 || pocketIndex === 5 ? 15 : 12);
                if (pd < pocketThreshold) {
                    path.push({x: pocket.x, y: pocket.y, pocket: true});
                    return path;
                }
            }

            if (Math.abs(tvx) < CONFIG.physics.minVelocity && Math.abs(tvy) < CONFIG.physics.minVelocity) {
                path.push({x: tx, y: ty, stop: true});
                break;
            }
        }

        return path;
    }

    /**
     * 预测白球和目标球的轨迹路径
     */
    predictPaths(cueBall, dragEnd, otherBalls, pockets) {
        const cueBallPath = [];
        const targetBallPath = [];
        let impactPoint = null;

        // 计算初始速度
        const dx = dragEnd.x - cueBall.x;
        const dy = dragEnd.y - cueBall.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= 5) {
            return { cueBallPath, targetBallPath, impactPoint };
        }

        const angle = Math.atan2(dy, dx);
        const pullBackDistance = Math.min(distance * 0.8, CONFIG.cue.maxPullBack);
        const powerRatio = pullBackDistance / CONFIG.cue.maxPullBack;
        const force = powerRatio * CONFIG.cue.maxForce;

        let vx = Math.cos(angle) * force;
        let vy = Math.sin(angle) * force;
        let x = cueBall.x;
        let y = cueBall.y;
        const r = cueBall.radius;

        // 模拟白球路径直到碰撞
        for (let i = 0; i < CONFIG.prediction.steps; i++) {
            x += vx;
            y += vy;
            vx *= CONFIG.physics.friction;
            vy *= CONFIG.physics.friction;

            if (i % CONFIG.prediction.sample === 0) {
                cueBallPath.push({ x, y });
            }

            // 台边反弹
            if (y - r <= this.tableOffsetY + this.railHeight || y + r >= this.tableOffsetY + this.tableHeight - this.railHeight) {
                vy = -vy * CONFIG.physics.wallRestitution;
            }
            if (x - r <= this.tableOffsetX + this.railHeight || x + r >= this.tableOffsetX + this.tableWidth - this.railHeight) {
                vx = -vx * CONFIG.physics.wallRestitution;
            }

            // 检查与其他球的碰撞
            for (const ball of otherBalls) {
                const dx2 = x - ball.x;
                const dy2 = y - ball.y;
                const d2 = dx2 * dx2 + dy2 * dy2;
                const rr = (r + ball.radius) * (r + ball.radius);

                if (d2 < rr) {
                    const d = Math.sqrt(d2) || 0.0001;
                    const nx = dx2 / d;
                    const ny = dy2 / d;

                    // 白球速度在法线方向分量
                    const v1n = vx * nx + vy * ny;

                    // 目标球初速度
                    const tvx = nx * v1n * CONFIG.physics.collisionRestitution;
                    const tvy = ny * v1n * CONFIG.physics.collisionRestitution;

                    // 记录碰撞点和预测目标球路径
                    impactPoint = { x: ball.x, y: ball.y };
                    this.predictTargetBallPath(ball, tvx, tvy, targetBallPath, pockets);

                    cueBallPath.push({ x: ball.x, y: ball.y, impact: true });
                    return { cueBallPath, targetBallPath, impactPoint };
                }
            }

            // 速度太小停止
            if (Math.abs(vx) < CONFIG.physics.minVelocity && Math.abs(vy) < CONFIG.physics.minVelocity) {
                break;
            }
        }

        return { cueBallPath, targetBallPath, impactPoint };
    }

    /**
     * 预测目标球的路径
     */
    predictTargetBallPath(ball, initialVx, initialVy, targetBallPath, pockets) {
        let x = ball.x;
        let y = ball.y;
        let vx = initialVx;
        let vy = initialVy;
        const r = ball.radius;

        for (let step = 0; step < CONFIG.prediction.targetSteps; step++) {
            x += vx;
            y += vy;
            vx *= CONFIG.physics.friction;
            vy *= CONFIG.physics.friction;

            if (step % (CONFIG.prediction.sample * 2) === 0) {
                targetBallPath.push({ x, y });
            }

            // 台边反弹
            if (y - r <= this.tableOffsetY + this.railHeight || y + r >= this.tableOffsetY + this.tableHeight - this.railHeight) {
                vy = -vy * CONFIG.physics.wallRestitution;
            }
            if (x - r <= this.tableOffsetX + this.railHeight || x + r >= this.tableOffsetX + this.tableWidth - this.railHeight) {
                vx = -vx * CONFIG.physics.wallRestitution;
            }

            // 进袋检测
            for (let pocketIndex = 0; pocketIndex < pockets.length; pocketIndex++) {
                const pocket = pockets[pocketIndex];
                const pdx = x - pocket.x;
                const pdy = y - pocket.y;
                const pd = Math.sqrt(pdx * pdx + pdy * pdy);
                let pocketThreshold = pocket.radius - r + (pocketIndex === 0 || pocketIndex === 2 || pocketIndex === 3 || pocketIndex === 5 ? 15 : 12);
                if (pd < pocketThreshold) {
                    targetBallPath.push({ x: pocket.x, y: pocket.y, pocket: true });
                    return;
                }
            }

            // 速度太小停止
            if (Math.abs(vx) < CONFIG.physics.minVelocity && Math.abs(vy) < CONFIG.physics.minVelocity) {
                targetBallPath.push({ x, y, stop: true });
                break;
            }
        }
    }
}
