// Network status — uses browser's online/offline events
export async function initNetworkListener(onChange: (online: boolean) => void) {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => onChange(true));
  window.addEventListener('offline', () => onChange(false));
  onChange(navigator.onLine);
}
