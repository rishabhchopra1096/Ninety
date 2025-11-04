import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, TextInput, ScrollView, KeyboardAvoidingView, Animated, Dimensions, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { generateAPIUrl } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';
import { saveMessage, loadChatHistory } from '../../services/chatService';
import { Avatar, IconButton } from '../../components';

const { width } = Dimensions.get('window');

// Message interface for our custom chat
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Voice recording state
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // Attachment modal state
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  // Log the API URL being used (memoized to prevent re-renders)
  const apiUrl = useMemo(() => {
    const url = generateAPIUrl('/api/chat');
    console.log('🔗 Chat API URL:', url);
    return url;
  }, []);

  // Load chat history on mount
  useEffect(() => {
    const initializeChat = async () => {
      if (!user) {
        console.log('⚠️ No user logged in');
        setLoading(false);
        return;
      }

      try {
        console.log('📚 Loading chat history for user:', user.uid);
        const history = await loadChatHistory(user.uid);

        if (history.length === 0) {
          // No history - show welcome message
          const welcomeMessage: ChatMessage = {
            id: 'welcome',
            role: 'assistant',
            content: "👋 Hi! I'm Ava, your AI fitness coach.\n\nI'm here to help you with your 90-day transformation journey. Ask me about:\n\n• Workout planning & progression\n• Nutrition & calorie calculations\n• Progress tracking & measurements\n• Motivation & accountability",
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);

          // Save welcome message to Firestore
          await saveMessage(user.uid, welcomeMessage);
        } else {
          // Load existing history
          setMessages(history);
        }
      } catch (error) {
        console.error('❌ Error loading chat history:', error);
        // Show error but don't block - user can still use chat
        Alert.alert('Error', 'Could not load chat history. Starting fresh.');

        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: "👋 Hi! I'm Ava, your AI fitness coach.\n\nI'm here to help you with your 90-day transformation journey. Ask me about:\n\n• Workout planning & progression\n• Nutrition & calorie calculations\n• Progress tracking & measurements\n• Motivation & accountability",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [user]);

  // Initialize audio mode for recording (iOS requirement)
  useEffect(() => {
    const setupAudioMode = async () => {
      try {
        console.log('🔊 Configuring audio mode for recording...');
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          interruptionMode: 'duckOthers',
        });
        console.log('✅ Audio mode configured successfully');
      } catch (error) {
        console.error('❌ Failed to configure audio mode:', error);
      }
    };

    setupAudioMode();
  }, []); // Run once on mount

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
          messages: apiMessages,
          userId: user?.uid || 'anonymous', // Send userId for function calling
          recentMealsContext: [], // Will be populated later when we fetch from Firestore
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

      // Save Ava's response to Firestore
      if (user) {
        try {
          await saveMessage(user.uid, avaMessage);
        } catch (error) {
          console.error('❌ Error saving Ava message to Firestore:', error);
          // Don't block user experience if save fails
        }
      }

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
  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping || !user) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately to UI
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');

    // Save user message to Firestore
    try {
      await saveMessage(user.uid, userMessage);
    } catch (error) {
      console.error('❌ Error saving user message to Firestore:', error);
      // Don't block user experience if save fails
    }

    // Send to API
    sendToAPI(userMessage);
  }, [input, isTyping, user, sendToAPI]);

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

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      console.log('🎙️ Requesting audio permission...');

      // Request permissions
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      console.log('📝 Permission response:', permission);

      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow microphone access to record voice messages');
        return;
      }

      console.log('✅ Permission granted, preparing recorder...');

      // CRITICAL: Prepare the recorder before recording
      await audioRecorder.prepareToRecordAsync();
      console.log('✅ Recorder prepared, starting recording...');

      // Start recording (synchronous - no await needed)
      audioRecorder.record();
      console.log('✅ Recording started successfully');

      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('❌ Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      console.log('🛑 Stopping recording...');
      setIsRecording(false);

      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      // Stop recording (returns void)
      await audioRecorder.stop();
      console.log('✅ Recording stopped');

      // Access URI from the recorder property, not return value
      const recordingUri = audioRecorder.uri;
      console.log('🎵 Recording URI:', recordingUri);

      if (!recordingUri) {
        console.error('❌ No recording URI available');
        setRecordingDuration(0);
        setIsTranscribing(false);
        setInput('');
        Alert.alert('Error', 'Recording failed - no audio file created');
        return;
      }

      // Set transcribing state and show placeholder in input
      setIsTranscribing(true);
      setInput('Transcribing...');
      setRecordingDuration(0);

      // Send to transcription API
      await transcribeAudio(recordingUri);

    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
      setRecordingDuration(0);
      setIsTranscribing(false);
      setInput('');
    }
  };

  // Transcribe audio using OpenAI Whisper
  const transcribeAudio = async (audioUri: string) => {
    try {
      console.log('🎙️ Starting transcription for:', audioUri);

      // Create form data for the audio file
      const formData = new FormData();

      // Use React Native's FormData file format (not Blob)
      // This ensures proper metadata is sent to multer on the server
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      const transcriptionUrl = generateAPIUrl('/api/transcribe');
      console.log('📡 Sending to transcription API:', transcriptionUrl);

      const transcriptionResponse = await fetch(transcriptionUrl, {
        method: 'POST',
        body: formData,
      });

      if (!transcriptionResponse.ok) {
        // Get full error response to see what's failing on server
        const errorText = await transcriptionResponse.text();
        console.error('❌ Server error response:', errorText);
        console.error('❌ Status code:', transcriptionResponse.status);
        console.error('❌ Status text:', transcriptionResponse.statusText);
        throw new Error(`Transcription API error: ${transcriptionResponse.status} - ${errorText}`);
      }

      const transcriptionData = await transcriptionResponse.json();
      console.log('📝 Transcription received:', transcriptionData.transcription);

      // Put transcribed text in input field for user to review/edit
      setInput(transcriptionData.transcription);

    } catch (error) {
      console.error('❌ Transcription error:', error);

      // Clear input field on error
      setInput('');

      Alert.alert(
        'Transcription Failed',
        'Could not process your voice message. Please try again or type your message instead.'
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  // Image/Camera Functions
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const requestMediaPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  const pickImage = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permission required', 'Please allow photo library access to select images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageMessage: ChatMessage = {
          id: `image_${Date.now()}`,
          role: 'user',
          content: `📸 Image attached - Image processing not yet implemented`,
          timestamp: new Date(),
        };

        setMessages(prevMessages => [...prevMessages, imageMessage]);
        setShowAttachmentModal(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const hasPermission = await requestMediaPermission();
      if (!hasPermission) {
        Alert.alert('Permission required', 'Please allow camera access to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const photoMessage: ChatMessage = {
          id: `photo_${Date.now()}`,
          role: 'user',
          content: `📸 Photo taken - Image processing not yet implemented`,
          timestamp: new Date(),
        };

        setMessages(prevMessages => [...prevMessages, photoMessage]);
        setShowAttachmentModal(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

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
          <Avatar
            initials="AI"
            size="md"
            backgroundColor={colors.primary}
          />
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

  // Loading display
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your conversation...</Text>
        </View>
      </View>
    );
  }

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
                <Avatar
                  initials="AI"
                  size="md"
                  backgroundColor={colors.secondary}
                  style={styles.headerAvatar}
                />
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
              <Avatar
                initials="AI"
                size="md"
                backgroundColor={colors.primary}
              />
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
          {/* Voice Recording Overlay */}
          {isRecording && (
            <View style={styles.recordingOverlay}>
              <View style={styles.recordingContent}>
                <View style={styles.recordingIndicator}>
                  <View style={[styles.recordingDot, { backgroundColor: '#ff4444' }]} />
                  <Text style={styles.recordingText}>Recording...</Text>
                  <Text style={styles.recordingDuration}>
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </Text>
                </View>
                <TouchableOpacity style={styles.stopRecordingButton} onPress={stopRecording}>
                  <Text style={styles.stopRecordingText}>⏹️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              {/* Attachment Button */}
              <TouchableOpacity
                style={styles.attachButton}
                onPress={() => setShowAttachmentModal(true)}
                disabled={isRecording}
              >
                <Text style={styles.attachButtonText}>📎</Text>
              </TouchableOpacity>

              {/* Text Input */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    isRecording ? "Recording..." :
                    isTranscribing ? "Transcribing..." :
                    "Message Ava..."
                  }
                  placeholderTextColor={colors.neutral[500]}
                  value={input}
                  onChangeText={setInput}
                  multiline
                  maxLength={500}
                  editable={!isTyping && !isRecording && !isTranscribing}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />
              </View>

              {/* Voice/Send Button */}
              {input.trim() || isTyping ? (
                <TouchableOpacity
                  style={[
                    styles.sendButtonModern,
                    (!input.trim() || isTyping || isTranscribing) && styles.sendButtonDisabled
                  ]}
                  onPress={handleSend}
                  disabled={!input.trim() || isTyping || isRecording || isTranscribing}
                >
                  <Text style={styles.sendButtonIcon}>
                    {isTyping || isTranscribing ? "⏳" : "➤"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.voiceButton,
                    isRecording && styles.voiceButtonRecording
                  ]}
                  onPress={isRecording ? stopRecording : startRecording}
                  disabled={isTyping || isTranscribing}
                >
                  <Text style={[
                    styles.voiceButtonIcon,
                    isRecording && styles.voiceButtonIconRecording
                  ]}>
                    🎙️
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>

        {/* Attachment Modal */}
        <Modal
          visible={showAttachmentModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAttachmentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalBackdrop}
              onPress={() => setShowAttachmentModal(false)}
            />
            <View style={styles.attachmentModal}>
              <View style={styles.modalHandle} />
              
              <Text style={styles.modalTitle}>Add to your message</Text>
              
              <View style={styles.attachmentOptions}>
                <TouchableOpacity style={styles.attachmentOption} onPress={takePhoto}>
                  <View style={[styles.attachmentIconContainer, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.attachmentIcon}>📷</Text>
                  </View>
                  <Text style={styles.attachmentLabel}>Camera</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.attachmentOption} onPress={pickImage}>
                  <View style={[styles.attachmentIconContainer, { backgroundColor: '#2196F3' }]}>
                    <Text style={styles.attachmentIcon}>🖼️</Text>
                  </View>
                  <Text style={styles.attachmentLabel}>Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.attachmentOption} 
                  onPress={() => {
                    setShowAttachmentModal(false);
                    startRecording();
                  }}
                >
                  <View style={[styles.attachmentIconContainer, { backgroundColor: '#FF9800' }]}>
                    <Text style={styles.attachmentIcon}>🎙️</Text>
                  </View>
                  <Text style={styles.attachmentLabel}>Voice</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[100],
  },

  // Modern Header Styles
  headerContainer: {
    backgroundColor: colors.primary,
    ...shadows.sm,
    elevation: 4,
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
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
  headerAvatar: {
    marginRight: spacing[4],
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
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
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
    backgroundColor: colors.neutral[100],
  },
  messagesContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  
  // Message Row Layout
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing[4],
    paddingHorizontal: spacing[1],
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  assistantMessageRow: {
    justifyContent: 'flex-start',
  },
  
  // Message Bubble Styles
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 18,
    ...shadows.sm,
    elevation: 2,
  },
  userMessageBubble: {
    backgroundColor: colors.primary,
    marginLeft: spacing[6],
  },
  assistantMessageBubble: {
    backgroundColor: colors.background,
    marginRight: spacing[6],
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
    borderColor: colors.neutral[200],
  },
  
  // Message Text Styles
  messageText: {
    ...typography.body,
    lineHeight: 22,
    fontSize: 16,
    marginBottom: spacing[1],
  },
  userMessageText: {
    color: colors.background,
  },
  assistantMessageText: {
    color: colors.primary,
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
    color: colors.neutral[500],
    textAlign: 'left',
  },
  
  // Message Spacer for Alignment
  messageSpacer: {
    width: 45, // Same as avatar width + margin
  },
  
  // Typing Indicator Styles
  typingBubble: {
    paddingVertical: spacing[4],
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[500],
    marginRight: 4,
    // Add subtle animation (would need Animated.View in real implementation)
    opacity: 0.6,
  },
  typingText: {
    ...typography.caption,
    color: colors.neutral[500],
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
    borderTopColor: colors.neutral[200],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 44,
  },

  // Attachment Button
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
    marginBottom: 4,
  },
  attachButtonText: {
    fontSize: 16,
    opacity: 0.8,
  },
  
  // Text Input Wrapper
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 22,
    paddingHorizontal: spacing[4],
    paddingVertical: Platform.OS === 'ios' ? spacing[3] : 2,
    marginRight: spacing[2],
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
  },
  textInput: {
    ...typography.body,
    color: colors.primary,
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
    backgroundColor: colors.neutral[400],
    opacity: 0.6,
  },
  sendButtonIcon: {
    fontSize: 16,
    color: colors.background,
    fontWeight: 'bold',
  },
  
  // Voice Button Styles
  voiceButton: {
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
  voiceButtonRecording: {
    backgroundColor: '#ff4444',
    transform: [{ scale: 1.1 }],
  },
  voiceButtonIcon: {
    fontSize: 16,
  },
  voiceButtonIconRecording: {
    fontSize: 18,
  },
  
  // Voice Recording Overlay Styles
  recordingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    zIndex: 1000,
  },
  recordingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing[2],
  },
  recordingText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '600',
    marginRight: spacing[4],
  },
  recordingDuration: {
    ...typography.body,
    color: colors.background,
    fontWeight: '500',
  },
  stopRecordingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopRecordingText: {
    fontSize: 20,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  attachmentModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[8],
    minHeight: 200,
    ...shadows.sm,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral[400],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing[6],
  },
  modalTitle: {
    ...typography.h3,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing[8],
    fontWeight: '600',
  },
  attachmentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing[4],
  },
  attachmentOption: {
    alignItems: 'center',
    minWidth: 80,
  },
  attachmentIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
    ...shadows.sm,
    elevation: 2,
  },
  attachmentIcon: {
    fontSize: 24,
  },
  attachmentLabel: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: spacing[4],
  },

  // Error Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.h3,
    color: colors.status.error,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  errorSubtext: {
    ...typography.body,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  retryButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '600',
  },
});