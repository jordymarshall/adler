FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=8080 ADLER_DATA_DIR=/data
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && mkdir /data && chown node:node /data
COPY --from=build /app/dist ./dist
COPY docs/research ./docs/research
COPY server ./server
COPY shared ./shared
COPY src ./src
USER node
VOLUME /data
EXPOSE 8080
CMD ["npm", "start"]
