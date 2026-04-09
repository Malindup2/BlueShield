const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();

const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));

const allowedOrigins = [
  process.env.ALLOWED_ORIGIN, // Your Vercel URL
  "http://localhost:5173",    // Vite Local 1
  "http://localhost:5174",    // Vite Local 2
  "http://localhost:3000"     // Standard Local
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/enforcements', require('./routes/enforcementRoutes'));
app.use('/api/hazards', require('./routes/hazardRoutes'));
app.use('/api/zones', require('./routes/zoneRoutes'));
app.use('/api/illegal-cases', require('./routes/illegalCaseRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/vessels', require('./routes/vesselRoutes'));
app.use('/api/translate', require('./routes/translationRoutes'));


app.get('/', (req, res) => {
  res.send('BlueShield API is running...');
});

module.exports = app;
