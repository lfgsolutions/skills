/* Brainstorm answer kit v1: behaviour. Inline inside a <script> at the END of the page body,
   after `window.BS = {...}` is defined, then call BSKit.init(window.BS).
   Config and data model: references/page-contract.md. No dependencies, no network calls of its own. */
(function () {
  'use strict';

  var T = {
    en: {
      other: 'Other', otherPh: 'Your own answer', note: 'Notes, details, questions', notePh: 'Add precision, doubts, or a question for Claude',
      text: 'Your answer', textPh: 'Write freely', sure: 'How sure are you?', conf: ['', 'Unsure', 'Leaning', 'Sure'],
      open: 'Open', answered: 'Answered, how sure?', suggested: 'Suggested', why: 'Why I suggest it:',
      ask: 'Think it through with Claude', asking: 'Thinking...', askAgain: 'Ask again', claudeSays: 'Claude',
      askErr: 'Claude could not answer right now. Try again in a moment.', askOff: 'Asking Claude is turned off for this page.',
      connecting: 'Connecting...', saving: 'Saving...', saved: 'Saved, Claude can read it',
      local: 'Saved on this device only. Use "Copy my answers" to send them to Claude.', readonly: 'View only',
      error: 'Could not save. Your last change is kept on this device.',
      copy: 'Copy my answers', copied: 'Copied. Paste it in Claude.', copyFail: 'Select the text below and copy it.',
      next: 'Send to round ', official: 'Make it the official version', cancel: 'Back',
      confirmNext: 'Lock this round? Claude will build round {n} from your answers.',
      confirmOfficial: 'Turn this into the official version? Claude will rebuild it as a roadmap, presentation or project map.',
      confirmNote: 'Anything Claude should know first? (optional)', yes: 'Yes, do it',
      sentNext: 'Locked. Back in Claude, type: ', sentOfficial: 'Locked. Back in Claude, type: ',
      cmdNext: 'next round', cmdOfficial: 'make it official',
      inboxPh: 'A new idea popped up? Drop it here.', inboxAdd: 'Add idea', inboxAdded: 'Added. It goes into the next round.',
      settled: 'Sure', leaning: 'Leaning', answeredNoConf: 'Answered, not rated', unsure: 'Unsure', openN: 'Open', of: ' of ', answeredN: ' answered',
      up: 'Move up', down: 'Move down', addItem: 'Missing one? Add it', add: 'Add', rate: 'Rate ', stars: ' out of 5',
      scaleNote: 'Notes, details, questions'
    },
    fr: {
      other: 'Autre', otherPh: 'Ta propre réponse', note: 'Notes, précisions, questions', notePh: 'Ajoute des précisions, des doutes ou une question pour Claude',
      text: 'Ta réponse', textPh: 'Écris librement', sure: 'À quel point es-tu sûr?', conf: ['', 'Incertain', 'Penchant', 'Sûr'],
      open: 'Ouvert', answered: 'Répondu, sûr à quel point?', suggested: 'Suggéré', why: 'Pourquoi je le suggère :',
      ask: 'Creuser avec Claude', asking: 'Réflexion...', askAgain: 'Redemander', claudeSays: 'Claude',
      askErr: 'Claude ne peut pas répondre pour le moment. Réessaie dans un instant.', askOff: 'Claude est désactivé pour cette page.',
      connecting: 'Connexion...', saving: 'Enregistrement...', saved: 'Enregistré, Claude peut le lire',
      local: 'Enregistré sur cet appareil seulement. Utilise « Copier mes réponses » pour les envoyer à Claude.', readonly: 'Lecture seule',
      error: 'Impossible d’enregistrer. Ton dernier changement est gardé sur cet appareil.',
      copy: 'Copier mes réponses', copied: 'Copié. Colle-le dans Claude.', copyFail: 'Sélectionne le texte ci-dessous et copie-le.',
      next: 'Passer au tour ', official: 'En faire la version officielle', cancel: 'Retour',
      confirmNext: 'Verrouiller ce tour? Claude construira le tour {n} à partir de tes réponses.',
      confirmOfficial: 'En faire la version officielle? Claude la reconstruira en feuille de route, présentation ou carte de projet.',
      confirmNote: 'Quelque chose que Claude doit savoir avant? (optionnel)', yes: 'Oui, on y va',
      sentNext: 'Verrouillé. Dans Claude, écris : ', sentOfficial: 'Verrouillé. Dans Claude, écris : ',
      cmdNext: 'tour suivant', cmdOfficial: 'version officielle',
      inboxPh: 'Une nouvelle idée? Dépose-la ici.', inboxAdd: 'Ajouter', inboxAdded: 'Ajoutée. Elle sera dans le prochain tour.',
      settled: 'Sûr', leaning: 'Penchant', answeredNoConf: 'Répondu, non évalué', unsure: 'Incertain', openN: 'Ouvert', of: ' sur ', answeredN: ' répondues',
      up: 'Monter', down: 'Descendre', addItem: 'Il en manque un? Ajoute-le', add: 'Ajouter', rate: 'Noter ', stars: ' sur 5',
      scaleNote: 'Notes, précisions, questions'
    }
  };

  var cfg, t, db = null, sample = null, mode = 'connecting', state = {}, inboxLocal = [], firstSnap = true, Q = {}, queues = {}, timers = {};
  var LS_KEY;

  /* ---------- helpers ---------- */
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function now() { return new Date().toISOString(); }
  function str(v, max) { return typeof v === 'string' ? v.slice(0, max || 4000) : ''; }
  function debounce(k, fn, ms) { clearTimeout(timers[k]); timers[k] = setTimeout(function () { delete timers[k]; fn(); }, ms); }
  function flushDebounce(k, fn) { if (timers[k]) { clearTimeout(timers[k]); delete timers[k]; fn(); } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function langName() { return cfg.langName || { en: 'English', fr: 'French', es: 'Spanish', de: 'German', pt: 'Portuguese', it: 'Italian' }[cfg.lang] || 'the same language as the question'; }
  function docId(qid) { return 'r' + cfg.round + '-' + qid; }
  function blank(q) { return { round: cfg.round, qid: q.id, kind: q.kind, choice: '', choices: [], other: '', value: null, order: (q.items || []).slice(), ratings: {}, added: [], ranked: false, text: '', note: '', conf: 0, claude: '', at: '' }; }
  function cur(id) { return state[id] || (state[id] = blank(Q[id])); }
  function clean(q, v) {
    v = v || {};
    var b = blank(q);
    b.choice = str(v.choice, 80); b.choices = Array.isArray(v.choices) ? v.choices.filter(function (x) { return typeof x === 'string'; }).slice(0, 40) : [];
    b.other = str(v.other, 500); b.value = typeof v.value === 'number' ? v.value : null;
    b.added = Array.isArray(v.added) ? v.added.filter(function (x) { return typeof x === 'string'; }).slice(0, 20) : [];
    var pool = (q.items || []).concat(b.added);
    if (Array.isArray(v.order)) { var o = v.order.filter(function (x) { return pool.indexOf(x) >= 0; }); pool.forEach(function (x) { if (o.indexOf(x) < 0) o.push(x); }); b.order = o; } else b.order = pool;
    b.ratings = {}; if (v.ratings && typeof v.ratings === 'object') Object.keys(v.ratings).forEach(function (k) { var n = v.ratings[k]; if (typeof n === 'number' && n >= 1 && n <= 5) b.ratings[k] = n; });
    b.ranked = v.ranked === true;
    b.text = str(v.text, 4000); b.note = str(v.note, 4000); b.conf = [1, 2, 3].indexOf(v.conf) >= 0 ? v.conf : 0;
    b.claude = str(v.claude, 4000); b.at = str(v.at, 40);
    return b;
  }
  function isAnswered(q) {
    var v = state[q.id]; if (!v) return false;
    switch (q.kind) {
      case 'single': return !!v.choice && (v.choice !== '_other' || !!v.other.trim());
      case 'multi': return v.choices.length > 0;
      case 'scale': return v.value !== null;
      case 'rank': return v.ranked;
      case 'rate': return Object.keys(v.ratings).length > 0;
      case 'text': return !!v.text.trim();
    }
    return false;
  }

  /* ---------- storage ---------- */
  function saveLocal() { try { localStorage.setItem(LS_KEY, JSON.stringify({ state: state, inbox: inboxLocal })); } catch (e) { } }
  function loadLocal() {
    try {
      var raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); if (!raw) return;
      Object.keys(raw.state || {}).forEach(function (id) { if (Q[id]) state[id] = clean(Q[id], raw.state[id]); });
      inboxLocal = Array.isArray(raw.inbox) ? raw.inbox.filter(function (x) { return x && typeof x.text === 'string' && typeof x.id === 'string'; }) : [];
    } catch (e) { }
  }
  function setStatus(s) {
    var label = { connecting: t.connecting, saving: t.saving, saved: t.saved, local: t.local, readonly: t.readonly, error: t.error }[s] || '';
    $$('[data-bs-status]').forEach(function (n) { n.className = 'bs-status ' + s; n.textContent = label; });
    $$('[data-bs-copy]').forEach(function (n) { n.hidden = !(s === 'local' || s === 'error' || s === 'readonly'); });
  }
  function persist(path, data) {
    saveLocal();
    if (db && mode === 'db') queueWrite(path, data);
    else setStatus(mode === 'readonly' ? 'readonly' : mode === 'connecting' ? 'connecting' : 'local');
  }
  function anyBusy() { return Object.keys(queues).some(function (k) { return queues[k].busy || queues[k].pending; }); }
  function queueWrite(path, data) { var q = queues[path] || (queues[path] = { pending: null, busy: false }); q.pending = data; if (!q.busy) flush(path); }
  function flush(path) {
    var q = queues[path]; if (!q || q.busy || !q.pending || !db) return;
    q.busy = true; var data = q.pending; q.pending = null; setStatus('saving');
    var attempt = function (n) {
      return db.doc(path).set(data).then(function () { return true; }, function (e) {
        var c = e && e.code;
        if (c === 'invalid_argument' || c === 'transform_error') return false;
        if (c === 'revoked' || c === 'not_granted' || c === 'capability_disabled' || c === 'capability_removed') { mode = 'local'; db = null; return 'stop'; }
        if (c === 'quota_exceeded' || c === 'resource_exhausted' || n >= 1) return false;
        return sleep(400 + Math.random() * 600).then(function () { return attempt(n + 1); });
      });
    };
    attempt(0).then(function (res) {
      q.busy = false;
      if (res === 'stop') { q.pending = null; setStatus('local'); return; }
      if (res !== true) setStatus('error');
      if (q.pending && db) { flush(path); return; }
      if (res === true && !anyBusy()) setStatus('saved');
    });
  }
  function persistQ(id) { var v = cur(id); v.at = v.at || now(); persist('answers/' + docId(id), JSON.parse(JSON.stringify(v))); }
  function touch(id, patch) { var v = cur(id); Object.keys(patch).forEach(function (k) { v[k] = patch[k]; }); v.at = now(); }

  /* ---------- cards ---------- */
  function buildCard(slot, q) {
    var card = el('div', 'bs-card'); card.id = 'bs-' + q.id;
    var head = el('div', 'bs-head'), tw = el('div');
    if (q.kicker) tw.appendChild(el('p', 'bs-kicker', q.kicker));
    tw.appendChild(el('h3', 'bs-q', q.q));
    var st = el('span', 'bs-state c0', t.open); st.id = 'bs-st-' + q.id;
    head.appendChild(tw); head.appendChild(st); card.appendChild(head);
    if (q.why) card.appendChild(el('p', 'bs-why', q.why));

    if (q.kind === 'single' || q.kind === 'multi') buildOptions(card, q);
    else if (q.kind === 'scale') buildScale(card, q);
    else if (q.kind === 'rank' || q.kind === 'rate') buildList(card, q);
    else if (q.kind === 'text') buildField(card, q, 'text', t.text, q.placeholder || t.textPh, 4);

    var rec = (q.options || []).filter(function (o) { return o.rec; })[0];
    if (q.recWhy) { var rw = el('p', 'bs-recwhy'); rw.appendChild(el('b', null, t.why + ' ')); rw.appendChild(document.createTextNode(q.recWhy)); card.appendChild(rw); }
    else if (rec && rec.why) { var rw2 = el('p', 'bs-recwhy'); rw2.appendChild(el('b', null, t.why + ' ')); rw2.appendChild(document.createTextNode(rec.why)); card.appendChild(rw2); }

    if (q.kind !== 'text') buildField(card, q, 'note', t.note, q.notePh || t.notePh, 2);
    buildConf(card, q);
    buildAsk(card, q);
    slot.parentNode.replaceChild(card, slot);
  }

  function buildOptions(card, q) {
    var multi = q.kind === 'multi', wrap = el('div', 'bs-opts' + (q.style ? ' ' + q.style : ''));
    wrap.setAttribute('role', multi ? 'group' : 'radiogroup'); wrap.setAttribute('aria-label', q.q);
    var opts = (q.options || []).slice();
    if (q.allowOther !== false) opts.push({ id: '_other', other: true });
    opts.forEach(function (o) {
      var lab = el('label', 'bs-opt' + (o.other ? ' other' : ''));
      var inp = document.createElement('input');
      inp.type = multi ? 'checkbox' : 'radio'; inp.name = 'bs-' + q.id; inp.id = 'bs-' + q.id + '-' + o.id; inp.value = o.id;
      inp.addEventListener('change', function () {
        if (multi) { var l = cur(q.id).choices.filter(function (c) { return c !== o.id; }); if (inp.checked) l.push(o.id); touch(q.id, { choices: l }); }
        else if (inp.checked) touch(q.id, { choice: o.id });
        persistQ(q.id); render(q.id);
        if (o.other && inp.checked) { var oi = document.getElementById('bs-' + q.id + '-oin'); if (oi) oi.focus(); }
      });
      lab.appendChild(inp);
      var body = el('span', 'bs-ob');
      if (o.other) {
        var oin = document.createElement('input'); oin.type = 'text'; oin.className = 'bs-other-in'; oin.id = 'bs-' + q.id + '-oin';
        oin.placeholder = t.other + ': ' + t.otherPh; oin.maxLength = 500; oin.setAttribute('aria-label', t.other);
        oin.addEventListener('input', function () {
          var v = cur(q.id), patch = { other: oin.value };
          if (oin.value.trim()) { if (multi) { if (v.choices.indexOf('_other') < 0) patch.choices = v.choices.concat('_other'); } else patch.choice = '_other'; }
          touch(q.id, patch); saveLocal(); render(q.id); refresh();
          debounce('o-' + q.id, function () { persistQ(q.id); }, 700);
        });
        oin.addEventListener('blur', function () { flushDebounce('o-' + q.id, function () { persistQ(q.id); }); });
        body.appendChild(oin);
      } else {
        var ol = el('span', 'bs-ol'); ol.appendChild(document.createTextNode(o.label));
        if (o.rec) ol.appendChild(el('em', 'bs-rec', t.suggested));
        body.appendChild(ol);
        if (o.detail) body.appendChild(el('span', 'bs-od', o.detail));
      }
      lab.appendChild(body); wrap.appendChild(lab);
    });
    card.appendChild(wrap);
  }

  function buildScale(card, q) {
    var w = el('div', 'bs-scale'), val = el('div', 'bs-scale-val'); val.id = 'bs-' + q.id + '-val';
    var r = document.createElement('input'); r.type = 'range'; r.id = 'bs-' + q.id + '-range';
    r.min = q.min != null ? q.min : 0; r.max = q.max != null ? q.max : 10; r.step = q.step || 1;
    r.value = q.start != null ? q.start : (Number(r.min) + Number(r.max)) / 2; r.setAttribute('aria-label', q.q);
    r.addEventListener('input', function () { touch(q.id, { value: Number(r.value) }); saveLocal(); render(q.id); refresh(); debounce('s-' + q.id, function () { persistQ(q.id); }, 500); });
    var ends = el('div', 'bs-scale-ends'); ends.appendChild(el('span', null, q.minLabel || '')); ends.appendChild(el('span', null, q.maxLabel || ''));
    w.appendChild(val); w.appendChild(r); w.appendChild(ends); card.appendChild(w);
  }

  function buildList(card, q) {
    var ul = el('ul', 'bs-list'); ul.id = 'bs-' + q.id + '-list'; card.appendChild(ul);
    var add = el('div', 'bs-add'), inp = document.createElement('input');
    inp.type = 'text'; inp.className = 'bs-in'; inp.id = 'bs-' + q.id + '-addin'; inp.placeholder = t.addItem; inp.maxLength = 200; inp.setAttribute('aria-label', t.addItem);
    var b = el('button', 'bs-btn', t.add); b.type = 'button';
    function go() {
      var s = inp.value.trim(); if (!s) return; var v = cur(q.id);
      if (v.order.indexOf(s) >= 0 || v.added.length >= 20) { inp.value = ''; return; }
      touch(q.id, { added: v.added.concat(s), order: v.order.concat(s) }); inp.value = ''; persistQ(q.id); render(q.id); refresh();
    }
    b.addEventListener('click', go); inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    add.appendChild(inp); add.appendChild(b); card.appendChild(add);
  }
  function drawList(q) {
    var ul = document.getElementById('bs-' + q.id + '-list'); if (!ul) return; var v = cur(q.id);
    var items = q.kind === 'rank' ? v.order : (q.items || []).concat(v.added);
    ul.textContent = '';
    items.forEach(function (it, i) {
      var li = el('li', 'bs-li');
      if (q.kind === 'rank') {
        li.appendChild(el('span', 'bs-n', String(i + 1))); li.appendChild(el('span', 'bs-t', it));
        [['up', -1, '↑'], ['down', 1, '↓']].forEach(function (d) {
          var b = el('button', 'bs-mv', d[2]); b.type = 'button'; b.setAttribute('aria-label', t[d[0]] + ': ' + it);
          b.disabled = (d[1] < 0 && i === 0) || (d[1] > 0 && i === items.length - 1);
          b.addEventListener('click', function () {
            var o = v.order.slice(), j = i + d[1]; var tmp = o[i]; o[i] = o[j]; o[j] = tmp;
            touch(q.id, { order: o, ranked: true }); persistQ(q.id); render(q.id); refresh();
            var again = ul.children[j] && ul.children[j].querySelectorAll('.bs-mv')[d[1] < 0 ? 0 : 1]; if (again && !again.disabled) again.focus();
          });
          li.appendChild(b);
        });
      } else {
        li.appendChild(el('span', 'bs-t', it));
        var stars = el('div', 'bs-stars'); stars.setAttribute('role', 'group'); stars.setAttribute('aria-label', t.rate + it);
        for (var n = 1; n <= 5; n++) (function (n) {
          var s = el('button', 'bs-star' + ((v.ratings[it] || 0) >= n ? ' on' : ''), '★'); s.type = 'button';
          s.setAttribute('aria-label', n + t.stars); s.setAttribute('aria-pressed', String(v.ratings[it] === n));
          s.addEventListener('click', function () {
            var r = JSON.parse(JSON.stringify(v.ratings)); if (r[it] === n) delete r[it]; else r[it] = n;
            touch(q.id, { ratings: r }); persistQ(q.id); render(q.id); refresh();
          });
          stars.appendChild(s);
        })(n);
        li.appendChild(stars);
      }
      ul.appendChild(li);
    });
  }

  function buildField(card, q, key, label, ph, rows) {
    var w = el('div', 'bs-field'), l = el('label', null, label), ta = document.createElement('textarea');
    ta.id = 'bs-' + q.id + '-' + key; l.htmlFor = ta.id; ta.className = 'bs-ta'; ta.rows = rows; ta.maxLength = 4000; ta.placeholder = ph;
    ta.addEventListener('input', function () { var p = {}; p[key] = ta.value; touch(q.id, p); saveLocal(); if (key === 'text') { render(q.id); refresh(); } debounce(key + q.id, function () { persistQ(q.id); }, 800); });
    ta.addEventListener('blur', function () { flushDebounce(key + q.id, function () { persistQ(q.id); }); });
    w.appendChild(l); w.appendChild(ta); card.appendChild(w);
  }

  function buildConf(card, q) {
    var c = el('div', 'bs-conf'), l = el('span', 'bs-conf-l', t.sure); l.id = 'bs-' + q.id + '-cl';
    var seg = el('div', 'bs-seg'); seg.setAttribute('role', 'radiogroup'); seg.setAttribute('aria-labelledby', l.id);
    [1, 2, 3].forEach(function (n) {
      var lab = el('label'), i = document.createElement('input');
      i.type = 'radio'; i.name = 'bs-c-' + q.id; i.id = 'bs-c-' + q.id + '-' + n; i.value = String(n);
      i.addEventListener('change', function () { if (i.checked) { touch(q.id, { conf: n }); persistQ(q.id); render(q.id); refresh(); } });
      lab.appendChild(i); lab.appendChild(el('span', null, t.conf[n])); seg.appendChild(lab);
    });
    c.appendChild(l); c.appendChild(seg); card.appendChild(c);
  }

  function buildAsk(card, q) {
    if (q.ask === false) return;
    var row = el('div', 'bs-askrow'); row.hidden = true; row.setAttribute('data-bs-ask', '');
    var b = el('button', 'bs-btn', t.ask); b.type = 'button'; b.id = 'bs-' + q.id + '-ask';
    var out = el('div', 'bs-reply'); out.id = 'bs-' + q.id + '-reply'; out.hidden = true; out.setAttribute('aria-live', 'polite');
    b.addEventListener('click', function () { askClaude(q, b, out); });
    row.appendChild(b); card.appendChild(row); card.appendChild(out);
  }
  function answerText(q, v) {
    var name = function (id) { if (id === '_other') return t.other + ': ' + (v.other || '...'); var o = (q.options || []).filter(function (x) { return x.id === id; })[0]; return o ? o.label : id; };
    switch (q.kind) {
      case 'single': return v.choice ? name(v.choice) : '';
      case 'multi': return v.choices.map(name).join('; ');
      case 'scale': return v.value === null ? '' : String(v.value) + (q.unit ? ' ' + q.unit : '');
      case 'rank': return v.ranked ? v.order.map(function (x, i) { return (i + 1) + '. ' + x; }).join(' | ') : '';
      case 'rate': return Object.keys(v.ratings).map(function (k) { return k + ' ' + v.ratings[k] + '/5'; }).join('; ');
      case 'text': return v.text;
    }
    return '';
  }
  function askClaude(q, b, out) {
    if (!sample) return;
    var v = cur(q.id);
    var opts = (q.options || []).map(function (o) { return '- ' + o.label + (o.detail ? ' (' + o.detail + ')' : '') + (o.rec ? ' [suggested]' : ''); }).join('\n');
    var prompt = [
      'You are a sharp, encouraging sparring partner helping someone develop a brainstorm. Reply in ' + langName() + ', the language of this page.',
      'Project context: ' + (cfg.context || ''),
      'Question: ' + q.q, q.why ? 'Why it matters: ' + q.why : '', opts ? 'Options:\n' + opts : '',
      'Their current answer: ' + (answerText(q, v) || 'none yet'), 'Their notes: ' + (v.note || v.text || 'none'),
      'In under 120 words: if their thinking is solid, push it forward with one concrete next step or a bigger version of the idea. If there is a real risk, name the single biggest one and how to test it cheaply. Answer any question in their notes directly. No preamble, no em dashes, no bullet lists longer than 3 items.'
    ].filter(Boolean).join('\n\n');
    b.disabled = true; b.textContent = t.asking; out.hidden = false; out.textContent = '';
    var k = el('span', 'bs-k', t.claudeSays), body = el('span'); out.appendChild(k); out.appendChild(body);
    sample(prompt, { onText: function (u) { body.textContent = u.text; } }).then(function (r) {
      body.textContent = r.text; touch(q.id, { claude: r.text.slice(0, 4000) }); persistQ(q.id);
    }, function (e) {
      var c = e && e.code;
      if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].indexOf(c) >= 0) { sample = null; $$('[data-bs-ask]').forEach(function (n) { n.hidden = true; }); out.hidden = true; return; }
      if (c === 'cancelled') { out.hidden = !body.textContent; return; }
      body.textContent = (e && e.text ? e.text + '\n\n' : '') + t.askErr;
    }).then(function () { b.disabled = false; b.textContent = t.askAgain; });
  }

  function render(id) {
    var q = Q[id], v = cur(id);
    if (q.kind === 'single' || q.kind === 'multi') {
      (q.options || []).concat(q.allowOther !== false ? [{ id: '_other' }] : []).forEach(function (o) {
        var i = document.getElementById('bs-' + id + '-' + o.id); if (i) i.checked = q.kind === 'multi' ? v.choices.indexOf(o.id) >= 0 : v.choice === o.id;
      });
      var oi = document.getElementById('bs-' + id + '-oin'); if (oi && document.activeElement !== oi && oi.value !== v.other) oi.value = v.other;
    }
    if (q.kind === 'scale') {
      var r = document.getElementById('bs-' + id + '-range'), val = document.getElementById('bs-' + id + '-val');
      if (r && v.value !== null && document.activeElement !== r) r.value = v.value;
      if (val) val.textContent = (v.value === null ? '?' : (q.format ? q.format(v.value) : v.value + (q.unit ? ' ' + q.unit : '')));
    }
    if (q.kind === 'rank' || q.kind === 'rate') drawList(q);
    ['note', 'text'].forEach(function (k) { var ta = document.getElementById('bs-' + id + '-' + k); if (ta && document.activeElement !== ta && ta.value !== v[k]) ta.value = v[k]; });
    [1, 2, 3].forEach(function (n) { var i = document.getElementById('bs-c-' + id + '-' + n); if (i) i.checked = v.conf === n; });
    var rep = document.getElementById('bs-' + id + '-reply');
    if (rep && v.claude && !rep.textContent) { rep.hidden = false; rep.appendChild(el('span', 'bs-k', t.claudeSays)); rep.appendChild(el('span', null, v.claude)); }
    var st = document.getElementById('bs-st-' + id);
    if (st) { var done = isAnswered(q); st.className = 'bs-state' + (done ? ' c' + v.conf : ''); st.textContent = done ? (v.conf ? t.conf[v.conf] : t.answered) : t.open; }
  }

  /* ---------- meter, round bar, inbox, copy ---------- */
  function counts() {
    var c = { 0: 0, 1: 0, 2: 0, 3: 0, open: 0, total: 0 };
    cfg.questions.forEach(function (q) { c.total++; if (isAnswered(q)) c[cur(q.id).conf || 0]++; else c.open++; });
    return c;
  }
  function refresh() {
    var c = counts();
    $$('[data-bs-meter]').forEach(function (m) {
      m.textContent = ''; m.className = 'bs-meter';
      var bar = el('div', 'bs-bar'); bar.setAttribute('role', 'img');
      var answered = c.total - c.open;
      bar.setAttribute('aria-label', answered + t.of + c.total + t.answeredN);
      [[3, 'b3'], [2, 'b2'], [1, 'b1'], [0, 'b0']].forEach(function (p) { var i = el('i', p[1]); i.style.width = (c.total ? c[p[0]] / c.total * 100 : 0) + '%'; bar.appendChild(i); });
      var lg = el('div', 'bs-legend');
      [[t.settled, 3, 'var(--bs-good)'], [t.leaning, 2, 'var(--bs-warn)'], [t.unsure, 1, 'var(--bs-bad)']].forEach(function (p) {
        var s = el('span'), i = el('i'); i.style.background = p[2]; s.appendChild(i); s.appendChild(document.createTextNode(p[0] + ' ' + c[p[1]])); lg.appendChild(s);
      });
      if (c[0]) { var sa = el('span'), ia = el('i'); ia.style.background = 'var(--bs-accent)'; sa.appendChild(ia); sa.appendChild(document.createTextNode(t.answeredNoConf + ' ' + c[0])); lg.appendChild(sa); }
      var so = el('span'), io = el('i'); io.style.background = 'var(--bs-line)'; so.appendChild(io); so.appendChild(document.createTextNode(t.openN + ' ' + c.open)); lg.appendChild(so);
      m.appendChild(bar); m.appendChild(lg);
    });
    if (typeof cfg.onChange === 'function') { try { cfg.onChange(state, c); } catch (e) { } }
  }

  function summary() {
    var lines = ['Brainstorm answers, round ' + cfg.round + (cfg.project ? ' (' + cfg.project + ')' : '')];
    cfg.questions.forEach(function (q) {
      var v = cur(q.id), a = answerText(q, v);
      lines.push('- ' + (q.short || q.q) + ': ' + (a || 'open') + (v.conf ? ' [' + T.en.conf[v.conf] + ']' : '') + (v.note ? ' | note: ' + v.note : ''));
    });
    if (inboxLocal.length) lines.push('New ideas: ' + inboxLocal.map(function (x) { return x.text; }).join(' / '));
    return lines.join('\n');
  }
  function buildCopy() {
    $$('[data-bs-copy]').forEach(function (host) {
      host.hidden = true; var b = el('button', 'bs-btn', t.copy); b.type = 'button'; var msg = el('p', 'bs-done'); msg.hidden = true;
      var pre = document.createElement('textarea'); pre.className = 'bs-ta'; pre.rows = 6; pre.readOnly = true; pre.hidden = true; pre.id = 'bs-copy-text'; pre.setAttribute('aria-label', t.copy);
      b.addEventListener('click', function () {
        var s = summary(); pre.value = s;
        var p = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(s) : Promise.reject();
        p.then(function () { msg.hidden = false; msg.textContent = t.copied; }, function () { pre.hidden = false; pre.focus(); pre.select(); msg.hidden = false; msg.textContent = t.copyFail; });
      });
      host.appendChild(b); host.appendChild(msg); host.appendChild(pre);
    });
  }

  function buildRoundBar() {
    $$('[data-bs-roundbar]').forEach(function (host) {
      host.classList.add('bs-roundbar');
      var acts = el('div', 'bs-actions');
      var bn = el('button', 'bs-btn solid', t.next + (cfg.round + 1)); bn.type = 'button';
      var bo = el('button', 'bs-btn', cfg.officialLabel || t.official); bo.type = 'button';
      acts.appendChild(bn); acts.appendChild(bo); host.appendChild(acts);
      var conf = el('div', 'bs-confirm'); conf.hidden = true; host.appendChild(conf);
      var done = el('p', 'bs-done'); done.hidden = true; done.setAttribute('aria-live', 'polite'); host.appendChild(done);
      function ask(action) {
        conf.textContent = ''; conf.hidden = false; done.hidden = true;
        conf.appendChild(el('p', 'bs-done', action === 'next' ? t.confirmNext.replace('{n}', cfg.round + 1) : t.confirmOfficial));
        var f = el('div', 'bs-field'), l = el('label', null, t.confirmNote), ta = document.createElement('textarea');
        ta.className = 'bs-ta'; ta.rows = 2; ta.id = 'bs-roundnote-' + action; l.htmlFor = ta.id; f.appendChild(l); f.appendChild(ta); conf.appendChild(f);
        var row = el('div', 'bs-actions'), y = el('button', 'bs-btn solid', t.yes), n = el('button', 'bs-btn', t.cancel); y.type = n.type = 'button';
        n.addEventListener('click', function () { conf.hidden = true; });
        y.addEventListener('click', function () {
          persist('control/r' + cfg.round, { round: cfg.round, action: action, note: ta.value.slice(0, 2000), at: now() });
          conf.hidden = true; done.hidden = false; done.textContent = action === 'next' ? t.sentNext : t.sentOfficial;
          done.appendChild(el('code', null, action === 'next' ? t.cmdNext : t.cmdOfficial));
        });
        row.appendChild(y); row.appendChild(n); conf.appendChild(row); ta.focus();
      }
      bn.addEventListener('click', function () { ask('next'); });
      bo.addEventListener('click', function () { ask('official'); });
    });
  }

  function buildInbox() {
    $$('[data-bs-inbox]').forEach(function (host) {
      host.classList.add('bs-inbox');
      var f = el('div', 'bs-add'), inp = document.createElement('textarea'); inp.className = 'bs-ta'; inp.rows = 2; inp.id = 'bs-inbox-in'; inp.placeholder = t.inboxPh; inp.setAttribute('aria-label', t.inboxPh); inp.maxLength = 2000;
      var b = el('button', 'bs-btn solid', t.inboxAdd); b.type = 'button'; var msg = el('p', 'bs-done'); msg.hidden = true; msg.setAttribute('aria-live', 'polite');
      var ul = el('ul'); ul.id = 'bs-inbox-list';
      b.addEventListener('click', function () {
        var s = inp.value.trim(); if (!s) return; inp.value = '';
        var item = { id: 'r' + cfg.round + '-' + Date.now().toString(36), round: cfg.round, text: s.slice(0, 2000), at: now() };
        inboxLocal.push(item); persist('inbox/' + item.id, item);
        msg.hidden = false; msg.textContent = t.inboxAdded; drawInbox();
      });
      f.appendChild(inp); f.appendChild(b); host.appendChild(f); host.appendChild(msg); host.appendChild(ul); drawInbox();
    });
  }
  function drawInbox() { var ul = document.getElementById('bs-inbox-list'); if (!ul) return; ul.textContent = ''; inboxLocal.forEach(function (x) { ul.appendChild(el('li', null, x.text)); }); }

  /* ---------- connect ---------- */
  function connect() {
    var c = window.claude;
    if (!c || typeof c.use !== 'function') { mode = 'local'; setStatus('local'); return; }
    c.use('db').then(function (d) {
      if (!d) { mode = 'local'; setStatus('local'); return; }
      db = d; mode = 'db';
      db.collection('answers').where('round', '==', cfg.round).onSnapshot(function (snap) {
        var seen = {};
        snap.docs.forEach(function (doc) {
          var v = doc.data(); if (!v || !Q[v.qid]) return; seen[v.qid] = true;
          var mine = state[v.qid];
          if (mine && mine.at && (!v.at || mine.at > v.at)) { if (firstSnap) persistQ(v.qid); return; } // local edit is newer
          state[v.qid] = clean(Q[v.qid], v); render(v.qid);
        });
        if (firstSnap) cfg.questions.forEach(function (q) { if (!seen[q.id] && state[q.id] && state[q.id].at) persistQ(q.id); }); // answered before db came up
        firstSnap = false;
        saveLocal(); refresh(); if (!anyBusy()) setStatus('saved');
      }, function (e) { if (e && e.code === 'revoked') { db = null; mode = 'local'; setStatus('local'); } });
      db.collection('inbox').where('round', '==', cfg.round).onSnapshot(function (snap) {
        var remote = {}; snap.docs.forEach(function (d) { var x = d.data(); if (x && typeof x.text === 'string') remote[d.id] = { id: d.id, round: cfg.round, text: str(x.text, 2000), at: str(x.at, 40) }; });
        inboxLocal.forEach(function (x) { if (!remote[x.id]) { remote[x.id] = x; persist('inbox/' + x.id, x); } });
        inboxLocal = Object.keys(remote).map(function (k) { return remote[k]; }).sort(function (a, b) { return String(a.at).localeCompare(String(b.at)); });
        saveLocal(); drawInbox();
      }, function () { });
      setStatus('saved');
    }, function () { mode = 'local'; setStatus('local'); });
    if (cfg.ask !== false) c.use('sample').then(function (s) { if (s) { sample = s; $$('[data-bs-ask]').forEach(function (n) { n.hidden = false; }); } }, function () { });
  }

  window.BSKit = {
    init: function (config) {
      cfg = config; cfg.round = cfg.round || 1; t = T[cfg.lang] || T.en; if (cfg.strings) Object.keys(cfg.strings).forEach(function (k) { t[k] = cfg.strings[k]; });
      LS_KEY = 'bs:' + (cfg.project || 'brainstorm') + ':r' + cfg.round;
      (cfg.questions || []).forEach(function (q) { Q[q.id] = q; });
      loadLocal();
      $$('[data-bs-q]').forEach(function (slot) { var q = Q[slot.getAttribute('data-bs-q')]; if (q) buildCard(slot, q); });
      buildRoundBar(); buildInbox(); buildCopy();
      cfg.questions.forEach(function (q) { render(q.id); });
      refresh(); setStatus('connecting'); connect();
    },
    state: function () { return state; },
    summary: summary
  };
})();
