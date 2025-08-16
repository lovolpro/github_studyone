#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QString>
#include <QStack>
#include <QKeyEvent>
#include <QStringList>
#include <QPropertyAnimation>
#include <QGraphicsOpacityEffect>

QT_BEGIN_NAMESPACE
namespace Ui {
    class MainWindow;
}
QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    MainWindow(QWidget* parent = nullptr);
    ~MainWindow();

private slots:
    // 数字按钮
    void on_pushButton_28_clicked(); // 7
    void on_pushButton_31_clicked(); // 8
    void on_pushButton_30_clicked(); // 9
    void on_pushButton_33_clicked(); // 4
    void on_pushButton_35_clicked(); // 5
    void on_pushButton_34_clicked(); // 6
    void on_pushButton_37_clicked(); // 1
    void on_pushButton_39_clicked(); // 2
    void on_pushButton_38_clicked(); // 3
    void on_pushButton_43_clicked(); // 0
    void on_pushButton_42_clicked(); // .

    // 运算符按钮
    void on_pushButton_36_clicked(); // +
    void on_pushButton_32_clicked(); // -
    void on_pushButton_27_clicked(); // *
    void on_pushButton_26_clicked(); // /
    void on_pushButton_18_clicked(); // %
    void on_pushButton_40_clicked(); // =

    // 功能按钮
    void on_pushButton_17_clicked(); // C (清除全部)
    void on_pushButton_20_clicked(); // CE (清除当前输入)
    void on_pushButton_23_clicked(); // Delete (删除最后一个字符)
    void on_pushButton_41_clicked(); // +/- (正负号切换)

    // 三角函数按钮
    void on_pushButton_19_clicked(); // sin
    void on_pushButton_22_clicked(); // cos
    void on_pushButton_21_clicked(); // tan

protected:
    void keyPressEvent(QKeyEvent* event) override;

private:
    Ui::MainWindow* ui;
    QString currentNumber;      // 当前输入的数字
    QString displayText;        // 显示在屏幕上的完整表达式
    QString lastOperator;       // 最后一个运算符
    double lastResult;          // 最后的计算结果
    bool waitingForOperand;     // 是否等待新的操作数
    bool hasResult;             // 是否已有结果
    QStringList calculationHistory; // 计算历史记录
    bool isAngleInDegrees;      // 角度单位：true为度，false为弧度
    QPropertyAnimation* displayAnimation; // 显示动画
    QGraphicsOpacityEffect* opacityEffect; // 透明度效果

    // 新增功能变量
    double memoryValue;         // 内存存储值
    bool hasMemoryValue;        // 是否有内存值
    int parenthesesCount;       // 括号计数器

    // 辅助函数
    void digitClicked(const QString& digit);
    void operatorClicked(const QString& op);
    void calculate();
    void updateDisplay();
    void clearAll();
    void clearEntry();
    void backspace();
    double evaluateExpression(const QString& expression);
    int precedence(const QString& op);
    bool isOperator(const QString& str);
    QString formatNumber(double number);
    void addToHistory(const QString& calculation);
    void showErrorMessage(const QString& message);
    double performTrigFunction(double value, const QString& function);
    void setupUIStyles(); // 设置界面样式
    void animateResult(); // 结果动画效果

    // 新增功能函数
    void memoryStore();         // 存储到内存
    void memoryRecall();        // 从内存调用
    void memoryAdd();           // 内存加法
    void memorySubtract();      // 内存减法
    void memoryClear();         // 清除内存
    void toggleAngleUnit();     // 切换角度单位
    void showHistory();         // 显示历史记录
    double calculateFactorial(int n);  // 计算阶乘
    double calculateSquareRoot(double x); // 计算平方根
    double calculateSquare(double x);     // 计算平方
    double calculateNaturalLog(double x); // 计算自然对数
    double calculateLog10(double x);      // 计算常用对数
};
#endif // MAINWINDOW_H
