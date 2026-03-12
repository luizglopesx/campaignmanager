import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';

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
import broadcastRoutes from './routes/broadcast';
import statusRoutes from './routes/status';
import contactRoutes from './routes/contacts';
import webhookRoutes from './routes/webhook';

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/broadcast', broadcastRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/webhook', webhookRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: config.nodeEnv === 'development' ? err.message : 'Erro interno do servidor',
  });
});

export default app;
