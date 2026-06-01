/** Custom confirmation dialog — returns true if confirmed */

export function showConfirm({
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay confirm-overlay';
    const iconName = variant === 'danger' ? 'log-out-outline' : 'help-circle-outline';
    const confirmClass = variant === 'danger' ? 'btn btn--danger' : 'btn btn--primary';

    overlay.innerHTML = `
      <div class="modal confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div class="confirm-dialog__body">
          <div class="confirm-dialog__icon confirm-dialog__icon--${variant}">
            <ion-icon name="${iconName}"></ion-icon>
          </div>
          <h2 id="confirm-title">${title}</h2>
          ${message ? `<p>${message}</p>` : ''}
        </div>
        <div class="modal__footer confirm-dialog__footer">
          <button type="button" class="btn btn--ghost" data-action="cancel">${cancelText}</button>
          <button type="button" class="${confirmClass}" data-action="confirm">${confirmText}</button>
        </div>
      </div>
    `;

    const finish = (value) => {
      overlay.classList.remove('modal-overlay--visible');
      setTimeout(() => {
        overlay.remove();
        resolve(value);
      }, 200);
    };

    overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => finish(false));
    overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => finish(true));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) finish(false);
    });

    const onKey = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKey);
        finish(false);
      }
    };
    document.addEventListener('keydown', onKey);

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));
    overlay.querySelector('[data-action="confirm"]').focus();
  });
}
