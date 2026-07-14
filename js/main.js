/* Aktiva Steuerberatung, interaction layer.
   Motion honors prefers-reduced-motion: everything degrades to static. */
(function () {
  'use strict';

  // Contact form relay. Swap this endpoint to change the form backend.
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/office@aktiva-steuerberatung.at';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- footer year --------------------------------------------------- */
  var yearEl = document.getElementById('jahr');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* ---- mobile menu ---------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var body = document.body;

  function closeMenu() {
    body.classList.remove('menu-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Menü öffnen');
    }
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    });
    document.querySelectorAll('.mobile-menu a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });
  }

  /* ---- hero video: pause offscreen, respect reduced motion ------------- */
  var heroVideo = document.querySelector('.hero-media video');
  if (heroVideo) {
    if (reduceMotion) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
    } else if ('IntersectionObserver' in window) {
      var videoObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            heroVideo.play().catch(function () {});
          } else {
            heroVideo.pause();
          }
        });
      }, { threshold: 0.1 });
      videoObserver.observe(heroVideo);
    }
  }

  /* ---- contact form ----------------------------------------------------- */
  var form = document.getElementById('kontaktformular');
  if (form) {
    var status = form.querySelector('.form-status');
    var submitBtn = form.querySelector('button[type="submit"]');
    var defaultLabel = submitBtn ? submitBtn.textContent : '';

    form.addEventListener('submit', function (event) {
      if (!window.fetch) {
        return; // no fetch: let the browser POST to formsubmit.co directly
      }
      event.preventDefault();

      var honey = form.querySelector('input[name="_honey"]');
      if (honey && honey.value) {
        return;
      }

      status.className = 'form-status';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Wird gesendet ...';

      var payload = {
        name: form.querySelector('#f-name').value,
        email: form.querySelector('#f-email').value,
        telefon: form.querySelector('#f-phone').value,
        nachricht: form.querySelector('#f-message').value,
        _subject: 'Neue Anfrage über aktiva-steuerberatung.at'
      };

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('HTTP ' + response.status);
          }
          return response.json();
        })
        .then(function () {
          status.textContent = 'Vielen Dank für Ihre Nachricht. Wir melden uns umgehend bei Ihnen.';
          status.classList.add('is-success');
          form.reset();
        })
        .catch(function () {
          status.textContent = 'Die Nachricht konnte nicht gesendet werden. Bitte rufen Sie uns an oder schreiben Sie an office@aktiva-steuerberatung.at.';
          status.classList.add('is-error');
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = defaultLabel;
        });
    });
  }

  /* ---- motion (GSAP) ------------------------------------------------------ */
  var header = document.querySelector('.site-header');

  if (reduceMotion || typeof gsap === 'undefined') {
    // static fallback: show everything, solid nav
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    if (header) {
      header.classList.add('is-scrolled');
    }
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('gsap-ready');

  // nav: solidify once the page is scrolled
  ScrollTrigger.create({
    start: 24,
    onEnter: function () { header.classList.add('is-scrolled'); },
    onLeaveBack: function () { header.classList.remove('is-scrolled'); }
  });

  // hero entrance: masked lines rise, the gold underline draws itself
  var underline = document.querySelector('.accent-underline path');
  var underlineLen = underline ? underline.getTotalLength() : 0;
  if (underline) {
    underline.style.strokeDasharray = underlineLen;
    underline.style.strokeDashoffset = underlineLen;
  }

  var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .from('.hero h1 .h1-inner', { yPercent: 115, duration: 1.0, stagger: 0.14 })
    .from('[data-hero="lede"]', { y: 28, opacity: 0, duration: 0.7 }, '-=0.55')
    .from('[data-hero="actions"]', { y: 22, opacity: 0, duration: 0.6 }, '-=0.45')
    .from('[data-hero="media"]', { y: 34, opacity: 0, scale: 0.985, duration: 0.9 }, '-=0.7');
  if (underline) {
    heroTl.to(underline, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, '-=0.6');
  }

  // sticky mobile booking bar: appears once the hero CTA scrolled away
  var mobileCta = document.querySelector('.mobile-cta');
  if (mobileCta) {
    ScrollTrigger.create({
      trigger: '.value-band',
      start: 'top 60%',
      onEnter: function () { mobileCta.classList.add('is-visible'); },
      onLeaveBack: function () { mobileCta.classList.remove('is-visible'); }
    });
  }

  // scroll reveals: content enters as it becomes relevant
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    gsap.fromTo(
      el,
      { y: 28, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 86%',
          once: true
        }
      }
    );
  });

  // interlude arcs draw with scroll (storytelling: the upward line = relief)
  gsap.utils.toArray('.arc-draw').forEach(function (path, index) {
    var length = path.getTotalLength();
    gsap.fromTo(
      path,
      { strokeDasharray: length, strokeDashoffset: length },
      {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '.interlude',
          start: 'top 80%',
          end: 'bottom 45%',
          scrub: 0.6 + index * 0.2
        }
      }
    );
  });

  // team photo: gentle parallax inside its frame
  // scale stays at 1.05: any higher crops the two outer people out of view
  gsap.fromTo(
    '.about-media img',
    { yPercent: -2, scale: 1.05 },
    {
      yPercent: 2,
      scale: 1.05,
      ease: 'none',
      scrollTrigger: {
        trigger: '.about-media',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    }
  );
})();
