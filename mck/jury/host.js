// Presenter page: backup remote for the deck. Creates sessions, opens questions, shows live tallies.
import { QUESTIONS, supabase, getSession, latestSession, createSession, setActiveQuestion, fetchVotes, tally, juryUrl, newCode, TEST_CODE, DECK_ROUTE } from './jury-core.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let toastTimer; const toast = m => { const t = $('toast'); clearTimeout(toastTimer); t.textContent = m; t.hidden = false; toastTimer = setTimeout(() => { t.hidden = true; }, 2600); };
const H = { sb: null, code: null, session: null, votes: [], channel: null, connected: 0, qr: null };

(async function boot() {
  H.sb = await supabase();
  const want = new URLSearchParams(location.search).get('s')?.toUpperCase();
  await loadSessions();
  const code = want || (await latestSession(H.sb))?.code || TEST_CODE;
  await use(code);
})();

async function loadSessions() {
  const { data } = await H.sb.from('sessions').select('code, created_at').order('created_at', { ascending: false }).limit(15);
  const list = data || [];
  if (!list.some(s => s.code === TEST_CODE)) list.push({ code: TEST_CODE, created_at: null });
  $('session-select').innerHTML = list.map(s => `<option value="${esc(s.code)}">${esc(s.code)}${s.code === TEST_CODE ? ' · rehearsal' : s.created_at ? ` · ${new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}</option>`).join('');
}
async function use(code) {
  if (H.channel) { await H.sb.removeChannel(H.channel); H.channel = null; }
  let session = await getSession(H.sb, code);
  if (!session && code === TEST_CODE) { try { session = await createSession(H.sb, TEST_CODE); } catch {} }
  if (!session) { toast(`No session “${code}” — run supabase/schema.sql, then reload`); renderAll(); return; }
  H.code = code; H.session = session;
  $('session-select').value = code;
  history.replaceState(null, '', `?s=${encodeURIComponent(code)}`);
  $('join-link').textContent = juryUrl(code).replace(/^https?:\/\//, ''); $('join-link').href = juryUrl(code);
  $('deck-link').href = `${DECK_ROUTE}?s=${encodeURIComponent(code)}`;
  H.votes = await fetchVotes(H.sb, code);
  H.channel = H.sb.channel(`jury:${code}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `session_code=eq.${code}` }, p => {
      if (p.eventType === 'DELETE') H.votes = H.votes.filter(v => v.id !== p.old.id);
      else { H.votes = H.votes.filter(v => !(v.voter_id === p.new.voter_id && v.question_id === p.new.question_id)); H.votes.push(p.new); }
      renderAll();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `code=eq.${code}` }, p => { H.session = p.new; renderQuestions(); })
    .on('presence', { event: 'sync' }, () => { H.connected = Object.keys(H.channel.presenceState()).length; $('connected').textContent = String(H.connected); })
    .subscribe();
  renderQr(); renderAll();
}
async function renderQr() {
  try {
    H.qr ||= (await import('https://esm.sh/qrcode-generator@1.4.4')).default;
    const qr = H.qr(0, 'M'); qr.addData(juryUrl(H.code)); qr.make();
    $('qr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }).replace(/fill="black"|fill="#000(000)?"/gi, 'fill="#201e1d"');
  } catch { $('qr').textContent = H.code; }
}
function renderAll() { renderQuestions(); renderResults(); }
function renderQuestions() {
  const active = H.session?.active_question, opened = H.session?.opened || [];
  $('questions').innerHTML = QUESTIONS.map((q, i) => {
    const n = H.votes.filter(v => v.question_id === q.id).length;
    return `<li><button type="button" data-open="${q.id}" class="${active === q.id ? 'active' : opened.includes(q.id) ? 'opened' : ''}" aria-pressed="${active === q.id}"><span class="n">${i + 1}</span><span>${esc(q.label)}</span><span class="c">${n ? `${n} voted` : opened.includes(q.id) ? 'opened' : ''}</span></button></li>`;
  }).join('');
}
function renderResults() {
  $('results').innerHTML = QUESTIONS.map((q, i) => `<article class="card-r"><div class="head"><span class="n">${i + 1}</span><span class="muted small">${esc(q.label)}</span><span class="muted small" style="margin-left:auto">${tally(H.votes, q).voters} voted</span></div>${body(q, tally(H.votes, q))}</article>`).join('');
}
const bar = (label, pct, right = `${pct}%`, alt = false) => `<div class="bar-row"><div class="lbl"><b>${esc(label)}</b><span>${esc(right)}</span></div><div class="track"><div class="fill ${alt ? 'alt' : ''}" style="width:${Math.max(pct, 0)}%">${pct}%</div></div></div>`;
function body(q, t) {
  if (!t.voters) return `<p class="empty">No votes yet.</p>`;
  switch (q.type) {
    case 'pair': { const best = [...t.pairs].sort((a, b) => Math.abs(b.aPct - 50) - Math.abs(a.aPct - 50))[0]; const [w, l] = best.aPct >= 50 ? [best.a, best.b] : [best.b, best.a];
      return `<h3>MCK would rather ${esc(w.toLowerCase())} than ${esc(l.toLowerCase())}.</h3><div class="bars">${t.pairs.map(p => `<div class="bar-row"><div class="lbl"><b>${esc(p.a)}</b><span>${esc(p.b)}</span></div><div class="split"><span style="flex:${Math.max(p.aPct, 6)};background:var(--brand)">${p.aPct}%</span><span style="flex:${Math.max(p.bPct, 6)};background:var(--sage)">${p.bPct}%</span></div></div>`).join('')}</div>`; }
    case 'choose': return `<h3>${esc(t.options[0].label)}</h3><div class="bars">${t.options.filter(o => o.count).map(o => bar(o.label, o.pct, `${o.count}`)).join('')}</div>`;
    case 'swipe': { const best = [...t.hikes].sort((a, b) => b.yesPct - a.yesPct)[0];
      return `<h3>${esc(best.name)} won the room.</h3><div class="bars">${t.hikes.map(h => bar(h.name, h.yesPct, `${h.yes} in · ${h.no} nope`)).join('')}</div>`; }
    case 'scale': return t.trails.map(tr => `<h3>${esc(tr.name)}</h3><div class="bars">${tr.levels.filter(l => l.count).map(l => `<div class="bar-row"><div class="lbl"><b>${esc(l.label)}</b><span>${l.count}</span></div><div class="track"><div class="fill" style="width:${l.pct}%;background:${l.color}">${l.pct}%</div></div></div>`).join('')}</div>`).join('');
    case 'rank': return `<h3>${esc(t.options[0].label)} first.</h3><div class="bars">${t.options.map(o => bar(o.label, Math.round(100 * o.score / (t.voters * q.options.length)), `${o.firsts} ranked it first`)).join('')}</div>`;
    case 'points': return `<h3>${esc(t.options[0].label)} took the biggest share.</h3><div class="bars">${t.options.filter(o => o.points).map(o => bar(o.label, o.pct, `${o.points} pts`)).join('')}</div>`;
    case 'slider': return `<h3>${t.mean >= 60 ? 'The room agrees' : t.mean < 40 ? 'The room disagrees' : 'The room is on the fence'}: ${t.mean} / 100.</h3><div class="split"><span style="flex:${Math.max(t.disagree, 1)};background:var(--terracotta)">${t.disagree}</span><span style="flex:${Math.max(t.fence, 1)};background:var(--amber)">${t.fence}</span><span style="flex:${Math.max(t.agree, 1)};background:var(--brand)">${t.agree}</span></div><div class="lbl muted small" style="display:flex;justify-content:space-between"><span>Disagree</span><span>Fence</span><span>Agree</span></div>`;
    case 'text': { const max = t.words[0]?.count || 1;
      return `<div class="words">${t.words.map((w, i) => `<span style="font-size:${Math.round(18 + 30 * w.count / max)}px;color:${['#10540D', '#7a8a5e', '#201e1d', '#645c50', '#1c6a18'][i % 5]}">${esc(w.word)}</span>`).join('')}</div><ul class="answers">${t.answers.slice(-30).reverse().map(a => `<li>${esc(a)}</li>`).join('')}</ul>`; }
  }
  return '';
}

$('questions').addEventListener('click', async e => {
  const b = e.target.closest('[data-open]'); if (!b) return;
  const id = b.dataset.open === H.session?.active_question ? null : b.dataset.open;
  try { H.session = await setActiveQuestion(H.sb, H.code, id); renderQuestions(); toast(id ? 'Question is live on the phones' : 'Phones down'); } catch (err) { console.error(err); toast('Could not update the session'); }
});
$('phones-down').addEventListener('click', async () => { H.session = await setActiveQuestion(H.sb, H.code, null); renderQuestions(); toast('Phones down'); });
$('session-select').addEventListener('change', e => use(e.target.value));
$('new-session').addEventListener('click', async () => {
  try { const s = await createSession(H.sb, newCode()); await loadSessions(); await use(s.code); toast(`New session ${s.code} — the deck follows it automatically`); }
  catch (err) { console.error(err); toast('Could not create a session'); }
});
$('copy-link').addEventListener('click', async () => { try { await navigator.clipboard.writeText(juryUrl(H.code)); toast('Link copied'); } catch { toast(juryUrl(H.code)); } });
