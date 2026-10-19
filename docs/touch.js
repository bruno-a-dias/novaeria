/* Controles de toque para o EmulatorJS: cruz direcional, Y/B/X/A, START/SELECT. Transparentes e ajustáveis. */
(function () {
  var touchy = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches;
  var q = new URLSearchParams(location.search);
  if (q.get('toque') === '0' || !(touchy || q.get('toque') === '1')) return;
  // índices de botão do núcleo (libretro): B Y SELECT START CIMA BAIXO ESQ DIR A X L R
  var IDX = { b: 0, y: 1, sel: 2, start: 3, up: 4, down: 5, left: 6, right: 7, a: 8, x: 9 };
  var state = {}, touches = {};
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function send(name, on) {
    var E = window.EJS_emulator;
    if (!E || !E.gameManager || !E.gameManager.simulateInput) return;
    try { E.gameManager.simulateInput(0, IDX[name], on ? 1 : 0); } catch (e) {}
  }
  function apply() {
    var want = {};
    Object.keys(touches).forEach(function (id) { touches[id].forEach(function (n) { want[n] = true; }); });
    Object.keys(IDX).forEach(function (n) {
      var on = !!want[n];
      if (on !== !!state[n]) { state[n] = on; send(n, on); if (on && navigator.vibrate && n !== 'up' && n !== 'down' && n !== 'left' && n !== 'right') navigator.vibrate(8); }
    });
    [].forEach.call(document.querySelectorAll('#pad [data-k]'), function (el) { el.classList.toggle('on', !!want[el.dataset.k]); });
    var dx = (want.right ? 1 : 0) - (want.left ? 1 : 0), dy = (want.down ? 1 : 0) - (want.up ? 1 : 0);
    var dp = document.querySelector('#pad .dp');
    dp.style.setProperty('--dx', (dx * 28) + '%'); dp.style.setProperty('--dy', (dy * 28) + '%');
  }
  function hit(x, y, id) {
    var set = [];
    var dp = document.querySelector('#pad .dp'), r = dp.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var inside = Math.hypot(x - cx, y - cy) < r.width * 0.75;
    if (touches[id] && touches[id].dpad) inside = Math.hypot(x - cx, y - cy) < r.width * 1.1;   // arrastar para fora da cruz não solta de repente
    if (inside) {
      var dx = x - cx, dy = y - cy, dz = r.width * 0.14;
      if (Math.abs(dx) > dz && Math.abs(dx) > Math.abs(dy) * 0.42) set.push(dx > 0 ? 'right' : 'left');
      if (Math.abs(dy) > dz && Math.abs(dy) > Math.abs(dx) * 0.42) set.push(dy > 0 ? 'down' : 'up');
      set.dpad = true; return set;
    }
    var el = document.elementFromPoint(x, y);
    while (el && el.id !== 'pad') { if (el.dataset && el.dataset.k) { set.push(el.dataset.k); break; } el = el.parentNode; }
    return set;
  }
  function onDown(e) { if (e.target.closest && e.target.closest('.lg')) return; touches[e.pointerId] = hit(e.clientX, e.clientY, e.pointerId); apply(); e.preventDefault(); }
  function onMove(e) { if (!(e.pointerId in touches)) return; touches[e.pointerId] = hit(e.clientX, e.clientY, e.pointerId); apply(); e.preventDefault(); }
  function onUp(e) { if (!(e.pointerId in touches)) return; delete touches[e.pointerId]; apply(); }

  var pad = document.createElement('div'); pad.id = 'pad';
  pad.innerHTML = '<div class="dp"><b>▲</b><b>▼</b><b>◀</b><b>▶</b><i></i></div>' +
    '<div class="k fx" data-k="x">X</div><div class="k fa" data-k="a">A</div><div class="k fb" data-k="b">B</div><div class="k fy" data-k="y">Y</div>' +
    '<div class="pill sl" data-k="sel">SELECT</div><div class="pill st" data-k="start">START</div>' +
    '<div class="pill lg full" title="Tela cheia">⛶</div><div class="pill lg opa" title="Transparência">◐</div><div class="pill lg tog" title="Mostrar ou ocultar">🎮</div>';
  document.body.appendChild(pad);
  document.body.classList.add('touch');
  ['pointerdown'].forEach(function (t) { pad.addEventListener(t, onDown, { passive: false }); });
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
  pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  var levels = [0.5, 0.28, 0.75], li = parseInt(store('pad-op') || '0', 10) || 0;
  function setOp() { pad.style.setProperty('--op', levels[li % levels.length]); }
  setOp();
  if (store('pad-off') === '1') document.body.classList.add('pad-off');
  pad.querySelector('.opa').addEventListener('click', function () { li = (li + 1) % levels.length; store('pad-op', String(li)); setOp(); });
  pad.querySelector('.tog').addEventListener('click', function () { var off = document.body.classList.toggle('pad-off'); store('pad-off', off ? '1' : '0'); });
  pad.querySelector('.full').addEventListener('click', function () {
    var d = document.documentElement;
    try { if (document.fullscreenElement) document.exitFullscreen(); else if (d.requestFullscreen) d.requestFullscreen(); } catch (e) {}
  });
  // solta tudo se a página perde o foco (evita botão preso)
  window.addEventListener('blur', function () { touches = {}; apply(); });
  document.addEventListener('visibilitychange', function () { touches = {}; apply(); });
  window.novaeriaTouch = { press: function (n, on) { send(n, on); } };   // para testes
})();
