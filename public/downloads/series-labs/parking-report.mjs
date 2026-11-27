import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { scenario, step, result, corners } from "./physics.js";

const scene = scenario("normal", 1, "parallel");
const parked = { ...scene.start, ...{ x: scene.target.x, z: scene.target.z, angle: scene.target.angle, gear: "P", speed: 0 } };
const stats = { hits: 0, corrections: 0 };
const cases = [
  { name: "格子中心，P 檔", state: parked, expected: true },
  { name: "同一個位置，R 檔", state: { ...parked, gear: "R" }, expected: false },
  { name: "向前移動 3 m，P 檔", state: { ...parked, z: parked.z + 3 }, expected: false },
];
const format = (n) => n.toFixed(2);
function plot(state) {
  const sx = (x) => 105 + (x - scene.target.x) * 17;
  const sy = (z) => 109 - (z - scene.target.z) * 17;
  const points = corners(state).map((p) => sx(p.x) + "," + sy(p.z)).join(" ");
  return '<svg viewBox="0 0 210 204"><rect x="'+sx(scene.target.x - scene.target.width/2)+'" y="'+sy(scene.target.z+scene.target.length/2)+'" width="'+scene.target.width*17+'" height="'+scene.target.length*17+'" fill="none" stroke="#7ca49c" stroke-width="2" stroke-dasharray="5 4"/><polygon points="'+points+'" fill="#e0a15b" stroke="#f6c893" stroke-width="2"/><circle cx="'+sx(state.x)+'" cy="'+sy(state.z)+'" r="3" fill="#1b2733"/></svg>';
}
let cards = "";
for (const {name, state, expected} of cases) {
  const score = result(state, scene, stats);
  assert.equal(score.passed, expected, name);
  cards += '<article><h2>'+name+'</h2>'+plot(state)+'<b>'+ (score.passed ? "通過" : "未通過")+'</b><small>inside = '+score.inside+'　parked = '+score.parked+'</small></article>';
}
const traces = ["D","R"].map((gear) => {
  let state = { ...scene.start, gear };
  const samples = [];
  for(let tick = 0; tick <= 600; tick++) {
    if(tick % 30 === 0) samples.push({ t:tick/120, z:state.z-scene.start.z });
    state = step(state, {slow:true}, 1/120);
  }
  return { gear, samples };
});
const lines = traces.map(({gear,samples}) => '<polyline fill="none" stroke-width="4" stroke="'+(gear==="D"?"#76dfba":"#ffb677")+'" points="'+samples.map(({t,z})=>(58+t*144)+","+(112-z*54)).join(" ")+'"/>').join("");
const rows = traces.map(({gear,samples})=>gear+"　"+format(samples.at(-1).z)+" m").join("　　 ");
const style = 'body{margin:0;background:#14212a;color:#f9f5ed;font:17px system-ui,sans-serif;padding:34px}h1{font-size:29px;letter-spacing:.02em;margin:0 0 7px}p,small,text{color:#bdcece;fill:#bdcece}p{margin:0 0 22px}.cards{display:flex;gap:14px}article,section{background:#1d303c;border:1px solid #3c525d;border-radius:8px;padding:16px}article{flex:1;text-align:center}article svg{height:187px;display:block;width:100%}h2{margin:0;font-size:18px}b{color:#ffba7d}small{font-size:15px;display:block;margin-top:5px}section svg{width:100%;max-width:840px;display:block}';
const page=(title,desc,html)=>'<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>'+title+'</title><style>'+style+'</style><h1>'+title+'</h1><p>'+desc+'</p>'+html+'</html>';
writeFileSync("creep-report.html",page("D、R 檔的蠕行距離","固定時間步 1/120 秒，每 0.25 秒記錄一次，不踩油門。",'<section><svg viewBox="0 0 820 235"><path d="M58 14V211M58 112H779" fill="none" stroke="#66808b"/><text x="64" y="26">+z / m</text><text x="9" y="115">0</text><text x="727" y="141">5 秒</text>'+lines+'</svg><b>'+rows+'</b></section>'));
writeFileSync("bay-report.html",page("三種停車狀態的判定","虛線是車格，實心形狀由 physics.js 的車身輪廓座標繪製。",'<div class="cards">'+cards+'</div>'));
console.log(rows);
console.log("三個入格案例通過，已輸出 creep-report.html 和 bay-report.html。");
