import 'dotenv/config';
import { app } from './app.js';

const PORT = Number(process.env.PORT) || 3001;

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL is not set');
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
