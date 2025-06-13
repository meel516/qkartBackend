import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { asyncHandler, createLogger } from '@microservice/shared';

const logger = createLogger('auth-controller');

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    
    logger.info('User registration attempt', { email });
    
    const result = await this.authService.register({ email, password, name });
    
    logger.info('User registered successfully', { userId: result.user.id, email });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    logger.info('User login attempt', { email });
    
    const result = await this.authService.login({ email, password });
    
    logger.info('User logged in successfully', { userId: result.user.id, email });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    const result = await this.authService.refreshToken(refreshToken);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    const user = await this.authService.getProfile(token);
    
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user }
    });
  });
}