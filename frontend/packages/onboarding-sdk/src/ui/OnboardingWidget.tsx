import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  OnboardingApiClient,
  OnboardingEligibility,
  OnboardingEligibilityContext,
  OnboardingEventType,
  OnboardingStep,
  WidgetConfig,
} from "../types/contracts";
import {
  consumeScenarioResume,
  getOrCreateSessionId,
  hasScenarioOutcome,
  hasPreviousOnboardingPage,
  preparePreviousOnboardingPage,
  rememberPageNavigation,
  rememberScenarioOutcome,
} from "../core/session";
import {
  calculateTooltipPosition,
} from "../dom/target";
import { ensureOnboardingStyles } from "./styles";
import { useOnboardingTarget } from "./useOnboardingTarget";

export type OnboardingWidgetProps = {
  projectKey: string;
  apiClient: OnboardingApiClient;
  navigate?: (url: string) => void;
  pageUrl?: string;
  userId?: string;
  enabled?: boolean;
  eligibility?: OnboardingEligibility;
  refreshKey?: number;
  showDelayMs?: number;
  targetWaitMs?: number;
};

type ConfigState =
  | { status: "loading"; pageUrl: string }
  | { status: "ready"; pageUrl: string; config: WidgetConfig }
  | { status: "empty"; pageUrl: string }
  | { status: "error"; pageUrl: string; error: Error };

type StepActionState =
  | { status: "idle" }
  | { status: "completing"; stepId: string };

