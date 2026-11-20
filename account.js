const keys = ['after-rain-notes', 'after-rain-mix-v1', 'after-rain-favorites-v1', 'after-rain-city-v1', 'after-rain-resident-notes-v1'];
const marker = 'silentcity-account';
const draftKey = (userId) => `${marker}-draft-${userId}`;
const statusEvent = 'silentcity-account-status';
let state = { user: null, values: {}, googleEnabled: false };
let pending = {};
let conflicts = false;
let sending;
let timer;
let status = '';

function stored(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function notify(message) {
  status = message;
  document.dispatchEvent(new Event(statusEvent));
}

async function request(path = '', method = 'GET', body, keepalive = false) {
  const response = await fetch(`/api/account${path}`, { method, cache: 'no-store', signal: AbortSignal.timeout(5000), keepalive, ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error('Account request failed'), { status: response.status, result });
  return result;
}

function remember(data) {
  state = { values: {}, ...data };
  pending = {};
  conflicts = false;
  try {
    if (state.user) {
      localStorage.setItem(marker, String(state.user.id));
      const saved = JSON.parse(stored(draftKey(state.user.id)) || '{}');
      for (const key of keys) if (typeof saved[key]?.value === 'string' && Number.isSafeInteger(saved[key].version)) pending[key] = saved[key];
    } else localStorage.removeItem(marker);
  } catch {}
}

function persistDraft() {
  if (Object.keys(pending).length) localStorage.setItem(draftKey(state.user.id), JSON.stringify(pending));
  else localStorage.removeItem(draftKey(state.user.id));
}

async function flush(keepalive = false) {
  clearTimeout(timer);
  while (sending) await sending;
  if (!state.user || !Object.keys(pending).length) return true;
  if (conflicts) return false;
  const changes = { ...pending };
  const userId = state.user.id;
  sending = (async () => {
    try {
      const result = await request('', 'PATCH', { changes, userId }, keepalive);
      state.values = result.values;
      for (const [key, entry] of Object.entries(changes)) {
        if (pending[key] === entry) delete pending[key];
        else if (pending[key]) pending[key].version = state.values[key]?.version ?? 0;
      }
      try { persistDraft(); } catch {}
      notify(Object.keys(pending).length ? 'Сохраняю изменения…' : 'Сохранено в аккаунте.');
      return true;
    } catch (error) {
      if (error.status === 409) {
        state.values = error.result.values;
        conflicts = true;
        notify('Есть изменения из другого браузера. Выбери версию в аккаунте.');
      } else notify(error.status === 401 ? 'Сеанс закончился. Войди снова, чтобы отправить черновик.' : 'Синхронизация не удалась. Черновик сохранён в браузере.');
      return false;
    }
  })();
  try { return await sending; } finally { sending = null; }
}

async function restore() {
  if (!stored(marker) && !['#account', '#account-error'].includes(location.hash)) return;
  try {
    remember(await request());
    if (!state.user) return;
    for (const [key, value] of Object.entries(guestValues())) {
      if (Object.hasOwn(state.values, key) || Object.hasOwn(pending, key)) continue;
      try { account.set(key, value); } catch {}
    }
    void flush();
  }
  catch { notify('Аккаунт временно недоступен.'); }
}

const ready = restore();
export const account = {
  ready,
  statusEvent,
  signedIn: () => Boolean(state.user),
  message: () => status,
  get(key) { return state.user ? pending[key]?.value ?? state.values[key]?.value ?? null : stored(key); },
  set(key, value) {
    if (!state.user) { localStorage.setItem(key, value); return; }
    if (account.get(key) === value) return;
    const previous = pending[key];
    pending[key] = { value, version: previous?.version ?? state.values[key]?.version ?? 0 };
    try { persistDraft(); }
    catch (error) { if (previous) pending[key] = previous; else delete pending[key]; throw error; }
    if (conflicts) return;
    notify('Сохраняю изменения…');
    clearTimeout(timer);
    timer = setTimeout(() => void flush(), 450);
  },
  async latest(key) {
    const userId = state.user?.id;
    if (!userId || pending[key]) return account.get(key);
    const result = await request();
    if (result.user?.id !== userId || state.user?.id !== userId) throw new Error('Session changed');
    if (!pending[key]) {
      const entry = result.values[key];
      if (entry && entry.version >= (state.values[key]?.version ?? 0)) state.values[key] = entry;
    }
    return account.get(key);
  }
};

window.addEventListener('online', () => void flush());
document.addEventListener('visibilitychange', () => {
  void flush(document.hidden);
});

function guestValues() {
  const values = {};
  for (const key of keys) {
    const value = stored(key);
    if (value === null || (key === 'after-rain-notes' && !value)) continue;
    if (key !== 'after-rain-notes') {
      try {
        const data = JSON.parse(value);
        if (!data || typeof data !== 'object' || Array.isArray(data)) continue;
      } catch { continue; }
    }
    values[key] = value;
  }
  return values;
}

function fillProfile(content, showStatus) {
  content.innerHTML = `<h2 id="room-title">Аккаунт</h2><p class="account-name"></p><p>Заметки, звуки и выбранный город сохраняются автоматически.</p><div class="account-actions"><button class="dialog-action secondary" id="account-logout">Выйти</button></div><p id="account-status" role="status"></p>`;
  content.querySelector('.account-name').textContent = state.user.name;
  const actions = content.querySelector('.account-actions');
  const addAction = (label, callback) => {
    const button = document.createElement('button');
    button.className = 'dialog-action secondary';
    button.textContent = label;
    button.addEventListener('click', callback);
    actions.append(button);
  };
  if (conflicts) {
    addAction('Сохранить мои изменения', async () => {
      for (const [key, entry] of Object.entries(pending)) entry.version = state.values[key]?.version ?? 0;
      conflicts = false;
      try { persistDraft(); } catch {}
      if (await flush()) location.reload(); else fillProfile(content, showStatus);
    });
    addAction('Загрузить данные аккаунта', () => {
      for (const [key, entry] of Object.entries(pending)) {
        if ((state.values[key]?.version ?? 0) !== entry.version) delete pending[key];
      }
      conflicts = false;
      try { persistDraft(); } catch {}
      location.reload();
    });
  }
  content.querySelector('#account-logout').addEventListener('click', async () => {
    await flush();
    try { await request('/logout', 'POST'); remember({ user: null }); location.reload(); }
    catch { showStatus('Не удалось выйти. Попробуй ещё раз.'); }
  });
  showStatus(status || 'Синхронизация включена.');
}

function registrationIssue(field) {
  if (field.name === 'password') {
    if (!field.value) return 'Придумай пароль.';
    if (field.value.length < 8) return 'Нужно хотя бы 8 символов.';
    if (field.value.length > 128) return 'В пароле должно быть не больше 128 символов.';
    return '';
  }

  const login = field.value.trim().toLowerCase();
  if (!login) return 'Введи логин или почту.';
  if (login.includes('@')) {
    if (login.length > 254) return 'Адрес почты слишком длинный.';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login) ? '' : 'Проверь адрес почты. Пример — name@example.com.';
  }
  if (!/^[a-z0-9_.-]+$/.test(login)) return 'Используй латинские буквы, цифры, точку, дефис или знак подчёркивания.';
  if (login.length < 3) return 'В логине должно быть хотя бы 3 символа.';
  if (login.length > 32) return 'В логине должно быть не больше 32 символов.';
  return '';
}

export function accountRoom(content, googleError = false) {
  const showStatus = (message) => { const element = content.querySelector('#account-status'); if (element) element.textContent = message; };
  if (state.user) { fillProfile(content, showStatus); return; }
  content.innerHTML = `
    <h2 id="room-title">Аккаунт</h2>
    <p>Войди, чтобы открыть свои заметки и настройки на телефоне и компьютере.</p>
    <form class="account-form">
      <div class="account-field">
        <label for="account-login">Логин или почта</label>
        <input id="account-login" name="login" autocomplete="username" autocapitalize="none" spellcheck="false" required maxlength="254" aria-describedby="account-login-error">
        <span class="account-field-error" id="account-login-error" aria-live="polite"></span>
      </div>
      <div class="account-field">
        <label for="account-password">Пароль</label>
        <input id="account-password" name="password" type="password" autocomplete="current-password" required minlength="8" maxlength="128" aria-describedby="account-password-error">
        <span class="account-field-error" id="account-password-error" aria-live="polite"></span>
      </div>
      <div class="account-actions">
        <button class="dialog-action" type="submit">Войти</button>
        <button class="dialog-action secondary" type="button" id="account-mode">Создать аккаунт</button>
      </div>
    </form>
    <div class="account-provider" hidden>
      <a class="dialog-action account-google" href="/api/account/google">
        <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Войти через Google
      </a>
    </div>
    <p id="account-status" role="status"></p>`;
  const form = content.querySelector('.account-form');
  const submit = form.querySelector('[type="submit"]');
  const mode = form.querySelector('#account-mode');
  const { login, password } = form.elements;
  const registrationFields = [login, password];
  let register = false;
  const setFieldError = (field, message) => {
    const error = form.querySelector(`#${field.id}-error`);
    if (error.textContent !== message) error.textContent = message;
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
  };
  for (const field of registrationFields) {
    field.addEventListener('blur', () => {
      if (register && field.value && !field.hasAttribute('aria-invalid')) setFieldError(field, registrationIssue(field));
    });
    field.addEventListener('input', () => {
      if (register && field.hasAttribute('aria-invalid')) setFieldError(field, registrationIssue(field));
    });
  }
  mode.addEventListener('click', () => {
    register = !register;
    form.noValidate = register;
    password.autocomplete = register ? 'new-password' : 'current-password';
    submit.textContent = register ? 'Зарегистрироваться' : 'Войти';
    mode.textContent = register ? 'Уже есть аккаунт' : 'Создать аккаунт';
    registrationFields.forEach((field) => setFieldError(field, ''));
    showStatus('');
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (register) {
      showStatus('');
      let firstInvalid;
      for (const field of registrationFields) {
        const message = registrationIssue(field);
        setFieldError(field, message);
        if (message) firstInvalid ??= field;
      }
      if (firstInvalid) { firstInvalid.focus(); return; }
    }
    const payload = { login: login.value, password: password.value };
    submit.disabled = mode.disabled = true;
    showStatus('Подключаюсь…');
    try { remember(await request(register ? '/register' : '/login', 'POST', payload)); location.reload(); }
    catch (error) {
      submit.disabled = mode.disabled = false;
      if (register && error.status === 409) {
        showStatus('');
        if (login.value === payload.login) {
          setFieldError(login, payload.login.includes('@') ? 'Аккаунт с этой почтой уже существует.' : 'Этот логин уже занят.');
          login.focus();
        }
        return;
      }
      showStatus(({ 400: 'Проверь логин, почту и длину пароля.', 401: 'Логин или пароль не подошли.', 409: 'Этот логин уже занят.', 429: 'Слишком много попыток. Попробуй позже.' })[error.status] || 'Не удалось подключиться. Попробуй ещё раз.');
    }
  });
  if (googleError) showStatus('Вход через Google не завершился. Попробуй ещё раз.');
  request().then((data) => {
    if (!content.contains(form)) return;
    if (data.user) { remember(data); location.reload(); return; }
    content.querySelector('.account-provider').hidden = !data.googleEnabled;
  }).catch(() => showStatus('Аккаунт временно недоступен.'));
}
