// Shared by /mck/jury/ (phones), /mck/jury/host/ (presenter) and /mck/deck/ (slides).
// One Supabase project, one question list, one tally implementation.
export const SUPABASE_URL = 'https://lxqegcosswltvwznxmuf.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_XNrn4tmkrBIwZH9mKMV0Ww_GQqblmDV';
export const JURY_ROUTE = '/mck/jury/';
export const DECK_ROUTE = '/mck/deck/';
export const TEST_CODE = 'TEST';

const SCALE = [['Easy', '#7a8a5e'], ['Moderate', '#d9a441'], ['Hard', '#c67139'], ['Very hard', '#8c2f2f'], ['Whose idea was this?', '#201e1d']];
const CDN = 'https://mgk.fra1.cdn.digitaloceanspaces.com/savanna-guide/assets/trails/';

// Trail facts come from the Savanna Guides app manifest. Edit here if the app data changes.
export const HIKES = [
  { id: 'ke-gatamaiyu-trail', name: 'Gatamaiyu Trail', place: 'Kiambu', km: '7.8 km', time: '3–4 h', rating: 'Moderate', dot: '#7a8a5e',
    image: `${CDN}reclaQffTwwwQW95R/images/thumbnails/dji_20260718145700_0144_d-4a3cbaea4938-large.jpeg`,
    facts: [['Loop from Kagwe town', '#7a8a5e'], ['Tea-growing highlands', '#7a8a5e'], ['Well-walked path', '#7a8a5e'], ['1 h from Nairobi', '#645c50']] },
  { id: 'ke-mt-longonot', name: 'Mt Longonot Crater Circuit', place: 'Mount Longonot National Park', km: '14 km', time: '4–6 h', rating: 'Moderate', dot: '#d9a441',
    image: `${CDN}recMPVjiBy6N3xQsm/images/thumbnails/attdpgayl5zavetgi-large.jpeg`,
    facts: [['Volcanic rim loop', '#d9a441'], ['Rift Valley views', '#7a8a5e'], ['No shade on the rim', '#c67139'], ['KWS gate fee', '#645c50']] },
  { id: 'ke-seven-ponds', name: 'Seven Ponds', place: 'Aberdare National Park', km: '12 km', time: '6–8 h', rating: 'Hard', dot: '#c67139',
    image: `${CDN}recT7IB7hQHYU8FV8/images/thumbnails/img_8175-8029cf78160a-large.jpeg`,
    facts: [['+1,131 m from Kwa Matu', '#c67139'], ['High moorland', '#d9a441'], ['Out-and-back', '#645c50'], ['Ranger required', '#645c50']] },
  { id: 'ke-mount-kinangop', name: 'Mount Kinangop', place: 'Aberdare Range', km: '27.9 km', time: 'Full day', rating: 'Hard', dot: '#c67139',
    image: `${CDN}recR1J02Z1rSs9bph/images/thumbnails/kin52048x1536-c6b062769c52-large.jpeg`,
    facts: [['Mutarakwa route', '#645c50'], ['Second-highest Aberdare summit', '#c67139'], ['Long out-and-back', '#c67139'], ['Start: North Kinangop Forest Station', '#645c50']] },
  { id: 'ke-mt-ololokwe', name: 'Mount Ololokwe', place: 'Samburu County', km: 'Half day', time: '4–6 h', rating: 'Hard', dot: '#c67139',
    image: `${CDN}recui0gDObqxKofSI/images/thumbnails/attu9m0nzm41ui4my-large.jpeg`,
    facts: [['Steep ascent above the lowlands', '#c67139'], ['Sacred to the Samburu', '#645c50'], ['Starts near Sabache Eco Camp', '#645c50'], ['6 h drive from Nairobi', '#c67139']] }
];

export const DIFFICULTY_TRAILS = [
  { id: 'ke-elephant-hill', name: 'Elephant Hill', prompt: '19 km · +1,050 m · rocky terrain · some scrambling · 7–10 hours · max 3,660 m' },
  { id: 'ke-nachu-caves', name: 'Nachu Caves', prompt: '≈11 km · rocky hills and dusty tracks · out-and-back · 4–7 hours · Lusigeti' }
];

