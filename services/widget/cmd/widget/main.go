package main

import (
	"context"
	"log/slog"
	"net/http"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/widget"
	"github.com/M2IE/Interactive-onboarding/pkg/database"
	config "github.com/M2IE/Interactive-onboarding/services/widget/internal/config"
	delivery "github.com/M2IE/Interactive-onboarding/services/widget/internal/delivery/http"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/infrastructure"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/service"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("Config did not parsed", "error", err)
	}

	db, err := database.New(context.Background(), database.Postgres, cfg.DSN())
	if err != nil {
		slog.Error("Database connection error", "error", err)
	}
	defer func() {
		if err = db.Close(); err != nil {
			slog.Error("error while closing db", "error", err)
		}
	}()

	q := queries.New()
	infra := infrastructure.NewWidgetInfrastructure(db, q)
	svc := service.NewWidgetService(infra, db)
	handler := delivery.NewWidgetHandler(svc)

	strictHandler := apiv1.NewStrictHandler(handler, nil)

	r := apiv1.HandlerWithOptions(strictHandler, apiv1.ChiServerOptions{
		ErrorHandlerFunc: func(w http.ResponseWriter, r *http.Request, err error) {
			http.Error(w, err.Error(), http.StatusBadRequest)
		},
	})

	slog.Info("widget-service listening on port", "info", cfg.ServicePort)
	slog.Error("error while listening server", "error", http.ListenAndServe(cfg.ServicePort, r))
}
