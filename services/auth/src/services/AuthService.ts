import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from "../../prisma/generated/auth";
import { 
  AppError, 
  createLogger, 
  redisService, 
  rabbitMQService,
  RegisterInput,
  LoginInput,
  JWTPayload,
  UserRegisteredEvent
} from '@microservice/shared';

const logger = createLogger('auth-service');
const prisma = new PrismaClient();

export class AuthService {
  async register(input: RegisterInput) {
    const { email, password, name } = input;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('User already exists with this email', 409);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user.id, email);

    // Cache user in Redis
    await redisService.setObject(`user:${user.id}`, user, 3600); // 1 hour

    // Publish user registered event
    const event: UserRegisteredEvent = {
      type: 'USER_REGISTERED',
      userId: user.id,
      email: user.email,
      name: user.name,
      timestamp: new Date()
    };

    await rabbitMQService.publishEvent('user.events', 'user.registered', event);

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  async login(input: LoginInput) {
    const { email, password } = input;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user.id, email);

    // Cache user in Redis
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    await redisService.setObject(`user:${user.id}`, userWithoutPassword, 3600);

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  }

  async refreshToken(refreshToken: string) {
    // Verify refresh token exists in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: tokenRecord.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(
      user.id, 
      user.email
    );

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { token: refreshToken }
    });

    return {
      user,
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(refreshToken: string) {
    try {
      await prisma.refreshToken.delete({
        where: { token: refreshToken }
      });
    } catch (error) {
      // Token might not exist, but that's okay for logout
      logger.warn('Refresh token not found during logout', { refreshToken });
    }
  }

  async getProfile(accessToken: string) {
    try {
      const payload = jwt.verify(accessToken, process.env.JWT_SECRET!) as JWTPayload;
      
      // Try to get from cache first
      let user = await redisService.getObject(`user:${payload.userId}`);
      
      if (!user) {
        // Get from database if not in cache
        user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true
          }
        });

        if (!user) {
          throw new AppError('User not found', 404);
        }

        // Cache for next time
        await redisService.setObject(`user:${payload.userId}`, user, 3600);
      }

      return user;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid access token', 401);
      }
      throw error;
    }
  }

  private async generateTokens(userId: string, email: string) {
    const payload: JWTPayload = { userId, email };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'defaultSecret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt
      }
    });

    return { accessToken, refreshToken };
  }
}