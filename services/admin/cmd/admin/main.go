package main

import (
	"context"
	"log"
	"net/http"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/pkg/database"
	config "github.com/M2IE/Interactive-onboarding/services/admin/internal/config"
	delivery "github.com/M2IE/Interactive-onboarding/services/admin/internal/delivery/http"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/infrastructure"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	db, err := database.New(context.Background(), database.Postgres, cfg.DSN())
	if err != nil {
		log.Fatalf("Database connection error: %v", err)
	}
	defer func() {
		if err = db.Close(); err != nil {
			log.Fatalf("error while closing db: %v", err)
		}
	}()

	q := queries.New()
	infra := infrastructure.NewInfrastructure(db, q)
	service := service.NewService(infra, db)
	handler := delivery.NewHandler(service)

	r := apiv1.HandlerWithOptions(handler, apiv1.ChiServerOptions{
		ErrorHandlerFunc: func(w http.ResponseWriter, r *http.Request, err error) {
			http.Error(w, err.Error(), http.StatusBadRequest)
		},
	})

	log.Printf("admin-service listening on %s", cfg.ServicePort)
	log.Fatal(http.ListenAndServe(cfg.ServicePort, r))
}
