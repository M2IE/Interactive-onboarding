# Extension Release Checklist

1. Update `version` in `manifest.json`.
2. Run `npm run extension:release` from `frontend/`.
3. Run `npm run e2e:extension`.
4. Install `apps/extension/dist` through Chrome **Load unpacked** and complete
   the picker, preview, save and cross-page navigation smoke flow.
5. Check the generated archive and checksum under `frontend/release/`.
6. Confirm that no credentials, page contents or environment files are present
   in the archive.

Chrome Web Store publication is not part of the MVP. Public distribution also
requires authentication, access roles, audit logging and a hosted privacy
policy.
