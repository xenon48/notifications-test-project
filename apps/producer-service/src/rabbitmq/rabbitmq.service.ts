import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { ConfirmChannel, Connection } from 'amqplib';

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
        await this.setupTopology();
        this.registerConnectionListeners();
    }

    private registerConnectionListeners() {
        this.connection.removeAllListeners();

        this.connection.on('error', err => {
            console.error('Producer RabbitMQ error:', err.message);
        });

        this.connection.on('close', async () => {
            if (this.isReconnecting) return;

            this.isReconnecting = true;
            console.error('Producer RabbitMQ closed. Starting reconnect loop...');

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

                console.log('Producer connected to RabbitMQ');
                return;
            } catch (error) {
                console.error('Producer RabbitMQ connect failed. Retrying...');
                retries--;
                await new Promise(res => setTimeout(res, 3000));
            }
        }

        throw new Error('Producer failed RabbitMQ connection');
    }

    private async setupTopology() {
        await this.channel.assertExchange(this.exchange, 'direct', { durable: true });

        await this.channel.assertQueue('notifications.main.queue', { durable: true });

        await this.channel.assertQueue('notifications.retry.queue', {
            durable: true,
            deadLetterExchange: this.exchange,
            deadLetterRoutingKey: this.MAIN_KEY,
            messageTtl: 5000,
        });

        await this.channel.assertQueue('notifications.dlq.queue', { durable: true });

        await this.channel.bindQueue('notifications.main.queue', this.exchange, this.MAIN_KEY);
        await this.channel.bindQueue('notifications.retry.queue', this.exchange, this.RETRY_KEY);
        await this.channel.bindQueue('notifications.dlq.queue', this.exchange, this.DLQ_KEY);

        console.log('Producer topology initialized');
    }

    async publish(message: any, routingKey = this.MAIN_KEY, retries = 3): Promise<void> {
        while (retries) {
            try {
                await new Promise<void>((resolve, reject) => {
                    this.channel.publish(
                        this.exchange,
                        routingKey,
                        Buffer.from(JSON.stringify(message)),
                        { persistent: true, contentType: 'application/json' },
                        err => {
                            if (err) return reject(err);
                            resolve();
                        },
                    );
                });

                console.log(`Published event ${message.eventId}`);
                return;
            } catch (error) {
                console.error(`Publish failed for ${message.eventId}. Retrying publish...`);
                retries--;
                await new Promise(res => setTimeout(res, 2000));
            }
        }

        throw new Error(`Failed to publish event ${message.eventId}`);
    }
}