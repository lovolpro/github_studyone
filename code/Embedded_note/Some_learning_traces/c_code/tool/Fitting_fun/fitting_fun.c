#include <stdio.h>
#include <stdlib.h>

// 线性拟合结构体，存储拟合结果
typedef struct {
    double slope;     // 斜率 a
    double intercept; // 截距 b
} LinearFit;

/**
 * 执行线性拟合计算 (y = ax + b)
 * @param x 输入x值数组（例如ADC读数）
 * @param y 输入y值数组（例如参考电压值）
 * @param n 数据点数量
 * @return 拟合结果结构体
 */
LinearFit perform_linear_fit(const double *x, const double *y, int n) {
    double sum_x = 0, sum_y = 0, sum_xy = 0, sum_x_squared = 0;
    LinearFit result;
    
    // 计算各项和
    for (int i = 0; i < n; i++) {
        sum_x += x[i];
        sum_y += y[i];
        sum_xy += x[i] * y[i];
        sum_x_squared += x[i] * x[i];
    }
    
    // 计算斜率和截距
    double denominator = n * sum_x_squared - sum_x * sum_x;
    if (denominator == 0) {
        // 处理垂直线的情况
        result.slope = 0;
        result.intercept = 0;
        printf("警告: 不能进行拟合，分母为零！\n");
        return result;
    }
    
    result.slope = (n * sum_xy - sum_x * sum_y) / denominator;
    result.intercept = (sum_y - result.slope * sum_x) / n;
    
    return result;
}

/**
 * 使用拟合结果将输入值转换为电压
 * @param fit 拟合结果结构体
 * @param input 输入值（如ADC读数）
 * @return 转换后的电压值
 */
double convert_to_voltage(LinearFit fit, double input) {
    return fit.slope * input + fit.intercept;
}

/**
 * 计算拟合优度 R² (决定系数)
 * @param x 输入x值数组
 * @param y 输入y值数组
 * @param n 数据点数量
 * @param fit 拟合结果结构体
 * @return R²值，范围从0到1，1表示完美拟合
 */
double calculate_r_squared(const double *x, const double *y, int n, LinearFit fit) {
    double y_mean = 0;
    for (int i = 0; i < n; i++) {
        y_mean += y[i];
    }
    y_mean /= n;
    
    double ss_total = 0, ss_residual = 0;
    for (int i = 0; i < n; i++) {
        double y_pred = fit.slope * x[i] + fit.intercept;
        ss_total += (y[i] - y_mean) * (y[i] - y_mean);
        ss_residual += (y[i] - y_pred) * (y[i] - y_pred);
    }
    
    if (ss_total == 0) {
        return 1.0; // 所有实际y值都相同
    }
    
    return 1 - (ss_residual / ss_total);
}

/**
 * 打印拟合结果信息
 * @param fit 拟合结果结构体
 */
void print_fit_results(LinearFit fit) {
    printf("拟合结果: y = %.6f * x + %.6f\n", fit.slope, fit.intercept);
}

// 示例使用
int main() {
    // ========== 这里代入您的实际数据 ==========
    // 方法1：直接修改数组数据
    double adc_readings[] = {0, 1024, 2048, 3072, 4095};        // 替换为您的ADC读数
    double real_voltages[] = {0.0, 3.0, 6.0, 9.0, 9.9};        // 替换为您的真实电压值
    
    // 方法2：如果数据很多，可以从文件读取或动态分配
    // 例如：您可以用以下方式代入更多数据点
    /*
    double adc_readings[] = {100, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000};
    double real_voltages[] = {0.5, 2.1, 4.2, 6.3, 8.4, 10.5, 12.6, 14.7, 16.8};
    */
    
    int n = sizeof(adc_readings) / sizeof(adc_readings[0]);
    
    // 执行拟合
    LinearFit fit = perform_linear_fit(adc_readings, real_voltages, n);
    
    // 打印拟合结果
    print_fit_results(fit);
    
    // 计算并打印R²
    double r_squared = calculate_r_squared(adc_readings, real_voltages, n, fit);
    printf("拟合优度 R²: %.6f\n", r_squared);
    
    // 使用拟合结果转换一些值
    printf("\n真实电压转换示例:\n");
    double test_values[] = {500, 1500, 2500, 3500};
    for (int i = 0; i < 4; i++) {
        double real_voltage = convert_to_voltage(fit, test_values[i]);
        printf("ADC读数 %.0f 对应真实电压: %.3f V\n", test_values[i], real_voltage);
    }
    
    return 0;
}

/*
===============================================================================
                            详细使用说明
===============================================================================

如何代入您自己的数据：

1. 数据准备：
   - 准备ADC读数数组：例如 {0, 512, 1024, 1536, 2048, 2560, 3072, 3584, 4095}
   - 准备对应的真实电压值：例如 {0.0, 1.5, 3.0, 4.5, 6.0, 7.5, 9.0, 10.5, 12.0}
   - 确保两个数组长度相同，且一一对应

2. 修改代码：
   替换main函数中的adc_readings和real_voltages数组

3. 实际应用示例：
   假设您有以下校准数据：
   
   ADC读数    真实电压(V)
   -------    -----------
   100        0.8
   500        2.5
   1000       5.1
   1500       7.6
   2000       10.2
   2500       12.7
   3000       15.3
   3500       17.8
   4000       20.4

   则代码应该这样写：
   
   double adc_readings[] = {100, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000};
   double real_voltages[] = {0.8, 2.5, 5.1, 7.6, 10.2, 12.7, 15.3, 17.8, 20.4};

4. 使用拟合结果：
   拟合完成后，您可以使用convert_to_voltage()函数将任意ADC读数转换为真实电压：
   
   double voltage = convert_to_voltage(fit, 1234);  // 将ADC读数1234转换为电压
   
5. 评估拟合质量：
   - R² 接近 1.0 表示拟合效果好
   - R² 小于 0.9 建议检查数据或考虑非线性拟合

===============================================================================
*/
