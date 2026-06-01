export function openModal({ title, bodyHtml, footerHtml, wide = false, onClose }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal ${wide ? 'modal--wide' : ''}" role="dialog" aria-modal="true">
      <div class="modal__header">
        <h2>${title}</h2>
        <button type="button" class="btn-icon modal__close" aria-label="Close">
          <ion-icon name="close"></ion-icon>
        </button>
      </div>
      <div class="modal__body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal__footer">${footerHtml}</div>` : ''}
    </div>
  `;

  const close = () => {
    overlay.classList.remove('modal-overlay--visible');
    setTimeout(() => overlay.remove(), 200);
    onClose?.();
  };

  overlay.querySelector('.modal__close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));
  return { close, el: overlay };
}
