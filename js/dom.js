// Tiny DOM helpers. User data is always inserted as text, never as HTML.

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (['value', 'checked', 'disabled', 'selected', 'open'].includes(k)) el[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  appendAll(el, children);
  return el;
}

export function appendAll(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false || c === true) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function toast(message, kind = 'info', ms = 3000) {
  const root = document.getElementById('toast-root');
  const t = h('div', { class: `toast toast-${kind}`, role: kind === 'error' ? 'alert' : 'status' }, message);
  root.append(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, ms);
}

export function loading(text = 'Chargement…') {
  return h('div', { class: 'loading', role: 'status' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), text);
}

export function errorBox(message, onRetry) {
  return h('div', { class: 'error-box', role: 'alert' },
    h('p', {}, '🥶 ', message),
    onRetry && h('button', { class: 'btn btn-secondary', type: 'button', onclick: onRetry }, 'Réessayer'),
  );
}

const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
export function timeAgo(iso) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return 'à l’instant';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function plural(n, one, many) {
  return `${n} ${n > 1 ? many : one}`;
}

/** Single-choice group of chip buttons. Tapping the selected chip clears it (every question is optional). */
export function choiceGroup({ name, options, value, disabled, onChange, label }) {
  let current = value ?? null;
  const buttons = options.map((o) => h('button', {
    type: 'button',
    class: 'chip',
    role: 'radio',
    'aria-checked': String(current === o.value),
    dataset: { value: o.value },
    disabled,
    onclick: () => {
      current = current === o.value ? null : o.value;
      sync();
      onChange?.(current);
    },
  }, o.emoji ? `${o.emoji} ` : '', o.label));
  function sync() {
    buttons.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.value === current)));
  }
  return h('div', { class: 'chips', role: 'radiogroup', 'aria-label': label || name }, buttons);
}
