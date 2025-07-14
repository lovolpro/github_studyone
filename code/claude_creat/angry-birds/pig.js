// 猪类
window.Pig = class Pig {
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