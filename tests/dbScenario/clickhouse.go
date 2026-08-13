//go:build integration

package dbScenario

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"time"

	chmod "github.com/testcontainers/testcontainers-go/modules/clickhouse"

	"github.com/M2IE/Interactive-onboarding/pkg/database/olap"
	chpkg "github.com/M2IE/Interactive-onboarding/pkg/database/olap"
)

func StartClickHouse(ctx context.Context) (olap.Database, func(), error) {
	ch, err := chmod.Run(ctx, "clickhouse/clickhouse-server:24.8-alpine",
		chmod.WithUsername("test"),
		chmod.WithPassword("test"),
		chmod.WithDatabase("analytics"),
		chmod.WithInitScripts(clickhouseSchemaPath()),
	)

	if err != nil {
		return nil, nil, fmt.Errorf("start clickhouse: %w", err)
	}

	host, err := ch.ConnectionHost(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("clickhouse host: %w", err)
	}

	conn, err := chpkg.New(ctx, olap.ClickhouseType, chpkg.Options{
		Addr:     host,
		Database: "analytics",
		Username: "test",
		Password: "test",
	})

	if err != nil {
		return nil, nil, fmt.Errorf("connect clickhouse: %w", err)
	}

	cleanup := func() {
		_ = conn.Close()
		termCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = ch.Terminate(termCtx)
	}

	return conn, cleanup, nil
}

func clickhouseSchemaPath() string {
	_, file, _, _ := runtime.Caller(0)
	dir := filepath.Dir(file)
	for {
		candidate := filepath.Join(dir, "migrations", "clickhouse", "01_events.sql")
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
		parent := filepath.Dir(dir)

		if parent == dir {
			panic("migrations/clickhouse/01_events.sql not found")
		}
		dir = parent
	}
}
