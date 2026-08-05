# ^^^^^^^^^^^^^^^ BUILD ^^^^^^^^^^^^^^^
FROM golang:1.26.5-alpine3.24 AS builder

WORKDIR /app
COPY . .

RUN CGO_ENABLED=0 go build -o /admin ./services/admin/cmd/admin

# ^^^^^^^^^^^^^^^ RUNTIME ^^^^^^^^^^^^^^^
FROM alpine:3.24

WORKDIR /app

COPY --from=builder /admin ./admin

CMD ["/app/admin"]
