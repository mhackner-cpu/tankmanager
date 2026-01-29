FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy built application
COPY dist ./dist/

# Expose port
EXPOSE 3005

# Run migrations and start
CMD npx prisma migrate deploy && node dist/main
