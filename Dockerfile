FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
ENV PORT=56245
EXPOSE 56245
CMD ["node", "dist/index.js"]
