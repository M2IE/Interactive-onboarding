package config

import (
	"fmt"
)

type PostgresConfig struct {
	Host     string `env:"POSTGRES_HOST" envDefault:"localhost"`
	Port     int    `env:"POSTGRES_PORT" envDefault:"5432"`
	User     string `env:"POSTGRES_USER" envDefault:"postgres"`
	Password string `env:"POSTGRES_PASSWORD"`
	DBName   string `env:"POSTGRES_DB" envDefault:"postgres"`
	SSLMode  string `env:"POSTGRES_SSLMODE" envDefault:"disable"`
}

func (c PostgresConfig) DSN() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s", c.User, c.Password, c.Host, c.Port, c.DBName, c.SSLMode)
}

type ConfigRustFS struct {
	RustFSRegion          string `env:"RUSTFS_REGION" envDefault:"us-east-1"`
	RustFSAccessKey       string `env:"RUSTFS_ACCESS_KEY_ID"`
	RustFSSecretAccessKey string `env:"RUSTFS_SECRET_ACCESS_KEY"`
	RustFSUrl             string `env:"RUSTFS_URL" envDefault:"localhost"`
	RustFSPort            string `env:"RUSTFS_PORT" envDefault:"9000"`
}

func (c ConfigRustFS) DSN() string {
	return fmt.Sprintf("%s:%s", c.RustFSUrl, c.RustFSPort)
}
