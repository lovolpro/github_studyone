# 🔄 GD32 SPI1 主机模式驱动笔记

[TOC]

## 🌟 概述

本笔记记录了 GD32F4xx 系列 MCU 的 SPI1 主机模式配置，主要特性：

- SPI1 全双工主机模式
- 8 位数据帧格式
- 软件 NSS 控制
- 支持 CPOL=0, CPHA=1 (模式 1)
- 256 分频，适合中低速设备

## 📌 硬件配置

### 引脚配置表

| 功能 | 引脚 | GPIO 模式 | 输出类型 | 速率  | 复用功能 | 说明           |
| ---- | ---- | --------- | -------- | ----- | -------- | -------------- |
| CS   | PB12 | 输出模式  | 推挽输出 | 50MHz | -        | 片选信号(软件) |
| SCK  | PB13 | 复用功能  | 推挽输出 | 50MHz | AF5      | 时钟信号       |
| MISO | PB14 | 复用功能  | 推挽输出 | 50MHz | AF5      | 主机输入       |
| MOSI | PB15 | 复用功能  | 推挽输出 | 50MHz | AF5      | 主机输出       |

### SPI 参数配置

| 参数     | 配置值         | 说明               |
| :------- | :------------- | :----------------- |
| 传输模式 | 全双工         | 同时发送和接收     |
| 设备模式 | 主机模式       | MCU 作为主设备     |
| 数据帧   | 8 位           | 标准字节传输       |
| 时钟极性 | CPOL=0, CPHA=1 | 模式 1，上升沿采样 |
| NSS 控制 | 软件控制       | GPIO 控制片选      |
| 预分频   | 256 分频       | 降低通信速率       |
| 字节序   | MSB 优先       | 高位在前           |

## 🛠 核心初始化代码

### 完整初始化函数

```c
/**
 * SPI1初始化 - 主入口函数
 */
void Drv_spi1_init(void)
{
    spi_gpio_config();  // GPIO配置
    spi1_init();        // SPI外设配置
}
```

### GPIO 配置实现

```c
/**
 * 配置SPI1相关GPIO引脚
 */
static void spi_gpio_config(void)
{
    // 1. 使能GPIO时钟
    rcu_periph_clock_enable(SPI1_RCU);  // RCU_GPIOB

    // 2. 配置复用功能 - SCK, MISO, MOSI
    gpio_af_set(SPI1_PORT, GPIO_AF_5, SPI1_SCK_PIN);   // PB13
    gpio_af_set(SPI1_PORT, GPIO_AF_5, SPI1_MISO_PIN);  // PB14
    gpio_af_set(SPI1_PORT, GPIO_AF_5, SPI1_MOSI_PIN);  // PB15

    // 3. CS引脚配置 (PB12) - 软件控制
    gpio_mode_set(SPI1_PORT, GPIO_MODE_OUTPUT, GPIO_PUPD_NONE, SPI1_CS_PIN);
    gpio_output_options_set(SPI1_PORT, GPIO_OTYPE_PP, GPIO_OSPEED_50MHZ, SPI1_CS_PIN);
    gpio_bit_reset(SPI1_PORT, SPI1_CS_PIN);  // 初始化为低电平

    // 4. SCK引脚配置 (PB13) - 时钟输出
    gpio_mode_set(SPI1_PORT, GPIO_MODE_AF, GPIO_PUPD_NONE, SPI1_SCK_PIN);
    gpio_output_options_set(SPI1_PORT, GPIO_OTYPE_PP, GPIO_OSPEED_50MHZ, SPI1_SCK_PIN);

    // 5. MISO引脚配置 (PB14) - 主机输入
    gpio_mode_set(SPI1_PORT, GPIO_MODE_AF, GPIO_PUPD_NONE, SPI1_MISO_PIN);
    gpio_output_options_set(SPI1_PORT, GPIO_OTYPE_PP, GPIO_OSPEED_50MHZ, SPI1_MISO_PIN);

    // 6. MOSI引脚配置 (PB15) - 主机输出
    gpio_mode_set(SPI1_PORT, GPIO_MODE_AF, GPIO_PUPD_NONE, SPI1_MOSI_PIN);
    gpio_output_options_set(SPI1_PORT, GPIO_OTYPE_PP, GPIO_OSPEED_50MHZ, SPI1_MOSI_PIN);
}
```

### SPI 外设配置实现

```c
/**
 * 配置SPI1外设参数
 */
static void spi1_init(void)
{
    spi_parameter_struct spi_init_struct;

    // 1. 使能SPI时钟
    rcu_periph_clock_enable(SPI1_PERIPH_RCU);  // RCU_SPI1

    // 2. 初始化SPI结构体
    spi_struct_para_init(&spi_init_struct);

    // 3. 配置SPI参数
    spi_init_struct.trans_mode           = SPI_TRANSMODE_FULLDUPLEX;  // 全双工
    spi_init_struct.device_mode          = SPI_MASTER;               // 主机模式
    spi_init_struct.frame_size           = SPI_FRAMESIZE_8BIT;       // 8位数据
    spi_init_struct.clock_polarity_phase = SPI_CK_PL_LOW_PH_2EDGE;   // 模式1
    spi_init_struct.nss                  = SPI_NSS_SOFT;             // 软件NSS
    spi_init_struct.prescale             = SPI_PSC_256;              // 256分频
    spi_init_struct.endian               = SPI_ENDIAN_MSB;           // MSB优先

    // 4. 初始化并使能SPI
    spi_init(SPI1, &spi_init_struct);
    spi_enable(SPI1);
}
```

## 🚀 使用方法