// Order here mirrors the deck's slide order (data-jury attributes) and is the presenter-page order. Keep both in step.
export const QUESTIONS = [
  { id: 'suffering', type: 'pair', label: 'Choose your suffering', title: 'Choose your suffering.', hint: 'Tap or swipe',
    pairs: [['Steep & short', 'Long & gradual'], ['Bushwhacking', 'Scree'], ['Rain', 'Scorching sun'], ['5 AM start', 'Night finish'], ['Heavy backpack', 'No tea']] },
  { id: 'before-nairobi', type: 'choose', multi: false, label: 'Before leaving Nairobi', title: 'You\'re hiking somewhere new. The one thing you want before leaving Nairobi?', hint: 'Pick one',
    options: ['GPX track', 'A guide', 'A paper map', 'A trip report', 'A friend who\'s been', 'Access directions', 'Something else'] },
  { id: 'route-info', type: 'choose', multi: true, label: 'Where do you get route info?', title: 'Where do you get route information today?', hint: 'Pick all that apply',
    options: ['Google', 'WhatsApp', 'MCK members', 'Guidebooks', 'Strava', 'AllTrails', 'Wikiloc', 'Instagram', 'Tour operators', 'Local guide', 'A previous GPX', 'Someone who knows someone'] },
  { id: 'would-you-hike', type: 'swipe', label: 'Would you hike this?', title: 'Would you hike this?', hint: 'Swipe the card', hikes: HIKES },
  { id: 'trust', type: 'choose', multi: false, label: 'Who do you trust?', title: '“A route says there\'s drinking water here.” Who do you trust?', hint: 'Pick one',
    options: ['Local guide', 'MCK member', 'The app', 'Someone there last week', 'Park ranger', 'Nobody — I carry it all'] },
  { id: 'freshness', type: 'choose', multi: false, label: 'How old is too old?', title: '“Road access: 2WD possible.” Still true if it was updated…', hint: 'Pick the oldest you\'d still trust',
    options: ['Yesterday', '1 month ago', '6 months ago', '2 years ago'] },
  { id: 'mapped', type: 'choose', multi: false, big: true, label: 'Should every trail be mapped?', title: 'Should every trail be mapped?', hint: 'Pick one',
    intro: 'A quiet route through a sensitive area. Fifty people a year walk it today. Publishing it means five hundred.', options: ['Yes', 'No'] },
  { id: 'difficulty', type: 'scale', label: 'How difficult is this?', title: 'How difficult is this?', hint: 'Pick one', trails: DIFFICULTY_TRAILS, scale: SCALE },
  { id: 'factors', type: 'rank', label: 'What makes a hike difficult?', title: 'What makes a hike difficult?', hint: 'Tap in order, hardest first',
    options: ['Distance', 'Altitude', 'Exposure', 'Terrain', 'Elevation gain'] },
  { id: 'backpack', type: 'points', step: 10, label: '100-point backpack', title: 'But you have 100 points. Spend them.', hint: 'Tap + and −',
    options: ['Offline maps', 'Reliable GPX', 'Recent conditions', 'Water sources', 'Access information', 'Difficulty', 'Guide contacts', 'Photos', 'Weather', 'Achievements'] },
  { id: 'hot-take', type: 'slider', label: 'Hot take', title: 'Hot take.', hint: 'Slide it', take: 'Difficulty ratings are mostly useless.' },
  { id: 'one-thing', type: 'text', label: 'The one thing', title: 'The one thing Savanna Guides must get right?', hint: 'One or two words' }
];
export const questionById = id => QUESTIONS.find(q => q.id === id);

export const PERSONAS = [
  ['Walker', 'Good trail, good views, good day.'], ['Mountaineer', 'The summit is the point.'], ['Climber', 'Why walk around it?'],
  ['Explorer', 'I wonder where that path goes.'], ['Expedition', 'Three days isn\'t a trip.'], ['Naturalist', 'I stopped 37 times to identify plants.']
];

let clientPromise;
export function supabase() {
  clientPromise ||= import('https://esm.sh/@supabase/supabase-js@2').then(m => m.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: { params: { eventsPerSecond: 5 } }
  }));
  return clientPromise;
}

export function newCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code === TEST_CODE ? newCode() : code;
}
export const normalizeCode = code => String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

export async function latestSession(sb) {
  const { data } = await sb.from('sessions').select('code, created_at, active_question, opened').neq('code', TEST_CODE).order('created_at', { ascending: false }).limit(1);
  return data?.[0] || null;
}
export async function getSession(sb, code) {
  const { data } = await sb.from('sessions').select('code, created_at, active_question, opened').eq('code', code).maybeSingle();
  return data;
}
export async function createSession(sb, code = newCode()) {
  const { data, error } = await sb.from('sessions').insert({ code }).select().single();
  if (error) throw error;
  return data;
}
export async function setActiveQuestion(sb, code, questionId) {
  const current = await getSession(sb, code);
  if (!current) return null;
  const opened = Array.from(new Set([...(current.opened || []), ...(questionId ? [questionId] : [])]));
  const { data, error } = await sb.from('sessions').update({ active_question: questionId, active_since: new Date().toISOString(), opened }).eq('code', code).select().single();
  if (error) throw error;
  return data;
}
export async function fetchVotes(sb, code) {
  const { data, error } = await sb.from('votes').select('voter_id, question_id, answer').eq('session_code', code);
  if (error) throw error;
  return data || [];
}

