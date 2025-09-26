/* ...existing code... */
// Minimal particle system that responds to sliders and pointer, with snapshot and reset.
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d', { alpha: true });
const densityEl = document.getElementById('density');
const speedEl = document.getElementById('speed');
const chaosEl = document.getElementById('chaos');
const resetBtn = document.getElementById('resetBtn');
const snapshotBtn = document.getElementById('snapshotBtn');
const particlesInfo = document.getElementById('particlesInfo');
const subtitle = document.getElementById('subtitle');

let DPR = Math.max(1, window.devicePixelRatio || 1);
let W = 0, H = 0;
let particles = [];
let ptr = { x: 0.5, y: 0.5, active: false };

function resize() {
  W = canvas.clientWidth || canvas.width;
  H = canvas.clientHeight || canvas.height;
  canvas.width = Math.floor(canvas.clientWidth * DPR);
  canvas.height = Math.floor(canvas.clientHeight * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function rand(min=0,max=1){ return Math.random()*(max-min)+min }

function makeParticles(n){
  particles = new Array(n).fill(0).map(()=>({
    x: rand(0,W),
    y: rand(0,H),
    vx: rand(-0.5,0.5),
    vy: rand(-0.5,0.5),
    size: rand(0.7,2.2),
    hue: Math.floor(rand(200,220)),
  }));
  particlesInfo.textContent = `Particles: ${particles.length}`;
}

function step(dt){
  const speed = parseFloat(speedEl.value);
  const chaos = parseFloat(chaosEl.value);
  for(let p of particles){
    // attraction to pointer
    if(ptr.active){
      const dx = (ptr.x*W) - p.x;
      const dy = (ptr.y*H) - p.y;
      const d2 = Math.max(1200, dx*dx+dy*dy);
      p.vx += (dx / d2) * 300 * speed;
      p.vy += (dy / d2) * 300 * speed;
    }

    // neighbor-like simple cohesion via slight global pull
    p.vx += (W/2 - p.x) * 0.00002 * speed;
    p.vy += (H/2 - p.y) * 0.00002 * speed;

    // chaos
    p.vx += rand(-1,1) * 0.08 * chaos;
    p.vy += rand(-1,1) * 0.08 * chaos;

    // integrate
    p.x += p.vx * dt * (12 * speed);
    p.y += p.vy * dt * (12 * speed);

    // friction & clamp
    p.vx *= 0.96;
    p.vy *= 0.96;
    if(p.x < -20) p.x = W+20;
    if(p.x > W+20) p.x = -20;
    if(p.y < -20) p.y = H+20;
    if(p.y > H+20) p.y = -20;
  }
}

let last = performance.now();
function loop(now){
  const dt = Math.min(40, now - last) / 1000;
  last = now;
  step(dt);
  render();
  requestAnimationFrame(loop);
}

function render(){
  ctx.clearRect(0,0,W,H);

  // subtle background gradient made by radial blur-like circles
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'rgba(248,252,255,0.9)');
  g.addColorStop(1,'rgba(241,247,255,0.95)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  // draw connections for a light web effect
  ctx.globalCompositeOperation = 'lighter';
  for(let i=0;i<particles.length;i++){
    const a = particles[i];
    for(let j=i+1;j<i+6 && j<particles.length;j++){
      const b = particles[j];
      const dx = a.x-b.x, dy = a.y-b.y;
      const d2 = dx*dx+dy*dy;
      if(d2 < 12000){
        const alpha = 0.012 + (1 - d2/12000) * 0.06;
        ctx.strokeStyle = `rgba(11,102,255,${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  // draw particles
  for(let p of particles){
    const r = p.size;
    ctx.beginPath();
    ctx.fillStyle = `hsl(${p.hue} 80% 55% / 0.95)`;
    ctx.arc(p.x, p.y, r, 0, Math.PI*2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'source-over';
}

// Input handlers
canvas.addEventListener('pointermove', (e)=>{
  const rect = canvas.getBoundingClientRect();
  ptr.x = (e.clientX - rect.left) / rect.width;
  ptr.y = (e.clientY - rect.top) / rect.height;
});
canvas.addEventListener('pointerdown', (e)=>{
  ptr.active = true;
  subtitle.textContent = 'Interaction detected — patterns respond.';
});
window.addEventListener('pointerup', ()=>{ ptr.active = false; subtitle.textContent = 'A quiet ripple becomes motion.' });

// Controls
function applyDensity(){
  const n = Math.max(10, parseInt(densityEl.value,10));
  makeParticles(n);
}
densityEl.addEventListener('input', ()=>{ applyDensity(); });
resetBtn.addEventListener('click', ()=>{
  densityEl.value = 80;
  speedEl.value = 0.6;
  chaosEl.value = 0.18;
  applyDensity();
  subtitle.textContent = 'Reset to baseline — explore again.';
});
snapshotBtn.addEventListener('click', ()=>{
  // snapshot canvas as PNG in new tab
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'snapshot.png';
  link.click();
});

// initialize
(function init(){
  // size canvas to container
  const style = getComputedStyle(canvas);
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  resize();
  applyDensity();
  requestAnimationFrame(loop);
})();

/* ...existing code... */

