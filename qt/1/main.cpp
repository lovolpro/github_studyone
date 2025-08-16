#include "mainwindow.h"
#include <QApplication>
#include <QStyleFactory>
#include <QDir>

int main(int argc, char* argv[])
{
    QApplication a(argc, argv);

    // 设置应用程序属性
    a.setApplicationName("智能科学计算器");
    a.setApplicationVersion("2.0");
    a.setOrganizationName("Calculator Pro");

    // 启用高DPI支持
    a.setAttribute(Qt::AA_EnableHighDpiScaling);
    a.setAttribute(Qt::AA_UseHighDpiPixmaps);

    // 设置全局字体
    QFont globalFont("Segoe UI", 10);
    a.setFont(globalFont);

    MainWindow w;
    w.show();

    return a.exec();
}
