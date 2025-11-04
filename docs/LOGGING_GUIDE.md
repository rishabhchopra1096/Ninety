# Ninety App - Console Logging Guide

This document explains what console logs you'll see during testing and what they mean.

---

## 📊 Logging Philosophy

**Goal**: Strategic logs at critical decision points without spam
- ✅ Show app lifecycle (start, initialize, navigate)
- ✅ Show auth state changes (signup, login, logout)
- ✅ Show data operations (Firestore save/load)
- ✅ Show errors clearly
- ❌ No verbose/redundant logs

---

## 🔍 What You'll See During Testing

### **1. App Startup**
```
🚀 Ninety App Starting...
📱 Platform: iOS/Android
⚛️  React Native + Expo

🔥 Initializing Firebase...
✅ Firebase initialized successfully
📦 Project: ninety-ed5a0

🔐 Setting up auth state listener...
⏳ Checking authentication state...
```

**What this means**: App is loading and connecting to Firebase

---

### **2. First Time User (No Account)**
```
🚫 No user authenticated - showing login screen
🔀 Navigation: Showing AUTH screens (Login/Signup)
```

**What this means**: No logged-in user found, showing Login screen

---

### **3. User Signs Up**

**In Terminal:**
```
📝 SIGNUP STARTED
   Email: test@example.com
   ✅ Firebase Auth user created
   ✅ User profile saved to Firestore
✅ SIGNUP COMPLETE - UID: abc123xyz

✅ User authenticated: test@example.com
📄 Fetching user profile from Firestore...
✅ User profile loaded
🔀 Navigation: Showing MAIN APP (User logged in)
```

**What this means**:
1. User account created in Firebase Auth
2. User profile saved to Firestore
3. Auth state changed → navigating to main app

---

### **4. Chat Screen Loads**
```
📚 Loading chat history for user: abc123xyz
✅ Loaded 0 messages from Firestore
✅ Message saved to Firestore: welcomeMessageId
🔗 Chat API URL: https://ninety-production.up.railway.app/api/chat
```

**What this means**:
- Chat checking for previous messages (found none for new user)
- Welcome message displayed and saved
- API connection established

---

### **5. User Sends a Message**
```
📤 Sending message to API: Hello Ava!
🔗 Using API URL: https://ninety-production.up.railway.app/api/chat
📋 API Messages: [{"content": "Hello Ava!", "role": "user"}]
✅ Message saved to Firestore: messageId123
📡 Response status: 200
📡 Response ok: true
📥 Received response data: {"message": "Hi there! Ready to start..."}
✅ Message saved to Firestore: avaMessageId456
✅ Message completed
```

**What this means**:
1. User message sent to API
2. User message saved to Firestore
3. API responded successfully (status 200)
4. Ava's response saved to Firestore
5. Conversation persisted

---

### **6. User Logs Out**
```
🚪 LOGOUT STARTED
✅ LOGOUT COMPLETE

🚫 No user authenticated - showing login screen
🔀 Navigation: Showing AUTH screens (Login/Signup)
```

**What this means**:
- User successfully logged out
- Auth state cleared
- Navigated back to login screen

---

### **7. User Logs Back In**
```
🔓 LOGIN STARTED
   Email: test@example.com
   ✅ Authentication successful
   ✅ User profile loaded from Firestore
✅ LOGIN COMPLETE - UID: abc123xyz

✅ User authenticated: test@example.com
📄 Fetching user profile from Firestore...
✅ User profile loaded
🔀 Navigation: Showing MAIN APP (User logged in)

📚 Loading chat history for user: abc123xyz
✅ Loaded 3 messages from Firestore
```

**What this means**:
- Login successful
- Profile loaded
- Navigated to main app
- **Chat history restored** (3 messages from before logout!)

---

## ❌ Error Scenarios

### **Login Failed (Wrong Password)**
```
🔓 LOGIN STARTED
   Email: test@example.com
❌ LOGIN FAILED: Firebase: Error (auth/wrong-password).
```

### **Signup Failed (Email Already Exists)**
```
📝 SIGNUP STARTED
   Email: test@example.com
❌ SIGNUP FAILED: Firebase: Error (auth/email-already-in-use).
```

### **API Connection Failed**
```
📤 Sending message to API: Hello
❌ Send message error: [TypeError: Network request failed]
```
**Common causes**:
- Railway API is sleeping (free tier)
- No internet connection
- API key missing/invalid

