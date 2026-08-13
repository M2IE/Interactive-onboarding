package olap

import (
	"context"
	"fmt"

	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
)

type Options struct {
	Addr     string
	Database string
	Username string
	Password string
}

type Clickhouse struct {
	conn driver.Conn
}

func newClickhouse(ctx context.Context, config any) (*Clickhouse, error) {
	opts, ok := config.(Options)
	if !ok {
		return nil, fmt.Errorf("invalid clickhouse config type: %T", config)
	}

	conn, err := clickhouse.Open(&clickhouse.Options{
		Addr: []string{opts.Addr},
		Auth: clickhouse.Auth{
			Database: opts.Database,
			Username: opts.Username,
			Password: opts.Password,
		},
	})

	if err != nil {
		return nil, fmt.Errorf("failed to open clickhouse: %w", err)
	}

	if err := conn.Ping(ctx); err != nil {
		_ = conn.Close()
		return nil, fmt.Errorf("failed to ping clickhouse: %w", err)
	}

	return &Clickhouse{conn: conn}, nil
}

func (ch *Clickhouse) Close() error {
	return ch.conn.Close()
}

func (ch *Clickhouse) Exec(ctx context.Context, query string, args ...any) error {
	return ch.conn.Exec(ctx, query, args...)
}

func (ch *Clickhouse) PrepareBatch(ctx context.Context, query string) (Batch, error) {
	return ch.conn.PrepareBatch(ctx, query)
}

func (ch *Clickhouse) Query(ctx context.Context, query string, args ...any) (Rows, error) {
	return ch.conn.Query(ctx, query, args...)
}

func (ch *Clickhouse) QueryRow(ctx context.Context, query string, args ...any) Row {
	return ch.conn.QueryRow(ctx, query, args...)
}
