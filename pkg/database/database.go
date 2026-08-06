package database

import (
	"context"
	"database/sql"
	"fmt"
)

type Querier interface {
	ExecContext(ctx context.Context, query string, args ...interface{}) (sql.Result, error)
	PrepareContext(ctx context.Context, query string) (*sql.Stmt, error)
	QueryContext(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error)
	QueryRowContext(ctx context.Context, query string, args ...interface{}) *sql.Row
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

type Type string

const Postgres Type = "postgres"

func New(ctx context.Context, dbType Type, dsn string) (Database, error) {
	switch dbType {
	case Postgres:
		return newPostgres(ctx, dsn)
	default:
		return nil, fmt.Errorf("unsupported database type: %s", dbType)
	}
}
