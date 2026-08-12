package rdb

import (
	"context"
	"database/sql"
	"fmt"
)

type Querier interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
	PrepareContext(ctx context.Context, query string) (*sql.Stmt, error)
	QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error)
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

type Tx interface {
	Querier
	Commit() error
	Rollback() error
}

type Database interface {
	Querier
	Ping() error
	Close() error
	Begin() (Tx, error)
}

type DbType uint8

const (
	PostgresType DbType = iota
)

func New(ctx context.Context, dbType DbType, dsn string) (Database, error) {
	switch dbType {
	case PostgresType:
		return newPostgres(ctx, dsn)
	default:
		return nil, fmt.Errorf("unsupported database type: %v", dbType)
	}
}
