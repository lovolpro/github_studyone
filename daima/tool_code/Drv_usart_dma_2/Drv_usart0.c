#include "Drv_usart0.h"
#include "boot_log_page.h"
#include "valdefine.h"
#include <string.h>
#include <stdio.h> // 添加头文件以支持调试日志

// DMA接收缓冲区 - 使用单个大的循环缓冲区
uint8_t rx_buffer[USART0_DMA_SIZE];
// DMA发送缓冲区
uint8_t tx_buffer[USART0_DMA_SIZE];

// 循环缓冲区管理
static uint16_t last_pos = 0;       // 上次处理的位置
// 空闲中断标志
static volatile uint8_t idle_flag = 0;

// 私有函数声明
static void USART_GPIO_Init(void);
static void USART_Config(uint32_t baudrate);
static void DMA_RX_Init(void);
static void DMA_TX_Init(void);

int fputc(int ch, FILE *f) {
    // 简单的字符输出函数，直接发送到USART0
    usart_data_transmit(USART0, (uint8_t)ch);
    while (usart_flag_get(USART0, USART_FLAG_TBE) == RESET);
    return ch;
}

// 初始化USART
void Drv_usart0_init() 
{
    USART_GPIO_Init();
    USART_Config(USART0_BAUDRATE);
    DMA_RX_Init();
    DMA_TX_Init();
}

// GPIO初始化
static void USART_GPIO_Init(void) {
    // 使能时钟
    rcu_periph_clock_enable(RCU_GPIOA);
    rcu_periph_clock_enable(RCU_USART0);

    // 配置USART0 TX (PA9) 和 RX (PA10)
    gpio_af_set(GPIOA, GPIO_AF_7, GPIO_PIN_9 | GPIO_PIN_10);

    // TX引脚配置
    gpio_mode_set(GPIOA, GPIO_MODE_AF, GPIO_PUPD_PULLUP, GPIO_PIN_9);
    gpio_output_options_set(GPIOA, GPIO_OTYPE_PP, GPIO_OSPEED_50MHZ, GPIO_PIN_9);

    // RX引脚配置
    gpio_mode_set(GPIOA, GPIO_MODE_AF, GPIO_PUPD_PULLUP, GPIO_PIN_10);
    gpio_output_options_set(GPIOA, GPIO_OTYPE_PP, GPIO_OSPEED_50MHZ, GPIO_PIN_10);
}

// USART配置
static void USART_Config(uint32_t baudrate) {
    // 复位USART
    usart_deinit(USART0);

    // 配置USART参数
    usart_word_length_set(USART0, USART_WL_8BIT);
    usart_stop_bit_set(USART0, USART_STB_1BIT);
    usart_parity_config(USART0, USART_PM_NONE);
    usart_baudrate_set(USART0, baudrate);

    // 硬件流控制禁用
    usart_hardware_flow_rts_config(USART0, USART_RTS_DISABLE);
    usart_hardware_flow_cts_config(USART0, USART_CTS_DISABLE);

    // 使能接收和发送
    usart_receive_config(USART0, USART_RECEIVE_ENABLE);
    usart_transmit_config(USART0, USART_TRANSMIT_ENABLE);

    // 使能DMA
    usart_dma_receive_config(USART0, USART_RECEIVE_DMA_ENABLE);
    usart_dma_transmit_config(USART0, USART_TRANSMIT_DMA_ENABLE);

    // 使能USART
    usart_enable(USART0);

    // 配置IDLE中断，用于检测数据包结束
    nvic_irq_enable(USART0_IRQn, 4, 0);
    usart_interrupt_enable(USART0, USART_INT_IDLE);
}

