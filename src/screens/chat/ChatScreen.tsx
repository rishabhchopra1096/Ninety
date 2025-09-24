import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { generateAPIUrl } from '../../utils';

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Log the API URL being used
  const apiUrl = generateAPIUrl('/api/chat');
  console.log('🔗 Chat API URL:', apiUrl);

  // Log state changes
  useEffect(() => {
    console.log('📝 Messages updated:', messages.length, 'messages');
    console.log('🔄 Loading state:', isLoading);
    if (error) {
      console.log('❌ Current error:', error.message);
    }
  }, [messages, isLoading, error]);

  // Manual chat implementation that works with Expo API routes
  const sendMessage = async (content: string) => {
    const userMessage = { id: Date.now().toString(), role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      console.log('📤 Sending message:', content);
      console.log('🔗 Using API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the JSON response (not streaming)
      const data = await response.json();
      console.log('📥 Received response data:', data);
      
      if (!data.message) {
        throw new Error('No message in response');
      }

      const assistantMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: data.message
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      console.log('✅ Message completed');
    } catch (error) {
      console.error('❌ Send message error:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Test API connectivity
  const testAPIConnection = async () => {
    console.log('🧪 Testing API connection...');
    await sendMessage('Hello, this is a test message');
  };

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  const renderMessage = (message: any, index: number) => {
    const isUser = message.role === 'user';
    
    return (
      <View 
        key={message.id || index} 
        style={[
          styles.messageContainer, 
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer
        ]}
      >
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.assistantMessageBubble
        ]}>
          <Text 
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText
            ]}
          >
            {message.content}
          </Text>
        </View>
      </View>
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Chat Error: {error.message}</Text>
          <Text style={styles.errorSubtext}>
            Make sure you've added your OpenAI API key to .env.local
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat with Ava</Text>
          <Text style={styles.headerSubtitle}>Your AI Fitness Coach</Text>
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={testAPIConnection}
          >
            <Text style={styles.testButtonText}>🧪 Test API</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView 
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>👋 Hi! I'm Ava, your AI fitness coach.</Text>
              <Text style={styles.welcomeSubtext}>
                I'm here to help you with your 90-day transformation journey. Ask me about:
              </Text>
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestion}>• Workout planning & progression</Text>
                <Text style={styles.suggestion}>• Nutrition & calorie calculations</Text>
                <Text style={styles.suggestion}>• Progress tracking & measurements</Text>
                <Text style={styles.suggestion}>• Motivation & accountability</Text>
              </View>
            </View>
          ) : (
            messages.map(renderMessage)
          )}
          
          {isLoading && (
            <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
              <View style={[styles.messageBubble, styles.assistantMessageBubble]}>
                <Text style={styles.loadingText}>Ava is typing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask Ava anything about fitness..."
              placeholderTextColor={colors.textSecondary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                (!input.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Text style={[
                styles.sendButtonText,
                (!input.trim() || isLoading) && styles.sendButtonTextDisabled
              ]}>
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.background,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.background,
    opacity: 0.9,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  welcomeContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  welcomeText: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  welcomeSubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  suggestionsContainer: {
    alignSelf: 'stretch',
  },
  suggestion: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  messageContainer: {
    marginBottom: spacing.md,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  userMessageBubble: {
    backgroundColor: colors.primary,
  },
  assistantMessageBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    ...typography.body,
    lineHeight: 20,
  },
  userMessageText: {
    color: colors.background,
  },
  assistantMessageText: {
    color: colors.text,
  },
  toolResultContainer: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.sm,
  },
  toolResultText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  toolResultData: {
    ...typography.small,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  sendButtonText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  sendButtonTextDisabled: {
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.h3,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  errorSubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  testButtonText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
});