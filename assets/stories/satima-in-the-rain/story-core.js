// Satima in the rain: pure story logic. No DOM access. The tests import this file.

// One entry for each segment of the Ghost post body, in order.
// An h2 or a divider card starts a segment. See the registry notes in content/stories/registry.json.
// ch: chapter index for the map. km0/km1: the route range that the segment covers.
// int: rain intensity in Weather mode. Rain falls only in chapters 03 and 04. cold: summit-night colour shift.
// dot: journal dot colour. layout: composition that story.js applies.
export const SEGMENTS = [
  { name: 'flash-forward', id: 'ch-00', numeral: '00', ch: 0, km0: 10, km1: 10, int: 0, cold: false, dot: 'tent', layout: 'text' },
  { name: 'back-door', id: 'ch-01', numeral: '01', ch: 1, km0: 0, km1: 0, int: 0, cold: false, dot: 'town', layout: 'grid', gridMin: 260 },
  { name: 'gentle-welcome', id: 'ch-02', numeral: '02', ch: 2, km0: 0, km1: 3, int: 0, cold: false, dot: 'town', layout: 'grid', gridMax: 960 },
  { name: 'dragons-teeth', id: 'ch-03', numeral: '03', ch: 3, km0: 3, km1: 6.75, int: 1, cold: false, dot: 'town', layout: 'grid' },
  { name: 'zooming-out', id: 'ch-04', numeral: '04', ch: 4, km0: 6.75, km1: 9.5, int: 0.65, cold: false, dot: 'town', layout: 'split' },
  { name: 'summit', id: 'ch-05', numeral: '05', ch: 5, km0: 9.5, km1: 10.47, int: 0, cold: false, dot: 'town', layout: 'grid' },
  { name: 'night', id: 'ch-05-night', numeral: null, ch: 6, km0: 10.47, km1: 10.47, int: 0, cold: true, dot: 'tent', layout: 'night' },
  { name: 'different-world', id: 'ch-06', numeral: '06', ch: 7, km0: 10.47, km1: 19.46, int: 0, cold: false, dot: 'tent', layout: 'grid' },
  { name: 'before-you-go', id: 'before-you-go', numeral: null, ch: 8, km0: 19.46, km1: 19.46, int: 0, cold: false, dot: null, layout: 'cards' },
  { name: 'film', id: 'the-film', numeral: null, ch: null, layout: 'film' },
  { name: 'colophon', id: 'colophon', numeral: null, ch: null, layout: 'colophon' },
];

// The route leg that the map frames for each chapter. Other chapters show the whole track.
export const LEGS = { 2: [0, 3], 3: [3, 6.75], 4: [6.75, 9.5], 5: [9.5, 10.47], 6: [9.5, 10.47], 7: [10.47, 19.46] };

// State before the reader reaches the first chapter.
export const INITIAL_STATE = { km: 0, ch: -1, intensity: 0, cold: false };

export const PUCK = '#e2772b';

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Linear interpolation along the track by the km field (index 3).
export function pointAt(track, km) {
  if (km <= track[0][3]) return track[0];
  for (let i = 1; i < track.length; i++) {
    if (track[i][3] >= km) {
      const a = track[i - 1];
      const b = track[i];
      const f = (km - a[3]) / Math.max(1e-6, b[3] - a[3]);
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, km, a[4] + (b[4] - a[4]) * f, b[5] || a[5]];
    }
  }
  return track[track.length - 1];
}

// Route km of the summit: the track point nearest to meta.summit, before the summit camp.
export function summitKm(track, meta) {
  let best = track[0];
  let bestD = Infinity;
  for (const p of track) {
    if (p[3] > meta.totalKm / 2 + 1) break;
    const d = (p[0] - meta.summit.x) ** 2 + (p[1] - meta.summit.y) ** 2;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best[3];
}

// Map viewBox height for a viewport. The viewBox width is always 1000.
export const viewBoxHeight = (vw, vh) => clamp(Math.round((1000 * vh) / vw), 300, 4000);

// Frame for a set of track points: centre, size in map units, and scale k.
export function frameFor(points, VH) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of points) {
    x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]);
    x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
  }
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const aspect = 1000 / VH;
  let w = Math.max(x1 - x0, 260) * 2.1;
  let h = Math.max(y1 - y0, 120) * 2.1;
  if (w / h < aspect) w = h * aspect; else h = w / aspect;
  return { cx, cy, w, h, k: 1000 / w };
}

// Points of a leg, with a 0.05 km margin. No leg returns all points.
export function legPoints(points, leg) {
  if (!leg) return points;
  return points.filter((p) => p[3] >= leg[0] - 0.05 && p[3] <= leg[1] + 0.05);
}

// 5-point moving average of x and y. Keeps elevation and km.
export function smoothTrack(track) {
  return track.map((p, i) => {
    let x = 0, y = 0, n = 0;
    for (let j = Math.max(0, i - 2); j <= Math.min(track.length - 1, i + 2); j++) {
      x += track[j][0]; y += track[j][1]; n++;
    }
    return [+(x / n).toFixed(1), +(y / n).toFixed(1), p[2], p[3]];
  });
}

// Catmull-Rom spline through the points, as cubic Bezier path data.
export function smoothPath(line) {
  if (line.length < 3) return 'M' + line.map((p) => p[0] + ' ' + p[1]).join('L');
  let d = `M${line[0][0]} ${line[0][1]}`;
  for (let i = 0; i < line.length - 1; i++) {
    const p0 = line[Math.max(0, i - 1)];
    const p1 = line[i];
    const p2 = line[i + 1];
    const p3 = line[Math.min(line.length - 1, i + 2)];
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} `
      + `${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

// Seeded PRNG (Park-Miller). The same seed gives the same rain layout.
export function seededRandom(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// 56 rain drops. Each drop calls the PRNG five times, in this order.
export function rainDrops(count = 56, seed = 7) {
  const rnd = seededRandom(seed);
  return Array.from({ length: count }, () => ({
    left: rnd() * 104 - 2,
    dur: 0.9 + rnd() * 0.7,
    delay: -rnd() * 2.5,
    h: 36 + rnd() * 50,
    op: 0.09 + rnd() * 0.14,
  }));
}

// Elevation profile geometry. The SVG viewBox is 0 0 600 50.
export const PROFILE = { W: 600, H: 50 };
export const profileX = (km, totalKm) => (km / totalKm) * PROFILE.W;
export const profileY = (ele) => PROFILE.H - 3 - ((ele - 3420) / 600) * (PROFILE.H - 8);

// Find the reading state from section boxes. Each box is { top, bottom, data }.
// Returns null when no box contains the reading line and the previous state stays.
export function readState(boxes, line) {
  for (const box of boxes) {
    if (box.top <= line && box.bottom > line) {
      const d = box.data;
      const p = clamp((line - box.top) / (box.bottom - box.top), 0, 1);
      return { km: d.km0 + p * (d.km1 - d.km0), ch: d.ch, intensity: d.int, cold: d.cold };
    }
  }
  if (boxes.length && boxes[0].top > line) return { ...INITIAL_STATE };
  return null;
}

export const formatAltitude = (ele) => Math.round(ele).toLocaleString('en-GB') + ' m';
export const formatHeartRate = (hr) => (hr ? Math.round(hr) + ' bpm' : '·');
