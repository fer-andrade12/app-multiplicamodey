FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY sql ./sql
COPY .env.example ./

EXPOSE 8080

CMD ["npm", "start"]
