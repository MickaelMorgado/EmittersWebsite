FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./


# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port 5173
EXPOSE 5173

# Start development server with hot-reload
CMD ["npm", "start"]
