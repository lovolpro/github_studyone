#ifndef VOLTAGE_CALIBRATION_H
#define VOLTAGE_CALIBRATION_H

#include "embedded_fitting.h"

// Flash存储配置（根据您的MCU修改）
#ifdef STM32F4xx
    #define CALIBRATION_FLASH_ADDRESS   0x080E0000  // Flash扇区地址
    #define CALIBRATION_FLASH_SECTOR    11          // Flash扇区号
#elif defined(STM32F1xx)
    #define CALIBRATION_FLASH_ADDRESS   0x0801F000  // Flash页地址
    #define CALIBRATION_FLASH_PAGE      63          // Flash页号
#else
    // 其他MCU配置...
#endif

// 全局变量声明
extern CalibrationData g_cal_data;
extern EmbeddedLinearFit g_voltage_fit;

// 公共接口函数
void voltage_calibration_init(void);
uint16_t read_voltage_mv(uint16_t adc_value);
uint8_t add_new_calibration_point(uint16_t adc_value, uint16_t voltage_mv);
void save_calibration(void);
void reset_to_factory_calibration(void);

// 校准状态查询
uint8_t is_calibration_valid(void);
uint8_t get_calibration_point_count(void);
void get_calibration_info(uint16_t* slope_scaled, uint16_t* intercept_scaled);

#endif // VOLTAGE_CALIBRATION_H
