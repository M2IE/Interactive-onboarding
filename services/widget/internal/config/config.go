package config

import (
	pkgconfig "github.com/M2IE/Interactive-onboarding/pkg/configs"
	"github.com/caarlos0/env/v11"
)

type Config struct {
	ServicePort string `env:"WIDGET_SERVICE_PORT"`
	pkgconfig.PostgresConfig
	pkgconfig.ClickHouseConfig
}

func Load() (Config, error) {
	return env.ParseAs[Config]()
}
