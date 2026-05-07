import { Update, Start, Ctx, On, InjectBot } from '@grammyjs/nestjs';
import { Bot, Context, InlineKeyboard } from 'grammy';

@Update()
export class TelegramService {
    constructor(@InjectBot() private readonly bot: Bot<Context>) { }

    private getStartMessage(name: string): string {
        return `Привет, ${name}! Я бот для тестового задания. Напиши текст для сообщения, которое будет отправлено по пути: Producer API -> RabbitMQ -> Consumer -> Этот чат`;
    }

    async sendMessageToUser(chatId: number, message: string) {
        try {
            await this.bot.api.sendMessage(chatId, message);
        } catch (error) {
            console.error(`Ошибка при отправке сообщения в чат: ${chatId}. `, error);
        }
    }

    @Start()
    async onStart(@Ctx() ctx: Context) {
        const name = ctx.from?.first_name || 'друг';
        await ctx.reply(this.getStartMessage(name));
    }

    @On('message:text')
    async onMessage(@Ctx() ctx: Context) {
        const text = ctx.message?.text || '';
        const url = `http://127.0.0.1:3000/send?chat=${ctx.chat.id}&message=${encodeURIComponent(text)}`;

        const keyboard = new InlineKeyboard()
            .url('Отправить сообщение в Producer-Service по HTTP', url);

        await ctx.reply('Нажмите на кнопку ниже, чтобы отправить данные:', {
            reply_markup: keyboard,
        });
    }
}
