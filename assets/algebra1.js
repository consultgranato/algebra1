/* Algebra 1 — Niles North High School, D219
   Shared enhancement layer, loaded last on every page.

   Everything here is additive. Unit pages keep their own notes, vocabulary and
   question banks; this file replaces the per-page copies of the shared plumbing
   (answer matching, shuffling) and layers on progress tracking, accessibility
   and the small quality-of-life features. Loading it after the inline script
   means the definitions below win. */
(function () {
  'use strict';

  var W = window;

  /* ==================================================================
     1. Answer matching
     ------------------------------------------------------------------
     The old per-unit matcher compared normalised strings, so a student
     who wrote a mathematically correct answer in a different shape was
     marked wrong. This engine accepts equivalent forms while still
     rejecting genuinely different (or unsimplified) answers.
     ================================================================== */

  var SUPER = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
    '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
    '⁺': '+', '⁻': '-'
  };

  /* x² -> x^(2), x¹² -> x^(12), x⁻³ -> x^(-3) */
  function unSuper(s) {
    return s.replace(/[⁰¹²³⁴-⁹⁺⁻]+/g, function (run) {
      var out = '';
      for (var i = 0; i < run.length; i++) out += SUPER[run.charAt(i)] || '';
      return out ? '^(' + out + ')' : '';
    });
  }

  /* Strip markup/entities and fold the many ways of typing an operator
     down to plain ASCII. */
  function clean(s) {
    s = String(s == null ? '' : s);
    s = s.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '');
    s = s.replace(/&minus;/gi, '-').replace(/&times;/gi, '*').replace(/&divide;/gi, '/')
      .replace(/&middot;/gi, '*').replace(/&sdot;/gi, '*').replace(/&nbsp;/gi, ' ')
      .replace(/&le;/gi, '<=').replace(/&ge;/gi, '>=').replace(/&ne;/gi, '!=')
      .replace(/&sup1;/gi, '^1').replace(/&sup2;/gi, '^2').replace(/&sup3;/gi, '^3')
      .replace(/&frasl;/gi, '/').replace(/&amp;/gi, '&');
    s = s.replace(/&#(\d+);/g, function (_, d) {
      var n = parseInt(d, 10);
      return (n > 0 && n < 0x10000) ? String.fromCharCode(n) : ' ';
    });
    s = unSuper(s);
    s = s.replace(/[−–—]/g, '-')
      .replace(/[×⋅·∙]/g, '*')
      .replace(/÷/g, '/')
      .replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/≠/g, '!=')
      .replace(/∞/g, 'inf')
      .replace(/∪/g, ',')
      .replace(/[‘’“”]/g, '');
    return s.toLowerCase();
  }

  /* Canonical text form: no whitespace, ASCII operators, implicit
     multiplication, "or"/"and" folded to commas. */
  function norm(s) {
    var t = clean(s);
    t = t.replace(/\s+(?:or|and)\s+/g, ',');
    t = t.replace(/\s+/g, '');
    t = t.replace(/=</g, '<=').replace(/=>/g, '>=');
    t = t.replace(/\^\(\+?(-?\d+)\)/g, '^$1');
    t = t.replace(/\^\+/g, '^');
    /* 2*x and 2x are the same thing; so are (x+1)*(x+2) and (x+1)(x+2) */
    for (var i = 0; i < 3; i++) t = t.replace(/([0-9a-z)\]])\*([a-z(\[])/g, '$1$2');
    t = t.replace(/\^1(?![0-9])/g, '');
    t = t.replace(/(^|[^0-9a-z.])1([a-z(])/g, '$1$2');
    t = t.replace(/^\+/, '');
    t = t.replace(/[,.]$/, '');
    return t;
  }

  var ALIASES = [
    [/^(nosolution|nosolutions|nosol|ns|none|noanswer|emptyset|empty|\{\}|∅)$/, 'nosolution'],
    [/^(allrealnumbers|allrealnumber|allreals|allreal|arn|allnumbers|infinitelymany|infinitelymanysolutions|infinite|infinitesolutions)$/, 'allreal'],
    [/^(yes|y|true|t)$/, 'yes'],
    [/^(no|n|false|f)$/, 'no'],
    [/^(dne|doesnotexist|undefined|undef)$/, 'undefined'],
    [/^(function|isafunction|yesitisafunction)$/, 'yes'],
    [/^(notafunction|notfunction|nofunction)$/, 'no']
  ];

  function aliasOf(t) {
    for (var i = 0; i < ALIASES.length; i++) if (ALIASES[i][0].test(t)) return ALIASES[i][1];
    return null;
  }

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = b; b = a % b; a = t; }
    return a || 1;
  }

  function numValue(t) {
    if (/^-?\d+(?:\.\d+)?$/.test(t)) return parseFloat(t);
    var m = t.match(/^(-?\d+(?:\.\d+)?)%$/);
    if (m) return parseFloat(m[1]) / 100;
    m = t.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
    if (m) { var d = parseFloat(m[2]); return d === 0 ? null : parseFloat(m[1]) / d; }
    return null;
  }

  /* Two plain numbers are equal — but an unreduced fraction is not accepted
     for a reduced one, since "simplify" is the point of several units. */
  function numEq(a, b) {
    var x = numValue(a), y = numValue(b);
    if (x === null || y === null) return false;
    if (Math.abs(x - y) > 1e-9) return false;
    var fa = a.match(/^(-?\d+)\/(-?\d+)$/), fb = b.match(/^(-?\d+)\/(-?\d+)$/);
    if (fa && fb) return gcd(+fa[1], +fa[2]) === 1 && gcd(+fb[1], +fb[2]) === 1;
    return true;
  }

  /* Parse a product of a coefficient and variable powers: 12x^3y, -4a, 8 */
  function parseProduct(s) {
    if (s === '' || s == null) return null;
    var sign = 1;
    while (s.charAt(0) === '-' || s.charAt(0) === '+') {
      if (s.charAt(0) === '-') sign = -sign;
      s = s.slice(1);
    }
    if (s === '') s = '1';
    /* A '-' may still appear inside an exponent (x^-4); the tokeniser below
       rejects one anywhere else by failing to consume it. */
    if (/[()<>=,;]/.test(s)) return null;
    var coef = 1, vars = {}, i = 0, m;
    while (i < s.length) {
      var rest = s.slice(i);
      if (rest.charAt(0) === '*') { i++; continue; }
      m = /^(\d+(?:\.\d+)?)/.exec(rest);
      if (m) { coef *= parseFloat(m[1]); i += m[0].length; continue; }
      m = /^([a-z])(?:\^(-?\d+))?/.exec(rest);
      if (m) {
        vars[m[1]] = (vars[m[1]] || 0) + (m[2] === undefined ? 1 : parseInt(m[2], 10));
        i += m[0].length;
        continue;
      }
      return null;
    }
    return { sign: sign, coef: coef, vars: vars };
  }

  /* Canonical monomial. Returns null for anything that is not a single
     monomial (or ratio of two), and for pure numbers — those go through
     numEq instead so unreduced fractions stay rejected. */
  function monoCanon(t) {
    var parts = t.split('/');
    if (parts.length > 2) return null;
    var N = parseProduct(parts[0]);
    if (!N) return null;
    var D = parts.length === 2 ? parseProduct(parts[1]) : { sign: 1, coef: 1, vars: {} };
    if (!D || D.coef === 0) return null;
    var vars = {}, k;
    for (k in N.vars) if (N.vars.hasOwnProperty(k)) vars[k] = (vars[k] || 0) + N.vars[k];
    for (k in D.vars) if (D.vars.hasOwnProperty(k)) vars[k] = (vars[k] || 0) - D.vars[k];
    var keys = [];
    for (k in vars) if (vars.hasOwnProperty(k) && vars[k] !== 0) keys.push(k);
    if (!keys.length) return null;
    keys.sort();
    var coef = (N.sign * D.sign) * (N.coef / D.coef);
    var out = String(Math.round(coef * 1e9) / 1e9);
    for (var i = 0; i < keys.length; i++) out += '*' + keys[i] + '^' + vars[keys[i]];
    return out;
  }

  /* x^-4 === 1/x^4, and 9x^4y^2 === 9y^2x^4 */
  function monoEq(a, b) {
    var x = monoCanon(a), y = monoCanon(b);
    return x !== null && y !== null && x === y;
  }

  /* Split a sum on its top-level + and - signs, keeping each sign. */
  function splitTerms(t) {
    if (/[=<>,;]/.test(t)) return null;
    var out = [], depth = 0, cur = '';
    for (var i = 0; i < t.length; i++) {
      var ch = t.charAt(i);
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      if (depth === 0 && (ch === '+' || ch === '-') && i > 0 && !/[\^*\/(+\-]/.test(t.charAt(i - 1))) {
        out.push(cur); cur = ch;
      } else cur += ch;
    }
    out.push(cur);
    return out.filter(function (s) { return s !== ''; });
  }

  /* Order-independent form of a sum: 2x+3 and 3+2x agree. */
  function canonSum(t) {
    var ts = splitTerms(t);
    if (!ts || ts.length < 2) return t;
    return ts.map(function (s) {
      if (s.charAt(0) !== '-' && s.charAt(0) !== '+') s = '+' + s;
      var sign = s.charAt(0), body = s.slice(1), mc = monoCanon(body);
      return sign + (mc !== null ? mc : body);
    }).sort().join('');
  }

  function sumEq(a, b) {
    var ea = a.split('='), eb = b.split('=');
    if (ea.length === 2 && eb.length === 2) {
      return canonSum(ea[0]) === canonSum(eb[0]) && canonSum(ea[1]) === canonSum(eb[1]);
    }
    if (ea.length !== 1 || eb.length !== 1) return false;
    var ca = canonSum(a), cb = canonSum(b);
    return ca === cb && ca !== a;
  }

  /* (x+2)(x+3) === (x+3)(x+2), including a leading coefficient and
     repeated factors written as (x+2)^2. */
  function factorKey(t) {
    if (t.indexOf('(') < 0) return null;
    var lead = '', i = 0, m = /^-?\d*/.exec(t);
    if (m && m[0]) { lead = m[0]; i = m[0].length; }
    var out = [];
    while (i < t.length) {
      if (t.charAt(i) !== '(') return null;
      var depth = 0, j = i;
      for (; j < t.length; j++) {
        if (t.charAt(j) === '(') depth++;
        else if (t.charAt(j) === ')') { depth--; if (!depth) break; }
      }
      if (depth) return null;
      var inner = canonSum(t.slice(i + 1, j));
      i = j + 1;
      var e = /^\^(\d+)/.exec(t.slice(i)), rep = 1;
      if (e) { rep = Math.min(parseInt(e[1], 10), 8); i += e[0].length; }
      for (var k = 0; k < rep; k++) out.push(inner);
    }
    if (!out.length) return null;
    out.sort();
    return lead + '|' + out.join('|');
  }

  function factorEq(a, b) {
    var x = factorKey(a), y = factorKey(b);
    return x !== null && y !== null && x === y;
  }

  /* Checks that are safe to recurse into from the list-style checks. */
  function core(a, b) {
    if (a === b) return true;
    if (numEq(a, b)) return true;
    if (monoEq(a, b)) return true;
    if (factorEq(a, b)) return true;
    if (sumEq(a, b)) return true;
    return false;
  }

  function isOrderedPair(t) {
    if (/^\(.+,.+\)$/.test(t)) return true;
    var parts = t.split(',');
    if (parts.length < 2) return false;
    var letters = {};
    for (var i = 0; i < parts.length; i++) {
      if (!/^[a-z]=/.test(parts[i])) return false;
      letters[parts[i].charAt(0)] = 1;
    }
    return Object.keys(letters).length === parts.length;
  }

  function asPair(t) {
    var m = t.match(/^\((.+)\)$/), body = m ? m[1] : t;
    if (body.indexOf(',') < 0) return null;
    var parts = body.split(',');
    if (parts.length < 2) return null;
    var named = parts.every(function (p) { return /^[a-z]=/.test(p); });
    if (named) {
      parts = parts.slice().sort(function (p, q) {
        return p.charAt(0) < q.charAt(0) ? -1 : 1;
      }).map(function (p) { return p.slice(2); });
    }
    return parts;
  }

  /* (3,4) === x=3,y=4 — order matters here, unlike a solution set. */
  function pairEq(a, b) {
    var A = asPair(a), B = asPair(b);
    if (!A || !B || A.length !== B.length) return false;
    return A.every(function (v, i) { return core(v, B[i]); });
  }

  /* x=2 or x=5 === 5,2 — order does not matter. */
  function setEq(a, b) {
    var A = a.split(/[,;]/).filter(Boolean), B = b.split(/[,;]/).filter(Boolean);
    if (A.length < 2 && B.length < 2) return false;
    if (A.length !== B.length) return false;
    var strip = function (s) { return s.replace(/^[a-z]=/, ''); };
    A = A.map(strip).sort();
    B = B.map(strip).sort();
    return A.every(function (v, i) { return core(v, B[i]); });
  }

  /* x>3 === 3<x */
  function ineqEq(a, b) {
    var re = /^(.+?)(<=|>=|<|>)(.+)$/, A = re.exec(a), B = re.exec(b);
    if (!A || !B) return false;
    var flip = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' };
    if (A[2] === B[2] && core(A[1], B[1]) && core(A[3], B[3])) return true;
    if (flip[A[2]] === B[2] && core(A[1], B[3]) && core(A[3], B[1])) return true;
    return false;
  }

  /* "x = 5" and "5" are both accepted when the other side names a variable. */
  function varStripEq(a, b) {
    var ra = a.replace(/^[a-z]=/, ''), rb = b.replace(/^[a-z]=/, '');
    if (ra === a && rb === b) return false;
    return core(ra, rb);
  }

  function isMatch(u, c) {
    try {
      if (u === undefined || u === null) return false;
      if (!String(u).trim()) return false;
      var a = norm(u), b = norm(c);
      if (!b) return false;
      if (a === b) return true;

      var A = aliasOf(a), B = aliasOf(b);
      if (A && B && A === B && b.length > 1) return true;

      if (core(a, b)) return true;
      if (varStripEq(a, b)) return true;
      if (isOrderedPair(a) || isOrderedPair(b)) return pairEq(a, b);
      if (setEq(a, b)) return true;
      if (ineqEq(a, b)) return true;
      return false;
    } catch (e) {
      /* Never let a grading bug swallow a student's answer. */
      try { return String(u).trim().toLowerCase() === String(c).trim().toLowerCase(); }
      catch (e2) { return false; }
    }
  }

  W.norm = norm;
  W.isMatch = isMatch;
  W.matches = isMatch;

  /* Unbiased shuffle. The old sort(() => Math.random() - .5) left the first
     few problems far more likely to reappear in every new set. */
  W.shuffle = function (a) {
    var out = a.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  };

  /* ==================================================================
     2. Progress, saved in the browser
     ================================================================== */

  var STORE = 'alg1.progress.v1';

  function readAll() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; }
    catch (e) { return {}; }
  }

  function writeAll(p) {
    try { localStorage.setItem(STORE, JSON.stringify(p)); } catch (e) { /* private mode */ }
  }

  function unitId() {
    try { return (typeof UNIT !== 'undefined' && UNIT && UNIT.id != null) ? String(UNIT.id) : null; }
    catch (e) { return null; }
  }

  function update(fn) {
    var id = unitId();
    if (!id) return;
    var all = readAll(), u = all[id] || {};
    fn(u);
    u.updated = Date.now();
    all[id] = u;
    writeAll(all);
  }

  function best(prev, pct) {
    return typeof prev === 'number' ? Math.max(prev, pct) : pct;
  }

  W.Alg1Progress = {
    all: readAll,
    unit: function (id) { return readAll()[String(id)] || {}; },
    reset: function (id) {
      var all = readAll();
      if (id == null) all = {}; else delete all[String(id)];
      writeAll(all);
    }
  };

  /* ==================================================================
     3. Page enhancement
     ================================================================== */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }

  /* The tab/topic buttons call sw('practice',this) / selTopic('11.2',this);
     reading the argument back out is more reliable than assuming an order. */
  function argOf(el) {
    var on = el.getAttribute('onclick') || '';
    var m = on.match(/\(\s*'([^']*)'/);
    return m ? m[1] : null;
  }

  function wrap(name, after) {
    var orig = W[name];
    if (typeof orig !== 'function' || orig.__a1) return;
    var fn = function () {
      var r = orig.apply(this, arguments);
      try { after.apply(this, arguments); } catch (e) { }
      return r;
    };
    fn.__a1 = true;
    W[name] = fn;
  }

  /* ---- Tabs: real ARIA tablist with arrow-key navigation ---- */
  function enhanceTabs() {
    var list = $('.tabs');
    if (!list) return;
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', 'Unit sections');
    var tabs = $$('.tab', list);
    tabs.forEach(function (t) {
      var n = argOf(t);
      if (!n) return;
      t.type = 'button';
      t.id = 'tab-' + n;
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-controls', 'v-' + n);
      t.setAttribute('data-view', n);
      var panel = document.getElementById('v-' + n);
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', 'tab-' + n);
        panel.setAttribute('tabindex', '0');
      }
    });
    syncTabs();
    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (!next) return;
      e.preventDefault();
      next.focus();
      next.click();
    });
  }

  function syncTabs() {
    $$('.tabs .tab').forEach(function (t) {
      var on = t.classList.contains('on');
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    $$('.vstabs .vstab, .tpbtns .tpbtn, .pqf-btn').forEach(function (b) {
      b.type = 'button';
      b.setAttribute('aria-pressed', b.classList.contains('on') ? 'true' : 'false');
    });
  }

  /* ---- Notes modal: dialog semantics, focus trap, focus restore ---- */
  var lastFocus = null;

  function focusables(root) {
    return $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])', root)
      .filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
  }

  function enhanceModal() {
    var overlay = $('#topic-overlay');
    if (!overlay) return;
    var modal = $('.topic-modal', overlay);
    if (!modal) return;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    var title = $('#modal-title');
    if (title) { title.id = 'modal-title'; modal.setAttribute('aria-labelledby', 'modal-title'); }
    var body = $('#modal-body');
    if (body) body.setAttribute('tabindex', '0');

    overlay.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = focusables(modal);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    wrap('openTopic', function (i) {
      lastFocus = document.activeElement;
      var close = $('.topic-modal-close', modal);
      if (close) close.focus();
      var id = unitId();
      if (id != null) {
        update(function (u) {
          u.notesRead = u.notesRead || {};
          u.notesRead[String(i)] = true;
        });
        markNotesRead();
      }
    });
    wrap('closeTopic', function () {
      if (lastFocus && lastFocus.focus) lastFocus.focus();
      lastFocus = null;
    });
  }

  /* ---- Desmos: only fetch the iframe once it is actually opened ---- */
  function enhanceDesmos() {
    var f = $('#desmos-iframe');
    if (!f) return;
    f.setAttribute('title', 'Desmos graphing calculator');
    var load = function () {
      if (!f.getAttribute('src') && f.getAttribute('data-src')) f.setAttribute('src', f.getAttribute('data-src'));
    };
    wrap('openDesmos', load);
    wrap('openDesmosWithEq', function (enc) { if (!enc) load(); });
    var trigger = $('#desmos-trigger');
    if (trigger) {
      trigger.type = 'button';
      trigger.setAttribute('aria-haspopup', 'dialog');
    }
    var modal = $('.desmos-modal');
    if (modal) {
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'Graphing calculator');
    }
  }

  /* ---- Calculator: type into it once it has focus ---- */
  var CALC_KEYS = {
    '0': 'n(0)', '1': 'n(1)', '2': 'n(2)', '3': 'n(3)', '4': 'n(4)',
    '5': 'n(5)', '6': 'n(6)', '7': 'n(7)', '8': 'n(8)', '9': 'n(9)',
    '.': 'dt', '+': 'op(+)', '-': 'op(-)', '*': 'op(*)', 'x': 'op(*)',
    '/': 'op(/)', '=': 'eq', 'Enter': 'eq', 'Backspace': 'bk',
    'Delete': 'clr', 'Escape': 'clr', 'c': 'clr'
  };

  function enhanceCalculators() {
    $$('.calc-box').forEach(function (box) {
      if (box.__a1) return;
      box.__a1 = true;
      box.setAttribute('tabindex', '0');
      box.setAttribute('role', 'application');
      box.setAttribute('aria-label', 'Basic calculator. Click, then type numbers and operators.');
      var screen = $('.calc-screen', box);
      if (screen) {
        screen.setAttribute('role', 'status');
        screen.setAttribute('aria-live', 'polite');
      }
      var grid = $('.calc-grid', box);
      var val = $('.calc-val', box), expr = $('.calc-expr', box);
      if (!grid || !val || !expr) return;
      box.addEventListener('keydown', function (e) {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        var f = CALC_KEYS[e.key] || CALC_KEYS[e.key.toLowerCase && e.key.toLowerCase()];
        if (!f) return;
        e.preventDefault();
        if (typeof W.ck2 === 'function') W.ck2(val.id, expr.id, f);
      });
    });
    /* Give the keypad buttons readable names. */
    var names = { '÷': 'Divide', '×': 'Multiply', '−': 'Subtract', '+': 'Add', '=': 'Equals', 'C': 'Clear', '⌫': 'Backspace', '±': 'Plus or minus', '.': 'Decimal point' };
    $$('.ckey').forEach(function (b) {
      b.type = 'button';
      if (names[b.textContent]) b.setAttribute('aria-label', names[b.textContent]);
    });
  }

  /* ---- Question cards: labels and polite announcements ---- */
  function labelQuestions() {
    $$('.pcard').forEach(function (card, i) {
      var input = $('.ai', card);
      var num = $('.pnum', card);
      var q = $('.pq-q', card);
      if (input && !input.getAttribute('aria-label')) {
        input.setAttribute('aria-label', 'Answer for question ' + (num ? num.textContent : i + 1) +
          (q ? ': ' + q.textContent.slice(0, 80) : ''));
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('spellcheck', 'false');
      }
      var fb = $('.fb', card);
      if (fb && !fb.getAttribute('aria-live')) fb.setAttribute('aria-live', 'polite');
      $$('button', card).forEach(function (b) { b.type = 'button'; });
    });
    $$('.vq-card').forEach(function (card) {
      var fb = $('.vq-fb', card);
      if (fb && !fb.getAttribute('aria-live')) fb.setAttribute('aria-live', 'polite');
      var group = $('.vq-opts', card) || $('.vq-tf', card);
      if (group && !group.getAttribute('role')) {
        group.setAttribute('role', 'group');
        var q = $('.vq-q', card);
        if (q) group.setAttribute('aria-label', q.textContent.slice(0, 120));
      }
      $$('.vq-opt', card).forEach(function (b) {
        b.type = 'button';
        b.setAttribute('aria-pressed', b.classList.contains('sel') ? 'true' : 'false');
      });
    });
  }

  function liveRegions() {
    ['#p-results', '#t-results', '#sbar', '#vq-sbar'].forEach(function (sel) {
      var el = $(sel);
      if (el && !el.getAttribute('aria-live')) {
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
      }
    });
  }

  /* ---- Progress strip + per-topic badges ---- */
  function pct(el) {
    if (!el) return null;
    var m = (el.textContent || '').match(/(\d+)\s*\/\s*(\d+)/);
    if (!m || !+m[2]) return null;
    return Math.round(+m[1] / +m[2] * 100);
  }

  function topicCount() {
    try {
      if (typeof TOPICS !== 'undefined' && TOPICS && TOPICS.length) return TOPICS.length;
    } catch (e) { }
    return $$('.tg-card').length || 0;
  }

  function practiceTopics() {
    return $$('.tpbtns .tpbtn').map(argOf).filter(Boolean);
  }

  function buildProgressStrip() {
    if (!unitId()) return;
    var content = $('.content');
    var tabs = $('.tabs');
    if (!content || !tabs || $('#a1-progress')) return;
    var strip = document.createElement('div');
    strip.id = 'a1-progress';
    strip.className = 'a1-progress';
    strip.setAttribute('role', 'status');
    strip.setAttribute('aria-live', 'polite');
    tabs.parentNode.insertBefore(strip, tabs.nextSibling);
    renderProgress();
  }

  function renderProgress() {
    var strip = $('#a1-progress');
    if (!strip) return;
    var id = unitId();
    var u = W.Alg1Progress.unit(id);
    var topics = practiceTopics();
    var done = topics.filter(function (t) {
      return u.practice && u.practice[t] && u.practice[t].best >= 80;
    }).length;
    var notes = topicCount();
    var read = u.notesRead ? Object.keys(u.notesRead).length : 0;
    var bits = [];
    bits.push(item('Notes read', notes ? read + ' / ' + notes : '—', notes ? read / notes : 0));
    bits.push(item('Topics at 80%+', topics.length ? done + ' / ' + topics.length : '—',
      topics.length ? done / topics.length : 0));
    bits.push(item('Practice test best', u.test && u.test.best != null ? u.test.best + '%' : 'Not taken',
      u.test && u.test.best != null ? u.test.best / 100 : 0));
    bits.push(item('Vocab quiz best', u.vocab && u.vocab.best != null ? u.vocab.best + '%' : 'Not taken',
      u.vocab && u.vocab.best != null ? u.vocab.best / 100 : 0));
    strip.innerHTML = '<div class="a1-progress-head">Your progress on this unit' +
      '<button type="button" class="a1-reset" id="a1-reset">Reset unit progress</button></div>' +
      '<div class="a1-progress-grid">' + bits.join('') + '</div>';
    var btn = $('#a1-reset');
    if (btn) btn.addEventListener('click', function () {
      W.Alg1Progress.reset(id);
      renderProgress();
      markNotesRead();
      badgeTopics();
    });
    markNotesRead();
    badgeTopics();
  }

  function item(label, value, frac) {
    var w = Math.max(0, Math.min(1, frac || 0)) * 100;
    var cls = w >= 80 ? 'g' : w >= 50 ? 'y' : 'r';
    return '<div class="a1-stat"><div class="a1-stat-l">' + label + '</div>' +
      '<div class="a1-stat-v">' + value + '</div>' +
      '<div class="a1-stat-bw"><div class="a1-stat-bar ' + cls + '" style="width:' + w + '%"></div></div></div>';
  }

  function markNotesRead() {
    var u = W.Alg1Progress.unit(unitId());
    $$('.tg-card').forEach(function (card, i) {
      var on = !!(u.notesRead && u.notesRead[String(i)]);
      card.classList.toggle('a1-read', on);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      var t = $('.tg-title', card);
      card.setAttribute('aria-label', (t ? t.textContent : 'Topic') + (on ? ' — already read' : ''));
      if (!card.__a1key) {
        card.__a1key = true;
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
        });
      }
    });
  }

  function badgeTopics() {
    var u = W.Alg1Progress.unit(unitId());
    $$('.tpbtns .tpbtn').forEach(function (b) {
      var t = argOf(b);
      var old = $('.a1-badge', b);
      if (old) old.parentNode.removeChild(old);
      if (!t || !u.practice || !u.practice[t]) return;
      var p = u.practice[t].best;
      var span = document.createElement('span');
      span.className = 'a1-badge ' + (p >= 80 ? 'g' : p >= 50 ? 'y' : 'r');
      span.textContent = p + '%';
      b.appendChild(span);
    });
  }

  function recordHooks() {
    if (!unitId()) return;

    wrap('checkAllDone', function () {
      var panel = $('#p-results');
      if (!panel || panel.style.display === 'none') return;
      var cards = $$('#plist .pcard');
      if (!cards.length) return;
      var ok = cards.filter(function (c) { return c.classList.contains('ok'); }).length;
      var p = Math.round(ok / cards.length * 100);
      var topic = null;
      try { topic = typeof curTopic !== 'undefined' ? curTopic : null; } catch (e) { }
      if (!topic) return;
      update(function (u) {
        u.practice = u.practice || {};
        var rec = u.practice[topic] || { attempts: 0 };
        rec.attempts++;
        rec.last = p;
        rec.best = best(rec.best, p);
        u.practice[topic] = rec;
      });
      renderProgress();
    });

    wrap('gradeT', function () {
      var p = pct($('#snum'));
      if (p === null) return;
      update(function (u) {
        var rec = u.test || { attempts: 0 };
        rec.attempts++;
        rec.last = p;
        rec.best = best(rec.best, p);
        u.test = rec;
      });
      renderProgress();
    });

    wrap('gradeVQ', function () {
      var p = pct($('#vq-sn'));
      if (p === null) return;
      update(function (u) {
        var rec = u.vocab || { attempts: 0 };
        rec.attempts++;
        rec.last = p;
        rec.best = best(rec.best, p);
        u.vocab = rec;
      });
      renderProgress();
    });

    /* Re-apply the ARIA/labelling passes whenever a view re-renders. */
    ['loadP', 'loadT', 'loadVQ', 'selTopic', 'setQFilter', 'check', 'chk', 'gradeT', 'gradeVQ', 'selVQ', 'sw', 'swV']
      .forEach(function (n) { wrap(n, refresh); });
  }

  function refresh() {
    syncTabs();
    labelQuestions();
    liveRegions();
    enhanceCalculators();
  }

  /* ---- Skip link ---- */
  function skipLink() {
    if ($('.a1-skip')) return;
    var target = $('.content') || $('.main');
    if (!target) return;
    if (!target.id) target.id = 'a1-main';
    var a = document.createElement('a');
    a.className = 'a1-skip';
    a.href = '#' + target.id;
    a.textContent = 'Skip to content';
    document.body.insertBefore(a, document.body.firstChild);
    if (target.tagName !== 'MAIN') target.setAttribute('role', 'main');
  }

  /* ---- index.html: progress on the unit cards ---- */
  function indexProgress() {
    var cards = $$('.unit-card');
    if (!cards.length) return;
    var all = W.Alg1Progress.all();
    var latest = null;
    cards.forEach(function (card) {
      var badge = $('.u-badge', card);
      if (!badge) return;
      var id = badge.textContent.replace(/–|—/g, '-').trim();
      var u = all[id];
      var meta = $('.u-meta', card);
      var row = document.createElement('div');
      row.className = 'u-prog';
      if (!u) {
        row.innerHTML = '<span class="u-prog-none">Not started</span>';
      } else {
        var parts = [];
        if (u.test && u.test.best != null) parts.push('Test ' + u.test.best + '%');
        var topics = u.practice ? Object.keys(u.practice) : [];
        var strong = topics.filter(function (t) { return u.practice[t].best >= 80; }).length;
        if (topics.length) parts.push(strong + '/' + topics.length + ' topics strong');
        if (u.notesRead) parts.push(Object.keys(u.notesRead).length + ' notes read');
        var score = u.test && u.test.best != null ? u.test.best : (strong && topics.length ? Math.round(strong / topics.length * 100) : 10);
        row.innerHTML = '<span class="u-prog-bw"><span class="u-prog-bar ' +
          (score >= 80 ? 'g' : score >= 50 ? 'y' : 'r') + '" style="width:' + score + '%"></span></span>' +
          '<span class="u-prog-txt">' + (parts.join(' · ') || 'Started') + '</span>';
        if (!latest || (u.updated || 0) > (latest.u.updated || 0)) latest = { u: u, card: card, id: id };
      }
      if (meta && meta.parentNode) meta.parentNode.insertBefore(row, meta.nextSibling);
    });
    if (latest) {
      var main = $('.main');
      var host = $('.page-sub');
      if (main && host) {
        var name = $('.u-name', latest.card);
        var cta = document.createElement('a');
        cta.className = 'a1-resume';
        cta.href = latest.card.getAttribute('href');
        cta.innerHTML = '<span class="a1-resume-l">Pick up where you left off</span>' +
          '<span class="a1-resume-u">Unit ' + latest.id + ' — ' + (name ? name.textContent : '') + '</span>';
        host.parentNode.insertBefore(cta, host.nextSibling);
      }
    }
    var reset = $('#a1-reset-all');
    if (reset) reset.addEventListener('click', function () {
      if (W.confirm('Clear saved progress for every unit on this device?')) {
        W.Alg1Progress.reset();
        W.location.reload();
      }
    });
  }

  /* ---- Boot ---- */
  function init() {
    try { skipLink(); } catch (e) { }
    try { enhanceTabs(); } catch (e) { }
    try { enhanceModal(); } catch (e) { }
    try { enhanceDesmos(); } catch (e) { }
    try { buildProgressStrip(); } catch (e) { }
    try { recordHooks(); } catch (e) { }
    try { refresh(); } catch (e) { }
    try { indexProgress(); } catch (e) { }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
