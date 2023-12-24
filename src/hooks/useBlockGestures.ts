import { useEffect } from "react";

export const useBlockGestures = (isEnabled: boolean = true) => {
  useEffect(() => {
    const blockGestures = (e: Event) => {
      e.preventDefault();
      (document.body.style as any).zoom = 1;
    };

    if (isEnabled) {
      document.addEventListener("gesturestart", blockGestures);
      document.addEventListener("gesturechange", blockGestures);
      document.addEventListener("gestureend", blockGestures);
    }

    return () => {
      document.removeEventListener("gesturestart", blockGestures);
      document.removeEventListener("gesturechange", blockGestures);
      document.removeEventListener("gestureend", blockGestures);
    };
  }, [isEnabled]);
};