export function OnboardingWidget({
  projectKey,
  apiClient,
  navigate,
  pageUrl,
  userId,
  enabled = true,
  eligibility = true,
  refreshKey = 0,
  showDelayMs = 0,
  targetWaitMs = 5_000,
}: OnboardingWidgetProps) {
  const resolvedPageUrl = pageUrl ?? window.location.pathname;
  const [configState, setConfigState] = useState<ConfigState>({
    status: "loading",
    pageUrl: resolvedPageUrl,
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [stepActionState, setStepActionState] = useState<StepActionState>({
    status: "idle",
  });
  const [tooltipHeight, setTooltipHeight] = useState(0);
  const tooltipRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const bodyId = useId();
  const viewedEvents = useRef(new Set<string>());
  const [sessionId] = useState(() => getOrCreateSessionId());
  const config =
    configState.status === "ready" && configState.pageUrl === resolvedPageUrl
      ? configState.config
      : null;
  const activeStep = config?.steps[activeIndex];

  useEffect(() => {
    ensureOnboardingStyles();
  }, []);

  const track = useCallback(
    async (type: OnboardingEventType, step?: OnboardingStep) => {
      if (!config) {
        return;
      }

      try {
        await apiClient.trackEvent({
          projectKey,
          scenarioId: config.scenarioId,
          versionId: config.versionId,
          stepId: step?.id,
          sessionId,
          userId,
          type,
          eventKey:
            type === "scenario_started"
              ? `${sessionId}:${config.flowKey}:${type}`
              : `${sessionId}:${config.versionId}:${step?.id ?? "scenario"}:${type}`,
          pageUrl: resolvedPageUrl,
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Analytics must not prevent the user from continuing the host flow.
      }
    },
    [apiClient, config, projectKey, resolvedPageUrl, sessionId, userId],
  );

  const handleMissingTarget = useCallback(
    (step: OnboardingStep) => {
      void track("target_not_found", step);
    },
    [track],
  );
  const targetState = useOnboardingTarget({
    onMissing: handleMissingTarget,
    step: activeStep,
    waitMs: targetWaitMs,
  });
  const target =
    targetState.status === "ready" &&
    targetState.selector === activeStep?.selector
      ? targetState.target
      : null;

  useLayoutEffect(() => {
    const nextHeight = tooltipRef.current?.getBoundingClientRect().height ?? 0;

    if (nextHeight > 0 && nextHeight !== tooltipHeight) {
      setTooltipHeight(nextHeight);
    }
  }, [activeStep, target, tooltipHeight]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let ignore = false;
    let delayId: number | undefined;
    const eligibilityContext: OnboardingEligibilityContext = {
      projectKey,
      pageUrl: resolvedPageUrl,
      sessionId,
      userId,
    };

    async function loadConfig() {
      const isEligible =
        typeof eligibility === "function"
          ? await eligibility(eligibilityContext)
          : eligibility;

      if (ignore) {
        return;
      }

      if (!isEligible) {
        setConfigState({ status: "empty", pageUrl: resolvedPageUrl });
        return;
      }

      if (showDelayMs > 0) {
        await new Promise<void>((resolve) => {
          delayId = window.setTimeout(resolve, showDelayMs);
        });
      }

      if (ignore) {
        return;
      }

      setConfigState({ status: "loading", pageUrl: resolvedPageUrl });
      const nextConfig = await apiClient.getConfig({
        projectKey,
        pageUrl: resolvedPageUrl,
        sessionId,
        userId,
      });

      if (ignore) {
        return;
      }

      setActiveIndex(0);
      setStepActionState({ status: "idle" });

      if (!nextConfig) {
        setConfigState({ status: "empty", pageUrl: resolvedPageUrl });
        return;
      }

      const resumeIndex = consumeScenarioResume(
        resolvedPageUrl,
        nextConfig.scenarioId,
      );

      if (resumeIndex === null && hasScenarioOutcome(nextConfig.scenarioId)) {
        setConfigState({ status: "empty", pageUrl: resolvedPageUrl });
        return;
      }

      setActiveIndex(
        resumeIndex === null
          ? 0
          : Math.min(Math.max(resumeIndex, 0), nextConfig.steps.length - 1),
      );
      setConfigState({
        status: "ready",
        pageUrl: resolvedPageUrl,
        config: nextConfig,
      });
    }

    void loadConfig().catch((error: unknown) => {
      if (ignore) {
        return;
      }

      setConfigState({
        status: "error",
        pageUrl: resolvedPageUrl,
        error: toError(error),
      });
    });

    return () => {
      ignore = true;
      if (delayId !== undefined) {
        window.clearTimeout(delayId);
      }
    };
  }, [
    apiClient,
    eligibility,
    enabled,
    projectKey,
    refreshKey,
    resolvedPageUrl,
    sessionId,
    showDelayMs,
    userId,
  ]);

  useEffect(() => {
    if (!config || !activeStep || !target) {
      return;
    }

    const startEventKey = `${sessionId}:${config.flowKey}:scenario_started`;

    if (!viewedEvents.current.has(startEventKey)) {
      viewedEvents.current.add(startEventKey);
      void track("scenario_started");
    }

    const viewedEventKey = `${sessionId}:${config.versionId}:${activeStep.id}:step_viewed`;

    if (!viewedEvents.current.has(viewedEventKey)) {
      viewedEvents.current.add(viewedEventKey);
      void track("step_viewed", activeStep);
    }
  }, [activeStep, config, sessionId, target, track]);

  useEffect(() => {
    const tooltip = tooltipRef.current;

    if (
      !config ||
      !activeStep ||
      targetState.status !== "ready" ||
      !tooltip
    ) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    tooltip.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void track("scenario_dismissed", activeStep);
        rememberScenarioOutcome(config.scenarioId, "dismissed");
        setConfigState({ status: "empty", pageUrl: resolvedPageUrl });
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = Array.from(
        tooltip.querySelectorAll<HTMLElement>("button:not(:disabled)"),
      );

      if (focusable.length === 0) {
        event.preventDefault();
        tooltip.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable.at(-1);

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus({ preventScroll: true });
    };
  }, [activeStep, config, resolvedPageUrl, targetState.status, track]);

  if (!enabled || !config || !activeStep || !target) {
    return null;
  }

  const renderedConfig = config;
  const renderedStep = activeStep;
  const isLastPageStep = activeIndex === config.steps.length - 1;
  const isCompleting = stepActionState.status === "completing";
  const canGoBackToPreviousPage =
    activeIndex === 0 && hasPreviousOnboardingPage(resolvedPageUrl);
  const highlightStyle = getHighlightStyle(target.rect);
  const tooltipStyle = getTooltipStyle(
    renderedStep,
    target.rect,
    tooltipHeight,
  );

  async function completeCurrentStep() {
    if (isCompleting) {
      return;
    }

    const completionEvent = track("step_completed", renderedStep);

    if (renderedStep.nextUrl) {
      setStepActionState({ status: "completing", stepId: renderedStep.id });
      await completionEvent;

      rememberPageNavigation({
        fromPageUrl: resolvedPageUrl,
        fromScenarioId: renderedConfig.scenarioId,
        fromStepIndex: activeIndex,
        toPageUrl: renderedStep.nextUrl,
      });

      if (isLastPageStep) {
        await track("scenario_completed");
        rememberScenarioOutcome(renderedConfig.scenarioId, "completed");
      }

      setStepActionState({ status: "idle" });

      if (navigate) {
        navigate(renderedStep.nextUrl);
      } else {
        window.location.assign(renderedStep.nextUrl);
      }
      return;
    }

    void completionEvent;

    if (isLastPageStep) {
      void track("scenario_completed");
      rememberScenarioOutcome(renderedConfig.scenarioId, "completed");
    }

    if (!isLastPageStep) {
      setActiveIndex((index) => index + 1);
      return;
    }

    setConfigState({ status: "empty", pageUrl: resolvedPageUrl });
  }

  function skipScenario() {
    void track("scenario_dismissed", renderedStep);
    rememberScenarioOutcome(renderedConfig.scenarioId, "dismissed");
    setConfigState({ status: "empty", pageUrl: resolvedPageUrl });
  }

  function goBack() {
    if (activeIndex > 0) {
      setActiveIndex((index) => index - 1);
      return;
    }

    const previousPageUrl = preparePreviousOnboardingPage(resolvedPageUrl);

    if (!previousPageUrl) {
      return;
    }

    if (navigate) {
      navigate(previousPageUrl);
    } else {
      window.location.assign(previousPageUrl);
    }
  }

  return (
    <div aria-live="polite" className="onboarding-sdk">
      <div
        aria-hidden="true"
        className="onboarding-sdk__spotlight"
        style={highlightStyle}
      />
      <article
        aria-describedby={bodyId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="onboarding-sdk__tooltip"
        ref={tooltipRef}
        role="dialog"
        style={tooltipStyle}
        tabIndex={-1}
      >
        <div className="onboarding-sdk__meta">
          <span className="onboarding-sdk__pin" aria-hidden="true">
            ?
          </span>
          <span>
            Шаг {config.stepOffset + renderedStep.order} из {config.totalSteps}
          </span>
        </div>
        <h2 id={titleId}>{renderedStep.title}</h2>
        <p id={bodyId}>{renderedStep.body}</p>
        <div className="onboarding-sdk__actions">
          <button type="button" onClick={skipScenario} disabled={isCompleting}>
            Пропустить
          </button>
          <button
            type="button"
            onClick={goBack}
            disabled={
              (activeIndex === 0 && !canGoBackToPreviousPage) || isCompleting
            }
          >
            Назад
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={() => void completeCurrentStep()}
            disabled={isCompleting}
          >
            Далее
          </button>
        </div>
      </article>
    </div>
  );
}

function toError(value: unknown) {
  return value instanceof Error
    ? value
    : new Error("Failed to load onboarding scenario");
}

function getHighlightStyle(rect: DOMRect) {
  return {
    top: rect.top - 8,
    left: rect.left - 8,
    width: rect.width + 16,
    height: rect.height + 16,
  };
}

function getTooltipStyle(
  step: OnboardingStep,
  rect: DOMRect,
  tooltipHeight: number,
) {
  return calculateTooltipPosition(rect, step.placement, tooltipHeight);
}
