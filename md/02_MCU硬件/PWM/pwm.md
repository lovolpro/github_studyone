# 🎵 GD32 PWM 定时器驱动笔记

[TOC]

## 🌟 概述

本笔记记录了 GD32F4xx 系列 MCU 的 PWM 定时器配置，主要用于：

- 蜂鸣器音频控制(TIMER2)
- LCD 背光 PWM 控制(TIMER7)
- 支持多种提示音类型
- 可调节音量和持续时间

## 📌 硬件配置

### 引脚配置表

| 功能     | 定时器 | 通道 | 引脚   | 复用功能 | 说明     |
| -------- | ------ | ---- | ------ | -------- | -------- |
| 蜂鸣器   | TIMER2 | CH0  | PB4    | AF2      | 音频输出 |
| LCD 背光 | TIMER7 | CH2  | 自定义 | AF3      | 背光控制 |

### PWM 参数配置

| 参数         | 数值     | 说明          |
| :----------- | :------- | :------------ |
| 预分频器     | 399      | 降低时钟频率  |
| 自动重装载值 | 399      | PWM 周期      |
| 计数模式     | 向上计数 | 标准 PWM 模式 |
| 输出极性     | 高有效   | 正常输出      |

## 🛠 核心初始化代码

### 蜂鸣器 PWM 初始化

```c
void timer_pwm_init(void)
{
    // 1. 时钟使能
    rcu_periph_clock_enable(RCU_GPIOB);
    rcu_periph_clock_enable(RCU_TIMER2);

    // 2. GPIO配置 - PB4作为蜂鸣器输出
    gpio_mode_set(GPIOB, GPIO_MODE_AF, GPIO_PUPD_NONE, GPIO_PIN_4);
    gpio_output_options_set(GPIOB, GPIO_OTYPE_PP, GPIO_OSPEED_MAX, GPIO_PIN_4);
    gpio_af_set(GPIOB, GPIO_AF_2, GPIO_PIN_4);

    // 3. 定时器基本参数配置
    timer_parameter_struct timer_initpara;
    timer_oc_parameter_struct timer_ocintpara;

    rcu_timer_clock_prescaler_config(RCU_TIMER_PSC_MUL4);
    timer_deinit(TIMER2);

    // 定时器参数设置
    timer_initpara.prescaler = 399;                    // 预分频器
    timer_initpara.alignedmode = TIMER_COUNTER_UP;     // 向上计数
    timer_initpara.counterdirection = TIMER_COUNTER_UP;
    timer_initpara.period = 399;                       // PWM周期
    timer_initpara.clockdivision = TIMER_CKDIV_DIV1;
    timer_initpara.repetitioncounter = 0;
    timer_init(TIMER2, &timer_initpara);

    // 4. PWM输出通道配置
    timer_ocintpara.ocpolarity = TIMER_OC_POLARITY_HIGH;     // 高有效
    timer_ocintpara.outputstate = TIMER_CCX_ENABLE;         // 使能输出
    timer_ocintpara.ocnpolarity = TIMER_OCN_POLARITY_HIGH;
    timer_ocintpara.outputnstate = TIMER_CCXN_DISABLE;
    timer_ocintpara.ocidlestate = TIMER_OC_IDLE_STATE_LOW;
    timer_ocintpara.ocnidlestate = TIMER_OCN_IDLE_STATE_LOW;

    // 5. 配置TIMER2通道0 (蜂鸣器)
    timer_channel_output_config(TIMER2, TIMER_CH_0, &timer_ocintpara);
    timer_channel_output_pulse_value_config(TIMER2, TIMER_CH_0, 0);
    timer_channel_output_mode_config(TIMER2, TIMER_CH_0, TIMER_OC_MODE_PWM0);
    timer_channel_output_shadow_config(TIMER2, TIMER_CH_0, TIMER_OC_SHADOW_DISABLE);

    // 6. 使能定时器
    timer_auto_reload_shadow_enable(TIMER2);
    timer_enable(TIMER2);
}
```

### LCD 背光 PWM 初始化

```c
void timer_lcd_pwm_init(void)
{
    rcu_periph_clock_enable(RCU_TIMER7);

    timer_parameter_struct timer_initpara;
    timer_oc_parameter_struct timer_ocintpara;

    rcu_timer_clock_prescaler_config(RCU_TIMER_PSC_MUL2);
    timer_deinit(TIMER7);

    // 定时器参数配置(与TIMER2相同)
    timer_initpara.prescaler = 399;
    timer_initpara.alignedmode = TIMER_COUNTER_UP;
    timer_initpara.counterdirection = TIMER_COUNTER_UP;
    timer_initpara.period = 399;
    timer_initpara.clockdivision = TIMER_CKDIV_DIV1;
    timer_initpara.repetitioncounter = 0;
    timer_init(TIMER7, &timer_initpara);

    // PWM输出配置
    timer_ocintpara.ocpolarity = TIMER_OC_POLARITY_HIGH;
    timer_ocintpara.outputstate = TIMER_CCX_ENABLE;
    timer_ocintpara.ocnpolarity = TIMER_OCN_POLARITY_HIGH;
    timer_ocintpara.outputnstate = TIMER_CCXN_DISABLE;
    timer_ocintpara.ocidlestate = TIMER_OC_IDLE_STATE_LOW;
    timer_ocintpara.ocnidlestate = TIMER_OCN_IDLE_STATE_LOW;

    // 配置TIMER7通道2 (LCD背光)
    timer_channel_output_config(TIMER7, TIMER_CH_2, &timer_ocintpara);
    timer_channel_output_pulse_value_config(TIMER7, TIMER_CH_2, 0);
    timer_channel_output_mode_config(TIMER7, TIMER_CH_2, TIMER_OC_MODE_PWM0);
    timer_channel_output_shadow_config(TIMER7, TIMER_CH_2, TIMER_OC_SHADOW_DISABLE);

    // 高级定时器需要额外配置
    timer_primary_output_config(TIMER7, ENABLE);
    timer_auto_reload_shadow_enable(TIMER7);
    timer_enable(TIMER7);
}
```

