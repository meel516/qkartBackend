FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY services/auth/package*.json ./services/auth/

# Install dependencies
RUN npm install

# Copy shared library
COPY shared ./shared
RUN cd shared && npm run build

# Copy service code
COPY services/auth ./services/auth

# Generate Prisma client
RUN cd services/auth && npx prisma generate

# Build the application
RUN cd services/auth && npm run build

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "start", "--workspace=services/auth"]