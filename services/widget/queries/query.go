package queries

import (
	"github.com/M2IE/Interactive-onboarding/services/widget/queries/sqlc/gen"
	sq "github.com/M2IE/Interactive-onboarding/services/widget/queries/squirel"
)

type Query struct {
	*gen.Queries  // for static sql
	*sq.SqBuilder // for dynamic sql
}

func New() *Query {
	return &Query{
		gen.New(),
		sq.NewSqBuilder(),
	}
}
