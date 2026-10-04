// SVG coords, viewBox 0 0 400 300. Ellipses: cx, cy, rx, ry, rotation deg (svg, clockwise)
const E = [
  { cx: 140, cy: 168, rx: 130, ry: 76, rot: 40 }, // outer left
  { cx: 180, cy: 132, rx: 130, ry: 76, rot: 40 }, // inner left
  { cx: 220, cy: 132, rx: 130, ry: 76, rot: -40 }, // inner right
  { cx: 260, cy: 168, rx: 130, ry: 76, rot: -40 }, // outer right
];
const f = (e, x, y) => {
  const a = (e.rot * Math.PI) / 180,
    dx = x - e.cx,
    dy = y - e.cy;
  const u = dx * Math.cos(a) + dy * Math.sin(a),
    v = -dx * Math.sin(a) + dy * Math.cos(a);
  return (u * u) / (e.rx * e.rx) + (v * v) / (e.ry * e.ry);
};
const region = (x, y) => E.reduce((m, e, i) => m + (f(e, x, y) <= 1 ? 1 << i : 0), 0);
const W = 400,
  H = 300;
const grid = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) grid.push(region(x, y));
const out = {};
for (let r = 1; r < 16; r++) {
  let best = null,
    bestD = -1,
    area = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (grid[y * W + x] !== r) continue;
      area++;
      let d = 0;
      outer: for (d = 1; d < 60; d++) {
        for (let k = 0; k < 16; k++) {
          const ang = (k / 16) * 2 * Math.PI;
          const xx = Math.round(x + d * Math.cos(ang)),
            yy = Math.round(y + d * Math.sin(ang));
          if (xx < 0 || yy < 0 || xx >= W || yy >= H || grid[yy * W + xx] !== r) break outer;
        }
      }
      if (d > bestD) {
        bestD = d;
        best = [x, y];
      }
    }
  out[r] = { best, bestD, area };
}
console.log(JSON.stringify(out));
