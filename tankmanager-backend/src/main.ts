import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get allowed origins from environment variable
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = [frontendUrl];
  
  // In development, also allow localhost
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:3000');
  }
  
  // Always allow the production Vercel domain
  if (!allowedOrigins.includes('https://tankmanager-ebon.vercel.app')) {
    allowedOrigins.push('https://tankmanager-ebon.vercel.app');
  }
  
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = parseInt(process.env.PORT || '3005', 10);
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);
}
bootstrap();
