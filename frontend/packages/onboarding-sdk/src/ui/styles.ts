const STYLE_ELEMENT_ID = 'interactive-onboarding-sdk-styles'

const styles = `
.onboarding-sdk {
  --onboarding-blue: #0a84ff;
  --onboarding-green: #1ca164;
  --onboarding-radius: 8px;
  --onboarding-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  letter-spacing: 0;
  position: relative;
  z-index: 2147483000;
}

.onboarding-sdk,
.onboarding-sdk * {
  box-sizing: border-box;
}

.onboarding-sdk__spotlight {
  border: 2px solid #47c2ff;
  border-radius: var(--onboarding-radius);
  box-shadow:
    0 0 0 9999px rgba(0, 0, 0, 0.62),
    0 0 28px rgba(71, 194, 255, 0.72);
  pointer-events: none;
  position: fixed;
  transition: top 180ms ease, left 180ms ease, width 180ms ease, height 180ms ease;
  z-index: 2147483001;
}

.onboarding-sdk__page-transition {
  background: rgba(0, 0, 0, 0.62);
  inset: 0;
  opacity: 1;
  pointer-events: auto;
  position: fixed;
  transition: opacity 180ms ease-out;
  z-index: 2147483003;
}

.onboarding-sdk__page-transition.is-revealing {
  opacity: 0;
  pointer-events: none;
}

.onboarding-sdk__tooltip {
  background: #ffffff;
  border-radius: var(--onboarding-radius);
  box-shadow: var(--onboarding-shadow);
  color: #111111;
  max-height: calc(100svh - 36px);
  overflow-y: auto;
  padding: 22px;
  position: fixed;
  width: min(348px, calc(100vw - 36px));
  z-index: 2147483002;
}

.onboarding-sdk__meta {
  align-items: center;
  color: var(--onboarding-green);
  display: flex;
  font-size: 13px;
  font-weight: 800;
  gap: 9px;
  margin-bottom: 14px;
}

.onboarding-sdk__pin {
  align-items: center;
  border: 2px solid #47c2ff;
  border-radius: 999px;
  color: var(--onboarding-blue);
  display: flex;
  flex: 0 0 auto;
  font-weight: 900;
  height: 28px;
  justify-content: center;
  width: 28px;
}

.onboarding-sdk__tooltip h2 {
  font-size: 20px;
  line-height: 1.2;
  margin: 0 0 12px;
}

.onboarding-sdk__tooltip p {
  color: #34373b;
  font-size: 15px;
  line-height: 1.45;
  margin: 0;
}

.onboarding-sdk__actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.onboarding-sdk__actions button {
  background: #f1f2f3;
  border: 0;
  border-radius: 6px;
  color: #111111;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0;
  min-height: 38px;
  padding: 0 14px;
}

.onboarding-sdk__actions button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.onboarding-sdk__actions button.is-primary {
  background: var(--onboarding-blue);
  color: #ffffff;
}

.onboarding-sdk__tooltip:focus-visible,
.onboarding-sdk__actions button:focus-visible {
  outline: 3px solid #005fcc;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .onboarding-sdk__spotlight,
  .onboarding-sdk__page-transition {
    transition: none;
  }
}

@media (max-width: 620px) {
  .onboarding-sdk__tooltip {
    padding: 18px;
  }

  .onboarding-sdk__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .onboarding-sdk__actions button {
    width: 100%;
  }

  .onboarding-sdk__actions button:first-child {
    grid-column: 1 / -1;
  }
}
`

export function ensureOnboardingStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ELEMENT_ID)) {
    return
  }

  const element = document.createElement('style')
  element.id = STYLE_ELEMENT_ID
  element.textContent = styles
  document.head.append(element)
}
