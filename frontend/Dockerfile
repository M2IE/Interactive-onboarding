FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_MODE=real
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_ONBOARDING_PROJECT_KEY=interactive-onboarding
ARG VITE_ONBOARDING_PROJECT_ID

ENV VITE_API_MODE=$VITE_API_MODE \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_ONBOARDING_PROJECT_KEY=$VITE_ONBOARDING_PROJECT_KEY \
    VITE_ONBOARDING_PROJECT_ID=$VITE_ONBOARDING_PROJECT_ID

COPY . .

RUN npm ci && npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