// ---- Tallies. Each returns plain numbers so the deck and the host page render the same figures.
export const pct = (part, total) => total ? Math.round(100 * part / total) : 0;
const countBy = (items, key) => items.reduce((m, v) => { const k = key(v); if (k != null) m.set(k, (m.get(k) || 0) + 1); return m; }, new Map());
const forQuestion = (votes, id) => votes.filter(v => v.question_id === id);

export function tally(votes, question) {
  const rows = forQuestion(votes, question.id);
  const voters = rows.length;
  switch (question.type) {
    case 'pair':
      return { voters, pairs: question.pairs.map(([a, b], i) => {
        const picks = rows.map(r => r.answer?.picks?.[i]).filter(Boolean);
        const aCount = picks.filter(p => p === a).length;
        return { a, b, aCount, bCount: picks.length - aCount, aPct: pct(aCount, picks.length), bPct: pct(picks.length - aCount, picks.length) };
      }) };
    case 'choose': {
      const counts = countBy(rows.flatMap(r => (r.answer?.picks || []).map(p => ({ p }))), x => x.p);
      return { voters, options: question.options.map(o => ({ label: o, count: counts.get(o) || 0, pct: pct(counts.get(o) || 0, voters) })).sort((x, y) => y.count - x.count) };
    }
    case 'swipe':
      return { voters, hikes: question.hikes.map(h => {
        const picks = rows.map(r => r.answer?.swipes?.[h.id]).filter(Boolean);
        const yes = picks.filter(p => p === 'yes').length;
        return { id: h.id, name: h.name, yes, no: picks.length - yes, yesPct: pct(yes, picks.length) };
      }) };
    case 'scale':
      return { voters, trails: question.trails.map(t => {
        const picks = rows.map(r => r.answer?.ratings?.[t.id]).filter(Boolean);
        return { id: t.id, name: t.name, total: picks.length, levels: question.scale.map(([label, color]) => ({ label, color, count: picks.filter(p => p === label).length, pct: pct(picks.filter(p => p === label).length, picks.length) })) };
      }) };
    case 'rank': {
      const n = question.options.length;
      return { voters, options: question.options.map(o => {
        const score = rows.reduce((s, r) => { const i = (r.answer?.order || []).indexOf(o); return s + (i < 0 ? 0 : n - i); }, 0);
        const firsts = rows.filter(r => r.answer?.order?.[0] === o).length;
        return { label: o, score, firsts, firstPct: pct(firsts, voters) };
      }).sort((x, y) => y.score - x.score) };
    }
    case 'points': {
      const totals = new Map();
      for (const r of rows) for (const [k, v] of Object.entries(r.answer?.points || {})) totals.set(k, (totals.get(k) || 0) + Number(v || 0));
      const sum = [...totals.values()].reduce((a, b) => a + b, 0);
      return { voters, options: question.options.map(o => ({ label: o, points: totals.get(o) || 0, pct: pct(totals.get(o) || 0, sum) })).sort((x, y) => y.points - x.points) };
    }
    case 'slider': {
      const values = rows.map(r => Number(r.answer?.value)).filter(v => Number.isFinite(v));
      const mean = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 50;
      return { voters, mean, agree: values.filter(v => v >= 60).length, disagree: values.filter(v => v < 40).length, fence: values.filter(v => v >= 40 && v < 60).length };
    }
    case 'text':
      return { voters, answers: rows.map(r => String(r.answer?.text || '').trim()).filter(Boolean), words: wordCloud(rows.map(r => r.answer?.text)) };
    default:
      return { voters };
  }
}

const STOP = new Set('the a an and or of to in on for with is are be it its this that i we you they my our your as at by from not no yes but so if then than too very just more most much all any one thing things must get right should would could can do does have has had will about into up down out over under again there here when where who what which how also need needs want wants make makes sure savanna guides app'.split(' '));
export function wordCloud(texts, limit = 12) {
  const counts = new Map();
  for (const text of texts) for (const raw of String(text || '').toLowerCase().split(/[^a-z0-9'’-]+/)) {
    const word = raw.replace(/^['’-]+|['’-]+$/g, '');
    if (word.length < 3 || STOP.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([word, count]) => ({ word, count }));
}

export function juryUrl(code, origin = location.origin) {
  return `${origin}${JURY_ROUTE}?s=${encodeURIComponent(code)}`;
}
