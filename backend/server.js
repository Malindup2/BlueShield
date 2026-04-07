const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const app = require('./src/app'); // ✅ use app from app.js

// DNS Fix (keep this)
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();

// Connect DB
connectDB();

const PORT = process.env.PORT || 5000;

// Start Server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});