import{L as S,r as h}from"./vendor-Ch_Cr6m3.js";const ae=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Flow Field with Particle Trails</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #0a0a0a; }
  canvas { display: block; width: 100vw; height: 100vh; }
  .label {
    position: fixed;
    top: 20px;
    left: 24px;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(200, 149, 108, 0.5);
    z-index: 10;
    pointer-events: none;
    user-select: none;
  }
</style>
</head>
<body>
<div class="label">Flow Field</div>
<canvas id="canvas"></canvas>
<script>
// ─────────────────────────────────────────────
// Simplex Noise (compact implementation)
// Based on Stefan Gustavson's simplex noise
// ─────────────────────────────────────────────
const SimplexNoise = (function() {
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  const F3 = 1 / 3;
  const G3 = 1 / 6;

  const grad3 = [
    [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
    [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
    [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
  ];

  function SimplexNoise(seed) {
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    const p = new Uint8Array(256);
    // Seed-based permutation
    seed = seed || Math.random() * 65536;
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      seed = (seed * 16807 + 0) % 2147483647;
      const j = seed % (i + 1);
      const tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  SimplexNoise.prototype.noise2D = function(xin, yin) {
    const perm = this.perm, permMod12 = this.permMod12;
    let n0, n1, n2;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t, Y0 = j - t;
    const x0 = xin - X0, y0 = yin - Y0;
    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; }
    else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let t0 = 0.5 - x0*x0 - y0*y0;
    if (t0 < 0) n0 = 0;
    else { t0 *= t0; const gi = permMod12[ii + perm[jj]]; n0 = t0 * t0 * (grad3[gi][0]*x0 + grad3[gi][1]*y0); }
    let t1 = 0.5 - x1*x1 - y1*y1;
    if (t1 < 0) n1 = 0;
    else { t1 *= t1; const gi = permMod12[ii + i1 + perm[jj + j1]]; n1 = t1 * t1 * (grad3[gi][0]*x1 + grad3[gi][1]*y1); }
    let t2 = 0.5 - x2*x2 - y2*y2;
    if (t2 < 0) n2 = 0;
    else { t2 *= t2; const gi = permMod12[ii + 1 + perm[jj + 1]]; n2 = t2 * t2 * (grad3[gi][0]*x2 + grad3[gi][1]*y2); }
    return 70 * (n0 + n1 + n2);
  };

  SimplexNoise.prototype.noise3D = function(xin, yin, zin) {
    const perm = this.perm, permMod12 = this.permMod12;
    let n0, n1, n2, n3;
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
    const t = (i + j + k) * G3;
    const X0 = i - t, Y0 = j - t, Z0 = k - t;
    const x0 = xin - X0, y0 = yin - Y0, z0 = zin - Z0;
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=1;k2=0; }
      else if (x0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=0;k2=1; }
      else { i1=0;j1=0;k1=1;i2=1;j2=0;k2=1; }
    } else {
      if (y0 < z0) { i1=0;j1=0;k1=1;i2=0;j2=1;k2=1; }
      else if (x0 < z0) { i1=0;j1=1;k1=0;i2=0;j2=1;k2=1; }
      else { i1=0;j1=1;k1=0;i2=1;j2=1;k2=0; }
    }
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2*G3, y2 = y0 - j2 + 2*G3, z2 = z0 - k2 + 2*G3;
    const x3 = x0 - 1 + 3*G3, y3 = y0 - 1 + 3*G3, z3 = z0 - 1 + 3*G3;
    const ii = i & 255, jj = j & 255, kk = k & 255;
    let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if (t0 < 0) n0 = 0;
    else { t0 *= t0; const gi = permMod12[ii+perm[jj+perm[kk]]]; n0 = t0*t0*(grad3[gi][0]*x0+grad3[gi][1]*y0+grad3[gi][2]*z0); }
    let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if (t1 < 0) n1 = 0;
    else { t1 *= t1; const gi = permMod12[ii+i1+perm[jj+j1+perm[kk+k1]]]; n1 = t1*t1*(grad3[gi][0]*x1+grad3[gi][1]*y1+grad3[gi][2]*z1); }
    let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if (t2 < 0) n2 = 0;
    else { t2 *= t2; const gi = permMod12[ii+i2+perm[jj+j2+perm[kk+k2]]]; n2 = t2*t2*(grad3[gi][0]*x2+grad3[gi][1]*y2+grad3[gi][2]*z2); }
    let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if (t3 < 0) n3 = 0;
    else { t3 *= t3; const gi = permMod12[ii+1+perm[jj+1+perm[kk+1]]]; n3 = t3*t3*(grad3[gi][0]*x3+grad3[gi][1]*y3+grad3[gi][2]*z3); }
    return 32 * (n0 + n1 + n2 + n3);
  };

  return SimplexNoise;
})();

// ─────────────────────────────────────────────
// Flow Field Renderer
// ─────────────────────────────────────────────
(function() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const noise = new SimplexNoise(42);
  const dpr = window.devicePixelRatio || 1;

  let W, H;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Fill with background on resize to avoid flash
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);
  }

  window.addEventListener('resize', resize);
  resize();

  // ── Mouse tracking ──
  const mouse = { x: -9999, y: -9999, active: false };
  window.addEventListener('mousemove', function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  window.addEventListener('mouseleave', function() {
    mouse.active = false;
  });

  // ── Color palette ──
  // Warm tones: amber, gold, coral, with variations
  const palette = [
    { r: 200, g: 149, b: 108 }, // amber  #c8956c
    { r: 212, g: 165, b: 116 }, // gold   #d4a574
    { r: 224, g: 120, b: 80  }, // coral  #e07850
    { r: 190, g: 130, b: 90  }, // dark amber
    { r: 230, g: 180, b: 140 }, // light gold
    { r: 210, g: 100, b: 70  }, // deep coral
    { r: 180, g: 160, b: 120 }, // muted gold
  ];

  function lerpColor(a, b, t) {
    return {
      r: a.r + (b.r - a.r) * t,
      g: a.g + (b.g - a.g) * t,
      b: a.b + (b.b - a.b) * t
    };
  }

  function getColor(noiseVal) {
    // Map noise [-1,1] to palette index
    const t = (noiseVal + 1) * 0.5; // 0..1
    const idx = t * (palette.length - 1);
    const i = Math.floor(idx);
    const f = idx - i;
    const a = palette[Math.min(i, palette.length - 1)];
    const b = palette[Math.min(i + 1, palette.length - 1)];
    return lerpColor(a, b, f);
  }

  // ── Particles ──
  const PARTICLE_COUNT = 2500;
  let NOISE_SCALE = 0.0025;
  let SPEED = 1.2;
  const MOUSE_RADIUS = 150;
  const MOUSE_FORCE = 2.5;

  const particles = [];

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      speed: 0.4 + Math.random() * 1.0,
      alpha: 0.15 + Math.random() * 0.55,
      size: 0.5 + Math.random() * 1.5
    };
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle());
  }

  // ── Animation ──
  let time = 0;

  function draw() {
    // Fade previous frame with dark overlay — creates trailing effect
    ctx.fillStyle = 'rgba(10, 10, 10, 0.03)';
    ctx.fillRect(0, 0, W, H);

    time += 0.0008;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];

      // Sample noise field at particle position with time evolution
      const nx = p.x * NOISE_SCALE;
      const ny = p.y * NOISE_SCALE;
      const angle = noise.noise3D(nx, ny, time) * Math.PI * 2;

      // Secondary noise for color variation
      const colorNoise = noise.noise3D(nx * 1.5 + 100, ny * 1.5 + 100, time * 0.5);

      // Velocity from flow field
      let vx = Math.cos(angle) * p.speed * SPEED;
      let vy = Math.sin(angle) * p.speed * SPEED;

      // Mouse interaction — gentle push away
      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE;
          vx += (dx / dist) * force;
          vy += (dy / dist) * force;
        }
      }

      // Store previous position for line drawing
      const px = p.x;
      const py = p.y;

      // Update position
      p.x += vx;
      p.y += vy;

      // Draw particle trail segment
      const color = getColor(colorNoise);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = 'rgba(' + Math.round(color.r) + ',' + Math.round(color.g) + ',' + Math.round(color.b) + ',' + p.alpha + ')';
      ctx.lineWidth = p.size;
      ctx.stroke();

      // Respawn if offscreen
      if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
        p.x = Math.random() * W;
        p.y = Math.random() * H;
      }
    }

    requestAnimationFrame(draw);
  }

  // Initial fill
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);

  requestAnimationFrame(draw);

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'param') {
      switch (e.data.name) {
        case 'SPEED': SPEED = e.data.value; break;
        case 'NOISE_SCALE': NOISE_SCALE = e.data.value; break;
      }
    }
  });
})();
<\/script>
<script defer src="https://static.cloudflareinsights.com/beacon.min.js/v8c78df7c7c0f484497ecbca7046644da1771523124516" integrity="sha512-8DS7rgIrAmghBFwoOTujcf6D9rXvH8xm8JQ1Ja01h9QX8EzXldiszufYa4IFfKdLUKTTrnSFXLDkUEOTrZQ8Qg==" data-cf-beacon='{"version":"2024.11.0","token":"216c03e5eb1b42998a91f716785010f9","r":1,"server_timing":{"name":{"cfCacheStatus":true,"cfEdge":true,"cfExtPri":true,"cfL4":true,"cfOrigin":true,"cfSpeedBrain":true},"location_startswith":null}}' crossorigin="anonymous"><\/script>
</body>
</html>
`,F=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Network Diagnostics</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
    <!-- GSAP & ScrollTrigger for Masked Reveal -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"><\/script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400&family=JetBrains+Mono:wght@200;300;400&display=swap" rel="stylesheet">
    <style>
        /* Essential mask utility for inner gradient borders */
        .mask-border {
            -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
            mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: destination-out;
            mask-composite: exclude;
        }
    </style>
</head>
<body class="bg-[#020804] text-white/90 antialiased min-h-screen flex items-center justify-center p-6 md:p-12 selection:bg-[#34d399]/20 font-sans relative overflow-hidden">

    <!-- Aura Asset Image Background Layer -->
    <div class="absolute inset-0 z-0 opacity-20 bg-[url('https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/fa51902b-c2a4-4c33-a96e-a8f1ef67edc6_1600w.jpg')] bg-cover bg-center pointer-events-none mix-blend-screen"></div>

    <!-- WebGL-style Lines & Particles Background -->
    <canvas id="bg-waves" class="absolute inset-0 z-0 pointer-events-none opacity-40"></canvas>

    <main id="main-container" class="max-w-7xl w-full relative bg-white/[0.04] p-px z-10 backdrop-blur-sm shadow-2xl shadow-[#34d399]/5 rounded-sm">
        
        <div id="flashlight" class="absolute inset-0 z-0 opacity-0 transition-opacity duration-300 pointer-events-none" style="background: radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(52,211,153,0.08), transparent 40%);"></div>

        <!-- Corner Accents -->
        <div class="absolute -top-[3px] -left-[3px] w-1.5 h-1.5 border border-[#34d399]/30 bg-[#020804] z-30"></div>
        <div class="absolute -top-[3px] -right-[3px] w-1.5 h-1.5 border border-[#34d399]/30 bg-[#020804] z-30"></div>
        <div class="absolute -bottom-[3px] -left-[3px] w-1.5 h-1.5 border border-[#34d399]/30 bg-[#020804] z-30"></div>
        <div class="absolute -bottom-[3px] -right-[3px] w-1.5 h-1.5 border border-[#34d399]/30 bg-[#020804] z-30"></div>

        <!-- Horizontal Shooting Line -->
        <div class="hidden md:block absolute -top-px left-0 right-0 h-px overflow-hidden z-20 pointer-events-none">
            <div id="shoot-h" class="absolute top-0 left-0 w-64 h-full bg-gradient-to-r from-transparent via-[#34d399]/80 to-transparent"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-y-px md:gap-x-px relative z-10">
            
            <article class="relative flex flex-col py-12 md:p-12 bg-[#020804]/90 backdrop-blur-md">
                <!-- Border Gradient Overlay -->
                <div class="absolute inset-0 border border-transparent bg-[linear-gradient(to_bottom,rgba(52,211,153,0.35),transparent)] mask-border pointer-events-none z-20"></div>

                <header class="text-xs text-white/40 mb-16 uppercase tracking-widest font-mono flex items-center gap-3 font-extralight">
                    <iconify-icon icon="solar:cpu-linear" stroke-width="1.5" class="text-sm text-[#34d399] drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"></iconify-icon>
                    CORE-X
                </header>
                <div class="flex-grow flex items-center justify-center mb-16 relative h-56 w-full">
                    <canvas id="canvas-layers" class="absolute inset-0 w-full h-full" style="touch-action: none;"></canvas>
                </div>
                <div>
                    <h3 class="text-lg font-extralight tracking-tight mb-3 text-white/90 flex items-center">
                        <span class="typewriter" data-text="Neural Synchrony"></span><span class="animate-pulse inline-block w-1 h-4 bg-[#34d399]/80 ml-2 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                    </h3>
                    <p class="text-sm text-white/40 leading-relaxed font-extralight reveal-text">Optimized for zero-latency cognitive routing, maintaining absolute parity across decentralized processing nodes.</p>
                </div>
            </article>

            <article class="relative flex flex-col py-12 md:p-12 bg-[#020804]/90 backdrop-blur-md">
                <!-- Border Gradient Overlay -->
                <div class="absolute inset-0 border border-transparent bg-[linear-gradient(to_bottom,rgba(52,211,153,0.35),transparent)] mask-border pointer-events-none z-20"></div>
                
                <div class="hidden md:block absolute top-0 bottom-0 -left-px w-px overflow-hidden z-20 pointer-events-none">
                    <div id="shoot1" class="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-transparent via-[#34d399]/70 to-transparent"></div>
                </div>
                
                <header class="text-xs text-white/40 mb-16 uppercase tracking-widest font-mono flex items-center gap-3 font-extralight">
                    <iconify-icon icon="solar:server-square-linear" stroke-width="1.5" class="text-sm text-[#34d399] drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"></iconify-icon>
                    LINK-Y
                </header>
                <div class="flex-grow flex items-center justify-center mb-16 relative h-56 w-full">
                    <canvas id="canvas-nodes" class="absolute inset-0 w-full h-full" style="touch-action: none;"></canvas>
                </div>
                <div>
                    <h3 class="text-lg font-extralight tracking-tight mb-3 text-white/90 flex items-center">
                        <span class="typewriter" data-text="Fluid Topologies"></span><span class="animate-pulse inline-block w-1 h-4 bg-[#34d399]/80 ml-2 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                    </h3>
                    <p class="text-sm text-white/40 leading-relaxed font-extralight reveal-text">Self-healing network architectures that dynamically adjust vectors to circumvent bottlenecks and systemic anomalies.</p>
                </div>
            </article>

            <article class="relative flex flex-col py-12 md:p-12 bg-[#020804]/90 backdrop-blur-md">
                <!-- Border Gradient Overlay -->
                <div class="absolute inset-0 border border-transparent bg-[linear-gradient(to_bottom,rgba(52,211,153,0.35),transparent)] mask-border pointer-events-none z-20"></div>

                <div class="hidden md:block absolute top-0 bottom-0 -left-px w-px overflow-hidden z-20 pointer-events-none">
                    <div id="shoot2" class="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-transparent via-[#34d399]/60 to-transparent"></div>
                </div>
                <div class="hidden md:block absolute top-0 bottom-0 -right-px w-px overflow-hidden z-20 pointer-events-none">
                    <div id="shoot3" class="absolute top-0 left-0 w-full h-56 bg-gradient-to-b from-transparent via-[#34d399]/70 to-transparent"></div>
                </div>

                <header class="text-xs text-white/40 mb-16 uppercase tracking-widest font-mono flex items-center gap-3 font-extralight">
                    <iconify-icon icon="solar:network-linear" stroke-width="1.5" class="text-sm text-[#34d399] drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"></iconify-icon>
                    GRID-Z
                </header>
                <div class="flex-grow flex items-center justify-center mb-16 relative h-56 w-full">
                    <canvas id="canvas-flow" class="absolute inset-0 w-full h-full" style="touch-action: none;"></canvas>
                </div>
                <div>
                    <h3 class="text-lg font-extralight tracking-tight mb-3 text-white/90 flex items-center">
                        <span class="typewriter" data-text="Elastic Matrices"></span><span class="animate-pulse inline-block w-1 h-4 bg-[#34d399]/80 ml-2 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                    </h3>
                    <p class="text-sm text-white/40 leading-relaxed font-extralight reveal-text">Responsive structural frameworks that instantly allocate computational mass during spikes and retract to preserve efficiency.</p>
                </div>
            </article>

        </div>
    </main>

    <script>
        // WebGL-style Background (Lines & Particles)
        const bgCanvas = document.getElementById('bg-waves');
        const bgCtx = bgCanvas.getContext('2d', { alpha: true });
        let bw, bh, bgT = 0;
        const resizeBg = () => {
            bw = window.innerWidth; bh = window.innerHeight;
            bgCanvas.width = bw; bgCanvas.height = bh;
        };
        window.addEventListener('resize', resizeBg);
        resizeBg();

        const drawBg = () => {
            bgT += 0.012;
            bgCtx.clearRect(0, 0, bw, bh);
            bgCtx.save();
            bgCtx.translate(bw / 2, bh / 2 + 150);
            
            const cols = 32, rows = 22, sp = 65;
            bgCtx.lineWidth = 1;
            
            for(let z = 0; z < rows; z++) {
                for(let x = 0; x < cols; x++) {
                    const px = (x - cols/2) * sp;
                    const pz = z * sp;
                    const scale = 800 / (800 + pz);
                    const sx = px * scale;
                    const y = Math.sin(x * 0.3 + bgT) * Math.cos(z * 0.3 + bgT) * 60;
                    const sy = (y + 50) * scale - 200;

                    bgCtx.fillStyle = \`rgba(52,211,153, \${0.7 * scale})\`;
                    bgCtx.beginPath();
                    bgCtx.arc(sx, sy, 1.2 * scale, 0, Math.PI*2);
                    bgCtx.fill();

                    if (x > 0) {
                        const pxL = (x - 1 - cols/2) * sp;
                        const sxL = pxL * scale;
                        const yL = Math.sin((x - 1) * 0.3 + bgT) * Math.cos(z * 0.3 + bgT) * 60;
                        const syL = (yL + 50) * scale - 200;
                        bgCtx.strokeStyle = \`rgba(52,211,153, \${0.12 * scale})\`;
                        bgCtx.beginPath();
                        bgCtx.moveTo(sx, sy); bgCtx.lineTo(sxL, syL);
                        bgCtx.stroke();
                    }
                    if (z > 0) {
                        const pzU = (z - 1) * sp;
                        const scaleU = 800 / (800 + pzU);
                        const sxU = px * scaleU;
                        const yU = Math.sin(x * 0.3 + bgT) * Math.cos((z - 1) * 0.3 + bgT) * 60;
                        const syU = (yU + 50) * scaleU - 200;
                        bgCtx.strokeStyle = \`rgba(52,211,153, \${0.12 * scale})\`;
                        bgCtx.beginPath();
                        bgCtx.moveTo(sx, sy); bgCtx.lineTo(sxU, syU);
                        bgCtx.stroke();
                    }
                }
            }
            bgCtx.restore();
            requestAnimationFrame(drawBg);
        };
        drawBg();

        // Interactive & Shooting Lines
        const mainEl = document.getElementById('main-container');
        const flash = document.getElementById('flashlight');
        const s1 = document.getElementById('shoot1'), s2 = document.getElementById('shoot2');
        const s3 = document.getElementById('shoot3'), sh = document.getElementById('shoot-h');
        let pos1 = -200, pos2 = -400, pos3 = -300, posH = -300;

        mainEl.addEventListener('mousemove', (e) => {
            const rect = mainEl.getBoundingClientRect();
            flash.style.setProperty('--x', \`\${e.clientX - rect.left}px\`);
            flash.style.setProperty('--y', \`\${e.clientY - rect.top}px\`);
            flash.style.opacity = '1';
        });
        mainEl.addEventListener('mouseleave', () => flash.style.opacity = '0');

        const animateShoots = () => {
            const h = mainEl.offsetHeight || 1000, w = mainEl.offsetWidth || 1200;
            pos1 += 2.5; pos2 += 1.8; pos3 += 3; posH += 3.5;
            if (pos1 > h) pos1 = -200;
            if (pos2 > h) pos2 = -200;
            if (pos3 > h) pos3 = -200;
            if (posH > w) posH = -300;
            if (s1) s1.style.transform = \`translateY(\${pos1}px)\`;
            if (s2) s2.style.transform = \`translateY(\${pos2}px)\`;
            if (s3) s3.style.transform = \`translateY(\${pos3}px)\`;
            if (sh) sh.style.transform = \`translateX(\${posH}px)\`;
            requestAnimationFrame(animateShoots);
        };
        animateShoots();

        // Typewriter Effect
        document.querySelectorAll('.typewriter').forEach(el => {
            const text = el.getAttribute('data-text');
            let i = 0, isDeleting = false;
            const type = () => {
                i += isDeleting ? -1 : 1;
                el.textContent = text.substring(0, i);
                let delay = isDeleting ? 30 : 80;
                if (!isDeleting && i === text.length) { delay = 4000; isDeleting = true; }
                else if (isDeleting && i === 0) { delay = 1500; isDeleting = false; }
                setTimeout(type, delay);
            };
            type();
        });

        // GSAP Masked Staggered Word Reveal 
        gsap.registerPlugin(ScrollTrigger);
        document.querySelectorAll('.reveal-text').forEach((el) => {
            const words = el.innerText.split(' ');
            el.innerHTML = '';
            words.forEach(word => {
                const wrapper = document.createElement('span');
                wrapper.className = 'inline-block overflow-hidden mr-[0.25em] align-bottom leading-tight';
                const inner = document.createElement('span');
                inner.className = 'inline-block translate-y-full will-change-transform';
                inner.innerText = word;
                wrapper.appendChild(inner);
                el.appendChild(wrapper);
            });

            gsap.to(el.querySelectorAll('.will-change-transform'), {
                y: 0,
                ease: "power4.out",
                duration: 0.8,
                stagger: 0.02,
                scrollTrigger: {
                    trigger: el,
                    start: "top 95%",
                }
            });
        });

        // 3D Canvas Utilities
        const projectIso = (x, y, z) => {
            const angle = Math.PI / 6; 
            return { x: (x - z) * Math.cos(angle), y: y + (x + z) * Math.sin(angle) };
        };

        const setupCanvas = (id, renderFn) => {
            const canvas = document.getElementById(id);
            const ctx = canvas.getContext('2d', { alpha: true });
            let w, h, time = 0;
            const resize = () => {
                const rect = canvas.parentElement.getBoundingClientRect();
                w = rect.width; h = rect.height;
                const dpr = window.devicePixelRatio || 1;
                canvas.width = w * dpr; canvas.height = h * dpr;
                ctx.scale(dpr, dpr);
            };
            window.addEventListener('resize', resize);
            resize();
            const loop = () => {
                time += 0.015;
                ctx.clearRect(0, 0, w, h);
                ctx.save();
                ctx.translate(w / 2, h / 2 + 5);
                renderFn(ctx, time);
                ctx.restore();
                requestAnimationFrame(loop);
            };
            loop();
        };

        // Card 1: Fixed Cropping
        setupCanvas('canvas-layers', (ctx, t) => {
            const size = 42, layers = 5, gap = 20;
            ctx.lineWidth = 1;
            for (let i = layers - 1; i >= 0; i--) {
                const yOff = i * gap - (layers * gap) / 2 + Math.sin(t + i * 0.4) * 4;
                const p1 = projectIso(-size, yOff, -size), p2 = projectIso(size, yOff, -size);
                const p3 = projectIso(size, yOff, size), p4 = projectIso(-size, yOff, size);

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.closePath();
                
                ctx.fillStyle = '#020804'; ctx.fill();
                ctx.strokeStyle = i === 0 ? 'rgba(52,211,153,0.8)' : 'rgba(52,211,153,0.15)';
                ctx.stroke();

                if (i === 0) {
                    ctx.save();
                    const center = projectIso(0, yOff, 0);
                    ctx.translate(center.x, center.y); ctx.scale(1, 0.5);
                    const sqSize = size * 0.55;
                    ctx.beginPath(); ctx.rect(-sqSize, -sqSize, sqSize * 2, sqSize * 2);
                    ctx.strokeStyle = 'rgba(52,211,153,0.4)'; ctx.stroke();
                    ctx.clip();
                    for(let j = -sqSize; j < sqSize; j += 4) {
                        ctx.beginPath(); ctx.moveTo(-sqSize, j); ctx.lineTo(sqSize, j);
                        ctx.strokeStyle = 'rgba(52,211,153,0.2)'; ctx.stroke();
                    }
                    ctx.restore();
                }
                
                if (i < layers - 1) {
                    const nextY = (i+1) * gap - (layers * gap) / 2 + Math.sin(t + (i+1) * 0.4) * 4;
                    const p1Next = projectIso(-size, nextY, -size), p3Next = projectIso(size, nextY, size);
                    ctx.beginPath(); ctx.setLineDash([2, 2]);
                    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p1Next.x, p1Next.y);
                    ctx.moveTo(p3.x, p3.y); ctx.lineTo(p3Next.x, p3Next.y);
                    ctx.strokeStyle = 'rgba(52,211,153,0.1)'; ctx.stroke();
                    ctx.setLineDash([]);
                }
            }
        });

        // Card 2
        const drawCube = (ctx, x, y, z, s, colorStr) => {
            const pts = [
                projectIso(x-s, y-s, z-s), projectIso(x+s, y-s, z-s), projectIso(x+s, y-s, z+s), projectIso(x-s, y-s, z+s),
                projectIso(x-s, y+s, z-s), projectIso(x+s, y+s, z-s), projectIso(x+s, y+s, z+s), projectIso(x-s, y+s, z+s)
            ];
            ctx.strokeStyle = colorStr; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.lineTo(pts[2].x, pts[2].y); ctx.lineTo(pts[3].x, pts[3].y); ctx.closePath();
            ctx.moveTo(pts[4].x, pts[4].y); ctx.lineTo(pts[5].x, pts[5].y); ctx.lineTo(pts[6].x, pts[6].y); ctx.lineTo(pts[7].x, pts[7].y); ctx.closePath();
            ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[4].x, pts[4].y);
            ctx.moveTo(pts[1].x, pts[1].y); ctx.lineTo(pts[5].x, pts[5].y);
            ctx.moveTo(pts[2].x, pts[2].y); ctx.lineTo(pts[6].x, pts[6].y);
            ctx.moveTo(pts[3].x, pts[3].y); ctx.lineTo(pts[7].x, pts[7].y);
            ctx.stroke();
        };

        setupCanvas('canvas-nodes', (ctx, t) => {
            const s = 22, float = Math.sin(t) * 4;
            drawCube(ctx, -35, -float, -35, s, 'rgba(52,211,153,0.15)');
            drawCube(ctx, 35, float, -35, s, 'rgba(52,211,153,0.15)');
            drawCube(ctx, -35, float, 35, s, 'rgba(52,211,153,0.15)');
            drawCube(ctx, 35, -float, 35, s, 'rgba(52,211,153,0.15)');
            drawCube(ctx, 0, Math.cos(t)*6 - 15, 0, s*0.9, 'rgba(52,211,153,0.6)'); 
        });

        // Card 3
        setupCanvas('canvas-flow', (ctx, t) => {
            const size = 65, segments = 22, step = (size * 2) / segments;
            ctx.lineWidth = 1;
            const getH = (x, z) => {
                const dist = Math.sqrt(x*x + z*z);
                const peak = Math.max(0, 45 - dist * 1.1);
                const wave = Math.sin(x*0.2 + t*1.5) * Math.cos(z*0.2 + t*1.5) * 5;
                return -peak - wave + 15;
            };

            for (let z = -size; z < size; z += step) {
                for (let x = -size; x < size; x += step) {
                    const y1 = getH(x, z), y2 = getH(x + step, z);
                    const y3 = getH(x + step, z + step), y4 = getH(x, z + step);
                    const p1 = projectIso(x, y1, z), p2 = projectIso(x + step, y2, z);
                    const p3 = projectIso(x + step, y3, z + step), p4 = projectIso(x, y4, z + step);

                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.closePath();
                    ctx.fillStyle = '#020804'; ctx.fill();

                    const heightRatio = Math.max(0, (-y1) / 30);
                    const alpha = 0.05 + heightRatio * 0.4;
                    ctx.strokeStyle = heightRatio > 0.6 ? \`rgba(52,211,153,\${alpha + 0.3})\` : \`rgba(52,211,153,\${alpha + 0.05})\`;
                    ctx.stroke();
                }
            }
        });
    <\/script>
</body>
</html>`,ie=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Global Connectivity Nexus</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"><\/script>
</head>
<body class="font-sans antialiased text-blue-950 min-h-screen flex flex-col" style="background: linear-gradient(180deg, rgba(240,244,248,0.92) 0%, rgba(225,234,244,0.92) 40%, rgba(196,217,239,0.92) 80%, rgba(166,200,234,0.92) 100%), url('https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/e534354d-c5f2-4399-a1d9-2f50338e8c47_1600w.jpg') center/cover no-repeat fixed; background-blend-mode: normal;">

    <!-- Main Structural Container -->
    <div class="max-w-6xl mx-auto w-full flex-grow flex flex-col border-x border-transparent relative bg-white/20 backdrop-blur-[2px]" style="border-image: linear-gradient(to bottom, rgba(147,197,253,0.1), rgba(147,197,253,0.7), rgba(147,197,253,0.1)) 1;">
        
        <!-- Top Corner Squares -->
        <div class="absolute -top-[3px] -left-[3px] w-1.5 h-1.5 bg-blue-400/70 z-20"></div>
        <div class="absolute -top-[3px] -right-[3px] w-1.5 h-1.5 bg-blue-400/70 z-20"></div>

        <!-- Header Section -->
        <header class="pt-24 pb-20 px-6 text-center border-b border-transparent relative z-10" style="border-image: linear-gradient(to right, rgba(147,197,253,0.1), rgba(147,197,253,0.7), rgba(147,197,253,0.1)) 1;">
            <h1 id="reveal-title" class="text-5xl md:text-6xl font-normal tracking-tight text-blue-950 max-w-3xl mx-auto leading-tight">
                The nexus of <br> global connectivity
            </h1>
            
            <!-- Header Bottom Corner Squares -->
            <div class="absolute -bottom-[3px] -left-[3px] w-1.5 h-1.5 bg-blue-400/70 z-20"></div>
            <div class="absolute -bottom-[3px] -right-[3px] w-1.5 h-1.5 bg-blue-400/70 z-20"></div>
        </header>

        <!-- Stats Section -->
        <section class="border-b border-transparent relative z-10 bg-white/10" style="border-image: linear-gradient(to right, rgba(147,197,253,0.1), rgba(147,197,253,0.7), rgba(147,197,253,0.1)) 1;">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-blue-300/40 text-center">
                
                <div class="flex flex-col items-center justify-center space-y-3 py-14 px-6 relative">
                    <div class="text-4xl font-normal text-blue-950 tracking-tight">150+</div>
                    <div class="text-sm text-blue-800/70 max-w-[160px] leading-relaxed">
                        countries integrated worldwide
                    </div>
                    <!-- Internal Grid Intersection Square -->
                    <div class="hidden lg:block absolute -bottom-[3px] -right-[3px] w-1.5 h-1.5 bg-blue-400/70 z-20"></div>
                </div>

                <div class="flex flex-col items-center justify-center space-y-3 py-14 px-6 relative">
                    <div class="text-4xl font-normal text-blue-800/90 tracking-tight">
                        <span class="text-blue-500/80 font-light mr-1">$</span>3.1T
                    </div>
                    <div class="text-sm text-blue-800/70 max-w-[160px] leading-relaxed">
                        annual transfer volume
                    </div>
                    <!-- Internal Grid Intersection Square -->
                    <div class="hidden lg:block absolute -bottom-[3px] -right-[3px] w-1.5 h-1.5 bg-blue-400/70 z-20"></div>
                </div>

                <div class="flex flex-col items-center justify-center space-y-3 py-14 px-6 relative">
                    <div class="text-4xl font-normal text-blue-800/80 tracking-tight">99.999%</div>
                    <div class="text-sm text-blue-800/70 max-w-[160px] leading-relaxed">
                        infrastructure reliability
                    </div>
                    <!-- Internal Grid Intersection Square -->
                    <div class="hidden lg:block absolute -bottom-[3px] -right-[3px] w-1.5 h-1.5 bg-blue-400/70 z-20"></div>
                </div>

                <div class="flex flex-col items-center justify-center space-y-3 py-14 px-6">
                    <div class="text-4xl font-normal text-blue-700/80 tracking-tight">850M+</div>
                    <div class="text-sm text-blue-800/70 max-w-[160px] leading-relaxed">
                        verified digital identities
                    </div>
                </div>

            </div>
            
            <!-- Stats Bottom Corner Squares -->
            <div class="absolute -bottom-[3px] -left-[3px] w-1.5 h-1.5 bg-blue-400/70 z-20"></div>
            <div class="absolute -bottom-[3px] -right-[3px] w-1.5 h-1.5 bg-blue-400/70 z-20"></div>
        </section>

        <!-- Animation Section -->
        <main class="flex-grow relative overflow-hidden min-h-[500px]">
            
            <!-- Controls -->
            <div class="absolute top-6 right-6 flex gap-2 z-20">
                <button id="pauseBtn" class="w-8 h-8 flex items-center justify-center bg-white/40 hover:bg-white/60 backdrop-blur-md border border-blue-300/40 rounded text-blue-800 transition-all cursor-pointer" aria-label="Pause animation">
                    <iconify-icon icon="solar:pause-linear" width="16" height="16" style="stroke-width: 1.5;"></iconify-icon>
                </button>
                <button class="w-8 h-8 flex items-center justify-center bg-white/40 hover:bg-white/60 backdrop-blur-md border border-blue-300/40 rounded text-blue-800 transition-all cursor-pointer" aria-label="Settings">
                    <iconify-icon icon="solar:settings-linear" width="16" height="16" style="stroke-width: 1.5;"></iconify-icon>
                </button>
            </div>

            <!-- Canvas Container -->
            <canvas id="networkCanvas" class="absolute inset-0 w-full h-full block z-0"></canvas>
            
            <!-- Bottom Corner Squares -->
            <div class="absolute -bottom-[3px] -left-[3px] w-1.5 h-1.5 bg-blue-400/70 z-20"></div>
            <div class="absolute -bottom-[3px] -right-[3px] w-1.5 h-1.5 bg-blue-400/70 z-20"></div>
        </main>
    </div>

    <script>
        // Background Canvas Animation
        const canvas = document.getElementById('networkCanvas');
        const ctx = canvas.getContext('2d', { alpha: true });
        let width, height;
        let particles = [];
        let isPlaying = true;
        let animationFrameId;

        function resize() {
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            canvas.width = width * window.devicePixelRatio;
            canvas.height = height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            initParticles();
        }

        class Particle {
            constructor() {
                this.reset(true);
            }

            reset(initial = false) {
                this.angle = Math.PI + (Math.random() * Math.PI); 
                if (Math.random() > 0.3) {
                    this.angle = Math.PI * 1.25 + (Math.random() * Math.PI * 0.5);
                }

                this.speed = 0.5 + Math.random() * 2.5;
                this.distance = initial ? Math.random() * (height * 1.2) : Math.random() * 50;
                this.maxLength = 20 + Math.random() * 180;
                this.length = 0;
                this.alpha = 0;
            }

            update() {
                this.distance += this.speed;
                this.length = Math.min(this.maxLength, this.distance * 0.8);
                
                const normalizedDist = this.distance / (height * 1.2);
                this.alpha = Math.min(1, this.distance / 100) * Math.max(0, 1 - normalizedDist);

                if (this.distance > height * 1.5) {
                    this.reset();
                }
            }

            draw() {
                const originX = width / 2;
                const originY = height + 50;

                const startX = originX + Math.cos(this.angle) * this.distance;
                const startY = originY + Math.sin(this.angle) * this.distance;
                const endX = originX + Math.cos(this.angle) * (this.distance + this.length);
                const endY = originY + Math.sin(this.angle) * (this.distance + this.length);

                const distRatio = Math.min(1, this.distance / height);
                const hue = 220 + (distRatio * 15);
                const lightness = 15 + (distRatio * 35);
                
                const color = \`hsla(\${hue}, 90%, \${lightness}%, \${this.alpha})\`;
                const tailColor = \`hsla(\${hue}, 90%, \${Math.max(5, lightness - 15)}%, \${this.alpha * 0.05})\`;

                ctx.beginPath();
                const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
                gradient.addColorStop(0, tailColor);
                gradient.addColorStop(1, color);
                
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 0.5 + (distRatio * 2);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(endX, endY, 0.5 + (distRatio * 1.5), 0, Math.PI * 2);
                ctx.fillStyle = \`hsla(\${hue}, 100%, \${lightness + 20}%, \${this.alpha * 1.5})\`;
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            const particleCount = window.innerWidth < 768 ? 150 : 400;
            for(let i=0; i<particleCount; i++) {
                particles.push(new Particle());
            }
        }

        function animate() {
            if (!isPlaying) return;
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        }

        window.addEventListener('resize', () => {
            cancelAnimationFrame(animationFrameId);
            resize();
            if(isPlaying) animate();
        });

        resize();
        animate();

        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.addEventListener('click', () => {
            isPlaying = !isPlaying;
            if (isPlaying) {
                pauseBtn.innerHTML = '<iconify-icon icon="solar:pause-linear" width="16" height="16" style="stroke-width: 1.5;"></iconify-icon>';
                animate();
            } else {
                pauseBtn.innerHTML = '<iconify-icon icon="solar:play-linear" width="16" height="16" style="stroke-width: 1.5;"></iconify-icon>';
                cancelAnimationFrame(animationFrameId);
            }
        });

        // GSAP Masked Text Reveal
        document.addEventListener("DOMContentLoaded", (event) => {
            gsap.registerPlugin(ScrollTrigger);
            
            const titleEl = document.getElementById('reveal-title');
            if (titleEl) {
                const lines = titleEl.innerHTML.split(/<br\\s*\\/?>/i);
                titleEl.innerHTML = '';
                
                lines.forEach((line, index) => {
                    const words = line.split(' ');
                    words.forEach((word) => {
                        if (word.trim() !== '') {
                            const wrapper = document.createElement('span');
                            wrapper.className = 'inline-block overflow-hidden align-bottom';
                            wrapper.style.paddingBottom = '0.1em'; 
                            wrapper.style.marginBottom = '-0.1em';
                            
                            const inner = document.createElement('span');
                            inner.className = 'inline-block reveal-text';
                            inner.style.transform = 'translateY(110%)';
                            inner.innerHTML = word;
                            
                            wrapper.appendChild(inner);
                            titleEl.appendChild(wrapper);
                            titleEl.appendChild(document.createTextNode(' '));
                        }
                    });
                    if (index < lines.length - 1) {
                        titleEl.appendChild(document.createElement('br'));
                    }
                });

                gsap.to('.reveal-text', {
                    y: 0,
                    ease: 'power4.out',
                    duration: 1.2,
                    stagger: 0.08,
                    scrollTrigger: {
                        trigger: '#reveal-title',
                        start: 'top 90%',
                    }
                });
            }
        });
    <\/script>
</body>
</html>`,o={mode:"dark",speed:1,size:1,gap:2,length:1,density:1,strokeWidth:1,opacity:1,hue:0,saturation:1,brightness:1},P="#eef1f6";function m(e,t,a){return Math.min(a,Math.max(t,e))}function O(e,t,a=1){return Math.max(a,Math.round(e*t))}function re(e,t="dark"){return e==null?t:e==="light"||e===1||e==="1"?"light":"dark"}function U(){if(typeof document>"u"||typeof window>"u")return"dark";const e=document.documentElement,t=e.dataset.scheme??e.dataset.theme;return t==="light"||t==="dark"?t:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}function se(e){const[t,a]=h.useState(U);return h.useEffect(()=>{if(!e||typeof document>"u"||typeof window>"u")return;const n=document.documentElement,c=window.matchMedia("(prefers-color-scheme: dark)"),i=()=>a(U()),p=new MutationObserver(i);return p.observe(n,{attributes:!0,attributeFilter:["data-scheme","data-theme"]}),c.addEventListener("change",i),i(),()=>{p.disconnect(),c.removeEventListener("change",i)}},[e]),t}function V(e,t){return typeof e=="function"?e(t):e}const I=`
[data-threeui-role="ui"].flex-grow {
  flex: none !important;
  width: min(calc(100% - 32px), var(--threeui-target-width, 360px)) !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: calc(100% - 32px) !important;
  aspect-ratio: 1 / 1 !important;
  margin: 0 !important;
  overflow: hidden !important;
}
[data-threeui-role="ui"] > canvas {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
}
`;function N(e,{mode:t}){let a=e.replaceAll("time += 0.015;","time += 0.015 * ((window.__SF_CONTROLS&&window.__SF_CONTROLS.speed)||1);");return t==="light"&&(a=a.replaceAll("ctx.fillStyle = '#020804';",`ctx.fillStyle = '${P}';`).replaceAll("rgba(52,211,153,","rgba(4,120,87,")),a}const j={flowField:{title:"Flow Field",source:ae,background:"#0a0a0a",targets:[{selector:"#canvas",role:"background"}],patch(e,{size:t,length:a,density:n}){return e.replace(/<script defer src="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js[^>]*><\/script>/,"").replace("const PARTICLE_COUNT = 2500;",`const PARTICLE_COUNT = ${O(2500,n,300)};`).replace("let NOISE_SCALE = 0.0025;",`let NOISE_SCALE = ${Number((.0025/a).toFixed(6))};`).replace("time += 0.0008;","time += 0.0008 * ((window.__SF_CONTROLS&&window.__SF_CONTROLS.speed)||0);").replace("let vx = Math.cos(angle) * p.speed * SPEED;","let vx = Math.cos(angle) * p.speed * SPEED * ((window.__SF_CONTROLS&&window.__SF_CONTROLS.speed)||0);").replace("let vy = Math.sin(angle) * p.speed * SPEED;","let vy = Math.sin(angle) * p.speed * SPEED * ((window.__SF_CONTROLS&&window.__SF_CONTROLS.speed)||0);").replace("ctx.lineWidth = p.size;",`ctx.lineWidth = p.size * ${Number(t.toFixed(3))};`)}},diagnosticsLayers:{title:"Layered Planes",source:F,supportsMode:!0,background:e=>e==="light"?P:"#020804",targets:[{selector:"#main-container article:nth-of-type(1) .flex-grow",role:"ui",width:"360px"}],focusCss:I,patch:N},diagnosticsNodes:{title:"Node Cubes",source:F,supportsMode:!0,background:e=>e==="light"?P:"#020804",targets:[{selector:"#main-container article:nth-of-type(2) .flex-grow",role:"ui",width:"360px"}],focusCss:I,patch:N},diagnosticsFlow:{title:"Flowing Mesh",source:F,supportsMode:!0,background:e=>e==="light"?P:"#020804",targets:[{selector:"#main-container article:nth-of-type(3) .flex-grow",role:"ui",width:"360px"}],focusCss:I,patch:N},connectivityGraph:{title:"Connectivity Graph",source:ie,supportsMode:!0,defaultMode:"light",background:e=>e==="light"?"#c4d9ef":"#0a1220",targets:[{selector:"#networkCanvas",role:"background"}],patch(e,{size:t,length:a,density:n,mode:c}){let i=e.replace("const particleCount = window.innerWidth < 768 ? 150 : 400;",`const particleCount = window.innerWidth < 768 ? ${O(150,n,30)} : ${O(400,n,60)};`).replace("this.maxLength = 20 + Math.random() * 180;",`this.maxLength = (20 + Math.random() * 180) * ${a};`).replace("this.distance += this.speed;","this.distance += this.speed * ((window.__SF_CONTROLS&&window.__SF_CONTROLS.speed)||1);").replace("ctx.lineWidth = 0.5 + (distRatio * 2);",`ctx.lineWidth = (0.5 + (distRatio * 2)) * ${t};`);return c==="dark"&&(i=i.replace("const lightness = 15 + (distRatio * 35);","const lightness = 58 + (distRatio * 28);").replace("const tailColor = `hsla(${hue}, 90%, ${Math.max(5, lightness - 15)}%, ${this.alpha * 0.05})`;","const tailColor = `hsla(${hue}, 90%, ${Math.max(40, lightness - 15)}%, ${this.alpha * 0.08})`;")),i}}};function ne(e,t){const a=t.mode,n=V(e.background,a),c=JSON.stringify(e.targets).replace(/</g,"\\u003c"),i=JSON.stringify({mode:a,speed:t.speed,size:t.size,gap:t.gap,length:t.length,density:t.density,strokeWidth:t.strokeWidth,opacity:t.opacity}).replace(/</g,"\\u003c"),p=e.patch?e.patch(e.source,{variant:t.variant,size:t.size,gap:t.gap,length:t.length,density:t.density,strokeWidth:t.strokeWidth,mode:a}):e.source,b=`<style data-threeui-focus>
html, body { width: 100% !important; height: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: ${n} !important; }
body { position: relative !important; display: flex !important; align-items: center !important; justify-content: center !important; }
body > * { visibility: hidden !important; }
body[data-threeui-ready] > [data-threeui-role] { visibility: visible !important; }
[data-threeui-residual] { display: none !important; }
[data-threeui-role="background"] { position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; z-index: 0 !important; opacity: 1 !important; pointer-events: none !important; }
[data-threeui-role="ui"] { position: relative !important; z-index: 1 !important; width: min(calc(100% - 32px), var(--threeui-target-width, 1040px)) !important; max-width: none !important; max-height: calc(100% - 32px) !important; margin: auto !important; overflow: auto !important; opacity: 1 !important; transform: none !important; filter: none !important; flex: none !important; box-sizing: border-box !important; }
${e.focusCss??""}
</style>`,x=`<script data-threeui-controls>
(function () {
  var controls = ${i};
  window.__SF_CONTROLS = controls;
  var origin = performance.now();
  var virtual = 0;
  var last = origin;
  var performanceNow = performance.now.bind(performance);
  var dateNow = Date.now.bind(Date);
  var dateOrigin = dateNow();
  performance.now = function () {
    var real = performanceNow();
    virtual += (real - last) * (controls.speed || 1);
    last = real;
    return origin + virtual;
  };
  Date.now = function () {
    return dateOrigin + (performance.now() - origin);
  };
  var raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (callback) {
    return raf(function () {
      callback(performance.now());
    });
  };
  function applyVisual() {
    var opacity = controls.opacity == null ? 1 : controls.opacity;
    var size = controls.size == null ? 1 : controls.size;
    Array.prototype.forEach.call(document.querySelectorAll('[data-threeui-role]'), function (element) {
      element.style.opacity = String(opacity);
      if (element.getAttribute('data-threeui-role') === 'ui') {
        element.style.transform = 'scale(' + size + ')';
        element.style.transformOrigin = 'center center';
      }
    });
  }
  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'threeui-controls') return;
    var next = event.data.controls || {};
    Object.keys(next).forEach(function (key) { controls[key] = next[key]; });
    applyVisual();
  });
  window.__SF_APPLY_CONTROLS = applyVisual;
})();
<\/script>`,u=`<script data-threeui-focus>
(function () {
  var isolated = false;
  function isolate() {
    if (isolated) return;
    var specs = ${c};
    var roots = [];
    specs.forEach(function (spec) {
      var element = document.querySelector(spec.selector);
      if (!element) return;
      element.setAttribute('data-threeui-role', spec.role);
      if (spec.width) element.style.setProperty('--threeui-target-width', spec.width);
      if (!roots.some(function (root) { return root.contains(element); })) roots.push(element);
    });
    if (!roots.length) return;
    isolated = true;
    roots.forEach(function (root) { document.body.appendChild(root); });
    Array.from(document.body.children).forEach(function (element) {
      if (roots.indexOf(element) !== -1) return;
      element.setAttribute('data-threeui-residual', '');
      element.setAttribute('aria-hidden', 'true');
      if ('inert' in element) element.inert = true;
    });
    document.body.setAttribute('data-threeui-ready', '');
    if (window.__SF_APPLY_CONTROLS) window.__SF_APPLY_CONTROLS();
    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
  }
  function scheduleIsolation() { setTimeout(isolate, 100); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleIsolation, { once: true });
  else scheduleIsolation();
  window.addEventListener('load', isolate, { once: true });
})();
<\/script>`;return p.replace(/<head([^>]*)>/i,`<head$1>${x}${b}`).replace(/<\/body>/i,`${u}</body>`)}function Q({definition:e,variant:t="cube",mode:a,speed:n=o.speed,size:c=o.size,gap:i=o.gap,length:p=o.length,density:b=o.density,strokeWidth:x=o.strokeWidth,opacity:u=o.opacity,hue:f=o.hue,saturation:C=o.saturation,brightness:z=o.brightness,className:v,style:w}){const E=h.useRef(null),M=a??e.defaultMode??o.mode,T=se(M==="auto"),r=M==="auto"?T:re(M,o.mode),g=V(e.background,r),l=m(n,0,3),y=m(c,.05,200),k=m(i,0,64),s=m(p,.35,2.5),d=m(b,.25,2.5),_=m(x,.25,8),$=m(u,.05,1),R=m(f,-180,180),D=m(C,0,2),B=m(z,.35,1.65),G=h.useMemo(()=>ne(e,{variant:t,mode:r,speed:o.speed,size:y,gap:k,length:s,density:d,strokeWidth:_,opacity:o.opacity}),[e,r,d,k,s,y,_,t]);h.useEffect(()=>{var Y;const H=(Y=E.current)==null?void 0:Y.contentWindow;H&&H.postMessage({type:"threeui-controls",controls:{mode:r,speed:l,size:y,gap:k,length:s,density:d,strokeWidth:_,opacity:$}},"*")},[r,d,k,s,$,y,l,_,G]);const te=R===0&&D===1&&B===1?void 0:`hue-rotate(${R}deg) saturate(${D}) brightness(${B})`;return S.jsx("iframe",{ref:E,className:v,title:e.title,srcDoc:G,sandbox:"allow-scripts",loading:"eager",style:{display:"block",width:"100%",height:"100%",border:0,background:g,filter:te,...w}})}function K(e){return function(t){return S.jsx(Q,{...t,definition:e})}}const me=K(j.flowField),X={layers:j.diagnosticsLayers,nodes:j.diagnosticsNodes,flow:j.diagnosticsFlow},oe={variant:"layers"};function ue({variant:e=oe.variant,...t}){const a=X[e]??X.layers;return S.jsx(Q,{...t,definition:a})}const he=K(j.connectivityGraph),le=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      height: 100%;
      overflow: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #000000;
      color: #ffffff;
    }
    .component-wrapper {
      width: 100%;
      height: 100%;
      padding: 0;
      box-sizing: border-box;
      overflow: auto;
    }
  </style>
</head>
<body>
  <div class="component-wrapper">
    <html><head></head><body><a href="#" class="group isolate inline-flex cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_8px_rgba(129,140,248,0.35)] rounded-full relative shadow-[0_8px_40px_rgba(129,140,248,0.25)]" style="--spread: 90deg; --shimmer-color: rgba(255,255,255,0.6); --radius: 9999px; --speed: 4s; --cut: 1px; --bg: rgba(255, 255, 255, 0.05);" data-element-locator="html &gt; body:nth-of-type(1) &gt; section:nth-of-type(1) &gt; div:nth-of-type(1) &gt; div:nth-of-type(1) &gt; div:nth-of-type(1) &gt; a:nth-of-type(1)">
  <div class="absolute inset-0">
    <div class="absolute inset-[-200%] w-[400%] h-[400%] [animation:rotate-gradient_var(--speed)_linear_infinite]">
      <div class="absolute inset-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]">
      </div>
    </div>
  </div>
  <div class="absolute rounded-full [background:var(--bg)] [inset:var(--cut)] backdrop-blur"></div>
  <div class="z-10 flex gap-3 sm:w-auto overflow-hidden text-base font-medium text-white w-full pt-3 pr-4 pb-3 pl-4 relative gap-x-3 gap-y-3 items-center" style="border-radius: 9999px;" data-element-locator="html &gt; body:nth-of-type(1) &gt; section:nth-of-type(1) &gt; div:nth-of-type(1) &gt; div:nth-of-type(1) &gt; div:nth-of-type(1) &gt; a:nth-of-type(1) &gt; div:nth-of-type(3)">
    <div style="position: absolute; content: ' '; display: block; width: 200%; height: 200%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), transparent); animation: borderBeamRotation 4s infinite linear; top: 50%; left: 50%; transform: translate(-50%, -50%);" class=""></div>
    <div style="position: absolute; inset: 1px; background: rgba(10, 11, 20, 0.8); border-radius: 9999px; backdrop-filter: blur(8px);" class="" data-element-locator="html &gt; body:nth-of-type(1) &gt; section:nth-of-type(1) &gt; div:nth-of-type(1) &gt; div:nth-of-type(1) &gt; div:nth-of-type(1) &gt; a:nth-of-type(1) &gt; div:nth-of-type(3) &gt; div:nth-of-type(2)">
    </div>
    <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/3f6038cb-af1c-4483-97bc-dd58d89c36ef_320w.jpg" alt="Advisor headshot" class="ring-2 ring-white/10 z-10 w-8 h-8 object-cover rounded-full relative">
    <span class="whitespace-nowrap relative z-10 font-sans">
                  Generate My Site
                </span>
    <span class="inline-flex items-center justify-center z-10 bg-white/10 w-7 h-7 rounded-full ml-1 relative" data-element-locator="html &gt; body:nth-of-type(1) &gt; section:nth-of-type(1) &gt; div:nth-of-type(1) &gt; div:nth-of-type(1) &gt; div:nth-of-type(1) &gt; a:nth-of-type(1) &gt; div:nth-of-type(3) &gt; span:nth-of-type(2)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-lucide="wand-sparkles" class="lucide lucide-wand-sparkles lucide-arrow-right w-[24px] h-[16px]" data-icon-replaced="true" style="width: 24px; height: 16px; color: rgb(255, 255, 255);"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" class=""></path><path d="m14 7 3 3" class=""></path><path d="M5 6v4" class=""></path><path d="M19 14v4" class=""></path><path d="M10 2v2" class=""></path><path d="M7 8H3" class=""></path><path d="M21 16h-4" class=""></path><path d="M11 3H9" class=""></path></svg>
                </span>
    <style>
      @keyframes borderBeamRotation {
        0% {
          transform: translate(-50%, -50%) rotate(0deg);
        }

        100% {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }
    </style>
  </div>
</a></body></html>
  </div>
  
    <script>
      (function() {
        function checkAndCenter() {
          // Use double requestAnimationFrame to ensure DOM is fully painted and layout is stable
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              const wrapper = document.querySelector('.component-wrapper');
              if (!wrapper) return;
              
              // Get all child elements
              const children = Array.from(wrapper.children);
              if (children.length === 0) return;
              
              // Temporarily override wrapper styles to shrink-wrap for measurement
              // Set inline styles to shrink-wrap (inline styles override CSS)
              wrapper.style.display = 'inline-block';
              wrapper.style.width = 'auto';
              wrapper.style.height = 'auto';
              wrapper.style.overflow = 'visible';
              wrapper.style.boxSizing = 'content-box';
              
              // Force multiple reflows to ensure styles are fully applied
              void wrapper.offsetHeight;
              void wrapper.offsetWidth;
              void wrapper.offsetHeight;
              
              // Measure the wrapper's content size
              const contentWidth = wrapper.offsetWidth;
              const contentHeight = wrapper.offsetHeight;
              
              // Restore original styles by removing inline styles we added
              wrapper.style.removeProperty('display');
              wrapper.style.removeProperty('width');
              wrapper.style.removeProperty('height');
              wrapper.style.removeProperty('overflow');
              wrapper.style.removeProperty('box-sizing');
              
              // If content is less than 500x500, center it
              if (contentWidth > 0 && contentHeight > 0 && contentWidth < 500 && contentHeight < 500) {
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.justifyContent = 'center';
              }
            });
          });
        }
        
        // Check immediately and after delays to ensure content is rendered and styled
        function runChecks() {
          checkAndCenter();
          setTimeout(checkAndCenter, 50);
          setTimeout(checkAndCenter, 150);
          setTimeout(checkAndCenter, 300);
          setTimeout(checkAndCenter, 500);
          setTimeout(checkAndCenter, 1000);
        }
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', runChecks);
        } else {
          runChecks();
        }
        
        // Also check when images or other resources load
        window.addEventListener('load', () => {
          setTimeout(checkAndCenter, 100);
          setTimeout(checkAndCenter, 300);
        });
        
        // Use ResizeObserver to detect size changes
        if (window.ResizeObserver) {
          setTimeout(() => {
            const wrapper = document.querySelector('.component-wrapper');
            if (wrapper) {
              const observer = new ResizeObserver(() => {
                setTimeout(checkAndCenter, 50);
              });
              observer.observe(wrapper);
            }
          }, 500);
        }
      })();
    <\/script>
  
</body>
</html>
`,A=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Diagnostics</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
    <style>
        :root {
            color-scheme: dark;

            /* procedural noise fields, generated inline so the document stays self-contained.
               fractal noise for print grain, anisotropic noise for brushed metal,
               and a low-frequency field for smudge and dust on the cover glass. */
            --tex-grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)'/%3E%3C/svg%3E");
            --tex-metal: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.008 1.5' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23m)'/%3E%3C/svg%3E");
            --tex-dust: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='d'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.014' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.6'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23d)'/%3E%3C/svg%3E");
        }

        /* every dimension inside a gauge is expressed against the card width,
           so one instrument reads identically at 300px and at 900px */
        .gauge-card { container-type: inline-size; }

        /* ---------- mounting plate ---------- */
        .plate {
            position: absolute;
            inset: 0;
            border-radius: 11.5cqw;
            background: radial-gradient(120% 100% at 30% 0%, #121215 0%, #09090A 55%, #060607 100%);
            border: 1px solid rgba(255,255,255,.03);
            box-shadow:
                0px 1px 1px -0.5px rgba(0,0,0,.5),
                0px 3px 3px -1.5px rgba(0,0,0,.4),
                0px 6px 6px -3px rgba(0,0,0,.35),
                0px 12px 12px -6px rgba(0,0,0,.3),
                0px 24px 24px -12px rgba(0,0,0,.25);
            transition: border-color .5s;
        }
        /* fine anodised tooth so the plate is not a flat fill */
        .plate::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background-image: var(--tex-grain), var(--tex-dust);
            background-size: 34cqw 34cqw, 170% 170%;
            background-blend-mode: soft-light, normal;
            mix-blend-mode: screen;
            opacity: .07;
            pointer-events: none;
        }
        .gauge-card:hover .plate { border-color: rgba(255,255,255,.08); }

        /* ---------- instrument shell ---------- */
        .shell {
            position: absolute;
            inset: 13cqw;
            border-radius: 50%;
            padding: 2.2%;
            background:
                var(--tex-metal),
                conic-gradient(from 210deg, #3a3a3d 0deg, #17171a 60deg, #2c2c30 130deg, #0d0d0f 200deg, #313135 280deg, #131316 340deg, #3a3a3d 360deg);
            background-size: 100% 100%, auto;
            background-blend-mode: overlay, normal;
            box-shadow:
                0 18px 40px -12px rgba(0,0,0,.9),
                0 2px 0 rgba(255,255,255,.05),
                inset 0 2px 6px rgba(255,255,255,.10),
                inset 0 -6px 14px rgba(0,0,0,.65);
        }
        .bezel {
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            padding: 3.4%;
            background: radial-gradient(closest-side, #0b0b0d 76%, #212125 92%, #08080a 100%);
            box-shadow: inset 0 1px 1px rgba(255,255,255,.10), inset 0 -3px 8px rgba(0,0,0,.8);
        }
        /* knurled grip ring milled into the bezel edge */
        .bezel::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: repeating-conic-gradient(from 0deg, rgba(255,255,255,.16) 0deg 0.5deg, rgba(0,0,0,0) 0.5deg 2.2deg);
            -webkit-mask-image: radial-gradient(closest-side, transparent 92%, #000 93.5%, #000 99%, transparent 100%);
            mask-image: radial-gradient(closest-side, transparent 92%, #000 93.5%, #000 99%, transparent 100%);
            opacity: .45;
            pointer-events: none;
        }
        /* brushed tooling marks across the bezel ring */
        .bezel::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background-image: var(--tex-metal);
            background-size: 100% 100%;
            -webkit-mask-image: radial-gradient(closest-side, transparent 95%, #000 96.5%, #000 100%);
            mask-image: radial-gradient(closest-side, transparent 95%, #000 96.5%, #000 100%);
            mix-blend-mode: overlay;
            opacity: .55;
            pointer-events: none;
        }
        /* a turned stainless pan head sunk into a counterbored well */
        .screw {
            position: absolute;
            width: 5cqw;
            aspect-ratio: 1;
            border-radius: 50%;
            background:
                radial-gradient(circle at 34% 26%, rgba(255,255,255,.55) 0%, rgba(255,255,255,.08) 26%, rgba(255,255,255,0) 46%),
                radial-gradient(closest-side, rgba(0,0,0,0) 58%, rgba(0,0,0,.45) 84%, rgba(0,0,0,.7) 100%),
                conic-gradient(from calc(var(--a, 0deg) - 52deg),
                    #9a9ba1 0deg, #43444a 34deg, #c3c4ca 74deg, #4d4e55 118deg,
                    #a7a8ae 168deg, #37383d 214deg, #b2b3b9 262deg, #45464c 312deg, #9a9ba1 360deg);
            box-shadow:
                0 0 0 .16cqw rgba(0,0,0,.6),
                0 .12cqw 0 .16cqw rgba(255,255,255,.05),
                0 .3cqw .6cqw rgba(0,0,0,.75),
                inset 0 -.16cqw .32cqw rgba(0,0,0,.6),
                inset 0 .12cqw .24cqw rgba(255,255,255,.4);
        }
        /* cross drive: dark recess with a lit lower lip so it reads as cut, not printed */
        .screw::before {
            content: "";
            position: absolute;
            inset: 22%;
            transform: rotate(var(--a, 0deg));
            background:
                linear-gradient(#050506, #1e1e23) center / 100% 20% no-repeat,
                linear-gradient(#050506, #1e1e23) center / 20% 100% no-repeat,
                linear-gradient(rgba(255,255,255,.62), rgba(255,255,255,.62)) center calc(50% + .11cqw) / 100% 20% no-repeat,
                linear-gradient(rgba(255,255,255,.62), rgba(255,255,255,.62)) calc(50% + .11cqw) center / 20% 100% no-repeat;
        }
        /* turning marks on the head */
        .screw::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background-image: var(--tex-metal);
            background-size: 100% 100%;
            mix-blend-mode: overlay;
            opacity: .45;
        }

        /* ---------- dial face ---------- */
        .face {
            container-type: inline-size;
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            overflow: hidden;
            box-shadow: inset 0 5px 16px rgba(0,0,0,.5), inset 0 -2px 9px rgba(0,0,0,.4);
        }
        .layer { position: absolute; inset: 0; pointer-events: none; }

        /* a full-bleed square rotated about its centre carries its child around the dial */
        .spoke { position: absolute; inset: 0; }

        .tick {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 1px;
        }
        .tick.minor { top: 9%; width: 0.9%; height: 2.8%; opacity: .5; }
        .tick.major { top: 8%; width: 1.8%; height: 6.4%; }

        .numeral {
            position: absolute;
            left: 50%;
            top: 17.5%;
            line-height: 1;
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
        }

        /* ---------- needle ---------- */
        .needle {
            position: absolute;
            inset: 0;
            transform: rotate(var(--angle, 0deg));
            transition: transform var(--needle-duration, 1200ms) var(--needle-ease, cubic-bezier(.2,.9,.25,1));
            will-change: transform;
        }
        .flutter { position: absolute; inset: 0; }
        .blade {
            position: absolute;
            left: 50%;
            top: 11.5%;
            bottom: 50%;
            width: 3.2%;
            transform: translateX(-50%);
            clip-path: polygon(41% 0, 59% 0, 100% 97%, 100% 100%, 0 100%, 0 97%);
            filter: drop-shadow(0 3px 6px rgba(0,0,0,.55));
        }
        .blade::after {
            content: "";
            position: absolute;
            inset: 7% 40% 20% 40%;
            border-radius: 999px;
            background: linear-gradient(rgba(255,255,255,.34), rgba(255,255,255,0));
        }
        .tail {
            position: absolute;
            left: 50%;
            top: 50%;
            width: 2%;
            height: 9.5%;
            transform: translateX(-50%);
            border-radius: 0 0 999px 999px;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,.5));
        }
        .hub {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            border-radius: 50%;
            background: radial-gradient(circle at 34% 30%, #5c5c63, #1b1b1f 60%, #050506);
            box-shadow: 0 3px 8px rgba(0,0,0,.75), inset 0 1px 2px rgba(255,255,255,.35);
            display: grid;
            place-items: center;
        }

        /* ---------- glass ---------- */
        .glass {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background:
                radial-gradient(120% 78% at 22% 6%, rgba(255,255,255,.20) 0%, rgba(255,255,255,.05) 32%, rgba(255,255,255,0) 56%),
                linear-gradient(148deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,0) 40%);
            mix-blend-mode: screen;
            pointer-events: none;
        }
        .glass::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 50%;
            box-shadow: inset 0 0 20px rgba(0,0,0,.5), inset 0 1px 1px rgba(255,255,255,.2);
        }
        /* smudge and settled dust caught by the raking highlight */
        .glass-dust {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background-image: var(--tex-dust), var(--tex-grain);
            background-size: 130% 130%, 30.03cqw 30.03cqw;
            mix-blend-mode: soft-light;
            opacity: .3;
            pointer-events: none;
        }

        /* printed-dial tooth, held under the ticks and numerals */
        .face-grain {
            position: absolute;
            inset: 0;
            background-image: var(--tex-grain);
            background-size: 25.4cqw 25.4cqw;
            mix-blend-mode: overlay;
            opacity: .13;
            pointer-events: none;
        }

        /* ---------- centre stack typography ---------- */
        .stack { position: absolute; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; }
        .cap { font-size: 2.89cqw; letter-spacing: .42em; text-indent: .42em; line-height: 1; }
        .cap-sm { font-size: 2.43cqw; letter-spacing: .3em; text-indent: .3em; line-height: 1; }
        .readout { font-size: 8.55cqw; font-weight: 300; line-height: 1; font-variant-numeric: tabular-nums; }

        /* ---------- motion ---------- */
        @keyframes flutter { 0%, 100% { transform: rotate(-.4deg); } 50% { transform: rotate(.4deg); } }
        .flutter[data-live] { animation: flutter 2.6s ease-in-out infinite; }

        @keyframes pulse-soft { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
        .pulse { animation: pulse-soft 1.4s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
            .needle, [data-peak], [data-soc] { transition: none !important; }
            .flutter[data-live], .pulse { animation: none !important; }
            [data-anim] { transition: none !important; }
        }
    </style>
</head>
<body class="bg-black min-h-screen text-white font-sans flex flex-col items-center justify-center p-6 sm:p-12 selection:bg-[#E26226] selection:text-white">

    <!-- Header Section -->
    <div data-anim="true" class="max-w-4xl w-full mb-16 text-center" style="opacity: 0; transform: translateY(20px); filter: blur(4px); transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);">
        <h1 class="text-3xl sm:text-5xl font-extralight tracking-tight mb-4 text-white/90" id="hero-title">
            Performance Diagnostics
        </h1>
        <p class="text-white/40 text-sm sm:text-base max-w-xl mx-auto font-extralight" id="hero-subtitle">
            Advanced tracking interfaces engineered for extreme conditions. Analyze vital statistics instantly with unmatched precision.
        </p>
    </div>

    <!-- Dashboard Container -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 w-full max-w-5xl justify-items-center">

        <!-- Card 1: Tachometer -->
        <div id="gauge-tachometer" data-anim="true" data-gauge="tachometer" class="gauge-card w-full max-w-[340px] aspect-square relative group" style="opacity: 0; transform: translateY(20px); filter: blur(4px); transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); transition-delay: 100ms;">
            <div class="plate">
                <span class="screw" style="--a:26deg;top:6.4cqw;left:6.4cqw"></span>
                <span class="screw" style="--a:-15deg;top:6.4cqw;right:6.4cqw"></span>
                <span class="screw" style="--a:42deg;bottom:6.4cqw;left:6.4cqw"></span>
                <span class="screw" style="--a:7deg;bottom:6.4cqw;right:6.4cqw"></span>
                <div class="shell">
                    <div class="bezel">
                        <div class="face" style="background: radial-gradient(closest-side at 50% 32%, #F58135 0%, #E76A2A 44%, #D0541B 74%, #B94512 100%);">
                            <!-- machined sunburst -->
                            <div class="layer" style="background: repeating-conic-gradient(from 0deg, rgba(255,255,255,.055) 0deg 1.2deg, rgba(0,0,0,.05) 1.2deg 2.4deg); -webkit-mask-image: radial-gradient(closest-side, #000 0%, #000 58%, transparent 66%); mask-image: radial-gradient(closest-side, #000 0%, #000 58%, transparent 66%); opacity:.6;"></div>
                            <!-- scale band with redline -->
                            <div class="layer" data-zone-band style="-webkit-mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%); mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%);"></div>

                            <div class="layer" data-ticks></div>
                            <div class="layer" data-numerals></div>

                            <div class="stack" style="top:31%">
                                <span class="cap-sm text-black/55 font-medium">r/min</span>
                                <span class="cap-sm text-black/40" style="margin-top:0.81cqw">&times;1000</span>
                            </div>

                            <!-- oil-temperature sub-dial -->
                            <div class="absolute left-1/2 top-[69%] -translate-x-1/2 -translate-y-1/2 w-[24%] aspect-square rounded-full overflow-hidden border border-black/45 shadow-[inset_0_3px_8px_rgba(0,0,0,.55)]" style="background: radial-gradient(closest-side at 50% 30%, #8C3A11, #6E2A08);">
                                <div class="layer" data-subticks></div>
                                <span class="absolute left-1/2 bottom-[15%] -translate-x-1/2 text-white/55 whitespace-nowrap" style="font-size:1.96cqw;letter-spacing:.2em;text-indent:.2em">TEMP &deg;C</span>
                                <div class="needle" data-subneedle style="--needle-duration:1700ms">
                                    <i class="blade" style="top:19%;width:5.5%;background:linear-gradient(#FCA5A5,#B91C1C)"></i>
                                </div>
                                <div class="hub" style="width:15%"></div>
                            </div>

                            <div class="needle" data-needle style="--needle-ease:cubic-bezier(.16,1.28,.4,1)">
                                <div class="flutter">
                                    <i class="blade" style="background:linear-gradient(#F87171,#DC2626 50%,#991B1B)"></i>
                                    <i class="tail" style="background:linear-gradient(#7F1D1D,#450A0A)"></i>
                                </div>
                            </div>
                            <div class="hub" style="width:9%">
                                <span class="block w-[40%] aspect-square rounded-full bg-[#DC2626] shadow-[0_0_6px_rgba(220,38,38,.85)]"></span>
                            </div>
                            <div class="face-grain"></div>
                            <div class="glass"></div>
                            <div class="glass-dust"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Card 2: Speedometer -->
        <div id="gauge-speedometer" data-anim="true" data-gauge="speedometer" class="gauge-card w-full max-w-[340px] aspect-square relative group" style="opacity: 0; transform: translateY(20px); filter: blur(4px); transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); transition-delay: 300ms;">
            <div class="plate">
                <span class="screw" style="--a:-33deg;top:6.4cqw;left:6.4cqw"></span>
                <span class="screw" style="--a:18deg;top:6.4cqw;right:6.4cqw"></span>
                <span class="screw" style="--a:5deg;bottom:6.4cqw;left:6.4cqw"></span>
                <span class="screw" style="--a:-48deg;bottom:6.4cqw;right:6.4cqw"></span>
                <div class="shell">
                    <div class="bezel">
                        <div class="face" style="background: radial-gradient(closest-side at 50% 28%, #1d1d21 0%, #141416 50%, #0a0a0b 100%);">
                            <!-- filled travel: a soft inner wash plus a bright rim arc -->
                            <div class="layer" data-progress-wash style="-webkit-mask-image: radial-gradient(closest-side, transparent 66%, #000 80%, #000 86%, transparent 89%); mask-image: radial-gradient(closest-side, transparent 66%, #000 80%, #000 86%, transparent 89%); opacity:.11;"></div>
                            <div class="layer" data-zone-band style="-webkit-mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%); mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%);"></div>
                            <div class="layer" data-progress-arc style="-webkit-mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%); mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%);"></div>

                            <div class="layer" data-ticks></div>
                            <div class="layer" data-numerals></div>

                            <!-- peak-hold marker -->
                            <div class="spoke" data-peak style="transition: transform 900ms cubic-bezier(.2,.9,.25,1)">
                                <i class="absolute left-1/2 top-[7.4%] -translate-x-1/2 w-[1.3%] h-[4%] bg-white/85 rounded-[1px] shadow-[0_0_7px_rgba(255,255,255,.7)]"></i>
                            </div>

                            <div class="stack" style="top:29%">
                                <iconify-icon icon="solar:shield-star-linear" class="text-white/25" style="font-size:6.24cqw"></iconify-icon>
                                <span class="cap-sm text-white/30" style="margin-top:1.39cqw">km/h</span>
                            </div>

                            <div class="stack" style="top:58%">
                                <span data-readout class="readout text-[#E26226]" style="text-shadow:0 0 12px rgba(226,98,38,.45)">0</span>
                            </div>

                            <!-- odometer -->
                            <div class="stack items-center" style="top:77%">
                                <div class="bg-black/85 border border-white/10 rounded shadow-[inset_0_1px_3px_rgba(0,0,0,.9)] flex flex-col items-center" style="padding:0.92cqw 1.85cqw">
                                    <div class="text-[#E26226] font-mono flex items-center" style="font-size:3.93cqw;letter-spacing:.14em;gap:0.58cqw">
                                        <span>3</span><span>1</span><span>5</span><span>9</span><span class="bg-[#E26226] text-black rounded-[2px]" style="padding:0 0.81cqw">5</span>
                                    </div>
                                    <span class="text-white/30 uppercase" style="font-size:2.08cqw;letter-spacing:.28em;margin-top:0.81cqw">km total</span>
                                </div>
                            </div>

                            <div class="needle" data-needle style="--needle-ease:cubic-bezier(.16,1.28,.4,1)">
                                <div class="flutter">
                                    <i class="blade" style="background:linear-gradient(#6EE7A0,#22C55E 50%,#15803D); filter: drop-shadow(0 0 7px rgba(74,222,128,.6))"></i>
                                    <i class="tail" style="background:linear-gradient(#166534,#052E16)"></i>
                                </div>
                            </div>
                            <div class="hub" style="width:8.5%">
                                <span class="block w-[38%] aspect-square rounded-full bg-[#4ADE80]/85 shadow-[0_0_6px_rgba(74,222,128,.75)]"></span>
                            </div>
                            <div class="face-grain"></div>
                            <div class="glass"></div>
                            <div class="glass-dust"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Card 3: Turbo Boost -->
        <div id="gauge-boost" data-anim="true" data-gauge="boost" class="gauge-card w-full max-w-[340px] aspect-square relative group" style="opacity: 0; transform: translateY(20px); filter: blur(4px); transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); transition-delay: 500ms;">
            <div class="plate">
                <span class="screw" style="--a:12deg;top:6.4cqw;left:6.4cqw"></span>
                <span class="screw" style="--a:-40deg;top:6.4cqw;right:6.4cqw"></span>
                <span class="screw" style="--a:29deg;bottom:6.4cqw;left:6.4cqw"></span>
                <span class="screw" style="--a:-6deg;bottom:6.4cqw;right:6.4cqw"></span>
                <div class="shell">
                    <div class="bezel">
                        <div class="face" style="background: radial-gradient(closest-side at 50% 26%, #17324F 0%, #0F172A 48%, #030816 100%);">
                            <div class="layer" style="background: repeating-conic-gradient(from 0deg, rgba(56,189,248,.06) 0deg 1.4deg, rgba(0,0,0,0) 1.4deg 2.8deg); -webkit-mask-image: radial-gradient(closest-side, #000 0%, #000 56%, transparent 64%); mask-image: radial-gradient(closest-side, #000 0%, #000 56%, transparent 64%);"></div>
                            <div class="layer" data-zone-band style="-webkit-mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%); mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%);"></div>

                            <div class="layer" data-ticks></div>
                            <div class="layer" data-numerals></div>

                            <div class="stack" style="top:30%">
                                <iconify-icon icon="solar:wind-linear" class="text-cyan-400/80" style="font-size:6.47cqw"></iconify-icon>
                                <span class="cap text-white/45" style="margin-top:1.62cqw">BOOST</span>
                            </div>

                            <div class="stack" style="top:57%">
                                <span data-readout class="readout text-cyan-300" style="text-shadow:0 0 12px rgba(34,211,238,.5)">0.00</span>
                                <span class="cap text-cyan-500/70" style="margin-top:1.85cqw">BAR</span>
                            </div>

                            <div class="stack" style="top:79%">
                                <div class="flex items-center text-white/35" style="gap:1.62cqw;font-size:2.19cqw;letter-spacing:.26em">
                                    <span class="rounded-full bg-red-500 pulse" style="width:1.85cqw;height:1.85cqw" data-overboost hidden></span>
                                    <span>WASTEGATE 1.20</span>
                                </div>
                            </div>

                            <div class="needle" data-needle style="--needle-ease:cubic-bezier(.16,1.32,.4,1)">
                                <div class="flutter">
                                    <i class="blade" style="background:linear-gradient(#4DD9F0,#0EB8D7 50%,#0E7490); filter: drop-shadow(0 0 8px rgba(34,211,238,.65))"></i>
                                    <i class="tail" style="background:linear-gradient(#155E75,#083344)"></i>
                                </div>
                            </div>
                            <div class="hub" style="width:9%">
                                <span class="block w-[38%] aspect-square rounded-full bg-cyan-400/85 shadow-[0_0_6px_rgba(34,211,238,.85)]"></span>
                            </div>
                            <div class="face-grain"></div>
                            <div class="glass"></div>
                            <div class="glass-dust"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Card 4: EV Power / Charge -->
        <div id="gauge-power" data-anim="true" data-gauge="power" class="gauge-card w-full max-w-[340px] aspect-square relative group" style="opacity: 0; transform: translateY(20px); filter: blur(4px); transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); transition-delay: 700ms;">
            <div class="plate">
                <span class="screw" style="--a:47deg;top:6.4cqw;left:6.4cqw"></span>
                <span class="screw" style="--a:3deg;top:6.4cqw;right:6.4cqw"></span>
                <span class="screw" style="--a:-21deg;bottom:6.4cqw;left:6.4cqw"></span>
                <span class="screw" style="--a:35deg;bottom:6.4cqw;right:6.4cqw"></span>
                <div class="shell">
                    <div class="bezel">
                        <div class="face" style="background: radial-gradient(closest-side at 50% 28%, #191624 0%, #111016 50%, #08070B 100%);">
                            <div class="layer" data-zone-band style="-webkit-mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%); mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%);"></div>
                            <div class="layer" data-progress-arc style="-webkit-mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%); mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%);"></div>

                            <div class="layer" data-ticks></div>
                            <div class="layer" data-numerals></div>

                            <div class="stack" style="top:29%">
                                <iconify-icon icon="solar:bolt-linear" class="text-purple-400/90" style="font-size:6.47cqw"></iconify-icon>
                                <span class="cap text-white/45" style="margin-top:1.62cqw">POWER</span>
                            </div>

                            <div class="stack" style="top:57%">
                                <span data-readout class="readout text-purple-200" style="text-shadow:0 0 12px rgba(192,132,252,.45)">0</span>
                                <span class="cap text-purple-400/70" style="margin-top:1.85cqw">KW</span>
                            </div>

                            <!-- battery state of charge -->
                            <div class="stack" style="top:76%">
                                <div class="rounded-full bg-white/10 overflow-hidden border border-white/10" style="width:23.1cqw;height:1.96cqw">
                                    <div data-soc class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-[width] duration-[1400ms] ease-out" style="width:0%"></div>
                                </div>
                                <span class="text-white/35" style="font-size:2.19cqw;letter-spacing:.28em;margin-top:1.39cqw">SOC 72%</span>
                            </div>

                            <div class="needle" data-needle style="--needle-ease:cubic-bezier(.16,1.28,.4,1)">
                                <div class="flutter">
                                    <i class="blade" style="background:linear-gradient(#C88CFA,#9333EA 50%,#6B21A8); filter: drop-shadow(0 0 8px rgba(168,85,247,.6))"></i>
                                    <i class="tail" style="background:linear-gradient(#581C87,#2E1065)"></i>
                                </div>
                            </div>
                            <div class="hub" style="width:9%">
                                <span class="block w-[38%] aspect-square rounded-full bg-purple-400/85 shadow-[0_0_6px_rgba(168,85,247,.85)]"></span>
                            </div>
                            <div class="face-grain"></div>
                            <div class="glass"></div>
                            <div class="glass-dust"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>

    <!-- Script for dial construction, reveal, and instrument motion -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            /* ---------- dial specifications ---------- */
            const SPECS = {
                tachometer: {
                    start: -135, sweep: 270, min: 0, max: 7,
                    majorStep: 1, minorPerMajor: 5,
                    numeral: (v) => String(v),
                    numeralStyle: 'font-size:7.39cqw;font-weight:300;color:rgba(0,0,0,.78)',
                    tickColor: (v) => (v >= 5.5 ? '#7F1D1D' : 'rgba(0,0,0,.7)'),
                    zones: [
                        { from: 0, to: 5.5, color: 'rgba(0,0,0,.22)' },
                        { from: 5.5, to: 7, color: 'rgba(185,28,28,.95)' },
                    ],
                    idle: 0, value: 5.2,
                    sub: { start: -110, sweep: 220, min: 40, max: 130, majorStep: 30, minorPerMajor: 3, value: 92 },
                },
                speedometer: {
                    start: -135, sweep: 270, min: 0, max: 160,
                    majorStep: 20, minorPerMajor: 4,
                    numeral: (v) => String(v),
                    numeralStyle: 'font-size:5.31cqw;font-weight:300;color:rgba(255,255,255,.72)',
                    tickColor: (v) => (v >= 140 ? 'rgba(248,113,113,.95)' : 'rgba(255,255,255,.6)'),
                    zones: [
                        { from: 0, to: 140, color: 'rgba(255,255,255,.09)' },
                        { from: 140, to: 160, color: 'rgba(220,38,38,.6)' },
                    ],
                    progress: '#E26226', wash: '#E26226',
                    idle: 0, value: 118, peak: 143,
                    readout: (v) => String(Math.round(v)),
                },
                boost: {
                    start: -135, sweep: 270, min: -1, max: 1.5,
                    majorStep: 0.5, minorPerMajor: 5,
                    numeral: (v) => v.toFixed(1),
                    numeralStyle: 'font-size:4.85cqw;font-weight:300;color:rgba(255,255,255,.7)',
                    tickColor: (v) => (v >= 1.2 ? 'rgba(248,113,113,.95)' : v < 0 ? 'rgba(148,163,184,.65)' : 'rgba(103,232,249,.85)'),
                    zones: [
                        { from: -1, to: 0, color: 'rgba(148,163,184,.55)' },
                        { from: 0, to: 1.2, color: 'rgba(34,211,238,.6)' },
                        { from: 1.2, to: 1.5, color: 'rgba(220,38,38,.9)' },
                    ],
                    idle: -0.85, value: 0.92,
                    readout: (v) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2),
                },
                power: {
                    start: -135, sweep: 270, min: -30, max: 120,
                    majorStep: 30, minorPerMajor: 3,
                    numeral: (v) => (v === -30 ? 'CHG' : String(v)),
                    numeralStyle: 'font-size:4.85cqw;font-weight:300;color:rgba(255,255,255,.68)',
                    tickColor: (v) => (v < 0 ? 'rgba(52,211,153,.85)' : 'rgba(216,180,254,.75)'),
                    zones: [
                        { from: -30, to: 0, color: 'rgba(16,185,129,.7)' },
                        { from: 0, to: 120, color: 'rgba(168,85,247,.3)' },
                    ],
                    progress: '#C084FC', progressFrom: 0,
                    idle: -22, value: 78, soc: 72,
                    readout: (v) => String(Math.round(v)),
                },
            };

            /* ---------- polar helpers ---------- */
            const angleFor = (spec, value) => spec.start + ((value - spec.min) / (spec.max - spec.min)) * spec.sweep;

            const spoke = (angle) => {
                const wrap = document.createElement('div');
                wrap.className = 'spoke';
                wrap.style.transform = \`rotate(\${angle}deg)\`;
                return wrap;
            };

            const arcGradient = (spec, segments) => segments.map((segment) => {
                const from = angleFor(spec, segment.from);
                const span = ((segment.to - segment.from) / (spec.max - spec.min)) * spec.sweep;
                return \`conic-gradient(from \${from}deg, \${segment.color} 0deg, \${segment.color} \${span}deg, transparent \${span}deg)\`;
            }).join(', ');

            function buildTicks(host, spec, options) {
                if (!host) return;
                const settings = options || {};
                const step = spec.majorStep / spec.minorPerMajor;
                const count = Math.round((spec.max - spec.min) / step);
                for (let index = 0; index <= count; index += 1) {
                    const value = spec.min + index * step;
                    const isMajor = index % spec.minorPerMajor === 0;
                    const wrap = spoke(angleFor(spec, value));
                    const tick = document.createElement('i');
                    tick.className = \`tick \${isMajor ? 'major' : 'minor'}\`;
                    tick.style.background = (settings.color || spec.tickColor)(value);
                    if (settings.scale) {
                        tick.style.top = isMajor ? '9%' : '10.5%';
                        tick.style.height = isMajor ? '10%' : '5%';
                        tick.style.width = isMajor ? '3.6%' : '2.2%';
                    }
                    wrap.appendChild(tick);
                    host.appendChild(wrap);
                }
            }

            function buildNumerals(host, spec) {
                if (!host) return;
                const count = Math.round((spec.max - spec.min) / spec.majorStep);
                for (let index = 0; index <= count; index += 1) {
                    const value = Math.round((spec.min + index * spec.majorStep) * 1000) / 1000;
                    const angle = angleFor(spec, value);
                    const wrap = spoke(angle);
                    const numeral = document.createElement('span');
                    numeral.className = 'numeral';
                    numeral.setAttribute('style', spec.numeralStyle);
                    numeral.textContent = spec.numeral(value);
                    numeral.style.transform = \`translateX(-50%) rotate(\${-angle}deg)\`;
                    wrap.appendChild(numeral);
                    host.appendChild(wrap);
                }
            }

            /* ---------- build every dial ---------- */
            document.querySelectorAll('[data-gauge]').forEach((card) => {
                const spec = SPECS[card.dataset.gauge];
                if (!spec) return;

                buildTicks(card.querySelector('[data-ticks]'), spec);
                buildNumerals(card.querySelector('[data-numerals]'), spec);

                const band = card.querySelector('[data-zone-band]');
                if (band && spec.zones) band.style.background = arcGradient(spec, spec.zones);

                if (spec.sub) {
                    buildTicks(card.querySelector('[data-subticks]'), spec.sub, {
                        scale: true,
                        color: (value) => (value >= 115 ? 'rgba(248,113,113,.95)' : 'rgba(255,255,255,.55)'),
                    });
                    const subNeedle = card.querySelector('[data-subneedle]');
                    if (subNeedle) subNeedle.style.setProperty('--angle', \`\${angleFor(spec.sub, spec.sub.min)}deg\`);
                }

                const needle = card.querySelector('[data-needle]');
                if (needle) needle.style.setProperty('--angle', \`\${angleFor(spec, spec.idle)}deg\`);
            });

            /* ---------- instrument sequence ---------- */
            function setArc(card, selector, spec, value, color) {
                const arc = card.querySelector(selector);
                if (!arc || !color) return;
                const from = spec.progressFrom != null ? spec.progressFrom : spec.min;
                arc.style.background = arcGradient(spec, [{ from, to: Math.max(from, value), color }]);
            }

            function countTo(element, spec, from, to, duration) {
                if (!element || !spec.readout) return;
                if (reduceMotion || duration === 0) { element.textContent = spec.readout(to); return; }
                const started = performance.now();
                const step = (now) => {
                    const progress = Math.min(1, (now - started) / duration);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    element.textContent = spec.readout(from + (to - from) * eased);
                    if (progress < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            }

            function sweepTo(card, spec, value, duration) {
                const needle = card.querySelector('[data-needle]');
                if (needle) {
                    needle.style.setProperty('--needle-duration', \`\${duration}ms\`);
                    needle.style.setProperty('--angle', \`\${angleFor(spec, value)}deg\`);
                }
                setArc(card, '[data-progress-arc]', spec, value, spec.progress);
                setArc(card, '[data-progress-wash]', spec, value, spec.wash);

                const overboost = card.querySelector('[data-overboost]');
                if (overboost) overboost.hidden = value < 1.2;
            }

            function runInstrument(card) {
                const spec = SPECS[card.dataset.gauge];
                if (!spec) return;
                const readout = card.querySelector('[data-readout]');
                const flutter = card.querySelector('[data-needle] .flutter');
                const peak = card.querySelector('[data-peak]');
                const soc = card.querySelector('[data-soc]');
                const subNeedle = card.querySelector('[data-subneedle]');
                const peakTo = (value) => { if (peak && spec.peak != null) peak.style.transform = \`rotate(\${angleFor(spec, value)}deg)\`; };

                if (soc && spec.soc != null) soc.style.width = \`\${spec.soc}%\`;
                if (subNeedle && spec.sub) subNeedle.style.setProperty('--angle', \`\${angleFor(spec.sub, spec.sub.value)}deg\`);

                if (reduceMotion) {
                    sweepTo(card, spec, spec.value, 0);
                    countTo(readout, spec, spec.value, spec.value, 0);
                    peakTo(spec.peak);
                    return;
                }

                const cycle = () => {
                    if (flutter) flutter.removeAttribute('data-live');

                    /* instrument self-test: full-scale sweep, fall back to rest, settle on the live reading */
                    sweepTo(card, spec, spec.max, 1100);
                    countTo(readout, spec, spec.idle, spec.max, 1100);
                    peakTo(spec.max);

                    setTimeout(() => {
                        sweepTo(card, spec, spec.idle, 900);
                        countTo(readout, spec, spec.max, spec.idle, 900);
                        peakTo(spec.idle);
                    }, 1350);

                    setTimeout(() => {
                        sweepTo(card, spec, spec.value, 1200);
                        countTo(readout, spec, spec.idle, spec.value, 1200);
                        peakTo(spec.peak);
                    }, 2500);

                    setTimeout(() => { if (flutter) flutter.setAttribute('data-live', ''); }, 3900);
                };

                cycle();
                setInterval(cycle, 8000);
            }

            /* ---------- heading word reveal ---------- */
            const wrapWords = (elementId) => {
                const el = document.getElementById(elementId);
                if (!el) return;
                const text = el.innerText.trim().replace(/\\s+/g, ' ');
                el.innerHTML = '';
                const words = text.split(' ');
                words.forEach((word, index) => {
                    const wordWrap = document.createElement('span');
                    wordWrap.style.display = 'inline-block';
                    wordWrap.style.overflow = 'hidden';
                    wordWrap.style.paddingBottom = '4px';

                    const wordSpan = document.createElement('span');
                    wordSpan.className = 'word';
                    wordSpan.style.display = 'inline-block';
                    wordSpan.style.opacity = '0';
                    wordSpan.style.transform = 'translateY(100%)';
                    wordSpan.style.filter = 'blur(4px)';
                    wordSpan.style.transition = 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
                    wordSpan.style.transitionDelay = \`\${index * 40}ms\`;
                    wordSpan.innerHTML = word + '&nbsp;';

                    wordWrap.appendChild(wordSpan);
                    el.appendChild(wordWrap);
                });
            };

            wrapWords('hero-title');
            wrapWords('hero-subtitle');

            const observer = new IntersectionObserver((entries, self) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    entry.target.style.filter = 'blur(0)';

                    entry.target.querySelectorAll('.word').forEach((word) => {
                        word.style.opacity = '1';
                        word.style.transform = 'translateY(0)';
                        word.style.filter = 'blur(0)';
                    });

                    if (entry.target.dataset.gauge) setTimeout(() => runInstrument(entry.target), 500);

                    self.unobserve(entry.target);
                });
            }, { root: null, rootMargin: '0px', threshold: 0.1 });

            document.querySelectorAll('[data-anim="true"]').forEach((el) => observer.observe(el));
        });
    <\/script>
</body>
</html>
`,L={mode:"dark",hue:0,saturation:1,brightness:1},q={performanceGaugesTachometer:{title:"Tachometer diagnostic gauge",source:A,background:"#000000",targets:[{selector:"#gauge-tachometer",role:"visual",fit:"contain-square"}]},performanceGaugesSpeedometer:{title:"Speedometer diagnostic gauge",source:A,background:"#000000",targets:[{selector:"#gauge-speedometer",role:"visual",fit:"contain-square"}]},performanceGaugesBoost:{title:"Turbo boost diagnostic gauge",source:A,background:"#000000",targets:[{selector:"#gauge-boost",role:"visual",fit:"contain-square"}]},performanceGaugesPower:{title:"EV power diagnostic gauge",source:A,background:"#000000",targets:[{selector:"#gauge-power",role:"visual",fit:"contain-square"}]},glassmorphismCta:{title:"Glassmorphism CTA button",source:le,background:"#111318",theme:{lightBackground:"#f4f7fb",darkBackground:"#111318"},targets:[{selector:".component-wrapper a",role:"button",preserveTransform:!0}]}};function W(e,t,a){return Math.min(a,Math.max(t,e))}function Z(e,t){var a;return((a=e.theme)==null?void 0:a[`${t}Background`])??e.background}function ce(e,t){var v,w;const a=Z(e,t),n=((v=e.theme)==null?void 0:v.invertBackground)===!0&&e.theme.nativeMode!==t,c=((w=e.transformSource)==null?void 0:w.call(e,e.source,t))??e.source,i=JSON.stringify(e.targets).replace(/</g,"\\u003c"),p=JSON.stringify(e.hiddenTargets??[]).replace(/</g,"\\u003c"),b=JSON.stringify(e.introWordmark??null).replace(/</g,"\\u003c"),x=JSON.stringify(t),u=n?"filter: invert(1) hue-rotate(180deg) saturate(.92) brightness(1.02) !important;":"",f=e.introWordmark?`${e.introWordmark.sceneSelector} .tx { font-size: ${e.introWordmark.fontSize}px !important; }`:"",C=`<style data-threeui-focus>
html, body { width: 100% !important; height: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: ${a} !important; color-scheme: ${t} !important; }
body { position: relative !important; display: flex !important; align-items: center !important; justify-content: center !important; }
body > * { visibility: hidden !important; }
body[data-threeui-ready] > [data-threeui-role] { visibility: visible !important; }
[data-threeui-residual] { display: none !important; }
[data-threeui-hidden] { display: none !important; }
[data-threeui-role="background"] { position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; z-index: 0 !important; opacity: 1 !important; pointer-events: none !important; ${u} }
[data-threeui-role="background"][data-threeui-fit="contain-square"] { position: absolute !important; top: 50% !important; right: auto !important; bottom: auto !important; left: 50% !important; width: min(100vw, 100vh) !important; height: min(100vw, 100vh) !important; aspect-ratio: 1 / 1 !important; transform: translate(-50%, -50%) !important; }
[data-threeui-role="button"] { position: relative !important; z-index: 2 !important; opacity: 1 !important; flex: none !important; }
[data-threeui-role="button"]:not([data-threeui-preserve-transform]) { transform: none !important; }
[data-threeui-role="visual"] { position: relative !important; z-index: 1 !important; width: min(100%, 1040px) !important; max-width: 1040px !important; max-height: 100% !important; margin: auto !important; padding: 24px !important; overflow: auto !important; opacity: 1 !important; filter: none !important; }
[data-threeui-role="visual"]:not([data-threeui-preserve-transform]) { transform: none !important; }
[data-threeui-role="visual"][data-threeui-fit="contain-square"] { flex: none !important; width: min(calc(100vw - 32px), calc(100vh - 32px)) !important; max-width: none !important; height: min(calc(100vw - 32px), calc(100vh - 32px)) !important; max-height: none !important; aspect-ratio: 1 / 1 !important; padding: 0 !important; overflow: hidden !important; }
[data-threeui-role="visual"][data-threeui-fit="wide-wordmark"] { width: min(calc(100vw - 48px), 1180px) !important; max-width: calc(100vw - 48px) !important; height: auto !important; max-height: none !important; aspect-ratio: 16 / 3 !important; padding: 0 !important; overflow: hidden !important; }
[data-threeui-role="visual"][data-threeui-fit="portrait-stage"] { position: absolute !important; top: 50% !important; right: auto !important; bottom: auto !important; left: 50% !important; width: 1080px !important; max-width: none !important; height: 1350px !important; max-height: none !important; padding: 0 !important; overflow: hidden !important; transform-origin: center !important; }
${f}
</style>`,z=`<script data-threeui-focus>
(function () {
  document.documentElement.dataset.sfMode = ${x};
  var isolated = false;
  function isolate() {
    if (isolated) return;
    var specs = ${i};
    var hiddenSelectors = ${p};
    var introWordmark = ${b};
    var roots = [];
    hiddenSelectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (element) {
        element.setAttribute('data-threeui-hidden', '');
        element.setAttribute('aria-hidden', 'true');
        if ('inert' in element) element.inert = true;
      });
    });
    specs.forEach(function (spec) {
      var element = document.querySelector(spec.selector);
      if (!element) return;
      element.setAttribute('data-threeui-role', spec.role);
      if (spec.fit) element.setAttribute('data-threeui-fit', spec.fit);
      if (spec.preserveTransform) element.setAttribute('data-threeui-preserve-transform', '');
      if (!roots.some(function (root) { return root.contains(element); })) roots.push(element);
    });
    if (introWordmark) {
      var introScene = document.querySelector(introWordmark.sceneSelector);
      var introText = introScene && introScene.querySelector('.tx');
      var introMark = introText && introText.querySelector('.mark');
      if (introText && introMark) {
        introMark.innerHTML = introWordmark.logoSvg;
        var introCharacters = Array.from(introText.children).filter(function (element) { return element !== introMark; });
        introCharacters.forEach(function (element, index) {
          element.textContent = introWordmark.text[index] === ' ' ? ' ' : (introWordmark.text[index] || '');
          element.style.display = index < introWordmark.text.length ? 'inline-block' : 'none';
        });
      }
      var introReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var introStartedAt = performance.now();
      function renderIntroWordmark(now) {
        if (typeof window.__seek !== 'function') return;
        if (introReducedMotion) {
          window.__seek(introWordmark.endTime);
          return;
        }
        var introCycle = introWordmark.endTime + introWordmark.holdTime;
        var introTime = ((now - introStartedAt) / 1000) % introCycle;
        window.__seek(Math.min(introTime, introWordmark.endTime));
        requestAnimationFrame(renderIntroWordmark);
      }
      requestAnimationFrame(renderIntroWordmark);
    }
    if (!roots.length) return;
    isolated = true;
    roots.forEach(function (root) {
      var placeholderLink = root.matches('a[href="#"]') ? root : root.querySelector('a[href="#"]');
      if (placeholderLink) placeholderLink.addEventListener('click', function (event) { event.preventDefault(); });
      document.body.appendChild(root);
    });
    Array.from(document.body.children).forEach(function (element) {
      if (roots.indexOf(element) !== -1) return;
      element.setAttribute('data-threeui-residual', '');
      element.setAttribute('aria-hidden', 'true');
      if ('inert' in element) element.inert = true;
    });
    document.body.setAttribute('data-threeui-ready', '');
    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
  }
  function scheduleIsolation() { setTimeout(isolate, 100); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleIsolation, { once: true });
  else scheduleIsolation();
  window.addEventListener('load', isolate, { once: true });
})();
<\/script>`;return c.replace(/<\/head>/i,`${C}</head>`).replace(/<\/body>/i,`${z}</body>`)}function ee({definition:e,mode:t=L.mode,hue:a=L.hue,saturation:n=L.saturation,brightness:c=L.brightness,runtime:i,trackPointerHover:p,className:b,style:x}){const u=h.useRef(null),f=t==="light"?"light":"dark",C=Z(e,f),z=h.useMemo(()=>ce(e,f),[e,f]),v=W(a,-180,180),w=W(n,0,2),E=W(c,.35,1.65),M=v===0&&w===1&&E===1?void 0:`hue-rotate(${v}deg) saturate(${w}) brightness(${E})`;h.useEffect(()=>{const r=u.current;if(!p||!r)return;let g=!1;const l=()=>{var s;g&&(g=!1,(s=r.contentWindow)==null||s.postMessage({threeuiRuntime:{hover:0}},"*"))},y=s=>{var d;s.source===r.contentWindow&&((d=s.data)!=null&&d.threeuiPointerOver)&&(g=!0)},k=s=>{if(!g)return;const d=r.getBoundingClientRect();(s.clientX<d.left||s.clientX>d.right||s.clientY<d.top||s.clientY>d.bottom)&&l()};return window.addEventListener("message",y),window.addEventListener("pointermove",k,!0),r.addEventListener("pointerleave",l),document.addEventListener("mouseleave",l),window.addEventListener("blur",l),()=>{window.removeEventListener("message",y),window.removeEventListener("pointermove",k,!0),r.removeEventListener("pointerleave",l),document.removeEventListener("mouseleave",l),window.removeEventListener("blur",l)}},[p]);const T=i?JSON.stringify(i):null;return h.useEffect(()=>{const r=u.current;if(!r||!T)return;const g=()=>{var l;return(l=r.contentWindow)==null?void 0:l.postMessage({threeuiRuntime:JSON.parse(T)},"*")};return g(),r.addEventListener("load",g),()=>r.removeEventListener("load",g)},[T,z]),S.jsx("iframe",{ref:u,className:b,"data-mode":f,title:e.title,srcDoc:z,sandbox:"allow-scripts",loading:"eager",style:{display:"block",width:"100%",height:"100%",border:0,background:C,filter:M,...x}})}function de(e){return function(t){return S.jsx(ee,{...t,definition:e})}}const J={tachometer:q.performanceGaugesTachometer,speedometer:q.performanceGaugesSpeedometer,boost:q.performanceGaugesBoost,power:q.performanceGaugesPower},pe={variant:"tachometer"};function fe({variant:e=pe.variant,...t}){const a=J[e]??J.tachometer;return S.jsx(ee,{...t,definition:a})}const be=de(q.glassmorphismCta);export{be as E,he as Q,ue as U,me as q,fe as u};
