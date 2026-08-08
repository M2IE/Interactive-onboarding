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

	if err := ensureDraftScenario(ctx, db, projectID); err != nil {
		slog.Error("failed to create draft scenario", "error", err)
		os.Exit(1)
	}
	slog.Info("draft scenario ready", "url", "/getting-started")

	pubScenarioID, stepIDs, err := ensurePublishedScenario(ctx, db, projectID)
	if err != nil {
		slog.Error("failed to create published scenario", "error", err)
		os.Exit(1)
	}
	slog.Info("published scenario ready", "id", pubScenarioID)

	if err := ensureEvents(ctx, db, projectID, pubScenarioID, stepIDs); err != nil {
		slog.Error("failed to create events", "error", err)
		os.Exit(1)
	}
	slog.Info("events created", "scenario_id", pubScenarioID)

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

func ensureDraftScenario(ctx context.Context, db database.Database, projectID uuid.UUID) error {
	var scenarioID uuid.UUID
	err := db.QueryRowContext(ctx,
		`INSERT INTO scenario (project_id, name, url, status)
		 VALUES ($1, $2, $3, $4) RETURNING id`,
		projectID, "Getting Started", "/getting-started", "draft",
	).Scan(&scenarioID)
	if err != nil {
		return fmt.Errorf("create draft scenario: %w", err)
	}

	steps := []struct {
		orderNum int32
		selector string
		title    string
		body     string
	}{
		{1, "#welcome", "Welcome", "Welcome to the platform! This is your first step."},
		{2, "#dashboard", "Dashboard", "Here you can see all your important metrics and data."},
		{3, "#settings", "Settings", "Configure your account settings here."},
	}
	for _, s := range steps {
		_, err := db.ExecContext(ctx,
			`INSERT INTO step (scenario_id, order_num, selector, title, body)
			 VALUES ($1, $2, $3, $4, $5)`,
			scenarioID, s.orderNum, s.selector, s.title, s.body,
		)
		if err != nil {
			return fmt.Errorf("create step '%s': %w", s.title, err)
		}
	}
	return nil
}

func ensurePublishedScenario(ctx context.Context, db database.Database, projectID uuid.UUID) (uuid.UUID, []uuid.UUID, error) {
	var scenarioID uuid.UUID
	err := db.QueryRowContext(ctx,
		`INSERT INTO scenario (project_id, name, url, status)
		 VALUES ($1, $2, $3, $4) RETURNING id`,
		projectID, "User Profile", "/profile", "published",
	).Scan(&scenarioID)
	if err != nil {
		return uuid.Nil, nil, fmt.Errorf("create published scenario: %w", err)
	}

	stepDefs := []struct {
		orderNum int32
		selector string
		title    string
		body     string
	}{
		{1, "#profile", "Profile Setup", "Set up your profile by filling in your personal details."},
		{2, "#avatar", "Upload Avatar", "Upload a profile picture to personalize your account."},
	}

	var stepIDs []uuid.UUID
	for _, s := range stepDefs {
		var stepID uuid.UUID
		err := db.QueryRowContext(ctx,
			`INSERT INTO step (scenario_id, order_num, selector, title, body)
			 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
			scenarioID, s.orderNum, s.selector, s.title, s.body,
		).Scan(&stepID)
		if err != nil {
			return uuid.Nil, nil, fmt.Errorf("create step '%s': %w", s.title, err)
		}
		stepIDs = append(stepIDs, stepID)
	}
	return scenarioID, stepIDs, nil
}

func ensureEvents(ctx context.Context, db database.Database, projectID, scenarioID uuid.UUID, stepIDs []uuid.UUID) error {
	exec := func(stepID sql.NullString, sessionID, eventType string) error {
		_, err := db.ExecContext(ctx,
			`INSERT INTO event (project_id, scenario_id, step_id, session_id, type)
			 VALUES ($1, $2, $3, $4, $5)`,
			projectID, scenarioID, stepID, sessionID, eventType,
		)
		return err
	}

	nullStep := sql.NullString{Valid: false}
	step1 := sql.NullString{String: stepIDs[0].String(), Valid: true}
	step2 := sql.NullString{String: stepIDs[1].String(), Valid: true}

	for i := range 10 {
		if err := exec(step1, fmt.Sprintf("session-step1-%d", i), "step_viewed"); err != nil {
			return fmt.Errorf("create step_viewed: %w", err)
		}
	}
	for i := range 7 {
		if err := exec(step2, fmt.Sprintf("session-step2-%d", i), "step_viewed"); err != nil {
			return fmt.Errorf("create step_viewed: %w", err)
		}
	}
	for i := range 5 {
		if err := exec(step1, fmt.Sprintf("session-c1-%d", i), "step_completed"); err != nil {
			return fmt.Errorf("create step_completed: %w", err)
		}
	}
	for i := range 3 {
		if err := exec(step2, fmt.Sprintf("session-c2-%d", i), "step_completed"); err != nil {
			return fmt.Errorf("create step_completed: %w", err)
		}
	}
	for i := range 2 {
		if err := exec(nullStep, fmt.Sprintf("session-sc-%d", i), "scenario_completed"); err != nil {
			return fmt.Errorf("create scenario_completed: %w", err)
		}
	}
	if err := exec(nullStep, "session-dismiss", "scenario_dismissed"); err != nil {
		return fmt.Errorf("create scenario_dismissed: %w", err)
	}

	return nil
}
