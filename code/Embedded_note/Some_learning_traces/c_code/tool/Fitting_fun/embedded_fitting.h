#ifndef EMBEDDED_FITTING_H
#define EMBEDDED_FITTING_H

#include <stdint.h>

// 配置参数 - 根据您的MCU内存情况调整
#define MAX_CALIBRATION_POINTS 16    // 最大校准点数量
#define VOLTAGE_PRECISION 1000       // 电压精度（mV为单位，避免浮点运算）

// 线性拟合结构体 - 使用定点数避免浮点运算
typedef struct {
    int32_t slope_scaled;      // 斜率 * VOLTAGE_PRECISION
    int32_t intercept_scaled;  // 截距 * VOLTAGE_PRECISION
    uint8_t is_valid;          // 拟合是否有效
} EmbeddedLinearFit;

// 校准数据结构体
typedef struct {
    uint16_t adc_values[MAX_CALIBRATION_POINTS];    // ADC读数
    uint16_t voltage_mv[MAX_CALIBRATION_POINTS];    // 对应电压值(mV)
    uint8_t point_count;                            // 实际数据点数量
} CalibrationData;

// 函数声明
EmbeddedLinearFit embedded_linear_fit(const CalibrationData* cal_data);
uint16_t adc_to_voltage_mv(const EmbeddedLinearFit* fit, uint16_t adc_reading);
uint8_t validate_calibration(const CalibrationData* cal_data);
void store_calibration_to_flash(const CalibrationData* cal_data);
void load_calibration_from_flash(CalibrationData* cal_data);

#endif // EMBEDDED_FITTING_H
