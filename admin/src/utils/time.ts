import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

// 扩展 dayjs 插件
dayjs.extend(utc)
dayjs.extend(timezone)

// 北京时区常量
const BEIJING_TIMEZONE = 'Asia/Shanghai'

/**
 * 将时间转换为北京时间
 * @param dateStr 时间字符串
 * @param format 输出格式，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 北京时间字符串
 */
export const formatBeijingTime = (
  dateStr: string | Date | undefined | null,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string => {
  if (!dateStr) return '-'
  
  const d = dayjs(dateStr)
  if (!d.isValid()) return '-'
  
  return d.tz(BEIJING_TIMEZONE).format(format)
}

/**
 * 格式化北京时间日期时间
 * @param date 时间字符串
 * @returns 北京时间字符串，格式：YYYY-MM-DD HH:mm
 */
export const formatDateTime = (date: string | Date | undefined | null): string => {
  return formatBeijingTime(date, 'YYYY-MM-DD HH:mm')
}

/**
 * 格式化北京时间日期
 * @param date 时间字符串
 * @returns 北京时间字符串，格式：YYYY-MM-DD
 */
export const formatDate = (date: string | Date | undefined | null): string => {
  return formatBeijingTime(date, 'YYYY-MM-DD')
}

/**
 * 格式化北京时间时间
 * @param date 时间字符串
 * @returns 北京时间字符串，格式：HH:mm:ss
 */
export const formatTime = (date: string | Date | undefined | null): string => {
  return formatBeijingTime(date, 'HH:mm:ss')
}

/**
 * 获取当前北京时间
 * @returns 当前北京时间的 dayjs 对象
 */
export const nowBeijing = () => dayjs().tz(BEIJING_TIMEZONE)

/**
 * 获取当前北京时间字符串
 * @param format 格式，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 当前北京时间字符串
 */
export const nowBeijingStr = (format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  return nowBeijing().format(format)
}
