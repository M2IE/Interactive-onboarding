package main

import (
	"context"
	"log/slog"
	"net/http"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine"
	"github.com/M2IE/Interactive-onboarding/pkg/s3"
	config "github.com/M2IE/Interactive-onboarding/services/admin/internal/config"
	delivery "github.com/M2IE/Interactive-onboarding/services/admin/internal/delivery/http"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/infrastructure"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("Config did not parsed", "error", err)
	}

	db, err := database.New(context.Background(), database.Postgres, cfg.PostgresConfig.DSN())
	if err != nil {
		slog.Error("Database connection error", "error", err)
		return
	}
	defer func() {
		if err = db.Close(); err != nil {
			slog.Error("error while closing db", "error", err)
		}
	}()

	s3Client, err := s3.New(context.Background(), s3.TypeRustFS, cfg.ConfigRustFS)
	if err != nil {
		slog.Error("s3 client error", "error", err)
		return
	}

	pdfEngine, err := pdfengine.New(pdfengine.SignintechGoPDF)
	if err != nil {
		slog.Error("pdf engine error", "error", err)
		return
	}

	q := queries.New()
	infra := infrastructure.NewInfrastructure(db, q)
	service := service.NewService(infra, db, s3Client, pdfEngine, cfg.S3Bucket)
	handler := delivery.NewHandler(service)

	r := apiv1.HandlerWithOptions(handler, apiv1.ChiServerOptions{
		ErrorHandlerFunc: func(w http.ResponseWriter, r *http.Request, err error) {
			http.Error(w, err.Error(), http.StatusBadRequest)
		},
	})

	slog.Info("admin-service listening on port", "info", cfg.ServicePort)
	slog.Error("error while listening server", "error", http.ListenAndServe(cfg.ServicePort, r))
}
