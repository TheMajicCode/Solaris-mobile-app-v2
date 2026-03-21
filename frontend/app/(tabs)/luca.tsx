import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Message {
  message_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const suggestedPrompts = [
  "Explain my vitality score",
  "What should I focus on?",
  "Suggest a morning routine",
  "How can I improve sleep?",
  "Recommend a practitioner",
];

export default function LucaScreen() {
  const { sessionToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/luca/history`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setMessages(data);
          setSessionId(data[0].session_id);
        }
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || loading) return;

    setInputText('');
    const tempId = `temp_${Date.now()}`;
    const userMessage: Message = {
      message_id: tempId,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/luca/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          message: messageText,
          session_id: sessionId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        const assistantMessage: Message = {
          message_id: `msg_${Date.now()}`,
          role: 'assistant',
          content: data.response,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.lucaAvatar}>
            <Ionicons name="sparkles" size={24} color={Colors.deepNavy} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>LUCA</Text>
            <Text style={styles.headerSubtitle}>Your Wellness Guide</Text>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.mediumGray} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeIcon}>
                <Ionicons name="sparkles" size={40} color={Colors.emerald} />
              </View>
              <Text style={styles.welcomeTitle}>Hello! I'm LUCA</Text>
              <Text style={styles.welcomeText}>
                I'm your holistic wellness guide. I can help you understand your health scores, suggest routines, and recommend practitioners. How can I support you today?
              </Text>
              
              <Text style={styles.promptsLabel}>Try asking me:</Text>
              <View style={styles.promptsContainer}>
                {suggestedPrompts.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.promptChip}
                    onPress={() => sendMessage(prompt)}
                  >
                    <Text style={styles.promptText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <>
              {messages.map((message) => (
                <View
                  key={message.message_id}
                  style={[
                    styles.messageBubble,
                    message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  {message.role === 'assistant' && (
                    <View style={styles.assistantAvatar}>
                      <Ionicons name="sparkles" size={14} color={Colors.deepNavy} />
                    </View>
                  )}
                  <View style={[
                    styles.messageContent,
                    message.role === 'user' ? styles.userContent : styles.assistantContent,
                  ]}>
                    <Text style={[
                      styles.messageText,
                      message.role === 'user' && styles.userMessageText,
                    ]}>
                      {message.content}
                    </Text>
                  </View>
                </View>
              ))}
              {loading && (
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <View style={styles.assistantAvatar}>
                    <Ionicons name="sparkles" size={14} color={Colors.deepNavy} />
                  </View>
                  <View style={[styles.messageContent, styles.assistantContent]}>
                    <ActivityIndicator size="small" color={Colors.emerald} />
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Quick Prompts (when there are messages) */}
        {messages.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.quickPrompts}
            contentContainerStyle={styles.quickPromptsContent}
          >
            {suggestedPrompts.slice(0, 3).map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickPromptChip}
                onPress={() => sendMessage(prompt)}
              >
                <Text style={styles.quickPromptText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask LUCA anything..."
            placeholderTextColor={Colors.mediumGray}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons name="send" size={20} color={inputText.trim() && !loading ? Colors.deepNavy : Colors.mediumGray} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.midnightBlue,
  },
  lucaAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
  menuButton: {
    padding: Spacing.sm,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  welcomeText: {
    fontSize: 15,
    color: Colors.lightGray,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  promptsLabel: {
    fontSize: 13,
    color: Colors.mediumGray,
    marginBottom: Spacing.md,
  },
  promptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  promptChip: {
    backgroundColor: Colors.midnightBlue,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.darkBlue,
  },
  promptText: {
    fontSize: 13,
    color: Colors.lightGray,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  assistantBubble: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 4,
  },
  messageContent: {
    maxWidth: '80%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  userContent: {
    backgroundColor: Colors.emerald,
    marginLeft: 'auto',
  },
  assistantContent: {
    backgroundColor: Colors.midnightBlue,
  },
  messageText: {
    fontSize: 15,
    color: Colors.lightGray,
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.deepNavy,
  },
  quickPrompts: {
    maxHeight: 50,
    borderTopWidth: 1,
    borderTopColor: Colors.midnightBlue,
  },
  quickPromptsContent: {
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  quickPromptChip: {
    backgroundColor: Colors.midnightBlue,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
  },
  quickPromptText: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: Colors.midnightBlue,
    backgroundColor: Colors.deepNavy,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.white,
    maxHeight: 100,
    marginRight: Spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.midnightBlue,
  },
});
