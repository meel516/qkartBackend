import { Router } from 'express';
import { CartController } from '../controllers/CartController';
import { validateBody, authenticateToken } from '@microservice/shared';
import { addToCartSchema, updateCartItemSchema } from '@microservice/shared';

const router = Router();
const cartController = new CartController();

// All cart routes require authentication
router.use(authenticateToken);

router.get('/', cartController.getCart);
router.post('/items', validateBody(addToCartSchema), cartController.addToCart);
router.put('/items/:productId', validateBody(updateCartItemSchema), cartController.updateCartItem);
router.delete('/items/:productId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

export { router as cartRoutes };