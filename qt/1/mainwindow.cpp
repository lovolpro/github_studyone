#include "mainwindow.h"
#include "./ui_mainwindow.h"
#include <QMessageBox>
#include <QDebug>
#include <QtMath>
#include <QRegularExpression>
#include <QKeyEvent>
#include <QApplication>
#include <stdexcept>
#include <QPropertyAnimation>
#include <QGraphicsOpacityEffect>
#include <QTimer>
#include <cmath>

MainWindow::MainWindow(QWidget* parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
    , currentNumber("0")
    , displayText("")
    , lastResult(0.0)
    , waitingForOperand(true)
    , hasResult(false)
    , isAngleInDegrees(true)  // 默认使用度数
    , displayAnimation(nullptr)
    , opacityEffect(nullptr)
    , memoryValue(0.0)        // 初始化内存值
    , hasMemoryValue(false)   // 初始化内存状态
    , parenthesesCount(0)     // 初始化括号计数
{
    ui->setupUi(this);

    // 设置界面样式
    setupUIStyles();

    // 设置显示器的初始状态
    ui->textBrowser->setPlainText("0");
    ui->textBrowser->setAlignment(Qt::AlignRight);

    // 设置窗口标题
    setWindowTitle("🧮 智能科学计算器 v3.0");

    // 设置焦点策略，允许接收键盘事件
    setFocusPolicy(Qt::StrongFocus);

    // 设置窗口图标和属性
    setFixedSize(650, 800); // 调整窗口大小以适应新按钮

    // 初始化动画效果
    opacityEffect = new QGraphicsOpacityEffect(this);
    ui->textBrowser->setGraphicsEffect(opacityEffect);

    displayAnimation = new QPropertyAnimation(opacityEffect, "opacity", this);
    displayAnimation->setDuration(200);

    // 连接新按钮的信号槽
    connect(ui->pushButton_MC, &QPushButton::clicked, this, &MainWindow::memoryClear);
    connect(ui->pushButton_MR, &QPushButton::clicked, this, &MainWindow::memoryRecall);
    connect(ui->pushButton_M_plus, &QPushButton::clicked, this, &MainWindow::memoryAdd);
    connect(ui->pushButton_M_minus, &QPushButton::clicked, this, &MainWindow::memorySubtract);
    connect(ui->pushButton_MS, &QPushButton::clicked, this, &MainWindow::memoryStore);
    connect(ui->pushButton_history, &QPushButton::clicked, this, &MainWindow::showHistory);
}


MainWindow::~MainWindow()
{
    delete ui;
}

// 数字按钮槽函数
void MainWindow::on_pushButton_28_clicked() { digitClicked("7"); }
void MainWindow::on_pushButton_31_clicked() { digitClicked("8"); }
void MainWindow::on_pushButton_30_clicked() { digitClicked("9"); }
void MainWindow::on_pushButton_33_clicked() { digitClicked("4"); }
void MainWindow::on_pushButton_35_clicked() { digitClicked("5"); }
void MainWindow::on_pushButton_34_clicked() { digitClicked("6"); }
void MainWindow::on_pushButton_37_clicked() { digitClicked("1"); }
void MainWindow::on_pushButton_39_clicked() { digitClicked("2"); }
void MainWindow::on_pushButton_38_clicked() { digitClicked("3"); }
void MainWindow::on_pushButton_43_clicked() { digitClicked("0"); }

void MainWindow::on_pushButton_42_clicked()
{
    if (hasResult && waitingForOperand) {
        // 如果刚计算完结果，开始新的小数
        currentNumber = "0.";
        hasResult = false;
    }
    else if (waitingForOperand || currentNumber.isEmpty() || currentNumber == "0") {
        currentNumber = "0.";
    }
    else if (!currentNumber.contains('.')) {
        currentNumber += ".";
    }
    waitingForOperand = false;
    updateDisplay();
}

// 运算符按钮槽函数
void MainWindow::on_pushButton_36_clicked() { operatorClicked("+"); }
void MainWindow::on_pushButton_32_clicked() { operatorClicked("-"); }
void MainWindow::on_pushButton_27_clicked() { operatorClicked("*"); }
void MainWindow::on_pushButton_26_clicked() { operatorClicked("/"); }

// x² 按钮
void MainWindow::on_pushButton_18_clicked()
{
    if (!currentNumber.isEmpty()) {
        double value = currentNumber.toDouble();
        double result = calculateSquare(value);
        currentNumber = formatNumber(result);
        waitingForOperand = true;
        hasResult = true;
        updateDisplay();
    }
}

// √x 按钮
void MainWindow::on_pushButton_20_clicked()
{
    if (!currentNumber.isEmpty()) {
        double value = currentNumber.toDouble();
        if (value < 0) {
            showErrorMessage("无法计算负数的平方根");
            return;
        }
        double result = calculateSquareRoot(value);
        currentNumber = formatNumber(result);
        waitingForOperand = true;
        hasResult = true;
        updateDisplay();
    }
}

void MainWindow::on_pushButton_40_clicked()
{
    calculate();
}

// 功能按钮槽函数
void MainWindow::on_pushButton_17_clicked() { clearAll(); }
void MainWindow::on_pushButton_23_clicked() { backspace(); }

void MainWindow::on_pushButton_41_clicked()
{
    if (waitingForOperand && hasResult) {
        // 如果是结果状态，直接改变符号
        if (currentNumber.startsWith("-")) {
            currentNumber = currentNumber.mid(1);
        }
        else {
            currentNumber = "-" + currentNumber;
        }
    }
    else if (!currentNumber.isEmpty() && currentNumber != "0") {
        if (currentNumber.startsWith("-")) {
            currentNumber = currentNumber.mid(1);
        }
        else {
            currentNumber = "-" + currentNumber;
        }
    }
    updateDisplay();
}

// 数学函数槽函数
void MainWindow::on_pushButton_19_clicked()
{
    if (!currentNumber.isEmpty()) {
        double value = currentNumber.toDouble();
        if (value <= 0) {
            showErrorMessage("自然对数的参数必须大于0");
            return;
        }
        double result = calculateNaturalLog(value);
        currentNumber = formatNumber(result);
        waitingForOperand = true;
        hasResult = true;
        updateDisplay();
    }
}

void MainWindow::on_pushButton_22_clicked()
{
    if (!currentNumber.isEmpty()) {
        double value = currentNumber.toDouble();
        if (value <= 0) {
            showErrorMessage("常用对数的参数必须大于0");
            return;
        }
        double result = calculateLog10(value);
        currentNumber = formatNumber(result);
        waitingForOperand = true;
        hasResult = true;
        updateDisplay();
    }
}

void MainWindow::on_pushButton_21_clicked()
{
    if (!currentNumber.isEmpty()) {
        double value = currentNumber.toDouble();
        int intValue = static_cast<int>(value);
        if (value != intValue || intValue < 0 || intValue > 20) {
            showErrorMessage("阶乘只能计算0-20之间的非负整数");
            return;
        }
        double result = calculateFactorial(intValue);
        currentNumber = formatNumber(result);
        waitingForOperand = true;
        hasResult = true;
        updateDisplay();
    }
}

// 辅助函数实现
void MainWindow::digitClicked(const QString& digit)
{
    if (hasResult && waitingForOperand) {
        // 如果刚计算完结果，开始新的输入
        currentNumber = digit;
        hasResult = false;
        waitingForOperand = false;
    }
    else if (waitingForOperand || currentNumber == "0") {
        currentNumber = digit;
        waitingForOperand = false;
    }
    else {
        // 限制数字长度，防止显示溢出
        if (currentNumber.length() < 15) {
            currentNumber += digit;
        }
    }
    updateDisplay();
}

void MainWindow::operatorClicked(const QString& op)
{
    if (!waitingForOperand && !hasResult && !lastOperator.isEmpty()) {
        // 连续运算：先计算之前的结果
        calculate();
        if (!currentNumber.isEmpty()) {
            displayText = currentNumber + " " + op + " ";
            lastOperator = op;
            waitingForOperand = true;
        }
    }
    else {
        lastOperator = op;
        displayText = currentNumber + " " + op + " ";
        waitingForOperand = true;
        hasResult = false;
    }
    updateDisplay();
}

void MainWindow::calculate()
{
    if (lastOperator.isEmpty() || waitingForOperand) {
        return;
    }

    QString expression = displayText + currentNumber;
    double result = evaluateExpression(expression);

    if (qIsInf(result) || qIsNaN(result)) {
        showErrorMessage("计算错误或除零错误");
        clearAll();
        return;
    }

    // 添加到历史记录
    addToHistory(expression + " = " + formatNumber(result));

    currentNumber = formatNumber(result);
    displayText = "";
    lastOperator.clear();
    waitingForOperand = true;
    hasResult = true;
    lastResult = result;

    // 添加结果动画效果
    animateResult();

    updateDisplay();
}

void MainWindow::updateDisplay()
{
    QString displayString;

    if (hasResult && waitingForOperand && displayText.isEmpty()) {
        // 显示最终结果，添加特殊格式
        displayString = "= " + currentNumber;
    }
    else if (!displayText.isEmpty() && !waitingForOperand) {
        // 显示完整的表达式（包括当前输入）
        displayString = displayText + currentNumber;
    }
    else if (!displayText.isEmpty()) {
        // 显示表达式（等待输入）
        displayString = displayText + "_";  // 添加光标效果
    }
    else {
        // 显示当前数字
        displayString = currentNumber;
    }

    ui->textBrowser->setPlainText(displayString);

    // 在标签中显示历史记录的最后一项，使用更美观的格式
    if (!calculationHistory.isEmpty()) {
        ui->label->setText("📊 " + calculationHistory.last());
    }
    else {
        ui->label->setText("🎯 准备开始计算...");
    }
}


void MainWindow::clearAll()
{
    currentNumber = "0";
    displayText.clear();
    lastOperator.clear();
    lastResult = 0.0;
    waitingForOperand = true;
    hasResult = false;
    ui->label->setText("🎯 准备开始计算..."); // 清除历史显示
    updateDisplay();
}

void MainWindow::clearEntry()
{
    currentNumber = "0";
    waitingForOperand = true;
    updateDisplay();
}

void MainWindow::backspace()
{
    if (!waitingForOperand && currentNumber.length() > 1) {
        currentNumber.chop(1);
        if (currentNumber.isEmpty() || currentNumber == "-") {
            currentNumber = "0";
            waitingForOperand = true;
        }
        updateDisplay();
    }
    else if (!waitingForOperand) {
        currentNumber = "0";
        waitingForOperand = true;
        updateDisplay();
    }
}

double MainWindow::evaluateExpression(const QString& expression)
{
    // 简化的表达式求值器
    QStringList tokens = expression.split(' ', Qt::SkipEmptyParts);

    if (tokens.size() != 3) {
        return currentNumber.toDouble();
    }

    double operand1 = tokens[0].toDouble();
    QString op = tokens[1];
    double operand2 = tokens[2].toDouble();

    if (op == "+") {
        return operand1 + operand2;
    }
    else if (op == "-") {
        return operand1 - operand2;
    }
    else if (op == "*") {
        return operand1 * operand2;
    }
    else if (op == "/") {
        if (qFabs(operand2) < 1e-10) {
            return qInf();
        }
        return operand1 / operand2;
    }
    else if (op == "%") {
        if (qFabs(operand2) < 1e-10) {
            return qInf();
        }
        return fmod(operand1, operand2);
    }

    return 0.0;
}

int MainWindow::precedence(const QString& op)
{
    if (op == "+" || op == "-") return 1;
    if (op == "*" || op == "/" || op == "%") return 2;
    return 0;
}

bool MainWindow::isOperator(const QString& str)
{
    return (str == "+" || str == "-" || str == "*" || str == "/" || str == "%");
}

// 新增的辅助函数
QString MainWindow::formatNumber(double number)
{
    // 格式化数字显示，避免科学计数法对于常见数值
    if (qAbs(number) < 1e-10) {
        return "0";
    }

    if (qAbs(number) >= 1e10 || (qAbs(number) < 1e-6 && qAbs(number) > 0)) {
        return QString::number(number, 'e', 6);
    }

    QString result = QString::number(number, 'f', 10);

    // 移除末尾的零和小数点
    if (result.contains('.')) {
        while (result.endsWith('0')) {
            result.chop(1);
        }
        if (result.endsWith('.')) {
            result.chop(1);
        }
    }

    return result;
}

void MainWindow::addToHistory(const QString& calculation)
{
    calculationHistory.append(calculation);

    // 保持历史记录在合理范围内
    if (calculationHistory.size() > 10) {
        calculationHistory.removeFirst();
    }
}

void MainWindow::showErrorMessage(const QString& message)
{
    QMessageBox msgBox;
    msgBox.setWindowTitle("⚠️ 计算器错误");
    msgBox.setText("❌ " + message);
    msgBox.setIcon(QMessageBox::Warning);
    msgBox.setStyleSheet(R"(
        QMessageBox {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #667eea, stop:1 #764ba2);
            color: white;
            font-family: 'Segoe UI', sans-serif;
            font-size: 14px;
        }
        QMessageBox QPushButton {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #e74c3c, stop:1 #c0392b);
            border: 2px solid #c0392b;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            padding: 8px 16px;
            min-width: 80px;
        }
        QMessageBox QPushButton:hover {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #ec7063, stop:1 #e74c3c);
        }
    )");
    msgBox.exec();
}

double MainWindow::performTrigFunction(double value, const QString& function)
{
    double radianValue = isAngleInDegrees ? qDegreesToRadians(value) : value;

    if (function == "sin") {
        return qSin(radianValue);
    }
    else if (function == "cos") {
        return qCos(radianValue);
    }
    else if (function == "tan") {
        // 检查tan函数的定义域
        double cosValue = qCos(radianValue);
        if (qAbs(cosValue) < 1e-10) {
            throw std::runtime_error("tan function undefined");
        }
        return qTan(radianValue);
    }

    return 0.0;
}

// 键盘事件处理
void MainWindow::keyPressEvent(QKeyEvent* event)
{
    switch (event->key()) {
        // 数字键
    case Qt::Key_0:
        digitClicked("0");
        break;
    case Qt::Key_1:
        digitClicked("1");
        break;
    case Qt::Key_2:
        digitClicked("2");
        break;
    case Qt::Key_3:
        digitClicked("3");
        break;
    case Qt::Key_4:
        digitClicked("4");
        break;
    case Qt::Key_5:
        digitClicked("5");
        break;
    case Qt::Key_6:
        digitClicked("6");
        break;
    case Qt::Key_7:
        digitClicked("7");
        break;
    case Qt::Key_8:
        digitClicked("8");
        break;
    case Qt::Key_9:
        digitClicked("9");
        break;

        // 运算符
    case Qt::Key_Plus:
        operatorClicked("+");
        break;
    case Qt::Key_Minus:
        operatorClicked("-");
        break;
    case Qt::Key_Asterisk:
        operatorClicked("*");
        break;
    case Qt::Key_Slash:
        operatorClicked("/");
        break;
    case Qt::Key_Percent:
        operatorClicked("%");
        break;

        // 功能键
    case Qt::Key_Return:
    case Qt::Key_Enter:
    case Qt::Key_Equal:
        calculate();
        break;
    case Qt::Key_Period:
    case Qt::Key_Comma:
        on_pushButton_42_clicked(); // 小数点
        break;
    case Qt::Key_Backspace:
        backspace();
        break;
    case Qt::Key_Delete:
        clearEntry();
        break;
    case Qt::Key_Escape:
        clearAll();
        break;

    default:
        QMainWindow::keyPressEvent(event);
        break;
    }
}

// 设置界面样式
void MainWindow::setupUIStyles()
{
    // 设置整体应用程序样式 - 优雅紫色主题
    QString mainStyle = R"(
        QMainWindow {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #667eea, stop:1 #764ba2);
        }

        QWidget {
            background-color: transparent;
        }

        /* 显示器样式 - 深色优雅 */
        QTextBrowser {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                        stop:0 #2c3e50, stop:1 #34495e);
            border: 3px solid #3498db;
            border-radius: 15px;
            color: #ecf0f1;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 28px;
            font-weight: bold;
            padding: 15px;
            selection-background-color: #3498db;
            text-align: right;
        }

        /* 历史记录标签样式 */
        QLabel {
            color: white;
            font-family: 'Segoe UI', sans-serif;
            font-size: 12px;
            font-weight: 500;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 8px;
            padding: 5px 10px;
            margin: 2px;
        }
    )";

    // 数字按钮样式 - 优雅蓝色渐变
    QString numberButtonStyle = R"(
        QPushButton {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #3498db, stop:1 #2980b9);
            border: 2px solid #2980b9;
            border-radius: 12px;
            color: white;
            font-family: 'Segoe UI', sans-serif;
            font-size: 18px;
            font-weight: bold;
            min-width: 80px;
            min-height: 60px;
        }
        QPushButton:hover {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #5dade2, stop:1 #3498db);
            border: 2px solid #3498db;
            transform: scale(1.05);
        }
        QPushButton:pressed {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #2980b9, stop:1 #1f618d);
            border: 2px solid #1f618d;
        }
    )";

    // 运算符按钮样式 - 温暖橙色渐变
    QString operatorButtonStyle = R"(
        QPushButton {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #e67e22, stop:1 #d35400);
            border: 2px solid #d35400;
            border-radius: 12px;
            color: white;
            font-family: 'Segoe UI', sans-serif;
            font-size: 20px;
            font-weight: bold;
            min-width: 80px;
            min-height: 60px;
        }
        QPushButton:hover {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #f39c12, stop:1 #e67e22);
            border: 2px solid #e67e22;
            transform: scale(1.05);
        }
        QPushButton:pressed {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #d35400, stop:1 #a04000);
            border: 2px solid #a04000;
        }
    )";

    // 功能按钮样式 - 清新绿色渐变
    QString functionButtonStyle = R"(
        QPushButton {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #27ae60, stop:1 #229954);
            border: 2px solid #229954;
            border-radius: 12px;
            color: white;
            font-family: 'Segoe UI', sans-serif;
            font-size: 16px;
            font-weight: bold;
            min-width: 80px;
            min-height: 60px;
        }
        QPushButton:hover {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #58d68d, stop:1 #27ae60);
            border: 2px solid #27ae60;
            transform: scale(1.05);
        }
        QPushButton:pressed {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #229954, stop:1 #1e8449);
            border: 2px solid #1e8449;
        }
    )";

    // 等号按钮特殊样式 - 亮丽青色渐变
    QString equalsButtonStyle = R"(
        QPushButton {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #1abc9c, stop:1 #16a085);
            border: 3px solid #16a085;
            border-radius: 15px;
            color: white;
            font-family: 'Segoe UI', sans-serif;
            font-size: 24px;
            font-weight: bold;
            min-width: 80px;
            min-height: 60px;
        }
        QPushButton:hover {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #48c9b0, stop:1 #1abc9c);
            border: 3px solid #1abc9c;
            transform: scale(1.08);
        }
        QPushButton:pressed {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #16a085, stop:1 #138d75);
            border: 3px solid #138d75;
        }
    )";

    // 应用样式到各个按钮组
    this->setStyleSheet(mainStyle);

    // 数字按钮 (0-9, .)
    QList<QPushButton*> numberButtons = {
        ui->pushButton_43, // 0
        ui->pushButton_37, ui->pushButton_39, ui->pushButton_38, // 1,2,3
        ui->pushButton_33, ui->pushButton_35, ui->pushButton_34, // 4,5,6
        ui->pushButton_28, ui->pushButton_31, ui->pushButton_30, // 7,8,9
        ui->pushButton_42  // .
    };
    for (auto* btn : numberButtons) {
        btn->setStyleSheet(numberButtonStyle);
    }

    // 运算符按钮 (+, -, *, /)
    QList<QPushButton*> operatorButtons = {
        ui->pushButton_36, // +
        ui->pushButton_32, // -
        ui->pushButton_27, // *
        ui->pushButton_26  // /
    };
    for (auto* btn : operatorButtons) {
        btn->setStyleSheet(operatorButtonStyle);
    }

    // 功能按钮 (C, Delete, +/-, 数学函数)
    QList<QPushButton*> functionButtons = {
        ui->pushButton_17, // C
        ui->pushButton_23, // Delete
        ui->pushButton_41, // +/-
        ui->pushButton_18, // x²
        ui->pushButton_20, // √x
        ui->pushButton_19, // ln
        ui->pushButton_22, // log
        ui->pushButton_21  // n!
    };
    for (auto* btn : functionButtons) {
        btn->setStyleSheet(functionButtonStyle);
    }

    // 内存按钮样式 - 紫色主题
    QString memoryButtonStyle = R"(
        QPushButton {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #8e44ad, stop:1 #9b59b6);
            border: 2px solid #8e44ad;
            border-radius: 8px;
            color: white;
            font-family: 'Segoe UI', sans-serif;
            font-size: 14px;
            font-weight: bold;
            min-width: 80px;
            min-height: 40px;
        }
        QPushButton:hover {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #a569bd, stop:1 #bb8fce);
            border: 2px solid #9b59b6;
            transform: scale(1.03);
        }
        QPushButton:pressed {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #7d3c98, stop:1 #8e44ad);
            border: 2px solid #7d3c98;
        }
    )";

    // 内存按钮
    QList<QPushButton*> memoryButtons = {
        ui->pushButton_MC,      // MC
        ui->pushButton_MR,      // MR
        ui->pushButton_M_plus,  // M+
        ui->pushButton_M_minus, // M-
        ui->pushButton_MS,      // MS
        ui->pushButton_history  // 历史
    };
    for (auto* btn : memoryButtons) {
        btn->setStyleSheet(memoryButtonStyle);
    }

    // 等号按钮特殊处理
    ui->pushButton_40->setStyleSheet(equalsButtonStyle);
}

