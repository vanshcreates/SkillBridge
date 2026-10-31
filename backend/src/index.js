import "dotenv/config";
import dns from "node:dns";

// Use Cloudflare DNS to resolve MongoDB Atlas SRV records on Windows networks
try {
  dns.setServers(["1.1.1.1", "1.0.0.1"]);
} catch (e) {
  console.warn("Could not set custom DNS servers:", e.message);
}

import { connectDB } from "./config/db.js";
import app from "./app.js";

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 SkillBridge backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
