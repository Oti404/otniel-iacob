FROM node:20-alpine AS build
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

# Build from the frontend directory
WORKDIR /app/frontend
RUN npm run build -- --configuration=production
FROM nginx:alpine
# Copy built files from the frontend directory
COPY --from=build /app/frontend/dist/portofoliu-personal/browser /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
