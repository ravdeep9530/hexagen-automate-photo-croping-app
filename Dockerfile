FROM node:18-alpine

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm install --no-audit --no-fund --legacy-peer-deps

COPY . .

EXPOSE 3000

CMD ["npx", "next", "dev", "-p", "3000"]
