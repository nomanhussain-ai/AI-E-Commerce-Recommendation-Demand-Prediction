# web — Next.js 16 (dev target; compose mounts the source and runs `next dev`)
FROM node:22-slim

ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY web/package.json ./web/
RUN pnpm install --frozen-lockfile

COPY web/ ./web/

EXPOSE 3000
CMD ["pnpm", "--filter", "web", "dev"]
