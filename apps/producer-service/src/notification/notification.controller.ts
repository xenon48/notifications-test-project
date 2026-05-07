import { Controller, Get, Post, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller()
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get('send') // Используем GET для удобства тестирования через браузер
    @ApiOperation({ summary: 'Publish telegram notification event to RabbitMQ' })
    @ApiResponse({ status: 201, description: 'Notification event published' })
    async send(@Query() query: SendNotificationDto) {
        console.info(`Received request to send notification to chat '${query.chat}' with message: ${query.message}`);
        return this.notificationService.sendNotification(query.chat, query.message);
    }
}