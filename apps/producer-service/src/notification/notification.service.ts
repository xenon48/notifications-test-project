import { Injectable } from '@nestjs/common';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { randomUUID } from 'crypto';
import { NotificationEvent } from '@shared/contracts/notification-event.interface';

@Injectable()
export class NotificationService {
    constructor(private readonly rabbitmqService: RabbitmqService) { }

    async sendNotification(chatId: number, message: string) {
        const event: NotificationEvent = {
            eventId: randomUUID(),
            type: 'TELEGRAM_NOTIFICATION',
            payload: {
                chatId,
                message,
            },
            metadata: {
                createdAt: new Date().toISOString(),
                retryCount: 0,
                source: 'producer-service',
            },
        };

        await this.rabbitmqService.publish(event);

        return {
            success: true,
            eventId: event.eventId,
            message: 'Notification event successfully published to RabbitMQ',
        };
    }
}