/** Simple prev/next pagination controls */

export function renderPagination({ id, page, totalPages, total }) {
  if (totalPages <= 1) {
    return total > 0
      ? `<p class="pagination__summary" id="${id}-summary">${total} total</p>`
      : '';
  }

  return `
    <div class="pagination" id="${id}" data-page="${page}" data-total-pages="${totalPages}">
      <p class="pagination__summary">Page ${page} of ${totalPages} · ${total} total</p>
      <div class="pagination__controls">
        <button type="button" class="btn btn--ghost btn--sm pagination__btn" data-page-nav="prev" ${page <= 1 ? 'disabled' : ''}>
          <ion-icon name="chevron-back-outline"></ion-icon> Previous
        </button>
        <button type="button" class="btn btn--ghost btn--sm pagination__btn" data-page-nav="next" ${page >= totalPages ? 'disabled' : ''}>
          Next <ion-icon name="chevron-forward-outline"></ion-icon>
        </button>
      </div>
    </div>
  `;
}

export function bindPagination(container, { onPageChange }) {
  if (!container) return;
  container.querySelectorAll('[data-page-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wrap = container.classList.contains('pagination') ? container : container.querySelector('.pagination');
      if (!wrap) return;
      const page = Number(wrap.dataset.page || 1);
      const totalPages = Number(wrap.dataset.totalPages || 1);
      const dir = btn.dataset.pageNav;
      const next = dir === 'prev' ? page - 1 : page + 1;
      if (next < 1 || next > totalPages) return;
      onPageChange(next);
    });
  });
}
