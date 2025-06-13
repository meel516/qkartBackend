FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY services/cart/package*.json ./services/cart/

# Install dependencies
RUN npm install

# Copy shared library
COPY shared ./shared
RUN cd shared && npm run build

# Copy service code
COPY services/cart ./services/cart

# Generate Prisma client
RUN cd services/cart && npx prisma generate

# Build the application
RUN cd services/cart && npm run build

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3003

# Start the application
CMD ["npm", "run", "start", "--workspace=services/cart"]