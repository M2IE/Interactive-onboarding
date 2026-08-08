package pdfengine

import (
	"context"
	"fmt"
)

type Type string

const (
	SignintechGoPDF Type = "signintechgopdf"
	TypeGPDF        Type = "gpdf"
)

type Engine interface {
	GeneratePDF(ctx context.Context, content Content) ([]byte, error)
}

func New(engineType Type) (Engine, error) {
	switch engineType {
	case SignintechGoPDF:
		return NewSignintech(), nil
	case TypeGPDF:
		return NewGPDF(), nil
	default:
		return nil, fmt.Errorf("unsupported pdf engine type: %s", engineType)
	}
}
