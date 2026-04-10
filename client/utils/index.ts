import { Platform } from 'react-native';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// 扩展 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);

// 北京时区常量
const BEIJING_TIMEZONE = 'Asia/Shanghai';

const API_BASE = (process.env.EXPO_PUBLIC_API_BASE ?? '').replace(/\/$/, '');

/**
 * 创建跨平台兼容的文件对象，用于 FormData.append()
 * - Web 端返回 File 对象
 * - 移动端返回 { uri, type, name } 对象（RN fetch 会自动处理）
 * @param fileUri Expo 媒体库（如 expo-image-picker、expo-camera）返回的 uri
 * @param fileName 上传时的文件名，如 'photo.jpg'
 * @param mimeType 文件 MIME 类型，如 'image/jpeg'、'audio/mpeg'
 */
export async function createFormDataFile(
  fileUri: string,
  fileName: string,
  mimeType: string
): Promise<File | { uri: string; type: string; name: string }> {
  if (Platform.OS === 'web') {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    return new File([blob], fileName, { type: mimeType });
  }
  return { uri: fileUri, type: mimeType, name: fileName };
}

/**
 * 构建文件或图片完整的URL
 * @param url 相对或绝对路径
 * @param w 宽度 (px) - 自动向下取整
 * @param h 高度 (px)
 */
export const buildAssetUrl = (url?: string | null, w?: number, h?: number): string | undefined => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url; // 绝对路径直接返回

  // 1. 去除 Base 尾部和 Path 头部的斜杠
  const base = API_BASE;
  const path = url.replace(/^\//, '');
  const abs = `${base}/${path}`;

  // 2. 无需缩略图则直接返回
  if (!w && !h) return abs;

  // 3. 构造参数，保留原有 Query (如有)
  const separator = abs.includes('?') ? '&' : '?';
  const query = [
    w ? `w=${Math.floor(w)}` : '',
    h ? `h=${Math.floor(h)}` : ''
  ].filter(Boolean).join('&');
  return `${abs}${separator}${query}`;
};

/**
 * 将UTC时间字符串转换为本地时间字符串
 * @param utcDateStr UTC时间字符串，格式如：2025-11-26T01:49:48.009573
 * @returns 本地时间字符串，格式如：2025-11-26 08:49:48
 */
export const convertToLocalTimeStr = (utcDateStr: string): string => {
  if (!utcDateStr) {
    return utcDateStr;
  }
  const microUtcRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,6}/;
  if (!microUtcRegex.test(utcDateStr)) {
    console.log('invalid utcDateStr:', utcDateStr);
    return utcDateStr;
  }
  const normalized = utcDateStr.replace(/\.(\d{6})$/, (_, frac) => `.${frac.slice(0, 3)}`);
  const d = dayjs.utc(normalized);
  if (!d.isValid()) {
    return utcDateStr;
  }
  return d.local().format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 将UTC时间转换为北京时间（强制使用 Asia/Shanghai 时区）
 * @param dateStr 时间字符串（UTC或ISO格式）
 * @param format 输出格式，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 北京时间字符串
 */
export const formatBeijingTime = (
  dateStr: string | Date | undefined | null,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string => {
  if (!dateStr) return '-';
  
  const d = dayjs(dateStr);
  if (!d.isValid()) return '-';
  
  return d.tz(BEIJING_TIMEZONE).format(format);
};

/**
 * 格式化北京时间日期（仅日期部分）
 * @param dateStr 时间字符串
 * @returns 北京时间日期字符串，格式：YYYY-MM-DD
 */
export const formatBeijingDate = (dateStr: string | Date | undefined | null): string => {
  return formatBeijingTime(dateStr, 'YYYY-MM-DD');
};

/**
 * 格式化北京时间时间（仅时间部分）
 * @param dateStr 时间字符串
 * @returns 北京时间字符串，格式：HH:mm
 */
export const formatBeijingTimeOnly = (dateStr: string | Date | undefined | null): string => {
  return formatBeijingTime(dateStr, 'HH:mm');
};

/**
 * 格式化相对时间（如：刚刚、5分钟前、今天 12:30、昨天 18:00、2024-01-15）
 * @param dateStr 时间字符串
 * @returns 相对时间字符串
 */
export const formatRelativeBeijingTime = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '-';
  
  const d = dayjs(dateStr).tz(BEIJING_TIMEZONE);
  if (!d.isValid()) return '-';
  
  const now = dayjs().tz(BEIJING_TIMEZONE);
  const diffMinutes = now.diff(d, 'minute');
  const diffHours = now.diff(d, 'hour');
  const diffDays = now.diff(d, 'day');
  
  // 1分钟内：刚刚
  if (diffMinutes < 1) {
    return '刚刚';
  }
  
  // 1小时内：X分钟前
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  }
  
  // 今天：显示时间
  if (diffDays === 0) {
    return `今天 ${d.format('HH:mm')}`;
  }
  
  // 昨天：显示时间
  if (diffDays === 1) {
    return `昨天 ${d.format('HH:mm')}`;
  }
  
  // 7天内：显示星期和时间
  if (diffDays < 7) {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${weekDays[d.day()]} ${d.format('HH:mm')}`;
  }
  
  // 超过7天：显示完整日期
  return d.format('YYYY-MM-DD HH:mm');
};

/**
 * 获取当前北京时间
 * @returns 当前北京时间的 dayjs 对象
 */
export const nowBeijing = () => dayjs().tz(BEIJING_TIMEZONE);

/**
 * 获取当前北京时间字符串
 * @param format 格式，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 当前北京时间字符串
 */
export const nowBeijingStr = (format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  return nowBeijing().format(format);
};
