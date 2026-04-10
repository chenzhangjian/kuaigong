/**
 * 位置选择器组件
 * 支持GPS定位、关键词搜索、手动输入地址
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

interface LocationData {
  address: string;
  lat?: number;
  lng?: number;
  name?: string;
}

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
}

interface PoiItem {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: string;
}

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

export function LocationPicker({
  visible,
  onClose,
  onSelect,
  initialLocation,
}: LocationPickerProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // 状态
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<PoiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [recentLocations, setRecentLocations] = useState<LocationData[]>([]);
  const [activeTab, setActiveTab] = useState<'locate' | 'search' | 'manual'>('locate');

  // 初始化
  useEffect(() => {
    if (visible) {
      // 尝试获取当前位置
      getCurrentLocation();
    }
  }, [visible]);

  // 获取当前位置
  const getCurrentLocation = async () => {
    setLocating(true);
    try {
      // 请求位置权限
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要位置权限才能获取当前位置', [
          { text: '取消', style: 'cancel' },
          { text: '使用模拟位置', onPress: getMockLocation },
        ]);
        return;
      }

      // 获取当前位置
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // 调用逆地理编码获取地址
      const response = await fetch(
        `${BASE_URL}/api/v1/location/reverse-geocode?lat=${latitude}&lng=${longitude}`
      );
      const data = await response.json();

      setCurrentLocation({
        address: data.formattedAddress,
        lat: latitude,
        lng: longitude,
        name: '当前位置',
      });
    } catch (error) {
      console.error('获取位置失败:', error);
      // 使用模拟位置
      getMockLocation();
    } finally {
      setLocating(false);
    }
  };

  // 使用模拟位置（开发环境）
  const getMockLocation = async () => {
    const mockLat = 39.9042;
    const mockLng = 116.4074;

    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/location/reverse-geocode?lat=${mockLat}&lng=${mockLng}`
      );
      const data = await response.json();

      setCurrentLocation({
        address: data.formattedAddress,
        lat: mockLat,
        lng: mockLng,
        name: '当前位置',
      });
    } catch (error) {
      setCurrentLocation({
        address: '北京市海淀区中关村大街1号',
        lat: mockLat,
        lng: mockLng,
        name: '当前位置',
      });
    }
    setLocating(false);
  };

  // 搜索地点
  const searchLocations = async () => {
    if (!searchKeyword.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        keyword: searchKeyword,
      });

      // 如果有当前位置，按距离排序
      if (currentLocation?.lat && currentLocation?.lng) {
        params.set('lat', String(currentLocation.lat));
        params.set('lng', String(currentLocation.lng));
      }

      const response = await fetch(`${BASE_URL}/api/v1/location/search?${params}`);
      const data = await response.json();

      setSearchResults(data.pois || []);
    } catch (error) {
      console.error('搜索失败:', error);
      Alert.alert('提示', '搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 选择位置
  const handleSelectLocation = (location: LocationData) => {
    onSelect(location);
    onClose();
  };

  // 选择当前位置
  const handleSelectCurrentLocation = () => {
    if (currentLocation) {
      handleSelectLocation(currentLocation);
    }
  };

  // 选择搜索结果
  const handleSelectSearchResult = (poi: PoiItem) => {
    handleSelectLocation({
      address: poi.address,
      lat: poi.lat,
      lng: poi.lng,
      name: poi.name,
    });
  };

  // 手动输入地址
  const [manualAddress, setManualAddress] = useState('');
  const handleManualConfirm = () => {
    if (!manualAddress.trim()) {
      Alert.alert('提示', '请输入地址');
      return;
    }
    handleSelectLocation({ address: manualAddress.trim() });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>选择位置</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome6 name="xmark" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Tab切换 */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'locate' && styles.tabActive]}
              onPress={() => setActiveTab('locate')}
            >
              <FontAwesome6
                name="location-crosshairs"
                size={16}
                color={activeTab === 'locate' ? theme.primary : theme.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'locate' && styles.tabTextActive]}>
                当前位置
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'search' && styles.tabActive]}
              onPress={() => setActiveTab('search')}
            >
              <FontAwesome6
                name="magnifying-glass"
                size={16}
                color={activeTab === 'search' ? theme.primary : theme.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
                搜索地点
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'manual' && styles.tabActive]}
              onPress={() => setActiveTab('manual')}
            >
              <FontAwesome6
                name="keyboard"
                size={16}
                color={activeTab === 'manual' ? theme.primary : theme.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'manual' && styles.tabTextActive]}>
                手动输入
              </Text>
            </TouchableOpacity>
          </View>

          {/* 内容区域 */}
          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            {/* 当前位置 */}
            {activeTab === 'locate' && (
              <View style={styles.locateContent}>
                {locating ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingText}>正在获取位置...</Text>
                  </View>
                ) : currentLocation ? (
                  <TouchableOpacity style={styles.currentLocationCard} onPress={handleSelectCurrentLocation}>
                    <View style={styles.currentLocationIcon}>
                      <FontAwesome6 name="location-dot" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.currentLocationInfo}>
                      <Text style={styles.currentLocationTitle}>当前位置</Text>
                      <Text style={styles.currentLocationAddress}>{currentLocation.address}</Text>
                    </View>
                    <FontAwesome6 name="chevron-right" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.emptyContainer}>
                    <FontAwesome6 name="location-crosshairs" size={48} color={theme.textMuted} />
                    <Text style={styles.emptyText}>无法获取位置</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
                      <Text style={styles.retryButtonText}>重新获取</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 最近使用 */}
                {recentLocations.length > 0 && (
                  <View style={styles.recentSection}>
                    <Text style={styles.sectionTitle}>最近使用</Text>
                    {recentLocations.map((loc, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.recentItem}
                        onPress={() => handleSelectLocation(loc)}
                      >
                        <FontAwesome6 name="clock-rotate-left" size={16} color={theme.textSecondary} />
                        <Text style={styles.recentText} numberOfLines={1}>
                          {loc.name || loc.address}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* 搜索 */}
            {activeTab === 'search' && (
              <View style={styles.searchContent}>
                <View style={styles.searchInputContainer}>
                  <FontAwesome6 name="magnifying-glass" size={18} color={theme.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="搜索地点、地址"
                    placeholderTextColor={theme.textMuted}
                    value={searchKeyword}
                    onChangeText={setSearchKeyword}
                    onSubmitEditing={searchLocations}
                    returnKeyType="search"
                  />
                  {searchKeyword.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchKeyword('')}>
                      <FontAwesome6 name="xmark" size={16} color={theme.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity style={styles.searchButton} onPress={searchLocations}>
                  <Text style={styles.searchButtonText}>搜索</Text>
                </TouchableOpacity>

                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                  </View>
                ) : (
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id}
                    style={styles.searchResults}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.searchResultItem}
                        onPress={() => handleSelectSearchResult(item)}
                      >
                        <View style={styles.searchResultIcon}>
                          <FontAwesome6 name="location-dot" size={18} color={theme.primary} />
                        </View>
                        <View style={styles.searchResultInfo}>
                          <Text style={styles.searchResultName}>{item.name}</Text>
                          <Text style={styles.searchResultAddress}>{item.address}</Text>
                        </View>
                        {item.distance && (
                          <Text style={styles.searchResultDistance}>{item.distance}m</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      searchKeyword.length > 0 && !loading ? (
                        <View style={styles.emptyContainer}>
                          <Text style={styles.emptyText}>未找到相关地点</Text>
                        </View>
                      ) : null
                    }
                  />
                )}
              </View>
            )}

            {/* 手动输入 */}
            {activeTab === 'manual' && (
              <View style={styles.manualContent}>
                <Text style={styles.manualHint}>请输入详细地址，如：北京市海淀区中关村大街1号</Text>
                <TextInput
                  style={styles.manualInput}
                  placeholder="请输入详细地址"
                  placeholderTextColor={theme.textMuted}
                  value={manualAddress}
                  onChangeText={setManualAddress}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <TouchableOpacity style={styles.manualButton} onPress={handleManualConfirm}>
                  <Text style={styles.manualButtonText}>确认</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.backgroundRoot,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '80%',
      minHeight: '50%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    closeButton: {
      position: 'absolute',
      right: Spacing.xl,
      padding: Spacing.sm,
    },
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.lg,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: theme.primary,
    },
    tabText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    tabTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      padding: Spacing.xl,
    },
    // 定位
    locateContent: {
      flex: 1,
    },
    currentLocationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    currentLocationIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.lg,
      backgroundColor: `${theme.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.lg,
    },
    currentLocationInfo: {
      flex: 1,
    },
    currentLocationTitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: Spacing.xs,
    },
    currentLocationAddress: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    // 搜索
    searchContent: {
      flex: 1,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius.xl,
      paddingHorizontal: Spacing.lg,
      height: 48,
      marginBottom: Spacing.md,
    },
    searchInput: {
      flex: 1,
      marginLeft: Spacing.md,
      fontSize: 16,
      color: theme.textPrimary,
    },
    searchButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    searchButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    searchResults: {
      flex: 1,
    },
    searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    searchResultIcon: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      backgroundColor: `${theme.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    searchResultInfo: {
      flex: 1,
    },
    searchResultName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: 2,
    },
    searchResultAddress: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    searchResultDistance: {
      fontSize: 13,
      color: theme.textMuted,
    },
    // 手动输入
    manualContent: {
      flex: 1,
    },
    manualHint: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: Spacing.lg,
    },
    manualInput: {
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      fontSize: 16,
      color: theme.textPrimary,
      minHeight: 100,
      marginBottom: Spacing.lg,
    },
    manualButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
    },
    manualButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    // 通用
    loadingContainer: {
      paddingVertical: Spacing['3xl'],
      alignItems: 'center',
    },
    loadingText: {
      marginTop: Spacing.md,
      color: theme.textSecondary,
    },
    emptyContainer: {
      paddingVertical: Spacing['3xl'],
      alignItems: 'center',
    },
    emptyText: {
      marginTop: Spacing.md,
      color: theme.textSecondary,
      fontSize: 15,
    },
    retryButton: {
      marginTop: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.lg,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    recentSection: {
      marginTop: Spacing.lg,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: Spacing.md,
    },
    recentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.md,
    },
    recentText: {
      fontSize: 15,
      color: theme.textPrimary,
    },
  });

export default LocationPicker;
