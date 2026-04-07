require('dotenv').config();
const connectDB = require('./src/config/db');

//hotfix on Anjulas Device - DNS resolution issue - not connecting to MongoDB Atlas cluster, added custom DNS servers (Cloudflare and Google) to bypass local DNS issues. This is a temporary workaround until the underlying DNS issue is resolved on the device.
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
//hotfix end

const app = require('./src/app');

connectDB();


const PORT = process.env.PORT || 5000;

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;