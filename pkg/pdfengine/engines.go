package pdfengine

import (
	"context"
	"fmt"

	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine/elements"
)

type Type string

const (
	TypeGPDF Type = "gpdf"
)

type Engine interface {
	GeneratePDF(ctx context.Context, content elements.Content) ([]byte, error)
}

func New(engineType Type) (Engine, error) {
	switch engineType {
	case TypeGPDF:
		return NewGPDF(), nil
	default:
		return nil, fmt.Errorf("unsupported pdf engine type: %s", engineType)
	}
}
