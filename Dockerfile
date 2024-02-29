# Stage 1: Build Stage
FROM node:lts-alpine AS build-stage
WORKDIR /app 
COPY package.json package-lock.json ./ 
RUN npm install
COPY . .
RUN npm run build 

# Stage 2: Production Stage
FROM node:lts-alpine AS production-stage
WORKDIR /app
COPY --from=build-stage /app/dist/ ./dist
EXPOSE 3000 
CMD ["node", "src/index.js"]

