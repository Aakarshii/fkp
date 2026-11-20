(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mq = window.matchMedia('(max-width: 959px)');
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  var dds = [].slice.call(document.querySelectorAll('.dd'));

  function closeAll(except) {
    dds.forEach(function (d) {
      if (d !== except) {
        d.classList.remove('open');
        d.querySelector('button').setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  dds.forEach(function (d) {
    var b = d.querySelector('button');
    b.addEventListener('click', function (e) {
      if (mq.matches) return;
      var open = !d.classList.contains('open');
      closeAll(d);
      d.classList.toggle('open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      e.stopPropagation();
    });
  });

  document.addEventListener('click', function () { closeAll(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeAll();
    if (header.classList.contains('open')) {
      header.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });

  // Reveal on scroll (CSS disables the effect for reduced motion)
  var items = [].slice.call(document.querySelectorAll('.reveal'));
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  }

  // Aurora: eases toward the pointer, drifts with scroll
  var aur = document.querySelectorAll('.aurora');
  if (aur.length && !reduce) {
    var tx = 0, ty = 0, cx = 0, cy = 0, sy = 0, raf = null;
    var fine = window.matchMedia('(pointer: fine)').matches;
    if (fine) {
      window.addEventListener('pointermove', function (e) {
        tx = (e.clientX / window.innerWidth) * 2 - 1;
        ty = (e.clientY / window.innerHeight) * 2 - 1;
        kick();
      }, { passive: true });
    }
    window.addEventListener('scroll', function () { sy = window.scrollY; kick(); }, { passive: true });
    function kick() { if (!raf) raf = requestAnimationFrame(step); }
    function step() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      aur.forEach(function (el) {
        el.style.setProperty('--mx', cx.toFixed(3));
        el.style.setProperty('--my', cy.toFixed(3));
        el.style.setProperty('--sy', Math.min(sy, 1200).toFixed(0));
      });
      raf = (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) ? requestAnimationFrame(step) : null;
    }
  }

  // Count-up for the headline figures (final value is already in the HTML)
  var nums = [].slice.call(document.querySelectorAll('[data-count]'));
  nums.forEach(function (el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    if (reduce || !('IntersectionObserver' in window) || isNaN(end)) return;
    el.textContent = '0';
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        seen.unobserve(el);
        var start = null, dur = 1400;
        function tick(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * eased);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    seen.observe(el);
  });

  // Contact form: opens the visitor's email app addressed to the project
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['name', 'email', 'message'].forEach(function (id) {
        var input = document.getElementById(id);
        var field = input.closest('.field');
        var bad = !input.value.trim() || (id === 'email' && !/^\S+@\S+\.\S+$/.test(input.value.trim()));
        field.classList.toggle('invalid', bad);
        input.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad && ok) { input.focus(); }
        if (bad) ok = false;
      });
      if (!ok) { status.textContent = 'Please correct the highlighted fields.'; return; }
      var to = form.getAttribute('data-to');
      var subject = 'Message from ' + document.getElementById('name').value.trim();
      var body = document.getElementById('message').value.trim() +
        '\n\n' + document.getElementById('name').value.trim() +
        '\n' + document.getElementById('email').value.trim();
      status.textContent = 'Your email app should now open with your message. If it does not, write to ' + to + '.';
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }
})();
