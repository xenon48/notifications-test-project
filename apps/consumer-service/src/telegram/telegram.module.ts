import { Module } from '@nestjs/common';
import { NestjsGrammyModule } from '@grammyjs/nestjs';
import { TelegramService } from './telegram.service';

@Module({
  imports: [
    NestjsGrammyModule.forRootAsync({
      useFactory: () => ({
        token: process.env.TELEGRAM_BOT_TOKEN,
      }),
    }),
  ],
  providers: [TelegramService],
  exports: [TelegramService]
})
export class TelegramModule { }