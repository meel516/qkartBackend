import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { validateBody, validateQuery, authenticateToken, optionalAuth } from '@microservice/shared';
import { createProductSchema, updateProductSchema, paginationSchema } from '@microservice/shared';

const router = Router();
const productController = new ProductController();

// Public routes
router.get('/', validateQuery(paginationSchema), productController.getProducts);
router.get('/:id', productController.getProduct);
router.get('/category/:category', validateQuery(paginationSchema), productController.getProductsByCategory);

// Protected routes (require authentication)
router.post('/', authenticateToken, validateBody(createProductSchema), productController.createProduct);
router.put('/:id', authenticateToken, validateBody(updateProductSchema), productController.updateProduct);
router.delete('/:id', authenticateToken, productController.deleteProduct);

export { router as productRoutes };