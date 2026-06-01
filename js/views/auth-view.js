import { TERMS_AND_CONDITIONS, CONSENT_TEXT } from '../config.js';
import { login, register } from '../auth.js';
import { openModal } from '../components/modal.js';
import { toast } from '../components/toast.js';

export function renderAuthView(onSuccess) {
  return `
    <div class="auth-page">
      <div class="auth-page__hero">
        <div class="auth-hero__badge">Co-working, simplified</div>
        <h1>Book your desk.<br /><span>Focus on what matters.</span></h1>
        <p>17 hot desks, a premium conference room, and seamless access in one place.</p>
        <div class="auth-hero__stats">
          <div><strong>17</strong><span>Hot desks</span></div>
          <div><strong>₦10k</strong><span>Per day</span></div>
          <div><strong>90</strong><span>Days ahead</span></div>
        </div>
      </div>
      <div class="auth-page__form-wrap">
        <div class="auth-mobile-brand">
          <span class="nav__brand">Extraordinary<span>Life</span></span>
        </div>
        <div class="auth-card">
          <div class="auth-tabs">
            <button type="button" class="auth-tab auth-tab--active" data-tab="login">Sign in</button>
            <button type="button" class="auth-tab" data-tab="register">Register</button>
          </div>
          <div id="auth-form-container" class="auth-form-scroll"></div>
        </div>
      </div>
    </div>
  `;
}

export function bindAuthView(root, onSuccess) {
  const container = root.querySelector('#auth-form-container');
  let tab = 'login';

  const card = root.querySelector('.auth-card');

  const showTab = (t) => {
    tab = t;
    root.querySelectorAll('.auth-tab').forEach((btn) => {
      btn.classList.toggle('auth-tab--active', btn.dataset.tab === t);
    });
    card?.classList.toggle('auth-card--scrollable', t === 'register');
    container.classList.toggle('auth-form-scroll--compact', t === 'login');
    container.innerHTML = t === 'login' ? loginForm() : registerForm();
    bindForm(container, t, onSuccess);
  };

  root.querySelectorAll('.auth-tab').forEach((btn) => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });

  showTab('login');
}

function passwordField(id, label, opts = {}) {
  const { minlength, placeholder = '' } = opts;
  return `
    <div class="form-group">
      <label for="${id}">${label}</label>
      <div class="password-field">
        <input
          type="password"
          id="${id}"
          required
          ${minlength ? `minlength="${minlength}"` : ''}
          placeholder="${placeholder}"
          autocomplete="${id.includes('login') ? 'current-password' : 'new-password'}"
        />
        <button
          type="button"
          class="password-field__toggle"
          data-target="${id}"
          aria-label="Show password"
        >
          <ion-icon name="eye-outline"></ion-icon>
        </button>
      </div>
    </div>
  `;
}

function loginForm() {
  return `
    <form class="form" id="login-form">
      <div class="form-group">
        <label for="login-email">Email</label>
        <input type="email" id="login-email" required placeholder="you@company.com" autocomplete="email" />
      </div>
      ${passwordField('login-password', 'Password', { placeholder: 'Enter password' })}
      <button type="submit" class="btn btn--primary btn--full">Sign in</button>
    </form>
  `;
}

function registerForm() {
  return `
    <form class="form" id="register-form">
      <div class="form-group">
        <label for="reg-name">Full name *</label>
        <input type="text" id="reg-name" required />
      </div>
      <div class="form-group">
        <label for="reg-email">Email *</label>
        <input type="email" id="reg-email" required />
      </div>
      <div class="form-group">
        <label for="reg-phone">Phone *</label>
        <input type="tel" id="reg-phone" required placeholder="+234..." />
      </div>
      <div class="form-group">
        <label for="reg-org">Organisation / Company *</label>
        <input type="text" id="reg-org" required />
      </div>
      <div class="form-group">
        <span class="form-group__label">Profile photo</span>
        <div class="photo-uploader" id="photo-uploader">
          <input type="file" id="reg-photo" accept="image/jpeg,image/png,image/webp" hidden />
          <button type="button" class="photo-uploader__zone" id="photo-uploader-zone" aria-label="Upload profile photo">
            <span class="photo-uploader__avatar" id="photo-uploader-preview">
              <ion-icon name="person-outline"></ion-icon>
            </span>
            <span class="photo-uploader__text">
              <strong id="photo-uploader-title">Add photo</strong>
              <small>Click or drag JPG, PNG. Max 5MB.</small>
            </span>
          </button>
          <button type="button" class="photo-uploader__remove" id="photo-remove" hidden aria-label="Remove photo">
            <ion-icon name="close-circle"></ion-icon>
          </button>
        </div>
      </div>
      ${passwordField('reg-password', 'Password *', { minlength: 6, placeholder: 'Min. 6 characters' })}
      <label class="checkbox">
        <input type="checkbox" id="reg-consent" required />
        <span>${CONSENT_TEXT} <button type="button" class="link-btn" id="view-terms-reg">View T&amp;C</button></span>
      </label>
      <label class="checkbox">
        <input type="checkbox" id="reg-terms" required />
        <span>I accept the <button type="button" class="link-btn" id="view-terms-reg2">Terms &amp; Conditions</button></span>
      </label>
      <button type="submit" class="btn btn--primary btn--full" id="reg-submit" disabled>Create account</button>
    </form>
  `;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function bindPasswordToggles(container) {
  container.querySelectorAll('.password-field__toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = container.querySelector(`#${btn.dataset.target}`);
      const icon = btn.querySelector('ion-icon');
      if (!input || !icon) return;
      const revealing = input.type === 'password';
      input.type = revealing ? 'text' : 'password';
      const iconName = revealing ? 'eye-off-outline' : 'eye-outline';
      if ('name' in icon) icon.name = iconName;
      else icon.setAttribute('name', iconName);
      btn.setAttribute('aria-label', revealing ? 'Hide password' : 'Show password');
      btn.setAttribute('aria-pressed', revealing ? 'true' : 'false');
    });
  });
}

