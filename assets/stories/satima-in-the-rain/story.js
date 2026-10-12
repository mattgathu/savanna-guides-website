// Field Story: Satima in the rain.
// Arranges the Ghost post body into chapters and drives the map, data strip, weather and clips.
// Use root-relative URLs for every file. The static exporter only finds root-relative references.
import {
  SEGMENTS, LEGS, INITIAL_STATE, PUCK, clamp, pointAt, summitKm, viewBoxHeight, frameFor, legPoints,
  smoothTrack, smoothPath, rainDrops, PROFILE, profileX, profileY, readState, formatAltitude, formatHeartRate,
} from '/assets/stories/satima-in-the-rain/story-core.js';
import { meta, track, contours } from '/assets/stories/satima-in-the-rain/satima-data.js';

const WASH_URL = '/assets/stories/satima-in-the-rain/wash.png';
const DIRECTION_KEY = 'sg:satima:direction';
const SVG_NS = 'http://www.w3.org/2000/svg';
const MAP_INK = 'var(--map-ink)';

// Icon paths in a 15 x 15 viewBox.
const ICONS = {
  campsite: 'M14 10V11C14 11.5523 13.5523 12 13 12H2C1.44772 12 1 11.5523 1 11V10C1 9.44772 1.44772 9.00001 2 9.00001H2.25L7.03206 1.25762C7.24699 0.90965 7.75302 0.909651 7.96794 1.25762L12.75 9.00001H13C13.5523 9.00001 14 9.44772 14 10ZM10.5 9.00001L7.5 4.00001L4.5 9.00001H10.5Z',
  mountain: 'm7.5 1c-.3 0-.4.2-.6.4l-5.8 9.5c-.1.1-.1.3-.1.4 0 .5.4.7.7.7h11.6c.4 0 .7-.2.7-.7 0-.2 0-.2-.1-.4l-5.7-9.5c-.2-.2-.4-.4-.7-.4zm0 1.5 3.3 5.5h-.8l-1.5-1.5-1 1.5-1-1.5-1.5 1.5h-.9z',
  viewpoint: 'M6.02,8.425a2.3859,2.3859,0,0,0-.46.44l-4.55-3.5a7.9976,7.9976,0,0,1,1.51-1.51Zm6.46-4.56-3.5,4.55a2.3971,2.3971,0,0,1,.45.45l4.56-3.5A7.945,7.945,0,0,0,12.48,3.865ZM7.3042,10.0129a1.5,1.5,0,1,0,1.6829,1.2914h0A1.5,1.5,0,0,0,7.3042,10.0129ZM6.43,2.235a7.9329,7.9329,0,0,0-2.06.55l2.2,5.32a2.0438,2.0438,0,0,1,.61-.17Zm2.14.01-.75,5.69a2.49,2.49,0,0,1,.61.16l2.2-5.3A7.2129,7.2129,0,0,0,8.57,2.245Z',
  hiking: 'M9.375 13.75 L9.375 10 C9.375 9.83424 9.309152 9.675268 9.191942 9.558058 L7.941942 8.308058 C7.697864 8.063981 7.302136 8.063981 7.058058 8.308058 C6.813981 8.552136 6.813981 8.947864 7.058058 9.191942 L8.308058 10.441942 L8.125 10 L8.125 13.75 C8.125 14.095178 8.404822 14.375 8.75 14.375 C9.095178 14.375 9.375 14.095178 9.375 13.75 Z M8.116496 8.852749 L8.741496 5.102749 C8.798243 4.762268 8.568231 4.440251 8.227749 4.383504 C7.887268 4.326757 7.565251 4.556769 7.508504 4.897251 L6.883504 8.647251 C6.826757 8.987732 7.056769 9.309749 7.397251 9.366496 C7.737732 9.423243 8.059749 9.193231 8.116496 8.852749 Z M7.5 8.125 L6.25 8.125 C5.904822 8.125 5.625 8.404822 5.625 8.75 C5.625 9.095178 5.904822 9.375 6.25 9.375 L7.5 9.375 C7.845178 9.375 8.125 9.095178 8.125 8.75 C8.125 8.404822 7.845178 8.125 7.5 8.125 Z M7.650464 5.406744 C8.86374 6.822236 9.789238 7.5 11.25 7.5 C11.595178 7.5 11.875 7.220178 11.875 6.875 C11.875 6.529822 11.595178 6.25 11.25 6.25 C10.275415 6.25 9.588283 5.746798 8.599536 4.593256 C8.374897 4.331177 7.980335 4.300826 7.718256 4.525464 C7.456177 4.750103 7.425826 5.144665 7.650464 5.406744 Z M8.566892 4.558009 L8.455142 4.446284 C7.749294 3.740361 6.541387 4.106097 6.345632 5.085098 L5.637138 8.627423 C5.56944 8.965897 5.788948 9.295164 6.127423 9.362862 C6.465897 9.43056 6.795164 9.211052 6.862862 8.872577 L7.571362 5.330221 C7.571362 5.330223 7.571325 5.330234 7.571285 5.330193 L7.683108 5.441991 C7.927213 5.686042 8.322941 5.685997 8.566991 5.441892 C8.811042 5.197787 8.810997 4.802059 8.566892 4.558009 Z M5.643661 8.598415 L4.393661 13.598415 C4.309943 13.933287 4.513543 14.272621 4.848415 14.356339 C5.183287 14.440057 5.522621 14.236457 5.606339 13.901585 L6.856339 8.901585 C6.940057 8.566713 6.736457 8.227379 6.401585 8.143661 C6.066713 8.059943 5.727379 8.263543 5.643661 8.598415 Z M10.625 5.9375 L10.625 13.75 C10.625 14.095178 10.904822 14.375 11.25 14.375 C11.595178 14.375 11.875 14.095178 11.875 13.75 L11.875 5.9375 C11.875 5.592322 11.595178 5.3125 11.25 5.3125 C10.904822 5.3125 10.625 5.592322 10.625 5.9375 Z M5 3.75 L4.825475 3.75 C4.287436 3.75 3.80976 4.094289 3.639621 4.604718 L2.844573 6.989857 C2.735418 7.317322 2.912393 7.671272 3.239858 7.780427 L4.177358 8.092927 C4.534002 8.211809 4.914136 7.991208 4.987863 7.622573 L5.612863 4.497573 C5.690212 4.110828 5.394404 3.75 5 3.75 Z M5 5 L5 4.375 L4.387137 4.252427 L3.762137 7.377427 L4.572642 6.907073 L3.635142 6.594573 L4.030427 7.385143 L4.825477 4.999999 C4.825477 4.999999 4.825476 5 4.825475 5 L5 5 Z M9.6875 2.1875 C9.6875 1.497145 9.127863 0.9375 8.4375 0.9375 C7.747137 0.9375 7.1875 1.497145 7.1875 2.1875 C7.1875 2.877855 7.747137 3.4375 8.4375 3.4375 C9.127863 3.4375 9.6875 2.877855 9.6875 2.1875 Z',
};

