// 模拟浏览器环境执行游戏脚本，捕获运行时错误
const fs = require('fs');
const path = 'C:\\Users\\李维\\WorkBuddy\\2026-09-15-22-42-42\\pvz-final\\index.html';
const html = fs.readFileSync(path, 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.log('NO SCRIPT FOUND'); process.exit(1); }
const code = m[1];

// --- 假 Canvas 2D 上下文 ---
function makeGradient() { return { addColorStop() {} }; }
function makeCtx() {
  const target = {
    canvas: null,
    measureText: () => ({ width: 10 }),
    createLinearGradient: makeGradient,
    createRadialGradient: makeGradient,
    getContext() { return this; },
  };
  return new Proxy(target, {
    get(t, k) {
      if (k in t) return t[k];
      // 任意方法都返回 undefined 的可调用函数
      return function () {};
    },
    set(t, k, v) { t[k] = v; return true; }
  });
}

const listeners = {}; // 捕获事件回调
function makeEl(extra) {
  return Object.assign({
    style: {},
    textContent: '',
    innerHTML: '',
    classList: { toggle() {}, remove() {}, add() {} },
    addEventListener(ev, fn) { (listeners[extra.id + ':' + ev] = listeners[extra.id + ':' + ev] || []).push(fn); },
    getAttribute() { return 'sunflower'; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 740, height: 520 }; },
    getContext() { return makeCtx(); },
    width: 740, height: 520,
  }, extra);
}

const els = {};
global.document = {
  getElementById(id) { return els[id] || (els[id] = makeEl({ id })); },
  querySelectorAll() { return []; },
};
let rafCb = null;
global.window = { devicePixelRatio: 2 };
global.requestAnimationFrame = (cb) => { rafCb = cb; return 1; };
global.cancelAnimationFrame = () => {};
global.performance = { now: () => 0 };

try {
  eval(code);
  console.log('LOAD OK');
  // 触发“开始游戏”
  const startFns = listeners['startBtn:click'] || [];
  console.log('startBtn listeners:', startFns.length);
  if (startFns.length) {
    startFns[0]();
    console.log('START OK');
    // 跑 300 帧（约 5 秒游戏时间，会触发阳光掉落、僵尸生成）
    let t = 0;
    for (let i = 0; i < 300; i++) {
      t += 50;
      const cb = rafCb; rafCb = null;
      if (!cb) { console.log('loop stopped at frame', i); break; }
      cb(t);
    }
    console.log('FRAMES OK');
  }
} catch (e) {
  console.log('ERROR:', e.message);
  console.log(e.stack.split('\n').slice(0, 6).join('\n'));
}
