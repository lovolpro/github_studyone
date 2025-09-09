import { CONFIG } from './config.js';

/**
 * 渲染器类 - 负责所有视觉渲染功能
 */
export class Renderer {
    constructor(ctx, canvas, tableWidth, tableHeight, tableOffsetX, tableOffsetY, railHeight, pockets) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.tableWidth = tableWidth;
        this.tableHeight = tableHeight;
        this.tableOffsetX = tableOffsetX;
        this.tableOffsetY = tableOffsetY;
        this.railHeight = railHeight;
        this.pockets = pockets;
    }

    /**
     * 主渲染方法 - 绘制整个台球桌和游戏场景
     */
    draw(balls, isDragging, cueBall, dragEnd, predictedPath, predictedTargetPath, predictedImpactPoint, debug) {
        // 清空整个画布
        this.ctx.fillStyle = '#2d5016'; // 深绿色背景（桌外区域）
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制台球桌面
        this.ctx.fillStyle = '#0f5132';
        this.ctx.fillRect(this.tableOffsetX, this.tableOffsetY, this.tableWidth, this.tableHeight);

        // 绘制台球桌边框（台边）
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(this.tableOffsetX, this.tableOffsetY, this.tableWidth, this.railHeight); // 上边
        this.ctx.fillRect(this.tableOffsetX, this.tableOffsetY + this.tableHeight - this.railHeight, this.tableWidth, this.railHeight); // 下边
        this.ctx.fillRect(this.tableOffsetX, this.tableOffsetY, this.railHeight, this.tableHeight); // 左边
        this.ctx.fillRect(this.tableOffsetX + this.tableWidth - this.railHeight, this.tableOffsetY, this.railHeight, this.tableHeight); // 右边

        // 绘制球袋
        this.drawPockets();

        // 绘制台面纹理
        this.drawTableTexture();

        // 绘制预测路径
        this.drawPrediction(isDragging, predictedPath, predictedTargetPath, predictedImpactPoint);

        // 绘制球
        balls.forEach(ball => ball.draw(this.ctx, debug));

        // 绘制台球杆
        this.drawCueStick(isDragging, cueBall, dragEnd);

        // 调试覆盖
        this.drawDebugOverlay(balls, debug);
    }

    /**
     * 绘制球袋 - 更真实的视觉效果
     */
    drawPockets() {
        this.pockets.forEach((pocket, index) => {
            // 球袋外圈
            this.ctx.beginPath();
            this.ctx.arc(pocket.x, pocket.y, pocket.radius + 3, 0, Math.PI * 2);
            this.ctx.fillStyle = '#4a2c2a';
            this.ctx.fill();

            // 球袋主体
            this.ctx.beginPath();
            this.ctx.arc(pocket.x, pocket.y, pocket.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = '#000000';
            this.ctx.fill();

            // 球袋内部渐变效果
            const gradient = this.ctx.createRadialGradient(
                pocket.x, pocket.y, 0,
                pocket.x, pocket.y, pocket.radius
            );
            gradient.addColorStop(0, '#333333');
            gradient.addColorStop(0.7, '#1a1a1a');
            gradient.addColorStop(1, '#000000');

            this.ctx.beginPath();
            this.ctx.arc(pocket.x, pocket.y, pocket.radius - 2, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // 球袋网格纹理
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1;
            for (let i = -pocket.radius; i <= pocket.radius; i += 4) {
                this.ctx.beginPath();
                this.ctx.moveTo(pocket.x + i, pocket.y - pocket.radius + 5);
                this.ctx.lineTo(pocket.x + i, pocket.y + pocket.radius - 5);
                this.ctx.stroke();
            }
        });
    }

    /**
     * 绘制台面纹理
     */
    drawTableTexture() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = this.tableOffsetX; i < this.tableOffsetX + this.tableWidth; i += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, this.tableOffsetY);
            this.ctx.lineTo(i, this.tableOffsetY + this.tableHeight);
            this.ctx.stroke();
        }
        for (let i = this.tableOffsetY; i < this.tableOffsetY + this.tableHeight; i += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.tableOffsetX, i);
            this.ctx.lineTo(this.tableOffsetX + this.tableWidth, i);
            this.ctx.stroke();
        }
    }

    /**
     * 绘制台球杆
     */
    drawCueStick(isDragging, cueBall, dragEnd) {
        if (!isDragging) return;

        const dx = dragEnd.x - cueBall.x;
        const dy = dragEnd.y - cueBall.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            // 计算台球杆的角度
            const angle = Math.atan2(dy, dx);

            // 台球杆长度和位置
            const cueLength = 400; // 增加台球杆总长度，确保桌外也能显示
            const cueWidth = 8;    // 台球杆粗细
            const tipLength = 15;  // 杆头长度

            // 根据拖拽距离计算台球杆距离白球的距离
            const pullBackDistance = Math.min(distance * 0.8, CONFIG.cue.maxPullBack);

            // 计算台球杆起始位置（从白球开始，向后拉）
            const startDistance = cueBall.radius + 10 + pullBackDistance;
            const startX = cueBall.x - Math.cos(angle) * startDistance;
            const startY = cueBall.y - Math.sin(angle) * startDistance;

            // 计算台球杆结束位置 - 确保延伸到桌外
            const endX = startX - Math.cos(angle) * cueLength;
            const endY = startY - Math.sin(angle) * cueLength;

            // 保存当前状态
            this.ctx.save();

            // 绘制台球杆主体（木质部分）
            this.ctx.strokeStyle = '#D2B48C'; // 浅棕色木质
            this.ctx.lineWidth = cueWidth;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();

            // 绘制台球杆装饰环
            const ringPositions = [0.7, 0.8, 0.9]; // 装饰环位置比例
            this.ctx.strokeStyle = '#8B4513'; // 深棕色装饰
            this.ctx.lineWidth = cueWidth + 2;
            ringPositions.forEach(ratio => {
                const ringX = startX - Math.cos(angle) * (cueLength * ratio);
                const ringY = startY - Math.sin(angle) * (cueLength * ratio);

                this.ctx.beginPath();
                this.ctx.moveTo(ringX - Math.cos(angle + Math.PI/2) * (cueWidth/2 + 1),
                               ringY - Math.sin(angle + Math.PI/2) * (cueWidth/2 + 1));
                this.ctx.lineTo(ringX + Math.cos(angle + Math.PI/2) * (cueWidth/2 + 1),
                               ringY + Math.sin(angle + Math.PI/2) * (cueWidth/2 + 1));
                this.ctx.stroke();
            });

            // 绘制台球杆头（皮头）
            const tipX = startX;
            const tipY = startY;

            // 杆头主体
            this.ctx.fillStyle = '#8B4513'; // 深棕色皮头
            this.ctx.beginPath();
            this.ctx.arc(tipX, tipY, cueWidth/2 + 1, 0, Math.PI * 2);
            this.ctx.fill();

            // 杆头高光
            this.ctx.fillStyle = '#A0522D';
            this.ctx.beginPath();
            this.ctx.arc(tipX - 2, tipY - 2, cueWidth/3, 0, Math.PI * 2);
            this.ctx.fill();

            // 绘制瞄准辅助线（虚线）
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([10, 10]);
            this.ctx.beginPath();
            this.ctx.moveTo(cueBall.x, cueBall.y);
            const aimLength = 150;
            const aimEndX = cueBall.x + Math.cos(angle) * aimLength;
            const aimEndY = cueBall.y + Math.sin(angle) * aimLength;
            this.ctx.lineTo(aimEndX, aimEndY);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // 绘制力度指示器
            this.drawPowerIndicator(pullBackDistance);

            // 恢复状态
            this.ctx.restore();
        }
    }

    /**
     * 绘制力度指示器
     */
    drawPowerIndicator(pullBackDistance) {
        // 在台球杆附近绘制力度指示器
        const maxPullBack = CONFIG.cue.maxPullBack;
        const powerRatio = pullBackDistance / maxPullBack;

        // 力度条位置
        const barX = 50;
        const barY = 50;
        const barWidth = 200;
        const barHeight = 20;

        // 绘制力度条背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

        // 绘制力度条边框
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);

        // 绘制力度填充
        const fillWidth = barWidth * powerRatio;
        const gradient = this.ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        gradient.addColorStop(0, '#00ff00');
        gradient.addColorStop(0.5, '#ffff00');
        gradient.addColorStop(1, '#ff0000');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(barX, barY, fillWidth, barHeight);

        // 绘制力度文字
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('力度', barX, barY - 10);
    }

    /**
     * 绘制预测路径
     */
    drawPrediction(isDragging, predictedPath, predictedTargetPath, predictedImpactPoint) {
        if (!isDragging) return;
        this.ctx.save();

        // 白球路径
        if (predictedPath.length) {
            this.ctx.strokeStyle = CONFIG.debugColors.prediction;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            predictedPath.forEach((p, i) => {
                if (i === 0) this.ctx.moveTo(p.x, p.y);
                else this.ctx.lineTo(p.x, p.y);
            });
            this.ctx.stroke();
        }

        // 目标球路径
        if (predictedTargetPath.length) {
            this.ctx.strokeStyle = CONFIG.debugColors.targetPrediction;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            predictedTargetPath.forEach((p, i) => {
                if (i === 0) this.ctx.moveTo(p.x, p.y);
                else this.ctx.lineTo(p.x, p.y);
            });
            this.ctx.stroke();

            const last = predictedTargetPath[predictedTargetPath.length - 1];
            if (last && (last.pocket || last.stop)) {
                this.ctx.fillStyle = last.pocket ? CONFIG.debugColors.pocketHighlight : 'rgba(255,255,0,0.5)';
                this.ctx.beginPath();
                this.ctx.arc(last.x, last.y, 10, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // 碰撞点
        if (predictedImpactPoint) {
            this.ctx.fillStyle = 'rgba(255,0,0,0.7)';
            this.ctx.beginPath();
            this.ctx.arc(predictedImpactPoint.x, predictedImpactPoint.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    /**
     * 绘制调试覆盖信息
     */
    drawDebugOverlay(balls, debug) {
        if (!debug) return;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.ctx.font = '14px monospace';
        let y = 90;

        // 检查所有球是否停止
        const allBallsStopped = balls.every(ball => ball.vx * ball.vx + ball.vy * ball.vy < 0.01);

        const lines = [
            `Balls: ${balls.length}`,
            `Stopped: ${allBallsStopped}`
        ];

        lines.forEach(line => {
            this.ctx.fillText(line, 20, y);
            y += 16;
        });

        this.ctx.restore();
    }
}
