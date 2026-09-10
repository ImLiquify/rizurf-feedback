// api/health.js
export default function handler(req, res) {
  // Simple health check endpoint for Vercel
  res.status(200).json({ status: "ok" });
}

