import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConsumeMessage } from 'amqplib';
import { Repository } from 'typeorm';

import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { TelegramService } from '../telegram/telegram.service';

import { ProcessedEvent } from '../database/processed-event.entity';

import { NotificationEvent } from '@shared/contracts/notification-event.interface';

@Injectable()
export class ConsumerService implements OnModuleInit {
    constructor(
        private readonly rabbitmqService: RabbitmqService,
        private readonly telegramService: TelegramService,

        @InjectRepository(ProcessedEvent)
        private readonly processedEventRepository: Repository<ProcessedEvent>,
    ) { }

    async onModuleInit() {
        await this.rabbitmqService.consume(
            'notifications.main.queue',
            this.processMessage.bind(this),
        );
    }

    async processMessage(msg: ConsumeMessage) {
        const event: NotificationEvent = JSON.parse(msg.content.toString());

        console.log(`Received event ${event.eventId}`);

        const exists = await this.processedEventRepository.findOne({
            where: {
                eventId: event.eventId,
            },
        });

        if (exists) {
            console.log(`Duplicate event ${event.eventId}`);

            this.rabbitmqService.ack(msg);

            return;
        }

        try {
            await this.telegramService.sendMessageToUser(
                event.payload.chatId,
                event.payload.message,
            );

            await this.processedEventRepository.save({
                eventId: event.eventId,
                status: 'SUCCESS',
            });

            console.log(`Processed event ${event.eventId}`);

            this.rabbitmqService.ack(msg);
        } catch (error) {
            console.error(`Processing failed ${event.eventId}`);

            event.metadata.retryCount += 1;
            event.metadata.lastError = error.message;

            if (event.metadata.retryCount > 3) {
                await this.rabbitmqService.publishRetry(
                    event,
                    this.rabbitmqService.DLQ_KEY,
                );

                console.error(`Event ${event.eventId} sent to DLQ`);
            } else {
                await this.rabbitmqService.publishRetry(
                    event,
                    this.rabbitmqService.RETRY_KEY,
                );

                console.error(`Event ${event.eventId} sent to Retry Queue`);
            }

            this.rabbitmqService.ack(msg);
        }
    }
}