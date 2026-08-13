package queries

import (
	chq "github.com/M2IE/Interactive-onboarding/services/widget/queries/clickhouse"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries/sqlc/gen"
	sq "github.com/M2IE/Interactive-onboarding/services/widget/queries/squirel"
)

type Query struct {
	*gen.Queries
	*sq.SqBuilder
	*chq.CHQueries
}

func New() *Query {
	return &Query{
		gen.New(),
		sq.NewSqBuilder(),
		chq.NewCH(),
	}
}
