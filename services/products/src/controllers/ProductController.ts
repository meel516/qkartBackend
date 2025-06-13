import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { asyncHandler, createLogger } from '@microservice/shared';

const logger = createLogger('product-controller');

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  getProducts = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query;
    
    logger.info('Fetching products', { query });
    
    const result = await this.productService.getProducts(query);
    
    res.json({
      success: true,
      message: 'Products retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });
  });

  getProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    logger.info('Fetching product', { productId: id });
    
    const product = await this.productService.getProduct(id);
    
    res.json({
      success: true,
      message: 'Product retrieved successfully',
      data: product
    });
  });

  getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.params;
    const query = req.query;
    
    logger.info('Fetching products by category', { category, query });
    
    const result = await this.productService.getProductsByCategory(category, query);
    
    res.json({
      success: true,
      message: 'Products retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });
  });

  createProduct = asyncHandler(async (req: Request, res: Response) => {
    const productData = req.body;
    
    logger.info('Creating product', { productData });
    
    const product = await this.productService.createProduct(productData);
    
    logger.info('Product created successfully', { productId: product.id });
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  });

  updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    
    logger.info('Updating product', { productId: id, updateData });
    
    const product = await this.productService.updateProduct(id, updateData);
    
    logger.info('Product updated successfully', { productId: id });
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  });

  deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    logger.info('Deleting product', { productId: id });
    
    await this.productService.deleteProduct(id);
    
    logger.info('Product deleted successfully', { productId: id });
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  });
}