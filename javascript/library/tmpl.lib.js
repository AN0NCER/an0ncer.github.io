/**
 * tmpl.js — mini template library
 * Клонирует <template>, биндит данные, возвращает объект для дальнейшей работы.
 *
 * @example
 *   const card = tmpl('#card-tpl', { title: 'Hi', body: 'World' })
 *   card.appendTo('#app')
 *   card.update({ title: 'New title' })
 *   card.remove()
 */

function tmpl(templateId, data = {}) {
  // --- найти <template> ---
  const tplEl = typeof templateId === 'string'
    ? document.querySelector(templateId)
    : templateId;

  if (!tplEl || tplEl.tagName !== 'TEMPLATE') {
    throw new Error(`tmpl: элемент "${templateId}" не найден или не является <template>`);
  }

  // --- клонировать содержимое ---
  const fragment = tplEl.content.cloneNode(true);
  // Оборачиваем во временный div, чтобы был один корневой элемент для работы
  const wrapper = document.createElement('div');
  wrapper.appendChild(fragment);
  const root = wrapper.firstElementChild ?? wrapper;

  // --- применить начальные данные ---
  _bind(root, data);

  // --- публичный объект ---
  const instance = {
    /** Сам DOM-элемент */
    el: root,

    /** Текущие данные */
    data: { ...data },

    /**
     * Обновить данные и перерисовать привязанные узлы.
     * Передавай только изменившиеся ключи — остальные не тронуты.
     */
    update(newData) {
      Object.assign(instance.data, newData);
      _bind(root, instance.data);
      return instance;
    },

    /**
     * Вставить элемент в контейнер.
     * @param {string|Element} target  — CSS-селектор или DOM-элемент
     * @param {'append'|'prepend'|'before'|'after'} position
     */
    appendTo(target, position = 'append') {
      const container = typeof target === 'string'
        ? document.querySelector(target)
        : target;

      if (!container) throw new Error(`tmpl.appendTo: контейнер "${target}" не найден`);

      const actions = {
        append:  () => container.append(root),
        prepend: () => container.prepend(root),
        before:  () => container.before(root),
        after:   () => container.after(root),
      };

      (actions[position] ?? actions.append)();
      return instance;
    },

    /** Удалить элемент из DOM */
    remove() {
      root.remove();
      return instance;
    },

    /** Скрыть / показать */
    hide() { root.style.display = 'none'; return instance; },
    show(display = '') { root.style.display = display; return instance; },

    /**
     * Навесить обработчик события на элемент внутри шаблона.
     * @example card.on('click', '[data-action="delete"]', handler)
     */
    on(event, selectorOrHandler, handler) {
      if (typeof selectorOrHandler === 'function') {
        root.addEventListener(event, selectorOrHandler);
      } else {
        root.addEventListener(event, e => {
          if (e.target.closest(selectorOrHandler)) {
            handler.call(e.target.closest(selectorOrHandler), e, instance);
          }
        });
      }
      return instance;
    },

    /** Найти дочерний элемент по селектору */
    find(selector) {
      return root.querySelector(selector);
    },

    /** Клонировать этот инстанс с теми же (или новыми) данными */
    clone(overrides = {}) {
      return tmpl(tplEl, { ...instance.data, ...overrides });
    },
  };

  return instance;
}

// ---------------------------------------------------------------------------
// Внутренняя функция биндинга
// ---------------------------------------------------------------------------

/**
 * Обходит DOM и заполняет узлы данными.
 *
 * Поддерживаемые атрибуты:
 *   data-bind="key"            → textContent = data[key]
 *   data-bind-html="key"       → innerHTML   = data[key]
 *   data-bind-attr="attr:key"  → el.setAttribute(attr, data[key])
 *   data-bind-class="key"      → добавляет CSS-класс из data[key]
 *   data-bind-if="key"         → скрывает элемент, если data[key] falsy
 */
function _bind(root, data) {
  const selector = '[data-bind],[data-bind-html],[data-bind-attr],[data-bind-class],[data-bind-if]';
  const nodes = [
    ...(root.matches && root.matches(selector) ? [root] : []),
    ...root.querySelectorAll(selector),
  ];
  nodes.forEach(el => _applyBindings(el, data));
}

/** Применяет все bind-директивы к одному элементу */
function _applyBindings(el, data) {
  // data-bind → textContent
  if (el.hasAttribute('data-bind')) {
    const key = el.getAttribute('data-bind');
    // _has проверяет что ключ был явно передан в data (даже если значение undefined/null)
    if (_has(data, key)) el.textContent = _get(data, key) ?? '';
  }

  // data-bind-html → innerHTML
  if (el.hasAttribute('data-bind-html')) {
    const key = el.getAttribute('data-bind-html');
    if (_has(data, key)) el.innerHTML = _get(data, key) ?? '';
  }

  // data-bind-attr="href:url, data-id:id" → setAttribute
  if (el.hasAttribute('data-bind-attr')) {
    el.getAttribute('data-bind-attr').split(',').map(s => s.trim()).filter(Boolean).forEach(pair => {
      const colonIdx = pair.indexOf(':');
      if (colonIdx === -1) return;
      const attr = pair.slice(0, colonIdx).trim();
      const key  = pair.slice(colonIdx + 1).trim();
      if (_has(data, key)) el.setAttribute(attr, _get(data, key) ?? '');
    });
  }

  // data-bind-class → добавить CSS-класс
  if (el.hasAttribute('data-bind-class')) {
    const key = el.getAttribute('data-bind-class');
    if (_has(data, key)) {
      const val = _get(data, key);
      if (val) el.classList.add(val);
    }
  }

  // data-bind-if="key" / "!key" → показать / скрыть
  if (el.hasAttribute('data-bind-if')) {
    const key    = el.getAttribute('data-bind-if');
    const negate = key.startsWith('!');
    const realKey = negate ? key.slice(1) : key;
    if (_has(data, realKey)) {
      const val = _get(data, realKey);
      el.style.display = (negate ? !val : !!val) ? '' : 'none';
    }
  }
}

/**
 * Проверяет что ключ (включая вложенный "user.name") явно присутствует в объекте.
 * Возвращает true даже если значение undefined или null.
 */
function _has(obj, path) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur == null || typeof cur !== 'object') return false;
    cur = cur[keys[i]];
  }
  return cur != null && Object.prototype.hasOwnProperty.call(cur, keys[keys.length - 1]);
}

/** Получить значение по вложенному ключу: "user.name" → data.user.name */
function _get(obj, path) {
  return path.split('.').reduce((acc, k) => acc?.[k], obj);
}

export default tmpl;