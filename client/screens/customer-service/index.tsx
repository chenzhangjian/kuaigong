/**
 * 客服聊天页面
 * 支持与AI机器人实时对话
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import RNSSE from 'react-native-sse';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import { formatBeijingTime } from '@/utils';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface Message {
  id: number | string;
  content: string;
  senderType: 'user' | 'bot';
  createdAt: string;
}

// 快捷问题
const QUICK_QUESTIONS = [
  '如何发布任务？',
  '如何接单赚钱？',
  '怎么提现？',
  '遇到纠纷怎么办？',
];

export default function CustomerServiceScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const scrollViewRef = useRef<ScrollView>(null);
  const eventSourceRef = useRef<RNSSE | null>(null);

  // 加载历史消息
  useEffect(() => {
    loadMessages();
  }, []);

  // 滚动到底部
  useEffect(() => {
    if (messages.length > 0 || streamingContent) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, streamingContent]);

  const loadMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${BASE_URL}/api/v1/customer-service/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;

    const messageText = text.trim();
    setInputText('');
    setSending(true);

    // 立即显示用户消息
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageText,
      senderType: 'user',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    // 显示机器人正在输入
    setBotTyping(true);
    setStreamingContent('');

    try {
      const token = await AsyncStorage.getItem('auth_token');

      // 使用 SSE 流式接收
      const url = `${BASE_URL}/api/v1/customer-service/chat`;
      const eventSource = new RNSSE(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: messageText }),
        method: 'POST',
      });

      eventSourceRef.current = eventSource;

      let fullContent = '';

      eventSource.addEventListener('message', (event) => {
        if (event.data === '[DONE]') {
          // 流结束，添加完整消息
          setBotTyping(false);
          setStreamingContent('');

          if (fullContent) {
            const botMessage: Message = {
              id: `bot-${Date.now()}`,
              content: fullContent,
              senderType: 'bot',
              createdAt: new Date().toISOString(),
            };
            setMessages(prev => [...prev, botMessage]);
          }

          eventSource.close();
          setSending(false);
          return;
        }

        try {
          if (event.data) {
            const data = JSON.parse(event.data);
            if (data.content) {
              fullContent += data.content;
              setStreamingContent(fullContent);
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      });

      eventSource.addEventListener('error', (event) => {
        console.error('SSE error:', event);
        setBotTyping(false);
        setStreamingContent('');
        setSending(false);
        eventSource.close();

        // 回退到非流式API
        fallbackToSyncApi(messageText, token);
      });

    } catch (error) {
      console.error('Send message error:', error);
      setBotTyping(false);
      setStreamingContent('');
      setSending(false);
      Alert.alert('错误', '发送消息失败，请重试');
    }
  };

  // 回退到非流式API
  const fallbackToSyncApi = async (messageText: string, token: string | null) => {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/customer-service/chat-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          content: data.botResponse,
          senderType: 'bot',
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Fallback API error:', error);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      '清除聊天记录',
      '确定要清除所有聊天记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth_token');
              const response = await fetch(`${BASE_URL}/api/v1/customer-service/messages`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (response.ok) {
                setMessages([]);
              }
            } catch (error) {
              Alert.alert('错误', '清除失败');
            }
          },
        },
      ]
    );
  };

  const formatTime = (dateStr: string): string => {
    return formatBeijingTime(dateStr, 'HH:mm');
  };

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
        <View style={styles.container}>
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 100 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>在线客服</Text>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearHistory}>
            <Text style={styles.clearButtonText}>清除</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && !botTyping ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <FontAwesome6 name="robot" size={64} color={theme.primary} />
              </View>
              <Text style={styles.emptyTitle}>智能客服助手</Text>
              <Text style={styles.emptyText}>
                您好！我是快工平台的智能客服，有什么可以帮您的吗？
              </Text>

              {/* 快捷问题 */}
              <View style={styles.quickActions}>
                {QUICK_QUESTIONS.map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickActionButton}
                    onPress={() => sendMessage(question)}
                  >
                    <Text style={styles.quickActionText}>{question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <>
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageWrapper,
                    message.senderType === 'user'
                      ? styles.userMessageWrapper
                      : styles.botMessageWrapper,
                  ]}
                >
                  {message.senderType === 'bot' && (
                    <View style={styles.senderInfo}>
                      <FontAwesome6 name="robot" size={14} color={theme.primary} />
                      <Text style={styles.senderName}>客服助手</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      message.senderType === 'user' ? styles.userMessage : styles.botMessage,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.senderType === 'user'
                          ? styles.userMessageText
                          : styles.botMessageText,
                      ]}
                    >
                      {message.content}
                    </Text>
                  </View>
                  <Text style={styles.timeText}>{formatTime(message.createdAt)}</Text>
                </View>
              ))}

              {/* 流式输出中的消息 */}
              {botTyping && streamingContent && (
                <View style={[styles.messageWrapper, styles.botMessageWrapper]}>
                  <View style={styles.senderInfo}>
                    <FontAwesome6 name="robot" size={14} color={theme.primary} />
                    <Text style={styles.senderName}>客服助手</Text>
                  </View>
                  <View style={[styles.messageBubble, styles.botMessage]}>
                    <Text style={[styles.messageText, styles.botMessageText]}>
                      {streamingContent}
                    </Text>
                  </View>
                </View>
              )}

              {/* 正在输入指示器 */}
              {botTyping && !streamingContent && (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={styles.typingText}>正在输入...</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="输入您的问题..."
            placeholderTextColor={theme.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || sending}
          >
            <FontAwesome6 name="paper-plane" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
