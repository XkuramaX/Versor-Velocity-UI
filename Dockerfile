# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# In Docker, API calls go through nginx proxy (relative URLs)
# Empty string means "same origin" — nginx routes /nodes/* and /workflows/* to backend
# and /auth/* to auth-service
ENV VITE_API_URL=""
ENV VITE_AUTH_URL="/auth"

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
