importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCgQHpbtlM03a4CiDxa-VONa4fKkL13dBU",
  authDomain: "smart-tutor-c1fa3.firebaseapp.com",
  projectId: "smart-tutor-c1fa3",
  storageBucket: "smart-tutor-c1fa3.appspot.com",
  messagingSenderId: "444953493124",
  appId: "1:444953493124:web:cf76fe5682693ef091ccd1"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log("🔔 Background message received:", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/assets/bell.png",
    badge: "/assets/bell.png",
    vibrate: [100, 50, 100],
    data: {
      click_action: payload.data.screen || 'dashboard'
    },
    actions: [
      {
        action: 'open',
        title: 'Open SmartTutor'
      }
    ]
  };

  // Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();

  // Handle different click actions
  if (event.action === 'open') {
    // Open the application
    event.waitUntil(
      clients.openWindow('/')
    );
  } else {
    // Default click - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log("🔔 Firebase service worker initialized");
