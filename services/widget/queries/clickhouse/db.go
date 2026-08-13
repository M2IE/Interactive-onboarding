package clickhouse

import (
	"context"

	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
)

type CHConn interface {
	QueryRow(ctx context.Context, query string, args ...any) driver.Row
	PrepareBatch(ctx context.Context, query string, opts ...driver.PrepareBatchOption) (driver.Batch, error)
}

func NewCH() *CHQueries {
	return &CHQueries{}
}

type CHQueries struct{}
