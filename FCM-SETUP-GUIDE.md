# Firebase Cloud Messaging (FCM) Setup Guide

## 🚀 Quick Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `smarttutor-app`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Register Web App
1. In your Firebase project, click Web icon (`</>`)
2. Enter app name: `SmartTutor Web`
3. Click "Register app"
4. Copy the Firebase config object

### 3. Update Firebase Configuration
Replace the config in `js/fcm-config.js` with your actual config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 4. Generate Server Key
1. Go to Project Settings → Cloud Messaging
2. Copy "Server key" (for backend)
3. Copy "Sender ID" (for frontend)

### 5. Update Backend Configuration
Add these to your `application.properties`:

```properties
# Firebase FCM Configuration
firebase.server.key=YOUR_SERVER_KEY_HERE
firebase.sender.id=YOUR_SENDER_ID_HERE
```

## 🔧 How It Works

### Frontend (Browser)
1. **Permission Request**: Asks user for notification permission
2. **Token Generation**: Gets FCM token from Firebase
3. **Token Registration**: Sends token to backend
4. **Message Handling**: Receives and displays notifications

### Backend (Spring Boot)
1. **Token Storage**: Saves FCM tokens with user info
2. **Notification Sending**: Sends notifications via FCM API
3. **Targeted Messaging**: Sends to specific users/roles

## 📱 Notification Types

### 1. Note Upload Notifications
- **Trigger**: Teacher uploads a new note
- **Recipients**: Students in that class/division
- **Message**: "New note uploaded: [Note Title]"

### 2. Student Creation Notifications
- **Trigger**: HOD creates a new student
- **Recipients**: Assigned teacher
- **Message**: "New student added: [Student Name]"

### 3. System Notifications
- **Trigger**: Various system events
- **Recipients**: Relevant users
- **Message**: Event-specific

## 🛠 Demo Mode

If Firebase is not configured, the system automatically switches to demo mode:
- Uses placeholder FCM tokens
- Logs notification events to console
- Shows mock notifications in UI

## 🧪 Testing Notifications

### Test FCM Token Generation
1. Open browser console
2. Look for "FCM Token:" message
3. Check if token is saved to localStorage

### Test Notification Display
1. In browser console, run:
```javascript
showNotification({
    title: 'Test Notification',
    body: 'This is a test notification'
});
```

### Test Backend Integration
1. Upload a note as teacher
2. Check console for "Notifications sent to students"
3. Check browser notification permission

## 🔍 Troubleshooting

### Common Issues

1. **No FCM Token Generated**
   - Check Firebase configuration
   - Ensure Firebase SDK loads properly
   - Check browser console for errors

2. **Permission Denied**
   - User must allow notifications
   - Check browser notification settings
   - Use HTTPS (required for notifications)

3. **Notifications Not Received**
   - Verify backend FCM integration
   - Check server key configuration
   - Ensure tokens are saved correctly

4. **Service Worker Issues**
   - Check `firebase-messaging-sw.js` is accessible
   - Verify service worker registration
   - Check browser developer tools → Application

### Debug Steps

1. **Check Console Logs**
   ```javascript
   console.log('FCM Token:', localStorage.getItem('fcmToken'));
   ```

2. **Verify Firebase Initialization**
   ```javascript
   console.log('Firebase:', typeof firebase !== 'undefined');
   ```

3. **Check Notification Permission**
   ```javascript
   console.log('Permission:', Notification.permission);
   ```

## 📋 Implementation Status

✅ **Completed**
- Firebase configuration setup
- FCM token generation
- Frontend notification display
- Demo mode fallback
- Service worker for background messages
- Integration with notes upload

🔄 **Backend Integration Needed**
- Update backend with Firebase server key
- Implement FCM notification service
- Add notification triggers for events

## 🚀 Next Steps

1. **Configure Firebase Project**
2. **Update Configuration Files**
3. **Test Token Generation**
4. **Implement Backend FCM Service**
5. **Test End-to-End Notifications**

## 📞 Support

For issues:
1. Check browser console logs
2. Verify Firebase configuration
3. Ensure HTTPS is used in production
4. Check notification permissions
