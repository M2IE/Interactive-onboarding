package main

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"os"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	config "github.com/M2IE/Interactive-onboarding/services/admin/internal/config"
	"github.com/google/uuid"
)

type stepDef struct {
	orderNum int32
	selector string
	title    string
	body     string
}

type scenarioDef struct {
	url   string
	name  string
	steps []stepDef
}

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	db, err := database.New(context.Background(), database.Postgres, cfg.PostgresConfig.DSN())
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer func() { _ = db.Close() }()

	ctx := context.Background()

	projectID, err := ensureProject(ctx, db)
	if err != nil {
		slog.Error("failed to create project", "error", err)
		os.Exit(1)
	}
	slog.Info("project ready", "id", projectID)

	scenarios := []scenarioDef{
		{
			url:  "/demo/profile",
			name: "Profile Setup Demo",
			steps: []stepDef{
				{1, "#profile-info", "Your Profile", "Set up your profile by filling in your personal details, contact information, and preferences."},
				{2, "#profile-avatar", "Upload Photo", "Upload a profile picture to personalize your account and help others recognize you."},
				{3, "#profile-save", "Save Changes", "Click save to apply all your changes and make your profile visible to others."},
			},
		},
		{
			url:  "/demo/new",
			name: "New Item Demo",
			steps: []stepDef{
				{1, "#new-title", "Create New", "Start by giving your item a descriptive name that helps others understand its purpose."},
				{2, "#new-category", "Choose Category", "Select the most appropriate category so your item appears in relevant searches."},
				{3, "#new-description", "Add Description", "Provide detailed information about your item including features, condition, and any special notes."},
				{4, "#new-submit", "Submit", "Review your information and submit to make your item available."},
			},
		},
		{
			url:  "/demo/new/transport",
			name: "Transport Selection Demo",
			steps: []stepDef{
				{1, "#transport-type", "Transport Type", "Choose the type of transport: car, motorcycle, bicycle, or public transit."},
				{2, "#transport-details", "Vehicle Details", "Enter the make, model, year, and any specific features of your vehicle."},
				{3, "#transport-confirm", "Confirm", "Verify your transport selection and submit to continue."},
			},
		},
		{
			url:  "/demo/new/auto",
			name: "Auto Details Demo",
			steps: []stepDef{
				{1, "#auto-brand", "Brand", "Select your car brand from the available manufacturers."},
				{2, "#auto-model", "Model", "Choose the specific model that matches your vehicle."},
				{3, "#auto-year", "Year", "Select the manufacturing year of your vehicle."},
				{4, "#auto-engine", "Engine Specs", "Enter engine details including fuel type, power, and transmission."},
				{5, "#auto-price", "Price", "Set your asking price and any additional notes for buyers."},
			},
		},
	}

	for _, s := range scenarios {
		if err := ensureScenarioPair(ctx, db, projectID, s); err != nil {
			slog.Error("failed to seed scenario", "url", s.url, "error", err)
			os.Exit(1)
		}
		slog.Info("scenario pair ready", "url", s.url)
	}

	slog.Info("seed completed successfully")
}

func ensureProject(ctx context.Context, db database.Database) (uuid.UUID, error) {
	var id uuid.UUID
	err := db.QueryRowContext(ctx,
		`INSERT INTO project (name, project_key) VALUES ($1, $2) RETURNING id`,
		"Interactive Onboarding", "interactive-onboarding",
	).Scan(&id)
	if err != nil {
		return uuid.Nil, fmt.Errorf("create project: %w", err)
	}
	return id, nil
}

func ensureScenarioPair(ctx context.Context, db database.Database, projectID uuid.UUID, def scenarioDef) error {
	_, _, err := createScenario(ctx, db, projectID, def.name, def.url, "draft", def.steps)
	if err != nil {
		return fmt.Errorf("create draft: %w", err)
	}

	pubID, stepIDs, err := createScenario(ctx, db, projectID, def.name, def.url, "published", def.steps)
	if err != nil {
		return fmt.Errorf("create published: %w", err)
	}

	if len(stepIDs) < 2 {
		return nil
	}

	if err := seedEvents(ctx, db, projectID, pubID, stepIDs); err != nil {
		return fmt.Errorf("seed events: %w", err)
	}
	slog.Info("events seeded", "scenario_id", pubID, "url", def.url)
	return nil
}

func createScenario(ctx context.Context, db database.Database, projectID uuid.UUID, name, url, status string, stepDefs []stepDef) (uuid.UUID, []uuid.UUID, error) {
	var scenarioID uuid.UUID
	err := db.QueryRowContext(ctx,
		`INSERT INTO scenario (project_id, name, url, status) VALUES ($1, $2, $3, $4) RETURNING id`,
		projectID, name, url, status,
	).Scan(&scenarioID)
	if err != nil {
		return uuid.Nil, nil, err
	}

	var stepIDs []uuid.UUID
	for _, s := range stepDefs {
		var stepID uuid.UUID
		err := db.QueryRowContext(ctx,
			`INSERT INTO step (scenario_id, order_num, selector, title, body) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
			scenarioID, s.orderNum, s.selector, s.title, s.body,
		).Scan(&stepID)
		if err != nil {
			return uuid.Nil, nil, err
		}
		stepIDs = append(stepIDs, stepID)
	}
	return scenarioID, stepIDs, nil
}

func seedEvents(ctx context.Context, db database.Database, projectID, scenarioID uuid.UUID, stepIDs []uuid.UUID) error {
	exec := func(stepID sql.NullString, sessionID, eventType string) error {
		_, err := db.ExecContext(ctx,
			`INSERT INTO event (id, project_id, scenario_id, step_id, session_id, type, event_key, created_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
			uuid.New(), projectID, scenarioID, stepID, sessionID, eventType, uuid.New(),
		)
		return err
	}

	nullStep := sql.NullString{Valid: false}
	step1 := sql.NullString{String: stepIDs[0].String(), Valid: true}
	step2 := sql.NullString{String: stepIDs[1].String(), Valid: true}

	for i := range 10 {
		if err := exec(step1, fmt.Sprintf("session-s1-%d", i), "step_viewed"); err != nil {
			return err
		}
	}
	for i := range 7 {
		if err := exec(step2, fmt.Sprintf("session-s2-%d", i), "step_viewed"); err != nil {
			return err
		}
	}
	for i := range 5 {
		if err := exec(step1, fmt.Sprintf("session-c1-%d", i), "step_completed"); err != nil {
			return err
		}
	}
	for i := range 3 {
		if err := exec(step2, fmt.Sprintf("session-c2-%d", i), "step_completed"); err != nil {
			return err
		}
	}
	for i := range 2 {
		if err := exec(nullStep, fmt.Sprintf("session-sc-%d", i), "scenario_completed"); err != nil {
			return err
		}
	}
	if err := exec(nullStep, "session-dismiss", "scenario_dismissed"); err != nil {
		return err
	}

	return nil
}
