# 快工APP本地构建指南

## 一、环境准备

### 1. 安装 Node.js (v18+)
```bash
# macOS 使用 Homebrew
brew install node@18

# Windows 下载安装包
# https://nodejs.org/

# 验证
node -v  # 应显示 v18.x.x
```

### 2. 安装 JDK 17
```bash
# macOS 使用 Homebrew
brew install openjdk@17

# Windows 下载 JDK 17
# https://adoptium.net/temurin/releases/?version=17

# 设置环境变量
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64  # Linux
# 或
export JAVA_HOME=$(/usr/libexec/java_home)  # macOS
export PATH=$JAVA_HOME/bin:$PATH
```

### 3. 安装 Android SDK
```bash
# macOS 使用 Homebrew
brew install android-sdk

# Windows 下载 Android Studio
# https://developer.android.com/studio

# 设置环境变量
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

## 二、获取项目代码

### 方式1：Git克隆（如已配置远程仓库）
```bash
git clone <你的仓库地址>
cd projects/client
```

### 方式2：手动复制
将 `/workspace/projects` 目录下的 `client` 文件夹复制到本地

## 三、安装依赖并构建

### 1. 安装项目依赖
```bash
cd client
npm install
```

### 2. 生成 Android 原生代码
```bash
npx expo prebuild --platform android
```

### 3. 修改包名（如需）
如果需要修改 Android 包名，在 `app.config.ts` 中修改：
```typescript
"android": {
  "package": "com.yourcompany.yourapp"
}
```
然后重新执行 `npx expo prebuild --platform android --clean`

### 4. 打包 Debug APK
```bash
cd android
./gradlew assembleDebug
```
APK 输出位置：`android/app/build/outputs/apk/debug/app-debug.apk`

### 5. 打包 Release APK（需配置签名）
```bash
cd android
./gradlew assembleRelease
```
APK 输出位置：`android/app/build/outputs/apk/release/app-release.apk`

## 四、获取校验值

### MD5 和 SHA1
```bash
# Debug APK
md5sum app/build/outputs/apk/debug/app-debug.apk
sha1sum app/build/outputs/apk/debug/app-debug.apk

# Release APK
md5sum app/build/outputs/apk/release/app-release.apk
sha1sum app/build/outputs/apk/release/app-release.apk

# Windows 使用 PowerShell
Get-FileHash app-debug.apk -Algorithm MD5
Get-FileHash app-release.apk -Algorithm SHA1
```

## 五、Release APK 签名配置

### 1. 生成签名密钥
```bash
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

### 2. 配置签名信息
在 `android/app/build.gradle` 中添加：

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('my-release-key.jks')
            storePassword '你的密码'
            keyAlias 'my-key-alias'
            keyPassword '你的密码'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## 六、常见问题

### Q: gradlew 权限不足
```bash
chmod +x gradlew
```

### Q: 下载依赖超时
```bash
# 使用国内镜像
npm config set registry https://registry.npmmirror.com
```

### Q: Android SDK 找不到
```bash
# 设置 SDK 路径
export ANDROID_HOME=/Users/你的用户名/Library/Android/sdk
```

## 七、构建验证

构建成功后，在设备或模拟器上安装 APK：

```bash
# 安装到连接的设备
adb install app/build/outputs/apk/debug/app-debug.apk

# 安装到模拟器
adb install -e app/build/outputs/apk/debug/app-debug.apk
```

## 八、输出文件

| 文件 | 位置 |
|------|------|
| Debug APK | `client/android/app/build/outputs/apk/debug/app-debug.apk` |
| Release APK | `client/android/app/build/outputs/apk/release/app-release.apk` |
| JS Bundle | `client/android/app/src/main/assets/index.android.bundle` |

---

## 公安联网备案填写信息

| 项目 | 内容 |
|------|------|
| 软件名称 | 快工 |
| 版本号 | 1.0.0 |
| APP包名 | com.kuaigong.app |
| SHA1 | （打包后填写） |
| MD5 | （打包后填写） |
