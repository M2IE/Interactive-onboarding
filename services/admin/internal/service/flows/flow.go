package flows

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
	"github.com/gosimple/slug"
)

type IFlowInfrastructure interface {
	CreateFlow(ctx context.Context, db rdb.Querier, flow *domain.Flow) (*domain.Flow, error)
	GetFlowByID(ctx context.Context, db rdb.Querier, id uuid.UUID) (*domain.Flow, error)
	GetFlowByProject(ctx context.Context, db rdb.Querier, projectID uuid.UUID) ([]domain.Flow, error)
	GetFlowByKey(ctx context.Context, db rdb.Querier, projectID uuid.UUID, key string) (*domain.Flow, error)
	UpdateFlow(ctx context.Context, db rdb.Querier, flow *domain.Flow) error
	DeleteFlow(ctx context.Context, db rdb.Querier, id uuid.UUID) error
	AddScenarioToFlow(ctx context.Context, db rdb.Querier, flowID, scenarioID uuid.UUID, orderNum int) error
	RemoveScenarioFromFlow(ctx context.Context, db rdb.Querier, flowID, scenarioID uuid.UUID) error
	GetFlowScenarios(ctx context.Context, db rdb.Querier, flowID uuid.UUID) ([]domain.FlowScenario, error)
	UpdateScenariosOrderInFlow(ctx context.Context, db rdb.Querier, flowID, scenarioID uuid.UUID, newOrder int) error
	Get(ctx context.Context, db rdb.Querier, scenarioID uuid.UUID) (*domain.Scenario, error)
	ClearFlowScenarios(ctx context.Context, db rdb.Querier, flowID uuid.UUID) error
	GetFlowScenariosWithDetails(ctx context.Context, db rdb.Querier, flowID uuid.UUID) ([]domain.FlowScenarioDetail, error)
}

type FlowService struct {
	infra     IFlowInfrastructure
	txManager rdb.Database
}

func NewFlowsService(infra IFlowInfrastructure, txManager rdb.Database) *FlowService {
	return &FlowService{
		infra:     infra,
		txManager: txManager,
	}
}

func (s *FlowService) CreateFlow(ctx context.Context, projectID uuid.UUID, name string, description *string, flowKey *string) (*domain.Flow, error) {
	tx, err := s.txManager.Begin()
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				slog.Error("rollback create flow", "error", rbErr)
			}
		}
	}()

	// Если flowKey не передан, генерируем
	var key string
	if flowKey != nil && *flowKey != "" {
		key = *flowKey
	} else {
		key = generateFlowKey(name)
	}

	// Проверяем уникальность flowKey в рамках проекта
	existing, _ := s.infra.GetFlowByKey(ctx, tx, projectID, key)
	if existing != nil {
		return nil, domain.ErrFlowKeyExists
	}

	id, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	flow := &domain.Flow{
		ID:          id,
		ProjectID:   projectID,
		Name:        name,
		Description: description,
		FlowKey:     key,
	}

	flowCreated, err := s.infra.CreateFlow(ctx, tx, flow)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return flowCreated, nil
}

func (s *FlowService) ListFlows(ctx context.Context, projectID uuid.UUID) ([]domain.Flow, error) {
	flows, err := s.infra.GetFlowByProject(ctx, nil, projectID)
	if err != nil {
		return nil, fmt.Errorf("list flows: %w", err)
	}
	return flows, nil
}

func (s *FlowService) GetFlowByID(ctx context.Context, flowID uuid.UUID) (*domain.Flow, error) {
	flow, err := s.infra.GetFlowByID(ctx, nil, flowID)
	if err != nil {
		return nil, err
	}
	return flow, nil
}

func (s *FlowService) UpdateFlow(ctx context.Context, flowID uuid.UUID, name *string, description *string) (*domain.Flow, error) {
	tx, err := s.txManager.Begin()
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				slog.Error("rollback update flow", "error", rbErr)
			}
		}
	}()

	flow, err := s.infra.GetFlowByID(ctx, tx, flowID)
	if err != nil {
		return nil, err
	}
	if name != nil {
		flow.Name = *name
	}
	if description != nil {
		flow.Description = description
	}
	err = s.infra.UpdateFlow(ctx, tx, flow)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return flow, nil
}

