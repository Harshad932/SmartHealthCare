import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ChatBotRoutes from './routes/ChatBotRoutes.js';
import UserRoutes from './routes/UserRoutes.js';
import DoctorRoutes from './routes/DoctorRoutes.js';
import AdminRoutes from './routes/AdminRoutes.js';
import doshaRoutes from './routes/doshaRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/dosha', doshaRoutes);
app.use('/api', AdminRoutes);
app.use('/api', ChatBotRoutes);
app.use('/api', UserRoutes);
app.use('/api', DoctorRoutes);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Smart Healthcare Portal API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});