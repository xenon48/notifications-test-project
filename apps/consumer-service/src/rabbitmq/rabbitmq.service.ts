import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { ConfirmChannel, Connection, ConsumeMessage } from 'amqplib';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
    private connection: Connection;
    private channel: ConfirmChannel;
    private isReconnecting = false;

    readonly exchange = 'notifications.exchange';

    readonly MAIN_KEY = 'notification.main';
    readonly RETRY_KEY = 'notification.retry';
    readonly DLQ_KEY = 'notification.dlq';

    async onModuleInit() {
        await this.initializeConnection();
    }

    async onModuleDestroy() {
        await this.channel?.close();
        await this.connection?.close();
    }

    private async initializeConnection() {
        await this.connectWithRetry();
        this.registerConnectionListeners();
    }

    private registerConnectionListeners() {
        this.connection.removeAllListeners();

        this.connection.on('error', err => {
            console.error('Consumer RabbitMQ error:', err.message);
        });

        this.connection.on('close', async () => {
            if (this.isReconnecting) return;

            this.isReconnecting = true;

            console.error('Consumer reconnecting RabbitMQ...');

            try {
                await this.initializeConnection();
            } finally {
                this.isReconnecting = false;
            }
        });
    }

    private async connectWithRetry(retries = 5): Promise<void> {
        while (retries) {
            try {
                this.connection = await amqp.connect(process.env.RABBITMQ_URL);

                this.channel = await this.connection.createConfirmChannel();

                await this.channel.prefetch(1);

                console.log('Consumer connected RabbitMQ');

                return;
            } catch (error) {
                retries--;

                console.error('Consumer RabbitMQ retry connect...\n');
                console.error(error);

                await new Promise(res => setTimeout(res, 3000));
            }
        }

        throw new Error('Consumer RabbitMQ connection failed');
    }

    async consume(
        queue: string,
        handler: (msg: ConsumeMessage) => Promise<void>,
    ) {
        await this.channel.consume(
            queue,
            async msg => {
                if (!msg) return;

                await handler(msg);
            },
            { noAck: false },
        );
    }

    ack(msg: ConsumeMessage) {
        this.channel.ack(msg);
    }

    async publishRetry(
        message: any,
        routingKey: string,
        retries = 3,
    ): Promise<void> {
        while (retries) {
            try {
                await new Promise<void>((resolve, reject) => {
                    this.channel.publish(
                        this.exchange,
                        routingKey,
                        Buffer.from(JSON.stringify(message)),
                        {
                            persistent: true,
                            contentType: 'application/json',
                        },
                        err => {
                            if (err) return reject(err);

                            resolve();
                        },
                    );
                });

                return;
            } catch (error) {
                retries--;

                console.error('Retry publish failed...\n' + error.message);

                await new Promise(res => setTimeout(res, 2000));
            }
        }

        throw new Error('Retry publish failed');
    }
}