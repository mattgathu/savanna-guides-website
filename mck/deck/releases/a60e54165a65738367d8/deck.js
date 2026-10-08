// Deck controller: slide navigation plus the Trail Jury host role (opens questions, shows QR codes, reveals results).
const $ = id => document.getElementById(id);
const frame = $('frame'), stage = $('stage');
const slides = [...frame.querySelectorAll(':scope > .slide')];
const total = slides.length;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const params = new URLSearchParams(location.search);
const pinnedCode = params.get('s') ? params.get('s').toUpperCase() : null;
const hashIndex = () => { const m = /^#(\d+)$/.exec(location.hash); const n = m ? Number(m[1]) - 1 : -1; return n >= 0 && n < total ? n : null; };
let saved = 0;
try { const v = Number(localStorage.getItem('sg-mck-slide')); if (Number.isInteger(v) && v >= 0 && v < total) saved = v; } catch {}
const state = { idx: hashIndex() ?? saved, notes: false };
let toastTimer, touch, lastJury = undefined;

// Jury slides are numbered by their position in the deck, so reordering slides keeps "#N" labels correct.
slides.filter(s => s.dataset.jury).forEach((s, i) => s.querySelectorAll('[data-jury-number]').forEach(el => { el.textContent = String(i + 1); }));

function fit() {
  const scale = Math.min(stage.clientWidth / 1920, stage.clientHeight / 1080);
  frame.style.setProperty('--scale', String(Math.max(0.05, scale)));
}
function persist() { try { localStorage.setItem('sg-mck-slide', String(state.idx)); } catch {} history.replaceState(null, '', `#${state.idx + 1}`); }
function render() {
  slides.forEach((s, i) => { s.classList.toggle('current', i === state.idx); s.inert = i !== state.idx; s.setAttribute('aria-hidden', String(i !== state.idx)); });
  $('prev').disabled = state.idx === 0;
  $('next').disabled = state.idx === total - 1;
  $('counter').textContent = `${String(state.idx + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  const slide = slides[state.idx];
  $('notes-text').textContent = slide.dataset.notes || '—';
  $('reveal').hidden = !slide.dataset.reveal || slide.classList.contains('revealed');
  $('qr-toggle').hidden = !slide.querySelector('[data-qr]') || !jury.session;
  $('publish').hidden = !slide.dataset.publish;
  jury.renderPublish();
  setQrZoom(false);
  jury.onSlide(slide);
}
function setQrZoom(open) {
  const zoom = $('qr-zoom');
  if (open && !jury.session) return toast('No session yet');
  zoom.hidden = !open;
  $('qr-toggle').setAttribute('aria-pressed', String(open));
  $('qr-toggle').querySelector('span').textContent = open ? 'Close QR' : 'Big QR';
}
function go(idx) { state.idx = Math.max(0, Math.min(total - 1, idx)); setMenu(false); render(); persist(); }
function setMenu(open, restoreFocus = false) {
  $('menu').hidden = !open;
  $('menu-toggle').setAttribute('aria-expanded', String(open));
  if (open) $('copy-join').focus(); else if (restoreFocus) $('menu-toggle').focus();
}
function toast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false; toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2600); }

$('prev').addEventListener('click', () => go(state.idx - 1));
$('next').addEventListener('click', () => go(state.idx + 1));
$('menu-toggle').addEventListener('click', () => setMenu($('menu').hidden));
$('notes-toggle').addEventListener('click', () => { state.notes = !state.notes; $('notes').hidden = !state.notes; $('notes-toggle').setAttribute('aria-pressed', String(state.notes)); });
document.addEventListener('pointerdown', e => { if (!$('menu').hidden && !e.target.closest('#menu, #menu-toggle')) setMenu(false); });
document.addEventListener('keydown', e => {
  if (!$('menu').hidden) { if (e.key === 'Escape') { e.preventDefault(); setMenu(false, true); } return; }
  if (!$('qr-zoom').hidden && ['Escape', 'q', 'Q'].includes(e.key)) { e.preventDefault(); return setQrZoom(false); }
  if (e.key.toLowerCase() === 'q' && !$('qr-toggle').hidden) { e.preventDefault(); return setQrZoom(true); }
  if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input, textarea, select, [contenteditable=true]')) return;
  let next;
  if (['ArrowRight', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.target.closest('button,a'))) next = state.idx + 1;
  else if (['ArrowLeft', 'PageUp'].includes(e.key)) next = state.idx - 1;
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = total - 1;
  else if (e.key.toLowerCase() === 'r' && !$('reveal').hidden) { e.preventDefault(); $('reveal').click(); return; }
  else if (e.key.toLowerCase() === 'n') { e.preventDefault(); $('notes-toggle').click(); return; }
  else if (e.key.toLowerCase() === 's' && !$('publish').hidden) { e.preventDefault(); $('publish').click(); return; }
  if (next !== undefined) { e.preventDefault(); go(next); }
});
stage.addEventListener('touchstart', e => { touch = e.touches.length === 1 && !e.target.closest('button,a') ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }, { passive: true });
stage.addEventListener('touchcancel', () => { touch = null; });
stage.addEventListener('touchend', e => {
  const start = touch; touch = null;
  if (!start || !e.changedTouches[0]) return;
  const dx = e.changedTouches[0].clientX - start.x, dy = e.changedTouches[0].clientY - start.y;
  if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.4) go(state.idx + (dx < 0 ? 1 : -1));
}, { passive: true });
$('fullscreen').hidden = !(document.fullscreenEnabled || document.webkitFullscreenEnabled);
$('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else await (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen).call(document.documentElement);
  } catch { toast('Fullscreen isn’t available here'); }
});
window.addEventListener('hashchange', () => { const i = hashIndex(); if (i !== null && i !== state.idx) go(i); });
window.addEventListener('resize', fit);

// ---------------------------------------------------------------- Trail Jury host role
const jury = {
  core: null, sb: null, session: null, votes: [], channel: null, qr: null, sessionsChannel: null,
  async start() {
    try {
      this.core = await import('/mck/jury/jury-core.js');
      this.sb = await this.core.supabase();
    } catch (error) {
      console.warn('Trail Jury offline:', error);
      $('session').title = 'Trail Jury is offline — slides still work';
      return;
    }
    const code = pinnedCode || (await this.core.latestSession(this.sb))?.code || null;
    if (code) await this.useSession(code); else $('session').title = 'No session yet — create one on the presenter page';
    if (!pinnedCode) {
      // The deck follows the newest session created on the presenter page.
      this.sessionsChannel = this.sb.channel('deck:sessions').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sessions' }, payload => {
        if (payload.new.code !== this.core.TEST_CODE) this.useSession(payload.new.code);
      }).subscribe();
    }
  },
  async useSession(code) {
    if (this.channel) { await this.sb.removeChannel(this.channel); this.channel = null; }
    const session = await this.core.getSession(this.sb, code);
    if (!session) { toast(`No session “${code}”`); return; }
    this.session = session;
    document.querySelector('[data-session-code]').textContent = code;
    $('session').classList.add('live');
    $('host-link').href = `/mck/jury/host/?s=${encodeURIComponent(code)}`;
    this.votes = await this.core.fetchVotes(this.sb, code);
    this.channel = this.sb.channel(`deck:${code}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `code=eq.${code}` }, payload => { this.session = payload.new; this.renderPublish(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `session_code=eq.${code}` }, payload => {
        if (payload.eventType === 'DELETE') this.votes = this.votes.filter(v => v.id !== payload.old.id);
        else { this.votes = this.votes.filter(v => !(v.voter_id === payload.new.voter_id && v.question_id === payload.new.question_id)); this.votes.push(payload.new); }
        this.renderCounts();
      }).subscribe();
    await this.renderQr();
    this.renderCounts();
    const revealed = this.revealed();
    for (const s of slides) {
      s.classList.toggle('revealed', revealed.has(s.dataset.reveal));
      if (revealed.has(s.dataset.reveal)) fill[s.dataset.reveal]?.(s, this.votes, this.core);
    }
    lastJury = undefined;
    render();
    toast(`Trail Jury session ${code}`);
  },
  revealed() { try { return new Set(JSON.parse(sessionStorage.getItem(`mck-revealed:${this.session?.code}`) || '[]')); } catch { return new Set(); } },
  remember(id, on) { const set = this.revealed(); on ? set.add(id) : set.delete(id); sessionStorage.setItem(`mck-revealed:${this.session?.code}`, JSON.stringify([...set])); },
  async renderQr() {
    const url = this.core.juryUrl(this.session.code);
    try {
      this.qr ||= (await import('https://esm.sh/qrcode-generator@1.4.4')).default;
      const qr = this.qr(0, 'M'); qr.addData(url); qr.make();
      const svg = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }).replace(/fill="black"|fill="#000(000)?"/gi, 'fill="#201e1d"');
      for (const el of document.querySelectorAll('[data-qr]')) { el.innerHTML = svg; el.setAttribute('aria-label', `Scan to join the Trail Jury: ${url}`); }
      $('qr-zoom').querySelector('[data-qr-big]').innerHTML = svg;
      $('qr-zoom').querySelector('[data-join-url]').textContent = url.replace(/^https?:\/\//, '');
    } catch (error) { console.warn('QR unavailable:', error); for (const el of document.querySelectorAll('[data-qr]')) el.textContent = this.session.code; }
  },
  renderCounts() {
    for (const s of slides) {
      if (!s.dataset.jury) continue;
      const n = this.votes.filter(v => v.question_id === s.dataset.jury).length;
      let badge = s.querySelector('.vote-count');
      const anchor = s.querySelector('[data-qr]')?.parentElement;
      if (!badge && anchor) { badge = document.createElement('span'); badge.className = 'vote-count'; anchor.append(badge); }
      if (badge) { badge.textContent = `${n} voted`; badge.hidden = n === 0; }
    }
  },
  async onSlide(slide) {
    if (!this.sb || !this.session) return;
    const id = this.core.isClosed(this.session) ? null : (slide.dataset.jury || null);
    if (id === lastJury) return;
    lastJury = id;
    try { this.session = await this.core.setActiveQuestion(this.sb, this.session.code, id) || this.session; }
    catch (error) { console.warn(error); toast('Could not update the phones'); }
  },
  async reveal(slide) {
    if (!this.sb || !this.session) { toast('Trail Jury is offline — showing example numbers'); slide.classList.add('revealed'); return; }
    this.votes = await this.core.fetchVotes(this.sb, this.session.code);
    fill[slide.dataset.reveal]?.(slide, this.votes, this.core);
    slide.classList.add('revealed');
    this.remember(slide.dataset.reveal, true);
    $('reveal').hidden = true;
  },
  renderPublish() {
    const on = !!this.session?.results_published, closed = this.core?.isClosed(this.session);
    $('close-voting').textContent = closed ? 'Reopen voting' : 'Close voting (no more votes)';
    $('session').classList.toggle('closed', !!closed);
    for (const el of document.querySelectorAll('[data-publish-state]')) { el.textContent = on ? 'Results are live on every phone' : 'Results not sent yet'; el.style.background = on ? '#10540D' : '#201e1d'; }
    $('publish').querySelector('span').textContent = on ? 'Unsend results' : 'Send results';
  },
  async publish() {
    if (!this.sb || !this.session) return toast('Trail Jury is offline');
    try { this.session = await this.core.publishResults(this.sb, this.session.code, !this.session.results_published); this.renderPublish(); toast(this.session.results_published ? 'Results sent to every phone' : 'Results hidden again'); }
    catch (error) { console.warn(error); toast('Could not send results'); }
  },
  unreveal(slide) { slide.classList.remove('revealed'); this.remember(slide.dataset.reveal, false); $('reveal').hidden = !slide.dataset.reveal; }
};

