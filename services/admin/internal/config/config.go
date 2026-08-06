package config

import (
	pkgconfig "github.com/M2IE/Interactive-onboarding/pkg/configs"
	"github.com/caarlos0/env/v11"
)

type Config struct {
	ServicePort string `env:"ADMIN_SERVICE_PORT" envDefault:":8080"`
	S3Bucket    string `env:"S3_REPORT_BUCKET" envDefault:"reports"`
	pkgconfig.PostgresConfig
	pkgconfig.ConfigRustFS
}

func Load() (Config, error) {
	return env.ParseAs[Config]()
}