function init(main) {
  const body = main.querySelector('.sg-satima__body');
  const sections = body ? buildSegments(body) : [];
  const map = createMap(main.querySelector('.sg-satima__map'));
  const strip = createStrip(main);
  const weather = createWeather(main);
  bindDirection(main, () => apply(true));
  bindVideos(main);
  main.classList.add('is-ready');

  let vw = innerWidth;
  let vh = innerHeight;
  let state = { ...INITIAL_STATE, past: false };
  let frame = 0;

  function apply(force) {
    map.render(state, vw, vh, force);
    strip.render(state);
    weather.render(state, main.dataset.direction);
  }

  function measure() {
    frame = 0;
    const line = vh * 0.55;
    const boxes = sections.map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, data: el.sgSegment };
    });
    const next = readState(boxes, line) || state;
    const past = scrollY > vh * 0.6;
    const changed = Math.abs(next.km - state.km) > 0.01 || next.ch !== state.ch
      || next.intensity !== state.intensity || next.cold !== state.cold || past !== state.past;
    if (!changed) return;
    state = { km: next.km, ch: next.ch, intensity: next.intensity, cold: next.cold, past };
    apply(false);
  }

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(measure);
  };

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => {
    vw = innerWidth;
    vh = innerHeight;
    map.render(state, vw, vh, true);
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);

  apply(true);
  measure();
}

