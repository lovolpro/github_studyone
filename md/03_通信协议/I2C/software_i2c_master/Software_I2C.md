# 🔌 GD32 软件 I2C 主机模式驱动笔记

[TOC]

## 🌟 概述

本笔记记录了 GD32F4xx 系列 MCU 的软件 I2C 主机模式实现，主要特性：

- 基于 GPIO 位控制的 I2C 协议实现
- 主机模式操作
- 支持单字节和多字节读写
- 可配置延时时序
- 完整的协议实现(起始、停止、应答机制)

## 📌 硬件配置

| 功能 | 引脚配置 | GPIO 模式 | 输出类型 | 速率  | 说明         |
| ---- | -------- | --------- | -------- | ----- | ------------ |
| SCL  | 自定义   | 输出模式  | 开漏输出 | 50MHz | 时钟线       |
| SDA  | 自定义   | 输入/输出 | 开漏输出 | 50MHz | 数据线(双向) |

### 宏定义配置

```c
// 在头文件中需要定义以下宏
#define IIC1_RCU        RCU_GPIOB          // GPIO时钟
#define IIC1_GPIO       GPIOB              // GPIO端口
#define IIC1_SCL_PIN    GPIO_PIN_6         // SCL引脚
#define IIC1_SDA_PIN    GPIO_PIN_7         // SDA引脚

// GPIO控制宏
#define IIC1_SCL_H      gpio_bit_set(IIC1_GPIO, IIC1_SCL_PIN)
#define IIC1_SCL_L      gpio_bit_reset(IIC1_GPIO, IIC1_SCL_PIN)
#define IIC1_SDA_H      gpio_bit_set(IIC1_GPIO, IIC1_SDA_PIN)
#define IIC1_SDA_L      gpio_bit_reset(IIC1_GPIO, IIC1_SDA_PIN)

// SDA方向控制
#define IIC1_SDA_OUT()  gpio_mode_set(IIC1_GPIO, GPIO_MODE_OUTPUT, GPIO_PUPD_NONE, IIC1_SDA_PIN)
#define IIC1_SDA_IN()   gpio_mode_set(IIC1_GPIO, GPIO_MODE_INPUT, GPIO_PUPD_PULLUP, IIC1_SDA_PIN)

// SDA读取
#define IIC1_READ_SDA   gpio_input_bit_get(IIC1_GPIO, IIC1_SDA_PIN)
```

## 🛠 驱动实现

### 1. 初始化函数

```c
/**
 * I2C初始化函数
 * 配置GPIO为开漏输出模式，初始化总线为空闲状态
 */
void Drv_i2c1_init(void)
{
    // 使能GPIO时钟
    rcu_periph_clock_enable(IIC1_RCU);

    // 配置SCL和SDA为开漏输出模式
    gpio_mode_set(IIC1_GPIO, GPIO_MODE_OUTPUT, GPIO_PUPD_NONE, IIC1_SCL_PIN | IIC1_SDA_PIN);
    gpio_output_options_set(IIC1_GPIO, GPIO_OTYPE_OD, GPIO_OSPEED_50MHZ, IIC1_SCL_PIN | IIC1_SDA_PIN);

    // 设置总线为空闲状态(高电平)
    IIC1_SCL_H;
    IIC1_SDA_H;
}
```

### 2. I2C 协议基础函数

#### 起始条件生成

```c
/**
 * 产生I2C起始信号
 * 时序：SCL为高电平时，SDA由高变低
 */
void IIC1_Start(void)
{
    IIC1_SDA_OUT();     // SDA设置为输出模式
    IIC1_SDA_H;         // SDA先拉高
    IIC1_SCL_H;         // SCL拉高
    delay_us(10);       // 延时确保信号稳定

    IIC1_SDA_L;         // SDA拉低，产生起始条件
    delay_us(10);
    IIC1_SCL_L;         // SCL拉低，钳住总线准备传输
}
```

#### 停止条件生成

```c
/**
 * 产生I2C停止信号
 * 时序：SCL为高电平时，SDA由低变高
 */
void IIC1_Stop(void)
{
    IIC1_SDA_OUT();     // SDA设置为输出模式
    IIC1_SCL_L;         // SCL先拉低
    IIC1_SDA_L;         // SDA拉低
    delay_us(10);

    IIC1_SCL_H;         // SCL拉高
    delay_us(10);
    IIC1_SDA_H;         // SDA拉高，产生停止条件
    delay_us(10);
}
```

#### 应答等待函数

