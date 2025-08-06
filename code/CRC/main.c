#include <stdio.h>
#include <string.h>

#define POLYNOMIAL 0x1021  // CRC-16-CCITT
#define INIT_CRC   0xFFFF

unsigned short crc16(const unsigned char* data, size_t len)
{
    unsigned short crc = INIT_CRC;
    for (size_t i = 0; i < len; i++) {
        crc ^= (data[i] << 8);
        for (int j = 0; j < 8; j++) {
            if (crc & 0x8000)
                crc = (crc << 1) ^ POLYNOMIAL;
            else
                crc <<= 1;
        }
    }
    return crc;
}

int main()
{
    char input[256];
    printf("[发送方] 请输入字符串：");
    fgets(input, sizeof(input), stdin);
    size_t len = strlen(input);
    if (input[len - 1] == '\n') input[len - 1] = '\0'; // 去除换行
    len = strlen(input);

    // 发送方计算 CRC
    unsigned short send_crc = crc16((unsigned char*)input, len);
    printf("[发送方] 原始数据: %s\n", input);
    printf("[发送方] 计算得到 CRC16-CCITT 校验值: 0x%04X\n", send_crc);

    // 模拟数据和 CRC 一起发送
    printf("\n[接收方] 接收到数据: %s\n", input);
    printf("[接收方] 接收到 CRC 校验值: 0x%04X\n", send_crc);

    // 接收方重新计算 CRC
    unsigned short recv_crc = crc16((unsigned char*)input, len);
    printf("[接收方] 重新计算 CRC16-CCITT 校验值: 0x%04X\n", recv_crc);

    // 验证 CRC
    if (recv_crc == send_crc) {
        printf("[接收方] CRC 校验通过，数据完整！\n");
    }
    else {
        printf("[接收方] CRC 校验失败，数据可能被篡改！\n");
    }
    return 0;
}