### **Firestore Save Failed**
```
❌ Error saving message to Firestore: [FirebaseError: Permission denied]
```
**Common causes**:
- Firestore security rules too restrictive
- User not authenticated

---

## 🧪 Testing Checklist with Expected Logs

### ✅ Test 1: New User Signup
**Expected logs in order:**
1. `📝 SIGNUP STARTED`
2. `✅ SIGNUP COMPLETE`
3. `✅ User authenticated`
4. `🔀 Navigation: Showing MAIN APP`
5. `📚 Loading chat history` (0 messages)

### ✅ Test 2: Send Message
**Expected logs in order:**
1. `📤 Sending message to API`
2. `✅ Message saved to Firestore` (user message)
3. `📡 Response status: 200`
4. `✅ Message saved to Firestore` (Ava message)
5. `✅ Message completed`

### ✅ Test 3: Logout
**Expected logs:**
1. `🚪 LOGOUT STARTED`
2. `✅ LOGOUT COMPLETE`
3. `🚫 No user authenticated`
4. `🔀 Navigation: Showing AUTH screens`

### ✅ Test 4: Login & History Loads (CRITICAL!)
**Expected logs in order:**
1. `🔓 LOGIN STARTED`
2. `✅ LOGIN COMPLETE`
3. `✅ User authenticated`
4. `🔀 Navigation: Showing MAIN APP`
5. `📚 Loading chat history`
6. `✅ Loaded X messages from Firestore` ← **Should show >0 messages!**

---

## 🎯 Success Indicators

### **Phase 1 Complete** = You see these logs:
- ✅ Firebase initializes without errors
- ✅ Signup creates user and profile
- ✅ Login authenticates successfully
- ✅ Messages save to Firestore (see "✅ Message saved")
- ✅ Chat history loads with previous messages after login

### **Red Flags** = You see these:
- ❌ Any error with "Permission denied" → Check Firestore rules
- ❌ "Network request failed" → Check Railway API status
- ❌ "Loaded 0 messages" after having sent messages → Firestore not saving

---

## 📱 Where to See These Logs

**Option 1: Expo Terminal** (Recommended)
- All logs appear directly in the terminal where you ran `npm start`
- Color-coded and easy to read
- Can copy/paste for debugging

**Option 2: Expo Dev Tools**
- Press `j` in Expo terminal to open debugger
- Go to Console tab
- See all logs with timestamps

**Option 3: React Native Debugger**
- Press `shift+m` in Expo terminal
- Select "Open React Native Debugger"
- More detailed debugging tools

---

## 🚨 If You Don't See Expected Logs

### Missing Firebase logs?
→ Firebase config not imported/initialized
→ Check `App.tsx` imports `./src/config/firebase`

### Missing auth logs?
→ AuthProvider not wrapping app
→ Check `App.tsx` has `<AuthProvider>`

### Missing chat logs?
→ ChatScreen not mounted
→ Check navigation is showing Main app

### No Firestore save logs?
→ User not authenticated
→ Check Profile tab shows your email

---

## 🎓 How to Read the Log Flow

**Successful User Journey:**
```
START
  ↓
🚀 App Starting
  ↓
🔥 Firebase Initialized
  ↓
🚫 No user (show login)
  ↓
📝 Signup Started → ✅ Complete
  ↓
✅ User authenticated
  ↓
🔀 Navigation: MAIN APP
  ↓
📚 Loading chat history (0 msgs)
  ↓
📤 Send message → ✅ Saved to Firestore
  ↓
📡 API responds → ✅ Ava message saved
  ↓
🚪 Logout → ✅ Complete
  ↓
🔓 Login → ✅ Complete
  ↓
📚 Loading chat history (2+ msgs) ← PERSISTENCE WORKS!
  ↓
SUCCESS ✅
```

---

## 💡 Pro Tips

1. **Filter logs by emoji** in terminal:
   - `🚀` = App lifecycle
   - `🔐🔓🚪` = Auth operations
   - `💬📤📥` = Chat/messages
   - `❌` = Errors (focus here if issues)

2. **Key logs to watch**:
   - After signup: `✅ SIGNUP COMPLETE`
   - After login: `✅ Loaded X messages` (X > 0 for persistence test)
   - After message: `✅ Message saved to Firestore` (should appear twice per message)

3. **If logs are overwhelming**:
   - Focus on `✅` (success) and `❌` (errors) only
   - Ignore intermediate steps unless debugging

---

**Last Updated**: Phase 1 - Authentication & Persistence
