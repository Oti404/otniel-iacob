FROM node:20-alpine
WORKDIR /app

# Copy root and workspace package.json files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/
COPY database/package*.json ./database/

RUN npm install

# Copy all source code
COPY . .

# Generate Prisma Client for the Docker container's OS
RUN cd database && npx prisma generate

EXPOSE 3000
CMD ["npm", "run", "dev:backend"]
