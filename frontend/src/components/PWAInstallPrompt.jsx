import { useState, useEffect, useRef } from "react";
import { registerSW } from "virtual:pwa-register";
import { Download, RefreshCw } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const deferredPromptRef = useRef(null);
  const updateSWRef = useRef(null);

  const checkInstalled = () => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isInPwa = window.navigator.standalone === true; // iOS Safari
    if (isStandalone || isInPwa) return true;
    try {
      return localStorage.getItem("pwa-installed") === "true";
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    if (checkInstalled()) {
      setIsInstalled(true);
      return;
    }

    // Native install prompt (Chrome/Edge)
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

    // Fallback: show manual install instructions even if the browser
    // never fires beforeinstallprompt (iOS, unsupported, etc.)
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
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {},
    });
    updateSWRef.current = updateSW;
  }, []);

  // Re-show the install prompt every 15 seconds until installed
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
      // No native prompt available - keep showing manual instructions
      setShowInstall(false);
    }
  };

  const handleDismiss = () => {
    setShowInstall(false);
  };

  // ─── Update available popup ─────────────────────────────────────────
  if (needRefresh) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
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
                onClick={() => updateSWRef.current?.(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors active:scale-95"
              >
                Update Now
              </button>
              <button
                onClick={() => setNeedRefresh(false)}
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

  // ─── Install popup (centered) ───────────────────────────────────────
  if (isInstalled || !showInstall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-6 mx-4 max-w-sm w-full animate-fadeIn">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center">
            <Download size={32} className="text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-lg text-slate-900">Install Metrohomes App</p>
            <p className="text-sm text-slate-500 mt-1">
              Install Metro Homes for faster access and an app-like experience.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full mt-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors active:scale-95"
            >
              Install Now
            </button>
            <button
              onClick={handleDismiss}
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