// ---------------------------------------------------------------------------
// Body arrangement

function buildSegments(body) {
  const groups = [];
  let current = null;
  for (const node of [...body.childNodes]) {
    const isStart = node.nodeType === 1 && (node.tagName === 'H2' || node.tagName === 'HR');
    if (isStart) {
      current = [];
      groups.push(current);
    }
    if (current) current.push(node);
  }

  const matches = groups.length === SEGMENTS.length;
  if (!matches) {
    console.warn(`Satima story: expected ${SEGMENTS.length} segments in the post body, found ${groups.length}. The map shows the whole track.`);
  }

  const sections = [];
  groups.forEach((nodes, i) => {
    const cfg = matches ? SEGMENTS[i] : { layout: 'text', ch: null };
    const section = document.createElement('section');
    section.className = `sg-satima__section sg-satima__section--${cfg.layout}`;
    nodes[0].before(section);
    section.append(...nodes);

    if (cfg.ch !== null && cfg.ch !== undefined) {
      section.dataset.ch = cfg.ch;
      section.dataset.km0 = cfg.km0;
      section.dataset.km1 = cfg.km1;
      section.dataset.int = cfg.int;
      section.dataset.cold = cfg.cold ? '1' : '0';
      section.sgSegment = cfg;
      sections.push(section);
    }

    arrangeHeading(section, cfg);
    arrangeJournal(section, cfg);
    arrangeGrids(section, cfg);
    if (cfg.layout === 'split' || cfg.layout === 'night') arrangeSplit(section);
    if (cfg.layout === 'cards') {
      arrangeCards(section);
      arrangeTicket(section);
    }
    if (cfg.layout === 'film') arrangeFilm(section);
  });

  body.querySelectorAll('a[href$=".gpx"]').forEach((a) => a.setAttribute('download', ''));
  return sections;
}

const onlyChild = (el, tag) => el && el.tagName === 'P' && el.children.length === 1
  && el.children[0].tagName === tag && el.textContent.trim() === el.children[0].textContent.trim();

function arrangeHeading(section, cfg) {
  const h2 = section.querySelector(':scope > h2');
  if (!h2) {
    if (cfg.id) section.id = cfg.id;
    return;
  }
  if (cfg.id) h2.id = cfg.id;

  // A kicker is the first h3 right after the heading (practical and film sections).
  const afterHeading = h2.nextElementSibling;
  if (afterHeading && afterHeading.tagName === 'H3' && (cfg.layout === 'cards' || cfg.layout === 'film')) {
    const kicker = document.createElement('p');
    kicker.className = 'sg-satima__kicker sg-satima__kicker--lg sg-satima__kicker--block';
    kicker.textContent = afterHeading.textContent;
    h2.before(kicker);
    afterHeading.remove();
  }

  const metaLine = onlyChild(h2.nextElementSibling, 'EM') ? h2.nextElementSibling : null;
  if (!metaLine && !cfg.numeral) return;
  const head = document.createElement('div');
  head.className = 'sg-satima__chapter-head';
  if (cfg.numeral) {
    const numeral = document.createElement('span');
    numeral.className = 'sg-satima__numeral';
    numeral.textContent = cfg.numeral;
    head.append(numeral);
  }
  if (metaLine) {
    metaLine.classList.add('sg-satima__meta');
    head.append(metaLine);
  }
  h2.before(head);
}

function arrangeJournal(section, cfg) {
  section.querySelectorAll(':scope > p').forEach((p) => {
    if (onlyChild(p, 'STRONG') && /^Journal\b/.test(p.textContent.trim())) {
      p.classList.add('sg-satima__journal');
      if (cfg.dot === 'tent') p.classList.add('is-tent');
    }
  });
}

