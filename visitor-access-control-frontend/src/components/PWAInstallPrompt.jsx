import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      return;
    }

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-slide-up">
      <div className="max-w-md mx-auto bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl shadow-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Download size={20} className="sm:w-6 sm:h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold mb-1">Install App</h3>
            <p className="text-xs sm:text-sm text-primary-100 mb-3">
              Install our app for quick access and offline functionality!
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 px-3 py-2 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-colors text-sm"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                Not Now
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;