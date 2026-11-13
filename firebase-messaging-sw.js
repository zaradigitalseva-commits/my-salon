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

firebase.messaging();

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = event.notification?.data?.FCM_MSG?.data?.url || "https://my-salon.vercel.app/#salons";
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(target);
        return;
      }
    }
    if (clients.openWindow) await clients.openWindow(target);
  })());
});