// Wide image cards next to each other become one grid.
function arrangeGrids(section, cfg) {
  const isWideImage = (el) => el && el.matches && el.matches('figure.kg-image-card.kg-width-wide');
  for (const el of [...section.children]) {
    if (!isWideImage(el) || isWideImage(el.previousElementSibling)) continue;
    const run = [el];
    let next = el.nextElementSibling;
    while (isWideImage(next)) {
      run.push(next);
      next = next.nextElementSibling;
    }
    if (run.length < 2) continue;
    const grid = document.createElement('div');
    grid.className = 'sg-satima__grid';
    if (cfg.gridMin) grid.style.setProperty('--grid-min', cfg.gridMin + 'px');
    if (cfg.gridMax) grid.style.setProperty('--grid-max', cfg.gridMax + 'px');
    el.before(grid);
    grid.append(...run);
  }
}

// The text before the first figure goes in a column beside that figure.
function arrangeSplit(section) {
  const figure = section.querySelector(':scope > figure');
  if (!figure) return;
  const text = [];
  let el = figure.previousElementSibling;
  while (el && !el.matches('h2, hr, .sg-satima__chapter-head')) {
    text.unshift(el);
    el = el.previousElementSibling;
  }
  const split = document.createElement('div');
  split.className = 'sg-satima__split';
  const column = document.createElement('div');
  column.className = 'sg-satima__split-text';
  figure.before(split);
  column.append(...text);
  split.append(column, figure);
}

// Each h3 group becomes a practical card.
function arrangeCards(section) {
  const first = section.querySelector(':scope > h3');
  if (!first) return;
  const cards = document.createElement('div');
  cards.className = 'sg-satima__cards';
  first.before(cards);
  let card = null;
  let el = first;
  while (el) {
    const next = el.nextElementSibling;
    if (el.tagName === 'H3') {
      card = document.createElement('div');
      card.className = 'sg-satima__card';
      cards.append(card);
      el.classList.add('sg-satima__card-kicker');
    } else if (onlyChild(el, 'STRONG') && !card.querySelector('.sg-satima__card-title')) {
      el.classList.add('sg-satima__card-title');
    } else if (onlyChild(el, 'EM')) {
      el.classList.add('sg-satima__tags');
      el.replaceChildren(...el.textContent.split('·').map((t) => {
        const tag = document.createElement('span');
        tag.className = 'sg-satima__tag';
        tag.textContent = t.trim();
        return tag;
      }));
    } else if (el.tagName === 'P' && el.querySelector('a')) {
      el.classList.add('sg-satima__card-link');
    }
    card.append(el);
    el = next;
  }
}

// The Ghost body holds a plain link to the trail page in the last practical card.
// With JavaScript, the link becomes a ticket below the cards. Without JavaScript, the plain link stays.
function arrangeTicket(section) {
  const link = section.querySelector('.sg-satima__card-link a[href*="/links/trails/"]');
  const template = document.querySelector('.sg-satima__ticket-template');
  if (!link || !template) return;

  const ticket = template.content.firstElementChild.cloneNode(true);
  ticket.href = link.href;

  const cards = section.querySelector('.sg-satima__cards');
  (cards || section).after(ticket);

  // Remove the plain link paragraph. Remove the card too if the link was its only content after the title.
  const paragraph = link.closest('.sg-satima__card-link');
  const card = paragraph.closest('.sg-satima__card');
  paragraph.remove();
  if (card && !card.querySelector('p:not(.sg-satima__card-title), table')) card.remove();
}

// When an editor adds a YouTube embed card, add a plain fallback link and hide the placeholder.
function arrangeFilm(section) {
  const iframe = section.querySelector('iframe[src*="youtube"]');
  if (!iframe) return;
  const id = (iframe.src.match(/embed\/([\w-]{6,})/) || [])[1];
  section.querySelectorAll('.sg-satima__film-placeholder').forEach((el) => el.remove());
  if (!id) return;
  const card = iframe.closest('figure') || iframe;
  const p = document.createElement('p');
  p.className = 'sg-satima__film-link';
  const a = document.createElement('a');
  a.href = `https://www.youtube.com/watch?v=${id}`;
  a.textContent = 'Watch on YouTube';
  p.append(a);
  card.after(p);
}

// ---------------------------------------------------------------------------
// Map

