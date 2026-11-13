importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD-FImEhSnsYKRqq7NjHbYJQB04KLhOvIE",
  authDomain: "my-salon-b71b1.firebaseapp.com",
  projectId: "my-salon-b71b1",
  storageBucket: "my-salon-b71b1.firebasestorage.app",
  messagingSenderId: "497426584536",
  appId: "1:497426584536:web:c4695aa1caaa5988b318ad"
});

// Firebase displays background notification messages and opens the fcmOptions.link URL.
firebase.messaging();
