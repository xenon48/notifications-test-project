import { Module } from '@nestjs/common';

import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { ConsumerModule } from './consumer/consumer.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessedEvent } from './database/processed-event.entity';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT) || 5433,
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'notifications',
      entities: [ProcessedEvent],
      synchronize: true,
    }),

    RabbitmqModule,
    ConsumerModule,
  ],
})
export class AppModule { }