package sq

import (
	"github.com/Masterminds/squirrel"
)

type SqBuilder struct {
	squirrel.StatementBuilderType
}

func NewSqBuilder() *SqBuilder {
	return &SqBuilder{
		StatementBuilderType: squirrel.StatementBuilder.PlaceholderFormat(squirrel.Dollar),
	}
}
