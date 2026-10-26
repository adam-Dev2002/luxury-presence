/* Shared visitor interactions for the two cinematic homepage concepts. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const officialContact = 'https://marcimetzger.com/#63878283-d93b-46db-8daa-d8cb1389f2ab';
  const header = $('header');
  const menuToggle = $('[data-menu-toggle]');
  const menu = $('#mobile-menu');
  const main = $('main');
  const footer = $('footer');

  function closeMenu(restoreFocus = false) {
    if (!menu || !menuToggle) return;
    menu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    document.body.classList.remove('menu-open');
    if (main) main.inert = false;
    if (footer) footer.inert = false;
    if (restoreFocus) menuToggle.focus();
  }

  menuToggle?.addEventListener('click', () => {
    if (menuToggle.getAttribute('aria-expanded') === 'true') {
      closeMenu(true);
      return;
    }
    menu.hidden = false;
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close navigation');
    document.body.classList.add('menu-open');
    if (main) main.inert = true;
    if (footer) footer.inert = true;
    $('a', menu)?.focus();
  });

  $$('a', menu || document.createElement('nav')).forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
      const target = link.hash ? $(link.hash) : null;
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });

  $$('a[href]', header || document.createElement('header')).forEach(link => {
    link.addEventListener('click', () => {
      if (menu && !menu.hidden) closeMenu();
    });
  });

  document.addEventListener('keydown', event => {
    if (!menu || menu.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
    }
    if (event.key !== 'Tab') return;
    const focusable = [menuToggle, ...$$('a[href], button:not([disabled])', menu)];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (menu && !menu.hidden && window.getComputedStyle(menuToggle).display === 'none') closeMenu();
  }, { passive: true });

  function updateHeader() {
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const frames = $$('[data-hero-frame]');
  const motionButtons = $$('[data-motion-toggle]');
  const entranceAnimations = new Set();
  let activeFrame = 0;
  let motionPaused = motionPreference.matches;
  let frameTimer;

  function scheduleFrames() {
    window.clearInterval(frameTimer);
    if (motionPaused || document.hidden || frames.length < 2) return;
    frameTimer = window.setInterval(() => {
      frames[activeFrame].classList.remove('is-active');
      activeFrame = (activeFrame + 1) % frames.length;
      frames[activeFrame].classList.add('is-active');
    }, 6500);
  }

  function setMotion(paused) {
    motionPaused = paused;
    root.classList.toggle('motion-paused', paused);
    root.classList.toggle('motion-enabled', !paused);
    motionButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', paused ? 'Play decorative motion' : 'Pause decorative motion');
      const label = $('[data-motion-label]', button);
      if (label) label.textContent = paused ? 'Play motion' : 'Pause motion';
      else button.textContent = paused ? 'Play motion' : 'Pause motion';
      const icon = $('[aria-hidden="true"]', button);
      if (icon) icon.textContent = paused ? '▶' : 'Ⅱ';
    });
    if (paused) {
      entranceAnimations.forEach(animation => animation.finish());
      entranceAnimations.clear();
    }
    scheduleFrames();
  }

  motionButtons.forEach(button => button.addEventListener('click', () => setMotion(!motionPaused)));
  motionPreference.addEventListener('change', event => setMotion(event.matches));
  document.addEventListener('visibilitychange', scheduleFrames);
  setMotion(motionPaused);

  // Content stays visible without JavaScript and if animation support is unavailable.
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        revealObserver.unobserve(entry.target);
        if (motionPaused || typeof entry.target.animate !== 'function') return;
        const animation = entry.target.animate([
          { opacity: 0, transform: 'translateY(22px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 650, easing: 'cubic-bezier(.2,.65,.3,1)' });
        entranceAnimations.add(animation);
        animation.onfinish = () => entranceAnimations.delete(animation);
      });
    }, { threshold: 0.08 });
    $$('[data-reveal]').forEach(element => revealObserver.observe(element));
  }

  const galleryItems = $$('[data-gallery-item]');
  const galleryDialog = $('#gallery-dialog');
  const galleryImage = $('[data-gallery-image]');
  const galleryCaption = $('[data-gallery-caption]');
  let galleryIndex = 0;
  let galleryTrigger;

  function showGalleryImage(index) {
    galleryIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[galleryIndex];
    const image = $('img', item);
    galleryImage.src = image.currentSrc || image.src;
    galleryImage.alt = image.alt;
    const caption = (item.dataset.caption || image.alt).replace(/^\d+\s*\/\s*/, '');
    galleryCaption.textContent = `${galleryIndex + 1} / ${galleryItems.length} — ${caption}`;
  }

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      if (!galleryDialog || !galleryImage || !galleryCaption) return;
      galleryTrigger = item;
      showGalleryImage(index);
      galleryDialog.showModal();
      document.body.classList.add('gallery-open');
      $('[data-gallery-close]', galleryDialog)?.focus();
    });
  });

  $('[data-gallery-close]')?.addEventListener('click', () => galleryDialog.close());
  $('[data-gallery-prev]')?.addEventListener('click', () => showGalleryImage(galleryIndex - 1));
  $('[data-gallery-next]')?.addEventListener('click', () => showGalleryImage(galleryIndex + 1));
  galleryDialog?.addEventListener('click', event => {
    if (event.target !== galleryDialog) return;
    const bounds = galleryDialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) galleryDialog.close();
  });
  galleryDialog?.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showGalleryImage(galleryIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  galleryDialog?.addEventListener('close', () => {
    document.body.classList.remove('gallery-open');
    galleryTrigger?.focus();
    galleryImage.removeAttribute('src');
  });

  const searchForm = $('[data-search-form]');
  const contactForm = $('[data-contact-form]');
  const formStatus = $('[data-form-status]');
  const inquiryResult = $('#inquiry-result');
  const inquiryPreview = $('#inquiry-preview');
  let previousSearchBlock = '';

  function fieldValue(form, name) {
    return String(form.elements.namedItem(name)?.value || '').trim();
  }

  function validatePriceRange() {
    if (!searchForm) return;
    const minimum = Number(fieldValue(searchForm, 'minPrice'));
    const maximum = Number(fieldValue(searchForm, 'maxPrice'));
    searchForm.elements.namedItem('maxPrice')?.setCustomValidity(
      maximum && minimum && maximum < minimum ? 'Enter a maximum price at least as high as the minimum.' : ''
    );
  }

  ['minPrice', 'maxPrice'].forEach(name => {
    searchForm?.elements.namedItem(name)?.addEventListener('input', validatePriceRange);
  });

  searchForm?.addEventListener('submit', event => {
    event.preventDefault();
    validatePriceRange();
    if (!searchForm.reportValidity() || !contactForm) return;
    const money = value => value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value)) : 'Any';
    const preferences = [
      'Hi Marci, I would like help finding a property.',
      '',
      `Location: ${fieldValue(searchForm, 'location') || 'Open to suggestions'}`,
      `Property type: ${fieldValue(searchForm, 'type') || 'Any'}`,
      `Bedrooms: ${fieldValue(searchForm, 'bedrooms') || 'Any'}`,
      `Bathrooms: ${fieldValue(searchForm, 'baths') || 'Any'}`,
      `Minimum price: ${money(fieldValue(searchForm, 'minPrice'))}`,
      `Maximum price: ${money(fieldValue(searchForm, 'maxPrice'))}`,
      `Preferred order: ${fieldValue(searchForm, 'sort') || 'Newest'}`
    ].join('\n');
    const message = contactForm.elements.namedItem('message');
    // Keep anything the visitor has already written when they adjust preferences.
    const existing = message.value;
    const nextSearchBlock = '--- My home search ---\n' + preferences;
    message.value = previousSearchBlock && existing.includes(previousSearchBlock)
      ? existing.replace(previousSearchBlock, nextSearchBlock)
      : (existing.trim() ? existing.trimEnd() + '\n\n' : '') + nextSearchBlock;
    previousSearchBlock = nextSearchBlock;
    if (formStatus) formStatus.textContent = 'Your home preferences are below. Add your contact details, then review your message.';
    const contact = $('#contact');
    contact?.scrollIntoView({ behavior: motionPaused ? 'instant' : 'smooth', block: 'start' });
    contactForm.elements.namedItem('name')?.focus({ preventScroll: true });
    if (inquiryResult) inquiryResult.hidden = true;
  });

  contactForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    const name = fieldValue(contactForm, 'name');
    const email = fieldValue(contactForm, 'email');
    const message = fieldValue(contactForm, 'message');
    if (!name || !message) {
      if (formStatus) formStatus.textContent = 'Please enter your name and a message so Marci can help.';
      contactForm.elements.namedItem(!name ? 'name' : 'message')?.focus();
      return;
    }
    inquiryPreview.value = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    inquiryResult.hidden = false;
    $$('a', inquiryResult).forEach(link => { link.href = officialContact; });
    if (formStatus) formStatus.textContent = 'Your message is ready to review. Copy it below, then send it using the official contact form.';
    inquiryResult.focus({ preventScroll: true });
    inquiryResult.scrollIntoView({ behavior: motionPaused ? 'instant' : 'smooth', block: 'nearest' });
  });

  contactForm?.addEventListener('input', () => {
    if (!inquiryResult || inquiryResult.hidden) return;
    inquiryResult.hidden = true;
    const copyStatus = $('[data-copy-status]');
    if (copyStatus) copyStatus.textContent = '';
    if (formStatus) formStatus.textContent = 'Your message changed. Review it again before copying.';
  });

  $('[data-copy-inquiry]')?.addEventListener('click', async () => {
    const status = $('[data-copy-status]');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(inquiryPreview.value);
      if (status) status.textContent = 'Copied. Open Marci’s official contact form and paste your message to send it.';
    } catch {
      inquiryPreview.focus();
      inquiryPreview.select();
      if (status) status.textContent = 'Your message is selected. Choose Copy, then paste it into Marci’s official contact form.';
    }
  });

  // Direct links remain available even if scripting is disabled.
  $$('[data-official-contact]').forEach(link => { link.href = officialContact; });
})();
