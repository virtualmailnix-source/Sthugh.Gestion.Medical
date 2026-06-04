const ICONS = {
  success: 'bi-check-circle-fill',
  error:   'bi-x-circle-fill',
  warning: 'bi-exclamation-triangle-fill',
  info:    'bi-info-circle-fill'
};
const TITLES = {
  success: 'Succès',
  error:   'Erreur',
  warning: 'Attention',
  info:    'Information'
};

export function toast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toasts');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <i class="bi ${ICONS[type]} toast-icon"></i>
    <div class="toast-text">
      <div class="toast-title">${TITLES[type]}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <i class="bi bi-x toast-close"></i>`;

  el.querySelector('.toast-close').addEventListener('click', () => dismiss(el));
  container.appendChild(el);

  const timer = setTimeout(() => dismiss(el), duration);
  el._timer = timer;
}

function dismiss(el) {
  clearTimeout(el._timer);
  el.classList.add('out');
  el.addEventListener('animationend', () => el.remove(), { once: true });
  setTimeout(() => el.remove(), 400);
}

export const toastSuccess = (msg) => toast(msg, 'success');
export const toastError   = (msg) => toast(msg, 'error', 5500);
export const toastWarning = (msg) => toast(msg, 'warning');
export const toastInfo    = (msg) => toast(msg, 'info');
