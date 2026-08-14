#!/usr/bin/env bash
set -Eeuo pipefail

release_sha=${1:?release SHA is required}
archive=${2:?release archive path is required}

if [[ ! $release_sha =~ ^[0-9a-f]{40}$ ]]; then
  echo "invalid release SHA" >&2
  exit 2
fi

deploy_user=$(id -un)
deploy_root="/home/${deploy_user}/deployments"
app_dir="/home/${deploy_user}/interactive-onboarding"
stage_dir=$(mktemp -d "${deploy_root}/stage.${release_sha}.XXXXXX")

cleanup() {
  rm -rf -- "$stage_dir"
  rm -f -- "$archive"
}
trap cleanup EXIT

tar -xzf "$archive" -C "$stage_dir"

if [[ -e "$stage_dir/onboarding-frontend" ]]; then
  echo "refusing release containing onboarding-frontend" >&2
  exit 3
fi

if [[ ! -f "$app_dir/.env" ]]; then
  echo "production .env is missing at $app_dir/.env" >&2
  exit 4
fi

install -m 600 "$app_dir/.env" "$stage_dir/.env"

compose_stage=(
  sudo docker compose
  -p interactive-onboarding
  -f "$stage_dir/docker-compose.yaml"
  -f "$stage_dir/compose.production.yaml"
)

"${compose_stage[@]}" config --quiet
"${compose_stage[@]}" build admin_service widget_service frontend
"${compose_stage[@]}" --profile migrate run --rm migrate

mkdir -p "$app_dir"
tar -xzf "$archive" -C "$app_dir"
chmod 600 "$app_dir/.env"

compose_app=(
  sudo docker compose
  -p interactive-onboarding
  -f "$app_dir/docker-compose.yaml"
  -f "$app_dir/compose.production.yaml"
)

"${compose_app[@]}" up -d --remove-orphans
sudo docker compose \
  -p caddy \
  -f "$app_dir/deploy/caddy/docker-compose.yaml" \
  up -d

for attempt in {1..30}; do
  if curl --fail --silent --show-error http://127.0.0.1:8080/healthz >/dev/null; then
    printf '%s\n' "$release_sha" > "$app_dir/DEPLOYED_COMMIT"
    echo "deployed $release_sha"
    exit 0
  fi
  sleep 2
done

echo "deployment health check failed" >&2
exit 5
