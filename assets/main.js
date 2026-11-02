/* Riselist — motion and the live preview. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header + nav ---------- */
  var header = document.querySelector('.site-header');
  var darkBlocks = Array.prototype.slice.call(document.querySelectorAll('.on-ink, .site-footer'));
  var headerH = header ? header.offsetHeight : 76;
  var onScroll = function () {
    header.classList.toggle('scrolled', window.scrollY > 8);
    // Switch the header to its dark dress while a dark section sits underneath it
    var dark = false;
    for (var i = 0; i < darkBlocks.length; i++) {
      var r = darkBlocks[i].getBoundingClientRect();
      if (r.top < headerH * 0.6 && r.bottom > headerH * 0.6) { dark = true; break; }
    }
    header.classList.toggle('on-dark', dark);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { headerH = header.offsetHeight; onScroll(); });
  onScroll();

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ---------- Reveals ---------- */
  var revealEls = document.querySelectorAll('.reveal, .stagger');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // Hero load moment
  requestAnimationFrame(function () {
    document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
  });

  /* ---------- The rise chart (shared by hero and story) ---------- */
  function logistic(w, mid, k) { return 1 / (1 + Math.exp(-(w - mid) * k)); }
  function viewsK(w) { return 6 + 94 * logistic(w, 3.2, 1.1); }        // thousands of views
  function priceUsd(w) { return 120 + 1680 * logistic(w, 8.6, 1.0); }  // dollars per video
  var X0 = 30, X1 = 570, Y0 = 256, Y1 = 48;
  function x(w) { return X0 + (w / 12) * (X1 - X0); }
  function yV(w) { return Y0 - ((viewsK(w) - 6) / 94) * (Y0 - Y1); }
  function yP(w) { return Y0 - ((priceUsd(w) - 120) / 1680) * (Y0 - Y1); }
  function pathTo(fy, upto) {
    var steps = Math.max(1, Math.round(upto * 6)), d = '';
    for (var i = 0; i <= steps; i++) { var w = (upto * i) / steps; d += (i ? 'L' : 'M') + x(w).toFixed(1) + ' ' + fy(w).toFixed(1); }
    return d;
  }
  function fmtMoney(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

  function makeChart(svg, weekLabel) {
    var views = svg.querySelector('.views-path');
    var price = svg.querySelector('.price-path');
    var dot = svg.querySelector('.views-dot');
    var win = svg.querySelector('.window');
    var winLabel = svg.querySelector('.window-label');
    var wx0 = x(2.4), wx1 = x(6.4);
    win.setAttribute('x', wx0.toFixed(1));
    winLabel.setAttribute('x', ((wx0 + wx1) / 2).toFixed(1));
    return function draw(w) {
      w = Math.max(0, Math.min(12, w));
      views.setAttribute('d', pathTo(yV, w));
      price.setAttribute('d', pathTo(yP, w));
      dot.setAttribute('cx', x(w).toFixed(1));
      dot.setAttribute('cy', yV(w).toFixed(1));
      var winProgress = Math.max(0, Math.min(1, (x(w) - wx0) / (wx1 - wx0)));
      win.setAttribute('width', ((wx1 - wx0) * winProgress).toFixed(1));
      winLabel.setAttribute('opacity', winProgress.toFixed(2));
      if (weekLabel) weekLabel.textContent = 'Week ' + Math.round(w);
      return w;
    };
  }

  // Hero: draws itself once on load
  var heroSvg = document.getElementById('hero-svg');
  if (heroSvg) {
    var drawHero = makeChart(heroSvg, document.getElementById('hero-week'));
    if (reduce) { drawHero(12); }
    else {
      var t0 = null, D = 2600;
      var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
      var step = function (ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / D);
        drawHero(12 * ease(p));
        if (p < 1) requestAnimationFrame(step);
      };
      setTimeout(function () { requestAnimationFrame(step); }, 700);
    }
  }

  // Story: scrubbed by scroll (desktop) or a range input (mobile / reduced motion)
  var storySvg = document.getElementById('story-svg');
  if (storySvg) {
    var drawStory = makeChart(storySvg, document.getElementById('story-week'));
    var elViews = document.getElementById('st-views');
    var elPrice = document.getElementById('st-price');
    var elCpm = document.getElementById('st-cpm');
    var elVerdict = document.getElementById('st-verdict');
    var steps = Array.prototype.slice.call(document.querySelectorAll('.story-step'));
    var range = document.getElementById('story-range');

    function verdict(w) {
      if (w < 2) return 'Too early. Nobody knows them yet.';
      if (w < 6.5) return 'The window. Large views, small price. This is when we book.';
      if (w < 9.5) return 'Brands have noticed. The price is climbing fast.';
      return 'Everyone wants them now. Full price for the same views.';
    }
    function setWeek(w, activeIdx) {
      w = drawStory(w);
      var v = viewsK(w), p = priceUsd(w);
      elViews.textContent = Math.round(v) + 'K';
      elPrice.textContent = fmtMoney(Math.round(p / 10) * 10);
      elCpm.textContent = '$' + (p / v).toFixed(2);
      elVerdict.textContent = verdict(w);
      steps.forEach(function (s, i) {
        var on;
        if (typeof activeIdx === 'number') on = (i === activeIdx);
        else { var sw = parseFloat(s.getAttribute('data-week')); on = Math.abs(sw - w) < 1.75 || (sw === 0.5 && w < 1.2); }
        s.classList.toggle('active', on);
      });
    }
    setWeek(0);

    var mql = window.matchMedia('(min-width: 921px)');
    var stepsEl = document.getElementById('story-steps');
    var ticking = false;
    function onStoryScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        // The chart follows the step nearest the middle of the screen, and
        // glides between neighbouring steps, so the card always matches the words.
        var vh = window.innerHeight, mid = vh * 0.5;
        var pts = steps.map(function (s) {
          var r = s.getBoundingClientRect();
          return { c: r.top + r.height / 2, w: parseFloat(s.getAttribute('data-week')) };
        });
        var w, idx = 0;
        if (mid <= pts[0].c) {
          // Before the first step: ease in from week 0 as the block arrives
          var start = pts[0].c + vh * 0.5;
          var t = Math.max(0, Math.min(1, (start - mid) / (start - pts[0].c)));
          w = pts[0].w * (1 - t);
        } else if (mid >= pts[pts.length - 1].c) {
          w = pts[pts.length - 1].w; idx = pts.length - 1;
        } else {
          for (var i = 0; i < pts.length - 1; i++) {
            if (mid >= pts[i].c && mid < pts[i + 1].c) {
              var f = (mid - pts[i].c) / (pts[i + 1].c - pts[i].c);
              w = pts[i].w + (pts[i + 1].w - pts[i].w) * f;
              idx = f < 0.5 ? i : i + 1;
              break;
            }
          }
        }
        setWeek(w, idx);
      });
    }
    function bind() {
      if (mql.matches && !reduce) {
        window.addEventListener('scroll', onStoryScroll, { passive: true });
        onStoryScroll();
      } else {
        window.removeEventListener('scroll', onStoryScroll);
        if (range) setWeek(parseFloat(range.value));
      }
    }
    if (range) range.addEventListener('input', function () { setWeek(parseFloat(range.value)); });
    if (mql.addEventListener) mql.addEventListener('change', bind); else mql.addListener(bind);
    bind();
  }

  /* ---------- Demo (sample data, names hidden) ---------- */
  var cardsEl = document.getElementById('cards');
  if (cardsEl) {
    var CATS = [
      { id: 'skincare', label: 'Skincare and beauty', noun: 'skincare' },
      { id: 'tech', label: 'Tech and gadgets', noun: 'tech' },
      { id: 'fitness', label: 'Fitness', noun: 'fitness' },
      { id: 'fashion', label: 'Fashion', noun: 'fashion' },
      { id: 'food', label: 'Food and drink', noun: 'food' },
      { id: 'home', label: 'Home and living', noun: 'home' },
      { id: 'finance', label: 'Money and apps', noun: 'money' },
      { id: 'travel', label: 'Travel', noun: 'travel' }
    ];
    var GOALS = [{ id: 'sales', label: 'More sales' }, { id: 'awareness', label: 'Get noticed' }, { id: 'trend', label: 'Ride a trend' }];
    var SIZES = [
      { id: 'micro', label: '5k to 25k', min: 5000, max: 25000 },
      { id: 'mid', label: '25k to 100k', min: 25000, max: 100000 },
      { id: 'macro', label: '100k and up', min: 100000, max: 1e12 }
    ];
    var W = {
      sales: { reach: .25, trust: .20, eng: .10, sell: .30, steady: .15, spike: 0 },
      awareness: { reach: .40, trust: .15, eng: .20, sell: .05, steady: .20, spike: 0 },
      trend: { reach: .25, trust: .10, eng: .20, sell: .05, steady: .05, spike: .35 }
    };
    var state = { cat: 'skincare', goal: 'sales', size: 'micro' };
    var DATA = [];

    function clamp(n) { return Math.max(0, Math.min(1, n)); }
    function fmt(n) { if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace('.0', '') + 'K'; return String(Math.round(n)); }
    function mask(h) { return h.length <= 5 ? h.charAt(0) + '•••' : h.slice(0, 2) + '•••' + h.slice(-2); }
    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

    function rank() {
      var cat = CATS.filter(function (c) { return c.id === state.cat; })[0];
      var size = SIZES.filter(function (s) { return s.id === state.size; })[0];
      var w = W[state.goal];
      return DATA.filter(function (c) { return c.n === cat.id; }).map(function (c) {
        var parts = {
          reach: clamp((c.v - 0.3) / 3.2), trust: clamp(1 - c.a / 30), eng: clamp(c.e / 12),
          sell: c.s && c.z ? 1 : (c.s || c.z ? 0.7 : 0), steady: clamp(c.k), spike: clamp((c.t / Math.max(c.m, 1) - 1) / 3)
        };
        var score = 0; for (var k in w) score += w[k] * parts[k];
        var inSize = c.f >= size.min && c.f < size.max;
        if (!inSize) score -= 0.12;
        return { c: c, score: score, inSize: inSize, parts: parts };
      }).sort(function (a, b) { return b.score - a.score; }).slice(0, 5);
    }

    function cardHtml(p, idx) {
      var c = p.c;
      var reasons = [];
      if (c.g != null && c.g >= 25) reasons.push('views up ' + Math.round(c.g) + '% in four weeks');
      if (state.goal === 'sales' && (c.s || c.z)) reasons.push(c.s ? 'already sells through a TikTok Shop' : 'runs a storefront');
      if (state.goal === 'trend' && p.parts.spike > 0.3) reasons.push('latest hit got ' + (c.t / c.m).toFixed(1) + '× their usual views');
      if (c.a < 8) reasons.push('almost never posts ads');
      if (c.e >= 10.5) reasons.push('audience engages well above average');
      if (p.inSize) reasons.push('right in your size range');
      if (reasons.length < 2) reasons.push('steady views, video after video');
      var tags = [];
      if ((c.g != null && c.g >= 25) || c.v >= 1.8) tags.push('<span class="tag hi">Rising</span>');
      if (c.a < 8) tags.push('<span class="tag">Rarely posts ads</span>');
      if (c.s) tags.push('<span class="tag">TikTok Shop</span>');
      if (c.z) tags.push('<span class="tag">Storefront</span>');
      var match = Math.min(98, Math.round(55 + clamp(p.score) * 43));
      var why = reasons.slice(0, 2).join(', ');
      why = why.charAt(0).toUpperCase() + why.slice(1) + '.';
      return '<article class="card" data-key="' + esc(c.h) + '">' +
        '<div class="top"><div class="who"><div class="avatar" aria-hidden="true">' + esc(c.h.charAt(0).toUpperCase()) + '</div>' +
        '<div><div class="handle">@' + esc(mask(c.h)) + '</div><div class="sub">' + fmt(c.f) + ' followers</div></div></div>' +
        '<div class="match"><b>' + match + '%</b><span>match</span></div></div>' +
        '<div class="vel">' + c.v.toFixed(1) + '×<small>views for every follower</small></div>' +
        '<div class="tags">' + tags.join('') + '</div>' +
        '<div class="row3"><div><span>Usual views</span><b>' + fmt(c.m) + '</b></div><div><span>Engagement</span><b>' + c.e.toFixed(1) + '%</b></div><div><span>Ads</span><b>' + Math.round(c.a) + '%</b></div></div>' +
        '<p class="why"><b>Why.</b> ' + esc(why) + '</p></article>';
    }

    function render(animate) {
      var top = rank();
      var cat = CATS.filter(function (c) { return c.id === state.cat; })[0];
      var goalTxt = state.goal === 'sales' ? 'more sales' : state.goal === 'awareness' ? 'getting noticed' : 'riding a trend';
      document.getElementById('demo-summary').textContent = 'Top ' + cat.noun + ' creators for ' + goalTxt + ', ranked by fit.';

      // FLIP: record old positions
      var first = {};
      if (animate && !reduce) {
        cardsEl.querySelectorAll('.card[data-key]').forEach(function (el) { first[el.getAttribute('data-key')] = el.getBoundingClientRect(); });
      }
      cardsEl.innerHTML = top.map(cardHtml).join('') +
        '<a class="card more" href="#book"><p class="ttl">More ' + esc(cat.noun) + ' creators fit your brief.</p>' +
        '<p class="muted small">Get the full list with names, contacts, their best recent videos and a pitch for each.</p>' +
        '<span class="btn btn-primary">Get my full list</span></a>';
      if (animate && !reduce) {
        cardsEl.querySelectorAll('.card[data-key]').forEach(function (el) {
          var key = el.getAttribute('data-key'), last = el.getBoundingClientRect(), f = first[key];
          if (f) {
            var dx = f.left - last.left, dy = f.top - last.top;
            if (dx || dy) {
              el.style.transition = 'none'; el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
              requestAnimationFrame(function () { el.style.transition = ''; el.style.transform = ''; });
            }
          } else {
            el.style.transition = 'none'; el.style.opacity = '0'; el.style.transform = 'translateY(12px)';
            requestAnimationFrame(function () { el.style.transition = ''; el.style.opacity = ''; el.style.transform = ''; });
          }
        });
      }
    }

    function chips(containerId, items, key, cls) {
      var el = document.getElementById(containerId);
      el.innerHTML = items.map(function (it) {
        return '<button type="button" class="chip" data-id="' + esc(it.id) + '" aria-pressed="' + (state[key] === it.id) + '">' + esc(it.label) + '</button>';
      }).join('');
      el.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-id]'); if (!b) return;
        state[key] = b.getAttribute('data-id');
        el.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        render(true);
      });
    }

    fetch('/assets/creators.json').then(function (r) { return r.json(); }).then(function (rows) {
      DATA = rows;
      var have = {}; rows.forEach(function (r) { have[r.n] = true; });
      var cats = CATS.filter(function (c) { return have[c.id]; });
      if (!have[state.cat] && cats.length) state.cat = cats[0].id;
      chips('cats', cats, 'cat');
      chips('goals', GOALS, 'goal');
      chips('sizes', SIZES, 'size');
      render(false);
    }).catch(function () {
      cardsEl.innerHTML = '<p class="muted">The preview could not load. <a href="#book">Book a call</a> and we will walk you through it.</p>';
    });
  }
})();
