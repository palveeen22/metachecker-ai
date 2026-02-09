"use client";

import { useState, useCallback } from "react";

interface UseWizardNavigationOptions {
  totalSteps: number;
  initialStep?: number;
}

export function useWizardNavigation({
  totalSteps,
  initialStep = 0,
}: UseWizardNavigationOptions) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCompletedSteps((prev) => new Set(prev).add(currentStep));
        setCurrentStep(step);
      }
    },
    [currentStep, totalSteps],
  );

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, totalSteps, goToStep]);

  const goPrevious = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isStepCompleted = (step: number) => completedSteps.has(step);
  const canNavigateTo = (step: number) =>
    step <= currentStep || completedSteps.has(step);

  return {
    currentStep,
    completedSteps,
    goToStep,
    goNext,
    goPrevious,
    isFirstStep,
    isLastStep,
    isStepCompleted,
    canNavigateTo,
  };
}
