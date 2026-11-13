# MY SALON push notification setup

The browser app is connected to Firebase project `my-salon-b71b1`. Do not use credentials from another app or Firebase project.

## Vercel environment variables

In the **MY SALON** Vercel project, add these for Preview first (and Production only after the Preview is tested):

- `FIREBASE_SERVICE_ACCOUNT_JSON`: the complete service-account JSON for Firebase project `my-salon-b71b1`. Keep this secret; never put it in GitHub or browser code.
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`: the public Web Push certificate key from Firebase Console → Project settings → Cloud Messaging → Web Push certificates.

After adding variables, create a fresh deployment so the API functions receive them.

## Salon owner opt-in

Each LIVE salon owner must sign in on MY SALON, open the Owner Dashboard, choose **Enable Mobile Notifications**, and allow notifications in the browser. Repeat on every mobile/browser where notifications are wanted.

## Customer flow

The homepage **CALL US** button scrolls to the LIVE salon list and sends one broadcast request. The server sends the notification to registered devices belonging to non-expired LIVE salons only. A short per-IP cooldown prevents accidental repeated taps. No customer name, phone number, or other personal data is sent.

## Important

Push delivery is not active until both Vercel environment variables are configured, the Preview deployment is successful, and at least one LIVE owner has enabled notifications. Firestore Rules in this PR must be published to the same Firebase project only after review.
