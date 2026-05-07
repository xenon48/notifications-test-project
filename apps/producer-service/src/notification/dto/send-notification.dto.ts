import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumberString } from 'class-validator';

export class SendNotificationDto {
    @ApiProperty({
        example: 123456789,
        description: 'Telegram chat_id',
    })
    @IsNumberString()
    @IsNotEmpty()
    chat: number;

    @ApiProperty({
        example: 'Hello from microservices',
        description: 'Notification message',
    })
    @IsString()
    @IsNotEmpty()
    message: string;
}