const fill = {
  suffering(slide, votes, core) {
    const t = core.tally(votes, core.questionById('suffering'));
    slide.querySelector('[data-voted]').textContent = `Results · ${t.voters} hiker${t.voters === 1 ? '' : 's'} voted`;
    const best = [...t.pairs].sort((x, y) => Math.abs(y.aPct - 50) - Math.abs(x.aPct - 50))[0];
    if (best && t.voters) {
      const [win, lose] = best.aPct >= 50 ? [best.a, best.b] : [best.b, best.a];
      slide.querySelector('[data-headline]').textContent = best.aPct === 50 ? `MCK is split on ${best.a.toLowerCase()} vs ${best.b.toLowerCase()}.` : `MCK would rather ${win.toLowerCase()} than ${lose.toLowerCase()}.`;
    }
    for (const row of slide.querySelectorAll('[data-pair-row]')) {
      const [left, right] = row.dataset.pairRow.split('|');
      const p = t.pairs.find(x => (x.a === left && x.b === right) || (x.a === right && x.b === left));
      if (!p) continue;
      const leftPct = p.a === left ? p.aPct : p.bPct, rightPct = 100 - leftPct;
      const bar = row.querySelector('[data-bar-fill]'), rest = row.querySelector('[data-bar-rest]');
      bar.style.width = `${Math.max(leftPct, 8)}%`; bar.textContent = `${leftPct}%`; rest.textContent = `${rightPct}%`;
    }
  },
  summary(slide, votes, core) {
    const backpack = core.tally(votes, core.questionById('backpack'));
    const list = slide.querySelector('[data-list="backpack-top3"]');
    if (backpack.voters) list.replaceChildren(...backpack.options.slice(0, 3).map(o => { const li = document.createElement('li'); li.textContent = o.label; return li; }));
    const before = core.tally(votes, core.questionById('before-nairobi'));
    if (before.voters) slide.querySelector('[data-fill="before-nairobi-top"]').textContent = before.options[0].label;
    const diff = core.tally(votes, core.questionById('difficulty'));
    const trail = diff.trails[0];
    const dist = slide.querySelector('[data-dist]');
    if (trail?.total) dist.replaceChildren(...[...trail.levels].sort((x, y) => y.count - x.count).slice(0, 3).map(l => {
      const row = document.createElement('div'); row.style.cssText = 'display:flex;justify-content:space-between;';
      const a = document.createElement('span'); a.textContent = l.label; const b = document.createElement('span'); b.style.fontWeight = '700'; b.textContent = `${l.pct}%`;
      row.append(a, b); return row;
    }));
  },
  mapped(slide, votes, core) {
    const t = core.tally(votes, core.questionById('mapped'));
    if (!t.voters) return;
    const yes = t.options.find(o => o.label === 'Yes')?.pct ?? 0, no = 100 - yes;
    slide.querySelector('[data-fill="mapped-yes"]').textContent = `${yes}%`;
    slide.querySelector('[data-fill="mapped-no"]').textContent = `${no}%`;
    slide.querySelector('[data-split]').style.gridTemplateColumns = `${Math.max(yes, 25)}fr ${Math.max(no, 25)}fr`;
  },
  'one-thing'(slide, votes, core) {
    const t = core.tally(votes, core.questionById('one-thing'));
    if (!t.words.length) return;
    const colors = ['#10540D', '#7a8a5e', '#201e1d', '#645c50', '#1c6a18'];
    const max = t.words[0].count, min = t.words.at(-1).count;
    const cloud = slide.querySelector('[data-cloud]');
    cloud.replaceChildren(...t.words.map((w, i) => {
      const span = document.createElement('span');
      const size = max === min ? 80 : 48 + 72 * (w.count - min) / (max - min);
      span.style.cssText = `font-size:${Math.round(size)}px;color:${colors[i % colors.length]};`;
      span.textContent = w.word;
      return span;
    }));
  }
};

