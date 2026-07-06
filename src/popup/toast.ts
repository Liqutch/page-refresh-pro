let hideTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(message: string, type: 'error' | 'info' = 'error', durationMs = 3800): void {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.querySelector('.popup')?.append(toast);
  }

  toast.textContent = message;
  toast.className = `app-toast app-toast-${type} is-visible`;

  if (hideTimer) {
    clearTimeout(hideTimer);
  }

  hideTimer = setTimeout(() => {
    toast?.classList.remove('is-visible');
  }, durationMs);
}
