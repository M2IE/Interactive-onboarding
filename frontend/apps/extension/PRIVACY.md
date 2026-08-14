# Onboarding Studio Privacy Notes

Onboarding Studio is an internal visual editor for onboarding drafts.

## Data handled by the extension

- Platform URL and project key are stored in `chrome.storage.local`.
- The active page URL, draft state and picker state are stored temporarily in
  `chrome.storage.session` for the current tab.
- Selected CSS selectors, step titles, step text and transition URLs are sent to
  the configured Admin API when the author clicks **Save**.

## Data not collected

- Input values, passwords and form contents.
- Page HTML or screenshots.
- Browsing history outside the active editing tab.
- Preview analytics.

The extension uses temporary `activeTab` access and requests the configured
platform origin separately. It does not request permanent `<all_urls>` access.

Before public distribution, add authenticated short-lived sessions, role-based
project access, an audit log and a published privacy-policy URL.
