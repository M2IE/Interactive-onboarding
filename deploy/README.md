# Production deployment

The VPS serves the same frontend build through three hostnames:

| Hostname | Purpose | Analytics events |
| --- | --- | --- |
| `m2ie.ru` / `www.m2ie.ru` | Main site | Blocked |
| `demo.m2ie.ru` | Production demo | Enabled |
| `demo-test.m2ie.ru` | Scenario testing | Blocked |

`demo-test.m2ie.ru` is protected at two levels: the frontend replaces
`trackEvent` with a no-op outside the analytics hostname allowlist, and Caddy
returns `204` for `POST /api/v1/widget/event` on every non-production host.

## DNS

Create these records at the authoritative DNS provider:

```text
A  demo       88.218.67.26
A  demo-test  88.218.67.26
```

Caddy obtains and renews HTTPS certificates after the records resolve to the
VPS.

## GitHub Actions secrets

Add these repository secrets under **Settings → Secrets and variables →
Actions**:

- `VPS_HOST`: `88.218.67.26`
- `VPS_USER`: `user1`
- `VPS_SSH_KEY`: the private key dedicated to GitHub Actions
- `VPS_HOST_KEY`: the pinned `ssh-keyscan` line for the VPS

The private deploy key is intentionally separate from the personal SSH key.
Its public key on the VPS is restricted to
`deploy/scripts/receive-github-deploy.sh`, so it cannot open an interactive
shell or forward ports.

## Deployment flow

On a push to `main`, the `CI` workflow runs first. After CI succeeds,
`Deploy production` archives the exact tested commit and streams it to the VPS
over SSH. The VPS builds the images, runs migrations, restarts the application
and Caddy, and verifies `/healthz`.

The nested `onboarding-frontend` repository is excluded from Git archives and
is rejected by both sides of the deployment channel if it appears in a release.