// DMA接收初始化
static void DMA_RX_Init(void) {
    dma_single_data_parameter_struct dma_init_struct;

    // 使能DMA时钟
    rcu_periph_clock_enable(RCU_DMA1);

    // 复位DMA通道
    dma_deinit(DMA1, DMA_CH2);

    // 配置DMA参数
    dma_init_struct.direction = DMA_PERIPH_TO_MEMORY;
    dma_init_struct.memory0_addr = (uint32_t)rx_buffer;  // 使用单一缓冲区
    dma_init_struct.memory_inc = DMA_MEMORY_INCREASE_ENABLE;
    dma_init_struct.periph_memory_width = DMA_MEMORY_WIDTH_8BIT;
    dma_init_struct.number = USART0_DMA_SIZE;
    dma_init_struct.periph_addr = (uint32_t)(&USART_DATA(USART0));
    dma_init_struct.periph_inc = DMA_PERIPH_INCREASE_DISABLE;
    dma_init_struct.priority = DMA_PRIORITY_ULTRA_HIGH;
    dma_init_struct.circular_mode = DMA_CIRCULAR_MODE_ENABLE;  // 开启循环模式

    // 初始化DMA
    dma_single_data_mode_init(DMA1, DMA_CH2, &dma_init_struct);

    // 配置DMA通道
    dma_channel_subperipheral_select(DMA1, DMA_CH2, DMA_SUBPERI4);

    // 使能DMA通道
    dma_channel_enable(DMA1, DMA_CH2);

    // 使能DMA半传输和传输完成中断（用于循环缓冲区）
    dma_interrupt_enable(DMA1, DMA_CH2, DMA_INT_HTF);  // 半传输中断
    dma_interrupt_enable(DMA1, DMA_CH2, DMA_INT_FTF);  // 传输完成中断
    // 设置DMA中断优先级
    nvic_irq_enable(DMA1_Channel2_IRQn, 5, 0);
}

// DMA发送初始化
static void DMA_TX_Init(void) {
    dma_single_data_parameter_struct dma_init_struct;

    // 使能DMA时钟
    rcu_periph_clock_enable(RCU_DMA1);

    // 复位DMA通道
    dma_deinit(DMA1, DMA_CH7);

    // 配置DMA参数
    dma_init_struct.direction = DMA_MEMORY_TO_PERIPH;
    dma_init_struct.memory0_addr = (uint32_t)tx_buffer;
    dma_init_struct.memory_inc = DMA_MEMORY_INCREASE_ENABLE;
    dma_init_struct.periph_memory_width = DMA_MEMORY_WIDTH_8BIT;
    dma_init_struct.number = USART0_DMA_SIZE;
    dma_init_struct.periph_addr = (uint32_t)(&USART_DATA(USART0));
    dma_init_struct.priority = DMA_PRIORITY_ULTRA_HIGH;
    dma_init_struct.periph_inc = DMA_PERIPH_INCREASE_DISABLE;
    dma_init_struct.circular_mode = DMA_CIRCULAR_MODE_DISABLE;

    // 初始化DMA
    dma_single_data_mode_init(DMA1, DMA_CH7, &dma_init_struct);

    // 配置DMA通道
    dma_channel_subperipheral_select(DMA1, DMA_CH7, DMA_SUBPERI4);

    // 使能DMA通道
    dma_channel_enable(DMA1, DMA_CH7);
}

// 处理循环缓冲区中的新数据
static void process_rx_data(uint16_t current_pos) {
    uint16_t data_len;
    uint8_t open_flag = 0;
    // 处理特殊页面逻辑
    if (!bootLogEndFlag) {
        bootLogEndFlag = true;
        open_flag = 1;
    }
    bootLogEndDelay = 200;
    //处理数据
    if (current_pos >= last_pos) {
        // 线性数据：从last_pos到current_pos
        data_len = current_pos - last_pos;
        if (open_flag && data_len > 0) {
            open_flag = 0;
            board_pack_buf_data("{JC_USART_open:", strlen("{JC_USART_open:"));
        }
        // --- 优化：usb_tx_buf 溢出保护 ---
        if (usb_tx_len + data_len > UPDATE_TXRX_SIZE) {
            uint16_t remain = UPDATE_TXRX_SIZE - usb_tx_len;
            if (remain > 0) {
                memcpy(&usb_tx_buf[usb_tx_len], &rx_buffer[last_pos], remain);
                usb_tx_len += remain;
            }
            // 溢出时可选择丢弃多余数据或滑动窗口，这里直接丢弃
        } else {
            memcpy(&usb_tx_buf[usb_tx_len], &rx_buffer[last_pos], data_len);
            usb_tx_len += data_len;
        }
    } else {
        // 环形数据：分两段处理
        uint16_t first_part = USART0_DMA_SIZE - last_pos;
        uint16_t second_part = current_pos;
        data_len = first_part + second_part;
        if (open_flag && data_len > 0) {
            open_flag = 0;
            board_pack_buf_data("{JC_USART_open:", strlen("{JC_USART_open:"));
        }
        // --- 优化：usb_tx_buf 溢出保护 ---
        if (usb_tx_len + data_len > UPDATE_TXRX_SIZE) {
            uint16_t remain = UPDATE_TXRX_SIZE - usb_tx_len;
            if (remain > 0) {
                if (remain <= first_part) {
                    memcpy(&usb_tx_buf[usb_tx_len], &rx_buffer[last_pos], remain);
                    usb_tx_len += remain;
                } else {
                    memcpy(&usb_tx_buf[usb_tx_len], &rx_buffer[last_pos], first_part);
                    usb_tx_len += first_part;
                    memcpy(&usb_tx_buf[usb_tx_len], &rx_buffer[0], remain - first_part);
                    usb_tx_len += (remain - first_part);
                }
            }
            // 溢出时多余数据丢弃
        } else {
            memcpy(&usb_tx_buf[usb_tx_len], &rx_buffer[last_pos], first_part);
            usb_tx_len += first_part;
            memcpy(&usb_tx_buf[usb_tx_len], &rx_buffer[0], second_part);
            usb_tx_len += second_part;
        }
    }
    last_pos = current_pos;
}

