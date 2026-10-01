import http from 'http';
import app from './app.js';
import { config } from './config/index.js';

const server = http.createServer(app);

const PORT = config.port || 5000;

server.listen(PORT, () => {
  console.log('================================================================');
  console.log('  ROUTEMIND AI — "Predict. Optimize. Move Smarter."');
  console.log('  AI for Smart Mobility | Logistics & Route Optimization Platform');
  console.log(`  Server listening on http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log('================================================================');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Gracefully shutting down...');
  server.close(() => {
    console.log('[Server] Process terminated.');
  });
});
