FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY services/products/package*.json ./services/products/

# Install dependencies
RUN npm install

# Copy shared library
COPY shared ./shared
RUN cd shared && npm run build

# Copy service code
COPY services/products ./services/products

# Generate Prisma client
RUN cd services/products && npx prisma generate

# Build the application
RUN cd services/products && npm run build

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3002

# Start the application
CMD ["npm", "run", "start", "--workspace=services/products"]