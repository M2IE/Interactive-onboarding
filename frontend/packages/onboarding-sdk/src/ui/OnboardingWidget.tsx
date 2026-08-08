import { useCallback, useEffect, useRef, useState } from "react";
import type {
  OnboardingApiClient,
  OnboardingEventType,
  OnboardingStep,
  WidgetConfig,
} from "@interactive-onboarding/shared";
import { getOrCreateSessionId } from "../core/session";
import {
  calculateTooltipPosition,
  getTargetSnapshot,
  type TargetSnapshot,
} from "../dom/target";

export type OnboardingWidgetProps = {
  projectKey: string;
  apiClient: OnboardingApiClient;
  navigate?: (url: string) => void;
  pageUrl?: string;
  userId?: string;
  enabled?: boolean;
  refreshKey?: number;
};

type LoadedConfig = {
  pageUrl: string;
  value: WidgetConfig | null;
};

export function OnboardingWidget({
  projectKey,
  apiClient,
  navigate,
  pageUrl,
  userId,
  enabled = true,
  refreshKey = 0,
}: OnboardingWidgetProps) {
  const [loadedConfig, setLoadedConfig] = useState<LoadedConfig | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [target, setTarget] = useState<TargetSnapshot | null>(null);
  const viewedEvents = useRef(new Set<string>());
  const [sessionId] = useState(() => getOrCreateSessionId());
  const resolvedPageUrl = pageUrl ?? window.location.pathname;
  const config =
    loadedConfig?.pageUrl === resolvedPageUrl ? loadedConfig.value : null;
  const activeStep = config?.steps[activeIndex];

  const track = useCallback(
    (type: OnboardingEventType, step?: OnboardingStep) => {
      if (!config) {
        return;
      }

      void apiClient.trackEvent({
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
    },
    [apiClient, config, projectKey, resolvedPageUrl, sessionId, userId],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let ignore = false;

    apiClient
      .getConfig({
        projectKey,
        pageUrl: resolvedPageUrl,
        sessionId,
        userId,
      })
      .then((nextConfig) => {
        if (!ignore) {
          setLoadedConfig({ pageUrl: resolvedPageUrl, value: nextConfig });
          setTarget(null);
          setActiveIndex(0);
        }
      })
      .catch(() => {
        if (!ignore) {
          setLoadedConfig({ pageUrl: resolvedPageUrl, value: null });
          setTarget(null);
        }
      });

    return () => {
      ignore = true;
    };
  }, [
    apiClient,
    enabled,
    projectKey,
    refreshKey,
    resolvedPageUrl,
    sessionId,
    userId,
  ]);

  useEffect(() => {
    if (!activeStep) {
      return;
    }

    const initialTarget = document.querySelector(activeStep.selector);

    if (!initialTarget) {
      track("target_not_found", activeStep);
      return;
    }

    const initialRect = initialTarget.getBoundingClientRect();
    const shouldScroll =
      initialRect.top < 120 || initialRect.bottom > window.innerHeight - 120;

    if (shouldScroll) {
      initialTarget.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: "smooth",
      });
    }

    const updateTarget = () => {
      const nextTarget = getTargetSnapshot(activeStep.selector);
      setTarget(nextTarget);

      if (!nextTarget) {
        track("target_not_found", activeStep);
      }
    };

    updateTarget();
    window.setTimeout(updateTarget, shouldScroll ? 320 : 50);
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);

    return () => {
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [activeStep, track]);

  useEffect(() => {
    if (!config || !activeStep) {
      return;
    }

    const startEventKey = `${sessionId}:${config.flowKey}:scenario_started`;

    if (!viewedEvents.current.has(startEventKey)) {
      viewedEvents.current.add(startEventKey);
      track("scenario_started");
    }

    const viewedEventKey = `${sessionId}:${config.versionId}:${activeStep.id}:step_viewed`;

    if (!viewedEvents.current.has(viewedEventKey)) {
      viewedEvents.current.add(viewedEventKey);
      track("step_viewed", activeStep);
    }
  }, [activeStep, config, sessionId, track]);

  if (!enabled || !config || !activeStep || !target) {
    return null;
  }

  const renderedStep = activeStep;
  const isLastPageStep = activeIndex === config.steps.length - 1;
  const highlightStyle = getHighlightStyle(target.rect);
  const tooltipStyle = getTooltipStyle(renderedStep, target.rect);

  function completeCurrentStep() {
    track("step_completed", renderedStep);

    if (renderedStep.nextUrl) {
      if (navigate) {
        navigate(renderedStep.nextUrl);
      } else {
        window.location.assign(renderedStep.nextUrl);
      }
      return;
    }

    if (!isLastPageStep) {
      setActiveIndex((index) => index + 1);
      return;
    }

    track("scenario_completed");
    setLoadedConfig({ pageUrl: resolvedPageUrl, value: null });
  }

  function skipScenario() {
    track("scenario_dismissed", renderedStep);
    setLoadedConfig({ pageUrl: resolvedPageUrl, value: null });
  }

  return (
    <div aria-live="polite" className="onboarding-sdk">
      <div className="onboarding-sdk__spotlight" style={highlightStyle} />
      <article className="onboarding-sdk__tooltip" style={tooltipStyle}>
        <div className="onboarding-sdk__meta">
          <span className="onboarding-sdk__pin" aria-hidden="true">
            ?
          </span>
          <span>
            Шаг {config.stepOffset + renderedStep.order} из {config.totalSteps}
          </span>
        </div>
        <h2>{renderedStep.title}</h2>
        <p>{renderedStep.body}</p>
        <div className="onboarding-sdk__actions">
          <button type="button" onClick={skipScenario}>
            Пропустить
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))}
            disabled={activeIndex === 0}
          >
            Назад
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={completeCurrentStep}
          >
            Далее
          </button>
        </div>
      </article>
    </div>
  );
}

function getHighlightStyle(rect: DOMRect) {
  return {
    top: rect.top - 8,
    left: rect.left - 8,
    width: rect.width + 16,
    height: rect.height + 16,
  };
}

function getTooltipStyle(step: OnboardingStep, rect: DOMRect) {
  return calculateTooltipPosition(rect, step.placement);
}
