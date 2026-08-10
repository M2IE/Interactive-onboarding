package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"

	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
	"github.com/M2IE/Interactive-onboarding/pkg/clickhouse"
	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/config"
	chq "github.com/M2IE/Interactive-onboarding/services/admin/queries/clickhouse"
	"github.com/google/uuid"
)

type stepDef struct {
	orderNum int32
	selector string
	title    string
	body     string
	nextURL  string
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

	chConn, err := clickhouse.New(ctx, clickhouse.Options{
		Addr:     cfg.Addr(),
		Database: cfg.ClickHouseConfig.DBName,
		Username: cfg.ClickHouseConfig.User,
		Password: cfg.ClickHouseConfig.Password,
	})

	if err != nil {
		slog.Error("failed to connect to clickhouse", "error", err)
		os.Exit(1)
	}

	defer func() { _ = chConn.Close() }()

	projectID, err := ensureProject(ctx, db)
	if err != nil {
		slog.Error("failed to create project", "error", err)
		os.Exit(1)
	}

	slog.Info("project ready", "id", projectID)

	scenarios := []scenarioDef{
		{
			url:  "/demo/profile",
			name: "Первое объявление: профиль",
			steps: []stepDef{
				{1, `[data-onboarding-id="profile-create-button"]`, "Начните с первого объявления", "После регистрации профиль пустой. Самый короткий путь к продаже начинается с кнопки размещения.", "/demo/new"},
			},
		},
		{
			url:  "/demo/new",
			name: "Первое объявление: категория",
			steps: []stepDef{
				{1, `[data-onboarding-id="category-transport"]`, "Выберите транспорт", "В транспорте важны дополнительные данные: тип, состояние, фото, VIN и пробег. Поэтому путь здесь подробнее.", "/demo/new/transport"},
			},
		},
		{
			url:  "/demo/new/transport",
			name: "Первое объявление: тип транспорта",
			steps: []stepDef{
				{1, `[data-onboarding-id="transport-used-car"]`, "Уточните тип объявления", "Для автомобиля с пробегом откроется форма с данными, которые помогают покупателю быстрее принять решение.", "/demo/new/auto"},
			},
		},
		{
			url:  "/demo/new/auto",
			name: "Первое объявление: автомобиль",
			steps: []stepDef{
				{1, `[data-onboarding-id="auto-photos"]`, "Добавьте фото автомобиля", "Первые фото снаружи и внутри помогают покупателю оценить состояние до переписки и осмотра.", ""},
				{2, `[data-onboarding-id="auto-details"]`, "Заполните данные для доверия", "VIN, пробег и технические параметры снижают сомнения покупателя и уменьшают лишние вопросы.", ""},
				{3, `[data-onboarding-id="auto-publish"]`, "Проверьте цену и опубликуйте", "Цена, контакты и способ связи завершают объявление. После проверки его можно размещать.", ""},
			},
		},
	}

	for _, s := range scenarios {
		if err := ensureScenarioPair(ctx, db, chConn, projectID, s); err != nil {
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
		`INSERT INTO project (name, project_key) VALUES ($1, $2)
		 ON CONFLICT (project_key) DO UPDATE SET name = EXCLUDED.name
		 RETURNING id`,
		"Interactive Onboarding", "interactive-onboarding",
	).Scan(&id)
	if err != nil {
		return uuid.Nil, fmt.Errorf("create project: %w", err)
	}
	return id, nil
}

func ensureScenarioPair(ctx context.Context, db database.Database, ch driver.Conn, projectID uuid.UUID, def scenarioDef) error {
	if _, err := db.ExecContext(ctx,
		`DELETE FROM scenario WHERE project_id = $1 AND url = $2`,
		projectID, def.url,
	); err != nil {
		return fmt.Errorf("delete previous seed: %w", err)
	}

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

	if err := seedEvents(ctx, ch, projectID, pubID, stepIDs); err != nil {
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
			`INSERT INTO step (scenario_id, order_num, selector, title, body, next_url)
			 VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')) RETURNING id`,
			scenarioID, s.orderNum, s.selector, s.title, s.body, s.nextURL,
		).Scan(&stepID)
		if err != nil {
			return uuid.Nil, nil, err
		}
		stepIDs = append(stepIDs, stepID)
	}
	return scenarioID, stepIDs, nil
}

func seedEvents(ctx context.Context, ch driver.Conn, projectID, scenarioID uuid.UUID, stepIDs []uuid.UUID) error {
	batch, err := ch.PrepareBatch(ctx, chq.InsertEvent)
	if err != nil {
		return err
	}

	add := func(stepID *uuid.UUID, sessionID, eventType string) error {
		return batch.Append(uuid.New(), projectID, scenarioID, stepID, sessionID, eventType, uuid.NewString())
	}

	step1 := &stepIDs[0]
	step2 := &stepIDs[1]

	specs := []struct {
		count     int
		stepID    *uuid.UUID
		prefix    string
		eventType string
	}{
		{10, step1, "session-s1", "step_viewed"},
		{7, step2, "session-s2", "step_viewed"},
		{5, step1, "session-c1", "step_completed"},
		{3, step2, "session-c2", "step_completed"},
		{2, nil, "session-sc", "scenario_completed"},
		{1, nil, "session-dismiss", "scenario_dismissed"},
	}

	for _, sp := range specs {
		for i := range sp.count {
			if err := add(sp.stepID, fmt.Sprintf("%s-%d", sp.prefix, i), sp.eventType); err != nil {
				return err
			}
		}
	}

	return batch.Send()
}
