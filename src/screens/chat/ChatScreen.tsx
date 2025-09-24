import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, TextInput, ScrollView, KeyboardAvoidingView, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { generateAPIUrl } from '../../utils';

const { width } = Dimensions.get('window');

// Message interface for our custom chat
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Log the API URL being used
  const apiUrl = generateAPIUrl('/api/chat');
  console.log('🔗 Chat API URL:', apiUrl);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hi! I'm Ava, your AI fitness coach.\n\nI'm here to help you with your 90-day transformation journey. Ask me about:\n\n• Workout planning & progression\n• Nutrition & calorie calculations\n• Progress tracking & measurements\n• Motivation & accountability",
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  // Convert chat messages to API format
  const convertMessagesToAPIFormat = useCallback((chatMessages: ChatMessage[]) => {
    return chatMessages
      .filter(msg => msg.id !== 'welcome') // Exclude welcome message from API calls
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
  }, []);

  // Send message to API
  const sendToAPI = useCallback(async (userMessage: ChatMessage) => {
    setIsTyping(true);
    setError(null);

    try {
      console.log('📤 Sending message to API:', userMessage.content);
      console.log('🔗 Using API URL:', apiUrl);
      
      const apiMessages = convertMessagesToAPIFormat([...messages, userMessage]);
      console.log('📋 API Messages:', apiMessages);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Received response data:', data);
      
      if (!data.message) {
        throw new Error('No message in response');
      }

      // Create Ava's response message
      const avaMessage: ChatMessage = {
        id: `ava_${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      // Add Ava's response to messages
      setMessages(prevMessages => [...prevMessages, avaMessage]);

      console.log('✅ Message completed');
    } catch (error) {
      console.error('❌ Send message error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(error instanceof Error ? error : new Error('Unknown error'));
      
      // Show error message as system message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMsg}. Please try again.`,
        timestamp: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [apiUrl, convertMessagesToAPIFormat, messages]);

  // Handle sending messages
  const handleSend = useCallback(() => {
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    // Add user message immediately to UI
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');

    // Send to API
    sendToAPI(userMessage);
  }, [input, isTyping, sendToAPI]);

  // Test API connection
  const testAPIConnection = useCallback(async () => {
    console.log('🧪 Testing API connection...');
    
    const testMessage: ChatMessage = {
      id: `test_${Date.now()}`,
      role: 'user',
      content: 'Hello, this is a test message',
      timestamp: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, testMessage]);
    await sendToAPI(testMessage);
  }, [sendToAPI]);

  // Render individual message with modern styling
  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    
    return (
      <Animated.View 
        key={message.id} 
        style={[
          styles.messageRow, 
          isUser ? styles.userMessageRow : styles.assistantMessageRow
        ]}
      >
        {/* Avatar for Ava */}
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
        )}
        
        {/* Message Bubble */}
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.assistantMessageBubble,
          // Add tail for speech bubble effect
          isUser ? styles.userBubbleTail : styles.assistantBubbleTail
        ]}>
          {/* Message Content */}
          <Text 
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText
            ]}
          >
            {message.content}
          </Text>
          
          {/* Timestamp */}
          <Text style={[
            styles.timestampText,
            isUser ? styles.userTimestampText : styles.assistantTimestampText
          ]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Spacer for user messages to push them right */}
        {isUser && <View style={styles.messageSpacer} />}
      </Animated.View>
    );
  };

  // Error display
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Chat Error: {error.message}</Text>
          <Text style={styles.errorSubtext}>
            Make sure you've added your OpenAI API key to .env.local
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => setError(null)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modern Header with Gradient-like Effect */}
      <View style={styles.headerContainer}>
        <SafeAreaView>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.headerAvatarContainer}>
                  <Text style={styles.headerAvatarText}>🤖</Text>
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>Ava</Text>
                  <Text style={styles.headerSubtitle}>Your AI Fitness Coach</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.testButton} 
                onPress={testAPIConnection}
              >
                <Text style={styles.testButtonText}>🧪</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Chat Messages Area */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(renderMessage)}
          
          {/* Typing Indicator */}
          {isTyping && (
            <Animated.View style={[styles.messageRow, styles.assistantMessageRow]}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>🤖</Text>
              </View>
              <View style={[styles.messageBubble, styles.assistantMessageBubble, styles.typingBubble]}>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, { animationDelay: 0 }]} />
                  <View style={[styles.typingDot, { animationDelay: 0.2 }]} />
                  <View style={[styles.typingDot, { animationDelay: 0.4 }]} />
                </View>
                <Text style={styles.typingText}>Ava is thinking...</Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Modern Input Bar */}
        <SafeAreaView style={styles.inputSafeArea}>
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              {/* Future: Voice/Camera buttons */}
              <TouchableOpacity style={styles.attachButton} disabled>
                <Text style={styles.attachButtonText}>📎</Text>
              </TouchableOpacity>
              
              {/* Text Input */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Message Ava..."
                  placeholderTextColor={colors.textSecondary}
                  value={input}
                  onChangeText={setInput}
                  multiline
                  maxLength={500}
                  editable={!isTyping}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />
              </View>
              
              {/* Send Button */}
              <TouchableOpacity 
                style={[
                  styles.sendButtonModern, 
                  (!input.trim() || isTyping) && styles.sendButtonDisabled
                ]}
                onPress={handleSend}
                disabled={!input.trim() || isTyping}
              >
                <Text style={styles.sendButtonIcon}>
                  {isTyping ? "⏳" : "➤"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5', // WhatsApp-like background
  },
  
  // Modern Header Styles
  headerContainer: {
    backgroundColor: colors.primary,
    ...shadows.sm,
    elevation: 4,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerAvatarText: {
    fontSize: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.background,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.background,
    opacity: 0.9,
    fontSize: 13,
  },
  testButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    minWidth: 40,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 16,
  },
  
  // Chat Area Styles
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  
  // Message Row Layout
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  assistantMessageRow: {
    justifyContent: 'flex-start',
  },
  
  // Avatar Styles
  avatarContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  avatarText: {
    fontSize: 18,
  },
  
  // Message Bubble Styles
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 18,
    ...shadows.sm,
    elevation: 2,
  },
  userMessageBubble: {
    backgroundColor: colors.primary,
    marginLeft: spacing.lg,
  },
  assistantMessageBubble: {
    backgroundColor: colors.background,
    marginRight: spacing.lg,
  },
  
  // Speech Bubble Tails
  userBubbleTail: {
    // Add slight shadow for depth
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  assistantBubbleTail: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  
  // Message Text Styles
  messageText: {
    ...typography.body,
    lineHeight: 22,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  userMessageText: {
    color: colors.background,
  },
  assistantMessageText: {
    color: colors.text,
  },
  
  // Timestamp Styles
  timestampText: {
    ...typography.small,
    fontSize: 11,
    opacity: 0.7,
    marginTop: 2,
  },
  userTimestampText: {
    color: colors.background,
    textAlign: 'right',
  },
  assistantTimestampText: {
    color: colors.textSecondary,
    textAlign: 'left',
  },
  
  // Message Spacer for Alignment
  messageSpacer: {
    width: 45, // Same as avatar width + margin
  },
  
  // Typing Indicator Styles
  typingBubble: {
    paddingVertical: spacing.md,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
    marginRight: 4,
    // Add subtle animation (would need Animated.View in real implementation)
    opacity: 0.6,
  },
  typingText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontSize: 13,
  },
  
  // Modern Input Area Styles
  inputSafeArea: {
    backgroundColor: colors.background,
  },
  inputContainer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 44,
  },
  
  // Attachment Button (Future use)
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginBottom: 4,
  },
  attachButtonText: {
    fontSize: 16,
    opacity: 0.3, // Disabled state
  },
  
  // Text Input Wrapper
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : 2,
    marginRight: spacing.sm,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
  },
  textInput: {
    ...typography.body,
    color: colors.text,
    fontSize: 16,
    lineHeight: 20,
    textAlignVertical: 'center',
  },
  
  // Modern Send Button
  sendButtonModern: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...shadows.sm,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#c7c7cc',
    opacity: 0.6,
  },
  sendButtonIcon: {
    fontSize: 16,
    color: colors.background,
    fontWeight: 'bold',
  },
  
  // Error Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
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
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  retryButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '600',
  },
});