import app from './app';
import { config } from './config';
import { startFollowUpWorker } from './workers/followup-worker';
import { startCampaignWorker } from './workers/campaign-worker';
import { pollingService } from './services/polling';

const server = app.listen(config.port, () => {
  console.log(`\n🚀 Campaign Manager API rodando na porta ${config.port}`);
  console.log(`📡 Ambiente: ${config.nodeEnv}`);
  console.log(`🌐 CORS: ${config.corsOrigin}`);
  console.log(`❤️  Health: http://localhost:${config.port}/api/health\n`);

  if (config.nodeEnv !== 'test') {
    startFollowUpWorker();
    startCampaignWorker();
    pollingService.startPolling(5);
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Encerrando servidor e workers.');
  pollingService.stopPolling();
  server.close(() => {
    process.exit(0);
  });
});

export default app;
