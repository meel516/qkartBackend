import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateBody } from '@microservice/shared';
import { registerSchema, loginSchema } from '@microservice/shared';

const router = Router();
const authController = new AuthController();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);

export { router as authRoutes };