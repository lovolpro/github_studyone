#include "embedded_fitting.h"

// 避免浮点运算的定点数乘法除法
static int32_t scale_multiply(int32_t a, int32_t b, int32_t scale) {
    int64_t temp = (int64_t)a * b;
    return (int32_t)(temp / scale);
}

/**
 * 嵌入式线性拟合函数 - 避免浮点运算
 * @param cal_data 校准数据
 * @return 拟合结果
 */
EmbeddedLinearFit embedded_linear_fit(const CalibrationData* cal_data) {
    EmbeddedLinearFit result = {0, 0, 0};
    
    if (!cal_data || cal_data->point_count < 2) {
        return result;
    }
    
    int32_t sum_x = 0, sum_y = 0, sum_xy = 0, sum_x_squared = 0;
    uint8_t n = cal_data->point_count;
    
    // 计算各项和
    for (uint8_t i = 0; i < n; i++) {
        int32_t x = cal_data->adc_values[i];
        int32_t y = cal_data->voltage_mv[i];
        
        sum_x += x;
        sum_y += y;
        sum_xy += x * y;
        sum_x_squared += x * x;
    }
    
    // 计算分母
    int32_t denominator = n * sum_x_squared - sum_x * sum_x;
    if (denominator == 0) {
        return result; // 无效拟合
    }
    
    // 计算斜率和截距（使用定点数）
    result.slope_scaled = ((int64_t)(n * sum_xy - sum_x * sum_y) * VOLTAGE_PRECISION) / denominator;
    result.intercept_scaled = ((int64_t)(sum_y - scale_multiply(result.slope_scaled, sum_x, VOLTAGE_PRECISION)) * VOLTAGE_PRECISION) / n;
    result.is_valid = 1;
    
    return result;
}

/**
 * ADC读数转换为电压值(mV)
 * @param fit 拟合结果
 * @param adc_reading ADC读数
 * @return 电压值(mV)
 */
uint16_t adc_to_voltage_mv(const EmbeddedLinearFit* fit, uint16_t adc_reading) {
    if (!fit || !fit->is_valid) {
        return 0;
    }
    
    int32_t voltage_scaled = scale_multiply(fit->slope_scaled, adc_reading, VOLTAGE_PRECISION) + fit->intercept_scaled;
    int32_t voltage_mv = voltage_scaled / VOLTAGE_PRECISION;
    
    // 限制范围，防止溢出
    if (voltage_mv < 0) voltage_mv = 0;
    if (voltage_mv > 65535) voltage_mv = 65535;
    
    return (uint16_t)voltage_mv;
}

/**
 * 验证校准数据的有效性
 * @param cal_data 校准数据
 * @return 1-有效，0-无效
 */
uint8_t validate_calibration(const CalibrationData* cal_data) {
    if (!cal_data || cal_data->point_count < 2 || cal_data->point_count > MAX_CALIBRATION_POINTS) {
        return 0;
    }
    
    // 检查ADC值是否单调递增
    for (uint8_t i = 1; i < cal_data->point_count; i++) {
        if (cal_data->adc_values[i] <= cal_data->adc_values[i-1]) {
            return 0;
        }
    }
    
    return 1;
}

/**
 * 存储校准数据到Flash（需要根据具体MCU实现）
 * @param cal_data 校准数据
 */
void store_calibration_to_flash(const CalibrationData* cal_data) {
    // TODO: 根据您的MCU实现Flash写入
    // 例如STM32的HAL_FLASH_Program()
    
    #ifdef STM32_HAL
    // STM32示例代码
    /*
    uint32_t flash_address = CALIBRATION_FLASH_ADDRESS;
    HAL_FLASH_Unlock();
    
    // 擦除扇区
    FLASH_EraseInitTypeDef erase_init;
    erase_init.TypeErase = FLASH_TYPEERASE_SECTORS;
    erase_init.Sector = CALIBRATION_FLASH_SECTOR;
    erase_init.NbSectors = 1;
    erase_init.VoltageRange = FLASH_VOLTAGE_RANGE_3;
    
    uint32_t sector_error;
    HAL_FLASHEx_Erase(&erase_init, &sector_error);
    
    // 写入数据
    uint32_t* data = (uint32_t*)cal_data;
    for (uint32_t i = 0; i < sizeof(CalibrationData)/4; i++) {
        HAL_FLASH_Program(FLASH_TYPEPROGRAM_WORD, flash_address + i*4, data[i]);
    }
    
    HAL_FLASH_Lock();
    */
    #endif
}

/**
 * 从Flash读取校准数据（需要根据具体MCU实现）
 * @param cal_data 校准数据缓冲区
 */
void load_calibration_from_flash(CalibrationData* cal_data) {
    // TODO: 根据您的MCU实现Flash读取
    
    #ifdef STM32_HAL
    // STM32示例代码
    /*
    uint32_t flash_address = CALIBRATION_FLASH_ADDRESS;
    uint32_t* data = (uint32_t*)cal_data;
    
    for (uint32_t i = 0; i < sizeof(CalibrationData)/4; i++) {
        data[i] = *((uint32_t*)(flash_address + i*4));
    }
    
    // 验证数据完整性
    if (!validate_calibration(cal_data)) {
        // 加载默认校准数据
        load_default_calibration(cal_data);
    }
    */
    #endif
}

/**
 * 加载默认校准数据（工厂校准）
 * @param cal_data 校准数据缓冲区
 */
void load_default_calibration(CalibrationData* cal_data) {
    // 默认校准数据（12位ADC，3.3V参考电压）
    cal_data->point_count = 5;
    
    cal_data->adc_values[0] = 0;     cal_data->voltage_mv[0] = 0;
    cal_data->adc_values[1] = 1024;  cal_data->voltage_mv[1] = 825;   // 0.825V
    cal_data->adc_values[2] = 2048;  cal_data->voltage_mv[2] = 1650;  // 1.65V
    cal_data->adc_values[3] = 3072;  cal_data->voltage_mv[3] = 2475;  // 2.475V
    cal_data->adc_values[4] = 4095;  cal_data->voltage_mv[4] = 3300;  // 3.3V
}

/**
 * 快速校准函数 - 在运行时添加校准点
 * @param cal_data 校准数据
 * @param adc_value ADC读数
 * @param voltage_mv 对应电压值(mV)
 * @return 1-成功，0-失败
 */
uint8_t add_calibration_point(CalibrationData* cal_data, uint16_t adc_value, uint16_t voltage_mv) {
    if (!cal_data || cal_data->point_count >= MAX_CALIBRATION_POINTS) {
        return 0;
    }
    
    // 插入排序，保持ADC值单调递增
    uint8_t insert_pos = cal_data->point_count;
    for (uint8_t i = 0; i < cal_data->point_count; i++) {
        if (adc_value < cal_data->adc_values[i]) {
            insert_pos = i;
            break;
        } else if (adc_value == cal_data->adc_values[i]) {
            // 更新已存在的点
            cal_data->voltage_mv[i] = voltage_mv;
            return 1;
        }
    }
    
    // 移动数据为新点腾出空间
    for (uint8_t i = cal_data->point_count; i > insert_pos; i--) {
        cal_data->adc_values[i] = cal_data->adc_values[i-1];
        cal_data->voltage_mv[i] = cal_data->voltage_mv[i-1];
    }
    
    // 插入新点
    cal_data->adc_values[insert_pos] = adc_value;
    cal_data->voltage_mv[insert_pos] = voltage_mv;
    cal_data->point_count++;
    
    return 1;
}
