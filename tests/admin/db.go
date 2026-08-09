//go:build integration

package admin

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/network"
	"github.com/testcontainers/testcontainers-go/wait"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
)

func StartPostgres(ctx context.Context) (database.Database, func(), error) {
	var (
		db      database.Database
		pg      *postgres.PostgresContainer
		net     *testcontainers.DockerNetwork
		migCtr  testcontainers.Container
		err     error
	)

	net, err = network.New(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("create network: %w", err)
	}

	pg, err = postgres.Run(ctx, "postgres:18.4-alpine3.23",
		postgres.WithDatabase("testdb"),
		postgres.WithUsername("test"),
		postgres.WithPassword("test"),
		network.WithNetwork([]string{"db"}, net),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").WithOccurrence(2),
		),
	)
	if err != nil {
		net.Remove(ctx)
		return nil, nil, fmt.Errorf("start postgres: %w", err)
	}

	absMigrationsDir := migrationsDir()

	migCtr, err = testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: testcontainers.ContainerRequest{
			Image:    "migrate/migrate:v4.19.1",
			Networks: []string{net.Name},
			Mounts: testcontainers.ContainerMounts{
				{
					Source:   testcontainers.GenericBindMountSource{HostPath: absMigrationsDir},
					Target:   "/migrations",
					ReadOnly: true,
				},
			},
			Cmd: []string{
				"-path=/migrations",
				"-database=postgres://test:test@db:5432/testdb?sslmode=disable",
				"up",
			},
			WaitingFor: wait.ForExit().WithExitTimeout(30 * time.Second),
		},
		Started: true,
	})
	if err != nil {
		return nil, nil, fmt.Errorf("start migrate: %w", err)
	}

	state, err := migCtr.State(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("check migrate state: %w", err)
	}
	if state.ExitCode != 0 {
		logs, _ := migCtr.Logs(ctx)
		if logs != nil {
			logBytes, _ := io.ReadAll(logs)
			logs.Close()
			return nil, nil, fmt.Errorf("migrate exited with code %d: %s", state.ExitCode, string(logBytes))
		}
		return nil, nil, fmt.Errorf("migrate exited with code %d", state.ExitCode)
	}

	dsn, _ := pg.ConnectionString(ctx)
	dsn += "sslmode=disable"
	db, err = database.New(ctx, database.Postgres, dsn)
	if err != nil {
		return nil, nil, fmt.Errorf("new db: %w", err)
	}

	cleanup := func() {
		db.Close()
		termCtx, termCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer termCancel()
		migCtr.Terminate(termCtx)
		pg.Terminate(termCtx)
		net.Remove(termCtx)
	}

	return db, cleanup, nil
}

func migrationsDir() string {
	_, file, _, _ := runtime.Caller(0)
	dir := filepath.Dir(file)
	for {
		candidate := filepath.Join(dir, "migrations", "postgres")
		if info, err := os.Stat(candidate); err == nil && info.IsDir() {
			return candidate
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			panic("migrations/postgres not found")
		}
		dir = parent
	}
}
