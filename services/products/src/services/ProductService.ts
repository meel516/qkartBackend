import { PrismaClient } from '../../prisma/generated/products';
import { 
  AppError, 
  createLogger, 
  redisService, 
  rabbitMQService,
  CreateProductInput,
  UpdateProductInput,
  PaginationInput,
  PaginatedResponse,
  ProductUpdatedEvent
} from '@microservice/shared';

const logger = createLogger('product-service');
const prisma = new PrismaClient();

export class ProductService {
  async getProducts(query: PaginationInput): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Try to get from cache first
    const cacheKey = `products:${JSON.stringify({ query })}`;
    const cachedResult = await redisService.getObject(cacheKey);
    
    if (cachedResult) {
      logger.info('Products retrieved from cache', { cacheKey });
      return cachedResult;
    }

    // Get from database
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.product.count({ where })
    ]);

    const result: PaginatedResponse<any> = {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    // Cache the result for 5 minutes
    await redisService.setObject(cacheKey, result, 300);

    return result;
  }

  async getProduct(id: string) {
    // Try cache first
    const cacheKey = `product:${id}`;
    let product = await redisService.getObject(cacheKey);

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id }
      });

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      // Cache for 10 minutes
      await redisService.setObject(cacheKey, product, 600);
    }

    return product;
  }

  async getProductsByCategory(category: string, query: PaginationInput): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { category };
    if (search) {
      where.AND = [
        { category },
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.product.count({ where })
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createProduct(input: CreateProductInput) {
    const product = await prisma.product.create({
      data: input
    });

    // Invalidate products cache
    await this.invalidateProductsCache();

    // Cache the new product
    await redisService.setObject(`product:${product.id}`, product, 600);

    // Publish product created event
    const event: ProductUpdatedEvent = {
      type: 'PRODUCT_UPDATED',
      productId: product.id,
      action: 'CREATE',
      timestamp: new Date()
    };

    await rabbitMQService.publishEvent('product.events', 'product.created', event);

    logger.info('Product created and event published', { productId: product.id });

    return product;
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    // Check if product exists
    const existingProduct = await this.getProduct(id);

    const product = await prisma.product.update({
      where: { id },
      data: input
    });

    // Update cache
    await redisService.setObject(`product:${id}`, product, 600);

    // Invalidate products cache
    await this.invalidateProductsCache();

    // Publish product updated event
    const event: ProductUpdatedEvent = {
      type: 'PRODUCT_UPDATED',
      productId: product.id,
      action: 'UPDATE',
      timestamp: new Date()
    };

    await rabbitMQService.publishEvent('product.events', 'product.updated', event);

    logger.info('Product updated and event published', { productId: product.id });

    return product;
  }

  async deleteProduct(id: string) {
    // Check if product exists
    await this.getProduct(id);

    await prisma.product.delete({
      where: { id }
    });

    // Remove from cache
    await redisService.del(`product:${id}`);

    // Invalidate products cache
    await this.invalidateProductsCache();

    // Publish product deleted event
    const event: ProductUpdatedEvent = {
      type: 'PRODUCT_UPDATED',
      productId: id,
      action: 'DELETE',
      timestamp: new Date()
    };

    await rabbitMQService.publishEvent('product.events', 'product.deleted', event);

    logger.info('Product deleted and event published', { productId: id });
  }

  private async invalidateProductsCache() {
    // This is a simplified cache invalidation
    // In production, you might want to use cache tags or patterns
    const client = redisService.getClient();
    const keys = await client.keys('products:*');
    
    if (keys.length > 0) {
      await client.del(keys);
      logger.info('Products cache invalidated', { keysCount: keys.length });
    }
  }
}