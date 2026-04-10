#!/usr/bin/env python3
"""
APP图标安全边距处理脚本
- 主图标: 保留15%安全边距
- Android adaptive icon: 保留25%安全边距（适配圆形裁切）
- Splash图标: 保留20%安全边距
- 最终输出标准1024x1024尺寸
"""

from PIL import Image
import os

# 图标路径
ICON_PATH = "/workspace/projects/client/assets/images/icon_original.png"
OUTPUT_DIR = "/workspace/projects/client/assets/images"
FINAL_SIZE = 1024  # 最终输出尺寸

def add_safe_padding(input_path, output_path, padding_ratio, bg_color=(255, 255, 255, 255)):
    """
    为图标添加安全边距并输出标准尺寸
    
    Args:
        input_path: 输入图片路径
        output_path: 输出图片路径
        padding_ratio: 边距比例 (0.0-1.0)，例如0.15表示15%边距
        bg_color: 背景颜色 (R, G, B, A)
    """
    # 打开原始图片
    original = Image.open(input_path)
    
    # 如果图片有调色板模式，转换为RGBA
    if original.mode == 'P':
        original = original.convert('RGBA')
    elif original.mode != 'RGBA':
        original = original.convert('RGBA')
    
    # 获取原始尺寸
    orig_width, orig_height = original.size
    
    # 创建标准尺寸的画布
    canvas = Image.new('RGBA', (FINAL_SIZE, FINAL_SIZE), bg_color)
    
    # 计算内容区域大小（去除边距后的可用区域）
    content_size = int(FINAL_SIZE * (1 - 2 * padding_ratio))
    
    # 缩放原图以适应内容区域
    original_resized = original.resize((content_size, content_size), Image.Resampling.LANCZOS)
    
    # 计算居中位置
    paste_x = (FINAL_SIZE - content_size) // 2
    paste_y = (FINAL_SIZE - content_size) // 2
    
    # 将原图粘贴到画布中心
    canvas.paste(original_resized, (paste_x, paste_y), original_resized if original_resized.mode == 'RGBA' else None)
    
    # 保存结果
    canvas.save(output_path, 'PNG', optimize=True)
    print(f"✅ 已生成: {os.path.basename(output_path)}")
    print(f"   输出尺寸: {FINAL_SIZE}x{FINAL_SIZE}")
    print(f"   内容区域: {content_size}x{content_size} ({(1-2*padding_ratio)*100:.0f}%)")
    print(f"   安全边距: {padding_ratio*100:.0f}%")
    
    return canvas

def main():
    print("🖼️  开始处理APP图标，添加安全边距...\n")
    print(f"📐 最终输出尺寸: {FINAL_SIZE}x{FINAL_SIZE}\n")
    print("="*60)
    
    # 1. 主图标 - 15%安全边距
    print("\n📱 处理主图标 (icon.png)...")
    add_safe_padding(
        ICON_PATH,
        os.path.join(OUTPUT_DIR, "icon.png"),
        padding_ratio=0.15,
        bg_color=(255, 255, 255, 255)  # 白色背景
    )
    
    # 2. Android Adaptive图标 - 25%安全边距（圆形裁切需要更大边距）
    print("\n📱 处理Android自适应图标 (adaptive-icon.png)...")
    add_safe_padding(
        ICON_PATH,
        os.path.join(OUTPUT_DIR, "adaptive-icon.png"),
        padding_ratio=0.25,  # 25%边距，确保圆形裁切时不切到内容
        bg_color=(255, 255, 255, 0)  # 透明背景
    )
    
    # 3. Splash启动图标 - 20%安全边距
    print("\n📱 处理启动页图标 (splash-icon.png)...")
    add_safe_padding(
        ICON_PATH,
        os.path.join(OUTPUT_DIR, "splash-icon.png"),
        padding_ratio=0.20,
        bg_color=(255, 255, 255, 255)  # 白色背景
    )
    
    # 4. Favicon - 256x256，10%安全边距
    print("\n📱 处理网页图标 (favicon.png)...")
    
    # 打开原始图标
    favicon_original = Image.open(ICON_PATH)
    if favicon_original.mode == 'P':
        favicon_original = favicon_original.convert('RGBA')
    elif favicon_original.mode != 'RGBA':
        favicon_original = favicon_original.convert('RGBA')
    
    # 创建256x256画布
    favicon_canvas = Image.new('RGBA', (256, 256), (255, 255, 255, 255))
    favicon_inner_size = int(256 * 0.8)  # 80%内容区域 = 10%边距
    favicon_inner = favicon_original.resize((favicon_inner_size, favicon_inner_size), Image.Resampling.LANCZOS)
    favicon_offset = (256 - favicon_inner_size) // 2
    favicon_canvas.paste(favicon_inner, (favicon_offset, favicon_offset), favicon_inner)
    favicon_canvas.save(os.path.join(OUTPUT_DIR, "favicon.png"), 'PNG', optimize=True)
    print(f"✅ 已生成: favicon.png (256x256)")
    print(f"   内容区域: {favicon_inner_size}x{favicon_inner_size} (80%)")
    print(f"   安全边距: 10%")
    
    print("\n" + "="*60)
    print("✅ 所有图标处理完成！")
    print("="*60)
    print("\n📊 安全边距说明:")
    print("  • 主图标 (icon.png): 15% 边距")
    print("    → 适配iOS/Android各种方形裁切")
    print("  • Adaptive图标 (adaptive-icon.png): 25% 边距")
    print("    → 适配Android圆形、圆角裁切")
    print("  • Splash图标 (splash-icon.png): 20% 边距")
    print("    → 启动页展示更舒适美观")
    print("  • Favicon (favicon.png): 10% 边距")
    print("    → 小尺寸保持清晰可辨")
    print("\n💡 提示: 原始图标已备份为 icon_original.png")

if __name__ == "__main__":
    main()
