import app from './app';
import { config } from './config';
import { startFollowUpWorker } from './workers/followup-worker';
import { startCampaignWorker } from './workers/campaign-worker';
import { startBroadcastWorker } from './workers/broadcast-worker';

const server = app.listen(config.port, () => {
  console.log(`\n🚀 Campaign Manager API rodando na porta ${config.port}`);
  console.log(`📡 Ambiente: ${config.nodeEnv}`);
  console.log(`🌐 CORS: ${config.corsOrigin}`);
  console.log(`❤️  Health: http://localhost:${config.port}/api/health\n`);

  if (config.nodeEnv !== 'test') {
    startFollowUpWorker();
    startCampaignWorker();
    startBroadcastWorker();
    // Polling desativado — follow-up agora é iniciado manualmente pela interface
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Encerrando servidor e workers.');
  server.close(() => {
    process.exit(0);
  });
});

export default app;

