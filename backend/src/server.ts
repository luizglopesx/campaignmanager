import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';

// Rotas
import authRoutes from './routes/auth';
import settingsRoutes from './routes/settings';
import templateRoutes from './routes/templates';
import leadRoutes from './routes/leads';
import campaignRoutes from './routes/campaigns';
import uploadRoutes from './routes/upload';
import dashboardRoutes from './routes/dashboard';
import scheduleRoutes from './routes/schedule';
import historyRoutes from './routes/history';
import metricsRoutes from './routes/metrics';

import { startFollowUpWorker } from './workers/followup-worker';
import { startCampaignWorker } from './workers/campaign-worker';
import { pollingService } from './services/polling';

const app = express();

// ==========================================
// Middleware Global
// ==========================================

// Segurança
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==========================================
// Rotas da API
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/metrics', metricsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: config.nodeEnv === 'development' ? err.message : 'Erro interno do servidor',
  });
});

// ==========================================
// Iniciar Servidor e Workers
// ==========================================

const server = app.listen(config.port, () => {
  console.log(`\n🚀 Campaign Manager API rodando na porta ${config.port}`);
  console.log(`📡 Ambiente: ${config.nodeEnv}`);
  console.log(`🌐 CORS: ${config.corsOrigin}`);
  console.log(`❤️  Health: http://localhost:${config.port}/api/health\n`);

  // Iniciar Workers e Polling
  if (config.nodeEnv !== 'test') {
    startFollowUpWorker();
    startCampaignWorker();
    pollingService.startPolling(5); // A cada 5 minutos
  }
});

// Tratamento de encerramento gracioso
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Encerrando servidor e workers.');
  pollingService.stopPolling();
  server.close(() => {
    process.exit(0);
  });
});

export default app;
