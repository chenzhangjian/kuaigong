export const Colors = {
  light: {
    textPrimary: "#2D3436",
    textSecondary: "#636E72",
    textMuted: "#B2BEC3",
    textPlaceholder: "#A0A0A0",
    primary: "#6C63FF", // 薰衣草紫 - 柔和卡片风主色
    primaryGradient: "#896BFF", // 主色渐变终点
    accent: "#FF6584", // 珊瑚粉 - 辅助色
    success: "#00B894",
    warning: "#FDCB6E",
    error: "#FF6B6B",
    backgroundRoot: "#F0F0F3", // 暖灰白背景
    backgroundDefault: "#F0F0F3", // 卡片背景与页面背景同色，靠阴影区分
    backgroundTertiary: "#E8E8EB", // 凹陷面/输入框背景
    backgroundElevated: "#FFFFFF", // 浮层背景
    backgroundSurface: "#FAFAFA", // 表面背景
    buttonPrimaryText: "#FFFFFF",
    tabIconSelected: "#6C63FF",
    border: "#D1D9E6", // 暗部阴影色
    borderLight: "rgba(255,255,255,0.6)", // 高光边框
    shadowDark: "#D1D9E6", // 暗部阴影
    shadowLight: "#FFFFFF", // 高光阴影
  },
  dark: {
    textPrimary: "#FAFAF9",
    textSecondary: "#A8A29E",
    textMuted: "#6F767E",
    textPlaceholder: "#6F767E",
    primary: "#8B7CFF", // 暗色模式薰衣草紫
    primaryGradient: "#A090FF",
    accent: "#FF8096", // 暗色模式珊瑚粉
    success: "#00D9A5",
    warning: "#FFD93D",
    error: "#FF7B7B",
    backgroundRoot: "#1A1A2E",
    backgroundDefault: "#1A1A2E",
    backgroundTertiary: "#252540",
    backgroundElevated: "#252540", // 浮层背景
    backgroundSurface: "#1F1F35", // 表面背景
    buttonPrimaryText: "#1A1A2E",
    tabIconSelected: "#8B7CFF",
    border: "#3A3A5E",
    borderLight: "rgba(255,255,255,0.1)",
    shadowDark: "#0F0F1E",
    shadowLight: "#2A2A4E",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
  xxl: 24, // alias for 2xl
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24, // 核心圆角 - 大圆角胶囊感
  "3xl": 28, // 底部导航圆角
  "4xl": 32,
  full: 9999,
};

export const Typography = {
  display: {
    fontSize: 112,
    lineHeight: 112,
    fontWeight: "200" as const,
    letterSpacing: -4,
  },
  displayLarge: {
    fontSize: 112,
    lineHeight: 112,
    fontWeight: "200" as const,
    letterSpacing: -2,
  },
  displayMedium: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "200" as const,
  },
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "800" as const, // 页面大标题加粗
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700" as const, // 区块标题加粗
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700" as const, // 卡片标题加粗
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  smallMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
  captionMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600" as const, // 标签文字加粗
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  labelSmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  labelTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700" as const,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  stat: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "300" as const,
  },
  dataLarge: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "800" as const, // 数据大字
    color: "#6C63FF",
  },
  dataSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700" as const, // 数据小字
    color: "#6C63FF",
  },
  tiny: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "400" as const,
  },
  navLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600" as const, // 导航文字加粗
  },
};

export type Theme = typeof Colors.light;
