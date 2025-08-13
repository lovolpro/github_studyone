# 🎛 GD32 DAC0 驱动文档

[TOC]



## 🌟 概述

本驱动实现GD32F4xx系列MCU的DAC0通道1基本功能，支持：
- 12位数字量转模拟量输出
- 软件触发模式
- 输出缓冲使能
- 波形生成禁用模式

## 📌 硬件配置
| 功能     | 引脚 | 模式     | 说明         |
| -------- | ---- | -------- | ------------ |
| DAC_OUT1 | PA4  | 模拟输出 | DAC通道1输出 |

## 🛠 驱动实现

### 1. 初始化函数
```c
void Drv_dac0_init() {
    dac0_init();  // 实际初始化函数
}
```

### 2. 核心配置函数

```c
static void dac0_init() {
    // 使能DAC时钟
    rcu_periph_clock_enable(RCU_DAC);
    
    // 复位DAC0
    dac_deinit(DAC0); 
    
    // 配置触发模式
    dac_trigger_disable(DAC0, DAC_OUT1);  // 禁用硬件触发
    
    // 波形生成配置
    dac_wave_mode_config(DAC0, DAC_OUT1, DAC_WAVE_DISABLE);  // 禁用波形生成
    
    // 输出缓冲配置
    dac_output_buffer_enable(DAC0, DAC_OUT1);  // 使能输出缓冲
    
    // 启用DAC通道
    dac_enable(DAC0, DAC_OUT1);  
}
```

## 📊 关键配置说明

### 触发模式选择

| 模式         | API函数                 | 说明                   |
| :----------- | :---------------------- | :--------------------- |
| 软件触发     | `dac_trigger_disable()` | 直接写入数据寄存器生效 |
| 定时器触发   | `dac_trigger_enable()`  | 需配置对应定时器       |
| 外部事件触发 | `dac_trigger_enable()`  | 需配置EXTI             |

### 波形生成模式

| 模式     | API函数                  | 说明               |
| :------- | :----------------------- | :----------------- |
| 禁用波形 | `DAC_WAVE_DISABLE`       | 直接输出设定值     |
| 噪声波形 | `DAC_WAVE_MODE_LFSR`     | 伪随机噪声输出     |
| 三角波   | `DAC_WAVE_MODE_TRIANGLE` | 可配置幅度的三角波 |

## 🚀 使用示例

### 基本电压输出

```c
// 初始化DAC
Drv_dac0_init();

// 设置输出电压(0-4095对应0-3.3V)
dac_data_set(DAC0, DAC_OUT1, DAC_ALIGN_12B_R, 2048);  // 输出1.65V
```

### 动态电压调整

```c
void SetVoltage(float voltage) {
    if(voltage > 3.3f) voltage = 3.3f;
    if(voltage < 0.0f) voltage = 0.0f;
    
    uint16_t dac_value = (uint16_t)(voltage * 4095 / 3.3f);
    dac_data_set(DAC0, DAC_OUT1, DAC_ALIGN_12B_R, dac_value);
}
```

## ⚠️ 注意事项

1. **输出缓冲特性**

   - 使能缓冲：提高驱动能力但增加建立时间
   - 禁用缓冲：响应更快但驱动能力弱

2. **精度影响要素**

   ```math
   实际电压 = \frac{V_{REF} \times DAC_{CODE}}{4095}
   ```

   - 参考电压稳定性直接影响输出精度

3. **建立时间**

   | 条件     | 典型建立时间 |
   | :------- | :----------- |
   | 缓冲使能 | 3μs          |
   | 缓冲禁用 | 1μs          |

4. **引脚配置**

   - 必须配置为模拟模式
   - 避免与数字功能冲突

## 🔍 调试技巧

### 常见问题排查

| 现象         | 可能原因            | 解决方案             |
| :----------- | :------------------ | :------------------- |
| 无输出       | 引脚模式配置错误    | 检查GPIO模拟模式配置 |
| 输出幅度不足 | 缓冲未使能          | 启用输出缓冲         |
| 输出噪声大   | 电源噪声            | 增加滤波电容         |
| 响应延迟     | 缓冲使能+大容性负载 | 禁用缓冲或减小负载   |

### 性能优化建议

1. 动态切换缓冲模式：

   ```c
   void SetHighSpeedMode(bool enable) {
       enable ? dac_output_buffer_disable(DAC0, DAC_OUT1)
              : dac_output_buffer_enable(DAC0, DAC_OUT1);
   }
   ```

2. 校准输出精度：

   ```c
   // 使用高精度万用表测量实际电压
   void CalibrateDAC() {
       float measured, error;
       // ...校准流程...
   }
   ```

## 📈 性能参数

| 参数         | 数值            |
| :----------- | :-------------- |
| 分辨率       | 12位            |
| 线性误差     | ±1LSB           |
| 输出阻抗     | 50Ω (缓冲使能)  |
| 建立时间     | 3μs (缓冲使能)  |
| 最大更新速率 | 1MHz (软件触发) |

## 🔄 扩展功能

可通过以下方式增强驱动：

1. 添加DMA支持连续波形输出
2. 实现自动校准功能
3. 增加硬件触发配置接口
4. 添加多通道同步支持

## 📖完整代码

### dac.c

```c
#include "Drv_dac0.h"

static void dac0_init();

//DAC 功能初始化
void Drv_dac0_init()
{
	dac0_init();
}

// DAC0初始化
static void dac0_init()
{
    rcu_periph_clock_enable(RCU_DAC);
	dac_deinit(DAC0); 
	dac_trigger_disable(DAC0, DAC_OUT1);  
	dac_wave_mode_config(DAC0, DAC_OUT1, DAC_WAVE_DISABLE);  
	dac_output_buffer_enable(DAC0, DAC_OUT1);  
	dac_enable(DAC0, DAC_OUT1);  
}
```

### dac.h

```c
#ifndef DRV_DAC0_H
#define DRV_DAC0_H

#include "gd32f4xx.h"
#include "Drv_usart0.h"

void Drv_dac0_init();

#endif 
```

