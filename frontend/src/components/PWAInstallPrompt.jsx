import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (display-mode: standalone or launched from home screen)
    const checkInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isInPwa = window.navigator.standalone === true; // iOS Safari
      if (isStandalone || isInPwa) {
        setIsInstalled(true);
        return;
      }
      // Check if app was launched from home screen via session storage
      try {
        const stored = sessionStorage.getItem("pwa-installed");
        if (stored === "true") {
          setIsInstalled(true);
        }
      } catch (e) {
        // ignore
      }
    };
    checkInstalled();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not already installed
      if (!isInstalled) {
        // Delay showing the prompt so the page loads first
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      try {
        sessionStorage.setItem("pwa-installed", "true");
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setIsInstalled(true);
      setShowPrompt(false);
      try {
        sessionStorage.setItem("pwa-installed", "true");
      } catch (e) {
        // ignore
      }
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    try {
      sessionStorage.setItem("pwa-dismissed", "true");
    } catch (e) {
      // ignore
    }
  };

  if (isInstalled || !showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-4 flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Download size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900">Install Metrohomes App</p>
          <p className="text-xs text-slate-500 mt-0.5">Install for a better experience</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors active:scale-95"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}