// 障碍物类
window.Obstacle = class Obstacle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.health = 100; // 障碍物的耐久度
        this.damaged = false; // 是否受损
    }
    
    draw(ctx) {
        // 根据健康值选择颜色
        let baseColor, midColor, endColor;
        if (this.health > 70) {
            // 正常状态
            baseColor = '#DEB887';
            midColor = '#D2B48C';
            endColor = '#CD853F';
        } else if (this.health > 30) {
            // 轻微受损
            baseColor = '#D2B48C';
            midColor = '#CD853F';
            endColor = '#A0522D';
            this.damaged = true;
        } else {
            // 严重受损
            baseColor = '#A0522D';
            midColor = '#8B4513';
            endColor = '#654321';
            this.damaged = true;
        }
        
        // 木头纹理效果
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(0.5, midColor);
        gradient.addColorStop(1, endColor);
        
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
        
        // 如果受损，绘制裂缝
        if (this.damaged) {
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            
            // 随机裂缝
            const startX = this.x + this.width * 0.3;
            const startY = this.y;
            ctx.moveTo(startX, startY);
            
            let currentX = startX;
            let currentY = startY;
            const endY = this.y + this.height;
            
            while (currentY < endY) {
                currentX += (Math.random() - 0.5) * 10;
                currentY += 10;
                ctx.lineTo(currentX, currentY);
            }
            
            ctx.stroke();
        }
    }
}