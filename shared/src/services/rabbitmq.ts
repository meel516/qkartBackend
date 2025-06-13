import amqp, { Connection, Channel, Message } from 'amqplib';
import { createLogger } from '../utils/logger';
import { MessageEvent } from '../types';

const logger = createLogger('rabbitmq');

class RabbitMQService {
  private connection = null;
  private channel = null;
  private readonly url: string;

  constructor() {
    this.url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      
      logger.info('Connected to RabbitMQ');

      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error', err);
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
      });

      // Setup exchanges and queues
      await this.setupExchangesAndQueues();
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  private async setupExchangesAndQueues(): Promise<void> {
    if (!this.channel) return;

    // Create exchanges
    await this.channel.assertExchange('cart.events', 'topic', { durable: true });
    await this.channel.assertExchange('user.events', 'topic', { durable: true });
    await this.channel.assertExchange('product.events', 'topic', { durable: true });

    // Create queues
    await this.channel.assertQueue('notifications.cart', { durable: true });
    await this.channel.assertQueue('notifications.user', { durable: true });
    await this.channel.assertQueue('notifications.product', { durable: true });

    // Bind queues to exchanges
    await this.channel.bindQueue('notifications.cart', 'cart.events', 'cart.*');
    await this.channel.bindQueue('notifications.user', 'user.events', 'user.*');
    await this.channel.bindQueue('notifications.product', 'product.events', 'product.*');
  }

  async publishEvent(exchange: string, routingKey: string, event: MessageEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const message = Buffer.from(JSON.stringify(event));
    
    const published = this.channel.publish(exchange, routingKey, message, {
      persistent: true,
      timestamp: Date.now()
    });

    if (published) {
      logger.info('Event published', { exchange, routingKey, eventType: event.type });
    } else {
      logger.error('Failed to publish event', { exchange, routingKey, eventType: event.type });
    }
  }

  async subscribe(
    queue: string,
    callback: (event: MessageEvent) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    await this.channel.consume(queue, async (message: Message | null) => {
      if (!message) return;

      try {
        const event: MessageEvent = JSON.parse(message.content.toString());
        await callback(event);
        this.channel!.ack(message);
        
        logger.info('Message processed successfully', { queue, eventType: event.type });
      } catch (error) {
        logger.error('Error processing message', { queue, error });
        this.channel!.nack(message, false, false); // Don't requeue
      }
    });

    logger.info('Subscribed to queue', { queue });
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      logger.info('Disconnected from RabbitMQ');
    } catch (error) {
      logger.error('Error disconnecting from RabbitMQ', error);
    }
  }
}

export const rabbitMQService = new RabbitMQService();