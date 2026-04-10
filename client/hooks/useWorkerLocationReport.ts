/**
 * 工人位置上报Hook
 * 工人开始工作后定时上报位置
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';
const REPORT_INTERVAL = 60000; // 上报间隔：60秒

interface UseWorkerLocationReportOptions {
  orderId: string;
  enabled: boolean; // 只有订单状态为 in_progress 时才启用
}

interface LocationReportStatus {
  isReporting: boolean;
  lastReportTime: Date | null;
  error: string | null;
}

export function useWorkerLocationReport({ orderId, enabled }: UseWorkerLocationReportOptions) {
  const [status, setStatus] = useState<LocationReportStatus>({
    isReporting: false,
    lastReportTime: null,
    error: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // 上报位置
  const reportLocation = useCallback(async () => {
    if (!enabled || !orderId) return;

    try {
      // 获取位置权限
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        setStatus(prev => ({ ...prev, error: '位置权限未授予' }));
        return;
      }

      // 获取当前位置
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // 获取token
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setStatus(prev => ({ ...prev, error: '未登录' }));
        return;
      }

      // 上报位置
      const response = await fetch(`${BASE_URL}/api/v1/orders/${orderId}/worker-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      if (response.ok) {
        if (isMountedRef.current) {
          setStatus({
            isReporting: true,
            lastReportTime: new Date(),
            error: null,
          });
        }
      } else {
        const errorData = await response.json();
        if (isMountedRef.current) {
          setStatus(prev => ({ ...prev, error: errorData.error || '上报失败' }));
        }
      }
    } catch (error: any) {
      console.error('位置上报失败:', error);
      if (isMountedRef.current) {
        setStatus(prev => ({ ...prev, error: error.message || '网络错误' }));
      }
    }
  }, [orderId, enabled]);

  // 开始定时上报
  useEffect(() => {
    if (!enabled) {
      // 停止上报
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setStatus({ isReporting: false, lastReportTime: null, error: null });
      return;
    }

    // 立即上报一次
    reportLocation();

    // 定时上报
    intervalRef.current = setInterval(reportLocation, REPORT_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, reportLocation]);

  // 清理
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...status,
    reportNow: reportLocation, // 手动上报
  };
}
