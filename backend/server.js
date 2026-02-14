const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');

dotenv.config();

connectDB();

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json()); 

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));


app.get('/', (req, res) => {
  res.send('BlueShield API is running...');
});


const PORT = process.env.PORT || 5000;

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});