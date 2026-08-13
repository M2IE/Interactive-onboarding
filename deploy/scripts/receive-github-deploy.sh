#!/usr/bin/env bash
set -Eeuo pipefail

readonly max_archive_bytes=$((50 * 1024 * 1024))
readonly deploy_root="/home/$(id -un)/deployments"

if [[ ${SSH_ORIGINAL_COMMAND:-} =~ ^deploy\ ([0-9a-f]{40})$ ]]; then
  release_sha=${BASH_REMATCH[1]}
else
  echo "unsupported deploy command" >&2
  exit 2
fi

mkdir -p "$deploy_root"
umask 077
archive=$(mktemp "${deploy_root}/release.${release_sha}.XXXXXX.tar.gz")
manifest=$(mktemp "${deploy_root}/manifest.${release_sha}.XXXXXX")
runner_dir=$(mktemp -d "${deploy_root}/runner.${release_sha}.XXXXXX")

cleanup() {
  rm -f -- "$manifest"
  rm -rf -- "$runner_dir"
}
trap cleanup EXIT

cat > "$archive"

archive_bytes=$(stat -c '%s' "$archive")
if (( archive_bytes == 0 || archive_bytes > max_archive_bytes )); then
  echo "release archive has an invalid size" >&2
  rm -f -- "$archive"
  exit 3
fi

tar -tzf "$archive" > "$manifest"
if awk '$0 ~ /^\// || $0 ~ /(^|\/)\.\.($|\/)/ { found=1 } END { exit !found }' "$manifest"; then
  echo "release archive contains an unsafe path" >&2
  rm -f -- "$archive"
  exit 4
fi

if grep -q '^onboarding-frontend/' "$manifest"; then
  echo "release archive contains excluded nested repository" >&2
  rm -f -- "$archive"
  exit 5
fi

tar -xzf "$archive" -C "$runner_dir" deploy/scripts/deploy-vps.sh
bash "$runner_dir/deploy/scripts/deploy-vps.sh" "$release_sha" "$archive"
