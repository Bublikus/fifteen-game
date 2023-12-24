import { useEffect, useRef } from "react";

export const useRemoveSelection = (isEnabled: boolean = true) => {
  useEffect(() => {
    const removeSelection = (e: Event) => {
      e.preventDefault();
    };

    let checkSelectionInterval: ReturnType<typeof setInterval>;

    if (isEnabled) {
      document.addEventListener("selectstart", removeSelection);
      document.addEventListener("contextmenu", removeSelection);

      checkSelectionInterval = setInterval(() => {
        window.getSelection()?.removeAllRanges?.();
      }, 20);
    }

    return () => {
      document.removeEventListener("selectstart", removeSelection);
      document.removeEventListener("contextmenu", removeSelection);

      clearInterval(checkSelectionInterval);
    };
  }, [isEnabled]);
};
