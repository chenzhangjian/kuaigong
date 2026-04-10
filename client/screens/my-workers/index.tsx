import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import api from '@/utils/api';
import { formatBeijingDate } from '@/utils';

interface Worker {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  skills: string[];
  totalOrders: number;
  completedOrders: number;
  cooperationCount: number;
  lastOrderDate: string;
}

export default function MyWorkersScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadWorkers();
    }, [])
  );

  const loadWorkers = async () => {
    try {
      const data = await api.getMyWorkers();
      setWorkers(data);
    } catch (error) {
      console.error('Load workers error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWorkers();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return formatBeijingDate(dateStr);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FontAwesome6 key={i} name="star" size={12} color="#F39C12" solid />
      );
    }
    if (hasHalfStar && stars.length < 5) {
      stars.push(
        <FontAwesome6 key="half" name="star-half-stroke" size={12} color="#F39C12" />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>我的工人</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{workers.length}</Text>
            <Text style={styles.statLabel}>合作工人</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {workers.reduce((sum, w) => sum + w.cooperationCount, 0)}
            </Text>
            <Text style={styles.statLabel}>合作次数</Text>
          </View>
        </View>

        {/* Worker List */}
        {workers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="users" size={48} color={theme.textMuted} />
            <Text style={styles.emptyText}>暂无合作工人</Text>
            <Text style={styles.emptyHint}>发布任务后会在这里显示合作过的工人</Text>
          </View>
        ) : (
          workers.map((worker) => (
            <TouchableOpacity key={worker.id} style={styles.workerCard}>
              <View style={styles.workerHeader}>
                <View style={styles.workerAvatar}>
                  {worker.avatar ? (
                    <Image source={{ uri: worker.avatar }} style={styles.avatarImage} />
                  ) : (
                    <FontAwesome6 name="user" size={24} color={theme.primary} />
                  )}
                </View>
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <View style={styles.ratingContainer}>
                    {renderStars(worker.rating)}
                    <Text style={styles.ratingText}>{worker.rating.toFixed(1)}</Text>
                  </View>
                </View>
                <View style={styles.orderCount}>
                  <Text style={styles.orderCountValue}>{worker.cooperationCount}</Text>
                  <Text style={styles.orderCountLabel}>合作次数</Text>
                </View>
              </View>

              {worker.skills && worker.skills.length > 0 && (
                <View style={styles.skillContainer}>
                  {worker.skills.slice(0, 4).map((skill, index) => (
                    <View key={index} style={styles.skillTag}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.workerFooter}>
                <Text style={styles.lastOrderText}>
                  最近合作：{formatDate(worker.lastOrderDate)}
                </Text>
                <TouchableOpacity style={styles.contactButton}>
                  <Ionicons name="chatbubble-outline" size={16} color={theme.primary} />
                  <Text style={styles.contactText}>联系</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
