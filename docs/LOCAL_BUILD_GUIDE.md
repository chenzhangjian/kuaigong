# 快工APP - 本地构建指南

## 环境要求

### 1. Node.js
- 版本：18.x 或 20.x
- 下载地址：https://nodejs.org/

### 2. Java Development Kit (JDK)
- 版本：JDK 17 或更高
- 下载地址：https://adoptium.net/

### 3. Android Studio
- 下载地址：https://developer.android.com/studio
- 安装时勾选 "Android SDK"

---

## 构建步骤

### 第一步：安装Node.js依赖

```bash
cd 快工APP目录/client
npm install
```

### 第二步：生成Android项目

```bash
npx expo prebuild --platform android
```

### 第三步：构建APK

```bash
cd android

# 构建Debug APK（较快，用于测试）
./gradlew assembleDebug

# 或构建Release APK（用于发布）
./gradlew assembleRelease
```

### 第四步：构建AAB（华为市场需要）

```bash
cd android
./gradlew bundleRelease
```

---

## 获取安装包

### APK文件位置
```
client/android/app/build/outputs/apk/debug/app-debug.apk        # Debug版本
client/android/app/build/outputs/apk/release/app-release.apk  # Release版本
```

### AAB文件位置（用于华为市场）
```
client/android/app/build/outputs/bundle/release/app-release.aab
```

---

## 签名密钥信息

| 项目 | 值 |
|------|-----|
| 文件 | `android/app/release.p12` |
| 格式 | PKCS12 |
| 别名 | `kuaigong` |
| 密码 | `Kuaigong2024!` |

**重要**：签名密钥已包含在项目中，构建时会自动使用。

---

## 常见问题

### Q: ./gradlew 提示权限不足
```bash
chmod +x ./gradlew
```

### Q: 下载依赖超时
确保网络畅通，或配置国内镜像：
- 修改 `android/gradle/wrapper/gradle-wrapper.properties`
- 将 `distributionUrl` 改为：`https://mirrors.aliyun.com/gradle/gradle-8.14.3-bin.zip`

### Q: 找不到JAVA_HOME
在系统环境变量中添加：
```
JAVA_HOME = C:\Program Files\Java\jdk-17
```

---

## 华为应用市场上传

1. 登录华为开发者联盟
2. 上传 `app-release.aab` 文件
3. 填写应用信息
4. 提交审核

---

如有问题，请联系技术支持。