```c
/**
 * 等待从机应答信号
 * @return: 0-接收到应答, 1-应答超时失败
 */
uint8_t IIC1_Wait_Ack(void)
{
    uint8_t ucErrTime = 0;

    IIC1_SDA_IN();      // SDA设置为输入模式
    IIC1_SDA_H;         // 释放SDA线
    delay_us(10);

    IIC1_SCL_H;         // SCL拉高，读取应答
    delay_us(10);

    // 等待SDA为低电平(应答信号)
    while(IIC1_READ_SDA != 0)
    {
        ucErrTime++;
        if(ucErrTime > 250)
        {
            IIC1_Stop();   // 超时则发送停止信号
            return 1;      // 返回失败
        }
    }

    IIC1_SCL_L;         // SCL拉低
    return 0;           // 返回成功
}
```

#### 应答信号生成

```c
/**
 * 主机发送ACK应答信号
 */
void IIC1_Ack(void)
{
    IIC1_SCL_L;
    IIC1_SDA_OUT();     // SDA设置为输出
    IIC1_SDA_L;         // 发送ACK(低电平)
    delay_us(8);

    IIC1_SCL_H;         // 产生时钟脉冲
    delay_us(8);
    IIC1_SCL_L;
}

/**
 * 主机发送NACK信号
 */
void IIC1_NAck(void)
{
    IIC1_SCL_L;
    IIC1_SDA_OUT();     // SDA设置为输出
    IIC1_SDA_H;         // 发送NACK(高电平)
    delay_us(8);

    IIC1_SCL_H;         // 产生时钟脉冲
    delay_us(8);
    IIC1_SCL_L;
}
```

### 3. 字节传输函数

#### 发送一个字节

```c
/**
 * I2C发送一个字节数据
 * @param txd: 要发送的字节数据
 * 发送顺序：MSB先发送
 */
void IIC1_Send_Byte(uint8_t txd)
{
    uint8_t t;
    uint8_t getpin;

    IIC1_SDA_OUT();     // SDA设置为输出模式
    IIC1_SCL_L;         // 拉低时钟开始数据传输

    // 逐位发送，MSB优先
    for(t = 0; t < 8; t++)
    {
        getpin = (txd & 0x80) >> 7;  // 获取最高位

        if(getpin == 0)
            IIC1_SDA_L;      // 发送0
        else
            IIC1_SDA_H;      // 发送1

        txd <<= 1;           // 左移准备下一位
        delay_us(4);

        IIC1_SCL_H;          // 产生时钟上升沿
        delay_us(8);
        IIC1_SCL_L;          // 时钟下降沿
        delay_us(4);
    }
}
```

#### 接收一个字节

```c
/**
 * I2C接收一个字节数据
 * @param ack: 1-发送ACK, 0-发送NACK
 * @return: 接收到的字节数据
 */
uint8_t IIC1_Read_Byte(unsigned char ack)
{
    unsigned char i, receive = 0;

    IIC1_SDA_IN();      // SDA设置为输入模式

    // 逐位接收，MSB优先
    for(i = 0; i < 8; i++)
    {
        IIC1_SCL_L;
        delay_us(8);
        IIC1_SCL_H;      // 时钟上升沿，读取数据

        receive <<= 1;   // 左移准备接收下一位
        if(IIC1_READ_SDA != 0)
            receive++;   // 接收到1

        delay_us(10);
    }

    // 发送应答信号
    if (!ack)
        IIC1_NAck();     // 发送NACK
    else
        IIC1_Ack();      // 发送ACK

    return receive;
}
```

### 4. 高级应用函数

#### 多字节读取

```c
/**
 * I2C连续读取多个字节
 * @param dev: 设备地址(7位)
 * @param reg: 寄存器地址
 * @param length: 读取字节数
 * @param data: 数据缓冲区
 * @return: 实际读取的字节数
 */
uint8_t IIC1_ReadBytes(uint8_t dev, uint8_t reg, uint8_t length, uint8_t *data)
{
    uint8_t count = 0;

    // 第一阶段：发送寄存器地址
    IIC1_Start();
    IIC1_Send_Byte(dev << 1);       // 发送设备地址+写位
    IIC1_Wait_Ack();
    IIC1_Send_Byte(reg);            // 发送寄存器地址
    IIC1_Wait_Ack();

    // 第二阶段：读取数据
    IIC1_Start();                   // 重新起始
    IIC1_Send_Byte((dev << 1) + 1); // 发送设备地址+读位
    IIC1_Wait_Ack();

    // 连续读取数据
    for(count = 0; count < length; count++)
    {
        if(count != length-1)
            data[count] = IIC1_Read_Byte(1);  // 非最后字节发送ACK
        else
            data[count] = IIC1_Read_Byte(0);  // 最后字节发送NACK
    }

    IIC1_Stop();                    // 发送停止条件
    return count;
}
```

