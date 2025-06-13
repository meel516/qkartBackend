import { PrismaClient } from '../../prisma/generated/cart';
import axios from 'axios';
import { 
  AppError, 
  createLogger, 
  redisService, 
  rabbitMQService,
  CartUpdatedEvent
} from '@microservice/shared';

const logger = createLogger('cart-service');
const prisma = new PrismaClient();

export class CartService {
  private readonly productsServiceUrl: string;

  constructor() {
    this.productsServiceUrl = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3002';
  }

  async getCart(userId: string) {
    // Try cache first
    const cacheKey = `cart:${userId}`;
    let cart = await redisService.getObject(cacheKey);

    if (!cart) {
      const cartItems = await prisma.cartItem.findMany({
        where: { userId }
      });

      // Fetch product details for each cart item
      const cartWithProducts = await Promise.all(
        cartItems.map(async (item) => {
          try {
            const productResponse = await axios.get(
              `${this.productsServiceUrl}/api/products/${item.productId}`
            );
            
            return {
              ...item,
              product: productResponse.data.data
            };
          } catch (error) {
            logger.warn('Product not found for cart item', { 
              productId: item.productId, 
              error: error.message 
            });
            return {
              ...item,
              product: null
            };
          }
        })
      );

      cart = {
        items: cartWithProducts,
        totalItems: cartWithProducts.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: cartWithProducts.reduce((sum, item) => {
          return sum + (item.product ? item.product.price * item.quantity : 0);
        }, 0)
      };

      // Cache for 5 minutes
      await redisService.setObject(cacheKey, cart, 300);
    }

    return cart;
  }

  async addToCart(userId: string, productId: string, quantity: number) {
    // Verify product exists
    await this.verifyProduct(productId);

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    let cartItem;

    if (existingItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity
        }
      });
    }

    // Invalidate cart cache
    await redisService.del(`cart:${userId}`);

    // Publish cart updated event
    await this.publishCartEvent(userId, productId, quantity, 'ADD');

    return cartItem;
  }

  async updateCartItem(userId: string, productId: string, quantity: number) {
    const cartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (!cartItem) {
      throw new AppError('Cart item not found', 404);
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity }
    });

    // Invalidate cart cache
    await redisService.del(`cart:${userId}`);

    // Publish cart updated event
    await this.publishCartEvent(userId, productId, quantity, 'UPDATE');

    return updatedItem;
  }

  async removeFromCart(userId: string, productId: string) {
    const cartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (!cartItem) {
      throw new AppError('Cart item not found', 404);
    }

    await prisma.cartItem.delete({
      where: { id: cartItem.id }
    });

    // Invalidate cart cache
    await redisService.del(`cart:${userId}`);

    // Publish cart updated event
    await this.publishCartEvent(userId, productId, 0, 'REMOVE');
  }

  async clearCart(userId: string) {
    await prisma.cartItem.deleteMany({
      where: { userId }
    });

    // Invalidate cart cache
    await redisService.del(`cart:${userId}`);

    logger.info('Cart cleared', { userId });
  }

  private async verifyProduct(productId: string) {
    try {
      const response = await axios.get(`${this.productsServiceUrl}/api/products/${productId}`);
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new AppError('Product not found', 404);
      }
      throw new AppError('Unable to verify product', 500);
    }
  }

  private async publishCartEvent(
    userId: string, 
    productId: string, 
    quantity: number, 
    action: 'ADD' | 'REMOVE' | 'UPDATE'
  ) {
    const event: CartUpdatedEvent = {
      type: 'CART_UPDATED',
      userId,
      productId,
      quantity,
      action,
      timestamp: new Date()
    };

    await rabbitMQService.publishEvent('cart.events', `cart.${action.toLowerCase()}`, event);

    logger.info('Cart event published', { userId, productId, action });
  }
}