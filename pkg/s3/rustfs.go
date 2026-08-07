package s3

import (
	"context"
	"fmt"
	"io"

	pkgconfig "github.com/M2IE/Interactive-onboarding/pkg/configs"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type RustFS struct {
	client *s3.Client
	dsn    string
}

func NewRustFS(ctx context.Context, cfgToCheck any) (Client, error) {
	cfg, ok := cfgToCheck.(pkgconfig.ConfigRustFS)
	if !ok {
		return nil, fmt.Errorf("new rustfs: expected ConfigRustFS, got %T", cfgToCheck)
	}

	dsn := cfg.DSN()
	s3Config := aws.Config{
		Region: cfg.RustFSRegion,
		Credentials: aws.NewCredentialsCache(credentials.NewStaticCredentialsProvider(
			cfg.RustFSAccessKey,
			cfg.RustFSSecretAccessKey,
			"",
		)),
	}

	client := s3.NewFromConfig(s3Config, func(o *s3.Options) {
		o.BaseEndpoint = aws.String("http://" + dsn)
		o.UsePathStyle = true
	})

	return &RustFS{
		client: client,
		dsn:    dsn,
	}, nil
}

func (c *RustFS) Upload(ctx context.Context, bucket, key string, body io.Reader, contentType string) error {
	_, err := c.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(bucket),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return fmt.Errorf("Upload object to S3(RustFS) error: %w", err)
	}

	return nil
}

func (c *RustFS) Download(ctx context.Context, bucket, key string) (io.ReadCloser, error) {
	out, err := c.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("Download object from S3(RustFS) error: %w", err)
	}
	return out.Body, nil
}
