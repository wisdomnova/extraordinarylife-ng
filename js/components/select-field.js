/** Select with custom chevron (no native dropdown arrow) */

export function renderSelectField({ id, label, optionsHtml, selectClass = 'select' }) {
  const labelHtml = label
    ? `<label for="${id}">${label}</label>`
    : '';
  return `
    <div class="form-group">
      ${labelHtml}
      <div class="select-wrap">
        <select id="${id}" class="${selectClass}">${optionsHtml}</select>
        <span class="select-wrap__chevron" aria-hidden="true">
          <ion-icon name="chevron-down-outline"></ion-icon>
        </span>
      </div>
    </div>
  `;
}

export function renderSelectInline({ id, optionsHtml, selectClass = 'select' }) {
  return `
    <div class="select-wrap">
      <select id="${id}" class="${selectClass}">${optionsHtml}</select>
      <span class="select-wrap__chevron" aria-hidden="true">
        <ion-icon name="chevron-down-outline"></ion-icon>
      </span>
    </div>
  `;
}