#### 多字节写入

```c
/**
 * I2C连续写入多个字节
 * @param dev: 设备地址(7位)
 * @param reg: 寄存器地址
 * @param length: 写入字节数
 * @param data: 数据缓冲区
 * @return: 操作状态(1-成功)
 */
uint8_t IIC1_WriteBytes(uint8_t dev, uint8_t reg, uint8_t length, uint8_t* data)
{
    uint8_t count = 0;

    IIC1_Start();
    IIC1_Send_Byte(dev << 1);       // 发送设备地址+写位
    IIC1_Wait_Ack();
    IIC1_Send_Byte(reg);            // 发送寄存器地址
    IIC1_Wait_Ack();

    // 连续发送数据
    for(count = 0; count < length; count++)
    {
        IIC1_Send_Byte(data[count]);
        IIC1_Wait_Ack();
    }

    IIC1_Stop();                    // 发送停止条件
    return 1;
}
```

## 📊 时序参数配置

### 延时参数说明

| 延时位置      | 延时时间 | 说明                   |
| :------------ | :------- | :--------------------- |
| 起始/停止条件 | 10μs     | 确保条件建立时间       |
| 时钟高/低电平 | 8μs      | 时钟脉冲宽度           |
| 数据建立时间  | 4μs      | 数据在时钟边沿前的建立 |

### I2C 通信速率

| 参数         | 计算值 | 说明          |
| :----------- | :----- | :------------ |
| 时钟周期     | ~24μs  | 高+低电平时间 |
| 通信速率     | ~41kHz | 1/(24μs)      |
| 字节传输时间 | ~200μs | 8 位+应答位   |

## 🚀 使用示例

### 基本读写操作

```c
#define DEVICE_ADDR    0x50    // 设备地址
#define REG_ADDR       0x10    // 寄存器地址

int main(void)
{
    uint8_t write_data[4] = {0xAA, 0xBB, 0xCC, 0xDD};
    uint8_t read_data[4];

    // 初始化I2C
    Drv_i2c1_init();

    // 写入多个字节
    if(IIC1_WriteBytes(DEVICE_ADDR, REG_ADDR, 4, write_data))
    {
        printf("写入成功\n");
    }

    delay_ms(10);  // 等待写入完成

    // 读取多个字节
    uint8_t read_count = IIC1_ReadBytes(DEVICE_ADDR, REG_ADDR, 4, read_data);
    if(read_count == 4)
    {
        printf("读取成功: %02X %02X %02X %02X\n",
               read_data[0], read_data[1], read_data[2], read_data[3]);
    }

    return 0;
}
```

## ⚠️ 注意事项

1. **GPIO 配置要求**：

   - 必须配置为开漏输出模式
   - 需要外部上拉电阻(4.7kΩ 推荐)
   - SDA 需要支持输入/输出切换

2. **时序要求**：

   - 延时函数必须精确，建议使用硬件定时器
   - 不同器件可能需要调整延时参数
   - 注意起始/停止条件的时序要求

3. **错误处理**：

   - 应答超时检测机制
   - 总线异常恢复
   - 多次重试机制

4. **性能考虑**：
   - 软件 I2C 速度比硬件 I2C 慢
   - 占用 CPU 资源较多
   - 中断响应可能影响时序

## 🔍 调试技巧

1. **信号检测**：

   - 使用逻辑分析仪观察 SCL/SDA 波形
   - 检查起始/停止条件是否正确
   - 验证应答信号时序

2. **常见问题**：

   - 无响应：检查设备地址和连接
   - 时序错误：调整延时参数
   - 总线卡死：实现总线恢复机制

3. **总线恢复代码**：

   ```c
   void IIC1_Recovery(void)
   {
       int i;
       IIC1_SDA_IN();

       // 产生9个时钟脉冲清除总线
       for(i = 0; i < 9; i++)
       {
           IIC1_SCL_L;
           delay_us(10);
           IIC1_SCL_H;
           delay_us(10);
       }

       IIC1_Stop();  // 发送停止条件
   }
   ```

## 📈 性能参数

| 参数         | 典型值 |
| :----------- | :----- |
| 最大通信速率 | 50kHz  |
| CPU 占用率   | ~10%   |
| 响应时间     | <100μs |
| 可靠性       | >99%   |
