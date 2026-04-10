# 快工APP - 华为应用市场上架指南

## 一、签名密钥文件

### 已生成签名信息
```
文件: android/app/release.p12
格式: PKCS12
密码: Kuaigong2024!
别名: kuaigong
有效期: 10年
```

### 重要提示
- **请妥善保管签名密钥文件！** 丢失密钥将无法更新应用
- 建议将 `release.p12` 文件备份到安全位置
- 不要将密钥文件提交到Git等版本控制系统

---

## 二、本地构建APK/AAB包

### 方式1：使用Android Studio（推荐）

1. **安装Android Studio**
   - 下载地址：https://developer.android.com/studio
   - 安装时勾选 "Android SDK"

2. **打开项目**
   ```bash
   cd /workspace/projects/client
   # 用Android Studio打开 android 目录
   ```

3. **配置签名**
   - 打开 `android/app/build.gradle`
   - 确认签名配置已存在：
   ```gradle
   signingConfigs {
       release {
           storeFile file('release.p12')
           storePassword 'Kuaigong2024!'
           keyAlias 'kuaigong'
           keyPassword 'Kuaigong2024!'
       }
   }
   ```

4. **生成签名APK/AAB**
   - 菜单栏：Build → Generate Signed Bundle / APK
   - 选择 Android App Bundle（华为市场需要AAB）
   - 选择密钥文件：`android/app/release.p12`
   - 输入密码：`Kuaigong2024!`
   - 选择 `release` 构建类型
   - 点击 Finish

5. **输出位置**
   - APK: `android/app/build/outputs/apk/release/`
   - AAB: `android/app/build/outputs/bundle/release/`

### 方式2：使用命令行

```bash
cd /workspace/projects/client/android

# Windows
gradlew assembleRelease

# 或生成AAB
gradlew bundleRelease
```

---

## 三、使用EAS Build云构建（推荐）

### 1. 配置EAS
```bash
cd /workspace/projects/client
npm install -g eas-cli
eas login
```

### 2. 初始化EAS
```bash
eas build:configure
```

### 3. 构建Android AAB
```bash
eas build --platform android --profile preview
```

### 4. 下载构建结果
构建完成后会生成下载链接

---

## 四、华为应用市场上架步骤

### 1. 登录华为开发者联盟
https://developer.huawei.com/consumer/cn/

### 2. 创建应用
- 进入「应用服务」→「应用市场」
- 点击「创建应用」
- 填写应用基本信息

### 3. 上传签名文件
- 在「签名管理」中上传签名文件
- 使用 `release.der` 文件（可从 `release.p12` 导出）

### 4. 上传安装包
- 上传 AAB 文件

### 5. 填写应用信息
- 应用名称：快工
- 应用分类：生活服务 > 兼职/零工
- 应用简介：见下方「应用介绍」

### 6. 提交审核

---

## 五、应用介绍文案

### 短介绍（50字）
```
快速连接雇主与工人，零工任务即时匹配，兼职赚钱更便捷。
```

### 中介绍（100字）
```
快工是一款零工经济平台，连接需要临时帮手的雇主与寻找兼职机会的工人。
用户可以快速发布任务、即时接单、在线支付报酬。
支持搬家、跑腿、保洁、配送等多种零工类型。
```

### 详细介绍
```
快工 - 零工经济即时匹配平台

【平台简介】
快工是一款专注于零工经济的即时匹配平台，连接有临时用工需求的雇主与寻找兼职机会的工人。

【核心功能】
• 任务发布：雇主可快速发布各类零工任务
• 智能接单：工人可浏览附近任务，一键申请接单
• 即时通讯：内置消息系统，方便双方沟通
• 在线支付：支持钱包充值、提现，保障资金安全
• 实名认证：严格审核用户身份，保障交易安全
• 评价体系：双向评价机制，建立信任体系

【平台特色】
• 极速匹配：智能算法快速匹配供需双方
• 位置优先：基于地理位置推荐附近任务
• 透明定价：任务明码标价，避免纠纷
• 资金保障：平台托管资金，完成后放款
```

### 关键词
```
零工, 兼职, 临时工, 日结, 赚钱, 搬家, 跑腿, 家政, 保洁, 配送
```

---

## 六、签名密钥导出

如需导出DER格式的公钥证书（用于华为市场）：

```bash
# 安装OpenSSL
# Windows: 下载 OpenSSL for Windows
# macOS: brew install openssl
# Linux: apt-get install openssl

# 导出证书
openssl pkcs12 -in android/app/release.p12 -nokeys -out android/app/release.der -password pass:Kuaigong2024!
```

---

## 七、常见问题

### Q: 忘记签名密码怎么办？
A: 无法找回，需要重新生成签名

### Q: 华为审核需要多久？
A: 一般1-3个工作日

### Q: AAB和APK有什么区别？
A: AAB是Google推荐的格式，华为市场要求使用AAB

### Q: 需要准备哪些截图？
A: 建议准备6-10张截图，包括：
- 应用主界面截图
- 核心功能截图（发布任务、接单、支付等）
- 应用商店展示图

---

## 八、联系方式

如有问题，请联系技术支持。
