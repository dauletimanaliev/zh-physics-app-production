FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server files
COPY . .

# Create database directory
RUN mkdir -p /app/data

EXPOSE 10000

CMD ["node", "index.js"]
