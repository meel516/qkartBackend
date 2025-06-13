FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY services/notifications/package*.json ./services/notifications/

# Install dependencies
RUN npm install

# Copy shared library
COPY shared ./shared
RUN cd shared && npm run build

# Copy service code
COPY services/notifications ./services/notifications

# Build the application
RUN cd services/notifications && npm run build

# Expose port
EXPOSE 3004

# Start the application
CMD ["npm", "run", "start", "--workspace=services/notifications"]