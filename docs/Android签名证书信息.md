# 快工APP Android签名证书信息

## 一、软件包名称

| 项目 | 内容 |
|------|------|
| **包名（PackageName）** | com.kuaigong.app |
| **格式** | 反域名格式 |
| **用途** | 应用唯一标识、应用商店上架、ICP备案 |

---

## 二、签名证书信息

### 2.1 证书基本信息

| 项目 | 内容 |
|------|------|
| **证书文件名** | kuaigong.keystore |
| **密钥别名（Alias）** | kuaigong |
| **证书类型** | RSA 2048-bit |
| **有效期** | 25年（9125天） |

### 2.2 证书所属信息

| 项目 | 内容 |
|------|------|
| **CN（通用名称）** | 徐州市快工科技有限公司 |
| **OU（组织单位）** | 研发部 |
| **O（组织名称）** | 徐州市快工科技有限公司 |
| **L（城市）** | 徐州市 |
| **ST（省份）** | 江苏省 |
| **C（国家）** | CN |

---

## 三、证书指纹信息

### 3.1 MD5指纹

```
MD5:  82:5D:19:DF:02:34:DE:98:50:92:14:5E:4F:B8:75:64
格式：A1:B2:C3:D4:E5:F6:G7:H8:I9:J0:K1:L2:M3:N4:O5:P6
```

**用途：**
- 微信开放平台应用签名
- 支付宝开放平台应用配置
- 部分第三方SDK接入验证

### 3.2 SHA1指纹

```
SHA1:  C1:CC:E1:5A:97:C6:69:7A:A3:06:26:D8:A9:B6:36:8B:72:AE:99:FF
格式：AA:BB:CC:DD:EE:FF:GG:HH:II:JJ:KK:LL:MM:NN:OO:PP:QQ:RR:SS:TT
```

**用途：**
- Google Play应用签名
- Firebase项目配置
- 高德地图SDK配置

### 3.3 SHA256指纹

```
SHA256:  F9:9E:15:A4:6B:EB:E3:68:06:61:C7:D1:DC:7B:7E:3A:2C:24:95:22:74:23:BF:53:3F:00:E5:0A:5E:58:4A:16
```

**用途：**
- Google Play App Signing
- 现代SDK签名验证

### 3.4 公钥

```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyX4pXAOigc8VPDxjFWUh
4efe9Y2vl31KL2trWw8WRbjV2lybvhfM/zgrk5cXi5XCzdAqmdhJPPbdxPcBGVXH
sFVw9y23uSEN8L3WD7Oy9Cytt7nLyEeqEoHy+pvXS4owu0lmKBjIWY4HBHnT69KV
1EWRMREz/vSEk9Lo/6FwYq0oIEWjYq7Qad+YXyVEHLv/5qSs4c4qEbkoVBhxzdDo
JzuKAsbCt8N1xgQHr8+aZZUYuMS80QplZ+dERCLSiGR32oiDPTfZNd++Do7HkIyQ
rYz1i+mY0wE47z4UJlj3zFkSYzfAOKu4ZoZ46AzO34AKgIkCDB5K8VJ3dgWNWXd2
XQIDAQAB
-----END PUBLIC KEY-----
```

**用途：**
- ICP备案
- 应用商店上架验证

---

## 四、生成证书步骤

### 4.1 前置条件

确保已安装 Java JDK（keytool 工具）

```bash
# 检查是否安装
java -version
keytool -help
```

### 4.2 生成证书命令

```bash
# 进入项目目录
cd /workspace/projects/client

# 执行生成命令
keytool -genkeypair -v \
  -alias kuaigong \
  -keyalg RSA \
  -keysize 2048 \
  -validity 9125 \
  -keystore kuaigong.keystore \
  -dname "CN=徐州市快工科技有限公司, OU=研发部, O=徐州市快工科技有限公司, L=徐州市, ST=江苏省, C=CN"

# 执行后会提示输入密码（请牢记）
# Enter keystore password: [输入证书库密码]
# Enter key password for <kuaigong>: [输入密钥密码，可与证书库密码相同]
```

### 4.3 查看证书信息

```bash
# 查看完整证书信息
keytool -list -v -keystore kuaigong.keystore -alias kuaigong

# 输入证书库密码后，将显示：
# - MD5 指纹
# - SHA1 指纹  
# - SHA256 指纹
# - 公钥信息
```

---

## 五、ICP备案填写示例

### 5.1 软件包名称

```
com.kuaigong.app
```

### 5.2 公钥

```
（生成证书后，从keytool输出中复制）
```

