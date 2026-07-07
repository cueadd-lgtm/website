FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application
COPY . .

# Build
RUN npm run build

# Expose
EXPOSE 3000

# Start
CMD ["npm", "start"]