function bindPhotoUploader(container) {
  const input = container.querySelector('#reg-photo');
  const zone = container.querySelector('#photo-uploader-zone');
  const preview = container.querySelector('#photo-uploader-preview');
  const title = container.querySelector('#photo-uploader-title');
  const removeBtn = container.querySelector('#photo-remove');
  const uploader = container.querySelector('#photo-uploader');
  if (!input || !zone) return;

  let objectUrl = null;

  const clearPhoto = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
    input.value = '';
    preview.innerHTML = '<ion-icon name="person-outline"></ion-icon>';
    preview.classList.remove('photo-uploader__avatar--has-image');
    title.textContent = 'Add photo';
    removeBtn.hidden = true;
    uploader.classList.remove('photo-uploader--filled');
  };

  const setPhoto = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file (JPG or PNG).', 'error');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast('Image must be 5MB or smaller.', 'error');
      return;
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    preview.innerHTML = `<img src="${objectUrl}" alt="Profile preview" />`;
    preview.classList.add('photo-uploader__avatar--has-image');
    title.textContent = 'Change photo';
    removeBtn.hidden = false;
    uploader.classList.add('photo-uploader--filled');
  };

  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', () => setPhoto(input.files[0]));
  removeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    clearPhoto();
  });

  uploader.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploader.classList.add('photo-uploader--drag');
  });
  uploader.addEventListener('dragleave', () => {
    uploader.classList.remove('photo-uploader--drag');
  });
  uploader.addEventListener('drop', (e) => {
    e.preventDefault();
    uploader.classList.remove('photo-uploader--drag');
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      setPhoto(file);
    }
  });
}

function bindForm(container, tab, onSuccess) {
  bindPasswordToggles(container);

  if (tab === 'login') {
    container.querySelector('#login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = container.querySelector('#login-email').value;
      const password = container.querySelector('#login-password').value;
      const submitBtn = e.target.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      const res = await login(email, password);
      submitBtn.disabled = false;
      if (res.ok) {
        toast('Welcome back!', 'success');
        onSuccess();
      } else toast(res.error, 'error');
    });
    return;
  }

  const consent = container.querySelector('#reg-consent');
  const terms = container.querySelector('#reg-terms');
  const submit = container.querySelector('#reg-submit');

  const updateSubmit = () => {
    submit.disabled = !(consent.checked && terms.checked);
  };
  consent?.addEventListener('change', updateSubmit);
  terms?.addEventListener('change', updateSubmit);

  const showTerms = () => {
    openModal({
      title: 'Terms & Conditions',
      bodyHtml: `<div class="terms-content">${TERMS_AND_CONDITIONS}</div>`,
      wide: true,
    });
  };
  container.querySelector('#view-terms-reg')?.addEventListener('click', showTerms);
  container.querySelector('#view-terms-reg2')?.addEventListener('click', showTerms);

  bindPhotoUploader(container);

  container.querySelector('#register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await register({
      fullName: container.querySelector('#reg-name').value,
      email: container.querySelector('#reg-email').value,
      phone: container.querySelector('#reg-phone').value,
      organisation: container.querySelector('#reg-org').value,
      password: container.querySelector('#reg-password').value,
      photoFile: container.querySelector('#reg-photo').files[0] || null,
      consent: consent.checked,
      termsAccepted: terms.checked,
    });
    if (res.ok) {
      toast('Account created!', 'success');
      onSuccess();
    } else toast(res.error, 'error');
  });
}
