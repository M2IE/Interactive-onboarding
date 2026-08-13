package scenarios

import (
	"context"
	"database/sql"
	"errors"

	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

const duplicateErrPgCode = "23505"

type ScenarioInfrastructure struct {
	q  *queries.Query
	db rdb.Database
}

func NewScenarioInfrastructure(db rdb.Database, q *queries.Query) *ScenarioInfrastructure {
	return &ScenarioInfrastructure{
		q:  q,
		db: db,
	}
}

func (s *ScenarioInfrastructure) Create(ctx context.Context, db rdb.Querier, projectID uuid.UUID, name, url string, status domain.ScenarioStatus) (*domain.Scenario, error) {
	row, err := s.q.CreateScenario(ctx, s.querier(db), toGenCreateScenarioParams(projectID, name, url, status))
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == duplicateErrPgCode {
			return nil, domain.ErrScenarioDraftAlreadyExists
		}

		return nil, err
	}

	return toDomainScenario(&row), nil
}

func (s *ScenarioInfrastructure) Get(ctx context.Context, db rdb.Querier, scenarioID uuid.UUID) (*domain.Scenario, error) {
	row, err := s.q.GetScenario(ctx, s.querier(db), scenarioID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrScenarioNotFound
		}
		return nil, err
	}

	return toDomainScenario(&row), nil
}

func (s *ScenarioInfrastructure) GetSteps(ctx context.Context, db rdb.Querier, scenarioID uuid.UUID) ([]domain.Step, error) {
	rows, err := s.q.GetStepsByScenario(ctx, s.querier(db), scenarioID)
	if err != nil {
		return nil, err
	}

	return toDomainSteps(rows), nil
}

func (s *ScenarioInfrastructure) List(ctx context.Context, db rdb.Querier, size, page int, projectID *uuid.UUID) ([]domain.Scenario, int64, error) {
	offset := (page - 1) * size
	rows, err := s.q.ListScenarios(ctx, s.querier(db), toGenListScenarioParams(offset, size, projectID))
	if err != nil {
		return nil, 0, err
	}

	scenarios, total := toDomainListScenarios(rows)
	return scenarios, total, nil
}

func (s *ScenarioInfrastructure) Update(ctx context.Context, db rdb.Querier, id uuid.UUID, name, url *string) (*domain.Scenario, error) {
	row, err := s.q.UpdateScenario(ctx, s.querier(db), toGenUpdateScenarioParams(id, name, url))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrScenarioNotFound
		}

		return nil, err
	}

	return toDomainScenario(&row), nil
}

func (s *ScenarioInfrastructure) querier(db rdb.Querier) rdb.Querier {
	if db != nil {
		return db
	}

	return s.db
}
