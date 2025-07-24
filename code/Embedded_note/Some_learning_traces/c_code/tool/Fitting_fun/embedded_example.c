#include "embedded_fitting.h"
#include <stdio.h>

// 嵌入式系统使用示例
int main() {
    printf("=== 嵌入式ADC校准系统示例 ===\n\n");
    
    // 1. 创建校准数据结构
    CalibrationData cal_data = {0};
    
    // 2. 方法一：加载默认校准数据
    load_default_calibration(&cal_data);
    printf("加载默认校准数据，校准点数：%d\n", cal_data.point_count);
    
    // 3. 方法二：手动添加校准点
    /*
    add_calibration_point(&cal_data, 0, 0);        // 0V
    add_calibration_point(&cal_data, 1024, 3300);  // 3.3V (假设分压比1:4)
    add_calibration_point(&cal_data, 2048, 6600);  // 6.6V
    add_calibration_point(&cal_data, 3072, 9900);  // 9.9V
    add_calibration_point(&cal_data, 4095, 13200); // 13.2V
    */
    
    // 4. 验证校准数据
    if (!validate_calibration(&cal_data)) {
        printf("错误：校准数据无效！\n");
        return -1;
    }
    
    // 5. 执行拟合
    EmbeddedLinearFit fit = embedded_linear_fit(&cal_data);
    if (!fit.is_valid) {
        printf("错误：拟合失败！\n");
        return -1;
    }
    
    printf("拟合成功！\n");
    printf("斜率(scaled): %ld\n", fit.slope_scaled);
    printf("截距(scaled): %ld\n", fit.intercept_scaled);
    
    // 6. 测试电压转换
    printf("\n=== 电压转换测试 ===\n");
    uint16_t test_adc[] = {500, 1000, 1500, 2000, 2500, 3000, 3500};
    for (int i = 0; i < 7; i++) {
        uint16_t voltage = adc_to_voltage_mv(&fit, test_adc[i]);
        printf("ADC: %4d -> 电压: %4d mV (%.3f V)\n", 
               test_adc[i], voltage, voltage/1000.0);
    }
    
    // 7. 存储校准数据到Flash（在实际系统中使用）
    // store_calibration_to_flash(&cal_data);
    
    return 0;
}

/*
=== 在实际嵌入式项目中的集成步骤 ===

1. 文件集成：
   - 将 embedded_fitting.h 和 embedded_fitting.c 添加到您的项目中
   - 在需要使用的文件中 #include "embedded_fitting.h"

2. 配置参数：
   - 根据您的MCU内存情况调整 MAX_CALIBRATION_POINTS
   - 根据精度需求调整 VOLTAGE_PRECISION

3. Flash存储配置：
   - 在 embedded_fitting.c 中实现 store_calibration_to_flash() 和 load_calibration_from_flash()
   - 定义Flash地址和扇区

4. 初始化代码（在main函数或初始化函数中）：
   ```c
   static CalibrationData g_cal_data;
   static EmbeddedLinearFit g_voltage_fit;
   
   void voltage_calibration_init(void) {
       // 从Flash加载校准数据
       load_calibration_from_flash(&g_cal_data);
       
       // 执行拟合
       g_voltage_fit = embedded_linear_fit(&g_cal_data);
       
       if (!g_voltage_fit.is_valid) {
           // 拟合失败，使用默认校准
           load_default_calibration(&g_cal_data);
           g_voltage_fit = embedded_linear_fit(&g_cal_data);
       }
   }
   ```

5. 使用示例（在ADC读取函数中）：
   ```c
   uint16_t read_voltage_mv(void) {
       uint16_t adc_value = HAL_ADC_GetValue(&hadc1); // STM32示例
       return adc_to_voltage_mv(&g_voltage_fit, adc_value);
   }
   ```

6. 校准过程（通过串口或其他接口）：
   ```c
   void calibration_process(uint16_t adc_reading, uint16_t reference_voltage_mv) {
       add_calibration_point(&g_cal_data, adc_reading, reference_voltage_mv);
       g_voltage_fit = embedded_linear_fit(&g_cal_data);
       store_calibration_to_flash(&g_cal_data);
   }
   ```

=== 优化特点 ===
- 避免浮点运算，适合没有FPU的MCU
- 使用定点数提高计算精度
- 内存占用小，适合资源受限的系统
- 支持Flash存储，掉电不丢失校准数据
- 支持运行时动态添加校准点
*/
