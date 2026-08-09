package server

import (
	"log/slog"
	"net/http"
	"time"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/widget"
	"github.com/go-chi/chi/v5/middleware"
)

func New(handler apiv1.ServerInterface, port string, logger *slog.Logger) *http.Server {
	r := apiv1.HandlerWithOptions(handler, apiv1.ChiServerOptions{
		Middlewares: []apiv1.MiddlewareFunc{
			middleware.RequestID,
			middleware.Recoverer,
			requestLogger(logger),
		},
		ErrorHandlerFunc: func(w http.ResponseWriter, r *http.Request, err error) {
			logger.Error("request error", "error", err, "path", r.URL.Path)
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		},
	})

	return &http.Server{
		Addr:              port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
	}
}

func requestLogger(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
			next.ServeHTTP(ww, r)
			logger.Info("request",
				"method", r.Method,
				"path", r.URL.Path,
				"status", ww.Status(),
				"bytes", ww.BytesWritten(),
				"duration_ms", time.Since(start).Milliseconds(),
				"request_id", middleware.GetReqID(r.Context()),
			)
		})
	}
}
