import { useState, useEffect, useRef } from "react";
import { registerSW } from "virtual:pwa-register";
import { RefreshCw, X } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const deferredPromptRef = useRef(null);
  const updateSWRef = useRef(null);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);
    const mq = window.matchMedia("(display-mode: standalone)");
    const onChange = () => setIsStandalone(mq.matches || window.navigator.standalone === true);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isInPwa = window.navigator.standalone === true; // iOS Safari
    if (isStandalone || isInPwa) {
      setIsInstalled(true);
      return;
    }

    // Capture the real native install prompt (Chrome/Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setDeferredPrompt(e);
      setTimeout(() => setShowInstall(true), 2000);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstall(false);
      setDeferredPrompt(null);
      deferredPromptRef.current = null;
      try {
        localStorage.setItem("pwa-installed", "true");
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    // Fallback: show the banner even if the browser never fires a native prompt
    const fallbackTimer = setTimeout(() => {
      if (!deferredPromptRef.current && !checkInstalled()) {
        setShowInstall(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Register service worker and detect when a new version is available
  useEffect(() => {
    try {
      let dismissed = false;
      try {
        dismissed = localStorage.getItem("pwa-update-dismissed") === "true";
      } catch (e) {
        // ignore
      }
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          if (dismissed) return;
          setNeedRefresh(true);
        },
        onOfflineReady() {},
      });
      updateSWRef.current = updateSW;
    } catch (e) {
      // ignore - registration failure must never block the update prompt
    }
  }, []);

  // Re-show the install banner every 15 seconds until installed
  useEffect(() => {
    if (isInstalled || showInstall || needRefresh) return;
    const timer = setTimeout(() => setShowInstall(true), 15 * 1000);
    return () => clearTimeout(timer);
  }, [isInstalled, showInstall, needRefresh]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === "accepted") {
          setIsInstalled(true);
          setShowInstall(false);
          try {
            localStorage.setItem("pwa-installed", "true");
          } catch (e) {
            // ignore
          }
        } else {
          setShowInstall(false);
        }
      } catch (e) {
        setShowInstall(false);
      }
    } else {
      setShowInstall(false);
    }
  };

  const handleDismiss = () => {
    setShowInstall(false);
  };

  const checkInstalled = () => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isInPwa = window.navigator.standalone === true;
    return isStandalone || isInPwa;
  };

  // ─── Update available popup (top) ───────────────────────────────────
  if (needRefresh && isStandalone) {
    return (
      <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/30 backdrop-blur-sm p-4 pt-16">
        <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-6 mx-4 max-w-sm w-full animate-fadeIn">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
              <RefreshCw size={32} className="text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-lg text-slate-900">New Version Available</p>
              <p className="text-sm text-slate-500 mt-1">
                A new update is ready with the latest features. Refresh to update the app.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem("pwa-update-dismissed");
                  } catch (e) {
                    // ignore
                  }
                  updateSWRef.current?.(true);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors active:scale-95"
              >
                Update Now
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.setItem("pwa-update-dismissed", "true");
                  } catch (e) {
                    // ignore
                  }
                  setNeedRefresh(false);
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Install banner (top) ───────────────────────────────────────────
  if (isInstalled || !showInstall) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 px-4 py-3 mx-2 w-full max-w-sm animate-fadeIn">
        <button
          onClick={handleDismiss}
          className="absolute top-1 right-1 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          title="Close"
        >
          <X size={16} />
        </button>
        <div className="flex items-center gap-3 pr-9">
          <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
            <img src="/metrohomes-icon.png" alt="Metrohomes" className="w-10 h-10 object-contain" crossOrigin="anonymous" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-base text-slate-900 leading-tight truncate">Metrohomes</p>
            <p className="text-xs text-slate-500">Install the app</p>
          </div>
          <button
            onClick={handleInstall}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors active:scale-95 shadow-sm shadow-blue-500/30"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}