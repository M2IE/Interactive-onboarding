package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/M2IE/Interactive-onboarding/pkg/clickhouse"
	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine"
	"github.com/M2IE/Interactive-onboarding/pkg/s3"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/config"
	delivery "github.com/M2IE/Interactive-onboarding/services/admin/internal/delivery/http"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/infrastructure"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/server"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

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

	pdfEngine, err := pdfengine.New(pdfengine.TypeGPDF)
	if err != nil {
		slog.Error("pdf engine error", "error", err)
		return
	}

	chConn, err := clickhouse.New(context.Background(), clickhouse.Options{
		Addr:     cfg.Addr(),
		Database: cfg.ClickHouseConfig.DBName,
		Username: cfg.ClickHouseConfig.User,
		Password: cfg.ClickHouseConfig.Password,
	})
	if err != nil {
		slog.Error("ClickHouse connection error", "error", err)
		return
	}
	defer func() {
		if err = chConn.Close(); err != nil {
			slog.Error("error while closing clickhouse", "error", err)
		}
	}()

	q := queries.New()
	infra := infrastructure.NewInfrastructure(db, q, chConn, s3Client, pdfEngine, cfg.S3Bucket)
	service := service.NewService(infra, db)
	handler := delivery.NewHandler(service)

	srv := server.New(handler, cfg.ServicePort, logger)

	slog.Info("admin service listening", "port", cfg.ServicePort)
	if err := srv.ListenAndServe(); err != nil {
		slog.Error("server stopped", "error", err)
	}
}
