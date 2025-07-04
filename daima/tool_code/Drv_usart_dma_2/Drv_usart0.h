#ifndef __DRV_USART0_H
#define __DRV_USART0_H

#include "gd32f4xx.h"
#include <stdint.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdbool.h>
#include "systick.h"
#include "usb_driver.h"


// 配置参数
#define USART0_BAUDRATE      115200  // 默认波特率
#define USART0_DMA_SIZE      256     // DMA缓冲区大小


// 函数声明
void Drv_usart0_init();

// USART0接收数据处理
void usart0_rx_buffer_process(void);

#endif /* __DRV_USART0_H */
