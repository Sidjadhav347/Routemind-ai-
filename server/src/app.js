import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Import Route Handlers
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import cargoRoutes from './routes/cargoRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import trafficRoutes from './routes/trafficRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import coloadingRoutes from './routes/coloadingRoutes.js';
import configRoutes from './routes/configRoutes.js';

// Middlewares
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Lightweight request logging
app.use((req, res, next) => {
  if (req.path !== '/api/health') {
    console.log(`[HTTP] ${req.method} ${req.path}`);
  }
  next();
});

// System Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'RouteMind AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime())
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/cargo', cargoRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/coloading', coloadingRoutes);
app.use('/api/config', configRoutes);

// Fallback handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
