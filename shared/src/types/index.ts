export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Event Types for RabbitMQ
export interface CartUpdatedEvent {
  type: 'CART_UPDATED';
  userId: string;
  productId: string;
  quantity: number;
  action: 'ADD' | 'REMOVE' | 'UPDATE';
  timestamp: Date;
}

export interface UserRegisteredEvent {
  type: 'USER_REGISTERED';
  userId: string;
  email: string;
  name: string;
  timestamp: Date;
}

export interface ProductUpdatedEvent {
  type: 'PRODUCT_UPDATED';
  productId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  timestamp: Date;
}

export type MessageEvent = CartUpdatedEvent | UserRegisteredEvent | ProductUpdatedEvent;