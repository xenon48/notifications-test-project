import { Module } from '@nestjs/common';
import { ConsumerService } from './consumer.service';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessedEvent } from '../database/processed-event.entity';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProcessedEvent]),
    RabbitmqModule,
    TelegramModule
  ],
  providers: [ConsumerService],
})
export class ConsumerModule { }