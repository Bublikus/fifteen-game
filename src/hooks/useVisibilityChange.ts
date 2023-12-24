import { useEffect, useRef } from "react";

export const useVisibilityChange = (callback: (isVisible: boolean) => void) => {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const handleVisibilityChange = () => {
      cbRef.current(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
};