### 基本数据传输函数

```c
/**
 * SPI发送一个字节并接收一个字节
 * @param data: 要发送的数据
 * @return: 接收到的数据
 */
uint8_t SPI1_TransmitReceive(uint8_t data)
{
    // 等待发送缓冲区空
    while(RESET == spi_i2s_flag_get(SPI1, SPI_FLAG_TBE));

    // 发送数据
    spi_i2s_data_transmit(SPI1, data);

    // 等待接收缓冲区非空
    while(RESET == spi_i2s_flag_get(SPI1, SPI_FLAG_RBNE));

    // 返回接收到的数据
    return spi_i2s_data_receive(SPI1);
}

/**
 * SPI只发送数据
 * @param data: 要发送的数据
 */
void SPI1_Transmit(uint8_t data)
{
    while(RESET == spi_i2s_flag_get(SPI1, SPI_FLAG_TBE));
    spi_i2s_data_transmit(SPI1, data);
    while(RESET == spi_i2s_flag_get(SPI1, SPI_FLAG_RBNE));
    spi_i2s_data_receive(SPI1);  // 清除接收标志
}

/**
 * SPI只接收数据
 * @return: 接收到的数据
 */
uint8_t SPI1_Receive(void)
{
    return SPI1_TransmitReceive(0xFF);  // 发送dummy数据
}
```

### 片选控制宏定义

```c
// 在头文件中定义
#define SPI1_CS_LOW()   gpio_bit_reset(GPIOB, GPIO_PIN_12)
#define SPI1_CS_HIGH()  gpio_bit_set(GPIOB, GPIO_PIN_12)

// 使用示例
void SPI1_WriteRegister(uint8_t reg, uint8_t value)
{
    SPI1_CS_LOW();                    // 拉低片选
    SPI1_Transmit(reg);               // 发送寄存器地址
    SPI1_Transmit(value);             // 发送数据
    SPI1_CS_HIGH();                   // 拉高片选
}

uint8_t SPI1_ReadRegister(uint8_t reg)
{
    uint8_t value;

    SPI1_CS_LOW();                    // 拉低片选
    SPI1_Transmit(reg | 0x80);        // 发送读命令(最高位为1)
    value = SPI1_Receive();           // 接收数据
    SPI1_CS_HIGH();                   // 拉高片选

    return value;
}
```

### 多字节传输示例

```c
/**
 * SPI发送多个字节
 * @param pData: 数据指针
 * @param size: 数据长度
 */
void SPI1_TransmitBuffer(uint8_t *pData, uint16_t size)
{
    SPI1_CS_LOW();

    for(uint16_t i = 0; i < size; i++)
    {
        SPI1_Transmit(pData[i]);
    }

    SPI1_CS_HIGH();
}

/**
 * SPI接收多个字节
 * @param pData: 数据缓冲区
 * @param size: 数据长度
 */
void SPI1_ReceiveBuffer(uint8_t *pData, uint16_t size)
{
    SPI1_CS_LOW();

    for(uint16_t i = 0; i < size; i++)
    {
        pData[i] = SPI1_Receive();
    }

    SPI1_CS_HIGH();
}
```

## 📊 时序和性能参数

### SPI 时钟频率计算

```
SPI时钟 = APB时钟 / 分频系数
典型值: 84MHz / 256 = 328.125kHz
```

### SPI 模式说明

| 模式 | CPOL | CPHA | 时钟空闲 | 数据采样边沿 |
| :--- | :--- | :--- | :------- | :----------- |
| 0    | 0    | 0    | 低电平   | 上升沿       |
| 1    | 0    | 1    | 低电平   | 下降沿       |
| 2    | 1    | 0    | 高电平   | 下降沿       |
| 3    | 1    | 1    | 高电平   | 上升沿       |

_当前配置使用模式 1_

## ⚠️ 注意事项

1. **GPIO 配置**：

   - 所有 SPI 引脚必须配置为推挽输出
   - 复用功能必须正确设置为 AF5
   - CS 引脚作为普通 GPIO 控制

2. **时序要求**：

   - CS 信号的建立和保持时间
   - 数据的建立和保持时间
   - 时钟频率不能超过从设备的最大频率

3. **数据传输**：

   - SPI 是全双工通信，发送的同时会接收
   - 主机必须发送时钟才能接收数据
   - 使用 dummy 数据(如 0xFF)进行只读操作

4. **错误处理**：
   - 检查 SPI 状态标志避免阻塞
   - 实现超时机制防止死循环

## 🔍 调试技巧

1. **信号测试**：

   - 使用逻辑分析仪观察 SPI 时序
   - 检查 CS、SCK、MISO、MOSI 信号
   - 验证时钟极性和相位

2. **常见问题**：

   - 无通信：检查 GPIO 复用配置和时钟使能
   - 数据错误：检查 SPI 模式和字节序
   - 通信不稳定：检查时钟频率和信号质量

3. **测试代码**：

   ```c
   // SPI自环测试(MISO连接MOSI)
   void SPI1_LoopbackTest(void)
   {
       uint8_t test_data = 0xAA;
       uint8_t received;

       SPI1_CS_LOW();
       received = SPI1_TransmitReceive(test_data);
       SPI1_CS_HIGH();

       if(received == test_data)
           printf("SPI测试通过\n");
       else
           printf("SPI测试失败\n");
   }
   ```

## 📈 性能参数

| 参数     | 数值   |
| :------- | :----- |
| 最大速率 | 21MHz  |
| 当前速率 | 328kHz |
| 数据位宽 | 8 位   |
| 传输延迟 | <10μs  |
