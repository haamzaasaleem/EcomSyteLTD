/* ============================================================
   ECOMSYTE LTD — homepage scripts
   ============================================================ */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- LOADER ---------- */
  var loader = document.getElementById('loader');

  function endLoader() {
    if (!loader) return;
    loader.classList.add('done');
    document.body.classList.remove('is-loading');
    startReveals();
    setTimeout(function () { if (loader && loader.parentNode) loader.parentNode.removeChild(loader); }, 700);
  }

  if (!loader) {
    // inner pages: no loader — start reveals right away
    document.addEventListener('DOMContentLoaded', startReveals);
    if (document.readyState !== 'loading') startReveals();
  } else if (reduced) {
    document.body.classList.add('is-loading');
    // no animation — clear immediately
    endLoader();
  } else {
    document.body.classList.add('is-loading');
    loader.classList.add('play');
    // reveal the logo partway through the chip drops
    setTimeout(function () { loader.classList.add('reveal'); }, 950);
    // finish once the fill bar completes (or on window load, whichever is later, capped)
    var minDone = 3000;
    var start = Date.now();
    window.addEventListener('load', function () {
      var wait = Math.max(0, minDone - (Date.now() - start));
      setTimeout(endLoader, wait);
    });
    // hard fallback so it never hangs
    setTimeout(endLoader, 3800);
  }

  /* ---------- HEADER scroll state ---------- */
  var header = document.getElementById('header');
  function onScroll() {
    if (window.scrollY > 20) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- MOBILE NAV ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  });
  // close on link tap
  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
  // mobile dropdown toggle
  var dropBtn = document.querySelector('.nav__dropbtn');
  if (dropBtn) {
    dropBtn.addEventListener('click', function () {
      if (window.innerWidth <= 860) {
        dropBtn.parentElement.classList.toggle('open');
      }
    });
  }

  /* ---------- SCROLL REVEAL + COUNTERS ---------- */
  var revealEls = [];
  function markReveals() {
    // text blocks: simple fade-up
    document.querySelectorAll(
      '.section__head, .why__copy, .why__list li, .contact__copy, .stat'
    ).forEach(function (el) { el.classList.add('reveal-up'); revealEls.push(el); });
    // cards: 3D lift-off from flat (marketplaces, steps, form) — NOT the pillars (they fly in)
    document.querySelectorAll(
      '.market, .step, .contact__form, .result-card, .deliver__item, .split__copy, .split__media'
    ).forEach(function (el) { el.classList.add('reveal-3d'); revealEls.push(el); });
  }
  markReveals();

  // stagger cards within each group so they lift in sequence, not all at once
  function staggerGroup(selector) {
    document.querySelectorAll(selector).forEach(function (group) {
      group.querySelectorAll('.reveal-3d').forEach(function (card, i) {
        card.dataset.delay = (i * 90);
      });
    });
  }
  staggerGroup('.markets'); staggerGroup('.steps'); staggerGroup('.results-grid'); staggerGroup('.deliver');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        var d = parseInt(e.target.dataset.delay || 0, 10);
        var el = e.target;
        setTimeout(function () { el.classList.add('in'); }, d);
        if (el.classList.contains('stat')) runCounter(el);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.15 });

  function startReveals() { revealEls.forEach(function (el) { io.observe(el); }); }
  // if reduced motion, reveals are already visible via CSS; still run counters
  if (reduced) document.querySelectorAll('.stat').forEach(runCounter);

  /* ---------- DRAMATIC SERVICES FLY-IN (sequenced) ---------- */
  var pillarsWrap = document.querySelector('.pillars-wrap');
  var flyCards = Array.prototype.slice.call(document.querySelectorAll('.fly'));
  if (pillarsWrap && flyCards.length) {
    if (reduced) {
      flyCards.forEach(function (c) { c.classList.add('in'); });
      var t0 = document.querySelector('.pillars-thread'); if (t0) t0.classList.add('draw');
    } else {
      var flyIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          flyIO.unobserve(e.target);
          // draw the connector thread first, then land cards one-by-one along it
          var thread = document.querySelector('.pillars-thread');
          if (thread) thread.classList.add('draw');
          flyCards
            .sort(function (a, b) { return a.dataset.seq - b.dataset.seq; })
            .forEach(function (card) {
              var seq = parseInt(card.dataset.seq, 10);
              setTimeout(function () { card.classList.add('in'); }, 250 + seq * 480);
            });
        });
      }, { threshold: 0.25 });
      flyIO.observe(pillarsWrap);
    }
  }

  function runCounter(stat) {
    var strong = stat.querySelector('strong[data-count]');
    if (!strong || strong.dataset.done) return;
    strong.dataset.done = '1';
    var target = parseInt(strong.dataset.count, 10);
    var suffix = strong.dataset.suffix || '';
    if (reduced) { strong.textContent = target + suffix; return; }
    var dur = 1400, t0 = null;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      strong.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- #12 BACKGROUND DEPTH PARALLAX ---------- */
  var pfx = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  if (pfx.length && !reduced) {
    var ticking = false;
    function updateParallax() {
      var vh = window.innerHeight;
      pfx.forEach(function (el) {
        var r = el.getBoundingClientRect();
        // how far the element's centre is from the viewport centre
        var offset = (r.top + r.height / 2) - vh / 2;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.15;
        el.style.transform = 'translate3d(0,' + (-offset * speed) + 'px,0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
    }, { passive: true });
    updateParallax();
  }

  /* ---------- HERO HUB — mouse parallax 3D ---------- */
  var hub = document.getElementById('hub');
  var heroVisual = document.getElementById('heroVisual');
  if (hub && heroVisual && !reduced && window.matchMedia('(pointer:fine)').matches) {
    var nodes = hub.querySelectorAll('[data-depth]');
    var tx = 0, ty = 0, cx = 0, cy = 0;
    heroVisual.addEventListener('mousemove', function (e) {
      var r = heroVisual.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
    });
    heroVisual.addEventListener('mouseleave', function () { tx = 0; ty = 0; });
    (function loop() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      hub.style.transform = 'rotateY(' + (cx * 16) + 'deg) rotateX(' + (-cy * 16) + 'deg)';
      nodes.forEach(function (n) {
        var d = parseFloat(n.getAttribute('data-depth')) || 0.5;
        n.style.transform = 'translateZ(' + (d * 60) + 'px) translate(' + (cx * d * 26) + 'px,' + (cy * d * 26) + 'px)';
      });
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- LIGHT 3D TILT (cards) ---------- */
  if (!reduced && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      var max = 10; // degrees
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          'perspective(800px) rotateX(' + (-py * max) + 'deg) rotateY(' + (px * max) + 'deg) translateY(-8px) scale(1.02)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- DEMO FORM ---------- */
  var form = document.getElementById('auditForm');
  var note = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      note.textContent = 'Thanks. This is a demo, so nothing was sent. We\'ll wire this up when the site goes live.';
      note.style.color = '#1a7f4f';
      form.querySelector('button').textContent = 'Request received (demo)';
    });
  }

  /* ---------- NEWSLETTER POPUP (40% scroll, once) ---------- */
  var nlOverlay = document.getElementById('nlOverlay');
  if (nlOverlay) {
    var STORAGE_KEY = 'ecomsyte_nl_seen';
    var seen = false;
    try { seen = localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) {}

    function markSeen() { try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {} }
    function openNL() {
      nlOverlay.classList.add('open');
      nlOverlay.setAttribute('aria-hidden', 'false');
      markSeen();
    }
    function closeNL() {
      nlOverlay.classList.remove('open');
      nlOverlay.setAttribute('aria-hidden', 'true');
    }

    if (!seen) {
      var nlFired = false;
      var onScrollNL = function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (!nlFired && max > 0 && (window.scrollY / max) >= 0.4) {
          nlFired = true;
          openNL();
          window.removeEventListener('scroll', onScrollNL);
        }
      };
      window.addEventListener('scroll', onScrollNL, { passive: true });
    }

    var nlClose = document.getElementById('nlClose');
    if (nlClose) nlClose.addEventListener('click', closeNL);
    nlOverlay.addEventListener('click', function (e) { if (e.target === nlOverlay) closeNL(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNL(); });

    var nlForm = document.getElementById('nlForm');
    if (nlForm) {
      nlForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!nlForm.checkValidity()) { nlForm.reportValidity(); return; }
        var note = document.getElementById('nlNote');
        note.textContent = 'Thanks for subscribing. This is a demo, so nothing was sent yet.';
        note.style.color = '#1a7f4f';
        nlForm.querySelector('button').textContent = 'Subscribed';
        document.getElementById('nlEmail').disabled = true;
        setTimeout(closeNL, 1600);
      });
    }
  }

  /* ---------- BACK TO TOP ---------- */
  var toTop = document.getElementById('toTop');
  if (toTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 500) toTop.classList.add('show');
      else toTop.classList.remove('show');
    }, { passive: true });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }
})();
