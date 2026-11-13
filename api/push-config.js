module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";
  if (!vapidKey) return res.status(503).json({ error: "NEXT_PUBLIC_FIREBASE_VAPID_KEY is not configured" });
  return res.status(200).json({ vapidKey });
};
