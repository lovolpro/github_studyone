// 小鸟类
window.Bird = class Bird {
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