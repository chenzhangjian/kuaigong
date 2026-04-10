#!/bin/bash
# 快工APP快速构建脚本

echo "=========================================="
echo "   快工APP Android构建脚本"
echo "=========================================="
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查Java
if ! command -v java &> /dev/null; then
    echo "❌ JDK 未安装"
    echo "请先安装 JDK 17: https://adoptium.net/"
    exit 1
fi

echo "✅ Java 版本: $(java -version 2>&1 | head -1)"

# 设置ANDROID_HOME（如未设置）
if [ -z "$ANDROID_HOME" ]; then
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME=$HOME/Android/Sdk
        export PATH=$PATH:$ANDROID_HOME/platform-tools
        echo "✅ Android SDK: $ANDROID_HOME"
    fi
fi

echo ""
echo "=========================================="
echo "   开始构建..."
echo "=========================================="
echo ""

# 进入client目录
cd "$(dirname "$0")/.." || exit

# 安装依赖
echo "📦 安装项目依赖..."
npm install

# 清理旧的Android代码并重新生成
echo "🔨 生成Android原生代码..."
npx expo prebuild --platform android --clean

# 进入Android目录
cd android

# 打包Debug APK
echo "📱 打包Debug APK..."
./gradlew assembleDebug

# 检查是否成功
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo ""
    echo "=========================================="
    echo "   ✅ 构建成功！"
    echo "=========================================="
    echo ""
    echo "📂 APK位置: $(pwd)/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "📋 文件信息:"
    ls -lh app/build/outputs/apk/debug/app-debug.apk
    echo ""
    echo "🔐 校验值:"
    echo "MD5:  $(md5sum app/build/outputs/apk/debug/app-debug.apk | cut -d' ' -f1)"
    echo "SHA1: $(shasum app/build/outputs/apk/debug/app-debug.apk | cut -d' ' -f1)"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "   ❌ 构建失败！"
    echo "=========================================="
    exit 1
fi
