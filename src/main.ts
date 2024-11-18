import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);

  const redisHost = configService.get<string>('REDIS_HOST');
  const redisPort = configService.get<number>('REDIS_PORT');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.REDIS,
      options: {
        host: redisHost,
        port: redisPort,
      },
    },
  );

  Logger.log(`Microservice Auth running with Redis at ${redisHost}:${redisPort}`);
  await app.listen();
}
bootstrap();
