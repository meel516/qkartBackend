import nodemailer from 'nodemailer';
import {
  createLogger,
  rabbitMQService,
  MessageEvent,
  CartUpdatedEvent,
  UserRegisteredEvent,
  ProductUpdatedEvent,
} from '@microservice/shared';

const logger = createLogger('notification-service');

export class NotificationService {
  private emailTransporter!: nodemailer.Transporter;


  constructor() {
    this.setupEmailTransporter();
  }

  private setupEmailTransporter() {
    this.emailTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    logger.info('Email transporter configured');
  }

  async startListening() {
    await rabbitMQService.subscribe('notifications.cart', this.handleCartEvent.bind(this));
    await rabbitMQService.subscribe('notifications.user', this.handleUserEvent.bind(this));
    await rabbitMQService.subscribe('notifications.product', this.handleProductEvent.bind(this));

    logger.info('Started listening to notification queues');
  }

  private async handleCartEvent(event: MessageEvent) {
    if (event.type === 'CART_UPDATED') {
      const cartEvent = event as CartUpdatedEvent;

      logger.info('Processing cart event', {
        userId: cartEvent.userId,
        action: cartEvent.action,
        productId: cartEvent.productId,
      });

      switch (cartEvent.action) {
        case 'ADD':
          await this.sendCartNotification(
            cartEvent.userId,
            'Item Added to Cart',
            `A new item has been added to your cart. Product ID: ${cartEvent.productId}`,
          );
          break;
        case 'REMOVE':
          await this.sendCartNotification(
            cartEvent.userId,
            'Item Removed from Cart',
            `An item has been removed from your cart. Product ID: ${cartEvent.productId}`,
          );
          break;
        case 'UPDATE':
          await this.sendCartNotification(
            cartEvent.userId,
            'Cart Updated',
            `Your cart has been updated. Product ID: ${cartEvent.productId}, Quantity: ${cartEvent.quantity}`,
          );
          break;
      }
    }
  }

  private async handleUserEvent(event: MessageEvent) {
    if (event.type === 'USER_REGISTERED') {
      const userEvent = event as UserRegisteredEvent;

      logger.info('Processing user registration event', {
        userId: userEvent.userId,
        email: userEvent.email,
      });

      await this.sendWelcomeEmail(userEvent.email, userEvent.name);
    }
  }

  private async handleProductEvent(event: MessageEvent) {
    if (event.type === 'PRODUCT_UPDATED') {
      const productEvent = event as ProductUpdatedEvent;

      logger.info('Processing product event', {
        productId: productEvent.productId,
        action: productEvent.action,
      });

      logger.info('Product event processed (no action required)', {
        productId: productEvent.productId,
      });
    }
  }

  private async sendWelcomeEmail(email: string, name: string) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@microservice.com',
        to: email,
        subject: 'Welcome to Our Platform!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Welcome ${name}!</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
              Thank you for registering with our platform. We're excited to have you on board!
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
              You can now start exploring our products and services. If you have any questions, 
              please don't hesitate to contact our support team.
            </p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="#" style="background-color: #007bff; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 5px; display: inline-block;">
                Start Shopping
              </a>
            </div>
            <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px;">
              Best regards,<br>
              The Microservice Team
            </p>
          </div>
        `,
      };

      await this.emailTransporter.sendMail(mailOptions);
      logger.info('Welcome email sent successfully', { email });
    } catch (error: any) {
      logger.error('Failed to send welcome email', { email, error: error.message });
    }
  }

  private async sendCartNotification(userId: string, subject: string, message: string) {
    try {
      logger.info('Cart notification sent', {
        userId,
        subject,
        message,
      });

      /*
      const userEmail = await this.getUserEmail(userId);
      if (userEmail) {
        const mailOptions = {
          from: process.env.EMAIL_FROM || 'noreply@microservice.com',
          to: userEmail,
          subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">${subject}</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #666;">
                ${message}
              </p>
            </div>
          `
        };

        await this.emailTransporter.sendMail(mailOptions);
      }
      */
    } catch (error: any) {
      logger.error('Failed to send cart notification', { userId, error: error.message });
    }
  }

  /*
  private async getUserEmail(userId: string): Promise<string | null> {
    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/user/${userId}`);
      return response.data.email;
    } catch (error: any) {
      logger.error('Failed to get user email', { userId, error: error.message });
      return null;
    }
  }
  */
}
