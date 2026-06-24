FROM node:20-bookworm-slim

# Real Google Chrome (patchright drives it to pass Cloudflare Turnstile)
RUN apt-get update \
  && apt-get install -y --no-install-recommends wget gnupg ca-certificates fonts-liberation xvfb \
  && wget -q -O /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
  && apt-get install -y --no-install-recommends /tmp/chrome.deb \
  && rm -f /tmp/chrome.deb \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN corepack enable

# patchright uses system Chrome via CHROME_PATH — skip its browser download
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

ENV PORT=56245
ENV CHROME_PATH=/usr/bin/google-chrome-stable
EXPOSE 56245
# headful Chrome under a virtual display (Xvfb started by entrypoint)
CMD ["sh", "/app/entrypoint.sh"]
