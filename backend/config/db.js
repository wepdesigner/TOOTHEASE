const mongoose = require("mongoose");
const dns = require("dns");

// Force Node.js to use Google and Cloudflare DNS
// This fixes the "querySrv ETIMEOUT" bug on some Windows machines
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      family: 4, 
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
