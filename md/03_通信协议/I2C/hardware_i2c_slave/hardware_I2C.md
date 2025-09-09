# 🔌 GD32 硬件 I2C 从机模式配置笔记

[TOC]

## 🌟 概述

本笔记记录了 GD32F4xx 系列 MCU 的硬件 I2C 从机模式配置方法，主要特性：

- 基于硬件 I2C0 控制器
- 从机模式工作
- 7 位地址格式
- GPIO 复用功能配置
- 支持标准 I2C 通信协议

## 📌 硬件连接配置

| 功能 | 引脚 | GPIO 模式    | 输出类型 | 速率     | 复用功能 |
| ---- | ---- | ------------ | -------- | -------- | -------- |
| SCL  | PB8  | 复用功能模式 | 开漏输出 | 最高速率 | AF4      |
| SDA  | PB9  | 复用功能模式 | 开漏输出 | 最高速率 | AF4      |

### 引脚配置说明

- **上拉电阻**：内部上拉使能，确保总线空闲时为高电平
- **开漏输出**：符合 I2C 总线规范，支持多主机通信
- **复用功能**：GPIO 引脚复用为 I2C0 功能

## 🛠 驱动实现

### 从机初始化函数

```c
void iic_slave_init(void)
{
    /* 使能GPIOB时钟 */
    rcu_periph_clock_enable(RCU_GPIOB);
    /* 使能I2C0时钟 */
    rcu_periph_clock_enable(RCU_I2C0);

    /* 连接PB8到I2C0_SCL */
    gpio_af_set(PORT_SCL_I, GPIO_AF_4, PIN_SCL_I);
    /* 连接PB9到I2C0_SDA */
    gpio_af_set(PORT_SDA_I, GPIO_AF_4, PIN_SDA_I);

    /* 配置I2C0的GPIO引脚 */
    gpio_mode_set(PORT_SCL_I, GPIO_MODE_AF, GPIO_PUPD_PULLUP, PIN_SCL_I);
    gpio_output_options_set(PORT_SCL_I, GPIO_OTYPE_OD, GPIO_OSPEED_MAX, PIN_SCL_I);
    gpio_mode_set(PORT_SDA_I, GPIO_MODE_AF, GPIO_PUPD_PULLUP, PIN_SDA_I);
    gpio_output_options_set(PORT_SDA_I, GPIO_OTYPE_OD, GPIO_OSPEED_MAX, PIN_SDA_I);

    /* 配置I2C时钟 */
    i2c_clock_config(I2C0, I2C_SPEED, I2C_DTCY_2);
    /* 配置I2C地址 */
    i2c_mode_addr_config(I2C0, I2C_I2CMODE_ENABLE, I2C_ADDFORMAT_7BITS, I2C_BATT_ADDR);
    /* 使能I2C0 */
    i2c_enable(I2C0);
    /* 使能应答 */
    i2c_ack_config(I2C0, I2C_ACK_ENABLE);
}
```

## 📊 关键配置参数

### I2C 时钟配置

| 参数       | 说明         | 典型值    |
| :--------- | :----------- | :-------- |
| I2C_SPEED  | I2C 通信速率 | 100KHz    |
| I2C_DTCY_2 | 占空比配置   | 50%占空比 |

### 地址配置

| 参数                | 说明         | 格式   |
| :------------------ | :----------- | :----- |
| I2C_ADDFORMAT_7BITS | 地址格式     | 7 位   |
| I2C_BATT_ADDR       | 从机设备地址 | 自定义 |

### GPIO 复用功能

| 引脚 | 复用功能 | 说明          |
| :--- | :------- | :------------ |
| PB8  | AF4      | I2C0_SCL 时钟 |
| PB9  | AF4      | I2C0_SDA 数据 |

## 🚀 使用示例

### 完整初始化流程

```c
// 定义宏（需要在头文件中预先定义）
#define PORT_SCL_I     GPIOB
#define PIN_SCL_I      GPIO_PIN_8
#define PORT_SDA_I     GPIOB
#define PIN_SDA_I      GPIO_PIN_9
#define I2C_SPEED      100000    // 100KHz
#define I2C_BATT_ADDR  0x50      // 从机地址

int main(void) {
    // 初始化I2C从机
    iic_slave_init();

    // 主循环
    while(1) {
        // 从机数据处理逻辑
        // ...
    }
}
```

### 从机数据接收处理

```c
void i2c_slave_receive_handler(void) {
    if(i2c_flag_get(I2C0, I2C_FLAG_ADDSEND)) {
        // 地址匹配标志，清除标志
        i2c_flag_clear(I2C0, I2C_FLAG_ADDSEND);
    }

    if(i2c_flag_get(I2C0, I2C_FLAG_RBNE)) {
        // 接收缓冲区非空，读取数据
        uint8_t received_data = i2c_data_receive(I2C0);
        // 处理接收到的数据
        process_received_data(received_data);
    }
}
```

## ⚠️ 注意事项

1. **时钟配置顺序**：

   - 必须先使能 RCU 时钟再配置 GPIO 和 I2C
   - GPIO 时钟和 I2C 时钟都需要使能

2. **引脚配置要求**：

   - 必须配置为开漏输出模式
   - 需要使能内部上拉电阻
   - 复用功能设置要正确

3. **从机地址**：

   - 确保地址不与总线上其他设备冲突
   - 7 位地址范围：0x08-0x77（避免保留地址）

4. **总线电气特性**：
   - 外部上拉电阻推荐值：4.7KΩ-10KΩ
   - 信号电平：3.3V CMOS

## 🔍 调试技巧

1. **信号检测**：

   - 使用逻辑分析仪检查 SCL/SDA 信号
   - 验证起始条件和停止条件
   - 检查 ACK/NACK 时序

2. **常见问题**：

   - 无响应：检查地址配置和 GPIO 复用
   - 时序错误：检查时钟配置和上拉电阻
   - 数据错误：验证从机应答配置

3. **测试方法**：
   - 使用 I2C 扫描程序检测从机地址
   - 主机发送测试数据验证通信
   - 监控标志位状态确认工作模式

## 📈 性能参数

| 参数         | 典型值       |
| :----------- | :----------- |
| 最大时钟频率 | 400KHz(快速) |
| 标准时钟频率 | 100KHz       |
| 地址响应时间 | <10μs        |
| 数据传输效率 | >95%         |

## 📖 相关宏定义示例

```c
// 头文件中的宏定义示例
#ifndef I2C_SLAVE_H
#define I2C_SLAVE_H

#include "gd32f4xx.h"

// GPIO端口和引脚定义
#define PORT_SCL_I     GPIOB
#define PIN_SCL_I      GPIO_PIN_8
#define PORT_SDA_I     GPIOB
#define PIN_SDA_I      GPIO_PIN_9

// I2C配置参数
#define I2C_SPEED      100000    // 100KHz标准速率
#define I2C_BATT_ADDR  0x50      // 从机设备地址

// 函数声明
void iic_slave_init(void);
void i2c_slave_receive_handler(void);

#endif // I2C_SLAVE_H
```
