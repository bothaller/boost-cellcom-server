import { createApp } from './app.js';
import { config } from './config.js';

const server = createApp().listen(config.PORT, () => {
  console.log(`[server] listening on :${config.PORT} (${config.NODE_ENV})`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close(() => process.exit(0));
  });
}