$('reveal').addEventListener('click', () => jury.reveal(slides[state.idx]));
$('qr-toggle').addEventListener('click', () => setQrZoom($('qr-zoom').hidden));
$('publish').addEventListener('click', () => jury.publish());
$('close-voting').addEventListener('click', async () => {
  setMenu(false, true);
  if (!jury.sb || !jury.session) return toast('Trail Jury is offline');
  try { jury.session = await jury.core.closeSession(jury.sb, jury.session.code, !jury.core.isClosed(jury.session)); lastJury = null; jury.renderPublish(); toast(jury.core.isClosed(jury.session) ? 'Voting closed' : 'Voting reopened'); }
  catch (error) { console.warn(error); toast('Could not change the session'); }
});
$('qr-zoom').addEventListener('click', () => setQrZoom(false));
frame.addEventListener('click', e => { if (e.target.closest('[data-qr]') && !e.target.closest('#qr-zoom')) setQrZoom(true); });
$('unreveal').addEventListener('click', () => { setMenu(false, true); jury.unreveal(slides[state.idx]); });
$('phones-down').addEventListener('click', async () => { setMenu(false, true); lastJury = null; if (jury.sb && jury.session) { await jury.core.setActiveQuestion(jury.sb, jury.session.code, null); toast('Phones down'); } });
$('copy-join').addEventListener('click', async () => {
  setMenu(false, true);
  if (!jury.session) return toast('No session yet');
  const url = jury.core.juryUrl(jury.session.code);
  try { await navigator.clipboard.writeText(url); toast('Phone link copied'); } catch { toast(url); }
});

fit(); render(); persist();
jury.start();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/mck/deck/sw.js', { scope: '/mck/deck/', updateViaCache: 'none' })
    .then(() => navigator.serviceWorker.ready)
    .then(() => { document.documentElement.dataset.offlineReady = 'true'; })
    .catch(error => console.warn('Deck offline installation failed:', error));
}
