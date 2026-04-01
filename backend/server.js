const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');

//hotfix on Anjulas Device - DNS resolution issue - not connecting to MongoDB Atlas cluster, added custom DNS servers (Cloudflare and Google) to bypass local DNS issues. This is a temporary workaround until the underlying DNS issue is resolved on the device.
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
//hotfix end


dotenv.config();

connectDB();

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json()); 

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/enforcements', require('./src/routes/enforcementRoutes'));

app.use("/api/hazards", require("./src/routes/hazardRoutes"));
app.use("/api/zones", require("./src/routes/zoneRoutes"));

app.use('/api/illegal-cases', require('./src/routes/illegalCaseRoutes')); 

// Routes for Reports
app.use("/api/reports", require("./src/routes/reportRoutes"));

// Routes for Vessels
app.use("/api/vessels", require("./src/routes/vesselRoutes"));


app.get('/', (req, res) => {
  res.send('BlueShield API is running...');
});


const PORT = process.env.PORT || 5000;

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});