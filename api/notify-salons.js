const admin = require("firebase-admin");
const { createHash } = require("crypto");

function serviceAccountFromEnv() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  const parsed = JSON.parse(raw);
  if (parsed.project_id !== "my-salon-b71b1") {
    throw new Error("Firebase service account project must be my-salon-b71b1");
  }
  return parsed;
}

function getAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountFromEnv()),
      projectId: "my-salon-b71b1"
    });
  }
  return admin;
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const host = new URL(origin).hostname;
    return host === "my-salon.vercel.app"
      || (host.startsWith("my-salon-") && host.endsWith(".vercel.app"));
  } catch {
    return false;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isAllowedOrigin(req.headers.origin)) return res.status(403).json({ error: "Origin not allowed" });

  try {
    const firebaseAdmin = getAdmin();
    const db = firebaseAdmin.firestore();
    const forwarded = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
    const ipHash = createHash("sha256").update(forwarded).digest("hex");
    const rateRef = db.collection("pushBroadcastLimits").doc(ipHash);
    const now = Date.now();
    const allowed = await db.runTransaction(async tx => {
      const snap = await tx.get(rateRef);
      const lastSentAt = snap.exists && snap.get("lastSentAt")?.toMillis
        ? snap.get("lastSentAt").toMillis() : 0;
      if (lastSentAt && now - lastSentAt < 15000) return false;
      tx.set(rateRef, {
        lastSentAt: firebaseAdmin.firestore.Timestamp.fromMillis(now),
        expiresAt: firebaseAdmin.firestore.Timestamp.fromMillis(now + 86400000)
      });
      return true;
    });
    if (!allowed) return res.status(429).json({ error: "Please wait before sending another request." });

    const salonSnap = await db.collection("salons")
      .where("status", "in", ["LIVE", "ACTIVE", "APPROVED"]).get();
    const subscriptionGroups = await Promise.all(salonSnap.docs.map(async salonDoc => {
      const salon = salonDoc.data() || {};
      const expiry = salon.expiresAt && typeof salon.expiresAt.toDate === "function"
        ? salon.expiresAt.toDate().getTime() : null;
      if (expiry !== null && expiry <= now) return [];
      const snap = await salonDoc.ref.collection("pushSubscriptions").get();
      return snap.docs.map(doc => ({ ref: doc.ref, data: doc.data() || {} }));
    }));
    const subscriptions = subscriptionGroups.flat().filter(item =>
      typeof item.data.token === "string" && item.data.token.length >= 20
    );
    const unique = new Map();
    for (const item of subscriptions) unique.set(item.data.token, item);
    const targets = Array.from(unique.values());
    if (!targets.length) return res.status(200).json({ ok: true, sent: 0, message: "No salon owner device has enabled notifications yet." });

    let sent = 0;
    for (let offset = 0; offset < targets.length; offset += 500) {
      const batch = targets.slice(offset, offset + 500);
      const result = await firebaseAdmin.messaging().sendEachForMulticast({
        tokens: batch.map(item => item.data.token),
        notification: {
          title: "🔔 ग्राहक को आपकी ज़रूरत है!",
          body: "एक ग्राहक MY SALON पर सैलून खोज रहा है। अपनी प्रोफाइल खोलें और ग्राहक से जुड़ें।"
        },
        data: {
          type: "customer_interest",
          url: "https://my-salon.vercel.app/#salons"
        },
        webpush: {
          fcmOptions: { link: "https://my-salon.vercel.app/#salons" },
          notification: {
            icon: "https://my-salon.vercel.app/logo.svg",
            tag: "my-salon-customer-interest",
            renotify: false
          }
        }
      });
      sent += result.successCount;
      const removals = [];
      result.responses.forEach((response, index) => {
        const code = response.error?.code;
        if (!response.success && (
          code === "messaging/registration-token-not-registered"
          || code === "messaging/invalid-registration-token"
        )) removals.push(batch[index].ref.delete().catch(() => null));
      });
      if (removals.length) await Promise.all(removals);
    }

    return res.status(200).json({ ok: true, sent });
  } catch (error) {
    console.error("MY SALON push broadcast failed:", error);
    return res.status(500).json({ error: "Notification service is not configured or could not send." });
  }
};
