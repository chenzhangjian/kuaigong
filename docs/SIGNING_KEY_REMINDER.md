# 重要提醒：签名密钥备份

## 签名文件位置
```
/workspace/projects/client/android/app/release.p12
```

## 签名信息
| 项目 | 值 |
|------|-----|
| 文件格式 | PKCS12 (.p12) |
| 别名 (Key Alias) | kuaigong |
| 密码 (Password) | Kuaigong2024! |
| 有效期 | 10年 |
| 持有人 | 徐州昊呈电子商务 |

## 警告

### 必须备份！
- **签名密钥丢失将无法更新应用！**
- 如果丢失密钥，只能重新创建应用，用户需要重新下载

### 如何备份
```bash
# 复制到安全位置
cp android/app/release.p12 ~/secure-backup/kuaigong-release.p12

# 导出公钥证书（用于华为市场）
openssl pkcs12 -in android/app/release.p12 -nokeys -out release.der -password pass:Kuaigong2024!
```

### 不要做的事
- ❌ 不要上传到GitHub
- ❌ 不要通过微信/QQ发送
- ❌ 不要放在项目目录中（已添加到.gitignore）
- ❌ 不要删除原始文件

## 建议
1. 备份到U盘
2. 备份到云盘（加密后）
3. 备份到公司服务器
4. 记录密码到密码管理器
