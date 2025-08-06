#include <stdio.h>
#include <string.h>

// 学生信息结构体定义
typedef struct {
    char name[50]; // 学生姓名
    char id[20];   // 学生学号
    float score;   // 学生成绩
} Student;

// 添加学生信息
void add_student(Student* students, int* count)
{
    // 实现添加学生信息的逻辑
    if (*count < 100) { // 假设最多存储100个学生
        printf("请输入学生姓名: ");
        scanf("%s", students[*count].name);
        printf("请输入学生学号: ");
        scanf("%s", students[*count].id);
        printf("请输入学生成绩: ");
        scanf("%f", &students[*count].score);
        (*count)++;
        printf("学生信息添加成功!\n");
    }
    else {
        printf("学生信息已满，无法添加更多学生。\n");
    }
}

// 删除学生信息
void delete_student(Student* students, int* count)
{
    // 实现删除学生信息的逻辑
    if (*count > 0) {
        char id[20];
        printf("请输入要删除的学生学号: ");
        scanf("%s", id);
        for (int i = 0; i < *count; i++) {
            if (strcmp(students[i].id, id) == 0) {
                // 找到学生，进行删除
                for (int j = i; j < *count - 1; j++) {
                    students[j] = students[j + 1];
                }
                (*count)--;
                printf("学生信息删除成功!\n");
                return;
            }
        }
        printf("未找到该学号的学生。\n");
    }
    else {
        printf("没有学生信息可供删除。\n");
    }
}

// 修改学生信息
void modify_student(Student* students, int count)
{
    // 实现修改学生信息的逻辑
    if (count > 0) {
        char id[20];
        printf("请输入要修改的学生学号: ");
        scanf("%s", id);
        for (int i = 0; i < count; i++) {
            if (strcmp(students[i].id, id) == 0) {
                printf("请输入新的学生姓名: ");
                scanf("%s", students[i].name);
                printf("请输入新的学生成绩: ");
                scanf("%f", &students[i].score);
                printf("学生信息修改成功!\n");
                return;
            }
        }
        printf("未找到该学号的学生。\n");
    }
    else {
        printf("没有学生信息可供修改。\n");
    }
}

// 查询学生信息
void query_student(Student* students, int count)
{
    if (count > 0) {
        char id[20];
        printf("请输入要查询的学生学号: ");
        scanf("%s", id);
        for (int i = 0; i < count; i++) {
            if (strcmp(students[i].id, id) == 0) {
                printf("学生姓名: %s\n", students[i].name);
                printf("学生学号: %s\n", students[i].id);
                printf("学生成绩: %.2f\n", students[i].score);
                return;
            }
        }
        printf("未找到该学号的学生。\n");
    }
    else {
        printf("没有学生信息可供查询。\n");
    }
}

// 显示所有学生信息
void list_students(Student* students, int count)
{
    if (count > 0) {
        printf("学生信息列表:\n");
        for (int i = 0; i < count; i++) {
            printf("姓名: %s, 学号: %s, 成绩: %.2f\n",
                students[i].name, students[i].id, students[i].score);
        }
    }
    else {
        printf("没有学生信息可供显示。\n");
    }
}

// 保存数据到文件
void save_students(Student* students, int count, const char* filename)
{
    FILE* file = fopen(filename, "w");
    if (file == NULL) {
        printf("无法打开文件 %s 进行写入。\n", filename);
        return;
    }
    // 写入表头
    fprintf(file, "姓名 学号 成绩\n");
    for (int i = 0; i < count; i++) {
        fprintf(file, "%s %s %.2f\n", students[i].name, students[i].id, students[i].score);
    }
    fclose(file);
    printf("学生信息已保存到文件 %s。\n", filename);
}

// 从文件加载数据
int load_students(Student* students, int* count, const char* filename)
{
    FILE* file = fopen(filename, "r");
    if (file == NULL) {
        printf("无法打开文件 %s 进行读取。\n", filename);
        return 0;
    }
    *count = 0;
    // 跳过表头行
    char header[128];
    fgets(header, sizeof(header), file);
    while (fscanf(file, "%s %s %f", students[*count].name, students[*count].id, &students[*count].score) == 3) {
        (*count)++;
        if (*count >= 100) break; // 假设最多存储100个学生
    }
    fclose(file);
    printf("学生信息已从文件 %s 加载。\n", filename);
    return *count;
}

// 菜单显示与选择
void menu()
{
    printf("学生成绩管理系统\n");
    printf("1. 添加学生信息\n");
    printf("2. 删除学生信息\n");
    printf("3. 查询学生信息\n");
    printf("4. 修改学生信息\n");
    printf("5. 显示所有学生信息\n");
    printf("6. 保存学生信息到文件\n");
    printf("7. 从文件加载学生信息\n");
    printf("0. 退出系统\n");
    printf("请选择操作: ");
}

int main()
{
    Student students[100];
    int count = 0;
    int running = 1;
    int choice;
    char filename[100] = "students.txt";
    char savefile[100];
    char loadfile[100];
    while (running) {
        menu();
        if (scanf("%d", &choice) != 1) {
            printf("输入无效，请输入数字。\n");
            // 清空输入缓冲区
            int c;
            while ((c = getchar()) != '\n' && c != EOF);
            continue;
        }
        // 清空输入缓冲区
        int c;
        while ((c = getchar()) != '\n' && c != EOF);
        switch (choice) {
        case 1:
            add_student(students, &count);
            break;
        case 2:
            delete_student(students, &count);
            break;
        case 3:
            query_student(students, count);
            break;
        case 4:
            modify_student(students, count);
            break;
        case 5:
            list_students(students, count);
            break;
        case 6:
            printf("请输入要保存的文件名(默认: students.txt): ");
            if (fgets(savefile, sizeof(savefile), stdin)) {
                // 去除换行符
                size_t len = strlen(savefile);
                if (len > 0 && savefile[len - 1] == '\n') savefile[len - 1] = '\0';
                if (savefile[0] != '\0') {
                    strcpy(filename, savefile);
                }
            }
            save_students(students, count, filename);
            break;
        case 7:
            printf("请输入要加载的文件名(默认: students.txt): ");
            if (fgets(loadfile, sizeof(loadfile), stdin)) {
                size_t len = strlen(loadfile);
                if (len > 0 && loadfile[len - 1] == '\n') loadfile[len - 1] = '\0';
                if (loadfile[0] != '\0') {
                    strcpy(filename, loadfile);
                }
            }
            load_students(students, &count, filename);
            break;
        case 0:
            printf("感谢使用学生成绩管理系统，再见！\n");
            running = 0;
            break;
        default:
            printf("无效的选择，请重新输入。\n");
            break;
        }
        printf("\n");
    }
    return 0;
}
