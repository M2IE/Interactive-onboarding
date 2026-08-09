package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

type Project struct {
	ID         uuid.UUID
	Name       string
	ProjectKey string
	CreatedAt  time.Time
}

var ErrProjectNotFound = errors.New("project not found")
