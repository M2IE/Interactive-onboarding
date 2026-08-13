# Onboarding Studio Chrome Extension

Onboarding Studio is a visual editor for creating onboarding drafts directly on
a target website. It opens in Chrome Side Panel, lets an author select prepared
page elements, configure hints, preview the result and save the draft to the
Interactive Onboarding platform.

The extension is currently distributed outside Chrome Web Store for internal
testing and demonstrations.

## Install a prepared archive

1. Download `onboarding-studio-<version>.zip` from the project release.
2. Unpack the archive into a permanent directory. Chrome loads the extension
   from this directory, so do not delete or move it after installation.
3. Open `chrome://extensions` in Google Chrome.
4. Enable **Developer mode** in the top-right corner.
5. Click **Load unpacked**.
6. Select the unpacked directory containing `manifest.json`.
7. Pin **Onboarding Studio** from the Chrome extensions menu.

Chrome does not install this development build directly from a ZIP file. The
archive must be unpacked first.

## Build and install from source

Requirements: Node.js 22 or newer and npm.

```bash
cd frontend
npm ci
npm run build:extension
```

Then open `chrome://extensions`, enable **Developer mode**, click **Load
unpacked** and select:

```text
frontend/apps/extension/dist
```

For local development with rebuild-on-change:

```bash
npm run dev:extension
```

After a rebuild, click **Reload** on the extension card in
`chrome://extensions`.

## Connect to the platform

1. Open the website where the onboarding should be created.
2. Click the extension icon to open the Side Panel.
3. Enter the origin of the deployed Interactive Onboarding platform, for
   example `https://onboarding.example.com`. Do not enter the target website
   URL here.
4. Enter the project's `projectKey` provided by the platform administrator.
5. Grant access to the platform origin when Chrome requests it.
6. Select an element marked with `data-onboarding-id`, add the hint content and
   save the draft.
7. Open the saved scenario in the admin panel to review and publish it.

## Page requirements

For reliable selection, the target application should mark onboarding targets
with stable and unique attributes:

```html
<button data-onboarding-id="create-listing">Create listing</button>
```

The extension searches the selected element and its nearest ancestors for
`data-onboarding-id`. Generic CSS selectors are not accepted as a reliable
production target.

## Create a distributable archive

```bash
cd frontend
npm run extension:release
```

The ZIP archive and its SHA-256 checksum are written to `frontend/release/`.
Before sharing a new build, update the extension version in both
`apps/extension/manifest.json` and `apps/extension/package.json`.

## Current limitations

- Installation requires Chrome Developer mode until the extension is published
  in Chrome Web Store.
- Closed Shadow DOM and cross-origin iframes are not supported.
- Publishing remains in the web admin panel; the extension only edits drafts.
- Public distribution requires authenticated platform sessions, project roles
  and a hosted privacy policy.

See also [RELEASE.md](./RELEASE.md) and [PRIVACY.md](./PRIVACY.md).
