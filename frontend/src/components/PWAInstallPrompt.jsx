import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Download } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isInPwa = window.navigator.standalone === true; // iOS Safari
      if (isStandalone || isInPwa) {
        setIsInstalled(true);
        return true;
      }
      try {
        const stored = localStorage.getItem("pwa-installed");
        if (stored === "true") {
          setIsInstalled(true);
          return true;
        }
      } catch (e) {
        // ignore
      }
      return false;
    };

    if (checkInstalled()) return;

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show the prompt after a short delay
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem("pwa-installed", "true");
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Re-show the prompt on page navigation if not installed and deferredPrompt exists
  useEffect(() => {
    if (!isInstalled && deferredPrompt && !showPrompt) {
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isInstalled, deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setIsInstalled(true);
      setShowPrompt(false);
      try {
        localStorage.setItem("pwa-installed", "true");
      } catch (e) {
        // ignore
      }
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-6 mx-4 max-w-sm w-full animate-fadeIn">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center">
            <Download size={32} className="text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-lg text-slate-900">Install Metrohomes App</p>
            <p className="text-sm text-slate-500 mt-1">Install Metro Homes for faster access and an app-like experience.</p>
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