function svg(tag, attrs = {}, parent) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (parent) parent.append(el);
  return el;
}

function icon(name, size, fill, parent) {
  const g = svg('g', { transform: `translate(${-size / 2} ${-size / 2}) scale(${size / 15})` }, parent);
  svg('path', { d: ICONS[name], fill }, g);
  return g;
}

const offset = (p, dx, dy) => [p[0] + dx, p[1] + dy];

function createMap(container) {
  if (!container) return { render() {} };
  const smooth = smoothTrack(track);
  const root = svg('svg', {
    preserveAspectRatio: 'xMidYMid slice',
    role: 'img',
    'aria-label': 'Map of the Ole Satima trail drawn from the GPS track',
  });
  const world = svg('g', { class: 'is-framed' }, root);
  svg('image', { class: 'sg-satima__wash', href: WASH_URL, x: 0, y: 0, width: meta.W, height: meta.H, preserveAspectRatio: 'none' }, world);

  // Labels that keep a constant screen size: [element, x, y].
  const scaled = [];
  const contourGroup = svg('g', {}, world);
  Object.keys(contours).forEach((level, i) => {
    const g = svg('g', {}, contourGroup);
    svg('path', {
      class: 'sg-satima__contour',
      d: contours[level].map(smoothPath).join(''),
      style: `animation: sg-breathe ${9 + i * 1.7}s ease-in-out ${i * 0.9}s infinite`,
    }, g);
    const line = contours[level].find((l) => l.length > 30);
    if (line) {
      const p = line[Math.floor(line.length * [0.12, 0.42, 0.7, 0.28, 0.58, 0.88][i % 6])];
      const text = svg('text', { class: 'is-framed', 'font-size': 10, opacity: 0.55 }, g);
      text.textContent = level;
      scaled.push([text, p[0], p[1] - 3]);
    }
  });

  svg('path', {
    d: smoothPath(smooth), fill: 'none', stroke: PUCK, 'stroke-width': 1.6, 'stroke-opacity': 0.45,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke',
  }, world);
  const leg = svg('path', {
    fill: 'none', stroke: PUCK, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    'vector-effect': 'non-scaling-stroke',
  }, world);

  const waypoints = [
    { name: 'Twin Rocks · camp', at: meta.start, icon: 'campsite', dx: 14 },
    { name: 'Nipple Rock', at: offset(pointAt(track, 2.9), 22, -8), icon: 'mountain', dx: 14 },
    { name: "Dragon's Teeth", at: offset(pointAt(track, 6.3), -30, -4), icon: 'viewpoint', dx: -14, anchor: 'end' },
    { name: 'Ol Donyo Lesatima · 4,001 m', at: [meta.summit.x, meta.summit.y], icon: 'mountain', dx: 14 },
    { name: 'Summit camp', at: [meta.camp.x, meta.camp.y - 14], icon: 'campsite', dx: -14, anchor: 'end', minK: 1.6 },
  ];
  const waypointGroup = svg('g', {}, world);
  for (const wp of waypoints) {
    const g = svg('g', { class: 'sg-satima__waypoint is-framed' }, waypointGroup);
    svg('circle', { r: 11, fill: 'var(--color-surface)', stroke: MAP_INK, 'stroke-width': 1.2 }, g);
    icon(wp.icon, 14, MAP_INK, g);
    const text = svg('text', { x: wp.dx, y: 4.5, 'text-anchor': wp.anchor || 'start' }, g);
    text.textContent = wp.name;
    wp.el = g;
    scaled.push([g, wp.at[0], wp.at[1]]);
  }

  const puck = svg('g', { class: 'sg-satima__puck' }, world);
  svg('circle', { class: 'sg-satima__pulse', r: 10, fill: 'none', stroke: PUCK, 'stroke-width': 1.5 }, puck);
  svg('circle', { r: 10, fill: PUCK, stroke: 'var(--color-surface)', 'stroke-width': 2 }, puck);
  icon('hiking', 14, '#fff', puck);

  const scaleBar = svg('g', { class: 'is-framed' }, world);
  const barLine = svg('line', { x1: 0, y1: 0, y2: 0, stroke: MAP_INK, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, scaleBar);
  svg('line', { x1: 0, y1: -4, x2: 0, y2: 4, stroke: MAP_INK, 'stroke-width': 1.5 }, scaleBar);
  const barEnd = svg('line', { y1: -4, y2: 4, stroke: MAP_INK, 'stroke-width': 1.5 }, scaleBar);
  const barText = svg('text', { y: -7, 'font-size': 10, 'text-anchor': 'middle' }, scaleBar);
  barText.textContent = '1 km';

  const north = svg('g', { class: 'is-framed' }, world);
  svg('line', { x1: 0, y1: 14, x2: 0, y2: -8, stroke: MAP_INK, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, north);
  svg('path', { d: 'M0 -12 l4 7 h-8 z', fill: MAP_INK }, north);
  const northText = svg('text', { y: 28, 'font-size': 11, 'text-anchor': 'middle', 'font-family': 'var(--font-heading)' }, north);
  northText.textContent = 'N';

  container.append(root);

  let lastKey = '';
  let lastKm = null;
  return {
    render(state, vw, vh, force) {
      const VH = viewBoxHeight(vw || 1200, vh || 800);
      const key = `${state.ch}|${VH}`;
      if (force || key !== lastKey) {
        lastKey = key;
        const legRange = LEGS[state.ch];
        const f = frameFor(legPoints(track, legRange), VH);
        // The SVG maps 1000 units to the viewport width. On narrow screens, enlarge the
        // labels, puck and scale bar so that they keep at least their desktop screen size.
        const ui = Math.max(1, 1000 / (vw || 1200));
        const inv = ui / f.k;
        root.setAttribute('viewBox', `0 0 1000 ${VH}`);
        world.style.transform = `translate(500px, ${VH / 2}px) scale(${f.k}) translate(${-f.cx}px, ${-f.cy}px)`;
        for (const [el, x, y] of scaled) el.style.transform = `translate(${x}px, ${y}px) scale(${inv})`;
        for (const wp of waypoints) {
          if (wp.minK) wp.el.style.display = f.k >= wp.minK * ui ? '' : 'none';
        }
        leg.setAttribute('d', legRange ? smoothPath(legPoints(smooth, legRange)) : '');
        scaleBar.style.transform = `translate(${f.cx - f.w / 2}px, ${f.cy + f.h / 2}px) scale(${inv}) translate(28px, -28px)`;
        const km = (100 * f.k) / ui;
        barLine.setAttribute('x2', km);
        barEnd.setAttribute('x1', km);
        barEnd.setAttribute('x2', km);
        barText.setAttribute('x', km / 2);
        north.style.transform = `translate(${f.cx + f.w / 2}px, ${f.cy - f.h / 2}px) scale(${inv}) translate(-34px, 40px)`;
        this.inv = inv;
        lastKm = null;
      }
      if (state.km !== lastKm) {
        lastKm = state.km;
        const p = pointAt(track, state.km);
        puck.style.transform = `translate(${p[0]}px, ${p[1]}px) scale(${this.inv})`;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Data strip

function createStrip(main) {
  const profile = main.querySelector('[data-strip="profile"]');
  const alt = main.querySelector('[data-strip="alt"]');
  const hr = main.querySelector('[data-strip="hr"]');
  const dot = main.querySelector('[data-strip="dot"]');
  const bar = main.querySelector('[data-strip="bar"]');
  const { W, H } = PROFILE;
  const X = (p) => profileX(p[3], meta.totalKm);
  const line = track.map((p, i) => (i ? 'L' : 'M') + X(p).toFixed(1) + ' ' + profileY(p[2]).toFixed(1)).join('');
  const area = line + `L${W} ${H}L0 ${H}Z`;

  let clip = null;
  if (profile) {
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    const defs = svg('defs', {}, root);
    const clipPath = svg('clipPath', { id: 'sg-satima-strip-clip' }, defs);
    clip = svg('rect', { x: 0, y: -10, width: 0, height: H + 20 }, clipPath);
    svg('path', { d: area, fill: MAP_INK, opacity: 0.1 }, root);
    svg('path', { d: area, fill: MAP_INK, opacity: 0.32, 'clip-path': 'url(#sg-satima-strip-clip)' }, root);
    svg('path', { d: line, fill: 'none', stroke: MAP_INK, 'stroke-width': 1.5 }, root);
    const sx = profileX(summitKm(track, meta), meta.totalKm);
    svg('line', { x1: sx, x2: sx, y1: 0, y2: H, stroke: MAP_INK, 'stroke-opacity': 0.25, 'stroke-dasharray': '2 3' }, root);
    profile.prepend(root);
  }

  return {
    render(state) {
      main.classList.toggle('is-past', state.past);
      const progress = clamp(state.km / meta.totalKm, 0, 1);
      const p = pointAt(track, state.km);
      if (clip) clip.setAttribute('width', (progress * W).toFixed(1));
      if (dot) {
        dot.style.left = ((X(p) / W) * 100).toFixed(2) + '%';
        dot.style.top = profileY(p[2]).toFixed(1) + 'px';
      }
      if (alt) alt.textContent = formatAltitude(p[2]);
      if (hr) hr.textContent = formatHeartRate(p[5]);
      if (bar) bar.style.width = (progress * 100).toFixed(1) + '%';
    },
  };
}

// ---------------------------------------------------------------------------
// Weather and direction

function createWeather(main) {
  const rain = main.querySelector('.sg-satima__rain');
  const mist = main.querySelector('.sg-satima__mist');
  if (rain && !rain.children.length) {
    const fragment = document.createDocumentFragment();
    for (const d of rainDrops()) {
      const drop = document.createElement('i');
      drop.style.cssText = `left:${d.left}%;height:${d.h}px;`
        + `background:linear-gradient(to bottom, rgba(70,82,104,0), rgba(70,82,104,${d.op}));`
        + `animation-duration:${d.dur}s;animation-delay:${d.delay}s`;
      fragment.append(drop);
    }
    rain.append(fragment);
  }
  return {
    render(state, direction) {
      const weather = direction !== 'calm';
      const intensity = weather ? state.intensity : 0;
      const cold = weather && state.cold;
      if (rain) rain.style.opacity = intensity * 0.75;
      // Keep faint mist on the cold summit night, which has no rain.
      if (mist) mist.style.opacity = Math.max(intensity, cold ? 0.3 : 0) * 0.5;
      main.classList.toggle('is-cold', cold);
    },
  };
}

function bindDirection(main, onChange) {
  const inputs = main.querySelectorAll('input[name="sg-direction"]');
  const current = main.dataset.direction === 'calm' ? 'calm' : 'weather';
  inputs.forEach((input) => {
    input.checked = input.value === current;
    input.addEventListener('change', () => {
      if (!input.checked) return;
      main.dataset.direction = input.value;
      try {
        localStorage.setItem(DIRECTION_KEY, input.value);
      } catch (e) {
        // Storage can be blocked. The choice then lasts for this page view only.
      }
      onChange();
    });
  });
}

// ---------------------------------------------------------------------------
// Clips

function bindVideos(main) {
  const videos = [...main.querySelectorAll('video[data-loop-video]')];
  if (!videos.length) return;
  const play = (v) => {
    const p = v.play();
    if (p) p.catch(() => {});
  };
  for (const v of videos) {
    v.removeAttribute('controls');
    v.muted = true;
    v.defaultMuted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('muted', '');
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) play(e.target); else e.target.pause();
    }), { rootMargin: '300px 0px' });
    videos.forEach((v) => io.observe(v));
  }
  // Some browsers block autoplay until the first gesture.
  const nudge = () => {
    removeEventListener('pointerdown', nudge);
    removeEventListener('scroll', nudge);
    for (const v of videos) {
      const r = v.getBoundingClientRect();
      if (r.bottom > -300 && r.top < innerHeight + 300) play(v);
    }
  };
  addEventListener('pointerdown', nudge, { passive: true });
  addEventListener('scroll', nudge, { passive: true });
}

// Start after every module-level constant exists.
const storyRoot = document.querySelector('.sg-satima');
if (storyRoot) init(storyRoot);