### 5.3 证书MD5指纹

```
（生成证书后，从keytool输出中复制，格式：A1:B2:C3:D4:...）
```

**注意：** 部分平台要求去掉冒号的小写格式，如：`a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

## 六、证书安全管理

### 6.1 安全注意事项

| 事项 | 说明 |
|------|------|
| ⚠️ **密码保密** | 证书密码切勿泄露，建议安全存储 |
| ⚠️ **证书备份** | 多处备份证书文件，丢失无法恢复 |
| ⚠️ **版本控制** | 证书文件**禁止**上传至Git仓库 |
| ⚠️ **正式/测试分开** | 建议使用不同的测试证书和正式证书 |

### 6.2 .gitignore 配置

已在项目 `.gitignore` 中添加：

```gitignore
# Android签名证书
*.keystore
*.jks
```

### 6.3 证书存储建议

```
建议存储位置：
1. 公司内部加密文档管理系统
2. 多个核心人员本地加密备份
3. 云存储加密备份（设置强密码）
```

---

## 七、Expo项目构建配置

### 7.1 配置 eas.json

```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "credentialsSource": "local"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### 7.2 本地构建配置

将证书文件放入 `client/` 目录，构建时配置：

```typescript
// app.config.ts
export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    // ...其他配置
    "android": {
      "package": "com.kuaigong.app",
      "credentials": {
        "keystore": {
          "keystorePath": "./kuaigong.keystore",
          "keystorePassword": process.env.KEYSTORE_PASSWORD,
          "keyAlias": "kuaigong",
          "keyPassword": process.env.KEY_PASSWORD
        }
      }
    }
  }
}
```

---

## 八、应用商店上架所需信息

### 8.1 各应用商店要求

| 应用商店 | 所需指纹 | 格式要求 |
|----------|----------|----------|
| 华为应用市场 | SHA256 | 冒号分隔大写 |
| 小米应用商店 | MD5 | 无冒号小写 |
| OPPO应用商店 | SHA1 | 冒号分隔大写 |
| vivo应用商店 | SHA1 | 冒号分隔大写 |
| 腾讯应用宝 | MD5 | 无冒号小写 |
| Google Play | SHA1/SHA256 | 冒号分隔大写 |

### 8.2 指纹格式转换

```bash
# MD5带冒号大写
A1:B2:C3:D4:E5:F6:G7:H8:I9:J0:K1:L2:M3:N4:O5:P6

# MD5无冒号小写（部分平台需要）
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

## 九、常见问题

### Q1: 开发调试证书和正式证书的区别？

| 类型 | 用途 | 签名 |
|------|------|------|
| 调试证书 | 开发测试 | Android默认调试签名 |
| 正式证书 | 发布上架 | 自签名证书（本文档生成） |

### Q2: 证书丢失怎么办？

**证书丢失将导致：**
- 无法更新应用
- 无法在原包名下发布新版本
- 需要更换包名重新上架

**解决方案：** 务必做好多处备份！

### Q3: 证书密码忘记怎么办？

**无法找回！** 必须重新生成新证书，但会导致应用无法更新，需更换包名。

---

**文档编制单位**：徐州市快工科技有限公司  
**文档更新日期**：2024年  
**文档版本**：V1.0

---

## 待填写信息清单

证书已生成，以下信息已确认：

- [x] MD5指纹: `82:5D:19:DF:02:34:DE:98:50:92:14:5E:4F:B8:75:64`
- [x] SHA1指纹: `C1:CC:E1:5A:97:C6:69:7A:A3:06:26:D8:A9:B6:36:8B:72:AE:99:FF`
- [x] SHA256指纹: `F9:9E:15:A4:6B:EB:E3:68:06:61:C7:D1:DC:7B:7E:3A:2C:24:95:22:74:23:BF:53:3F:00:E5:0A:5E:58:4A:16`
- [x] 公钥: 已生成
- [x] 证书文件: `client/kuaigong.keystore`
- [x] 证书库密码: 已设置（请安全存储）
- [x] 密钥密码: 已设置（请安全存储）

---

## 证书安全信息

| 项目 | 值 |
|------|------|
| **证书文件路径** | `client/kuaigong.keystore` |
| **密钥别名** | `kuaigong` |
| **证书库密码** | `Kuaigong@2024#Secure` |
| **密钥密码** | `Kuaigong@2024#Secure` |
| **有效期** | 2026年4月1日 - 2051年3月26日 |

⚠️ **重要提醒**：请将密码安全存储，不要泄露给未授权人员。
