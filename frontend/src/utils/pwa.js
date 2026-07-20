import { registerSW } from 'virtual:pwa-register';

export function registerPWAIfNeeded(user) {
  const pwaRoles = ['Regional Manager', 'Branch Manager', 'BDM', 'Sales Manager'];
  
  if (user && pwaRoles.includes(user.role)) {
    const updateSW = registerSW({
      onNeedRefresh: () => {
        if (confirm('New version available. Reload to update?')) {
          updateSW(true);
        }
      },
      onOfflineReady: () => {
        console.log('App is ready to work offline');
      },
    });
    
    return updateSW;
  }
  
  return null;
}