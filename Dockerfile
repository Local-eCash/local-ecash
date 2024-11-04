
ARG NODE_VERSION=20
ARG APP_VERSION=unspecified
ARG GIT_COMMIT=unspecified

# alpine
FROM node:${NODE_VERSION}-alpine AS alpine
RUN apk update && apk add --no-cache libc6-compat jq

FROM alpine as base
RUN npm install -g turbo@2.0.6
RUN npm install pnpm --global
RUN pnpm config set store-dir ~/.pnpm-store

# prune project
FROM base AS pruner
WORKDIR /app
COPY . ./

# Add packageManager field to package.json if it is missing
RUN jq '. + { "packageManager": "pnpm@7.0.0" }' package.json > temp.json && mv temp.json package.json

RUN turbo prune "@bcpros/telegram-ecash-escrow" --docker

# install and build
FROM base AS builder
ARG APP_VERSION
ARG GIT_COMMIT
ENV NEXT_PUBLIC_APP_VERSION=$APP_VERSION
ENV NEXT_PUBLIC_COMMIT_HASH=$GIT_COMMIT
ENV HUSKYK=0
WORKDIR /app
# Copy lockfile and package.json's of isolated subworkspace
COPY --from=pruner /app/out/json/ ./

# Create a .npmrc file dynamically
RUN echo "store-dir=~/.pnpm-store" > .npmrc

# Install dependencies without enforcing lockfile
RUN pnpm install --no-frozen-lockfile

# Copy source code of isolated subworkspace
COPY --from=pruner /app/out/full/ ./
COPY turbo.json turbo.json


RUN echo "=== .env Contents During Build ===" && cat /app/apps/telegram-ecash-escrow/.env
RUN pnpm build:app
RUN pnpm prune --prod --no-optional

RUN echo ${APP_VRSION}
RUN echo ${GIT_COMMIT}

# final image
FROM alpine AS runner
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nodejs
USER nodejs
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/apps/telegram-ecash-escrow/.next/standalone /app
COPY --from=builder --chown=nodejs:nodejs /app/apps/telegram-ecash-escrow/public /app/apps/telegram-ecash-escrow/public
COPY --from=builder --chown=nodejs:nodejs /app/apps/telegram-ecash-escrow/.next/static /app/apps/telegram-ecash-escrow/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/apps/telegram-ecash-escrow/.next/server/chunks/ecash_lib_wasm_bg_nodejs.wasm /app/apps/telegram-ecash-escrow/.next/server/chunks/ecash_lib_wasm_bg_nodejs.wasm
WORKDIR /app/apps/telegram-ecash-escrow/
EXPOSE 3000

CMD ["node", "server.js"]
