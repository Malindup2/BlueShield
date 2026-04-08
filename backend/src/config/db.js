const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  let mongoURI = process.env.MONGO_URI;

  // Automatically append _test to the database name if in test mode
  if (process.env.NODE_ENV === 'test') {
    if (mongoURI.includes('?')) {
      const parts = mongoURI.split('?');
      mongoURI = `${parts[0].endsWith('/') ? parts[0].slice(0, -1) : parts[0]}_test?${parts[1]}`;
    } else {
      mongoURI = `${mongoURI.endsWith('/') ? mongoURI.slice(0, -1) : mongoURI}_test`;
    }
    console.log("  Running in TEST mode. Using isolated test database...");
  }

  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;