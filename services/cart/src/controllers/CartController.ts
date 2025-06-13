import { Request, Response } from 'express';
import { CartService } from '../services/CartService';
import { asyncHandler, createLogger } from '@microservice/shared';

const logger = createLogger('cart-controller');

export class CartController {
  private cartService: CartService;

  constructor() {
    this.cartService = new CartService();
  }

  getCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    
    logger.info('Fetching cart', { userId });
    
    const cart = await this.cartService.getCart(userId);
    
    res.json({
      success: true,
      message: 'Cart retrieved successfully',
      data: cart
    });
  });

  addToCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { productId, quantity } = req.body;
    
    logger.info('Adding item to cart', { userId, productId, quantity });
    
    const cartItem = await this.cartService.addToCart(userId, productId, quantity);
    
    logger.info('Item added to cart successfully', { userId, productId, cartItemId: cartItem.id });
    
    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cartItem
    });
  });

  updateCartItem = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { productId } = req.params;
    const { quantity } = req.body;
    
    logger.info('Updating cart item', { userId, productId, quantity });
    
    const cartItem = await this.cartService.updateCartItem(userId, productId, quantity);
    
    logger.info('Cart item updated successfully', { userId, productId });
    
    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: cartItem
    });
  });

  removeFromCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { productId } = req.params;
    
    logger.info('Removing item from cart', { userId, productId });
    
    await this.cartService.removeFromCart(userId, productId);
    
    logger.info('Item removed from cart successfully', { userId, productId });
    
    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  });

  clearCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    
    logger.info('Clearing cart', { userId });
    
    await this.cartService.clearCart(userId);
    
    logger.info('Cart cleared successfully', { userId });
    
    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  });
}