package publishes

import (
	"context"
	"log/slog"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

type IPublishInfrastructure interface {
	GetScenario(ctx context.Context, db database.Querier, id uuid.UUID) (*domain.Scenario, error)
	CreateScenario(ctx context.Context, db database.Querier, projectID uuid.UUID, name, url string, status domain.ScenarioStatus) (*domain.Scenario, error)
	UpdateScenarioStatus(ctx context.Context, db database.Querier, id uuid.UUID, status domain.ScenarioStatus) error
	ArchiveByProjectAndStatus(ctx context.Context, db database.Querier, projectID uuid.UUID, status domain.ScenarioStatus, url string) (int64, error)
	CopyStepsToScenario(ctx context.Context, db database.Querier, destScenarioID, srcScenarioID uuid.UUID) error
}

type PublishService struct {
	infra     IPublishInfrastructure
	txManager database.Database
}

func NewPublishService(infra IPublishInfrastructure, txManager database.Database) *PublishService {
	return &PublishService{
		infra:     infra,
		txManager: txManager,
	}
}

func (s *PublishService) Publish(ctx context.Context, scenarioID uuid.UUID) (result *domain.Scenario, err error) {
	tx, err := s.txManager.Begin()
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				slog.Error("failed to rollback publish transaction", "error", rbErr)
			}
		}
	}()

	draft, err := s.infra.GetScenario(ctx, tx, scenarioID)
	if err != nil {
		return nil, err
	}
	if draft.Status == domain.ScenarioStatusPublished {
		return nil, domain.ErrScenarioAlreadyPublished
	}

	_, err = s.infra.ArchiveByProjectAndStatus(ctx, tx, draft.ProjectID, domain.ScenarioStatusPublished, draft.URL)
	if err != nil {
		return nil, err
	}

	published, err := s.infra.CreateScenario(ctx, tx, draft.ProjectID, draft.Name, draft.URL, domain.ScenarioStatusPublished)
	if err != nil {
		return nil, err
	}

	err = s.infra.CopyStepsToScenario(ctx, tx, published.ID, draft.ID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return published, nil
}

func (s *PublishService) Unpublish(ctx context.Context, scenarioID uuid.UUID) (err error) {
	tx, err := s.txManager.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				slog.Error("failed to rollback unpublish transaction", "error", rbErr)
			}
		}
	}()

	scenario, err := s.infra.GetScenario(ctx, tx, scenarioID)
	if err != nil {
		return err
	}
	if scenario.Status != domain.ScenarioStatusPublished {
		return domain.ErrScenarioAlreadyUnpublished
	}

	err = s.infra.UpdateScenarioStatus(ctx, tx, scenarioID, domain.ScenarioStatusDraft)
	if err != nil {
		return err
	}

	return tx.Commit()
}
