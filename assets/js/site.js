const routes = {
  home: '/',
  services: '/services/',
  process: '/how-i-work/',
  cases: '/case-studies/',
  about: '/about/',
  contact: '/start-here/',
  blog: '/blog/'
};

const formCopy = {
  "en": {
    "subjectPrefix": "Walkcat enquiry",
    "fallbackSubject": "New project brief",
    "formTitle": "Walkcat intake form",
    "name": "Name",
    "businessName": "Business name",
    "email": "Email",
    "phone": "Phone / WhatsApp",
    "website": "Website",
    "businessType": "Business type",
    "timeWaste": "What is currently wasting your time?",
    "currentProblem": "What feels slow, manual, or broken right now?",
    "desiredOutcome": "What outcome are you hoping for?",
    "helpType": "What type of help do you think you need?",
    "timeline": "Any timelines or constraints?"
  },
  "ru": {
    "subjectPrefix": "запрос Walkcat",
    "fallbackSubject": "Краткое описание нового проекта",
    "formTitle": "Форма приема Walkcat",
    "name": "Имя",
    "businessName": "Название компании",
    "email": "Электронная почта",
    "phone": "Телефон/Ватсап",
    "website": "Веб-сайт",
    "businessType": "Тип бизнеса",
    "timeWaste": "На что сейчас тратится ваше время?",
    "currentProblem": "Что сейчас кажется медленным, ручным или сломанным?",
    "desiredOutcome": "На какой результат вы надеетесь?",
    "helpType": "Как вы думаете, какая помощь вам нужна?",
    "timeline": "Есть ли какие-либо сроки или ограничения?"
  },
  "ua": {
    "subjectPrefix": "Запит Walkcat",
    "fallbackSubject": "Короткий опис нового проекту",
    "formTitle": "Форма прийому Walkcat",
    "name": "Ім'я",
    "businessName": "Назва компанії",
    "email": "Електронна пошта",
    "phone": "Телефон / WhatsApp",
    "website": "Веб-сайт",
    "businessType": "Тип бізнесу",
    "timeWaste": "Що зараз витрачає ваш час?",
    "currentProblem": "Що зараз здається повільним, ручним або зламаним?",
    "desiredOutcome": "На який результат ви сподіваєтесь?",
    "helpType": "Який вид допомоги, на вашу думку, вам потрібен?",
    "timeline": "Будь-які часові рамки чи обмеження?"
  },
  "ro": {
    "subjectPrefix": "Întrebare Walkcat",
    "fallbackSubject": "Un nou proiect",
    "formTitle": "Formular de admisie Walkcat",
    "name": "Nume",
    "businessName": "Numele companiei",
    "email": "E-mail",
    "phone": "Telefon / WhatsApp",
    "website": "Site-ul web",
    "businessType": "Tipul afacerii",
    "timeWaste": "Ce vă pierde timpul în prezent?",
    "currentProblem": "Ce se simte lent, manual sau rupt acum?",
    "desiredOutcome": "La ce rezultat speri?",
    "helpType": "Ce tip de ajutor crezi că ai nevoie?",
    "timeline": "Există termene sau constrângeri?"
  }
};

function localizedPath(path) {
  const prefix = document.body?.dataset?.localePrefix || '';
  if (!prefix) return path;
  return path === '/' ? `${prefix}/` : `${prefix}${path}`;
}

function showPage(id) {
  const target = routes[id];
  if (target) {
    window.location.href = localizedPath(target);
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

function getFormCopy(locale) {
  return formCopy[locale] || formCopy.en;
}

function buildMailtoUrl(data, email, locale) {
  const copy = getFormCopy(locale);
  const subject = encodeURIComponent(`${copy.subjectPrefix}: ${data.business_name || data.name || copy.fallbackSubject}`);
  const lines = [
    copy.formTitle,
    '',
    `${copy.name}: ${data.name || ''}`,
    `${copy.businessName}: ${data.business_name || ''}`,
    `${copy.email}: ${data.email || ''}`,
    `${copy.phone}: ${data.phone || ''}`,
    `${copy.website}: ${data.website || ''}`,
    `${copy.businessType}: ${data.business_type || ''}`,
    '',
    copy.timeWaste,
    data.time_waste || '',
    '',
    copy.currentProblem,
    data.current_problem || '',
    '',
    copy.desiredOutcome,
    data.desired_outcome || '',
    '',
    copy.helpType,
    data.help_type || '',
    '',
    copy.timeline,
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
  const locale = document.body?.dataset?.locale || 'en';
  const mailtoUrl = buildMailtoUrl(data, email, locale);

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
