(function () {
  var d = document, root = d.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sticky header state
  var header = d.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile menu
  var panel = d.getElementById('mobile-menu');
  var openBtn = d.querySelector('.hamburger');
  if (panel && openBtn) {
    var closeBtn = panel.querySelector('.panel-close');
    var setOpen = function (open) {
      panel.classList.toggle('open', open);
      panel.inert = !open;
      panel.setAttribute('aria-hidden', String(!open));
      openBtn.setAttribute('aria-expanded', String(open));
      root.classList.toggle('menu-open', open);
      (open ? closeBtn : openBtn).focus();
    };
    openBtn.addEventListener('click', function () { setOpen(true); });
    closeBtn.addEventListener('click', function () { setOpen(false); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) setOpen(false);
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (e) {
      if (e.matches && panel.classList.contains('open')) setOpen(false);
    });
  }

  // Reveal on scroll
  var reveals = d.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduced) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '200px 0px' });
    reveals.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 1.15 && r.bottom > -200) el.classList.add('in');
      else io.observe(el);
    });
    setTimeout(function () { reveals.forEach(function (el) { el.classList.add('in'); }); }, 1200);
  }

  // Nexus hero diagram
  var nexus = d.querySelector('.nexus');
  if (nexus) {
    if (!('IntersectionObserver' in window)) nexus.classList.add('ready');
    else {
      var nio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { nexus.classList.add('ready'); nio.disconnect(); }
      }, { threshold: 0.2 });
      nio.observe(nexus);
    }
  }

  // Animated dot grid behind the hero (desktop only)
  var canvas = d.querySelector('.dot-canvas');
  if (canvas && window.innerWidth >= 769 && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var w, h, pts, raf = 0, visible = true;
    var resize = function () {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      var cols = Math.max(4, Math.floor(w / 90)), rows = Math.max(3, Math.floor(h / 90));
      pts = [];
      for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++)
        pts.push({ x: (i + 0.5) * (w / cols), y: (j + 0.5) * (h / rows), o: Math.random() * Math.PI * 2 });
      if (reduced) draw(0);
    };
    var draw = function (t) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0B2A4A';
      ctx.strokeStyle = '#0B2A4A';
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var dx = reduced ? 0 : Math.sin(t / 3000 + p.o) * 4;
        var dy = reduced ? 0 : Math.cos(t / 3500 + p.o) * 4;
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(p.x + dx, p.y + dy, 1.6, 0, Math.PI * 2); ctx.fill();
        var n = pts[i + 1];
        if (n && Math.abs(n.x - p.x) < 100) {
          ctx.globalAlpha = 0.25; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x + dx, p.y + dy); ctx.lineTo(n.x, n.y); ctx.stroke();
        }
      }
      if (!reduced && visible) raf = requestAnimationFrame(draw);
    };
    resize();
    draw(0);
    window.addEventListener('resize', resize);
    if (!reduced && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        cancelAnimationFrame(raf);
        if (visible) raf = requestAnimationFrame(draw);
      }).observe(canvas);
    }
  }

  // Contact form (Netlify Forms, AJAX with plain-POST fallback)
  var form = d.querySelector('form[name="yhteydenotto"]');
  if (form && window.fetch) {
    form.setAttribute('novalidate', '');
    var btn = form.querySelector('button[type="submit"]');
    var btnLabel = btn.innerHTML;
    var msg = form.querySelector('.form-msg');
    var done = d.querySelector('.form-done');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      [['nimi', function (v) { return v.trim(); }],
       ['sahkoposti', function (v) { return v.trim() && v.indexOf('@') > 0; }],
       ['viesti', function (v) { return v.trim(); }]].forEach(function (c) {
        var input = form.elements[c[0]];
        var valid = !!c[1](input.value);
        input.closest('.field').classList.toggle('error', !valid);
        input.setAttribute('aria-invalid', String(!valid));
        if (!valid && ok) { input.focus(); ok = false; }
      });
      if (!ok) return;
      msg.hidden = true;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Lähetetään…';
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error('send failed');
        form.hidden = true;
        done.hidden = false;
        done.focus();
      }).catch(function () {
        msg.hidden = false;
        btn.disabled = false;
        btn.innerHTML = btnLabel;
      });
    });
  }
})();
