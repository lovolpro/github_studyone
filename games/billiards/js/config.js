// ================== 游戏配置 ==================
export const CONFIG = {
    railHeight: 25,
    cue: { maxPullBack: 200, maxForce: 45 },
    physics: {
        friction: 0.988,
        minVelocity: 0.08,
        spinDecay: 0.95,
        spinToVelocity: 0.1,
        wallRestitution: 0.85,
        collisionRestitution: 0.96,
        enhancementFactor: 1.15
    },
    prediction: { steps: 140, dt: 1, sample: 4, targetSteps: 360 },
    pocket: {
        attractStrength: 0.25,          // 吸力基础强度 (增强)
        attractRadiusFactor: 2.8,       // 吸引半径 = factor * pocket.radius (增大)
        cornerFactor: 3.2,              // 角袋更大吸引范围 (增强)
        captureExtra: 10,               // 进袋判定附加距离 (增大)
        minVelocityAttract: 0.3,        // 低于该速度时更容易被吸入 (放宽)
        slowFactorInside: 0.92,         // 进入吸引区后额外减速系数 (增强减速)
        sideMouthExtra: 15,             // 边袋额外入口扩大 (增大)
        cornerMouthExtra: 12,           // 角袋入口扩大 (增大)
        sideCaptureExtra: 15            // 边袋捕获加成（比全局 captureExtra 更大）
    },
    debugColors: {
        velocity: '#ffcc00',
        spin: '#ff66ff',
        prediction: 'rgba(255,255,255,0.25)',
        targetPrediction: 'rgba(0,255,255,0.35)',
        pocketHighlight: 'rgba(255,0,0,0.6)'
    }
};

// 工具函数
export function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
}
