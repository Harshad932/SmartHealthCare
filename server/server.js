import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

// Routes
import ChatBotRoutes from './routes/ChatBotRoutes.js';
import UserRoutes from './routes/UserRoutes.js';
import DoctorRoutes from './routes/DoctorRoutes.js';
import AdminRoutes from './routes/AdminRoutes.js';
import doshaRoutes from './routes/doshaRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(helmet());

// 2. CORS with specific origin from .env
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// 3. Body parser with limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));



// 6. Prevent parameter pollution
app.use(hpp());

// 7. Rate limiting (100 req per 15 min per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use('/api', limiter);

// 8. Enable response compression
app.use(compression());

// ✅ Routes
app.use('/api/patient', UserRoutes);  
app.use('/api/dosha', doshaRoutes);
app.use('/api/admin', AdminRoutes);
app.use('/api/chatbot', ChatBotRoutes);
app.use('/api/doctor', DoctorRoutes);

// ✅ Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Smart Healthcare Portal API is running' });
});

// ✅ Global error handler (to avoid leaking stack trace in production)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Something went wrong!' });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});
