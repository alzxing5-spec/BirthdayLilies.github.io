// ── Google Font ────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel  = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap";
document.head.appendChild(fontLink);

const canvas = document.getElementById("canvas");
const ctx    = canvas.getContext("2d");
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;

const CX = canvas.width  / 2;
const CY = canvas.height / 2 + 60;
const HEARTLINE = canvas.height / 2 + 12;
const GROUND = CY + 200;

const birthDate = new Date("2011-05-14");
const Metdate   = new Date("2026-01-11");
const textColor = "#29a6ff";

let scene = "heart";

// ── HEART STATE ────────────────────────────────────────────────────────────
let heartAlpha    = 0;
let heartScale    = 1;
let heartY        = 0;
let heartPulse    = 0;
let heartFadeIn   = 0;
let clickReady    = false;
let linesHidden   = false;
let msgAlpha      = 0;

// ── COLLAPSE STATE ─────────────────────────────────────────────────────────
let collapseStartY   = 0;
let collapseVelY     = 0;
let collapseY        = 0;
let collapseDone     = false;
let collapseRotation = 0;
let lineGreen        = 0;
let lineFadeAlpha    = 1;
let lineFadeState    = "fadeout";
let heartFalling     = false;
let heartDropping    = false;
let heartSeedScale   = 1;
let heartBeatA       = 2;
let heartA           = 2;
let seedY            = 0;
let seedVelY         = 0;
let seedRotation     = 0;
let seedActive       = false;
let seedDone         = false;
const GRAVITY        = 0.6;

// ── GROW STATE ─────────────────────────────────────────────────────────────
let stemProgress  = 0;
let grassProgress = 0;
let leafProgress  = 0;

// ── BLOOM STATE ────────────────────────────────────────────────────────────
let petalProgress   = 0;
let stamenProgress  = 0;
let flowerAngle     = 0;
let lifeTextAlpha   = 0;
let envelopeAlpha   = 0;
let envelopeVisible = false;
let envelopeOpen    = false;
let envelopeSent    = false;
let envCheckDone    = false;

// ── POEM STATE ─────────────────────────────────────────────────────────────
let sceneFadeAlpha = 0;
let sceneFading    = false;
let sceneCleared   = false;

