package olap

import (
	"context"
	"fmt"
)

type Batch interface {
	Append(v ...any) error
	Send() error
}

type Rows interface {
	Next() bool
	Scan(dest ...any) error
	Close() error
	Err() error
}

type Row interface {
	Scan(dest ...any) error
}

type Database interface {
	Close() error
	Exec(ctx context.Context, query string, args ...any) error
	PrepareBatch(ctx context.Context, query string) (Batch, error)
	Query(ctx context.Context, query string, args ...any) (Rows, error)
	QueryRow(ctx context.Context, query string, args ...any) Row
}

type DbType int8

const (
	ClickhouseType DbType = iota
)

func New(ctx context.Context, dbType DbType, config any) (Database, error) {
	switch dbType {
	case ClickhouseType:
		return newClickhouse(ctx, config)
	default:
		return nil, fmt.Errorf("unsupported database type: %v", dbType)
	}
}