func (s *FlowService) DeleteFlow(ctx context.Context, flowID uuid.UUID) error {
	tx, err := s.txManager.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				slog.Error("rollback delete flow", "error", rbErr)
			}
		}
	}()

	// Проверяем существование
	_, err = s.infra.GetFlowByID(ctx, tx, flowID)
	if err != nil {
		return err
	}
	err = s.infra.DeleteFlow(ctx, tx, flowID)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func (s *FlowService) AddScenarioToFlow(ctx context.Context, flowID, scenarioID uuid.UUID, orderNum int) error {
	tx, err := s.txManager.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				slog.Error("rollback add scenario", "error", rbErr)
			}
		}
	}()

	// Проверяем существование потока
	_, err = s.infra.GetFlowByID(ctx, tx, flowID)
	if err != nil {
		return err
	}
	// Проверяем существование сценария
	_, err = s.infra.Get(ctx, tx, scenarioID)
	if err != nil {
		return err
	}

	scenarios, err := s.infra.GetFlowScenarios(ctx, tx, flowID)
	if err != nil {
		return err
	}
	for _, sc := range scenarios {
		if sc.ScenarioID == scenarioID {
			return domain.ErrScenarioAlreadyInFlow
		}
	}

	for _, sc := range scenarios {
		if sc.OrderNum == orderNum {
			return domain.ErrInvalidOrder
		}
	}
	err = s.infra.AddScenarioToFlow(ctx, tx, flowID, scenarioID, orderNum)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func (s *FlowService) RemoveScenarioFromFlow(ctx context.Context, flowID, scenarioID uuid.UUID) error {
	tx, err := s.txManager.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				slog.Error("rollback remove scenario", "error", rbErr)
			}
		}
	}()

	// Проверяем, что сценарий есть в потоке
	scenarios, err := s.infra.GetFlowScenarios(ctx, tx, flowID)
	if err != nil {
		return err
	}
	found := false
	for _, sc := range scenarios {
		if sc.ScenarioID == scenarioID {
			found = true
			break
		}
	}
	if !found {
		return domain.ErrScenarioNotInFlow
	}
	err = s.infra.RemoveScenarioFromFlow(ctx, tx, flowID, scenarioID)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func (s *FlowService) ReorderFlowScenarios(ctx context.Context, flowID uuid.UUID, items []domain.ReorderFlowItem) error {
	tx, err := s.txManager.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				slog.Error("rollback reorder", "error", rbErr)
			}
		}
	}()

	// Проверяем существование потока
	_, err = s.infra.GetFlowByID(ctx, tx, flowID)
	if err != nil {
		return err
	}

	// Получаем текущие связи для проверки, что все сценарии существуют
	currentScenarios, err := s.infra.GetFlowScenarios(ctx, tx, flowID)
	if err != nil {
		return err
	}
	currentMap := make(map[uuid.UUID]bool)
	for _, sc := range currentScenarios {
		currentMap[sc.ScenarioID] = true
	}

	// Проверяем, что все переданные сценарии принадлежат потоку и порядки уникальны
	orderSet := make(map[int]bool)
	for _, item := range items {
		if !currentMap[item.ScenarioID] {
			return domain.ErrScenarioNotInFlow
		}
		if orderSet[item.OrderNum] {
			return domain.ErrInvalidOrder
		}
		orderSet[item.OrderNum] = true
	}

	// Удаляем все связи для потока
	if err := s.infra.ClearFlowScenarios(ctx, tx, flowID); err != nil {
		return err
	}

	// Вставляем новые связи с новым порядком
	for _, item := range items {
		if err := s.infra.AddScenarioToFlow(ctx, tx, flowID, item.ScenarioID, item.OrderNum); err != nil {
			return err
		}
	}

	return tx.Commit()
}

// Вспомогательная функция для генерации flowKey
func generateFlowKey(name string) string {
	return slug.Make(name) + "-" + uuid.New().String()[:8]
}

func (s *FlowService) GetFlowWithScenarios(ctx context.Context, flowID uuid.UUID) (*domain.FlowWithScenarios, error) {
	tx, err := s.txManager.Begin()
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	flow, err := s.infra.GetFlowByID(ctx, tx, flowID)
	if err != nil {
		return nil, err
	}

	// Получаем сценарии с порядком и деталями сценариев
	flowScenarios, err := s.infra.GetFlowScenariosWithDetails(ctx, tx, flowID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return &domain.FlowWithScenarios{
		Flow:      *flow,
		Scenarios: flowScenarios,
	}, nil
}
