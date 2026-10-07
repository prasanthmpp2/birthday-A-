import { useEffect, useState, type ReactNode } from "react";

type PrivacyProtectionProps = { children: ReactNode };

export default function PrivacyProtection({ children }: PrivacyProtectionProps) {
  const [protectedView, setProtectedView] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let restoreTimer: number | undefined;
    let focusWasLost = false;

    const protect = () => {
      window.clearTimeout(restoreTimer);
      setRestoring(false);
      setProtectedView(true);
      document.querySelectorAll<HTMLMediaElement>("audio, video").forEach((media) => {
        if (!media.paused) media.pause();
      });
    };

    const restore = () => {
      if (document.visibilityState !== "visible") return;
      setRestoring(true);
      window.clearTimeout(restoreTimer);
      restoreTimer = window.setTimeout(() => {
        setProtectedView(false);
        setRestoring(false);
      }, 360);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") protect();
      else restore();
    };
    const onBlur = () => { focusWasLost = true; };
    const onFocus = () => {
      // Focus loss is ordinary browser behavior and is not evidence of capture.
      if (focusWasLost && document.visibilityState === "visible") restore();
      focusWasLost = false;
    };

    if ("visibilityState" in document) document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(restoreTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <>
      <div className={`app-content${protectedView && !restoring ? " is-protected" : ""}`}>
        {children}
      </div>
      {protectedView && (
        <div
          className={`protected-view${restoring ? " is-restoring" : ""}`}
          role="status"
          aria-live="polite"
        >
          <div className="protected-view__message">
            <p className="protected-view__eyebrow">A MOMENT TO YOURSELF</p>
            <p className="protected-view__title">Some moments are better experienced here.</p>
          </div>
        </div>
      )}
    </>
  );
}
