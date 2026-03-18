const routes = {
  home: '/',
  services: '/services/',
  process: '/how-i-work/',
  cases: '/case-studies/',
  about: '/about/',
  contact: '/start-here/',
  blog: '/blog/'
};

function showPage(id) {
  const target = routes[id];
  if (target) {
    window.location.href = target;
  }
}

function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) {
    menu.classList.toggle('open');
  }
}

function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  if (!item) return;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach((el) => el.classList.remove('open'));
  if (!isOpen) {
    item.classList.add('open');
  }
}

function buildMailtoUrl(data, email) {
  const subject = encodeURIComponent(`Walkcat enquiry: ${data.business_name || data.name || 'New project brief'}`);
  const lines = [
    'Walkcat intake form',
    '',
    `Name: ${data.name || ''}`,
    `Business name: ${data.business_name || ''}`,
    `Email: ${data.email || ''}`,
    `Phone / WhatsApp: ${data.phone || ''}`,
    `Website: ${data.website || ''}`,
    `Business type: ${data.business_type || ''}`,
    '',
    'What is currently wasting your time?',
    data.time_waste || '',
    '',
    'What feels slow, manual, or broken right now?',
    data.current_problem || '',
    '',
    'What outcome are you hoping for?',
    data.desired_outcome || '',
    '',
    'What type of help do you think you need?',
    data.help_type || '',
    '',
    'Any timelines or constraints?',
    data.timeline || ''
  ];
  return `mailto:${email}?subject=${subject}&body=${encodeURIComponent(lines.join('\n'))}`;
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget || document.getElementById('intakeForm');
  if (!form) return;

  const data = Object.fromEntries(new FormData(form).entries());
  const email = form.dataset.contactEmail || 'hello@walkcat.ie';
  const successPath = form.dataset.successPath || '/start-here/thanks/';
  const mailtoUrl = buildMailtoUrl(data, email);

  sessionStorage.setItem('walkcatDraft', JSON.stringify({
    email,
    mailtoUrl,
    summary: decodeURIComponent(mailtoUrl.split('&body=')[1] || ''),
    submittedAt: new Date().toISOString()
  }));

  window.location.href = mailtoUrl;
  window.setTimeout(() => {
    window.location.href = successPath;
  }, 300);
}

function initThanksPage() {
  const thanksPage = document.querySelector('[data-thanks-page]');
  if (!thanksPage) return;

  const stored = sessionStorage.getItem('walkcatDraft');
  if (!stored) return;

  try {
    const draft = JSON.parse(stored);
    const retryMailto = document.getElementById('retryMailto');
    const fallbackSummary = document.getElementById('fallbackSummary');
    const fallbackInbox = document.getElementById('fallbackInbox');

    if (retryMailto && draft.mailtoUrl) {
      retryMailto.href = draft.mailtoUrl;
    }

    if (fallbackSummary && draft.summary) {
      fallbackSummary.value = draft.summary;
    }

    if (fallbackInbox && draft.email) {
      fallbackInbox.href = `mailto:${draft.email}`;
      fallbackInbox.textContent = draft.email;
    }
  } catch (error) {
    console.error('Unable to parse stored draft', error);
  }
}

function initAnimatedCards() {
  if (!('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll('.service-card, .card, .case-card, .blog-card, .case-teaser, .principle-card, .about-fact');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  targets.forEach((element) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(16px)';
    element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(element);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initThanksPage();
  initAnimatedCards();
});

window.showPage = showPage;
window.toggleMenu = toggleMenu;
window.toggleFaq = toggleFaq;
window.handleSubmit = handleSubmit;
