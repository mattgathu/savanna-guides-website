// Phone app. One voter per device per session; answers upsert into votes.
import { QUESTIONS, PERSONAS, questionById, supabase, getSession, normalizeCode, TEST_CODE, fetchVotes, tally, isClosed } from './jury-core.js';

const app = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = { get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
let toastTimer;
const toast = m => { const t = document.getElementById('toast'); clearTimeout(toastTimer); t.textContent = m; t.hidden = false; toastTimer = setTimeout(() => { t.hidden = true; }, 2600); };

const S = {
  sb: null, code: null, session: null, voter: null, answered: new Set(), channel: null,
  screen: 'loading', q: null, votes: [], step: 0, picks: [], order: [], points: {}, swipes: {}, ratings: {}, slider: 50, text: '',
  name: '', personas: [], drag: { x: 0, on: false, startX: 0, fly: null, half: 0 }, pairTap: 0, doneTimer: null, codeError: ''
};

// ------------------------------------------------------------------ boot
if (new URLSearchParams(location.search).has('debug')) window.__tj = { S, openQuestion: q => openQuestion(typeof q === 'string' ? questionById(q) : q), render, QUESTIONS };
(async function boot() {
  const url = new URLSearchParams(location.search);
  const code = normalizeCode(url.get('s')) || store.get('tj:last-code');
  try { S.sb = await supabase(); } catch (e) { console.error(e); return render(fatal('Trail Jury can’t reach the server right now. Check your connection and reload.')); }
  if (!code) { S.screen = 'code'; return render(); }
  await enter(code);
})();

async function enter(code) {
  S.session = await getSession(S.sb, code);
  if (!S.session) { S.screen = 'code'; S.codeError = `No session “${code}”. Check the code on the screen.`; return render(); }
  S.code = code; store.set('tj:last-code', code);
  history.replaceState(null, '', `?s=${encodeURIComponent(code)}`);
  const voter = store.get(`tj:voter:${code}`);
  if (S.session.results_published && !voter) return showResults(); // latecomer scanning the results QR
  if (isClosed(S.session) && !voter) { S.screen = 'closed'; return render(); }
  if (voter) { S.voter = voter; await afterJoin(); } else { S.screen = 'join'; render(); }
}
async function showResults() {
  S.screen = 'results';
  render();
  S.votes = await fetchVotes(S.sb, S.code);
  render();
  if (S.voter) return; // joined voters already follow the session channel
  S.channel ||= S.sb.channel(`jury:${S.code}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `code=eq.${S.code}` }, p => { S.session = p.new; if (!p.new.results_published) { S.screen = 'wait'; sync(); } })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `session_code=eq.${S.code}` }, async () => { S.votes = await fetchVotes(S.sb, S.code); if (S.screen === 'results') render(); })
    .subscribe();
}

async function afterJoin() {
  const { data } = await S.sb.from('votes').select('question_id').eq('session_code', S.code).eq('voter_id', S.voter.id);
  S.answered = new Set((data || []).map(r => r.question_id));
  S.channel = S.sb.channel(`jury:${S.code}`, { config: { presence: { key: S.voter.id } } })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `code=eq.${S.code}` }, payload => { S.session = payload.new; if (payload.new.results_published) return showResults(); sync(); })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'sessions', filter: `code=eq.${S.code}` }, () => { S.screen = 'code'; S.codeError = 'That session was closed.'; render(); })
    .subscribe(async status => { if (status === 'SUBSCRIBED') await S.channel.track({ name: S.voter.name, personas: S.voter.personas, at: Date.now() }); });
  sync();
}

// Decide what the phone should show from the session state. Catch-up: missed opened questions queue after the active one.
function sync() {
  if (S.session?.results_published) { clearTimeout(S.doneTimer); return showResults(); }
  if (isClosed(S.session)) { clearTimeout(S.doneTimer); S.screen = 'closed'; return render(); }
  if (S.screen === 'results') S.screen = 'wait';
  if (S.screen === 'question' || S.screen === 'done') return; // never interrupt an answer in progress
  const next = nextQuestion();
  if (next) openQuestion(next); else { S.screen = 'wait'; render(); }
}
function nextQuestion() {
  const opened = S.session?.opened || [], active = S.session?.active_question;
  if (active && !S.answered.has(active) && questionById(active)) return questionById(active);
  const missed = QUESTIONS.filter(q => opened.includes(q.id) && !S.answered.has(q.id));
  return missed[0] || null;
}
function openQuestion(q) {
  clearTimeout(S.doneTimer);
  Object.assign(S, { screen: 'question', q, step: 0, picks: [], order: [], points: {}, swipes: {}, ratings: {}, slider: 50, text: '', pairTap: 0, drag: { x: 0, on: false, startX: 0, fly: null, half: 0 } });
  render();
}
async function submit(answer) {
  const q = S.q;
  if (!S.sb || !S.voter) { console.log('debug submit', q.id, answer); S.answered.add(q.id); S.screen = 'done'; render(); return; }
  S.screen = 'saving'; render();
  const { error } = await S.sb.from('votes').upsert({ session_code: S.code, voter_id: S.voter.id, question_id: q.id, answer }, { onConflict: 'session_code,voter_id,question_id' });
  if (error) { console.error(error); if (isClosed(S.session) || /policy|row-level/i.test(error.message || '')) { S.screen = 'closed'; return render(); } toast('Could not save — try again'); S.screen = 'question'; return render(); }
  S.answered.add(q.id);
  S.screen = 'done'; render();
  S.doneTimer = setTimeout(() => { S.screen = 'wait'; sync(); }, 2200);
}

// ------------------------------------------------------------------ rendering
function render(html) {
  app.innerHTML = html || views[S.screen]?.() || '';
  if (S.screen === 'question' && S.q.type === 'text') app.querySelector('textarea')?.focus({ preventScroll: true });
}
const fatal = m => `<section class="screen center"><span class="kicker">Trail Jury</span><h1 class="display">Hmm.</h1><p class="muted">${esc(m)}</p></section>`;
const progress = (n, i) => `<div class="progress" aria-hidden="true">${Array.from({ length: n }, (_, k) => `<i class="${k < i ? 'done' : k === i ? 'now' : ''}"></i>`).join('')}</div>`;
const header = q => `<div class="row"><span class="tag">Trail jury</span><span class="muted small">${esc(q.hint)}</span></div><h2 class="display">${esc(q.title)}</h2>`;
const juryCount = () => `${S.answered.size} of ${QUESTIONS.length} answered`;

const views = {
  code: () => `<section class="screen" style="justify-content:center">
    <span class="kicker">MCK × Savanna Guides</span>
    <h1 class="display">Tonight you're the jury.</h1>
    <p class="muted">Type the session code shown on the screen, or scan the QR code again.</p>
    <form id="code-form" style="display:flex;flex-direction:column;gap:12px">
      <input class="input" name="code" inputmode="text" autocapitalize="characters" autocomplete="off" maxlength="6" placeholder="Session code" aria-label="Session code" style="text-align:center;font-family:var(--display);letter-spacing:0.3em;font-size:24px">
      ${S.codeError ? `<p class="muted small" style="color:var(--rust)">${esc(S.codeError)}</p>` : ''}
      <button class="btn" type="submit">Join</button>
    </form></section>`,
  join: () => `<section class="screen">
    <div style="display:flex;flex-direction:column;gap:8px">
      <span class="kicker">MCK × Savanna Guides · ${esc(S.code)}</span>
      <h1 class="display">Tonight you're the jury.</h1>
      <p class="muted">No login. Questions appear here when the speaker opens them.</p>
    </div>
    <input id="name" class="input" value="${esc(S.name)}" maxlength="40" placeholder="Trail name (optional)" aria-label="Your name">
    <div style="display:flex;flex-direction:column;gap:10px;flex:1">
      <span style="font-size:14px;font-weight:600">Which sounds most like you? <span class="muted" style="font-weight:400">Pick up to two.</span></span>
      <div class="personas">${PERSONAS.map(([n, quote]) => `<button class="persona ${S.personas.includes(n) ? 'on' : ''}" data-persona="${esc(n)}" aria-pressed="${S.personas.includes(n)}"><b>${esc(n)}</b><span>${esc(quote)}</span></button>`).join('')}</div>
    </div>
    <button class="btn" data-action="join">Join the jury</button></section>`,
  wait: () => `<section class="screen center">
    <span class="pulse" aria-hidden="true"><i></i></span>
    <div style="display:flex;flex-direction:column;gap:8px">
      <h2 class="display" style="font-size:30px">${S.answered.size ? 'Phones down.' : 'You\'re in.'}</h2>
      <p class="muted" style="max-width:260px">${S.answered.size ? 'The next question appears here when the speaker opens it.' : 'Eyes up front — the first question comes when the speaker opens it.'}</p>
    </div>
    <span class="chip">${esc(S.voter?.name || 'Juror')} · ${juryCount()}</span></section>`,
  closed: () => `<section class="screen center">
    <span class="check" aria-hidden="true" style="background:var(--ink)">✓</span>
    <div style="display:flex;flex-direction:column;gap:8px"><h2 class="display" style="font-size:30px">Voting is closed.</h2>
    <p class="muted" style="max-width:280px">The jury has spoken. Results land here when the speaker sends them.</p></div>
    <span class="chip">${S.voter ? juryCount() : esc(S.code)}</span></section>`,
  saving: () => `<section class="screen center"><span class="spinner" aria-hidden="true"></span><p class="muted">Locking it in…</p></section>`,
  done: () => `<section class="screen center">
    <span class="check" aria-hidden="true">✓</span>
    <div style="display:flex;flex-direction:column;gap:8px"><h2 class="display" style="font-size:30px">Vote recorded</h2>
    <p class="muted" style="max-width:260px">Results stay hidden until the finale, so nobody gets swayed by the room.</p></div>
    <span class="chip">${juryCount()}</span></section>`,
  question: () => `<section class="screen">${header(S.q)}${bodies[S.q.type]()}</section>`,
  results: () => `<section class="screen" style="gap:14px">
    <div style="display:flex;flex-direction:column;gap:8px">
      <span class="kicker">MCK × Savanna Guides · ${esc(S.code)}</span>
      <h1 class="display" style="font-size:30px">What the jury said.</h1>
      <p class="muted">${S.votes.length ? `${new Set(S.votes.map(v => v.voter_id)).size} hikers voted tonight.` : 'Loading the verdict…'}</p>
    </div>
    ${QUESTIONS.map((q, i) => resultCard(q, i, tally(S.votes, q))).join('')}
    <p class="muted small" style="text-align:center;padding:12px 0">Thanks for being the jury. savannaguides.com/app</p></section>`
};
const rbar = (label, pct, right) => `<div class="rbar"><div class="rlbl"><b>${esc(label)}</b><span>${esc(right ?? pct + '%')}</span></div><div class="rtrack"><div class="rfill" style="width:${Math.max(pct, 3)}%"></div></div></div>`;
function resultCard(q, i, t) {
  let body = '<p class="muted small" style="margin:0">No votes.</p>';
  if (t.voters) switch (q.type) {
    case 'pair': body = t.pairs.map(p => `<div class="rbar"><div class="rlbl"><b>${esc(p.a)}</b><span>${esc(p.b)}</span></div><div class="rsplit"><span style="flex:${Math.max(p.aPct, 8)}">${p.aPct}%</span><span class="alt" style="flex:${Math.max(p.bPct, 8)}">${p.bPct}%</span></div></div>`).join(''); break;
    case 'choose': body = t.options.filter(o => o.count).slice(0, 5).map(o => rbar(o.label, o.pct)).join(''); break;
    case 'swipe': body = [...t.hikes].sort((a, b) => b.yesPct - a.yesPct).map(h => rbar(h.name, h.yesPct, `${h.yesPct}% in`)).join(''); break;
    case 'scale': body = t.trails.map(tr => `<div class="rsub">${esc(tr.name)}</div>` + tr.levels.filter(l => l.count).map(l => rbar(l.label, l.pct)).join('')).join(''); break;
    case 'rank': body = t.options.map((o, k) => rbar(`${k + 1}. ${o.label}`, Math.round(100 * o.score / (t.voters * q.options.length)), `${o.firstPct}% first`)).join(''); break;
    case 'points': body = t.options.filter(o => o.points).slice(0, 5).map(o => rbar(o.label, o.pct)).join(''); break;
    case 'slider': body = `<div class="rbig">${t.mean} / 100</div><p class="muted small" style="margin:0">${t.mean >= 60 ? 'The room agrees.' : t.mean < 40 ? 'The room disagrees.' : 'The room is on the fence.'} ${t.agree} agree · ${t.fence} fence · ${t.disagree} disagree</p>`; break;
    case 'text': { const max = t.words[0]?.count || 1; body = `<div class="rwords">${t.words.map(w => `<span style="font-size:${Math.round(14 + 18 * w.count / max)}px">${esc(w.word)}</span>`).join('')}</div>`; break; }
  }
  return `<article class="rcard"><div class="rhead"><span class="rnum">${i + 1}</span><span>${esc(q.label)}</span><span class="muted small" style="margin-left:auto">${t.voters}</span></div>${body}</article>`;
}

const cardStyle = () => {
  const x = S.drag.fly ?? S.drag.x;
  const bg = x > 0 ? `color-mix(in oklch, #dfe9d6 ${Math.min(100, x / 1.4)}%, #fff)` : `color-mix(in oklch, #f3d9c8 ${Math.min(100, -x / 1.4)}%, #fff)`;
  const shadow = x > 30 ? `0 12px 32px rgba(16,84,13,${Math.min(0.45, x / 300)})` : x < -30 ? `0 12px 32px rgba(198,113,57,${Math.min(0.45, -x / 300)})` : '0 12px 32px rgba(46,43,37,0.18)';
  return `transform:translateX(${x}px) rotate(${x / 18}deg);background:${bg};box-shadow:${shadow}`;
};
const bodies = {
  pair() {
    const q = S.q, [a, b] = q.pairs[S.step], x = S.drag.fly ?? S.drag.x;
    const aOn = x < -30 || S.pairTap === -1, bOn = x > 30 || S.pairTap === 1;
    return `${progress(q.pairs.length, S.step)}
      <div class="deck"><div class="card ${S.drag.on ? 'dragging' : ''}" data-card="pair" style="${cardStyle().replace(/background:[^;]+;/, 'background:#fff;')}">
        <button class="half ${aOn ? 'on' : ''}" data-half="-1">${esc(a)}</button><span class="vs">vs</span><button class="half ${bOn ? 'on' : ''}" data-half="1">${esc(b)}</button>
      </div></div>
      <p class="muted small" style="text-align:center">Tap the one you'd rather suffer</p>`;
  },
  swipe() {
    const q = S.q, h = q.hikes[S.step], x = S.drag.fly ?? S.drag.x;
    return `${progress(q.hikes.length, S.step)}
      <div class="deck"><div class="card ${S.drag.on ? 'dragging' : ''}" data-card="swipe" style="${cardStyle()}">
        <img class="hike-photo" src="${esc(h.image)}" alt="" draggable="false">
        <div class="row"><span class="name">${esc(h.name)}</span><span class="muted small">${esc(h.place)}</span></div>
        <div class="stats"><div class="stat"><small>Distance</small><b>${esc(h.km)}</b></div><div class="stat"><small>Time</small><b>${esc(h.time)}</b></div><div class="stat"><small>Rating</small><b style="color:${h.dot}">${esc(h.rating)}</b></div></div>
        <ul class="facts">${h.facts.map(([t, c]) => `<li><i style="background:${c}"></i><span>${esc(t)}</span></li>`).join('')}</ul>
        <span class="stamp no" style="opacity:${Math.min(1, Math.max(0, -x / 80))}">Nope</span><span class="stamp yes" style="opacity:${Math.min(1, Math.max(0, x / 80))}">I'm in</span>
      </div></div>
      <div class="pair-actions"><button class="btn ghost" data-swipe="-1">← Nope</button><button class="btn" data-swipe="1">I'm in →</button></div>`;
  },
  choose() {
    const q = S.q, ready = S.picks.length > 0;
    return `${q.intro ? `<p class="intro">${esc(q.intro)}</p>` : ''}
      <div class="options ${q.big ? 'big' : ''}">${q.options.map(o => `<button class="opt ${S.picks.includes(o) ? 'on' : ''}" data-pick="${esc(o)}" aria-pressed="${S.picks.includes(o)}">${esc(o)}</button>`).join('')}</div>
      <button class="btn ${ready ? '' : 'off'}" data-action="submit" ${ready ? '' : 'aria-disabled="true"'}>Lock it in</button>`;
  },
  rank() {
    const q = S.q, ready = S.order.length === q.options.length;
    return `<div class="rank">${q.options.map(o => { const i = S.order.indexOf(o); return `<button class="opt ${i >= 0 ? 'on' : ''}" data-rank="${esc(o)}"><span class="num">${i >= 0 ? i + 1 : ''}</span><span style="flex:1">${esc(o)}</span></button>`; }).join('')}</div>
      <p class="muted small" style="margin:0">${ready ? 'Tap one to change your mind.' : `${S.order.length} of ${q.options.length} ranked`}</p>
      <button class="btn ${ready ? '' : 'off'}" data-action="submit" ${ready ? '' : 'aria-disabled="true"'}>Lock it in</button>`;
  },
  points() {
    const q = S.q, spent = Object.values(S.points).reduce((a, b) => a + b, 0), left = 100 - spent, step = q.step || 10;
    return `<div class="budget-head"><span>Points left in your backpack</span><b class="${left === 0 ? 'full' : ''}">${left}</b></div>
      <div class="budget">${q.options.map(o => { const v = S.points[o] || 0; return `<div class="item ${v ? 'on' : ''}"><span>${esc(o)}</span><button class="step" data-dec="${esc(o)}" aria-label="Remove ${step} from ${esc(o)}" ${v ? '' : 'disabled'}>−</button><b>${v}</b><button class="step plus" data-inc="${esc(o)}" aria-label="Add ${step} to ${esc(o)}" ${left >= step ? '' : 'disabled'}>+</button></div>`; }).join('')}</div>
      <button class="btn ${left === 0 ? '' : 'off'}" data-action="submit" ${left === 0 ? '' : 'aria-disabled="true"'}>${left === 0 ? 'Lock it in' : `Spend ${left} more`}</button>`;
  },
  scale() {
    const q = S.q, t = q.trails[S.step], pick = S.ratings[t.id], last = S.step === q.trails.length - 1;
    return `${progress(q.trails.length, S.step)}
      <div class="prompt"><b>Trail ${S.step + 1} of ${q.trails.length} · ${esc(t.name)}</b><span>${esc(t.prompt)}</span></div>
      <div class="scale">${q.scale.map(([label, color]) => `<button class="opt ${pick === label ? 'on' : ''}" data-rate="${esc(label)}" aria-pressed="${pick === label}"><i style="background:${color}"></i><span>${esc(label)}</span></button>`).join('')}</div>
      <button class="btn ${pick ? '' : 'off'}" data-action="scale-next" ${pick ? '' : 'aria-disabled="true"'}>${last ? 'Lock it in' : 'Next trail'}</button>`;
  },
  slider() {
    const v = S.slider, label = v < 20 ? 'Strongly disagree' : v < 40 ? 'Disagree' : v < 60 ? 'On the fence' : v < 80 ? 'Agree' : 'Strongly agree';
    return `<div style="flex:1;display:flex;flex-direction:column;gap:18px;justify-content:center">
      <div class="take">“${esc(S.q.take)}”</div>
      <div><input id="slider" type="range" min="0" max="100" value="${v}" aria-label="How much do you agree"><div class="row muted small"><span>Strongly disagree</span><span>Strongly agree</span></div></div>
      <div class="slider-label">${label}</div></div>
      <button class="btn" data-action="submit">Lock it in</button>`;
  },
  text() {
    const ready = S.text.trim().length > 0;
    return `<textarea id="text" class="input" maxlength="200" placeholder="One or two words is perfect." aria-label="Your answer">${esc(S.text)}</textarea>
      <button class="btn ${ready ? '' : 'off'}" data-action="submit" ${ready ? '' : 'aria-disabled="true"'}>Lock it in</button>`;
  }
};

// ------------------------------------------------------------------ interaction
app.addEventListener('submit', async e => {
  if (e.target.id !== 'code-form') return;
  e.preventDefault();
  const code = normalizeCode(new FormData(e.target).get('code'));
  if (code.length < 3) { S.codeError = 'Codes have 4 letters.'; return render(); }
  S.codeError = ''; await enter(code);
});
app.addEventListener('input', e => {
  if (e.target.id === 'name') S.name = e.target.value;
  if (e.target.id === 'text') { S.text = e.target.value; const b = app.querySelector('[data-action="submit"]'); if (b) { const ready = S.text.trim().length > 0; b.classList.toggle('off', !ready); b.toggleAttribute('aria-disabled', !ready); } }
  if (e.target.id === 'slider') { S.slider = Number(e.target.value); app.querySelector('.slider-label').textContent = S.slider < 20 ? 'Strongly disagree' : S.slider < 40 ? 'Disagree' : S.slider < 60 ? 'On the fence' : S.slider < 80 ? 'Agree' : 'Strongly agree'; }
});
app.addEventListener('click', async e => {
  const el = e.target.closest('[data-persona],[data-action],[data-pick],[data-rank],[data-inc],[data-dec],[data-rate],[data-swipe]');
  if (!el) return;
  const d = el.dataset, q = S.q;
  if (d.persona) { S.personas = S.personas.includes(d.persona) ? S.personas.filter(p => p !== d.persona) : [...S.personas, d.persona].slice(-2); return render(); }
  if (d.action === 'join') return join();
  if (d.pick) { S.picks = S.picks.includes(d.pick) ? S.picks.filter(p => p !== d.pick) : q.multi ? [...S.picks, d.pick] : [d.pick]; return render(); }
  if (d.rank) { S.order = S.order.includes(d.rank) ? S.order.filter(o => o !== d.rank) : [...S.order, d.rank]; return render(); }
  if (d.inc || d.dec) {
    const k = d.inc || d.dec, step = q.step || 10, spent = Object.values(S.points).reduce((a, b) => a + b, 0);
    if (d.inc && spent + step <= 100) S.points[k] = (S.points[k] || 0) + step;
    if (d.dec) S.points[k] = Math.max(0, (S.points[k] || 0) - step);
    return render();
  }
  if (d.rate) { S.ratings[q.trails[S.step].id] = d.rate; return render(); }
  if (d.swipe) return fly(Number(d.swipe));
  if (d.action === 'scale-next') {
    if (!S.ratings[q.trails[S.step].id]) return;
    if (S.step + 1 < q.trails.length) { S.step++; return render(); }
    return submit({ ratings: S.ratings });
  }
  if (d.action === 'submit') {
    if (el.getAttribute('aria-disabled') === 'true') return;
    if (q.type === 'choose') return submit({ picks: S.picks });
    if (q.type === 'rank') return submit({ order: S.order });
    if (q.type === 'points') return submit({ points: S.points });
    if (q.type === 'slider') return submit({ value: S.slider });
    if (q.type === 'text') return submit({ text: S.text.trim().slice(0, 200) });
  }
});
async function join() {
  const name = S.name.trim().slice(0, 40);
  const { data, error } = await S.sb.from('voters').insert({ session_code: S.code, name, personas: S.personas }).select().single();
  if (error) { console.error(error); return toast('Could not join — try again'); }
  S.voter = { id: data.id, name, personas: S.personas };
  store.set(`tj:voter:${S.code}`, S.voter);
  await afterJoin();
}

// Cards: drag to swipe; a press-and-release without movement on a pair half counts as a tap.
app.addEventListener('pointerdown', e => {
  const card = e.target.closest('[data-card]'); if (!card) return;
  const half = e.target.closest('[data-half]');
  S.drag = { on: true, x: 0, startX: e.clientX, fly: null, half: half ? Number(half.dataset.half) : 0 };
  card.setPointerCapture?.(e.pointerId);
  card.classList.add('dragging');
});
app.addEventListener('pointermove', e => {
  if (!S.drag.on) return;
  S.drag.x = e.clientX - S.drag.startX;
  paintCard();
});
const endDrag = () => {
  if (!S.drag.on) return;
  const x = S.drag.x, half = S.drag.half; S.drag.on = false;
  if (x > 110) fly(1); else if (x < -110) fly(-1);
  else if (Math.abs(x) < 8 && half && S.q.type === 'pair') tapPair(half);
  else { S.drag.x = 0; render(); }
};
app.addEventListener('pointerup', endDrag);
app.addEventListener('pointercancel', endDrag);
function paintCard() {
  const card = app.querySelector('[data-card]'); if (!card) return;
  const x = S.drag.fly ?? S.drag.x;
  if (S.q.type === 'swipe') { card.style.cssText = cardStyle(); card.querySelector('.stamp.no').style.opacity = Math.min(1, Math.max(0, -x / 80)); card.querySelector('.stamp.yes').style.opacity = Math.min(1, Math.max(0, x / 80)); }
  else { card.style.transform = `translateX(${x}px) rotate(${x / 18}deg)`; card.querySelector('[data-half="-1"]').classList.toggle('on', x < -30); card.querySelector('[data-half="1"]').classList.toggle('on', x > 30); }
}
function tapPair(dir) {
  if (S.drag.fly != null) return;
  S.pairTap = dir; S.drag.x = 0; render();
  setTimeout(() => { S.pairTap = 0; fly(dir); }, 180);
}
function fly(dir) {
  if (S.drag.fly != null) return;
  const q = S.q, items = q.type === 'pair' ? q.pairs : q.hikes;
  if (q.type === 'pair') S.picks[S.step] = q.pairs[S.step][dir < 0 ? 0 : 1];
  else S.swipes[q.hikes[S.step].id] = dir > 0 ? 'yes' : 'no';
  S.drag.on = false; S.drag.fly = dir * 600;
  const card = app.querySelector('[data-card]'); if (card) { card.classList.remove('dragging'); paintCard(); }
  setTimeout(() => {
    S.drag = { x: 0, on: false, startX: 0, fly: null, half: 0 };
    if (S.step + 1 >= items.length) return q.type === 'pair' ? submit({ picks: S.picks }) : submit({ swipes: S.swipes });
    S.step++; render();
    const next = app.querySelector('[data-card]'); if (next) { next.classList.add('dragging'); requestAnimationFrame(() => next.classList.remove('dragging')); }
  }, 320);
}