// 结果动画效果
void MainWindow::animateResult()
{
    if (displayAnimation && opacityEffect) {
        displayAnimation->setStartValue(0.3);
        displayAnimation->setEndValue(1.0);
        displayAnimation->start();
    }
}

// 新增功能实现
void MainWindow::memoryStore()
{
    if (!currentNumber.isEmpty()) {
        memoryValue = currentNumber.toDouble();
        hasMemoryValue = true;
        ui->label->setText("💾 已存储到内存: " + formatNumber(memoryValue));
    }
}

void MainWindow::memoryRecall()
{
    if (hasMemoryValue) {
        currentNumber = formatNumber(memoryValue);
        waitingForOperand = false;
        hasResult = true;
        updateDisplay();
    }
    else {
        showErrorMessage("内存中没有存储值");
    }
}

void MainWindow::memoryAdd()
{
    if (!currentNumber.isEmpty()) {
        if (!hasMemoryValue) {
            memoryValue = 0.0;
            hasMemoryValue = true;
        }
        memoryValue += currentNumber.toDouble();
        ui->label->setText("💾 内存值已更新: " + formatNumber(memoryValue));
    }
}

void MainWindow::memorySubtract()
{
    if (!currentNumber.isEmpty()) {
        if (!hasMemoryValue) {
            memoryValue = 0.0;
            hasMemoryValue = true;
        }
        memoryValue -= currentNumber.toDouble();
        ui->label->setText("💾 内存值已更新: " + formatNumber(memoryValue));
    }
}

