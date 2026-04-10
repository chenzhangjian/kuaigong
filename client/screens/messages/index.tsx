import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';

export default function MessagesScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>消息</Text>
        </View>
        <View style={styles.emptyContainer}>
          <FontAwesome6
            name="message"
            size={48}
            color={theme.textMuted}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyText}>暂无消息</Text>
        </View>
      </View>
    </Screen>
  );
}
