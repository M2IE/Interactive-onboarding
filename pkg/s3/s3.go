package s3

import (
	"context"
	"fmt"
	"io"
)

type Client interface {
	Upload(ctx context.Context, bucket, key string, body io.Reader, contentType string) (string, error)
}

type Type string

const TypeRustFS Type = "rustfs"

func New(ctx context.Context, s3Type Type, cfg any) (Client, error) {
	switch s3Type {
	case TypeRustFS:
		return NewRustFS(ctx, cfg)
	default:
		return nil, fmt.Errorf("unsupported s3 type: %s", s3Type)
	}
}
