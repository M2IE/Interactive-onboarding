package main

import (
	"context"
	"log/slog"
	"os"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/widget"
	"github.com/M2IE/Interactive-onboarding/pkg/database/olap"
	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/config"
	delivery "github.com/M2IE/Interactive-onboarding/services/widget/internal/delivery/http"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/infrastructure"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/server"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/service"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		slog.Error("Config did not parsed", "error", err)
	}

	db, err := rdb.New(context.Background(), rdb.PostgresType, cfg.DSN())
	if err != nil {
		slog.Error("Database connection error", "error", err)
	}
	defer func() {
		if err = db.Close(); err != nil {
			slog.Error("error while closing db", "error", err)
		}
	}()

	chConn, err := olap.New(context.Background(), olap.ClickhouseType, olap.Options{
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
	infra := infrastructure.NewWidgetInfrastructure(db, q, chConn)
	svc := service.NewWidgetService(infra, db)
	handler := delivery.NewWidgetHandler(svc)

	srv := server.New(apiv1.NewStrictHandler(handler, nil), cfg.ServicePort, logger)

	slog.Info("widget service listening", "port", cfg.ServicePort)
	if err := srv.ListenAndServe(); err != nil {
		slog.Error("server stopped", "error", err)
	}
}
