// Static concept interactions. No requests, persistence, or data collection.
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.site-nav');
function closeMenu() {
  if (!menuButton || !menu) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.textContent = 'Menu';
  menu.classList.remove('is-open');
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? 'Close' : 'Menu';
  menu.classList.toggle('is-open', open);
});
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.classList.contains('is-open')) {
    closeMenu();
    menuButton.focus();
  }
});
matchMedia('(min-width: 801px)').addEventListener('change', closeMenu);

const dialog = document.querySelector('.lightbox');
document.querySelectorAll('[data-compare]').forEach(button => button.addEventListener('click', () => {
  const preview = document.querySelector('.comparison-image');
  const image = preview.querySelector('img');
  const state = button.dataset.compare === 'before' ? 'before' : 'after';
  image.src = `assets/${button.dataset.compare}.webp`;
  image.srcset = `assets/${button.dataset.compare}-768.webp 768w, assets/${button.dataset.compare}.webp 1536w`;
  image.alt = `Illustrative kitchen ${state} refurbishment`;
  preview.dataset.preview = `Illustrative kitchen ${state} refurbishment. AI-generated, not a completed client project.`;
  document.querySelectorAll('[data-compare]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
}));
document.querySelectorAll('[data-preview]').forEach(button => {
  button.addEventListener('click', () => {
    const source = button.querySelector('img');
    const target = dialog.querySelector('img');
    target.src = source.src;
    target.alt = source.alt;
    dialog.querySelector('.lightbox-caption').textContent = button.dataset.preview;
    dialog.showModal();
  });
});
dialog?.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', event => {
  if (event.target === dialog) {
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  }
});

document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
  const select = document.querySelector('[name="project"]');
  if (select && [...select.options].some(option => option.value === link.dataset.service)) select.value = link.dataset.service;
}));
document.querySelector('.enquiry-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const status = event.currentTarget.querySelector('.form-status');
  status.textContent = 'Preview complete. On the finished website, this would send your project enquiry. Nothing has been sent or saved.';
  status.tabIndex = -1;
  status.focus();
});
