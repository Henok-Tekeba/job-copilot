"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ONBOARDING_KEY = "job-copilot:onboarded";

function readOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch {
    return false;
  }
}

const emptySubscribe = () => () => {};

export function useOnboarding() {
  const onboarded = React.useSyncExternalStore(
    emptySubscribe,
    readOnboarded,
    () => true // server: treat as onboarded (don't show during SSR)
  );
  const [dismissed, setDismissed] = React.useState(false);

  const show = !onboarded && !dismissed;

  const dismiss = React.useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  }, []);

  return { show, dismiss };
}

type OnboardingDialogProps = {
  open: boolean;
  onOpenProfile: () => void;
  onSkip: () => void;
};

export function OnboardingDialog({
  open,
  onOpenProfile,
  onSkip,
}: OnboardingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onSkip()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make the board yours</DialogTitle>
          <DialogDescription>
            Add your skills and the fit score becomes yours: which postings you
            would pass, and what you are missing for the rest. Takes about a
            minute. You can skip and use the default profile.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onSkip}>
            Skip
          </Button>
          <Button onClick={onOpenProfile}>Add my skills</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
