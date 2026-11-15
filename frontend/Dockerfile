FROM node:22-bookworm-slim AS build
WORKDIR /app
ARG VITE_API_BASE_URL=/api/v1
# One writable build layer avoids duplicating node_modules on small VFS runners.
# The read-only source mount respects .dockerignore; secrets remain ephemeral.
RUN --mount=type=bind,source=.,target=/source,readonly \
    --mount=type=secret,id=proxy_ca \
    cp -a /source/. /app/ && \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi && \
    npm ci && \
    VITE_API_BASE_URL="${VITE_API_BASE_URL}" npm run build && \
    rm -rf node_modules
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s CMD wget -Y off -q -O /dev/null http://127.0.0.1/