// ─────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOut(t)     { return 1 - Math.pow(1 - t, 3); }
function easeInOut(t)   { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
function seededRand(s)  { const x = Math.sin(s+1)*43758.5453; return x - Math.floor(x); }

// ─────────────────────────────────────────────────────────────────────────
// HEART MATH
// ─────────────────────────────────────────────────────────────────────────
function heartY_at(x, a) {
    if (5 - x*x < 0) return null;
    return Math.pow(Math.abs(x), 2/4.5) + 0.8 * Math.sqrt(5 - x*x) * Math.sin(a * Math.PI * x);
}

// ─────────────────────────────────────────────────────────────────────────
// DRAW: GROUND LINE
// ─────────────────────────────────────────────────────────────────────────
function drawGround(alpha, y, color) {
    y     = y     || GROUND;
    color = color || "#d00a6d";



    // black mask below the line — covers anything drawn underneath
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = "black";
    ctx.fillRect(0, y + 4, canvas.width, canvas.height - y);
    ctx.globalAlpha = 1;

    // glowing line on top
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth   = 8;
    ctx.shadowBlur  = 15;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
    ctx.stroke();
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────────────────
// DRAW: HEART
// ─────────────────────────────────────────────────────────────────────────
function drawHeart(cx, cy, s, alpha, a, showLines) {
    if (showLines === undefined) showLines = true;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.scale(s, s);

    const sc    = 40;
    const flatY = -50; // 🔧 TUNE ME: flatline y in heart-local coords
    const edgeX = 95;  // 🔧 TUNE ME: px from center where flatline meets heart

    ctx.beginPath();
    if (showLines) {
        ctx.moveTo(-canvas.width / (2 * s), flatY);
        ctx.lineTo(-edgeX, flatY);
    }

    let first = true;
    for (let x = -Math.sqrt(5); x <= Math.sqrt(5); x += 0.005) {
        const yv = heartY_at(x, a);
        if (yv === null) continue;
        const sx = x * sc, sy = -yv * sc;
        if (first) {
            if (showLines) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy);
            first = false;
        } else ctx.lineTo(sx, sy);
    }

    if (showLines) {
        ctx.lineTo(edgeX, flatY);
        ctx.lineTo(canvas.width / (2 * s), flatY);
    }

    ctx.strokeStyle = "#d00a6d";
    ctx.lineWidth   = 5 / s;
    ctx.shadowBlur  = 60;
    ctx.shadowColor = "#d00a6d";
    ctx.stroke();
    ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────
// DRAW: GRASS
// ─────────────────────────────────────────────────────────────────────────
const blades = Array.from({ length: 120 }, (_, i) => ({
    x:    seededRand(i)       * canvas.width,
    h:    12 + seededRand(i+100) * 27,
    lean: (seededRand(i+200) - 0.5) * 50,
    w:    1.5 + seededRand(i+300) * 2.5,
    hue:  100 + seededRand(i+400) * 40,
}));

function drawGrass(progress) {
    if (progress <= 0) return;
    ctx.shadowBlur  = 4;
    ctx.shadowColor = "#1b5e20";
    blades.forEach(b => {
        const h = b.h * progress;
        ctx.beginPath();
        ctx.moveTo(b.x, GROUND);
        ctx.bezierCurveTo(b.x+b.lean*0.2, GROUND-h*0.4, b.x+b.lean*0.7, GROUND-h*0.7, b.x+b.lean, GROUND-h);
        const g = ctx.createLinearGradient(b.x, GROUND, b.x+b.lean, GROUND-h);
        g.addColorStop(0, `hsl(${b.hue},55%,15%)`);
        g.addColorStop(1, `hsl(${b.hue+20},70%,42%)`);
        ctx.strokeStyle = g;
        ctx.lineWidth   = b.w;
        ctx.lineCap     = "round";
        ctx.globalAlpha = Math.min(progress * 1.5, 0.95);
        ctx.stroke();
    });
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────────────────
// DRAW: STEM + LEAVES
// ─────────────────────────────────────────────────────────────────────────
const STEM_TOP_Y = GROUND - 200; // 🔧 TUNE ME: stem height (lower number = shorter stem / lily lower)
const STEM_BOT_Y = GROUND;

function getStemTip(progress) {
    return lerp(STEM_BOT_Y, STEM_TOP_Y, easeOut(progress));
}

function drawStem(progress) {
    if (progress <= 0) return;
    const tipY = getStemTip(progress);

    // sample points along the bezier up to current progress
    const steps = 40;
    ctx.beginPath();
    for (let s = 0; s <= steps; s++) {
        const t  = (s / steps) * progress; // only draw up to current progress
        const t2 = t, t3 = t*t, t4 = t2*t2*t2;
        const mt = 1 - t;

        // cubic bezier: P0, P1, P2, P3
        const p0x = CX,      p0y = STEM_BOT_Y;
        const p1x = CX - 20, p1y = lerp(STEM_BOT_Y, STEM_TOP_Y, 0.3);
        const p2x = CX + 15, p2y = lerp(STEM_BOT_Y, STEM_TOP_Y, 0.7);
        const p3x = CX,      p3y = STEM_TOP_Y;

        const x = mt*mt*mt*p0x + 3*mt*mt*t*p1x + 3*mt*t*t*p2x + t*t*t*p3x;
        const y = mt*mt*mt*p0y + 3*mt*mt*t*p1y + 3*mt*t*t*p2y + t*t*t*p3y;

        s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }

    const g = ctx.createLinearGradient(CX, STEM_BOT_Y, CX, STEM_TOP_Y);
    g.addColorStop(0, "#2e8b57");
    g.addColorStop(1, "#3cb371");
    ctx.strokeStyle = g;
    ctx.lineWidth   = 8;
    ctx.lineCap     = "round";
    ctx.globalAlpha = Math.min(progress * 2, 1);
    ctx.shadowBlur  = 8;
    ctx.shadowColor = "#2e7d32";
    ctx.stroke();
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
}

function drawLeaves(progress) {
    if (progress <= 0) return;
    const positions = [0.15, 0.32, 0.50];
    positions.forEach((t, i) => {
        const lp = Math.max(0, Math.min(1, (progress - t * 0.5) * 3));
        if (lp <= 0) return;
        const leafY     = lerp(STEM_BOT_Y, STEM_TOP_Y, t);
        const side      = i % 2 === 0 ? 1 : -1;
        const leafLen   = 55 * lp;
        const leafCurve = 45;
        ctx.beginPath();
        ctx.moveTo(CX, leafY);
        ctx.quadraticCurveTo(CX+side*leafCurve, leafY-leafLen*0.3, CX+side*leafLen, leafY-leafLen);
        ctx.quadraticCurveTo(CX+side*22, leafY-leafLen*0.6, CX+side*4, leafY-4);
        ctx.closePath();
        const g = ctx.createLinearGradient(CX, leafY, CX+side*leafLen, leafY-leafLen);
        g.addColorStop(0, "#1b5e20");
        g.addColorStop(1, "#66bb6a");
        ctx.fillStyle   = g;
        ctx.globalAlpha = lp;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = "#2e7d32";
        ctx.fill();
    });
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────────────────
// DRAW: LILY
// ─────────────────────────────────────────────────────────────────────────

// 🔧 TUNE THESE:
const LILY_SCALE         = 1.4;  // 🔧 scale entire lily up/down (1=default, 1.5=50% bigger)
const LILY_PETAL_LENGTH  = 150;  // max length of each petal in px (multiplied by LILY_SCALE)
const LILY_PETAL_WIDTH   = 24;   // max width of each petal in px (multiplied by LILY_SCALE)
const LILY_FLARE         = -1.3; // how far petals fling (negative=upward, positive=downward)
const LILY_CUP_Z         = 70;   // depth of inward cup in bud
const LILY_STAMEN_LEN    = 45;   // stamen filament length in px (multiplied by LILY_SCALE)
const LILY_STAMEN_SPREAD = 9;    // spacing between stamens in px
const LILY_SPINE_SEGS    = 22;   // smoothness of petal ribbon
const LILY_BUD_ANGLE     = 0.5;  // initial petal separation in bud
const LILY_GROW_SPLIT    = 0.45; // fraction of animation spent growing closed before expanding
const LILY_TILT          = 0.6;  // 0=flat, 0.5=tilted toward viewer
const PRINGLES           = 0.18; // 🔧 saddle bend depth (0=flat, 0.3=strong)

function drawLily(petalProg, stamenProg, angle) {
    if (petalProg <= 0) return;

    const bx = CX;
    const by = STEM_TOP_Y;
    const L  = LILY_PETAL_LENGTH * LILY_SCALE;
    const W  = LILY_PETAL_WIDTH  * LILY_SCALE;
    const SL = LILY_STAMEN_LEN   * LILY_SCALE;

    function drawPetal(petalP, angleRad, layer) {
        const N = LILY_SPINE_SEGS;

        const growT   = Math.min(petalP / LILY_GROW_SPLIT, 1);
        const expandT = Math.max((petalP - LILY_GROW_SPLIT) / (1 - LILY_GROW_SPLIT + 0.0001), 0);
        const bloom   = expandT;

        const budSwing = Math.PI / 2 - LILY_BUD_ANGLE;
        const swing    = budSwing * (1 - bloom) - (LILY_FLARE * Math.PI / 2) * bloom;

        const spine = [];
        for (let i = 0; i <= N; i++) {
            const t      = i / N;
            const radial = L * growT * t;
            let px = Math.cos(swing) * radial;
            let py = -Math.sin(swing) * radial;

            const zCup   =  Math.sin(t * Math.PI * 0.8) * LILY_CUP_Z * (1 - bloom);
            const zFlare = -Math.sin(t * Math.PI) * 30 * bloom;
            px -= zCup;
            px += zFlare * 0.3;
            py += zFlare * 0.1;

            const pringlesY = Math.sin(t * Math.PI) * Math.sin(angleRad * 2) * W * PRINGLES * bloom;
            py += pringlesY;

            spine.push({ x: px, y: py, t });
        }

        function widthAt(t) {
            return W * Math.sin(t * Math.PI) * (0.15 + 0.85 * bloom) * growT * (1 - t * 0.12);
        }

        function rot(p) {
            return {
                x: bx + p.x * Math.cos(angleRad),
                y: by + p.y * (1 - LILY_TILT) + p.x * Math.sin(angleRad) * 0.32 + Math.abs(p.x) * LILY_TILT * 0.4,
            };
        }

        const rotSpine = spine.map(rot);
        const leftEdge = [], rightEdge = [];

        for (let i = 0; i <= N; i++) {
            const pt   = rotSpine[i];
            const next = rotSpine[Math.min(i+1, N)];
            const prev = rotSpine[Math.max(i-1, 0)];
            const tx = next.x - prev.x, ty = next.y - prev.y;
            const tl = Math.sqrt(tx*tx + ty*ty) || 1;
            const nx = -ty/tl, ny = tx/tl;
            const w  = widthAt(spine[i].t);
            leftEdge.push ({ x: pt.x + nx*w, y: pt.y + ny*w });
            rightEdge.push({ x: pt.x - nx*w, y: pt.y - ny*w });
        }

        const tip        = rotSpine[N];
        const brightness = layer === "back" ? 45 : 60;
        const pg = ctx.createLinearGradient(bx, by, tip.x, tip.y);
        pg.addColorStop(0,   `hsl(340,85%,${brightness-15}%)`);
        pg.addColorStop(0.4, `hsl(340,80%,${brightness}%)`);
        pg.addColorStop(1,   `hsl(340,60%,${brightness+22}%)`);

        ctx.globalAlpha = layer === "back" ? 0.72 : 1.0;
        ctx.shadowBlur  = layer === "front" ? 18 : 6;
        ctx.shadowColor = "#d00a6d";

        ctx.beginPath();
        ctx.moveTo(bx, by);
        leftEdge.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(tip.x, tip.y);
        for (let i = rightEdge.length-1; i >= 0; i--) ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
        ctx.closePath();
        ctx.fillStyle = pg;
        ctx.fill();

        ctx.beginPath();
        rotSpine.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = "rgba(194,24,91,0.28)";
        ctx.lineWidth   = 1.1;
        ctx.shadowBlur  = 0;
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.shadowBlur  = 0;
    }

    const back  = [Math.PI, -Math.PI*0.67, Math.PI*0.67];
    const front = [0, -Math.PI*0.33, Math.PI*0.33];

    back.forEach(ang  => drawPetal(petalProg, ang + angle*0.015, "back"));

    if (stamenProg > 0) {
        ctx.globalAlpha = stamenProg;
        for (let i = 0; i < 6; i++) {
            const off    = (i - 2.5) * LILY_STAMEN_SPREAD;
            const wobble = Math.sin(i * 1.4) * 4 * stamenProg;
            ctx.beginPath();
            ctx.moveTo(bx + off*0.3, by);
            ctx.quadraticCurveTo(bx + off*0.6 + wobble, by - SL*0.5, bx + off + wobble, by - SL);
            ctx.strokeStyle = "#f8bbd0";
            ctx.lineWidth   = 1.2;
            ctx.shadowBlur  = 0;
            ctx.stroke();
            ctx.save();
            ctx.translate(bx + off + wobble, by - SL - 7);
            ctx.rotate(0.3 * (i - 2.5));
            ctx.beginPath();
            ctx.ellipse(0, 0, 4, 7, 0, 0, Math.PI*2);
            ctx.fillStyle   = "#fdd835";
            ctx.shadowBlur  = 8;
            ctx.shadowColor = "#f9a825";
            ctx.fill();
            ctx.shadowBlur  = 0;
            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }

    front.forEach(ang => drawPetal(petalProg, ang + angle*0.015, "front"));
}


// ─────────────────────────────────────────────────────────────────────────
// POLLEN DUST
// ─────────────────────────────────────────────────────────────────────────

// 🔧 TUNE THESE:
const POLLEN_COUNT      = 55;    // number of pollen particles alive at once
const POLLEN_RADIUS_MIN = 120;   // min spawn distance from lily center (px)
const POLLEN_RADIUS_MAX = canvas.width * 0.33; // max spread — 1/3 of screen
const POLLEN_SIZE_MIN   = 1.5;   // min dot radius
const POLLEN_SIZE_MAX   = 3.5;   // max dot radius
const POLLEN_LIFE_MAX   = 180;   // frames a particle lives before respawning
const POLLEN_SPEED      = 0.4;   // drift speed multiplier
const POLLEN_GLOW       = 8;     // shadow blur (keep low for subtle)

const pollenParticles = [];

function spawnPollen() {
    const angle = Math.random() * Math.PI * 2;
    return {
        x:       CX + Math.cos(angle) * (30 + Math.random() * 60),
        y:       STEM_TOP_Y + Math.sin(angle) * (20 + Math.random() * 40),
        vx:      (Math.random() - 0.5) * POLLEN_SPEED * 1.2,
        vy:      -(Math.random() * POLLEN_SPEED * 0.8 + 0.1),
        size:    POLLEN_SIZE_MIN + Math.random() * (POLLEN_SIZE_MAX - POLLEN_SIZE_MIN),
        life:    0,
        maxLife: POLLEN_LIFE_MAX * (0.6 + Math.random() * 0.4),
        hue:     45 + Math.random() * 20,
        wobbleOffset: Math.random() * Math.PI * 2,
    };
}

for (let i = 0; i < POLLEN_COUNT; i++) {
    const p = spawnPollen();
    p.life = Math.floor(Math.random() * p.maxLife);
    pollenParticles.push(p);
}

function updateAndDrawPollen(intensity) {
    if (intensity <= 0) return;
    const activeCount = Math.floor(intensity * POLLEN_COUNT);

    for (let i = 0; i < POLLEN_COUNT; i++) {
        const p = pollenParticles[i];
        p.life++;

        if (p.life >= p.maxLife) {
            const fresh = spawnPollen();
            Object.assign(p, fresh);
            p.life = 0;
            continue;
        }

        if (i >= activeCount) continue;

        // check distance — fade out beyond 1/3 screen radius
        const dx   = p.x - CX;
        const dy   = p.y - STEM_TOP_Y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const distFade = Math.max(1 - dist / POLLEN_RADIUS_MAX, 0);

        const t       = p.life / p.maxLife;
        const fadeIn  = Math.min(t * 6, 1);
        const fadeOut = Math.max(1 - (t - 0.65) * 2.9, 0);
        const alpha   = fadeIn * fadeOut * distFade * intensity;

        if (alpha <= 0.01) continue;

        p.x += p.vx + Math.sin(p.life * 0.07 + p.wobbleOffset) * 0.25;
        p.y += p.vy;

        ctx.save();
        ctx.globalAlpha = alpha * 0.82;
        ctx.shadowBlur  = POLLEN_GLOW;
        ctx.shadowColor = `hsl(${p.hue}, 90%, 70%)`;
        ctx.fillStyle   = `hsl(${p.hue}, 85%, 72%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
}
// ─────────────────────────────────────────────────────────────────────────
// DRAW: LIFE TEXT
// ─────────────────────────────────────────────────────────────────────────
function drawLifeText(alpha) {
    if (alpha <= 0) return;
    const now   = new Date();
    const diff  = now - birthDate;
    const Mdiff = now - Metdate;

    const tm      = Math.floor(diff/(1000*60));
    const days    = Math.floor(tm/(60*24));
    const hours   = Math.floor((tm%(60*24))/60);
    const minutes = tm%60;

    const Mtm = Math.floor(Mdiff/(1000*60));
    const Md  = Math.floor(Mtm/(60*24));
    const Mh  = Math.floor((Mtm%(60*24))/60);
    const Mm  = Mtm%60;

    const lines = [
        "The world just got luckier since —                                        I just got luckier since —          ",
        ` ${days} days, ${hours} hours                                     ${Md} days, ${Mh} hours     `,
        `and ${minutes} minutes                                        and ${Mm} minutes`,
        ""
    ];

    const ax = CX;
    let   ay = CY - 20;

    ctx.globalAlpha = alpha;
    ctx.fillStyle   = textColor;
    ctx.textAlign   = "Center";
    ctx.font        = "bold 34px 'Dancing Script', cursive";
    ctx.shadowBlur  = 20;
    ctx.shadowColor = "#d00a6d";

    lines.forEach((l, i) => {
        if (l === "") { ay += 20; return; }
        ctx.fillText(l, ax, ay + i*42);
    });

    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────────────────
// ENVELOPE
// ─────────────────────────────────────────────────────────────────────────
const envW = 350, envH = 240;
const envX = canvas.width/2 - envW/2;
const envY = CY - envH/2 - 240;

function drawEnvelope(alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    const ex = envX, ey = envY, ew = envW, eh = envH;
    const mx = ex + ew/2;

    ctx.font        = "italic 22px 'Dancing Script', cursive";
    ctx.fillStyle   = "#29a6ff";
    ctx.textAlign   = "center";
    ctx.shadowBlur  = 15;
    ctx.shadowColor = "#1acaff";
    ctx.fillText("make a wish... ✨", mx, ey - 18);

    ctx.shadowBlur  = 30;
    ctx.shadowColor = "#d00a6d";
    ctx.strokeStyle = "#d00a6d";
    ctx.lineWidth   = 2;
    ctx.fillStyle   = "rgba(20,0,10,0.85)";
    ctx.beginPath();
    ctx.roundRect(ex, ey, ew, eh, 10);
    ctx.fill();
    ctx.stroke();

    if (!envelopeOpen) {
        ctx.beginPath();
        ctx.moveTo(ex, ey); ctx.lineTo(mx, ey+eh*0.48); ctx.lineTo(ex+ew, ey);
        ctx.closePath();
        ctx.fillStyle   = "rgba(180,0,80,0.6)";
        ctx.fill();
        ctx.strokeStyle = "#d00a6d";
        ctx.stroke();
        ctx.font        = "28px serif";
        ctx.textAlign   = "center";
        ctx.shadowBlur  = 20;
        ctx.shadowColor = "#ff69b4";
        ctx.fillStyle   = "#ff69b4";
        ctx.fillText("💌", mx, ey+eh*0.52);
        ctx.font      = "14px 'Dancing Script', cursive";
        ctx.fillStyle = "rgba(255,180,210,0.7)";
        ctx.shadowBlur = 0;
        ctx.fillText("click to open", mx, ey+eh-14);
    } else if (!envelopeSent) {
        ctx.beginPath();
        ctx.moveTo(ex, ey); ctx.lineTo(mx, ey+eh*0.32); ctx.lineTo(ex+ew, ey);
        ctx.closePath();
        ctx.fillStyle = "rgba(100,0,50,0.5)";
        ctx.fill(); ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.moveTo(ex, ey); ctx.lineTo(mx, ey+eh*0.48); ctx.lineTo(ex+ew, ey);
        ctx.closePath();
        ctx.fillStyle = "rgba(180,0,80,0.6)";
        ctx.fill(); ctx.stroke();
        ctx.font        = "22px 'Dancing Script', cursive";
        ctx.fillStyle   = "#ff69b4";
        ctx.textAlign   = "center";
        ctx.shadowBlur  = 20;
        ctx.shadowColor = "#ff69b4";
        ctx.fillText("your wish is on its way 🌸", mx, ey+eh*0.72);
    }

    ctx.beginPath();
    ctx.moveTo(ex, ey+eh); ctx.lineTo(mx, ey+eh*0.55); ctx.lineTo(ex+ew, ey+eh);
    ctx.strokeStyle = "rgba(210,0,100,0.4)";
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────
// POEM
// ─────────────────────────────────────────────────────────────────────────
const poemLines = [
    "I hate the way you talk to me",
    "And the way you cut your hair",
    "I hate the way you drive my car",
    "I hate it when you stare",
    "I hate your big dumb combat boots",
    "And the way you read my mind",
    "I hate you so much that it makes me sick",
    "And even makes me rhyme",
    "I hate the way you're always right",
    "I hate it when you lie",
    "I hate it when you make me laugh",
    "Even worse when you make me cry",
    "I hate it when you're not around",
    "And the fact that you didn't call",
    "But mostly I hate the way I don't hate you",
    "Not even close",
    "Not even a little bit",
    "Not even at all",
];

const lineH      = 36;
const listStartY = canvas.height/2 - (poemLines.length*lineH)/2 + 18;
const poemAlphas = poemLines.map(() => 0);
let   poemActive = false, poemStarted = false, bdayAlpha = 0;

function startPoemSequence() {
    if (poemStarted) return;
    poemStarted = true;
    sceneFading = true;

    setTimeout(() => {
        sceneCleared = true;
        poemActive   = true;

        poemLines.forEach((_, i) => {
            setTimeout(() => {
                (function fi() {
                    if (poemAlphas[i] < 0.85) { poemAlphas[i] += 0.008; requestAnimationFrame(fi); }
                    else poemAlphas[i] = 0.85;
                })();
            }, i * 1000);
        });

        setTimeout(() => {
            (function fb() {
                if (bdayAlpha < 1) { bdayAlpha += 0.01; requestAnimationFrame(fb); }
                else bdayAlpha = 1;
            })();
        }, poemLines.length * 1000 + 500);
    }, 3000);
}

function drawPoem() {
    if (!poemActive) return;
    ctx.font        = "italic 22px 'Dancing Script', cursive";
    ctx.shadowBlur  = 10;
    ctx.shadowColor = "#d00a6d";
    const poemDamp  = 1 - bdayAlpha * 0.75;
    poemLines.forEach((line, i) => {
        if (poemAlphas[i] <= 0) return;
        ctx.globalAlpha = poemAlphas[i] * poemDamp;
        ctx.fillStyle   = "#f48fb1";
        ctx.textAlign   = "center";
        ctx.fillText(line, canvas.width/2, listStartY + i*lineH);
    });
    if (bdayAlpha > 0) {
        ctx.globalAlpha = bdayAlpha;
        ctx.textAlign   = "center";
        ctx.font        = "bold 64px 'Dancing Script', cursive";
        ctx.fillStyle   = "#ff69b4";
        ctx.shadowBlur  = 45;
        ctx.shadowColor = "#ff69b4";
        ctx.fillText("Happy Birthday 🌸", canvas.width/2, canvas.height/2);
    }
    ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN LOOP
// ─────────────────────────────────────────────────────────────────────────
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (scene === "heart") {
        if (heartFadeIn < 1) heartFadeIn += 0.008;
        heartPulse += 0.02;
        const a = 4.5 * Math.sin(heartPulse + 5);
        heartA = a;

        if (heartFadeIn >= 1 && msgAlpha < 1) msgAlpha += 0.008;
        if (msgAlpha > 0) {
            ctx.globalAlpha = msgAlpha;
            ctx.font        = "bold 38px 'Dancing Script', cursive";
            ctx.fillStyle   = textColor;
            ctx.textAlign   = "center";
            ctx.shadowBlur  = 20;
            ctx.shadowColor = "#1acaff";
            ctx.fillText("Click the full heart to open a gift...", CX, GROUND - 60);
            ctx.shadowBlur  = 0;
            ctx.globalAlpha = 1;
        }

        drawHeart(CX, CY, 1, heartFadeIn, a, !linesHidden);
        if (heartFadeIn >= 1) clickReady = true;

    } else if (scene === "collapse") {
        heartPulse += 0.02;
        if (heartBeatA < 4.8) heartBeatA = Math.min(heartBeatA + 0.08, 4.8);
        const a = heartBeatA;

        if (lineFadeAlpha < 1) lineFadeAlpha += 0.03;
        heartFalling = true;

        // draw seed BEFORE ground so ground mask covers it on landing
        if (seedActive && !seedDone) {
            seedVelY     += GRAVITY * 0.9;
            seedY        += seedVelY;
            seedRotation += 0.15;

            const SEED_DEATH_Y = GROUND;
            if (seedY >= SEED_DEATH_Y) seedDone = true;

            ctx.save();
            ctx.translate(CX, seedY);
            ctx.rotate(seedRotation);
            ctx.translate(-CX, -seedY);
            drawHeart(CX, seedY, 0.18, 1, a, false);
            ctx.restore();
        }


        if (heartFalling && seedDone && !collapseDone) {
            seedVelY     += GRAVITY * 0.9;
            seedY        += seedVelY;
            seedRotation += 0.15;

            const SEED_DEATH_Y = GROUND; // 🔧 TUNE ME: y where seed vanishes
            if (seedY >= SEED_DEATH_Y) seedDone = true;

            ctx.save();
            ctx.translate(CX, seedY);
            ctx.rotate(seedRotation);
            ctx.translate(-CX, -seedY);
            drawHeart(CX, seedY, 0.18, 1, a, false); // 🔧 TUNE ME: 0.18 = seed size
            ctx.restore();
        }

        // ground line + mask drawn ON TOP — seed disappears under it
        drawGround(lineFadeAlpha, GROUND, "#2e8b57");

        if (heartFalling && seedDone && !collapseDone) {
            collapseDone = true;
            setTimeout(() => { scene = "grow"; }, 50);
        }

    } else if (scene === "grow") {
        if (stemProgress < 1) stemProgress += 0.03;
        if (stemProgress > 0.4 && grassProgress < 1) grassProgress += 0.022;

        const FLOWER_DELAY = 0.9; // 🔧 TUNE ME: 0=immediately, 1=only after stem fully done
        if (stemProgress > FLOWER_DELAY && leafProgress < 1) leafProgress += 0.02;
        if (stemProgress > FLOWER_DELAY) petalProgress = leafProgress;
        if (petalProgress > 0.5 && stamenProgress < 1) stamenProgress += 0.05;

        drawGround(1, GROUND, "#2e8b57");
        drawGrass(grassProgress);
        drawStem(stemProgress);
        drawLeaves(leafProgress);
        drawLily(petalProgress, stamenProgress, flowerAngle);
        updateAndDrawPollen(petalProgress);
        flowerAngle += 0.08;

        if (stemProgress >= 1 && leafProgress >= 0.9) scene = "bloom";

    } else if (scene === "bloom") {
        if (petalProgress < 1) petalProgress += 0.01;
        if (petalProgress > 0.5 && stamenProgress < 1) stamenProgress += 0.02;
        flowerAngle += 0.24;

        if (grassProgress < 1) grassProgress += 0.005;
        if (petalProgress >= 1 && lifeTextAlpha < 1) lifeTextAlpha += 0.008;

        if (lifeTextAlpha >= 0.5 && !envCheckDone) {
            envCheckDone = true;
            setTimeout(() => { envelopeVisible = true; }, 800);
        }
        if (envelopeVisible && envelopeAlpha < 1) envelopeAlpha += 0.012;

        drawGround(1, GROUND, "#2e8b57");
        drawGrass(grassProgress);
        drawStem(1);
        drawLeaves(leafProgress);
        drawLily(petalProgress, stamenProgress, flowerAngle);
        updateAndDrawPollen(1);
        drawLifeText(lifeTextAlpha);
        drawEnvelope(envelopeAlpha);

        if (sceneFading) {
            if (sceneFadeAlpha < 1) sceneFadeAlpha += 0.012;
            ctx.globalAlpha = sceneFadeAlpha;
            ctx.fillStyle   = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;
        }

    } else if (scene === "poem") {
        drawPoem();
    }

    if (sceneCleared && scene !== "poem") scene = "poem";

    requestAnimationFrame(draw);
}

// ─────────────────────────────────────────────────────────────────────────
// CLICK HANDLERS
// ─────────────────────────────────────────────────────────────────────────
canvas.addEventListener("click", (e) => {
    if (scene === "heart" && clickReady && Math.abs(heartA) > 3.0) {
        const dx = e.clientX - CX;
        const dy = e.clientY - CY;
        if (Math.sqrt(dx*dx + dy*dy) < 140) {
            collapseStartY   = CY;
            collapseY        = CY;
            collapseVelY     = 0;
            collapseDone     = false;
            collapseRotation = 0;
            lineGreen        = 0;
            lineFadeAlpha    = 0;
            lineFadeState    = "done";
            heartFalling     = false;
            heartDropping    = false;
            heartSeedScale   = 1;
            heartBeatA       = 2;
            linesHidden      = true;
            seedY            = CY;
            seedVelY         = -12;  // 🔧 TUNE ME: initial upward pop velocity
            seedRotation     = 0;
            seedActive       = true;
            seedDone         = false;
            scene = "collapse";
            return;
        }
    }

    if (
        scene === "bloom" &&
        envelopeVisible && !envelopeOpen && !envelopeSent &&
        e.clientX >= envX && e.clientX <= envX + envW &&
        e.clientY >= envY && e.clientY <= envY + envH
    ) {
        envelopeOpen = true;
        wishOverlay.style.display = "flex";
        wishInput.focus();
    }
});

// ─────────────────────────────────────────────────────────────────────────
// WISH OVERLAY
// ─────────────────────────────────────────────────────────────────────────
const wishOverlay = document.createElement("div");
wishOverlay.style.cssText = `
    position: fixed;
    left: ${envX}px; top: ${envY + 60}px; width: ${envW}px;
    display: none; flex-direction: column; align-items: center;
    gap: 10px; z-index: 10;
`;

const wishInput = document.createElement("textarea");
wishInput.placeholder = "type your wish here...";
wishInput.style.cssText = `
    width: 90%; height: 65px;
    background: rgba(10,0,20,0.9);
    border: 1.5px solid #d00a6d; border-radius: 8px;
    color: #fce4ec; font: 16px 'Dancing Script', cursive;
    padding: 8px; resize: none; outline: none;
    box-shadow: 0 0 12px #d00a6d;
`;

const wishBtn = document.createElement("button");
wishBtn.textContent = "send my wish 💌";
wishBtn.style.cssText = `
    background: transparent; border: 1.5px solid #ff69b4;
    color: #ff69b4; font: bold 16px 'Dancing Script', cursive;
    padding: 6px 18px; border-radius: 20px; cursor: pointer;
    box-shadow: 0 0 10px #d00a6d; transition: opacity 0.8s, background 0.2s;
`;
wishBtn.onmouseover = () => wishBtn.style.background = "rgba(210,0,100,0.2)";
wishBtn.onmouseout  = () => wishBtn.style.background = "transparent";

wishOverlay.appendChild(wishInput);
wishOverlay.appendChild(wishBtn);
document.body.appendChild(wishOverlay);

wishBtn.addEventListener("click", () => {
    const wish = wishInput.value.trim();
    if (!wish) return;

    wishBtn.style.opacity      = "0";
    wishInput.style.transition = "opacity 0.8s";
    wishInput.style.opacity    = "0";

    const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSco252XadSLyqFgk7qlp16dQ9YN7mGXyc6Zs1KuUH8Yo_c0xQ/formResponse";
    const body    = new FormData();
    body.append("entry.139623406", wish);

    fetch(formURL, { method: "POST", body, mode: "no-cors" })
        .finally(() => {
            setTimeout(() => {
                wishOverlay.style.display = "none";
                envelopeSent = true;
                setTimeout(startPoemSequence, 2000);
            }, 900);
        });
});

// ─────────────────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────────────────
setTimeout(() => draw(), 500);