// 在主循环中调用的数据处理函数
void usart0_rx_buffer_process(void) {
    static uint32_t last_check_time = 0;
    static uint16_t last_dma_pos = 0;
    uint32_t now = TaskDelay_GetTick();
    uint16_t current_pos = USART0_DMA_SIZE - dma_transfer_number_get(DMA1, DMA_CH2);
    // 如果有IDLE中断标志，立即处理
    if (idle_flag) {
        idle_flag = false;
        if (current_pos != last_pos) {
            process_rx_data(current_pos);
            last_check_time = now;
        }
    } else {
        if (current_pos != last_pos) {
            process_rx_data(current_pos);
            last_check_time = now;
        } else if (now - last_check_time > 500) {
            // --- 优化：DMA卡死兜底 ---
            last_check_time = now;
            if (current_pos == last_dma_pos && current_pos != 0) {
                last_pos = current_pos;
                // 可选：记录日志或报警
            }
            last_dma_pos = current_pos;
        }
    }
}

// USART0 IDLE中断处理函数
void USART0_IRQHandler(void) {
    if (usart_interrupt_flag_get(USART0, USART_INT_FLAG_IDLE)) {
        // 清除IDLE中断标志
        usart_interrupt_flag_clear(USART0, USART_INT_FLAG_IDLE);
        // 清除IDLE标志的特殊方法：读SR和DR寄存器
        (void)USART_STAT0(USART0);
        (void)USART_DATA(USART0);
        
        // 设置IDLE标志，在主循环中处理数据
        idle_flag = true;
    }
}

// DMA中断处理函数
void DMA1_Channel2_IRQHandler(void) {
    uint16_t current_pos;
    static uint8_t overflow_count = 0;
    
    // 检查半传输中断
    if (dma_interrupt_flag_get(DMA1, DMA_CH2, DMA_INT_FLAG_HTF)) {
        // 清除半传输中断标志
        dma_interrupt_flag_clear(DMA1, DMA_CH2, DMA_FLAG_HTF);
        
        // 缓冲区半满，当前位置在中间
        current_pos = USART0_DMA_SIZE / 2;
        
        // 检查是否需要处理数据
        if (current_pos != last_pos) {
            process_rx_data(current_pos);
            overflow_count = 0; // 重置溢出计数
        } else {
            overflow_count++;
            if (overflow_count > 3) {
                // 连续多次检测到相同位置，可能DMA卡住了，强制重置
                last_pos = 0;
                overflow_count = 0;

            }
        }
    }
    
    // 检查传输完成中断
    if (dma_interrupt_flag_get(DMA1, DMA_CH2, DMA_INT_FLAG_FTF)) {
        // 清除传输完成中断标志
        dma_interrupt_flag_clear(DMA1, DMA_CH2, DMA_FLAG_FTF);
        
        // 缓冲区已满，处理剩余数据
        if (last_pos != 0) {  // 只有当last_pos不在开始位置时，才需要处理到末尾的数据
            process_rx_data(USART0_DMA_SIZE);
        }
        
        // 重置处理位置到缓冲区开头
        last_pos = 0;
        overflow_count = 0; // 重置溢出计数
    }
}


