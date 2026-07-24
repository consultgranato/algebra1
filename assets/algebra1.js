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
      try { enhanceNote(i); } catch (e) { }
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

  /* ==================================================================
     Notes: turn the injected HTML into a proper reading experience
     ------------------------------------------------------------------
     The content is authored per unit as an HTML string, so rather than
     rewrite thirteen files we restructure it here once it is in the DOM:
     number the worked examples, break their steps into rows, frame the
     figures, and build a section index for long topics.
     ================================================================== */

  var ROMAN = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

  function slug(s, n) {
    return 'note-s' + n + '-' + String(s || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
  }

  var SUP_OUT = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '⁺', 'n': 'ⁿ' };

  /* textContent flattens the maths: the halves of a stacked 3/4 run together
     as "34", and x<sup>2</sup> becomes "x2". Rebuild both before reading. */
  function flatText(el) {
    var c = el.cloneNode(true);
    $$('.frac', c).forEach(function (f) {
      var n = $('.fn', f), d = $('.fd', f);
      f.parentNode.replaceChild(
        document.createTextNode((n ? n.textContent : '') + '/' + (d ? d.textContent : '')), f);
    });
    $$('sup', c).forEach(function (s) {
      var raw = (s.textContent || '').trim(), out = '';
      for (var i = 0; i < raw.length; i++) {
        if (!SUP_OUT[raw.charAt(i)]) { out = ''; break; }
        out += SUP_OUT[raw.charAt(i)];
      }
      s.parentNode.replaceChild(document.createTextNode(out || ('^' + raw)), s);
    });
    return (c.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function navLabel(h) {
    var full = flatText(h);
    var t = full
      .replace(/^(?:worked\s+)?example\s*/i, '')     /* "Worked example 2 — …" */
      .replace(/^\d+\s*(?:—|–|-|:)\s*/, '')          /* leftover "2 — " */
      .replace(/^(?:—|–|-|:)\s*/, '');
    if (!t) t = full;
    /* Capitalise real words only. A leading lone letter is a variable —
       "x² + 5x + 6" must not become "X² + 5x + 6". */
    if (!/^[a-z](?![a-z])/.test(t)) t = t.charAt(0).toUpperCase() + t.slice(1);
    return t.length > 46 ? t.slice(0, 44).replace(/\s+\S*$/, '') + '…' : t;
  }

  function enhanceNote(topicIndex) {
    var body = $('#modal-body');
    if (!body) return;
    body.classList.add('a1-note');
    body.scrollTop = 0;

    /* --- worked examples become numbered, stepped cards --- */
    $$('.worked', body).forEach(function (w, n) {
      w.classList.add('a1-worked');
      var lbl = $('.wlbl', w);
      var title = lbl ? lbl.innerHTML : '';
      /* Authors wrote labels like "Example 2 — Simplify: 4^-2"; keep the
         descriptive half and let the badge carry the number. */
      title = title.replace(/^\s*(worked\s+)?example\s*\d*\s*(&mdash;|—|-|:)?\s*/i, '');
      if (lbl) {
        lbl.className = 'a1-worked-head';
        lbl.innerHTML = '<span class="a1-worked-badge">Example ' + (n + 1) + '</span>' +
          (title ? '<span class="a1-worked-title">' + title + '</span>' : '');
      }
      var steps = $('.wsteps', w);
      if (!steps) return;
      steps.classList.add('a1-steps');
      var rows = $$('.eq', steps);
      rows.forEach(function (r, k) {
        r.classList.add('a1-eq');
        /* .eq-div marks the line the author drew a rule above: the result. */
        if (r.classList.contains('eq-div') || k === rows.length - 1) r.classList.add('a1-eq-final');
        var note = $('.eq-note', r);
        if (note) note.classList.add('a1-eq-note');
      });
    });

    /* --- callouts get an icon and a clearer identity --- */
    ['kc', 'tip', 'warn'].forEach(function (kind) {
      $$('.' + kind, body).forEach(function (c) {
        c.classList.add('a1-callout', 'a1-' + kind);
        var lbl = $('.' + kind + '-lbl', c);
        if (lbl) lbl.classList.add('a1-callout-lbl');
      });
    });

    /* --- section headings: collect for the index, drop the id-less state --- */
    var heads = $$('.note-h', body);
    heads.forEach(function (h, n) {
      h.classList.add('a1-note-h');
      h.id = slug(flatText(h), n);
    });

    /* --- packet scans and diagrams get framed, and can be enlarged --- */
    $$('img', body).forEach(function (img) {
      if (img.closest('.a1-fig')) return;
      var fig = document.createElement('figure');
      fig.className = 'a1-fig';
      img.parentNode.insertBefore(fig, img);
      fig.appendChild(img);
      img.removeAttribute('style');
      img.setAttribute('alt', img.getAttribute('alt') || 'Diagram from the course packet');
      var cap = document.createElement('figcaption');
      cap.innerHTML = 'From the course packet <button type="button" class="a1-fig-zoom">Enlarge</button>';
      fig.appendChild(cap);
      var zoom = $('.a1-fig-zoom', cap);
      zoom.addEventListener('click', function () {
        var big = fig.classList.toggle('big');
        this.textContent = big ? 'Shrink' : 'Enlarge';
      });
      /* Only offer "Enlarge" when the frame is actually cropping the scan. */
      var gate = function () {
        if (!img.naturalHeight) return;
        var capped = img.naturalHeight > img.clientHeight + 4;
        zoom.style.display = capped ? '' : 'none';
      };
      if (img.complete) gate(); else img.addEventListener('load', gate, { once: true });
    });
    $$('svg', body).forEach(function (s) {
      if (s.closest('.a1-fig') || s.closest('.a1-diagram')) return;
      var host = s.parentNode;
      if (host && host !== body && !host.classList.contains('a1-diagram')) host.classList.add('a1-diagram');
    });

    /* --- tables --- */
    $$('table', body).forEach(function (t) { t.classList.add('a1-table'); });

    /* --- the joke reads as an aside, not stray text --- */
    $$('.joke', body).forEach(function (j) { j.classList.add('a1-aside'); });

    buildNoteNav(body, heads);
    buildNoteFooter(body, topicIndex);
    trackReading(body);
  }

  function buildNoteNav(body, heads) {
    if (heads.length < 3) return;
    var nav = document.createElement('nav');
    nav.className = 'a1-note-nav';
    nav.setAttribute('aria-label', 'Sections in this topic');
    nav.innerHTML = '<span class="a1-note-nav-l">On this page</span>' +
      heads.map(function (h) {
        return '<a href="#' + h.id + '" title="' + flatText(h).replace(/"/g, '&quot;') + '">' +
          navLabel(h) + '</a>';
      }).join('');
    body.insertBefore(nav, body.firstChild);
    $$('a', nav).forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var t = document.getElementById(a.getAttribute('href').slice(1));
        if (!t) return;
        /* offsetTop is measured from the positioned overlay, not from the
           scrolling body, so compare rectangles instead. */
        var delta = t.getBoundingClientRect().top - body.getBoundingClientRect().top;
        /* Instant, not smooth: smooth scrolling on this overflow container
           is silently dropped in some browsers, which left the link dead. */
        body.scrollTop = body.scrollTop + delta - nav.offsetHeight - 14;
        if (body.__a1scroll) body.__a1scroll();
      });
    });
  }

  function buildNoteFooter(body, topicIndex) {
    /* Read the tag off the header the page just filled in: unit1-4 keeps its
       notes in hidden DOM with TOPIC_TAGS, the rest use a TOPICS array, and
       both populate #modal-tag. */
    var tag = null;
    var tagEl = $('#modal-tag');
    if (tagEl && tagEl.textContent.trim()) tag = tagEl.textContent.trim();
    if (!tag) {
      try { if (typeof TOPICS !== 'undefined' && TOPICS[topicIndex]) tag = TOPICS[topicIndex].tag; }
      catch (e) { }
    }
    var foot = document.createElement('div');
    foot.className = 'a1-note-foot';
    var canPractice = tag && practiceTopics().indexOf(String(tag)) >= 0;
    foot.innerHTML =
      '<p class="a1-note-foot-l">Finished reading?</p>' +
      '<div class="a1-note-foot-btns">' +
      (canPractice ? '<button type="button" class="a1-cta primary" id="a1-note-practice">Practice ' + tag + ' &rarr;</button>' : '') +
      '<button type="button" class="a1-cta ghost" id="a1-note-print">Print these notes</button>' +
      '</div>';
    body.appendChild(foot);
    var pb = $('#a1-note-practice');
    if (pb) pb.addEventListener('click', function () {
      if (typeof W.closeTopic === 'function') W.closeTopic();
      openPractice(String(tag));
    });
    var rb = $('#a1-note-print');
    if (rb) rb.addEventListener('click', function () { W.print(); });
  }

  function trackReading(body) {
    var head = $('.topic-modal-header');
    if (!head) return;
    var bar = $('.a1-read-bar', head);
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'a1-read-bar';
      bar.innerHTML = '<i></i>';
      head.appendChild(bar);
    }
    var fill = $('i', bar);
    var onScroll = function () {
      var max = body.scrollHeight - body.clientHeight;
      fill.style.width = (max > 20 ? Math.min(100, body.scrollTop / max * 100) : 0) + '%';
    };
    if (body.__a1scroll) {
      body.removeEventListener('scroll', body.__a1scroll);
      W.removeEventListener('resize', body.__a1scroll);
    }
    body.__a1scroll = onScroll;
    body.addEventListener('scroll', onScroll, { passive: true });
    W.addEventListener('resize', onScroll);
    /* Images and the serif face load after this runs and change the
       scroll height, so recompute rather than trust the first reading. */
    $$('img', body).forEach(function (img) {
      if (!img.complete) img.addEventListener('load', onScroll, { once: true });
    });
    [0, 250, 1000].forEach(function (t) { setTimeout(onScroll, t); });
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

  /* ---- Unit hero, per-topic badges, next step ---- */
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

  function unitName() {
    try { if (typeof UNIT !== 'undefined' && UNIT && UNIT.name) return UNIT.name; } catch (e) { }
    return '';
  }

  function topicIndexByTag(tag) {
    try {
      if (typeof TOPICS !== 'undefined' && TOPICS) {
        for (var i = 0; i < TOPICS.length; i++) if (String(TOPICS[i].tag) === String(tag)) return i;
      }
    } catch (e) { }
    return -1;
  }

  /* Move the student to a section the way clicking would. */
  function goto(view) {
    var tab = $('.tabs .tab[data-view="' + view + '"]');
    if (tab) tab.click();
    return !!tab;
  }

  function openNotes(idx) {
    goto('notes');
    if (typeof W.openTopic === 'function' && idx >= 0) W.openTopic(idx);
  }

  function openPractice(topic) {
    goto('practice');
    var btn = $$('.tpbtns .tpbtn').filter(function (b) { return argOf(b) === topic; })[0];
    if (btn && !btn.classList.contains('on')) btn.click();
    var first = $('#plist .ai');
    if (first) first.focus();
  }

  /* A single, always-visible "here is what to do next". */
  function nextStep(u) {
    var notes = topicCount();
    var read = u.notesRead ? Object.keys(u.notesRead).length : 0;
    if (notes && read < notes) {
      var idx = 0;
      for (var i = 0; i < notes; i++) { if (!(u.notesRead && u.notesRead[String(i)])) { idx = i; break; } }
      var label = 'Topic';
      try { if (typeof TOPICS !== 'undefined' && TOPICS[idx]) label = TOPICS[idx].tag + ' — ' + String(TOPICS[idx].title).replace(/&amp;/g, '&'); } catch (e) { }
      return { text: 'Read the notes for ' + label, cta: 'Open notes', run: function () { openNotes(idx); } };
    }
    var topics = practiceTopics();
    for (var j = 0; j < topics.length; j++) {
      var rec = u.practice && u.practice[topics[j]];
      if (!rec || rec.best < 80) {
        return {
          text: (rec ? 'Get topic ' + topics[j] + ' up to 80%' : 'Practice topic ' + topics[j]),
          cta: 'Practice', run: function () { openPractice(topics[j]); }
        };
      }
    }
    if (!u.vocab) return { text: 'Check your vocabulary', cta: 'Take the quiz', run: function () { goto('vocab'); var q = $$('.vstab')[1]; if (q) q.click(); } };
    if (!u.test) return { text: 'You are ready for the practice test', cta: 'Start the test', run: function () { goto('test'); } };
    if (u.test.best < 80) return { text: 'Practice test best is ' + u.test.best + '% — try once more', cta: 'Retake', run: function () { goto('test'); } };
    return { text: 'Unit complete. Nice work.', cta: null, run: null };
  }

  function mastery(u) {
    var notes = topicCount(), topics = practiceTopics();
    var read = u.notesRead ? Object.keys(u.notesRead).length : 0;
    var strong = topics.filter(function (t) { return u.practice && u.practice[t] && u.practice[t].best >= 80; }).length;
    var parts = [
      [.15, notes ? read / notes : 0],
      [.35, topics.length ? strong / topics.length : 0],
      [.35, u.test && u.test.best != null ? u.test.best / 100 : 0],
      [.15, u.vocab && u.vocab.best != null ? u.vocab.best / 100 : 0]
    ];
    var sum = 0, w = 0;
    parts.forEach(function (p) { sum += p[0] * p[1]; w += p[0]; });
    return Math.round(sum / w * 100);
  }

  function ring(p, size) {
    var r = size / 2 - 5, c = 2 * Math.PI * r;
    var cls = p >= 80 ? 'g' : p >= 40 ? 'y' : 'r';
    return '<svg class="a1-ring" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="a1-ring-bg"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="a1-ring-fg ' + cls + '" ' +
      'stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - p / 100)) + '"/></svg>';
  }

  function buildProgressStrip() {
    if (!unitId()) return;
    var tabs = $('.tabs');
    if (!tabs || $('#a1-hero')) return;
    var hero = document.createElement('section');
    hero.id = 'a1-hero';
    hero.className = 'a1-hero';
    hero.setAttribute('aria-label', 'Your progress on this unit');
    tabs.parentNode.insertBefore(hero, tabs);
    renderProgress();
  }

  function renderProgress() {
    var hero = $('#a1-hero');
    if (!hero) return;
    var id = unitId();
    var u = W.Alg1Progress.unit(id);
    var m = mastery(u);
    var step = nextStep(u);
    var notes = topicCount(), topics = practiceTopics();
    var read = u.notesRead ? Object.keys(u.notesRead).length : 0;
    var strong = topics.filter(function (t) { return u.practice && u.practice[t] && u.practice[t].best >= 80; }).length;

    var chips = [
      chip('Notes', notes ? read + '/' + notes : '—', notes && read >= notes),
      chip('Topics 80%+', topics.length ? strong + '/' + topics.length : '—', topics.length && strong >= topics.length),
      chip('Vocab quiz', u.vocab && u.vocab.best != null ? u.vocab.best + '%' : '—', u.vocab && u.vocab.best >= 80),
      chip('Practice test', u.test && u.test.best != null ? u.test.best + '%' : '—', u.test && u.test.best >= 80)
    ].join('');

    hero.innerHTML =
      '<div class="a1-hero-ring">' + ring(m, 76) + '<span class="a1-ring-pct">' + m + '<i>%</i></span></div>' +
      '<div class="a1-hero-main">' +
      '<p class="a1-hero-eyebrow">Unit ' + id + (m >= 100 ? ' · complete' : '') + '</p>' +
      '<h1 class="a1-hero-title">' + unitName() + '</h1>' +
      '<div class="a1-chips">' + chips + '</div>' +
      '</div>' +
      '<div class="a1-hero-next">' +
      '<p class="a1-next-l">Next step</p>' +
      '<p class="a1-next-t">' + step.text + '</p>' +
      (step.cta ? '<button type="button" class="a1-next-btn" id="a1-next">' + step.cta + ' &rarr;</button>' : '') +
      '<button type="button" class="a1-reset" id="a1-reset">Reset</button>' +
      '</div>';

    var go = $('#a1-next');
    if (go && step.run) go.addEventListener('click', step.run);
    var btn = $('#a1-reset');
    if (btn) btn.addEventListener('click', function () {
      W.Alg1Progress.reset(id);
      renderProgress();
    });
    markNotesRead();
    badgeTopics();
    stepTabs(u);
  }

  function chip(label, value, done) {
    return '<span class="a1-chip' + (done ? ' done' : '') + '">' +
      '<span class="a1-chip-l">' + label + '</span>' +
      '<span class="a1-chip-v">' + value + '</span></span>';
  }

  /* Mark the four tabs as a sequence, ticking off what is finished. */
  function stepTabs(u) {
    var notes = topicCount(), topics = practiceTopics();
    var read = u.notesRead ? Object.keys(u.notesRead).length : 0;
    var strong = topics.filter(function (t) { return u.practice && u.practice[t] && u.practice[t].best >= 80; }).length;
    var done = {
      notes: !!(notes && read >= notes),
      vocab: !!(u.vocab && u.vocab.best >= 80),
      practice: !!(topics.length && strong >= topics.length),
      test: !!(u.test && u.test.best >= 80)
    };
    $$('.tabs .tab').forEach(function (t, i) {
      var v = t.getAttribute('data-view');
      if (!t.__a1step) {
        t.__a1step = true;
        /* Number the tabs so the unit reads as a sequence, not four
           unrelated pages. The leading emoji goes; the number replaces it. */
        var label = (t.textContent || '').replace(/^[^A-Za-z]+/, '').trim();
        t.innerHTML = '<span class="a1-step-n" aria-hidden="true">' + (i + 1) + '</span>' +
          '<span class="a1-step-t">' + label + '</span>';
      }
      t.classList.add('a1-step');
      t.classList.toggle('a1-done', !!done[v]);
    });
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
        /* Notes and practice never referred to each other; now one click
           goes straight from a topic's notes to practising that topic. */
        var tag = $('.tg-tag', card);
        var topic = tag ? tag.textContent.trim() : null;
        if (topic && practiceTopics().indexOf(topic) >= 0) {
          var go = document.createElement('button');
          go.type = 'button';
          go.className = 'a1-tg-practice';
          go.textContent = 'Practice this';
          go.setAttribute('aria-label', 'Practice topic ' + topic);
          go.addEventListener('click', function (e) {
            e.stopPropagation();
            openPractice(topic);
          });
          card.appendChild(go);
        }
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

  /* ==================================================================
     4. The practice loop
     ------------------------------------------------------------------
     A single wrong answer used to disable the input and reveal the
     solution, so one mistyped character ended the question. Practice now
     gives a second try and a hint before showing the answer; the practice
     test is still one attempt, which is what makes it a test.
     ================================================================== */

  var attempts = {}, streak = 0, bestStreak = 0;

  var PRAISE = ['Correct!', 'Correct!', 'Nice.', 'That’s it.', 'Well done.', 'Exactly.'];
  var praiseAt = 0;
  function praise() { return PRAISE[praiseAt++ % PRAISE.length]; }

  function fmt(s) {
    try { return typeof W.formatEq === 'function' ? W.formatEq(s) : s; }
    catch (e) { return s; }
  }

  function problemAt(pfx, i) {
    try {
      var arr = pfx === 'p' ? pset : tset;
      return arr && arr[i] ? arr[i] : null;
    } catch (e) { return null; }
  }

  function reduceMotion() {
    try { return W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }

  function pop(el) {
    if (reduceMotion()) return;
    el.classList.remove('a1-pop');
    void el.offsetWidth;
    el.classList.add('a1-pop');
  }

  function confetti(host) {
    if (reduceMotion()) return;
    var wrap = document.createElement('div');
    wrap.className = 'a1-confetti';
    wrap.setAttribute('aria-hidden', 'true');
    var colors = ['#4a2c7a', '#6b3db8', '#3b6d11', '#b87a00', '#c4b5e8'];
    for (var i = 0; i < 28; i++) {
      var b = document.createElement('i');
      b.style.left = (Math.random() * 100) + '%';
      b.style.background = colors[i % colors.length];
      b.style.animationDelay = (Math.random() * .25) + 's';
      b.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
      wrap.appendChild(b);
    }
    (host || document.body).appendChild(wrap);
    setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 2200);
  }

  function setStreak(n) {
    streak = n;
    if (n > bestStreak) bestStreak = n;
    var el = $('#a1-streak');
    if (!el) return;
    el.classList.toggle('on', n >= 2);
    el.innerHTML = n >= 2
      ? '<span class="a1-streak-n">' + n + '</span> in a row'
      : '<span class="a1-streak-hint">Answer two in a row to start a streak</span>';
  }

  function mountStreak() {
    var ph = $('#v-practice .ph');
    if (!ph || $('#a1-streak')) return;
    var el = document.createElement('div');
    el.id = 'a1-streak';
    el.className = 'a1-streak';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    ph.insertBefore(el, ph.lastElementChild);
    setStreak(streak);
  }

  function focusNext(pfx, i) {
    var next = document.getElementById(pfx + 'a' + (i + 1));
    if (next && !next.disabled) { next.focus(); return; }
    for (var j = 0; j < 40; j++) {
      var el = document.getElementById(pfx + 'a' + j);
      if (el && !el.disabled) { el.focus(); return; }
    }
  }

  function showHintFor(i, pfx, p) {
    var fb = document.getElementById(pfx + 'fb' + i);
    if (!fb || !p) return;
    fb.className = 'fb hint';
    fb.innerHTML = '<span class="a1-fb-icon">💡</span> ' + fmt(p.h);
  }

  /* Replaces each unit's own check()/chk(); every unit had the same body. */
  function runCheck(i, pfx) {
    pfx = pfx || 'p';
    var inp = document.getElementById(pfx + 'a' + i);
    var card = document.getElementById(pfx + 'c' + i);
    var fb = document.getElementById(pfx + 'fb' + i);
    var p = problemAt(pfx, i);
    if (!inp || !card || !fb || !p) return;
    if (!String(inp.value).trim()) { inp.focus(); return; }

    var key = pfx + i;
    var ok = isMatch(inp.value, p.a);

    if (ok) {
      inp.disabled = true;
      card.classList.add('ok');
      card.classList.remove('no', 'a1-retrying');
      fb.className = 'fb ok';
      fb.innerHTML = '<span class="a1-fb-icon">✓</span> ' + praise() +
        (attempts[key] ? ' <em>(second try)</em>' : '');
      pop(card);
      if (pfx === 'p') { setStreak(streak + 1); focusNext(pfx, i); }
    } else {
      attempts[key] = (attempts[key] || 0) + 1;
      if (pfx === 'p') setStreak(0);
      if (pfx === 'p' && attempts[key] < 2) {
        card.classList.remove('ok', 'no');
        card.classList.add('a1-retrying');
        fb.className = 'fb a1-retry';
        fb.innerHTML = '<span class="a1-fb-icon">↺</span> Not quite — try once more. ' +
          '<button type="button" class="a1-fb-hint">Show a hint</button>';
        var hb = $('.a1-fb-hint', fb);
        if (hb) hb.addEventListener('click', function () { showHintFor(i, pfx, p); });
        inp.disabled = false;
        inp.focus();
        if (inp.select) inp.select();
        return; /* not resolved, so the set is not finished */
      }
      inp.disabled = true;
      card.classList.add('no');
      card.classList.remove('ok', 'a1-retrying');
      fb.className = 'fb no';
      fb.innerHTML = '<span class="a1-fb-icon">✗</span> Answer: <strong>' + fmt(p.a) +
        '</strong> — ' + fmt(p.h);
    }
    if (pfx === 'p' && typeof W.checkAllDone === 'function') W.checkAllDone();
  }

  function installPracticeLoop() {
    if (typeof W.check === 'function' || typeof W.chk === 'function') {
      W.check = function (i, pfx) { runCheck(i, pfx); };
      W.chk = function (i) { runCheck(i, 'p'); };
    }
    /* A fresh set is a fresh start. */
    wrap('loadP', function () {
      attempts = {};
      setStreak(0);
      mountStreak();
    });
    wrap('loadT', function () { attempts = {}; });
  }

  /* After a finished set: say what to do next instead of just "try another". */
  function resultsCTA() {
    var panel = $('#p-results');
    if (!panel || panel.style.display === 'none') return;
    var cards = $$('#plist .pcard');
    if (!cards.length) return;
    var okCount = cards.filter(function (c) { return c.classList.contains('ok'); }).length;
    var p = Math.round(okCount / cards.length * 100);
    var topic = null;
    try { topic = typeof curTopic !== 'undefined' ? curTopic : null; } catch (e) { }

    var old = $('#a1-result-cta');
    if (old) old.parentNode.removeChild(old);
    var box = document.createElement('div');
    box.id = 'a1-result-cta';
    box.className = 'a1-result-cta';

    var topics = practiceTopics();
    var at = topics.indexOf(topic);
    var nextTopic = at >= 0 && at < topics.length - 1 ? topics[at + 1] : null;
    var idx = topicIndexByTag(topic);

    var head, actions = [];
    if (p === 100) {
      head = 'Perfect set. ' + (bestStreak >= 4 ? 'Best streak: ' + bestStreak + '.' : '');
      if (nextTopic) actions.push(['primary', 'Move on to ' + nextTopic, function () { openPractice(nextTopic); }]);
      else actions.push(['primary', 'Take the practice test', function () { goto('test'); }]);
      actions.push(['ghost', 'Another set of ' + topic, function () { W.loadP(); }]);
      confetti(panel);
    } else if (p >= 80) {
      head = 'Strong — ' + p + '% on topic ' + topic + '.';
      if (nextTopic) actions.push(['primary', 'Move on to ' + nextTopic, function () { openPractice(nextTopic); }]);
      else actions.push(['primary', 'Take the practice test', function () { goto('test'); }]);
      actions.push(['ghost', 'Another set', function () { W.loadP(); }]);
    } else if (p >= 50) {
      head = p + '% — one more set should do it.';
      actions.push(['primary', 'Another set', function () { W.loadP(); }]);
      if (idx >= 0) actions.push(['ghost', 'Reread the notes', function () { openNotes(idx); }]);
    } else {
      head = 'This one needs another look — that is fine.';
      if (idx >= 0) actions.push(['primary', 'Reread the notes for ' + topic, function () { openNotes(idx); }]);
      actions.push(['ghost', 'Try another set', function () { W.loadP(); }]);
    }

    box.innerHTML = '<p class="a1-result-head">' + head + '</p><div class="a1-result-btns"></div>';
    var row = $('.a1-result-btns', box);
    actions.forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'a1-cta ' + a[0];
      b.textContent = a[1];
      b.addEventListener('click', a[2]);
      row.appendChild(b);
    });
    panel.appendChild(box);

    var oldCta = $('.next-cta', panel);
    if (oldCta) oldCta.style.display = 'none';
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
      resultsCTA();
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
      if (p >= 90) confetti($('#sbar'));
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
      if (p >= 90) confetti($('#vq-sbar'));
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
    mountStreak();
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

  /* ---- index.html: the course at a glance ---- */

  /* The unit pages know their own weighting; here we only have the stored
     record, so approximate the same shape from it. */
  function unitScore(u) {
    if (!u) return 0;
    var topics = u.practice ? Object.keys(u.practice) : [];
    var strong = topics.filter(function (t) { return u.practice[t].best >= 80; }).length;
    var parts = [
      [.35, topics.length ? strong / topics.length : 0],
      [.35, u.test && u.test.best != null ? u.test.best / 100 : 0],
      [.15, u.vocab && u.vocab.best != null ? u.vocab.best / 100 : 0],
      [.15, u.notesRead ? Math.min(1, Object.keys(u.notesRead).length / 4) : 0]
    ];
    var s = 0;
    parts.forEach(function (p) { s += p[0] * p[1]; });
    return Math.round(s * 100);
  }

  function indexProgress() {
    var cards = $$('.unit-card');
    if (!cards.length) return;
    var all = W.Alg1Progress.all();
    var latest = null, started = 0, strongUnits = 0, totalScore = 0;

    cards.forEach(function (card) {
      var badge = $('.u-badge', card);
      if (!badge) return;
      var id = badge.textContent.replace(/[–—]/g, '-').trim();
      var u = all[id];
      var meta = $('.u-meta', card);
      var score = unitScore(u);
      totalScore += score;

      var state = document.createElement('span');
      state.className = 'u-state';
      if (!u) {
        state.classList.add('new');
        state.textContent = 'Not started';
        card.classList.add('is-new');
      } else {
        started++;
        if (score >= 80) { strongUnits++; state.classList.add('strong'); state.textContent = 'Strong'; card.classList.add('is-strong'); }
        else { state.classList.add('going'); state.textContent = score + '%'; card.classList.add('is-going'); }
        if (!latest || (u.updated || 0) > (latest.u.updated || 0)) latest = { u: u, card: card, id: id };
      }
      card.insertBefore(state, card.firstChild);

      var row = document.createElement('div');
      row.className = 'u-prog';
      if (u) {
        var parts = [];
        var topics = u.practice ? Object.keys(u.practice) : [];
        var strong = topics.filter(function (t) { return u.practice[t].best >= 80; }).length;
        if (topics.length) parts.push(strong + '/' + topics.length + ' topics strong');
        if (u.test && u.test.best != null) parts.push('test ' + u.test.best + '%');
        row.innerHTML = '<span class="u-prog-bw"><span class="u-prog-bar ' +
          (score >= 80 ? 'g' : score >= 50 ? 'y' : 'r') + '" style="width:' + Math.max(score, 3) + '%"></span></span>' +
          '<span class="u-prog-txt">' + (parts.join(' · ') || 'Started') + '</span>';
        if (meta && meta.parentNode) meta.parentNode.insertBefore(row, meta.nextSibling);
      }
    });

    var overall = Math.round(totalScore / cards.length);
    var host = $('.page-sub');
    if (host) {
      var hero = document.createElement('section');
      hero.className = 'a1-course';
      hero.setAttribute('aria-label', 'Your progress across the course');
      var resume = latest
        ? '<a class="a1-course-cta" href="' + latest.card.getAttribute('href') + '">' +
          '<span class="a1-course-cta-l">Pick up where you left off</span>' +
          '<span class="a1-course-cta-u">Unit ' + latest.id + ' — ' +
          ($('.u-name', latest.card) ? $('.u-name', latest.card).textContent : '') + ' &rarr;</span></a>'
        : '<a class="a1-course-cta" href="unit1-4.html">' +
          '<span class="a1-course-cta-l">Start here</span>' +
          '<span class="a1-course-cta-u">Unit 1–4 — Getting the Rust Off &rarr;</span></a>';
      hero.innerHTML =
        '<div class="a1-course-ring">' + ring(overall, 84) + '<span class="a1-ring-pct">' + overall + '<i>%</i></span></div>' +
        '<div class="a1-course-stats">' +
        '<p class="a1-course-l">Course progress</p>' +
        '<p class="a1-course-v">' + started + ' of ' + cards.length + ' units started' +
        (strongUnits ? ' · <strong>' + strongUnits + '</strong> at 80%+' : '') + '</p>' +
        '</div>' + resume;
      host.parentNode.insertBefore(hero, host.nextSibling);
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
    try { installPracticeLoop(); } catch (e) { }
    try { recordHooks(); } catch (e) { }
    try { refresh(); } catch (e) { }
    try { indexProgress(); } catch (e) { }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