void MainWindow::memoryClear()
{
    memoryValue = 0.0;
    hasMemoryValue = false;
    ui->label->setText("🗑️ 内存已清除");
}

void MainWindow::toggleAngleUnit()
{
    isAngleInDegrees = !isAngleInDegrees;
    QString unit = isAngleInDegrees ? "度" : "弧度";
    ui->label->setText("📐 角度单位: " + unit);
}

void MainWindow::showHistory()
{
    if (calculationHistory.isEmpty()) {
        showErrorMessage("计算历史为空");
        return;
    }

    QString historyText = "📊 计算历史记录:\n\n";
    for (int i = calculationHistory.size() - 1; i >= 0; --i) {
        historyText += QString("%1. %2\n").arg(calculationHistory.size() - i).arg(calculationHistory[i]);
    }

    QMessageBox msgBox;
    msgBox.setWindowTitle("📊 计算历史");
    msgBox.setText(historyText);
    msgBox.setStyleSheet(R"(
        QMessageBox {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #667eea, stop:1 #764ba2);
            color: white;
            font-family: 'Segoe UI', sans-serif;
            font-size: 12px;
            min-width: 400px;
        }
        QMessageBox QPushButton {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #1abc9c, stop:1 #16a085);
            border: 2px solid #16a085;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            padding: 8px 16px;
            min-width: 80px;
        }
        QMessageBox QPushButton:hover {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #48c9b0, stop:1 #1abc9c);
        }
    )");
    msgBox.exec();
}

double MainWindow::calculateFactorial(int n)
{
    if (n < 0) return 0;
    if (n == 0 || n == 1) return 1;

    double result = 1;
    for (int i = 2; i <= n; ++i) {
        result *= i;
    }
    return result;
}

double MainWindow::calculateSquareRoot(double x)
{
    return qSqrt(x);
}

double MainWindow::calculateSquare(double x)
{
    return x * x;
}

double MainWindow::calculateNaturalLog(double x)
{
    return qLn(x);
}

double MainWindow::calculateLog10(double x)
{
    return log10(x);
}
