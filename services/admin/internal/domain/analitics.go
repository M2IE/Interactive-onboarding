package domain

import (
	"github.com/google/uuid"
)

type Analytics struct {
	TotalViews int
	Completed  int
	Dismissed  int
	Steps      []StepAnalytics
}

type StepAnalytics struct {
	StepID    uuid.UUID
	Title     string
	OrderNum  int
	Views     int
	Completed int
}