## 🚀 使用方法

### 1. 蜂鸣器音量控制

```c
/**
 * 设置蜂鸣器音量
 * @param volume: 音量值 (0-399，0为静音)
 */
void bsp_set_beep_volume(uint32_t volume)
{
    timer_channel_output_pulse_value_config(TIMER2, TIMER_CH_0, volume);
}

// 使用示例
bsp_set_beep_volume(200);  // 设置50%音量
bsp_set_beep_volume(0);    // 静音
```

### 2. 不同类型提示音

```c
// 提示音频率配置
#define BEEP_OPEN_PRESCALER      1200    // 开路提示音(低频)
#define BEEP_DIODE_PRESCALER     900     // 二极管测试音(中频)
#define BEEP_VOLTAGE_PRESCALER   600     // 电压测试音(中高频)
#define BEEP_KEY_PRESS_PRESCALER 300     // 按键音(高频)

/**
 * 设置提示音类型的通用函数
 */
static void beep_set_hint_tone(uint32_t prescaler, uint32_t autoreload)
{
    timer_disable(TIMER2);
    timer_prescaler_config(TIMER2, prescaler, TIMER_PSC_RELOAD_NOW);
    timer_autoreload_value_config(TIMER2, autoreload);
    timer_enable(TIMER2);
}

// 具体使用函数
void beep_set_diode_hint()    { beep_set_hint_tone(900, 400); }
void beep_set_open_hint()     { beep_set_hint_tone(1200, 400); }
void beep_set_voltage_hint()  { beep_set_hint_tone(600, 400); }
void beep_set_key_press_hint(){ beep_set_hint_tone(300, 400); }
```

### 3. 长短提示音控制

```c
/**
 * 长提示音
 * @param time: 持续时间(ms)
 */
void long_beep(uint16_t time)
{
    bsp_set_beep_volume(24);  // 设置音量
    delay_ms(time);           // 持续时间
    bsp_set_beep_volume(0);   // 关闭
}

/**
 * 停止蜂鸣器
 */
void board_beep_stop(void)
{
    bsp_set_beep_volume(0);
}
```

## 📊 频率计算

### PWM 频率计算公式

```
PWM频率 = 定时器时钟 / (预分频器 + 1) / (自动重装载值 + 1)
```

### 不同提示音频率

| 提示音类型 | 预分频器 | 频率估算 | 用途说明   |
| :--------- | :------- | :------- | :--------- |
| 按键音     | 300      | ~667Hz   | 按键反馈   |
| 电压测试   | 600      | ~333Hz   | 电压检测   |
| 二极管测试 | 900      | ~222Hz   | 二极管检测 |
| 开路提示   | 1200     | ~167Hz   | 开路状态   |

## ⚠️ 注意事项

1. **时钟配置**：

   - TIMER2 使用 4 倍频时钟
   - TIMER7 使用 2 倍频时钟
   - 注意系统时钟频率对 PWM 频率的影响

2. **GPIO 配置**：

   - 必须正确设置复用功能
   - 输出类型设置为推挽输出
   - 速率设置为最高速

3. **高级定时器**：

   - TIMER7 是高级定时器，需要使能主输出
   - 需要配置死区时间(如果需要)

4. **音频考虑**：
   - 蜂鸣器频率范围通常在 200Hz-5kHz
   - 音量通过占空比控制
   - 不同频率给用户不同的听觉反馈

## 🔍 调试技巧

1. **信号测试**：

   - 使用示波器观察 PWM 波形
   - 检查频率和占空比是否正确
   - 验证 GPIO 输出是否正常

2. **常见问题**：

   - 无输出：检查 GPIO 复用配置
   - 频率错误：检查预分频器和重装载值
   - 音量异常：检查占空比设置

3. **测试代码**：
   ```c
   // 测试蜂鸣器功能
   void test_beep(void)
   {
       beep_set_key_press_hint();  // 设置按键音
       bsp_set_beep_volume(100);   // 设置音量
       delay_ms(500);              // 持续500ms
       bsp_set_beep_volume(0);     // 关闭
   }
   ```

## 📈 性能参数

| 参数       | 数值       |
| :--------- | :--------- |
| PWM 分辨率 | 10 位(400) |
| 最大频率   | ~5kHz      |
| 最小频率   | ~100Hz     |
| 响应时间   | <1ms       |
