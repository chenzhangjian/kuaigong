import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import api from '@/utils/api';

interface PoiItem {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: string;
  type?: string;
}

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: { address: string; latitude: number; longitude: number }) => void;
  initialAddress?: string;
}

export default function LocationPicker({
  visible,
  onClose,
  onSelect,
  initialAddress,
}: LocationPickerProps) {
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<PoiItem[]>([]);
  const [currentLocation, setCurrentLocation] = useState<PoiItem | null>(null);
  const [recentLocations, setRecentLocations] = useState<PoiItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 获取当前位置
  const getCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    try {
      // 请求位置权限
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要位置权限才能获取当前位置');
        setIsLocating(false);
        return;
      }

      // 获取当前位置
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // 调用逆地理编码接口
      const result = await api.reverseGeocode(latitude, longitude);

      const currentPoi: PoiItem = {
        id: 'current',
        name: result.formattedAddress,
        address: result.formattedAddress,
        lat: result.location.lat,
        lng: result.location.lng,
      };

      setCurrentLocation(currentPoi);

      // 同时搜索周边POI
      if (result.pois && result.pois.length > 0) {
        const nearbyPois = result.pois.slice(0, 5).map((poi, index) => ({
          id: `nearby_${index}`,
          name: poi.name,
          address: poi.address,
          lat: result.location.lat,
          lng: result.location.lng,
          distance: poi.distance,
        }));
        setSearchResults(nearbyPois);
      }
    } catch (error) {
      console.error('Get current location error:', error);
      Alert.alert('提示', '获取当前位置失败，请手动搜索');
    } finally {
      setIsLocating(false);
    }
  }, []);

  // 搜索地点
  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    Keyboard.dismiss();

    try {
      const result = await api.searchLocation({ keyword: keyword.trim() });
      setSearchResults(result.pois);
    } catch (error) {
      console.error('Search location error:', error);
      Alert.alert('提示', '搜索失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [keyword]);

  // 选择地点
  const handleSelectPoi = (poi: PoiItem) => {
    onSelect({
      address: poi.address ? `${poi.name} - ${poi.address}` : poi.name,
      latitude: poi.lat,
      longitude: poi.lng,
    });

    // 保存到最近使用
    const newRecent = [poi, ...recentLocations.filter(r => r.id !== poi.id)].slice(0, 5);
    setRecentLocations(newRecent);

    onClose();
  };

  // 初始化时获取当前位置
  useEffect(() => {
    if (visible && !currentLocation) {
      getCurrentLocation();
    }
  }, [visible, currentLocation, getCurrentLocation]);

  // 渲染搜索结果项
  const renderPoiItem = ({ item }: { item: PoiItem }) => (
    <TouchableOpacity style={styles.poiItem} onPress={() => handleSelectPoi(item)}>
      <View style={styles.poiIcon}>
        <Ionicons name="location" size={20} color={Colors.light.primary} />
      </View>
      <View style={styles.poiContent}>
        <Text style={styles.poiName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.poiAddress} numberOfLines={1}>
          {item.address}
        </Text>
      </View>
      {item.distance && (
        <Text style={styles.poiDistance}>{item.distance}m</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} disabled={Platform.OS === 'web'}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>选择地点</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={Colors.light.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={Colors.light.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="搜索地点"
                  placeholderTextColor={Colors.light.textMuted}
                  value={keyword}
                  onChangeText={setKeyword}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
                {keyword.length > 0 && (
                  <TouchableOpacity onPress={() => setKeyword('')}>
                    <Ionicons name="close-circle" size={18} color={Colors.light.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Text style={styles.searchButtonText}>搜索</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={renderPoiItem}
              style={styles.list}
              ListHeaderComponent={
                <>
                  {/* Current Location */}
                  <TouchableOpacity
                    style={styles.currentLocation}
                    onPress={getCurrentLocation}
                    disabled={isLocating}
                  >
                    <View style={styles.currentIcon}>
                      {isLocating ? (
                        <ActivityIndicator size="small" color={Colors.light.primary} />
                      ) : (
                        <Ionicons name="locate" size={22} color={Colors.light.primary} />
                      )}
                    </View>
                    <View style={styles.currentContent}>
                      <Text style={styles.currentLabel}>
                        {isLocating ? '正在定位...' : '使用当前位置'}
                      </Text>
                      {currentLocation && (
                        <Text style={styles.currentAddress} numberOfLines={1}>
                          {currentLocation.name}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.light.textMuted} />
                  </TouchableOpacity>

                  {/* Recent Locations */}
                  {recentLocations.length > 0 && !hasSearched && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>最近使用</Text>
                      {recentLocations.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.poiItem}
                          onPress={() => handleSelectPoi(item)}
                        >
                          <View style={styles.poiIcon}>
                            <Ionicons name="time" size={20} color={Colors.light.textSecondary} />
                          </View>
                          <View style={styles.poiContent}>
                            <Text style={styles.poiName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={styles.poiAddress} numberOfLines={1}>
                              {item.address}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Search Results Header */}
                  {hasSearched && (
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>
                        搜索结果 {searchResults.length > 0 && `(${searchResults.length})`}
                      </Text>
                    </View>
                  )}
                </>
              }
              ListEmptyComponent={
                hasSearched && !isLoading ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="search" size={48} color={Colors.light.textMuted} />
                    <Text style={styles.emptyText}>未找到相关地点</Text>
                    <Text style={styles.emptyHint}>请尝试其他关键词</Text>
                  </View>
                ) : null
              }
              ListFooterComponent={
                isLoading ? (
                  <View style={styles.loadingFooter}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                  </View>
                ) : null
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.light.backgroundDefault,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    maxHeight: '85%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.light.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: Colors.light.textPrimary,
    fontSize: 15,
    marginLeft: Spacing.sm,
    padding: 0,
  },
  searchButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  currentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  currentIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${Colors.light.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  currentContent: {
    flex: 1,
  },
  currentLabel: {
    color: Colors.light.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  currentAddress: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    paddingVertical: Spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.backgroundRoot,
  },
  sectionTitle: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  poiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  poiIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${Colors.light.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  poiContent: {
    flex: 1,
  },
  poiName: {
    color: Colors.light.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  poiAddress: {
    color: Colors.light.textSecondary,
    fontSize: 13,
  },
  poiDistance: {
    color: Colors.light.textMuted,
    fontSize: 12,
    marginLeft: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['5xl'],
  },
  emptyText: {
    color: Colors.light.textSecondary,
    fontSize: 16,
    marginTop: Spacing.md,
  },
  emptyHint: {
    color: Colors.light.textMuted,
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  loadingFooter: {
    paddingVertical: Spacing['2xl'],
  },
});
