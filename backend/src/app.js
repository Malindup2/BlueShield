const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

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
