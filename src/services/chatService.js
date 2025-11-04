import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Save a message to Firestore
 * @param {string} userId - The user's ID
 * @param {Object} message - The message object with role, content, timestamp
 * @returns {Promise<string>} The saved message ID
 */
export const saveMessage = async (userId, message) => {
  try {
    const messagesRef = collection(db, 'conversations', userId, 'messages');

    const messageData = {
      role: message.role,
      content: message.content,
      timestamp: Timestamp.fromDate(message.timestamp || new Date()),
      createdAt: Timestamp.fromDate(new Date()),
    };

    const docRef = await addDoc(messagesRef, messageData);
    console.log('✅ Message saved to Firestore:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving message to Firestore:', error);
    throw error;
  }
};

/**
 * Load chat history from Firestore
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of messages
 */
export const loadChatHistory = async (userId) => {
  try {
    const messagesRef = collection(db, 'conversations', userId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const querySnapshot = await getDocs(q);
    const messages = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        role: data.role,
        content: data.content,
        timestamp: data.timestamp?.toDate() || new Date(),
      });
    });

    console.log(`✅ Loaded ${messages.length} messages from Firestore`);
    return messages;
  } catch (error) {
    console.error('❌ Error loading chat history:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time chat updates (optional)
 * @param {string} userId - The user's ID
 * @param {Function} callback - Callback function to handle new messages
 * @returns {Function} Unsubscribe function
 */
export const subscribeToChatUpdates = (userId, callback) => {
  try {
    const messagesRef = collection(db, 'conversations', userId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
        });
      });

      callback(messages);
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error subscribing to chat updates:', error);
    throw error;
  }
};
