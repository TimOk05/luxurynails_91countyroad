const body = document.body;
const header = document.querySelector('[data-header]');
const menu = document.querySelector('[data-menu]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const menuLabel = menuToggle?.querySelector('.sr-only');
const quoteForm = document.querySelector('[data-quote-form]');
const quoteStatus = document.querySelector('[data-form-status]');

const closeMenu = () => {
  if (!menu || !menuToggle) return;
  menu.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  if (menuLabel) menuLabel.textContent = 'Open menu';
  body.classList.remove('menu-open');
};

if (menuToggle && menu) {
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') === 'true';
    menu.classList.toggle('is-open', !open);
    menuToggle.setAttribute('aria-expanded', String(!open));
    if (menuLabel) menuLabel.textContent = open ? 'Open menu' : 'Close menu';
    body.classList.toggle('menu-open', !open);
  });

  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
      menuToggle.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 780) closeMenu();
  });
}

const updateHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 12);
};

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

document.querySelectorAll('.faq-item button').forEach((button) => {
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    const answer = document.getElementById(button.getAttribute('aria-controls'));
    button.setAttribute('aria-expanded', String(!expanded));
    if (answer) answer.hidden = expanded;
  });
});

document.querySelectorAll('[data-service-link]').forEach((link) => {
  link.addEventListener('click', () => {
    const service = document.getElementById('service');
    if (!service) return;
    service.value = link.dataset.serviceLink || '';
    service.removeAttribute('aria-invalid');
    const error = document.querySelector('[data-error-for="service"]');
    if (error) error.textContent = '';
  });
});

const fieldMessages = {
  service: 'Please choose a cleaning service.',
  postcode: 'Please enter your postcode.',
  property: 'Please choose your property size.',
  name: 'Please enter your name.',
  phone: 'Please enter a phone number.'
};

const validateField = (field) => {
  const value = field.value.trim();
  const error = document.querySelector(`[data-error-for="${field.name}"]`);
  let message = value ? '' : fieldMessages[field.name];

  if (!message && field.name === 'postcode' && value.length < 3) {
    message = 'Please check your postcode.';
  }

  if (!message && field.name === 'phone' && value.replace(/\D/g, '').length < 7) {
    message = 'Please check your phone number.';
  }

  field.setAttribute('aria-invalid', String(Boolean(message)));
  if (!message) field.removeAttribute('aria-invalid');
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
    const valid = requiredFields.map(validateField).every(Boolean);

    if (!valid) {
      const firstInvalid = quoteForm.querySelector('[aria-invalid="true"]');
      firstInvalid?.focus();
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
      `I'd like a free quote for: ${data.get('service')}`,
      `Postcode: ${data.get('postcode')}`,
      `Property: ${data.get('property')}`,
      `Phone: ${data.get('phone')}`
    ];

    if (details) lines.push(`Extra details: ${details}`);
    lines.push('', 'I would also like to claim the 10% first-clean offer.');

    if (quoteStatus) {
      quoteStatus.textContent = 'Your enquiry is ready — opening WhatsApp in a new tab.';
      quoteStatus.classList.add('is-visible');
    }

    const whatsappUrl = `https://wa.me/447380276526?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  });
}

document.querySelectorAll('[data-year]').forEach((item) => {
  item.textContent = new Date().getFullYear();
});
