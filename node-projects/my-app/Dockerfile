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

# Set environment to development by default
ENV NODE_ENV=development

# Start the development server by default
CMD ["npm", "run", "dev"]
