const body = document.body;
const header = document.querySelector('[data-header]');
const menu = document.querySelector('[data-menu]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const menuLabel = menuToggle?.querySelector('.sr-only');
const quoteForm = document.querySelector('[data-quote-form]');
const quoteStatus = document.querySelector('[data-form-status]');
const quotePrompt = document.querySelector('[data-quote-prompt]');
const quotePromptCta = document.querySelector('[data-quote-prompt-cta]');

const closeMenu = () => {
  if (!menu || !menuToggle) return;
  menu.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  if (menuLabel) menuLabel.textContent = 'Open menu';
  body.classList.remove('menu-open');
};

if (menu && menuToggle) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menu.classList.toggle('is-open', !isOpen);
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    if (menuLabel) menuLabel.textContent = isOpen ? 'Open menu' : 'Close menu';
    body.classList.toggle('menu-open', !isOpen);
  });

  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || menuToggle.getAttribute('aria-expanded') !== 'true') return;
    closeMenu();
    menuToggle.focus();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });
}

const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      activeObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -7% 0px', threshold: 0.06 });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const serviceTabs = [...document.querySelectorAll('[data-service-tab]')];
const servicePanels = [...document.querySelectorAll('[data-service-panel]')];

const selectServicePanel = (serviceName, moveFocus = false) => {
  serviceTabs.forEach((tab) => {
    const selected = tab.dataset.serviceTab === serviceName;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && moveFocus) tab.focus();
  });

  servicePanels.forEach((panel) => {
    panel.hidden = panel.dataset.servicePanel !== serviceName;
  });
};

serviceTabs.forEach((tab, index) => {
  tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
  tab.addEventListener('click', () => selectServicePanel(tab.dataset.serviceTab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % serviceTabs.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + serviceTabs.length) % serviceTabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = serviceTabs.length - 1;
    selectServicePanel(serviceTabs[nextIndex].dataset.serviceTab, true);
  });
});

document.querySelectorAll('[data-select-service]').forEach((link) => {
  link.addEventListener('click', () => {
    const serviceSelect = document.getElementById('service');
    if (!serviceSelect) return;
    serviceSelect.value = link.dataset.selectService || '';
    serviceSelect.removeAttribute('aria-invalid');
    const error = document.querySelector('[data-error-for="service"]');
    if (error) error.textContent = '';
  });
});

const messages = {
  service: 'Please select a service.',
  postcode: 'Please enter your postcode.',
  property: 'Please select your property size.',
  name: 'Please enter your name.',
  phone: 'Please enter a phone number.'
};

const validateField = (field) => {
  const value = field.value.trim();
  const error = document.querySelector(`[data-error-for="${field.name}"]`);
  let message = value ? '' : messages[field.name];

  if (!message && field.name === 'postcode' && value.length < 3) message = 'Please check your postcode.';
  if (!message && field.name === 'phone' && value.replace(/\D/g, '').length < 7) message = 'Please check your phone number.';

  if (message) field.setAttribute('aria-invalid', 'true');
  else field.removeAttribute('aria-invalid');
  if (error) error.textContent = message || '';
  return !message;
};

if (quoteForm) {
  const requiredFields = [...quoteForm.querySelectorAll('[required]')];

  requiredFields.forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
    field.addEventListener('change', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  quoteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const isValid = requiredFields.map(validateField).every(Boolean);

    if (!isValid) {
      quoteForm.querySelector('[aria-invalid="true"]')?.focus();
      if (quoteStatus) {
        quoteStatus.textContent = 'Please complete the highlighted details.';
        quoteStatus.classList.add('is-visible');
      }
      return;
    }

    const data = new FormData(quoteForm);
    const details = data.get('details')?.toString().trim();
    const lines = [
      `Hello LockSora, my name is ${data.get('name')}.`,
      '',
      `I would like a quote for: ${data.get('service')}`,
      `Postcode: ${data.get('postcode')}`,
      `Property: ${data.get('property')}`,
      `Phone: ${data.get('phone')}`
    ];

    if (details) lines.push(`Extra details: ${details}`);
    lines.push('', 'I would also like to claim the 10% new-customer offer.');

    if (quoteStatus) {
      quoteStatus.textContent = 'Your enquiry is ready — opening WhatsApp in a new tab.';
      quoteStatus.classList.add('is-visible');
    }

    window.open(`https://wa.me/447380276526?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer');
  });
}

if (quotePrompt && typeof quotePrompt.showModal === 'function') {
  const promptStorageKey = 'locksoraQuotePromptSeen';
  let promptTimer;

  const hasSeenPrompt = () => {
    try {
      return sessionStorage.getItem(promptStorageKey) === 'true';
    } catch {
      return false;
    }
  };

  const rememberPrompt = () => {
    try {
      sessionStorage.setItem(promptStorageKey, 'true');
    } catch {
      // The prompt can still work when storage is unavailable.
    }
  };

  const clearPromptTimer = () => {
    if (!promptTimer) return;
    window.clearTimeout(promptTimer);
    promptTimer = undefined;
  };

  const closePrompt = () => {
    clearPromptTimer();
    if (quotePrompt.open) quotePrompt.close();
    else rememberPrompt();
  };

  const showPrompt = () => {
    if (hasSeenPrompt() || quotePrompt.open) return;
    const enquiry = document.getElementById('enquire');
    const enquiryBounds = enquiry?.getBoundingClientRect();
    const enquiryVisible = enquiryBounds && enquiryBounds.top < window.innerHeight && enquiryBounds.bottom > 0;

    if (enquiryVisible) {
      rememberPrompt();
      return;
    }

    quotePrompt.showModal();
    body.classList.add('dialog-open');
    window.requestAnimationFrame(() => quotePromptCta?.focus());
  };

  if (!hasSeenPrompt()) promptTimer = window.setTimeout(showPrompt, 10000);

  quotePrompt.querySelectorAll('[data-quote-prompt-close]').forEach((button) => {
    button.addEventListener('click', closePrompt);
  });

  quotePromptCta?.addEventListener('click', closePrompt);

  quotePrompt.addEventListener('close', () => {
    body.classList.remove('dialog-open');
    rememberPrompt();
  });

  quotePrompt.addEventListener('click', (event) => {
    if (event.target !== quotePrompt) return;
    const bounds = quotePrompt.getBoundingClientRect();
    const insideDialog = event.clientX >= bounds.left && event.clientX <= bounds.right
      && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    if (!insideDialog) closePrompt();
  });

  document.querySelectorAll('a[href="#enquire"]:not([data-quote-prompt-cta])').forEach((link) => {
    link.addEventListener('click', () => {
      clearPromptTimer();
      rememberPrompt();
    });
  });
}

document.querySelectorAll('[data-year]').forEach((item) => {
  item.textContent = new Date().getFullYear();
});
