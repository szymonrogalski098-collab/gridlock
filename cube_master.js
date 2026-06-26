// ═══════════════════════════════════════════════
// GRIDLOCK — Game Logic // [2.0-s5a]
// ═══════════════════════════════════════════════

// ══════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════
const N = 16, DASH_RANGE = 5, MAX_LASERS = 12;
const CHARGE_START = 1100, CHARGE_MIN = 500, CHARGE_STEP = 50;
const FIRE_MS = 700, GAP_MS = 850;
const BLOCK_INTERVAL = 3, MAX_BLOCKS = 12;

// [1.11] Boss system
const BOSS_ROUNDS  = [20, 40, 60]; // [2.0-s4e]
const BOSS_CONFIG  = {
  1: { name: 'SENTINEL',   gridX: 7, gridY: 7, size: 2, reward:  50 },
  2: { name: 'PHANTOM',    gridX: 6, gridY: 6, size: 3, reward: 100 },
  3: { name: 'VOID KING',  gridX: 6, gridY: 6, size: 4, reward: 200 },
};
// [2.0-s4b] World 2 active-combat bosses — round 25/50/75 then every 25 (cycling, faster each cycle)
const W2_BOSS = [
  { id:'pulsar',      name:'PULSAR',      size:3, hits:2, reward: 250, attacks:['throw','spin'] },
  { id:'neutron',     name:'NEUTRON',     size:4, hits:4, reward: 400, attacks:['throw','spin','rain','gravity'] },
  { id:'singularity', name:'SINGULARITY', size:5, hits:8, reward:1000, attacks:['throw','spin','rain','gravity','blackhole','star'] },
];

// ══════════════════════════════════════════════════
// SYSTEM SKINÓW — canvas drawing functions
// ══════════════════════════════════════════════════
function drawSkin(ctx2, id, x, y, size, t) {
  const s = size, cx = x+s/2, cy = y+s/2, r = s/2;
  ctx2.save();
  ctx2.translate(x, y);

  switch(id) {

    // ── PATTERNS ──
    // ── PATTERNS (geometric + neon) ──

    case 'default': {
      // "CORE" — concentric squares with neon pulse from center
      ctx2.fillStyle='#020210'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const pulse = .7 + .3*Math.sin(t*.06);
      // concentric rounded squares
      const rings = [
        {r:s*.48, col:`rgba(0,255,220,${.15*pulse})`},
        {r:s*.36, col:`rgba(0,200,255,${.3*pulse})`},
        {r:s*.24, col:`rgba(0,160,255,${.5*pulse})`},
        {r:s*.13, col:`rgba(100,220,255,${.75*pulse})`},
      ];
      for(const rg of rings){
        const off=s/2-rg.r;
        ctx2.beginPath(); ctx2.roundRect(off,off,rg.r*2,rg.r*2,rg.r*.2);
        ctx2.strokeStyle=rg.col; ctx2.lineWidth=1.5; ctx2.stroke();
      }
      // center — bright dot
      const gcore=ctx2.createRadialGradient(s/2,s/2,0,s/2,s/2,s*.1);
      gcore.addColorStop(0,'rgba(255,255,255,.9)');
      gcore.addColorStop(1,'rgba(0,255,220,0)');
      ctx2.fillStyle=gcore; ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.1,0,Math.PI*2); ctx2.fill();
      ctx2.restore(); break;
    }

    case 'stripes': {
      // "HEX" — hexagonal grid with neon outline
      ctx2.fillStyle='#050518'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const hr=s*.12, hh=hr*Math.sqrt(3);
      const hexAlpha=.55+.2*Math.sin(t*.04);
      ctx2.strokeStyle=`rgba(255,60,180,${hexAlpha})`; ctx2.lineWidth=1;
      function _hex(cx,cy,r){
        ctx2.beginPath();
        for(let i=0;i<6;i++){
          const a=Math.PI/6+i*Math.PI/3;
          i===0?ctx2.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a))
               :ctx2.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));
        }
        ctx2.closePath(); ctx2.stroke();
      }
      for(let row=-1;row<4;row++){
        for(let col=-1;col<4;col++){
          const cx=col*hr*3+(row%2)*hr*1.5;
          const cy=row*hh;
          _hex(cx,cy,hr*.92);
        }
      }
      // neon glow on center hex
      ctx2.shadowColor='#ff40b0'; ctx2.shadowBlur=8;
      _hex(s/2,s/2,hr*.92);
      ctx2.shadowBlur=0;
      ctx2.restore(); break;
    }

    case 'grid': {
      // "CIRCUIT" — printed circuit board pattern
      ctx2.fillStyle='#001a08'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const cAlpha=.5+.25*Math.sin(t*.05);
      ctx2.strokeStyle=`rgba(0,255,100,${cAlpha})`; ctx2.lineWidth=.8;
      // horizontal and vertical lines (sparse grid)
      const step=s/5;
      for(let i=0;i<=5;i++){
        ctx2.beginPath();ctx2.moveTo(i*step,0);ctx2.lineTo(i*step,s);ctx2.stroke();
        ctx2.beginPath();ctx2.moveTo(0,i*step);ctx2.lineTo(s,i*step);ctx2.stroke();
      }
      // nodes at intersections
      ctx2.fillStyle=`rgba(0,255,100,${cAlpha})`;
      for(let i=0;i<=5;i++) for(let j=0;j<=5;j++){
        ctx2.beginPath(); ctx2.arc(i*step,j*step,1.8,0,Math.PI*2); ctx2.fill();
      }
      // extra "path" lines — L-shapes
      ctx2.strokeStyle=`rgba(0,200,80,${cAlpha*.8})`; ctx2.lineWidth=1.5;
      const paths=[
        [[1*step,0],[1*step,2*step],[3*step,2*step]],
        [[4*step,5*step],[4*step,3*step],[2*step,3*step],[2*step,1*step]],
        [[0,4*step],[3*step,4*step],[3*step,5*step]],
      ];
      for(const path of paths){
        ctx2.beginPath(); ctx2.moveTo(path[0][0],path[0][1]);
        for(let k=1;k<path.length;k++) ctx2.lineTo(path[k][0],path[k][1]);
        ctx2.stroke();
      }
      // pulsing nodes at path endpoints
      ctx2.shadowColor='#00ff64'; ctx2.shadowBlur=6;
      ctx2.fillStyle=`rgba(0,255,100,${.7+.3*Math.sin(t*.08)})`;
      [[1*step,2*step],[3*step,2*step],[4*step,3*step],[2*step,1*step],[3*step,5*step]].forEach(([px,py])=>{
        ctx2.beginPath(); ctx2.arc(px,py,2.5,0,Math.PI*2); ctx2.fill();
      });
      ctx2.shadowBlur=0;
      ctx2.restore(); break;
    }

    case 'gradient': {
      // "PRISM" — triangular geometry with prism effect
      ctx2.fillStyle='#080010'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      // 4 triangles forming a rhombus/diamond with different gradients
      const prismColors=[
        ['#ff0088','#ff8800'],  // left
        ['#ff8800','#ffff00'],  // top
        ['#ffff00','#00ffcc'],  // right
        ['#00ffcc','#0088ff'],  // bottom
      ];
      const tris=[
        [[0,s/2],[s/2,0],[s/2,s/2]],    // left
        [[s/2,0],[s,s/2],[s/2,s/2]],    // upper-right
        [[s,s/2],[s/2,s],[s/2,s/2]],    // lower-right
        [[s/2,s],[0,s/2],[s/2,s/2]],    // lower-left
      ];
      tris.forEach(([a,b,c],i)=>{
        const g=ctx2.createLinearGradient(a[0],a[1],b[0],b[1]);
        g.addColorStop(0,prismColors[i][0]+'cc');
        g.addColorStop(1,prismColors[i][1]+'cc');
        ctx2.fillStyle=g;
        ctx2.beginPath(); ctx2.moveTo(a[0],a[1]); ctx2.lineTo(b[0],b[1]); ctx2.lineTo(c[0],c[1]); ctx2.closePath(); ctx2.fill();
      });
      // lines between triangles with glow
      ctx2.strokeStyle='rgba(255,255,255,.25)'; ctx2.lineWidth=.8;
      [[0,s/2,s/2,0],[s/2,0,s,s/2],[s,s/2,s/2,s],[s/2,s,0,s/2],[s/2,s/2,s/2,0],[s/2,s/2,s,s/2],[s/2,s/2,s/2,s],[s/2,s/2,0,s/2]].forEach(([x1,y1,x2,y2])=>{
        ctx2.beginPath(); ctx2.moveTo(x1,y1); ctx2.lineTo(x2,y2); ctx2.stroke();
      });
      // centrum
      const gp=ctx2.createRadialGradient(s/2,s/2,0,s/2,s/2,s*.08);
      gp.addColorStop(0,'rgba(255,255,255,.9)'); gp.addColorStop(1,'rgba(255,255,255,0)');
      ctx2.fillStyle=gp; ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.08,0,Math.PI*2); ctx2.fill();
      ctx2.restore(); break;
    }

    case 'rainbow': {
      // "VORTEX" — spiral of rotating segments
      ctx2.fillStyle='#04000a'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const spin=t*.03;
      const segs=6;
      for(let i=0;i<segs;i++){
        const a1=spin+i*(Math.PI*2/segs);
        const a2=a1+Math.PI*2/segs*.85;
        for(let ring=0;ring<3;ring++){
          const r1=s*.12+ring*s*.12, r2=r1+s*.1;
          const hue=((t*1.5+i*(360/segs)+ring*40))%360;
          const g=ctx2.createRadialGradient(s/2,s/2,r1,s/2,s/2,r2);
          g.addColorStop(0,`hsla(${hue},100%,65%,.9)`);
          g.addColorStop(1,`hsla(${(hue+40)%360},100%,55%,.4)`);
          ctx2.fillStyle=g;
          ctx2.beginPath();
          ctx2.arc(s/2,s/2,r2,a1,a2);
          ctx2.arc(s/2,s/2,r1,a2,a1,true);
          ctx2.closePath(); ctx2.fill();
        }
      }
      // center — white pulse
      const gv=ctx2.createRadialGradient(s/2,s/2,0,s/2,s/2,s*.08);
      gv.addColorStop(0,'rgba(255,255,255,.95)'); gv.addColorStop(1,'rgba(255,255,255,0)');
      ctx2.fillStyle=gv; ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.08,0,Math.PI*2); ctx2.fill();
      ctx2.restore(); break;
    }
    // ── EFEKTY (GD-inspired) ──

    case 'glitch': {
      ctx2.fillStyle='#000008'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      ctx2.fillStyle='rgba(0,20,40,.8)'; ctx2.fillRect(0,0,s,s);
      const glColors=['#00ffff','#ff00ff','#ffff00','#ff0080','#00ff80'];
      const gseed=Math.floor(t*.3);
      for(let i=0;i<12;i++){
        const gx=((gseed*7+i*31)%16)*s/16;
        const gy=((gseed*13+i*17)%16)*s/16;
        const gw=((gseed*3+i*7)%6+2)*s/16;
        const col=glColors[(gseed+i)%glColors.length];
        ctx2.fillStyle=col+(i%3===0?'99':'44');
        ctx2.fillRect(gx,gy,gw,s/16);
      }
      const shift=(gseed%3)*s*.08;
      ctx2.fillStyle='rgba(0,255,255,.15)';
      for(let y2=0;y2<s;y2+=4){ ctx2.fillRect(shift,y2,s*.6,1.5); }
      ctx2.strokeStyle='rgba(255,255,255,'+((.5+.4*Math.sin(t*.2)))+')';
      ctx2.lineWidth=1.5;
      const errY=s/2+Math.sin(t*.15)*s*.1;
      ctx2.beginPath(); ctx2.moveTo(0,errY); ctx2.lineTo(s,errY+Math.sin(t*.3)*s*.05); ctx2.stroke();
      ctx2.strokeStyle='#00ffff'; ctx2.lineWidth=1; _rect(ctx2,1,1,s-2,s-2,3); ctx2.stroke();
      ctx2.restore(); break;
    }

    case 'aura': {
      ctx2.fillStyle='#020008'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const aHue=(t*1.5)%360;
      for(let layer=4;layer>=0;layer--){
        const lr=s*(.48-layer*.04);
        const la=.12+layer*.08;
        const lHue=(aHue+layer*25)%360;
        const aG=ctx2.createRadialGradient(s/2,s/2,lr*.5,s/2,s/2,lr);
        aG.addColorStop(0,'hsla('+lHue+',100%,70%,0)');
        aG.addColorStop(.7,'hsla('+lHue+',100%,65%,'+la+')');
        aG.addColorStop(1,'hsla('+((lHue+30)%360)+',100%,55%,0)');
        ctx2.fillStyle=aG; ctx2.beginPath(); ctx2.arc(s/2,s/2,lr,0,Math.PI*2); ctx2.fill();
      }
      const aC=ctx2.createRadialGradient(s/2,s/2,0,s/2,s/2,s*.2);
      aC.addColorStop(0,'rgba(255,255,255,.95)');
      aC.addColorStop(.4,'hsla('+aHue+',100%,80%,.7)');
      aC.addColorStop(1,'hsla('+aHue+',100%,60%,0)');
      ctx2.fillStyle=aC; ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.2,0,Math.PI*2); ctx2.fill();
      for(let i=0;i<6;i++){
        const a=t*.04+i*Math.PI/3;
        const px=s/2+Math.cos(a)*s*.33, py=s/2+Math.sin(a)*s*.33;
        const pG=ctx2.createRadialGradient(px,py,0,px,py,s*.04);
        pG.addColorStop(0,'hsla('+((aHue+i*40)%360)+',100%,90%,.9)');
        pG.addColorStop(1,'rgba(0,0,0,0)');
        ctx2.fillStyle=pG; ctx2.beginPath(); ctx2.arc(px,py,s*.04,0,Math.PI*2); ctx2.fill();
      }
      ctx2.restore(); break;
    }

    case 'magma': {
      ctx2.fillStyle='#0a0000'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const mBg=ctx2.createRadialGradient(s/2,s*.7,0,s/2,s/2,s*.55);
      mBg.addColorStop(0,'#ff6600'); mBg.addColorStop(.4,'#cc2200');
      mBg.addColorStop(.8,'#660000'); mBg.addColorStop(1,'#1a0000');
      ctx2.fillStyle=mBg; ctx2.fillRect(0,0,s,s);
      const bubbles=[{bx:.3,by:.6,br:.12,phase:0},{bx:.65,by:.4,br:.1,phase:1.5},
        {bx:.5,by:.75,br:.09,phase:.8},{bx:.2,by:.35,br:.08,phase:2.2},{bx:.75,by:.65,br:.11,phase:.3}];
      for(const b of bubbles){
        const pulse=Math.sin(t*.08+b.phase);
        const br=s*(b.br+pulse*.015), by2=s*(b.by+pulse*.02);
        const bG=ctx2.createRadialGradient(s*b.bx,by2,0,s*b.bx,by2,br);
        bG.addColorStop(0,'rgba(255,220,50,.9)'); bG.addColorStop(.4,'rgba(255,100,0,.6)'); bG.addColorStop(1,'rgba(180,0,0,0)');
        ctx2.fillStyle=bG; ctx2.beginPath(); ctx2.arc(s*b.bx,by2,br,0,Math.PI*2); ctx2.fill();
      }
      ctx2.strokeStyle='rgba(255,180,0,.4)'; ctx2.lineWidth=.8;
      [[.1*s,.5*s,.5*s,.2*s],[.5*s,.2*s,.9*s,.6*s],[.3*s,.8*s,.7*s,.7*s]].forEach(([x1,y1,x2,y2])=>{
        ctx2.beginPath(); ctx2.moveTo(x1,y1); ctx2.lineTo(x2,y2); ctx2.stroke();
      });
      ctx2.restore(); break;
    }

    case 'void': {
      ctx2.fillStyle='#000000'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      for(let i=0;i<20;i++){
        const sx2=(Math.sin(i*137.5)*.5+.5)*s, sy2=(Math.cos(i*97.3)*.5+.5)*s;
        const sa=.2+.6*Math.abs(Math.sin(t*.04+i));
        ctx2.fillStyle='rgba(200,180,255,'+sa+')';
        ctx2.beginPath(); ctx2.arc(sx2,sy2,.7,0,Math.PI*2); ctx2.fill();
      }
      const vSpin=t*.04;
      for(let ring=0;ring<3;ring++){
        const vR1=s*(.18+ring*.08), vR2=vR1+s*.06;
        const vHue=270+ring*20;
        for(let seg=0;seg<8;seg++){
          const a1=vSpin+seg*Math.PI/4, a2=a1+Math.PI/4*.85;
          const vSG=ctx2.createRadialGradient(s/2,s/2,vR1,s/2,s/2,vR2);
          vSG.addColorStop(0,'hsla('+(vHue+seg*5)+',100%,60%,.8)');
          vSG.addColorStop(1,'hsla('+(vHue+seg*5+20)+',100%,40%,.3)');
          ctx2.fillStyle=vSG;
          ctx2.beginPath(); ctx2.arc(s/2,s/2,vR2,a1,a2); ctx2.arc(s/2,s/2,vR1,a2,a1,true); ctx2.closePath(); ctx2.fill();
        }
      }
      const vC=ctx2.createRadialGradient(s/2,s/2,0,s/2,s/2,s*.16);
      vC.addColorStop(0,'rgba(0,0,0,1)'); vC.addColorStop(.7,'rgba(0,0,0,1)'); vC.addColorStop(1,'rgba(30,0,60,.5)');
      ctx2.fillStyle=vC; ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.16,0,Math.PI*2); ctx2.fill();
      ctx2.fillStyle='rgba(200,180,255,.9)';
      ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.025,0,Math.PI*2); ctx2.fill();
      ctx2.restore(); break;
    }

    case 'neontrail': {
      ctx2.fillStyle='#000510'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const ntH=(t*2)%360;
      for(let i=4;i>=0;i--){
        const ta=1-i*.2, tx=-i*s*.12, ts=s*(1-i*.05), off=(s-ts)/2+tx;
        const ntHue=(t*2+i*20)%360;
        ctx2.fillStyle='hsla('+ntHue+',100%,65%,'+(ta*.3)+')';
        ctx2.beginPath(); ctx2.roundRect(off,off-tx*.3,ts,ts,4); ctx2.fill();
      }
      const ntG=ctx2.createLinearGradient(0,0,s,s);
      ntG.addColorStop(0,'hsl('+ntH+',100%,65%)');
      ntG.addColorStop(.5,'hsl('+((ntH+60)%360)+',100%,70%)');
      ntG.addColorStop(1,'hsl('+((ntH+120)%360)+',100%,60%)');
      ctx2.fillStyle=ntG; _rect(ctx2,s*.05,s*.05,s*.9,s*.9,5); ctx2.fill();
      ctx2.shadowColor='hsl('+ntH+',100%,60%)'; ctx2.shadowBlur=10;
      ctx2.strokeStyle='hsla('+ntH+',100%,80%,.8)'; ctx2.lineWidth=1.5;
      _rect(ctx2,s*.05,s*.05,s*.9,s*.9,5); ctx2.stroke();
      ctx2.shadowBlur=0;
      ctx2.strokeStyle='rgba(255,255,255,.25)'; ctx2.lineWidth=1;
      for(let i=1;i<4;i++){ ctx2.beginPath(); ctx2.moveTo(s*.1,s*i/4); ctx2.lineTo(s*.9,s*i/4); ctx2.stroke(); }
      ctx2.restore(); break;
    }

    // ── SHAPES (GD-inspired) ──

    case 'spike': {
      ctx2.fillStyle='#000a0a'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const spG=ctx2.createRadialGradient(s/2,s/2,0,s/2,s/2,s*.5);
      spG.addColorStop(0,'rgba(0,255,200,.15)'); spG.addColorStop(1,'rgba(0,0,0,0)');
      ctx2.fillStyle=spG; ctx2.fillRect(0,0,s,s);
      const sqG=ctx2.createLinearGradient(0,0,s,s);
      sqG.addColorStop(0,'#00ffcc'); sqG.addColorStop(1,'#0088ff');
      ctx2.fillStyle=sqG; _rect(ctx2,s*.25,s*.25,s*.5,s*.5,2); ctx2.fill();
      const spikes=[[s/2,s*.04,s*.32,s*.28,s*.68,s*.28],[s*.96,s/2,s*.72,s*.32,s*.72,s*.68],
        [s/2,s*.96,s*.68,s*.72,s*.32,s*.72],[s*.04,s/2,s*.28,s*.68,s*.28,s*.32]];
      spikes.forEach(([ax,ay,bx,by,cx2,cy2])=>{
        const sG2=ctx2.createLinearGradient(ax,ay,(bx+cx2)/2,(by+cy2)/2);
        sG2.addColorStop(0,'rgba(255,255,255,.9)'); sG2.addColorStop(1,'rgba(0,200,150,.6)');
        ctx2.fillStyle=sG2;
        ctx2.beginPath(); ctx2.moveTo(ax,ay); ctx2.lineTo(bx,by); ctx2.lineTo(cx2,cy2); ctx2.closePath(); ctx2.fill();
        ctx2.strokeStyle='rgba(0,255,200,.5)'; ctx2.lineWidth=.5; ctx2.stroke();
      });
      ctx2.shadowColor='#00ffcc'; ctx2.shadowBlur=8;
      ctx2.strokeStyle='rgba(0,255,200,.8)'; ctx2.lineWidth=1;
      _rect(ctx2,s*.25,s*.25,s*.5,s*.5,2); ctx2.stroke();
      ctx2.shadowBlur=0; ctx2.restore(); break;
    }

    case 'robot': {
      ctx2.fillStyle='#050510'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const rBg=ctx2.createLinearGradient(0,0,0,s);
      rBg.addColorStop(0,'#2a2a3a'); rBg.addColorStop(.5,'#1a1a2a'); rBg.addColorStop(1,'#0a0a18');
      ctx2.fillStyle=rBg; _rect(ctx2,s*.04,s*.04,s*.92,s*.92,4); ctx2.fill();
      ctx2.strokeStyle='#4488ff'; ctx2.lineWidth=1.5;
      ctx2.shadowColor='#4488ff'; ctx2.shadowBlur=6;
      _rect(ctx2,s*.04,s*.04,s*.92,s*.92,4); ctx2.stroke(); ctx2.shadowBlur=0;
      const eyePulse=.6+.4*Math.sin(t*.1);
      [[s*.3,s*.38],[s*.7,s*.38]].forEach(([ex,ey])=>{
        const eG=ctx2.createRadialGradient(ex,ey,0,ex,ey,s*.1);
        eG.addColorStop(0,'rgba(255,255,255,.95)');
        eG.addColorStop(.4,'rgba(0,180,255,'+eyePulse+')');
        eG.addColorStop(1,'rgba(0,60,180,.3)');
        ctx2.fillStyle=eG; ctx2.beginPath(); ctx2.arc(ex,ey,s*.1,0,Math.PI*2); ctx2.fill();
        ctx2.fillStyle='#000020'; ctx2.beginPath(); ctx2.arc(ex,ey,s*.04,0,Math.PI*2); ctx2.fill();
        ctx2.fillStyle='rgba(255,255,255,.7)'; ctx2.beginPath(); ctx2.arc(ex-s*.03,ey-s*.03,s*.025,0,Math.PI*2); ctx2.fill();
      });
      ctx2.strokeStyle='#4488ff'; ctx2.lineWidth=1;
      ctx2.beginPath(); ctx2.moveTo(s*.25,s*.68); ctx2.lineTo(s*.75,s*.68); ctx2.stroke();
      for(let i=0;i<5;i++){
        ctx2.fillStyle=i%2===0?'rgba(0,200,255,'+eyePulse+')':'rgba(100,100,255,.3)';
        ctx2.beginPath(); ctx2.arc(s*.28+i*s*.11,s*.68,s*.025,0,Math.PI*2); ctx2.fill();
      }
      ctx2.restore(); break;
    }

    case 'wave': {
      ctx2.fillStyle='#040010'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const wBg=ctx2.createLinearGradient(0,0,s,s);
      wBg.addColorStop(0,'rgba(80,0,160,.4)'); wBg.addColorStop(1,'rgba(0,80,200,.3)');
      ctx2.fillStyle=wBg; ctx2.fillRect(0,0,s,s);
      for(let w=0;w<3;w++){
        const wPhase=t*.06+w*Math.PI*.6;
        const wY=s/2+Math.sin(wPhase)*s*.12;
        const wAmp=s*.08-w*s*.02;
        const wFreq=3+w, wHue=200+w*40;
        ctx2.strokeStyle='hsla('+wHue+',100%,70%,'+((.7-w*.2))+')';
        ctx2.lineWidth=2-w*.4;
        ctx2.shadowColor='hsl('+wHue+',100%,60%)'; ctx2.shadowBlur=w===0?8:3;
        ctx2.beginPath();
        for(let px2=0;px2<=s;px2+=2){
          const py2=wY+Math.sin(px2/s*Math.PI*wFreq+wPhase)*wAmp;
          px2===0?ctx2.moveTo(px2,py2):ctx2.lineTo(px2,py2);
        }
        ctx2.stroke();
      }
      ctx2.shadowBlur=0;
      const shipY=s/2+Math.sin(t*.06)*s*.12;
      const shG=ctx2.createLinearGradient(s*.15,shipY-s*.12,s*.4,shipY+s*.12);
      shG.addColorStop(0,'#ffffff'); shG.addColorStop(1,'#8844ff');
      ctx2.fillStyle=shG;
      ctx2.beginPath(); ctx2.moveTo(s*.38,shipY); ctx2.lineTo(s*.16,shipY-s*.12); ctx2.lineTo(s*.16,shipY+s*.12); ctx2.closePath(); ctx2.fill();
      ctx2.restore(); break;
    }

    case 'ball': {
      ctx2.fillStyle='#020008'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const ballHue=(t*1.2)%360;
      const bGlow=ctx2.createRadialGradient(s/2,s/2,s*.3,s/2,s/2,s*.5);
      bGlow.addColorStop(0,'rgba(0,0,0,0)');
      bGlow.addColorStop(1,'hsla('+ballHue+',100%,60%,.2)');
      ctx2.fillStyle=bGlow; ctx2.fillRect(0,0,s,s);
      const bG=ctx2.createRadialGradient(s*.35,s*.32,0,s/2,s/2,s*.4);
      bG.addColorStop(0,'rgba(255,255,255,.9)');
      bG.addColorStop(.2,'hsla('+ballHue+',100%,75%,.9)');
      bG.addColorStop(.7,'hsla('+((ballHue+120)%360)+',100%,50%,.8)');
      bG.addColorStop(1,'hsla('+((ballHue+240)%360)+',100%,30%,.9)');
      ctx2.fillStyle=bG; ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.4,0,Math.PI*2); ctx2.fill();
      ctx2.save(); ctx2.translate(s/2,s/2); ctx2.rotate(t*.05);
      ctx2.strokeStyle='hsla('+((ballHue+180)%360)+',100%,80%,.4)'; ctx2.lineWidth=1;
      for(let i=0;i<3;i++){ ctx2.beginPath(); ctx2.arc(0,0,s*(.12+i*.09),0,Math.PI*2); ctx2.stroke(); }
      ctx2.strokeStyle='rgba(255,255,255,.25)'; ctx2.lineWidth=1;
      ctx2.beginPath(); ctx2.moveTo(-s*.35,0); ctx2.lineTo(s*.35,0); ctx2.stroke();
      ctx2.beginPath(); ctx2.moveTo(0,-s*.35); ctx2.lineTo(0,s*.35); ctx2.stroke();
      ctx2.restore();
      ctx2.fillStyle='rgba(255,255,255,.55)';
      ctx2.beginPath(); ctx2.ellipse(s*.33,s*.3,s*.09,s*.055,-Math.PI/5,0,Math.PI*2); ctx2.fill();
      ctx2.restore(); break;
    }

    case 'ufo': {
      ctx2.fillStyle='#000508'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const uSpin=t*.035;
      // outer electric arcs
      for(let i=0;i<8;i++){
        const ua=uSpin+i*Math.PI/4;
        const ur1=s*.42, ur2=s*.46+Math.sin(t*.15+i)*s*.03;
        const ux1=s/2+Math.cos(ua)*ur1, uy1=s/2+Math.sin(ua)*ur1*.5;
        const ux2=s/2+Math.cos(ua+.15)*ur2, uy2=s/2+Math.sin(ua+.15)*ur2*.5;
        ctx2.strokeStyle='rgba(0,255,180,'+(.3+.3*Math.sin(t*.2+i))+')';
        ctx2.lineWidth=.8; ctx2.beginPath(); ctx2.moveTo(ux1,uy1); ctx2.lineTo(ux2,uy2); ctx2.stroke();
      }
      // ring
      ctx2.save(); ctx2.translate(s/2,s/2); ctx2.rotate(uSpin*.5);
      const ringW=s*.06;
      for(let seg=0;seg<12;seg++){
        const sa=seg*Math.PI/6, ea=(seg+.85)*Math.PI/6;
        const rHue=120+seg*15;
        ctx2.strokeStyle='hsla('+rHue+',100%,'+(50+Math.sin(t*.1+seg)*20)+'%,.85)';
        ctx2.lineWidth=ringW; ctx2.beginPath(); ctx2.ellipse(0,0,s*.38,s*.14,0,sa,ea); ctx2.stroke();
      }
      for(let i=0;i<4;i++){
        const ua2=i*Math.PI/2;
        const ax=Math.cos(ua2)*s*.38, ay=Math.sin(ua2)*s*.14;
        const rG=ctx2.createRadialGradient(ax,ay,0,ax,ay,s*.04);
        rG.addColorStop(0,'rgba(0,255,180,1)'); rG.addColorStop(1,'rgba(0,255,180,0)');
        ctx2.fillStyle=rG; ctx2.beginPath(); ctx2.arc(ax,ay,s*.04,0,Math.PI*2); ctx2.fill();
      }
      ctx2.restore();
      // lower metallic hemisphere
      const metG=ctx2.createLinearGradient(s*.1,s*.55,s*.9,s*.88);
      metG.addColorStop(0,'#334455'); metG.addColorStop(.4,'#88aacc'); metG.addColorStop(.7,'#445566'); metG.addColorStop(1,'#223344');
      ctx2.fillStyle=metG; ctx2.beginPath(); ctx2.ellipse(s/2,s*.68,s*.36,s*.2,0,0,Math.PI); ctx2.fill();
      ctx2.strokeStyle='rgba(100,200,255,.3)'; ctx2.lineWidth=.7;
      for(let i=1;i<4;i++){ ctx2.beginPath(); ctx2.ellipse(s/2,s*.68,s*(.36-i*.08),s*(.2-i*.04),0,0,Math.PI); ctx2.stroke(); }
      // upper glass dome
      const domeG=ctx2.createRadialGradient(s*.38,s*.3,0,s/2,s*.48,s*.38);
      domeG.addColorStop(0,'rgba(200,255,240,.7)'); domeG.addColorStop(.3,'rgba(0,200,150,.3)');
      domeG.addColorStop(.7,'rgba(0,100,180,.15)'); domeG.addColorStop(1,'rgba(0,50,100,.05)');
      ctx2.fillStyle=domeG; ctx2.beginPath(); ctx2.ellipse(s/2,s*.48,s*.36,s*.28,0,Math.PI,0); ctx2.fill();
      // energy core
      const coreHue=(t*3)%360;
      const coreG=ctx2.createRadialGradient(s/2,s*.46,0,s/2,s*.46,s*.14);
      coreG.addColorStop(0,'rgba(255,255,255,.95)');
      coreG.addColorStop(.3,'hsla('+coreHue+',100%,70%,.8)');
      coreG.addColorStop(.7,'hsla('+((coreHue+120)%360)+',100%,50%,.4)');
      coreG.addColorStop(1,'rgba(0,0,0,0)');
      ctx2.fillStyle=coreG; ctx2.beginPath(); ctx2.arc(s/2,s*.46,s*.14,0,Math.PI*2); ctx2.fill();
      // rotating inner orbits
      ctx2.save(); ctx2.translate(s/2,s*.46); ctx2.rotate(t*.08);
      ctx2.strokeStyle='hsla('+coreHue+',100%,75%,.35)'; ctx2.lineWidth=.8;
      ctx2.beginPath(); ctx2.ellipse(0,0,s*.1,s*.04,0,0,Math.PI*2); ctx2.stroke();
      ctx2.rotate(Math.PI/2);
      ctx2.beginPath(); ctx2.ellipse(0,0,s*.1,s*.04,0,0,Math.PI*2); ctx2.stroke();
      ctx2.restore();
      // dome reflection
      ctx2.fillStyle='rgba(255,255,255,.25)';
      ctx2.beginPath(); ctx2.ellipse(s*.38,s*.34,s*.1,s*.06,-Math.PI/5,0,Math.PI*2); ctx2.fill();
      // LED lights
      for(let i=0;i<5;i++){
        const lOn=Math.sin(t*.12+i*.8)>.2;
        ctx2.fillStyle=lOn?'hsla('+((coreHue+i*30)%360)+',100%,70%,.9)':'rgba(30,60,80,.4)';
        ctx2.beginPath(); ctx2.arc(s*(.28+i*.11),s*.74,s*.025,0,Math.PI*2); ctx2.fill();
      }
      ctx2.restore(); break;
    }

    default: {
      ctx2.fillStyle='#00e0c6'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
    }

    // ── PRESTIGE ──
    case 'sun': {
      // background — dark space
      ctx2.fillStyle='#0a0510'; ctx2.beginPath(); ctx2.arc(s/2,s/2,s/2,0,Math.PI*2); ctx2.fill();
      // corona — outer glow
      const gc=ctx2.createRadialGradient(s/2,s/2,s*.25,s/2,s/2,s*.5);
      gc.addColorStop(0,'rgba(255,200,0,.0)');
      gc.addColorStop(.6,'rgba(255,120,0,.3)');
      gc.addColorStop(1,'rgba(255,60,0,.0)');
      ctx2.fillStyle=gc; ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.5,0,Math.PI*2); ctx2.fill();
      // rays — 12 animated rays
      const numRays=12;
      for(let i=0;i<numRays;i++){
        const angle=i*Math.PI*2/numRays + t*.008;
        const pulse=0.7+Math.sin(t*.06+i)*0.3;
        const r1=s*.3, r2=s*(.42+Math.sin(t*.04+i*1.3)*.05);
        const w=s*.025+Math.sin(t*.05+i)*.01;
        ctx2.save();
        ctx2.translate(s/2,s/2); ctx2.rotate(angle);
        const gr=ctx2.createLinearGradient(0,r1,0,r2);
        gr.addColorStop(0,`rgba(255,220,80,${pulse*.9})`);
        gr.addColorStop(1,'rgba(255,100,0,0)');
        ctx2.fillStyle=gr;
        ctx2.beginPath();
        ctx2.moveTo(-w,r1); ctx2.lineTo(w,r1);
        ctx2.lineTo(w*.3,r2); ctx2.lineTo(-w*.3,r2);
        ctx2.closePath(); ctx2.fill();
        ctx2.restore();
      }
      // sun core
      const gs=ctx2.createRadialGradient(s/2,s/2,0,s/2,s/2,s*.28);
      gs.addColorStop(0,'#ffffff');
      gs.addColorStop(.2,'#ffffa0');
      gs.addColorStop(.5,'#ffcc00');
      gs.addColorStop(.8,'#ff6600');
      gs.addColorStop(1,'#cc2200');
      ctx2.fillStyle=gs;
      ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.28,0,Math.PI*2); ctx2.fill();
      // surface sunspots
      ctx2.fillStyle='rgba(180,60,0,.35)';
      for(let i=0;i<3;i++){
        const sx=s/2+Math.cos(t*.02+i*2.1)*s*.1;
        const sy=s/2+Math.sin(t*.015+i*2.1)*s*.09;
        ctx2.beginPath(); ctx2.ellipse(sx,sy,s*.04,s*.025,t*.01+i,0,Math.PI*2); ctx2.fill();
      } break;
    }

    case 'blackhole': {
      // background — black space with stars
      ctx2.fillStyle='#000008';
      ctx2.beginPath(); ctx2.arc(s/2,s/2,s/2,0,Math.PI*2); ctx2.fill();
      for(let i=0;i<18;i++){
        const sx=(Math.sin(i*137.5)*0.5+0.5)*s;
        const sy=(Math.cos(i*97.3)*0.5+0.5)*s;
        const sr=0.6+Math.sin(t*.1+i)*.3;
        ctx2.fillStyle=`rgba(255,255,255,${.4+Math.sin(t*.08+i)*.3})`;
        ctx2.beginPath(); ctx2.arc(sx,sy,sr,0,Math.PI*2); ctx2.fill();
      }
      // accretion disk — rotating rings
      const rings=[
        {r1:s*.42,r2:s*.48,col1:'rgba(255,120,0,.7)',col2:'rgba(255,60,0,0)'},
        {r1:s*.33,r2:s*.41,col1:'rgba(200,100,255,.5)',col2:'rgba(100,0,200,0)'},
        {r1:s*.25,r2:s*.33,col1:'rgba(100,150,255,.4)',col2:'rgba(0,50,200,0)'},
      ];
      for(const ring of rings){
        ctx2.save();
        ctx2.translate(s/2,s/2); ctx2.rotate(t*.015);
        const gr=ctx2.createRadialGradient(0,0,ring.r1,0,0,ring.r2);
        gr.addColorStop(0,ring.col2); gr.addColorStop(.5,ring.col1); gr.addColorStop(1,ring.col2);
        ctx2.fillStyle=gr;
        ctx2.beginPath(); ctx2.arc(0,0,ring.r2,0,Math.PI*2);
        ctx2.arc(0,0,ring.r1,0,Math.PI*2,true);
        ctx2.fill(); ctx2.restore();
      }
      // center — black hole
      const gb=ctx2.createRadialGradient(s/2,s/2,0,s/2,s/2,s*.24);
      gb.addColorStop(0,'#000000');
      gb.addColorStop(.7,'#000000');
      gb.addColorStop(.85,'rgba(80,0,120,.5)');
      gb.addColorStop(1,'rgba(0,0,0,0)');
      ctx2.fillStyle=gb;
      ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.24,0,Math.PI*2); ctx2.fill();
      // photosphere — white flash
      ctx2.fillStyle='rgba(255,255,255,.9)';
      ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.04,0,Math.PI*2); ctx2.fill(); break;
    }

    case 'galaxy': {
      // background — deep space
      ctx2.fillStyle='#020008';
      ctx2.beginPath(); ctx2.arc(s/2,s/2,s/2,0,Math.PI*2); ctx2.fill();
      // background nebula
      for(let i=0;i<3;i++){
        const nx=s/2+Math.cos(i*2.1)*s*.15, ny=s/2+Math.sin(i*2.1)*s*.12;
        const gn=ctx2.createRadialGradient(nx,ny,0,nx,ny,s*.22);
        const cols=['rgba(60,0,120,.25)','rgba(0,40,120,.2)','rgba(80,0,60,.2)'];
        gn.addColorStop(0,cols[i]); gn.addColorStop(1,'rgba(0,0,0,0)');
        ctx2.fillStyle=gn; ctx2.beginPath(); ctx2.arc(nx,ny,s*.22,0,Math.PI*2); ctx2.fill();
      }
      // spiral arms — hundreds of stars
      const armCount=2, starsPerArm=60;
      const spinAngle=t*.006;
      for(let arm=0;arm<armCount;arm++){
        const armOffset=arm*Math.PI;
        for(let i=0;i<starsPerArm;i++){
          const frac=i/starsPerArm;
          const angle=armOffset + frac*Math.PI*3 + spinAngle;
          const spread=s*.04+frac*s*.18;
          const dist2=frac*s*.44;
          const jx=(Math.sin(i*73.1)*0.5)*spread;
          const jy=(Math.cos(i*97.3)*0.5)*spread;
          const sx=s/2 + Math.cos(angle)*dist2 + jx;
          const sy=s/2 + Math.sin(angle)*dist2 + jy;
          // skip stars outside circle
          if((sx-s/2)**2+(sy-s/2)**2>(s*.47)**2) continue;
          const brightness=.3+frac*.7;
          const size=.4+Math.abs(Math.sin(i*31.7+arm*17.3))*.8;
          // color based on position in arm
          const hue=220+frac*80; // blue→purple→white
          ctx2.fillStyle=`hsla(${hue},80%,${60+frac*40}%,${brightness})`;
          ctx2.beginPath(); ctx2.arc(sx,sy,size,0,Math.PI*2); ctx2.fill();
        }
      }
      // extra random background stars
      for(let i=0;i<30;i++){
        const ax=(Math.sin(i*43.7)*.5+.5)*s;
        const ay=(Math.cos(i*67.1)*.5+.5)*s;
        if((ax-s/2)**2+(ay-s/2)**2>(s*.47)**2) continue;
        ctx2.fillStyle=`rgba(255,255,255,${.1+Math.sin(t*.05+i)*.08})`;
        ctx2.beginPath(); ctx2.arc(ax,ay,.5,0,Math.PI*2); ctx2.fill();
      }
      // galaxy center — bright core
      const gg=ctx2.createRadialGradient(s/2,s/2,0,s/2,s/2,s*.12);
      gg.addColorStop(0,'rgba(255,240,200,1)');
      gg.addColorStop(.4,'rgba(200,160,255,.8)');
      gg.addColorStop(.8,'rgba(100,80,200,.3)');
      gg.addColorStop(1,'rgba(0,0,0,0)');
      ctx2.fillStyle=gg; ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.12,0,Math.PI*2); ctx2.fill(); break;
    }

    // ── VOID [2.0-s5a] ──

    case 'singularityheart': { // [2.0-s5a] [SECRET] black core + 3 accretion disks + star field
      ctx2.fillStyle='#04000a'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      for(let i=0;i<22;i++){ // deterministic star field
        const sx=(Math.sin(i*137.5)*0.5+0.5)*s, sy=(Math.cos(i*89.7)*0.5+0.5)*s;
        const sa=.25+.55*Math.abs(Math.sin(t*.05+i));
        ctx2.fillStyle=`rgba(220,200,255,${sa})`;
        ctx2.beginPath(); ctx2.arc(sx,sy,.7,0,Math.PI*2); ctx2.fill();
      }
      const disks=[ // gold / violet / blue-white, alpha falls outward
        { rot:t*.02,   hue:45,  sat:100, lum:60, a:.85, r1:s*.30, r2:s*.46 },
        { rot:-t*.015, hue:280, sat:100, lum:55, a:.6,  r1:s*.20, r2:s*.32 },
        { rot:t*.03,   hue:220, sat:80,  lum:75, a:.4,  r1:s*.12, r2:s*.20 },
      ];
      for(const d of disks){
        ctx2.save(); ctx2.translate(s/2,s/2); ctx2.rotate(d.rot);
        const gr=ctx2.createRadialGradient(0,0,d.r1,0,0,d.r2);
        gr.addColorStop(0,`hsla(${d.hue},${d.sat}%,${d.lum}%,0)`);
        gr.addColorStop(.5,`hsla(${d.hue},${d.sat}%,${d.lum}%,${d.a})`);
        gr.addColorStop(1,`hsla(${d.hue},${d.sat}%,${d.lum}%,0)`);
        ctx2.fillStyle=gr;
        ctx2.beginPath(); ctx2.ellipse(0,0,d.r2,d.r2*.42,0,0,Math.PI*2);
        ctx2.ellipse(0,0,d.r1,d.r1*.42,0,0,Math.PI*2,true);
        ctx2.fill(); ctx2.restore();
      }
      ctx2.save(); // black core + pulsing glow
      ctx2.shadowColor='rgba(150,80,255,.9)'; ctx2.shadowBlur=8+4*Math.sin(t*.06);
      ctx2.fillStyle='#000'; ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.14,0,Math.PI*2); ctx2.fill();
      ctx2.restore();
      for(let i=0;i<6;i++){ // inward-spiraling sparks
        const a=t*.04+i*(Math.PI*2/6), dd=s*.30*(0.5+0.5*Math.sin(t*.03+i));
        const px=s/2+Math.cos(a)*dd, py=s/2+Math.sin(a)*dd;
        ctx2.fillStyle=`hsla(${(t*2+i*60)%360},100%,80%,.9)`;
        ctx2.beginPath(); ctx2.arc(px,py,1.1,0,Math.PI*2); ctx2.fill();
      }
      ctx2.fillStyle='rgba(255,255,255,.95)'; // photon sphere
      ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.02,0,Math.PI*2); ctx2.fill();
      ctx2.restore(); break;
    }

    case 'supernova': { // [2.0-s5a] [LEGENDARY] blazing core + shockwave rings + plasma sparks
      ctx2.fillStyle='#0a0200'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const maxR=s*.5;
      for(let i=0;i<3;i++){ // shockwave rings
        const rr=((t*.5+i*maxR/3)%maxR), a=Math.max(0,1-rr/maxR);
        ctx2.strokeStyle=`rgba(255,${150+Math.floor(80*a)},40,${a*.8})`;
        ctx2.lineWidth=Math.max(.5,3*(1-rr/maxR));
        ctx2.beginPath(); ctx2.arc(s/2,s/2,rr,0,Math.PI*2); ctx2.stroke();
      }
      ctx2.save(); // core
      ctx2.shadowColor='#ffcc00'; ctx2.shadowBlur=14;
      const gc=ctx2.createRadialGradient(s/2,s/2,0,s/2,s/2,s*.22);
      gc.addColorStop(0,'#ffffff'); gc.addColorStop(.4,'#fff0a0');
      gc.addColorStop(.75,'#ffaa00'); gc.addColorStop(1,'#ff4400');
      ctx2.fillStyle=gc; ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.22,0,Math.PI*2); ctx2.fill();
      ctx2.restore();
      for(let i=0;i<10;i++){ // radial plasma sparks
        const a=i*(Math.PI*2/10)+t*.01, dd=s*(.26+.16*Math.abs(Math.sin(t*.05+i)));
        const px=s/2+Math.cos(a)*dd, py=s/2+Math.sin(a)*dd;
        ctx2.fillStyle=`hsla(${30+((t+i*20)%30)},100%,65%,.9)`;
        ctx2.beginPath(); ctx2.arc(px,py,1.3,0,Math.PI*2); ctx2.fill();
      }
      ctx2.restore(); break;
    }

    case 'pulsarskin': { // [2.0-s5a] [EPIC] rotating lighthouse beams + fast cyan core pulse
      ctx2.fillStyle='#00060a'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      ctx2.save(); ctx2.translate(s/2,s/2); ctx2.rotate(t*.08);
      for(let k=0;k<2;k++){ // two opposing beams
        ctx2.rotate(Math.PI);
        const bg=ctx2.createLinearGradient(0,0,s*.7,0);
        bg.addColorStop(0,'hsla(190,100%,70%,.55)');
        bg.addColorStop(1,'hsla(190,100%,70%,0)');
        ctx2.fillStyle=bg;
        ctx2.beginPath(); ctx2.moveTo(0,0);
        ctx2.lineTo(s*.7,-s*.12); ctx2.lineTo(s*.7,s*.12); ctx2.closePath(); ctx2.fill();
      }
      ctx2.restore();
      const cp=0.5+0.5*Math.sin(t*.025); // fast-pulsing core
      ctx2.save();
      ctx2.shadowColor='hsla(190,100%,70%,1)'; ctx2.shadowBlur=8+8*cp;
      const gc=ctx2.createRadialGradient(s/2,s/2,0,s/2,s/2,s*.18);
      gc.addColorStop(0,`rgba(255,255,255,${.85+.15*cp})`);
      gc.addColorStop(.5,'hsla(190,100%,75%,.9)');
      gc.addColorStop(1,'hsla(200,100%,45%,0)');
      ctx2.fillStyle=gc; ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.18,0,Math.PI*2); ctx2.fill();
      ctx2.restore();
      ctx2.restore(); break;
    }

    case 'cosmicdust': { // [2.0-s5a] [EPIC] drifting nebula gradients + twinkling stars
      ctx2.fillStyle='#06040f'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const clouds=[
        { hue:280, x:.35, y:.4 }, { hue:320, x:.6, y:.55 }, { hue:210, x:.5, y:.3 },
        { hue:260, x:.45, y:.65 }, { hue:300, x:.7, y:.35 },
      ];
      for(let i=0;i<clouds.length;i++){
        const c=clouds[i];
        const px=s*c.x+Math.sin(t*.01+i)*s*.05, py=s*c.y+Math.cos(t*.01+i*1.3)*s*.05;
        const g=ctx2.createRadialGradient(px,py,0,px,py,s*.3);
        g.addColorStop(0,`hsla(${c.hue},90%,65%,.25)`);
        g.addColorStop(1,`hsla(${c.hue},90%,65%,0)`);
        ctx2.fillStyle=g; ctx2.beginPath(); ctx2.arc(px,py,s*.3,0,Math.PI*2); ctx2.fill();
      }
      for(let i=0;i<15;i++){ // twinkling stars on top
        const sx=(Math.sin(i*51.3)*.5+.5)*s, sy=(Math.cos(i*88.1)*.5+.5)*s;
        ctx2.fillStyle=`rgba(255,255,255,${.3+.6*Math.abs(Math.sin(t*.06+i))})`;
        ctx2.beginPath(); ctx2.arc(sx,sy,.8,0,Math.PI*2); ctx2.fill();
      }
      ctx2.restore(); break;
    }

    case 'comet': { // [2.0-s5a] [RARE] white-blue nucleus + fading wobbling tail
      ctx2.fillStyle='#02040a'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const hx=s*.62, hy=s*.4+Math.sin(t*.05)*s*.06; // nucleus
      for(let k=5;k>=1;k--){ // tail toward lower-left
        const tx=hx-k*s*.13, ty=hy+k*s*.10+Math.sin(t*.08+k)*s*.02;
        ctx2.globalAlpha=.18*(1-k/6);
        ctx2.fillStyle='#88ccff';
        ctx2.beginPath(); ctx2.arc(tx,ty,s*.13*(1-k/7),0,Math.PI*2); ctx2.fill();
      }
      ctx2.globalAlpha=1;
      ctx2.save();
      ctx2.shadowColor='#aaddff'; ctx2.shadowBlur=10;
      const g=ctx2.createRadialGradient(hx,hy,0,hx,hy,s*.15);
      g.addColorStop(0,'#ffffff'); g.addColorStop(.5,'#bbe2ff'); g.addColorStop(1,'rgba(120,180,255,0)');
      ctx2.fillStyle=g; ctx2.beginPath(); ctx2.arc(hx,hy,s*.15,0,Math.PI*2); ctx2.fill();
      ctx2.restore();
      ctx2.restore(); break;
    }

    case 'aurora': { // [2.0-s5a] [RARE] 3 waving green→violet ribbons (additive)
      ctx2.fillStyle='#01060a'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      ctx2.globalCompositeOperation='lighter';
      for(let band=0;band<3;band++){
        const phase=band*1.7, baseX=s*(.3+band*.2);
        ctx2.beginPath();
        for(let yy=0;yy<=s;yy+=3){
          const xx=baseX+Math.sin(yy*.06+t*.04+phase)*s*.12;
          yy===0?ctx2.moveTo(xx,yy):ctx2.lineTo(xx,yy);
        }
        for(let yy=s;yy>=0;yy-=3){
          ctx2.lineTo(baseX+Math.sin(yy*.06+t*.04+phase)*s*.12+s*.1,yy);
        }
        ctx2.closePath();
        const g=ctx2.createLinearGradient(0,0,0,s);
        g.addColorStop(0,'rgba(0,255,136,0)');
        g.addColorStop(.5,'rgba(0,255,136,.5)');
        g.addColorStop(1,'rgba(170,0,255,.4)');
        ctx2.fillStyle=g; ctx2.fill();
      }
      ctx2.globalCompositeOperation='source-over';
      ctx2.restore(); break;
    }

    case 'meteor': { // [2.0-s5a] [RARE] irregular rock + burning leading edge + sparks
      ctx2.fillStyle='#080204'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const mcx=s*.5, mcy=s*.52, mr=s*.34, jag=[1,0.72,0.95,0.66,1,0.7,0.92,0.62];
      ctx2.save(); // rock body
      ctx2.shadowColor='#ff5500'; ctx2.shadowBlur=12;
      ctx2.fillStyle='#4a3b33';
      ctx2.beginPath();
      for(let i=0;i<8;i++){ const ang=(i/8)*Math.PI*2, rr=mr*jag[i];
        const px=mcx+Math.cos(ang)*rr, py=mcy+Math.sin(ang)*rr;
        i===0?ctx2.moveTo(px,py):ctx2.lineTo(px,py); }
      ctx2.closePath(); ctx2.fill();
      ctx2.restore();
      ctx2.save(); // burning leading edge (upper arc)
      ctx2.strokeStyle='rgba(255,140,0,.9)'; ctx2.lineWidth=2;
      ctx2.shadowColor='#ff6600'; ctx2.shadowBlur=8;
      ctx2.beginPath();
      for(let i=0;i<5;i++){ const ang=(-Math.PI*.5)+(i/4)*Math.PI*.9, rr=mr*jag[i];
        const px=mcx+Math.cos(ang)*rr, py=mcy+Math.sin(ang)*rr;
        i===0?ctx2.moveTo(px,py):ctx2.lineTo(px,py); }
      ctx2.stroke();
      ctx2.restore();
      for(let i=0;i<6;i++){ // sparks streaming off
        const a=-Math.PI*.3-i*.2, dd=mr*(1.05+.25*Math.abs(Math.sin(t*.06+i)));
        const px=mcx+Math.cos(a)*dd, py=mcy+Math.sin(a)*dd;
        ctx2.fillStyle=`rgba(255,${120+i*15},0,.85)`;
        ctx2.beginPath(); ctx2.arc(px,py,1,0,Math.PI*2); ctx2.fill();
      }
      ctx2.restore(); break;
    }

    case 'stardust': { // [2.0-s5a] [COMMON] ~12 twinkling dots of varied size
      ctx2.fillStyle='#03030c'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      for(let i=0;i<12;i++){
        const sx=(Math.sin(i*49.7)*.5+.5)*s, sy=(Math.cos(i*73.3)*.5+.5)*s;
        const a=.3+.7*Math.abs(Math.sin(t*.05+i*1.3)), rr=.6+(i%3)*.5;
        ctx2.fillStyle=`rgba(220,235,255,${a})`;
        ctx2.beginPath(); ctx2.arc(sx,sy,rr*(0.6+0.4*a),0,Math.PI*2); ctx2.fill();
      }
      ctx2.restore(); break;
    }

    case 'orbit': { // [2.0-s5a] [COMMON] central core + ring with a satellite
      ctx2.fillStyle='#04030e'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      const g=ctx2.createRadialGradient(s/2,s/2,0,s/2,s/2,s*.16);
      g.addColorStop(0,'#cfe6ff'); g.addColorStop(.6,'#5588cc'); g.addColorStop(1,'rgba(40,70,140,0)');
      ctx2.fillStyle=g; ctx2.beginPath(); ctx2.arc(s/2,s/2,s*.16,0,Math.PI*2); ctx2.fill();
      ctx2.save(); ctx2.translate(s/2,s/2); ctx2.rotate(t*.04);
      ctx2.strokeStyle='rgba(136,187,255,.5)'; ctx2.lineWidth=1;
      ctx2.beginPath(); ctx2.ellipse(0,0,s*.34,s*.14,0,0,Math.PI*2); ctx2.stroke();
      ctx2.fillStyle='#aaccff'; ctx2.shadowColor='#88bbff'; ctx2.shadowBlur=6;
      ctx2.beginPath(); ctx2.arc(s*.34,0,s*.04,0,Math.PI*2); ctx2.fill();
      ctx2.restore();
      ctx2.restore(); break;
    }

    case 'lunar': { // [2.0-s5a] [COMMON] silver sphere + craters, lazy rotation
      ctx2.fillStyle='#050507'; _rect(ctx2,0,0,s,s,4); ctx2.fill();
      ctx2.save(); _rect(ctx2,0,0,s,s,4); ctx2.clip();
      ctx2.save(); ctx2.translate(s/2,s/2); ctx2.rotate(t*.01);
      const g=ctx2.createRadialGradient(-s*.1,-s*.1,s*.05,0,0,s*.4);
      g.addColorStop(0,'#dddddd'); g.addColorStop(.6,'#888888'); g.addColorStop(1,'#444444');
      ctx2.fillStyle=g; ctx2.beginPath(); ctx2.arc(0,0,s*.4,0,Math.PI*2); ctx2.fill();
      const craters=[[-.12,-.05,.07,.05],[.1,.08,.05,.04],[.02,-.18,.04,.03],[.16,-.1,.03,.025]];
      ctx2.fillStyle='rgba(60,60,68,.6)';
      for(const c of craters){ ctx2.beginPath(); ctx2.ellipse(c[0]*s,c[1]*s,c[2]*s,c[3]*s,0,0,Math.PI*2); ctx2.fill(); }
      ctx2.restore();
      ctx2.restore(); break;
    }
  }
  ctx2.restore();
}

// Drawing helpers
function _rect(ctx2,x,y,w,h,r){
  ctx2.beginPath();
  ctx2.roundRect(x,y,w,h,r);
}
function _star(ctx2,cx,cy,outerR,innerR,points){
  ctx2.beginPath();
  for(let i=0;i<points*2;i++){
    const angle=i*Math.PI/points - Math.PI/2;
    const r=i%2===0?outerR:innerR;
    i===0?ctx2.moveTo(cx+r*Math.cos(angle),cy+r*Math.sin(angle))
         :ctx2.lineTo(cx+r*Math.cos(angle),cy+r*Math.sin(angle));
  }
  ctx2.closePath();
}
function _flame(ctx2,x,baseY,w,h){
  ctx2.beginPath();
  ctx2.moveTo(x,baseY);
  ctx2.quadraticCurveTo(x-w,baseY-h*.5,x,baseY-h);
  ctx2.quadraticCurveTo(x+w,baseY-h*.5,x+w*2,baseY);
  ctx2.closePath();
}
function _snowflake(ctx2,cx,cy,r){
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3;
    ctx2.beginPath();
    ctx2.moveTo(cx,cy);
    ctx2.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));
    ctx2.stroke();
    // small branches
    for(let j=1;j<=2;j++){
      const bx=cx+(r*j/3)*Math.cos(a), by=cy+(r*j/3)*Math.sin(a);
      const ba=a+Math.PI/3;
      ctx2.beginPath();
      ctx2.moveTo(bx,by);
      ctx2.lineTo(bx+r*.2*Math.cos(ba),by+r*.2*Math.sin(ba));
      ctx2.stroke();
      ctx2.beginPath();
      ctx2.moveTo(bx,by);
      ctx2.lineTo(bx+r*.2*Math.cos(a-Math.PI/3),by+r*.2*Math.sin(a-Math.PI/3));
      ctx2.stroke();
    }
  }
}

const SKINS = [
  // PATTERNS [1.9]
  { id:'default',   name:'Core',      cat:'Patterns', price:0    },
  { id:'stripes',   name:'Hex',       cat:'Patterns', price:150  },
  { id:'grid',      name:'Circuit',   cat:'Patterns', price:200  },
  { id:'gradient',  name:'Prism',     cat:'Patterns', price:300  },
  { id:'rainbow',   name:'Vortex',    cat:'Patterns', price:500  },
  // EFFECTS [1.9]
  { id:'glitch',    name:'Glitch',    cat:'Effects',  price:400  },
  { id:'aura',      name:'Aura',      cat:'Effects',  price:450  },
  { id:'magma',     name:'Magma',     cat:'Effects',  price:500  },
  { id:'void',      name:'Void',      cat:'Effects',  price:600  },
  { id:'neontrail', name:'Neon Trail',cat:'Effects',  price:650  },
  // SHAPES [1.9]
  { id:'spike',     name:'Spike',     cat:'Shapes',   price:300  },
  { id:'robot',     name:'Robot',     cat:'Shapes',   price:400  },
  { id:'wave',      name:'Wave',      cat:'Shapes',   price:450  },
  { id:'ball',      name:'Ball',      cat:'Shapes',   price:500  },
  { id:'ufo',       name:'Alien Orb', cat:'Shapes',   price:1000 },
  // PRESTIGE [1.9]
  { id:'sun',       name:'Sun',       cat:'Prestige', price:0, unlock:100, unlockDesc:'Survive 100 rounds' },
  { id:'blackhole', name:'Black Hole',cat:'Prestige', price:0, unlock:250, unlockDesc:'Survive 250 rounds'},
  { id:'galaxy',    name:'Milky Way', cat:'Prestige', price:0, unlock:500, unlockDesc:'Survive 500 rounds'},
];

// ══════════════════════════════════════════════════
// DOM
// ══════════════════════════════════════════════════
const screenStart  = document.getElementById('screen-start');
const appEl        = document.getElementById('app');
const boardEl      = document.getElementById('board');
const canvas       = document.getElementById('anim-canvas');
const ctx          = canvas.getContext('2d');
const hudCoins     = document.getElementById('hud-coins');
const hudInfo      = document.getElementById('hud-info');
const hudDash      = document.getElementById('hud-dash');
const hudCombo     = document.getElementById('hud-combo'); // [1.9.2]
const hudTimerEl   = document.getElementById('hud-timer');   // [1.10]
const hudGridlock  = document.getElementById('hud-gridlock'); // [1.12]
const hudBlackhole = document.getElementById('hud-blackhole'); // [2.0-s2]

// ══════════════════════════════════════════════════
// SOUND (Web Audio API — synthetic)
// ══════════════════════════════════════════════════
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  return audioCtx;
}

// [1.9.2] Dispatcher — all existing call sites unchanged
function playSound(type) {
  if      (type==='dash')         playDash();
  else if (type==='laser_charge') playRoundStart();
  else if (type==='laser_fire')   playLaserFire();
  else if (type==='coin')         playCoin();
  else if (type==='die')          playDeath();
  else if (type==='near_miss')    playNearMiss();
  else if (type==='click')        playUISound('click');
}

function playDash() { // [1.9.2]
  try {
    const ac=getAudio(), now=ac.currentTime;
    const o=ac.createOscillator(), g=ac.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(150,now); o.frequency.exponentialRampToValueAtTime(1000,now+0.1);
    g.gain.setValueAtTime(0.14,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.13);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(now+0.13);
    const buf=ac.createBuffer(1,Math.floor(ac.sampleRate*0.09),ac.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length);
    const src=ac.createBufferSource(), f=ac.createBiquadFilter(), g2=ac.createGain();
    f.type='highpass'; f.frequency.value=2200; src.buffer=buf; g2.gain.value=0.1;
    src.connect(f); f.connect(g2); g2.connect(ac.destination); src.start(); src.stop(now+0.09);
  } catch(e){}
}

function playRoundStart() { // [1.9.2]
  try {
    const ac=getAudio(), now=ac.currentTime;
    const o=ac.createOscillator(), f=ac.createBiquadFilter(), g=ac.createGain();
    f.type='bandpass'; f.frequency.value=600; f.Q.value=3; o.type='sawtooth';
    o.frequency.setValueAtTime(40,now); o.frequency.exponentialRampToValueAtTime(220,now+0.48);
    g.gain.setValueAtTime(0.03,now); g.gain.linearRampToValueAtTime(0.12,now+0.42);
    g.gain.exponentialRampToValueAtTime(0.001,now+0.55);
    o.connect(f); f.connect(g); g.connect(ac.destination); o.start(); o.stop(now+0.55);
    const buf=ac.createBuffer(1,Math.floor(ac.sampleRate*0.42),ac.sampleRate);
    const dd=buf.getChannelData(0);
    for(let i=0;i<dd.length;i++) dd[i]=(Math.random()*2-1)*0.04*(i/dd.length);
    const src=ac.createBufferSource(), f2=ac.createBiquadFilter(), g2=ac.createGain();
    f2.type='highpass'; f2.frequency.value=3500; g2.gain.value=0.9; src.buffer=buf;
    src.connect(f2); f2.connect(g2); g2.connect(ac.destination); src.start(); src.stop(now+0.42);
  } catch(e){}
}

function playLaserFire() { // [1.9.2]
  try {
    const ac=getAudio(), now=ac.currentTime;
    const buf=ac.createBuffer(1,Math.floor(ac.sampleRate*0.14),ac.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.5);
    const src=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain();
    f.type='bandpass'; f.frequency.value=1800; f.Q.value=0.8; src.buffer=buf;
    g.gain.setValueAtTime(0.6,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.14);
    src.connect(f); f.connect(g); g.connect(ac.destination); src.start(); src.stop(now+0.14);
    const o=ac.createOscillator(), g2=ac.createGain();
    o.type='sine'; o.frequency.setValueAtTime(3000,now); o.frequency.exponentialRampToValueAtTime(400,now+0.08);
    g2.gain.setValueAtTime(0.18,now); g2.gain.exponentialRampToValueAtTime(0.001,now+0.1);
    o.connect(g2); g2.connect(ac.destination); o.start(); o.stop(now+0.1);
  } catch(e){}
}

function playCoin() { // [1.9.2]
  try {
    const ac=getAudio(), now=ac.currentTime;
    [[880,0.22,0],[1760,0.09,0.01],[2640,0.04,0.018]].forEach(([freq,vol,delay])=>{
      const o=ac.createOscillator(), g=ac.createGain();
      o.type='sine'; o.frequency.value=freq;
      g.gain.setValueAtTime(vol,now+delay); g.gain.exponentialRampToValueAtTime(0.001,now+delay+0.38);
      o.connect(g); g.connect(ac.destination); o.start(now+delay); o.stop(now+delay+0.38);
    });
  } catch(e){}
}

function playDeath() { // [1.9.2]
  try {
    const ac=getAudio(), now=ac.currentTime;
    const o1=ac.createOscillator(), g1=ac.createGain();
    o1.type='sine'; o1.frequency.setValueAtTime(90,now); o1.frequency.exponentialRampToValueAtTime(18,now+0.35);
    g1.gain.setValueAtTime(0.7,now); g1.gain.exponentialRampToValueAtTime(0.001,now+0.4);
    o1.connect(g1); g1.connect(ac.destination); o1.start(); o1.stop(now+0.4);
    const buf=ac.createBuffer(1,Math.floor(ac.sampleRate*0.65),ac.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
    const src=ac.createBufferSource(), f=ac.createBiquadFilter(), g2=ac.createGain();
    f.type='lowpass'; f.frequency.value=700; src.buffer=buf;
    g2.gain.setValueAtTime(0.55,now); g2.gain.exponentialRampToValueAtTime(0.001,now+0.65);
    src.connect(f); f.connect(g2); g2.connect(ac.destination); src.start(); src.stop(now+0.65);
    const o2=ac.createOscillator(), g3=ac.createGain();
    o2.type='sawtooth'; o2.frequency.setValueAtTime(1400,now); o2.frequency.exponentialRampToValueAtTime(80,now+0.45);
    g3.gain.setValueAtTime(0.22,now); g3.gain.exponentialRampToValueAtTime(0.001,now+0.48);
    o2.connect(g3); g3.connect(ac.destination); o2.start(); o2.stop(now+0.48);
  } catch(e){}
}

function playNearMiss() { // [1.9.2]
  try {
    const ac=getAudio(), now=ac.currentTime;
    [0,0.055].forEach(delay=>{
      const o=ac.createOscillator(), g=ac.createGain();
      o.type='square'; o.frequency.value=480+delay*200;
      g.gain.setValueAtTime(0.07,now+delay); g.gain.exponentialRampToValueAtTime(0.001,now+delay+0.05);
      o.connect(g); g.connect(ac.destination); o.start(now+delay); o.stop(now+delay+0.05);
    });
  } catch(e){}
}

function playCombo(level) { // [1.9.2] level: 1=x5, 2=x10, 3=x20+
  try {
    const ac=getAudio(), now=ac.currentTime;
    const seqs=[[440,550,660],[440,554,659,880,1109],[440,554,659,880,1109,1318]];
    const vols=[0.17,0.21,0.26];
    const seq=seqs[Math.min(level-1,2)], vol=vols[Math.min(level-1,2)];
    seq.forEach((freq,i)=>{
      const o=ac.createOscillator(), g=ac.createGain();
      o.type='sine'; o.frequency.value=freq; const t=now+i*0.07;
      g.gain.setValueAtTime(vol*(1-i*0.04),t); g.gain.exponentialRampToValueAtTime(0.001,t+0.32);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+0.32);
    });
    if(level>=3){
      const o=ac.createOscillator(), g=ac.createGain();
      o.type='triangle'; o.frequency.setValueAtTime(280,now); o.frequency.exponentialRampToValueAtTime(2200,now+0.55);
      g.gain.setValueAtTime(0.09,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.6);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(now+0.6);
    }
  } catch(e){}
}

function playRecord() { // [1.9.2]
  try {
    const ac=getAudio(), now=ac.currentTime;
    [523,659,784,1047].forEach((freq,i)=>{
      const o=ac.createOscillator(), g=ac.createGain();
      o.type='triangle'; o.frequency.value=freq;
      const t=now+i*0.13, dur=i===3?0.55:0.13;
      g.gain.setValueAtTime(0.2,t); g.gain.setValueAtTime(0.2,t+dur*0.6);
      g.gain.exponentialRampToValueAtTime(0.001,t+dur);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+dur);
    });
  } catch(e){}
}

function playGridlockStart() { // [1.12] epic synth chord + rising sweep
  try {
    const ac=getAudio(), now=ac.currentTime;
    [[220,.18],[330,.14],[440,.11]].forEach(([freq,vol],i)=>{
      const o=ac.createOscillator(),g=ac.createGain();
      o.type='sawtooth'; o.frequency.value=freq;
      g.gain.setValueAtTime(0,now+i*.025); g.gain.linearRampToValueAtTime(vol,now+i*.025+.07);
      g.gain.exponentialRampToValueAtTime(.001,now+.82);
      o.connect(g); g.connect(ac.destination); o.start(now+i*.025); o.stop(now+.82);
    });
    const os=ac.createOscillator(),gs=ac.createGain();
    os.type='sine'; os.frequency.setValueAtTime(90,now); os.frequency.exponentialRampToValueAtTime(2600,now+.72);
    gs.gain.setValueAtTime(.13,now); gs.gain.exponentialRampToValueAtTime(.001,now+.78);
    os.connect(gs); gs.connect(ac.destination); os.start(now); os.stop(now+.78);
  } catch(e){}
}

function playGridlockEnd() { // [1.12] descending sweep
  try {
    const ac=getAudio(), now=ac.currentTime;
    const o=ac.createOscillator(),g=ac.createGain();
    o.type='sine'; o.frequency.setValueAtTime(1400,now); o.frequency.exponentialRampToValueAtTime(80,now+.5);
    g.gain.setValueAtTime(.16,now); g.gain.exponentialRampToValueAtTime(.001,now+.52);
    o.connect(g); g.connect(ac.destination); o.start(now); o.stop(now+.52);
  } catch(e){}
}

function playBlackHole() { // [2.0-s2] deep whoosh + low rumble, ~0.5s
  try {
    const ac=getAudio(), now=ac.currentTime;
    // deep whoosh
    const o1=ac.createOscillator(), g1=ac.createGain();
    o1.type='sine'; o1.frequency.setValueAtTime(80,now); o1.frequency.exponentialRampToValueAtTime(20,now+0.5);
    g1.gain.setValueAtTime(0.0001,now); g1.gain.exponentialRampToValueAtTime(0.18,now+0.12);
    g1.gain.exponentialRampToValueAtTime(0.001,now+0.5);
    o1.connect(g1); g1.connect(ac.destination); o1.start(now); o1.stop(now+0.52);
    // low rumble (slightly detuned)
    const o2=ac.createOscillator(), g2=ac.createGain();
    o2.type='sine'; o2.frequency.setValueAtTime(42,now); o2.detune.setValueAtTime(-8,now);
    g2.gain.setValueAtTime(0.0001,now); g2.gain.exponentialRampToValueAtTime(0.12,now+0.14);
    g2.gain.exponentialRampToValueAtTime(0.001,now+0.5);
    o2.connect(g2); g2.connect(ac.destination); o2.start(now); o2.stop(now+0.52);
  } catch(e){}
}

function playSolarFlareCharge() { // [2.0-s2] cosmic rising charge — building tension
  try {
    const ac=getAudio(), now=ac.currentTime;
    // rising shimmer (triangle sweep up)
    const o=ac.createOscillator(), f=ac.createBiquadFilter(), g=ac.createGain();
    f.type='bandpass'; f.frequency.value=900; f.Q.value=4; o.type='triangle';
    o.frequency.setValueAtTime(180,now); o.frequency.exponentialRampToValueAtTime(1300,now+0.55);
    g.gain.setValueAtTime(0.0001,now); g.gain.exponentialRampToValueAtTime(0.10,now+0.45);
    g.gain.exponentialRampToValueAtTime(0.001,now+0.6);
    o.connect(f); f.connect(g); g.connect(ac.destination); o.start(now); o.stop(now+0.6);
    // warm sub layer following the rise
    const o2=ac.createOscillator(), g2=ac.createGain();
    o2.type='sine'; o2.frequency.setValueAtTime(90,now); o2.frequency.exponentialRampToValueAtTime(330,now+0.55);
    g2.gain.setValueAtTime(0.0001,now); g2.gain.exponentialRampToValueAtTime(0.06,now+0.5);
    g2.gain.exponentialRampToValueAtTime(0.001,now+0.6);
    o2.connect(g2); g2.connect(ac.destination); o2.start(now); o2.stop(now+0.6);
  } catch(e){}
}

function playSolarFlareRelease() { // [2.0-s2] sharp warm burst as the beam fires
  try {
    const ac=getAudio(), now=ac.currentTime;
    // bright noise burst (the flash)
    const buf=ac.createBuffer(1,Math.floor(ac.sampleRate*0.18),ac.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.4);
    const src=ac.createBufferSource(), bf=ac.createBiquadFilter(), bg=ac.createGain();
    bf.type='bandpass'; bf.frequency.value=1400; bf.Q.value=0.7; src.buffer=buf;
    bg.gain.setValueAtTime(0.5,now); bg.gain.exponentialRampToValueAtTime(0.001,now+0.18);
    src.connect(bf); bf.connect(bg); bg.connect(ac.destination); src.start(now); src.stop(now+0.18);
    // warm descending body (the heat)
    const o=ac.createOscillator(), g=ac.createGain();
    o.type='sawtooth'; o.frequency.setValueAtTime(520,now); o.frequency.exponentialRampToValueAtTime(120,now+0.16);
    g.gain.setValueAtTime(0.22,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.2);
    o.connect(g); g.connect(ac.destination); o.start(now); o.stop(now+0.2);
  } catch(e){}
}

function playTurretFire() { // [2.0-s4e] focused energy beam striking the boss (distinct from laser/flare)
  try {
    const ac=getAudio(), now=ac.currentTime;
    // focused descending tonal beam
    const o=ac.createOscillator(), f=ac.createBiquadFilter(), g=ac.createGain();
    f.type='bandpass'; f.frequency.value=1500; f.Q.value=6; o.type='square';
    o.frequency.setValueAtTime(1800,now); o.frequency.exponentialRampToValueAtTime(600,now+0.13);
    g.gain.setValueAtTime(0.0001,now); g.gain.exponentialRampToValueAtTime(0.18,now+0.02);
    g.gain.exponentialRampToValueAtTime(0.001,now+0.16);
    o.connect(f); f.connect(g); g.connect(ac.destination); o.start(now); o.stop(now+0.16);
    // punchy low impact (beam hitting the boss)
    const o2=ac.createOscillator(), g2=ac.createGain();
    o2.type='sine'; o2.frequency.setValueAtTime(160,now+0.06); o2.frequency.exponentialRampToValueAtTime(60,now+0.2);
    g2.gain.setValueAtTime(0.0001,now+0.06); g2.gain.exponentialRampToValueAtTime(0.26,now+0.09);
    g2.gain.exponentialRampToValueAtTime(0.001,now+0.24);
    o2.connect(g2); g2.connect(ac.destination); o2.start(now+0.06); o2.stop(now+0.26);
    // short metallic ping (focused energy)
    const o3=ac.createOscillator(), g3=ac.createGain();
    o3.type='triangle'; o3.frequency.setValueAtTime(2400,now);
    g3.gain.setValueAtTime(0.10,now); g3.gain.exponentialRampToValueAtTime(0.001,now+0.07);
    o3.connect(g3); g3.connect(ac.destination); o3.start(now); o3.stop(now+0.08);
  } catch(e){}
}

function playBossShield() { // [2.0-s4e] barrier-up shimmer — the boss is now protected
  try {
    const ac=getAudio(), now=ac.currentTime;
    const mk=(f0,f1,gain)=>{ // rising detuned sine swell
      const o=ac.createOscillator(), g=ac.createGain();
      o.type='sine'; o.frequency.setValueAtTime(f0,now); o.frequency.exponentialRampToValueAtTime(f1,now+0.4);
      g.gain.setValueAtTime(0.0001,now); g.gain.exponentialRampToValueAtTime(gain,now+0.18);
      g.gain.exponentialRampToValueAtTime(0.001,now+0.55);
      o.connect(g); g.connect(ac.destination); o.start(now); o.stop(now+0.6);
    };
    mk(500,950,0.08); mk(752,1300,0.07);
    // high sparkle on top
    const o=ac.createOscillator(), g=ac.createGain();
    o.type='triangle'; o.frequency.setValueAtTime(1500,now); o.frequency.exponentialRampToValueAtTime(2200,now+0.35);
    g.gain.setValueAtTime(0.0001,now); g.gain.exponentialRampToValueAtTime(0.05,now+0.2);
    g.gain.exponentialRampToValueAtTime(0.001,now+0.5);
    o.connect(g); g.connect(ac.destination); o.start(now); o.stop(now+0.55);
  } catch(e){}
}

function playError() { // [1.9.2]
  try {
    const ac=getAudio(), now=ac.currentTime;
    const o=ac.createOscillator(), g=ac.createGain();
    o.type='sawtooth'; o.frequency.setValueAtTime(230,now); o.frequency.exponentialRampToValueAtTime(70,now+0.18);
    g.gain.setValueAtTime(0.14,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.2);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(now+0.2);
  } catch(e){}
}

function playShopOpen() { // [1.9.2]
  try {
    const ac=getAudio(), now=ac.currentTime;
    const o=ac.createOscillator(), g=ac.createGain();
    o.type='sine'; o.frequency.setValueAtTime(180,now); o.frequency.exponentialRampToValueAtTime(700,now+0.14);
    g.gain.setValueAtTime(0.09,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.18);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(now+0.18);
    const o2=ac.createOscillator(), g2=ac.createGain();
    o2.type='sine'; o2.frequency.value=1800;
    g2.gain.setValueAtTime(0.07,now+0.1); g2.gain.exponentialRampToValueAtTime(0.001,now+0.38);
    o2.connect(g2); g2.connect(ac.destination); o2.start(now+0.1); o2.stop(now+0.38);
  } catch(e){}
}

function playSkinSelect() { // [1.9.2]
  try {
    const ac=getAudio(), now=ac.currentTime;
    const o=ac.createOscillator(), g=ac.createGain();
    o.type='square'; o.frequency.setValueAtTime(900,now); o.frequency.exponentialRampToValueAtTime(450,now+0.07);
    g.gain.setValueAtTime(0.09,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.09);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(now+0.09);
  } catch(e){}
}
const msgEl        = document.getElementById('msg');
const shopBtn      = document.getElementById('shop-btn');
const shopEl       = document.getElementById('shop');
const shopBal      = document.getElementById('shop-bal');
const shopGrid     = document.getElementById('shop-grid');
const shopGridBL   = document.getElementById('shop-grid-bl'); // [1.9]
let shopActiveTab  = 'cube'; // [1.9]
const shopClose    = document.getElementById('shop-close');
const deathOverlay = document.getElementById('death-overlay');
const deathStats   = document.getElementById('death-stats');

// ══════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════
let cells = [], cube = {x:8,y:8}, round = 0, dashesLeft = 2;
let sessionCoinsEarned = 0;  // coins earned this game
let hardMode = false;
let _prevHudCoins = -1, _prevHudRound = -1, _prevCombo = 0; // [1.9.3]

// ── TESTER MODE ──
// PIN verified via SHA-256 (Web Crypto API) — PIN never stored in code
const _ph = '269ab13c93ed7ad03880ad739c160e9e202bcd6ef066b6240546479ed0d38afd'; // [1.9.2] updated PIN
async function _vp(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('') === _ph;
}
let testerUnlocked = false;
let testerActive  = false; // [1.10.2-fix] no persistence — PIN required on every page load
let tNoclip   = false;
let tDashInf  = false;
let tSlow     = false;
let tFreeze   = false;
let tInfBlackHole = false; // [2.0-s4d] tester: black-hole cooldown always 0 (both worlds + boss fights)
let tFps      = false;
let tStartRound = 1;
let tSpeedMult = 1.0;         // [1.10.1] pending value — applied at next startRound()
let _appliedSpeedMult = 1.0; // [1.10.2-fix] committed value, only updates at round boundaries
let fabPaused = false;        // [1.10.2]
let _phaseFn = null;          // [1.10.2] currently pending phase callback
let _phaseFiresAt = 0;        // [1.10.2] absolute ms when phaseTimer fires
let _phaseRemainingMs = 0;    // [1.10.2] stored on pause

// FPS counter
let fpsFrames = 0, fpsLast = 0, fpsCurrent = 0;
let lasers = [], blocks = [], alive = true, startTime = 0, lastTime = 0;
let _virtAccum = 0, _virtBase = 0; // [1.10.2-fix] virtual-time accumulator for scaled elapsed
let phaseTimer = null, cellSize = 0;

// [1.9] BOARD & LASER DATA
const BOARD_SKINS = {
  classic:       { bg: '#08081a', grid: '#1a2a4a', glow: false },
  void:          { bg: '#000000', grid: '#222222', glow: false },
  neon_grid:     { bg: '#000a0a', grid: '#00ffcc', glow: true  },
  lava:          { bg: '#0a0000', grid: '#ff3300', glow: false },
  ice:           { bg: '#000a14', grid: '#88ccff', glow: false },
  galaxy:        { bg: '#04001a', grid: '#6633cc', glow: false },
  prestige_gold: { bg: '#0a0800', grid: '#ffd700', glow: true, prestige: true },
  // [2.0-s5a] Void boards
  eventhorizon:  { bg: '#0a0015', grid: '#aa44ff', glow: true,  warped: true },
  starfield:     { bg: '#020010', grid: '#1a2a5a', glow: false, stars: true  },
  nebula:        { bg: '#0a0418', grid: '#3a1a5a', glow: false, nebula: true },
  deepspace:     { bg: '#01010a', grid: '#10153a', glow: false, stars: true  },
  asteroidbelt:  { bg: '#060410', grid: '#2a2535', glow: false, belt: true   }
};
const BOARD_SKIN_LIST = [ // [1.9]
  { id:'classic',       name:'Classic',       price:0   },
  { id:'void',          name:'Void',          price:300 },
  { id:'neon_grid',     name:'Neon Grid',     price:500 },
  { id:'lava',          name:'Lava',          price:500 },
  { id:'ice',           name:'Ice',           price:400 },
  { id:'galaxy',        name:'Galaxy',        price:800 },
  { id:'prestige_gold', name:'Prestige Gold', price:0, unlock:500, unlockDesc:'Survive 500 rounds' }
];
const LASER_COLORS = { // [1.9]
  red:    { fire: '#dd2200', charge: '#661000' },
  purple: { fire: '#aa00dd', charge: '#440066' },
  blue:   { fire: '#0066dd', charge: '#002266' },
  green:  { fire: '#00dd44', charge: '#005522' },
  gold:   { fire: '#ddaa00', charge: '#664400' },
  // [2.0-s5a] Void lasers — fx field drives signature FX in fire state [2.0-s5a-r1]
  plasma:     { fire: '#cc66ff', charge: '#330055', fx: 'sparks'   },
  ion:        { fire: '#00aaff', charge: '#002244', fx: 'scanline' },
  cosmicblue: { fire: '#3388dd', charge: '#112244', fx: 'pulse'    }
};
const LASER_COLOR_LIST = [ // [1.9]
  { id:'red',    name:'Red',    price:0   },
  { id:'purple', name:'Purple', price:300 },
  { id:'blue',   name:'Blue',   price:300 },
  { id:'green',  name:'Green',  price:400 },
  { id:'gold',   name:'Gold',   price:700 }
];

// Persistent
let coins    = parseInt(localStorage.getItem('cm_coins') || '0');
let owned    = JSON.parse(localStorage.getItem('cm_owned') || '["default"]');
let skinId   = localStorage.getItem('cm_skin') || 'default';
// migration: remove old IDs not in the new skin system
const VALID_IDS = new Set(['default','stripes','grid','gradient','rainbow','glitch','aura','magma','void','neontrail','spike','robot','wave','ball','ufo','sun','blackhole','galaxy']);
owned  = owned.filter(id=>VALID_IDS.has(id));
if (!owned.includes('default')) owned.push('default');
if (!VALID_IDS.has(skinId)) skinId = 'default';
let bestTime  = parseFloat(localStorage.getItem('cm_best')  || '0');
let bestRound = parseInt(localStorage.getItem('cm_bestR')   || '0');
let gamesPlayed = parseInt(localStorage.getItem('cm_games') || '0');
let boardSkinId  = localStorage.getItem('cm_board') || 'classic'; // [1.9]
let laserColorId = localStorage.getItem('cm_laser') || 'red'; // [1.9]
let boardsOwned  = JSON.parse(localStorage.getItem('cm_boards_owned') || '["classic"]'); // [1.9]
let lasersOwned  = JSON.parse(localStorage.getItem('cm_lasers_owned') || '["red"]'); // [1.9]
let showBoardGrid = localStorage.getItem('cm_nogrid') !== '1'; // [1.9.1] bug #8: true = grid visible
// [1.9.2] Combo system
let comboCount = 0;
let bestComboThisSession = 0;
// [1.9.2] Extended statistics
let statLasers     = parseInt(localStorage.getItem('cm_stat_lasers')      || '0');
let statTimePlayed = parseInt(localStorage.getItem('cm_stat_time')        || '0');
let statCoinsTotal = parseInt(localStorage.getItem('cm_stat_coins_total') || '0');
let statBestCombo  = parseInt(localStorage.getItem('cm_stat_best_combo')  || '0');
// [2.0-s3] World 2 statistics — mirror of World 1 with cm_world2_ keys (W1 keys stay as W1 history)
let w2BestTime     = parseFloat(localStorage.getItem('cm_world2_best')              || '0');
let w2BestRound    = parseInt(localStorage.getItem('cm_world2_bestR')               || '0');
let w2Games        = parseInt(localStorage.getItem('cm_world2_games')               || '0');
let w2StatLasers   = parseInt(localStorage.getItem('cm_world2_stat_lasers')         || '0'); // flares dodged
let w2TimePlayed   = parseInt(localStorage.getItem('cm_world2_stat_time')           || '0');
let w2CrystalsTotal= parseInt(localStorage.getItem('cm_world2_stat_crystals_total') || '0');
let w2BestCombo    = parseInt(localStorage.getItem('cm_world2_stat_best_combo')     || '0');
// [2.0-s3] world-aware stat writers
function addStatLasers(n){ if(currentWorld===2){w2StatLasers+=n;localStorage.setItem('cm_world2_stat_lasers',w2StatLasers);} else {statLasers+=n;localStorage.setItem('cm_stat_lasers',statLasers);} }
function addCurrencyTotal(n){ if(currentWorld===2){w2CrystalsTotal+=n;localStorage.setItem('cm_world2_stat_crystals_total',w2CrystalsTotal);} else {statCoinsTotal+=n;localStorage.setItem('cm_stat_coins_total',statCoinsTotal);} }
function recordBestCombo(c){ if(currentWorld===2){ if(c>w2BestCombo){w2BestCombo=c;localStorage.setItem('cm_world2_stat_best_combo',w2BestCombo);} } else { if(c>statBestCombo){statBestCombo=c;localStorage.setItem('cm_stat_best_combo',statBestCombo);} } }
function addTimePlayed(s){ if(currentWorld===2){w2TimePlayed+=s;localStorage.setItem('cm_world2_stat_time',w2TimePlayed);} else {statTimePlayed+=s;localStorage.setItem('cm_stat_time',statTimePlayed);} }
// [1.10] Game mode state and records
let gameMode = null;
// [1.11] Boss state
let bossRound        = false;
let bossActive       = false;
let bossTier         = 0;
let bossX            = 0;     // [2.0-s4] live boss position (init from BOSS_CONFIG, drifts between attacks)
let bossY            = 0;     // [2.0-s4]
let bossTimeLeft     = 20;
let bossTimer        = null;
let bossThrowTimer   = null;
let bossPressureTimer = null; // [2.0-s4] continuous 1/s attack on the player's current cell
let bossAttackTimers = [];
let bossShockwaveCells = new Set();
// [2.0-s4b] World 2 active-combat boss state
let w2Boss           = null;   // active W2 boss config (PULSAR/NEUTRON/SINGULARITY) or null
let w2SpeedMult      = 1;      // attack-speed scaling per cycle (1 → 2×)
let bossHitsLeft     = 0;      // turret hits remaining to defeat the W2 boss
let bossShieldUntil  = 0;      // timestamp; while now < this the boss is invulnerable (no new plate)
let hitPlate         = null;   // {x,y} golden plate the player steps on to summon a turret
let turret           = null;   // {px,py,ex,ey,firesAt} active Solar-Flare turret
let w2BhBlocks       = [];     // [{x,y,until}, …] SINGULARITY black-hole blocks (1–3 per activation) // [2.0-s4f]
let destroyedCells   = new Set(); // SINGULARITY falling-star craters (lethal to stand on)
let _w2PowerBusyUntil = 0;      // [2.0-s4d] shared gate: serializes powerful attacks (spin/gravity/star/black-hole), ≥3s apart, no overlap
let _w2Pulling       = false;  // [2.0-s4c] true while a gravity/black-hole pull animation is stepping (input locked)
let w2SpinState      = null;   // {start,dur} active Laser Spin rotation
let w2SpinCells      = new Set(); // cells currently covered by spin beams (per-frame)
let w2Beam           = null;   // {ex,ey,until} brief turret→boss beam visual
let w2GravityWarn    = null;   // {until} Gravity Pull telegraph window
let w2Star           = null;   // {sx,sy,ex,ey,landAt} falling-star streak in flight
let w2StarShock      = null;   // [2.0-s4d] {x,y,born} expanding shockwave + flash at the star's impact
// [1.12] GRIDLOCK MODE
let gridlockActive     = false;
let gridlockRoundsLeft = 0;
let _glitchTimer       = null;
// [2.0-s1] World system
let world2Unlocked = localStorage.getItem('cm_world2_unlocked') === 'true';
let currentWorld   = parseInt(localStorage.getItem('cm_current_world') || '1');
if (!world2Unlocked) currentWorld = 1; // guard against tampered/stale value
let crystals              = parseInt(localStorage.getItem('cm_crystals') || '0');
let sessionCrystalsEarned = 0;
function curIcon()   { return currentWorld === 2 ? '✦' : '🪙'; }       // [2.0-s1]
function curWallet() { return currentWorld === 2 ? crystals : coins; } // [2.0-s1]
// [2.0-s2] Stage 2 — threats & black hole
const MAX_ASTEROIDS = 6;
let asteroids = [];             // active + warning asteroids
let asteroidTimer = null;       // spawn scheduler handle
let blackHoleCooldown = 0;      // rounds until BH ready (0 = ready)
let blackHoleReadyAt  = 0;      // [2.0-s4g] timestamp: BH usable when Date.now() >= this (W2 boss only)
let blackHoleAnimating = false; // true during the 0.5s teleport
let blackHole = null;           // { born, origin:{x,y}, dest:{x,y} } during anim
let _bhTimer = null;            // teleport completion timer handle
let _bhFiresAt = 0;             // absolute ms the teleport completes (for pause)
let _cubek2After = null;        // [2.0-s4d] action to run once the Cubek 2.0 intro finishes
let _pauseStart = 0;            // [2.0-s2] Date.now() at fab pause (asteroid freeze)
let _bhRemaining = 0;           // [2.0-s2] remaining teleport ms stored on pause
let _flareChargeStart = 0, _flareChargeDur = 0; // [2.0-s2] solar flare charge-orb timing
let _flareFireStart = 0, _flareFireDur = 0;     // [2.0-s2] solar flare beam release timing
let _dashCells = [];           // [2.0-s2] dashable cells captured each render (World 2 overlay)
// [2.0-s3] Round Randomizer — modifiers (Normal/Hard only)
let activeMod = null;          // currently active modifier def (or null)
let _roundsSinceMod = 99;      // rounds since last modifier ended (cooldown gate)
let _modRoundsLeft = 0;        // [2.0-s3.1] rounds remaining for the active modifier
let roundCoinMult = 1;         // coin/crystal multiplier this round
let roundSpeedMult = 1;        // obstacle speed multiplier this round (>1 = faster)
let comboStep = 1;             // combo increment per survived round
let boardTear = null;          // [2.0-s3.2] active Grid Glitch tear config (or null)
// [2.0-s3.1] Custom Game sandbox (tester) + hazard-enable helpers
let customGame = false;
let tutorialActive = false; // [2.0-s4h] guided live-run tutorial on the real engine
let tutBeat = 0;            // [2.0-s4h] current scripted tutorial beat (0-based)
let _tutLaserRow = -1;      // [2.0-s4h-r1] row the beat-2 laser is charging on
let _tutBlock    = null;    // [2.0-s4h-r1] {x,y} of the beat-3 block
let _tutAwaiting = null;    // [2.0-s4h-r1] 'escape' | 'dodge' | null
let customCfg = { lasers:false, asteroids:false, blocks:false, blackhole:false };
function _lasersEnabled()    { return customGame ? customCfg.lasers    : true; }
function _blocksEnabled()    { return customGame ? customCfg.blocks    : (currentWorld !== 2); } // no blocks in W2
function _asteroidsEnabled() { return customGame ? customCfg.asteroids : (currentWorld === 2); }
function _blackHoleEnabled() { return customGame ? customCfg.blackhole : (currentWorld === 2); }
let timeAttackEndTime = 0;
let _dailyRng = null;
let bestTimeAttack = parseInt(localStorage.getItem('cm_best_timeattack') || '0');
let bestHardcore   = parseInt(localStorage.getItem('cm_best_hardcore')   || '0');
let bestDaily      = parseInt(localStorage.getItem('cm_best_daily')      || '0');
let _modesCountdownInterval = null;

function save() {
  localStorage.setItem('cm_coins',  coins);
  localStorage.setItem('cm_owned',  JSON.stringify(owned));
  localStorage.setItem('cm_skin',   skinId);
  localStorage.setItem('cm_best',   bestTime);
  localStorage.setItem('cm_bestR',  bestRound);
  localStorage.setItem('cm_games',  gamesPlayed);
  localStorage.setItem('cm_crystals', crystals); // [2.0-s1]
  // [2.0-s3] World 2 records
  localStorage.setItem('cm_world2_best',  w2BestTime);
  localStorage.setItem('cm_world2_bestR', w2BestRound);
  localStorage.setItem('cm_world2_games', w2Games);
}

// ── [1.10] Mode helpers ──────────────────────────────────────────────────────
function _todayStr() { // [1.10]
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function _msUntilMidnight() { // [1.10]
  const d = new Date();
  return new Date(d.getFullYear(),d.getMonth(),d.getDate()+1) - d;
}
function _fmtCountdown(ms) { // [1.10]
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}
function _isModeBlocked(mode) { // [1.10]
  const today = _todayStr();
  if (mode === 'hardcore') return localStorage.getItem('cm_hardcore_date') === today;
  if (mode === 'daily')    return localStorage.getItem('cm_daily_date')    === today;
  return false;
}
function _seededRng(seed) { // [1.10] xorshift32
  let s = seed >>> 0 || 1;
  return function() {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}
function _dateSeed() { // [1.10]
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
}
// ─────────────────────────────────────────────────────────────────────────────

let _testerSnap = null; // [1.9.2] Bug #3: tester snapshot
function _saveTesterSnap() { // [1.9.2]
  const KEYS=['cm_coins','cm_owned','cm_skin','cm_best','cm_bestR','cm_games',
    'cm_board','cm_laser','cm_boards_owned','cm_lasers_owned','cm_nogrid',
    'cm_stat_lasers','cm_stat_time','cm_stat_coins_total','cm_stat_best_combo',
    'cm_crystals','cm_world2_best','cm_world2_bestR','cm_world2_games',          // [2.0-s3]
    'cm_world2_stat_lasers','cm_world2_stat_time','cm_world2_stat_crystals_total','cm_world2_stat_best_combo'];
  _testerSnap={};
  for(const k of KEYS) _testerSnap[k]=localStorage.getItem(k);
}
function _restoreTesterSnap() { // [1.9.2]
  if(!_testerSnap) return;
  for(const [k,v] of Object.entries(_testerSnap)){
    if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v);
  }
  coins        = parseInt(localStorage.getItem('cm_coins')  || '0');
  owned        = JSON.parse(localStorage.getItem('cm_owned') || '["default"]');
  skinId       = localStorage.getItem('cm_skin') || 'default';
  bestTime     = parseFloat(localStorage.getItem('cm_best')  || '0');
  bestRound    = parseInt(localStorage.getItem('cm_bestR')   || '0');
  gamesPlayed  = parseInt(localStorage.getItem('cm_games')  || '0');
  boardSkinId  = localStorage.getItem('cm_board') || 'classic';
  laserColorId = localStorage.getItem('cm_laser') || 'red';
  boardsOwned  = JSON.parse(localStorage.getItem('cm_boards_owned') || '["classic"]');
  lasersOwned  = JSON.parse(localStorage.getItem('cm_lasers_owned') || '["red"]');
  statLasers     = parseInt(localStorage.getItem('cm_stat_lasers')       || '0');
  statTimePlayed = parseInt(localStorage.getItem('cm_stat_time')         || '0');
  statCoinsTotal = parseInt(localStorage.getItem('cm_stat_coins_total')  || '0');
  statBestCombo  = parseInt(localStorage.getItem('cm_stat_best_combo')   || '0');
  // [2.0-s3] World 2 stats
  crystals        = parseInt(localStorage.getItem('cm_crystals')                   || '0');
  w2BestTime      = parseFloat(localStorage.getItem('cm_world2_best')              || '0');
  w2BestRound     = parseInt(localStorage.getItem('cm_world2_bestR')               || '0');
  w2Games         = parseInt(localStorage.getItem('cm_world2_games')               || '0');
  w2StatLasers    = parseInt(localStorage.getItem('cm_world2_stat_lasers')         || '0');
  w2TimePlayed    = parseInt(localStorage.getItem('cm_world2_stat_time')           || '0');
  w2CrystalsTotal = parseInt(localStorage.getItem('cm_world2_stat_crystals_total') || '0');
  w2BestCombo     = parseInt(localStorage.getItem('cm_world2_stat_best_combo')     || '0');
  _testerSnap=null;
}

// [1.9] Apply board skin background to game and tutorial boards
function applyBoardSkin() {
  const skin = BOARD_SKINS[boardSkinId] || BOARD_SKINS.classic;
  // [2.0-s1] World 2 overrides the visual bg without mutating boardSkinId (World 1 restores its real skin)
  const boardBg = currentWorld === 2 ? '#030310' : skin.bg;
  const cellBg  = currentWorld === 2 ? '#05051a' : skin.bg;
  boardEl.style.background = boardBg;
  boardEl.style.setProperty('--board-bg', cellBg);
}

// [1.9] Draw grid lines on a canvas (used in animLoop) [2.0-s4h][2.0-s5a]
function drawBoardGridLines(ctx2, canvasSize, n) {
  const skin = BOARD_SKINS[boardSkinId] || BOARD_SKINS.classic; // [2.0-s5a] compute first
  if (boardSkinId === 'classic' || !showBoardGrid) return; // [1.9.1] bug #8: no-grid toggle
  const w2 = currentWorld === 2; // [2.0-s1]
  if (!w2) { // World 1: base grid lines (straight or gravitationally warped)
    if (skin.warped) _drawWarpedGrid(ctx2, canvasSize, n, skin); // [2.0-s5a]
    else {
      const cs = canvasSize / n;
      ctx2.save();
      ctx2.lineWidth = 0.5;
      ctx2.strokeStyle = skin.grid;
      if (skin.glow) {
        const glowAmt = skin.prestige
          ? 4 + 6 * (0.5 + 0.5 * Math.sin(Date.now() / 1000 * Math.PI))
          : 4;
        ctx2.shadowColor = skin.grid;
        ctx2.shadowBlur  = glowAmt;
      }
      for (let i = 0; i <= n; i++) {
        ctx2.beginPath(); ctx2.moveTo(i * cs, 0); ctx2.lineTo(i * cs, canvasSize); ctx2.stroke();
        ctx2.beginPath(); ctx2.moveTo(0, i * cs); ctx2.lineTo(canvasSize, i * cs); ctx2.stroke();
      }
      ctx2.shadowBlur = 0;
      ctx2.restore();
    }
  } else { // [2.0-s5a] World 2: seamless void — no grid lines; eventhorizon shows its core only
    if (skin.warped) _drawWarpedCore(ctx2, canvasSize);
  }
  // [2.0-s5a] overlays — rendered in BOTH worlds (old boards have no flags → nothing drawn)
  if (skin.stars)       _drawStarsOverlay(ctx2, canvasSize);
  else if (skin.nebula) _drawNebulaOverlay(ctx2, canvasSize);
  else if (skin.belt)   _drawBeltOverlay(ctx2, canvasSize);
}

// [2.0-s5a] Event Horizon — gravitational lensing: grid lines pinched toward the center singularity
function _drawWarpedGrid(ctx2, size, n, skin) {
  const cx = size / 2, cy = size / 2, maxR = size * 0.5;
  const warp = (px, py) => { // pull a point toward center, strongest near center
    const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy);
    const closeness = Math.max(0, 1 - d / maxR), pull = closeness * closeness * 0.35;
    return [px - dx * pull, py - dy * pull];
  };
  const g = ctx2.createRadialGradient(cx, cy, size * 0.05, cx, cy, maxR);
  g.addColorStop(0, '#440088'); g.addColorStop(1, skin.grid);
  ctx2.save();
  ctx2.lineWidth = 0.8;
  ctx2.strokeStyle = g;
  if (skin.glow) { ctx2.shadowColor = skin.grid; ctx2.shadowBlur = 5; }
  const cs = size / n, SEG = 16;
  for (let i = 0; i <= n; i++) {
    // vertical line
    ctx2.beginPath();
    for (let k = 0; k <= SEG; k++) { const [wx, wy] = warp(i * cs, (k / SEG) * size); k === 0 ? ctx2.moveTo(wx, wy) : ctx2.lineTo(wx, wy); }
    ctx2.stroke();
    // horizontal line
    ctx2.beginPath();
    for (let k = 0; k <= SEG; k++) { const [wx, wy] = warp((k / SEG) * size, i * cs); k === 0 ? ctx2.moveTo(wx, wy) : ctx2.lineTo(wx, wy); }
    ctx2.stroke();
  }
  ctx2.shadowBlur = 0;
  ctx2.restore();
  _drawWarpedCore(ctx2, size);
}

// [2.0-s5a] central black/gold singularity (shared by warped grid in W1, drawn alone in W2)
function _drawWarpedCore(ctx2, size) {
  const cx = size / 2, cy = size / 2, r = size * 0.10;
  ctx2.save();
  ctx2.fillStyle = '#000';
  ctx2.beginPath(); ctx2.arc(cx, cy, r, 0, Math.PI * 2); ctx2.fill();
  const pulse = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(Date.now() * 0.003));
  ctx2.strokeStyle = `rgba(255,215,0,${pulse})`;
  ctx2.lineWidth = 2;
  ctx2.shadowColor = '#ffd700'; ctx2.shadowBlur = 8;
  ctx2.beginPath(); ctx2.arc(cx, cy, r, 0, Math.PI * 2); ctx2.stroke();
  ctx2.shadowBlur = 0;
  ctx2.restore();
}

// [2.0-s5a] deterministic twinkling star field overlay
function _drawStarsOverlay(ctx2, size) {
  const now = Date.now() * 0.0006;
  ctx2.save();
  for (let i = 0; i < 40; i++) {
    const sx = (Math.sin(i * 137.5) * 0.5 + 0.5) * size, sy = (Math.cos(i * 91.7) * 0.5 + 0.5) * size;
    const a = 0.25 + 0.55 * Math.abs(Math.sin(now + i));
    const rr = 0.5 + (i % 3) * 0.5;
    ctx2.globalAlpha = a;
    ctx2.fillStyle = '#ffffff';
    ctx2.beginPath(); ctx2.arc(sx, sy, rr, 0, Math.PI * 2); ctx2.fill();
  }
  ctx2.globalAlpha = 1;
  ctx2.restore();
}

// [2.0-s5a] soft drifting nebula clouds overlay
function _drawNebulaOverlay(ctx2, size) {
  const drift = Date.now() * 0.00004;
  const clouds = [
    { hue: 280, x: 0.35, y: 0.4 }, { hue: 315, x: 0.65, y: 0.55 },
    { hue: 210, x: 0.5, y: 0.3 },  { hue: 260, x: 0.45, y: 0.7 },
  ];
  ctx2.save();
  for (let i = 0; i < clouds.length; i++) {
    const c = clouds[i];
    const px = size * c.x + Math.sin(drift + i) * size * 0.04;
    const py = size * c.y + Math.cos(drift + i * 1.3) * size * 0.04;
    const g = ctx2.createRadialGradient(px, py, 0, px, py, size * 0.32);
    g.addColorStop(0, `hsla(${c.hue},85%,60%,0.22)`);
    g.addColorStop(1, `hsla(${c.hue},85%,60%,0)`);
    ctx2.fillStyle = g;
    ctx2.beginPath(); ctx2.arc(px, py, size * 0.32, 0, Math.PI * 2); ctx2.fill();
  }
  ctx2.restore();
}

// [2.0-s5a] diagonal asteroid-belt band of small rocks
function _drawBeltOverlay(ctx2, size) {
  ctx2.save();
  ctx2.fillStyle = 'rgba(120,115,130,0.5)';
  for (let i = 0; i < 26; i++) {
    const t2 = i / 25;
    const bx = t2 * size + (Math.sin(i * 71.3) * 0.5) * size * 0.12;
    const by = (1 - t2) * size + (Math.cos(i * 53.7) * 0.5) * size * 0.12;
    const rr = 0.8 + (i % 4) * 0.6;
    ctx2.beginPath(); ctx2.arc(bx, by, rr, 0, Math.PI * 2); ctx2.fill();
  }
  ctx2.restore();
}

// [1.9] Draw 38×38 board skin preview (mini board + 3×3 grid)
function drawBoardPreview(cv, skinId2) {
  const ctx2 = cv.getContext('2d');
  const skin = BOARD_SKINS[skinId2] || BOARD_SKINS.classic;
  ctx2.fillStyle = skin.bg;
  ctx2.fillRect(0, 0, 38, 38);
  ctx2.strokeStyle = skin.grid;
  ctx2.lineWidth = 0.8;
  if (skin.glow) {
    ctx2.shadowColor = skin.grid;
    ctx2.shadowBlur  = skin.prestige ? 3 : 2;
  }
  for (let i = 0; i <= 3; i++) {
    const p = i * (38 / 3);
    ctx2.beginPath(); ctx2.moveTo(p, 0); ctx2.lineTo(p, 38); ctx2.stroke();
    ctx2.beginPath(); ctx2.moveTo(0, p); ctx2.lineTo(38, p); ctx2.stroke();
  }
  ctx2.shadowBlur = 0;
}

// [2.0-s5a-r1] Draw 38×38 laser color preview — gradient band + core line
function drawLaserPreview(cv, colorId2) {
  const ctx2 = cv.getContext('2d');
  const col = LASER_COLORS[colorId2] || LASER_COLORS.red;
  ctx2.fillStyle = '#060616';
  ctx2.fillRect(0, 0, 38, 38);
  ctx2.save();
  const g = ctx2.createLinearGradient(0, 13, 0, 25);
  g.addColorStop(0, col.charge); g.addColorStop(0.5, col.fire); g.addColorStop(1, col.charge);
  ctx2.fillStyle = g; ctx2.fillRect(4, 13, 30, 12);
  ctx2.shadowColor = col.fire; ctx2.shadowBlur = 6;
  ctx2.strokeStyle = col.fire; ctx2.lineWidth = 1;
  ctx2.beginPath(); ctx2.moveTo(4, 19); ctx2.lineTo(34, 19); ctx2.stroke();
  ctx2.restore();
}

// ══════════════════════════════════════════════════
// BOARD
// ══════════════════════════════════════════════════
function buildBoard() {
  const vw = document.documentElement.clientWidth;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  const size = Math.min(vw - 16, vh - 120, 440);
  cellSize = size / N;
  boardEl.style.width = boardEl.style.height = size + 'px';
  boardEl.style.gridTemplate = `repeat(${N},1fr)/repeat(${N},1fr)`;
  canvas.width = canvas.height = size;
  boardEl.innerHTML = ''; cells = [];
  for (let y = 0; y < N; y++) {
    const row = [];
    for (let x = 0; x < N; x++) {
      const c = document.createElement('div');
      c.className = 'cell';
      c.addEventListener('pointerdown', () => { _dashPressX = x; _dashPressY = y; }); // [2.0-s4] lock dash target on press
      boardEl.appendChild(c); row.push(c);
    }
    cells.push(row);
  }
  applyBoardSkin(); // [1.9]
}

// ══════════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════════
function skinColor() {
  const colors = {
    default:'#00ffe0', stripes:'#ff4488', grid:'#00ff64', gradient:'#ff88cc', rainbow:'#ffff00',
    glitch:'#00ffff', aura:'#cc44ff', magma:'#ff6600', void:'#9933ff', neontrail:'#00ffaa',
    spike:'#00ffcc', robot:'#4488ff', wave:'#8844ff', ball:'#ff44ff', ufo:'#00ffb0',
    sun:'#ffdd00', blackhole:'#aa44ff', galaxy:'#aaddff',
    // [2.0-s5a] Void skins
    singularityheart:'#ffcc55', supernova:'#ff7722', pulsarskin:'#66ddff', cosmicdust:'#cc88ff',
    comet:'#aaddff', aurora:'#66ffaa', meteor:'#ff6633', stardust:'#ddeeff', orbit:'#88bbff', lunar:'#cccccc'
  };
  return colors[skinId] || '#00e0c6';
}

// ── SKIN CACHE ──
// Instead of recalculating drawSkin every frame — buffer onto offscreen canvas
// and only copy via drawImage (10-100× faster)
let skinCache = null;       // offscreen canvas
let skinCacheId = null;     // skin id in cache
let skinCacheT  = -1;       // t in cache (for animated skins)
const CACHE_INTERVAL = 2;   // refresh cache every N frames (animated)

function getSkinCanvas(t) {
  const sz = Math.ceil(cellSize) || 24;
  const animated = ANIMATED_SKINS.has(skinId);
  const needRegen = !skinCache
    || skinCacheId !== skinId
    || skinCache.width !== sz
    || (animated && Math.floor(t/CACHE_INTERVAL) !== Math.floor(skinCacheT/CACHE_INTERVAL));

  if (needRegen) {
    if (!skinCache || skinCache.width !== sz) {
      skinCache = document.createElement('canvas');
      skinCache.width = skinCache.height = sz;
    }
    const c2 = skinCache.getContext('2d');
    c2.clearRect(0, 0, sz, sz);
    drawSkin(c2, skinId, 0, 0, sz, t);
    skinCacheId = skinId;
    skinCacheT  = t;
  }
  return skinCache;
}

function invalidateSkinCache() {
  skinCacheId = null;
}

let skinAnimT = 0;

function drawCubeOnCanvas(gx, gy, t) {
  cubeDrawPending = {gx, gy, t};
  if (!animFrame) _paintCube();
}

let cubeDrawPending = null;
function _paintCube() {
  if (!cubeDrawPending) return;
  const {gx, gy, t} = cubeDrawPending;
  const px = gx * cellSize, py = gy * cellSize;
  const sz = cellSize;
  // use cache instead of redrawing from scratch
  const cached = getSkinCanvas(t);
  ctx.drawImage(cached, px, py, sz, sz);
  // glow
  ctx.save();
  ctx.shadowColor = skinColor();
  ctx.shadowBlur = 8;
  ctx.strokeStyle = skinColor() + '66';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(px+1, py+1, sz-2, sz-2, 3);
  ctx.stroke();
  ctx.restore();
}

function render() {
  for (let y=0;y<N;y++) for (let x=0;x<N;x++) {
    const c = cells[y][x];
    c.className='cell';
    c.style.background='';
    c.style.boxShadow='';
  }
  // range — build set of cells occupied by lasers (2-wide flares in World 2) [2.0-s2]
  const laserCells = new Set();
  for (const L of lasers) {
    for (const ix of laserIdxs(L)) {
      if (L.type==='row') for (let x=0;x<N;x++) laserCells.add(`${x},${ix}`);
      else                for (let y=0;y<N;y++) laserCells.add(`${ix},${y}`);
    }
  }
  const bossCells = getBossCells(); // [1.11]
  _dashCells = []; // [2.0-s2] recapture for the World 2 canvas overlay
  if (alive) for (let y=0;y<N;y++) for (let x=0;x<N;x++) {
    const key = `${x},${y}`;
    if (dist(x,y,cube.x,cube.y)<=DASH_RANGE && !(x===cube.x&&y===cube.y)
        && !laserCells.has(key) && !bossCells.has(key) && !bossShockwaveCells.has(key)) { // [1.11]
      cells[y][x].classList.add('dashable');
      _dashCells.push([x, y]); // [2.0-s2]
    }
  }
  // blocks (on cells — small, no border issue)
  if (!bossRound) blocks = blocks.filter(b => !b.bossRain && !b.bossThrow && !b.bossPressure); // [2.0-s3][2.0-s4] never show boss blocks outside boss rounds
  for (const b of blocks) cells[b.y][b.x].classList.add(b.state==='land'?'block':'block-charge');
  // [1.11] Shockwave cells
  for (const key of bossShockwaveCells) {
    const [sx, sy] = key.split(',').map(Number);
    if (cells[sy]?.[sx]) cells[sy][sx].classList.add('boss-shockwave');
  }
  // [2.0-s4b] World 2 boss markers — destroyed craters, hit plate, charging turret
  if (w2Boss) {
    for (const key of destroyedCells) { const [dx,dy]=key.split(',').map(Number); if (cells[dy]?.[dx]) cells[dy][dx].classList.add('cell-destroyed'); }
    if (hitPlate && cells[hitPlate.y]?.[hitPlate.x]) cells[hitPlate.y][hitPlate.x].classList.add('hit-plate');
    if (turret) {
      if (cells[turret.ey]?.[turret.ex]) cells[turret.ey][turret.ex].classList.add('w2-turret','w2-turret-charge');
      if (cells[turret.py]?.[turret.px]) cells[turret.py][turret.px].classList.add('w2-turret-charge');
    }
  }
  // lasers — NOT on cells, drawn on canvas in animLoop
  // cube — draw on canvas
  drawCubeOnCanvas(cube.x, cube.y, skinAnimT);
  startAnim(); // starts animLoop which draws cube + lasers

  const _wal = curWallet(); // [2.0-s1]
  hudCoins.textContent = gridlockActive ? `${curIcon()} ${_wal} ×2` : `${curIcon()} ${_wal}`; // [1.12][2.0-s1]
  if (_wal !== _prevHudCoins) { // [1.9.3]
    _prevHudCoins = _wal;
    hudCoins.classList.remove('hud-bump'); void hudCoins.offsetWidth;
    hudCoins.classList.add('hud-bump');
  }
  hudInfo.textContent  = customGame // [2.0-s3.2]
    ? '🧪 CUSTOM'
    : (bossRound && bossActive && w2Boss) // [2.0-s4b] W2 active-combat boss: hits + shield
    ? `✦ ${w2Boss.name} · ${bossHitsLeft} hit${bossHitsLeft===1?'':'s'} left${Date.now()<bossShieldUntil?' · 🛡':''} · +${w2Boss.reward} ✦`
    : (bossRound && bossActive) // [1.11]
    ? `👾 ${BOSS_CONFIG[bossTier].name} · +${BOSS_CONFIG[bossTier].reward} 🪙`
    : `${testerActive ? '⚙ TEST · ' : ''}Round ${round} · ${aliveTime()}s`; // [1.9]
  if (round !== _prevHudRound) { // [1.9.3]
    _prevHudRound = round;
    hudInfo.classList.remove('hud-bump'); void hudInfo.offsetWidth;
    hudInfo.classList.add('hud-bump');
  }
  hudDash.textContent  = `⚡ ${testerActive && tDashInf ? '∞' : dashesLeft}`;
  updateBlackHoleHud(); // [2.0-s2]
  // [1.9.2] Combo indicator — only visible when combo >= 5
  if (comboCount >= 5) {
    hudCombo.textContent = `🔥 x${comboCount}`; hudCombo.style.display = '';
    if (comboCount !== _prevCombo) { // [1.9.3]
      _prevCombo = comboCount;
      hudCombo.classList.remove('combo-pop'); void hudCombo.offsetWidth;
      hudCombo.classList.add('combo-pop');
    }
  } else { hudCombo.style.display = 'none'; _prevCombo = 0; } // [1.9.3]
}

// animation for animated skins
const ANIMATED_SKINS = new Set(['default','stripes','grid','rainbow','glitch','aura','magma','void','neontrail','robot','wave','ball','ufo','sun','blackhole','galaxy',
  'singularityheart','supernova','pulsarskin','cosmicdust','comet','aurora','meteor','stardust','orbit','lunar']); // [2.0-s5a]

function dist(x1,y1,x2,y2){return Math.abs(x1-x2)+Math.abs(y1-y2);}
function _virtMs() { // [1.10.2-fix] virtual elapsed ms using committed round-boundary multiplier
  return _virtAccum + (Date.now() - _virtBase) * (testerActive ? _appliedSpeedMult : 1);
}
function _freezeVirtTime() { // [1.10.2-fix] snapshot virtual time (called at round boundaries and pause)
  if (!alive) return;
  _virtAccum += (Date.now() - _virtBase) * (testerActive ? _appliedSpeedMult : 1);
  _virtBase = Date.now();
}
function aliveTime(){ // [1.10.2-fix]
  return alive ? (_virtMs() / 1000).toFixed(1) : lastTime;
}
function flash(t){msgEl.textContent=t;}
function animateCounter(id, target, duration) { // [1.9.3]
  const el = document.getElementById(id);
  if (!el) return;
  if (target === 0) { el.textContent = '0'; return; }
  const start = Date.now();
  (function tick() {
    const p = Math.min((Date.now() - start) / duration, 1);
    el.textContent = Math.round(p * target);
    if (p < 1) requestAnimationFrame(tick);
  })();
}

function showComboFlash(combo, bonus) { // [1.9.2]
  const el = document.getElementById('combo-flash');
  if (!el) return;
  el.textContent = `🔥 Combo x${combo}! +${bonus} bonus ${curIcon()}`; // [2.0-s1]
  el.style.display = 'block'; el.style.opacity = '1';
  clearTimeout(el._t1); clearTimeout(el._t2);
  const _cf1 = testerActive ? (1200 / Math.max(0.01, tSpeedMult)) : 1200; // [1.10.2]
  const _cf2 = testerActive ? (1600 / Math.max(0.01, tSpeedMult)) : 1600; // [1.10.2]
  el._t1FiresAt = Date.now() + _cf1; // [1.10.2]
  el._t2FiresAt = Date.now() + _cf2; // [1.10.2]
  el._t1 = setTimeout(() => { el.style.opacity = '0'; el._t1FiresAt = 0; }, _cf1);
  el._t2 = setTimeout(() => { el.style.display = 'none'; el._t2FiresAt = 0; }, _cf2);
}

// Timer every 100ms — updates time in HUD
setInterval(()=>{
  if (fabPaused) return; // [1.10.2] halt all HUD logic while paused
  if (alive && appEl.style.visibility !== 'hidden') {
    hudInfo.textContent = customGame // [2.0-s3.2]
      ? '🧪 CUSTOM'
      : (bossRound && bossActive) // [1.11]
      ? `👾 ${BOSS_CONFIG[bossTier].name} · +${BOSS_CONFIG[bossTier].reward} 🪙`
      : `${testerActive?'⚙ TEST · ':''}Round ${round} · ${aliveTime()}s`; // [1.9]
    hudCoins.textContent = gridlockActive ? `${curIcon()} ${curWallet()} ×2` : `${curIcon()} ${curWallet()}`; // [1.12][2.0-s1]
    updateBlackHoleHud(); // [2.0-s2]
    if (gameMode === 'timeattack') { // [1.10]
      const virtualMs = _virtMs(); // [1.10.2-fix]
      const left = Math.max(0, Math.ceil((60000 - virtualMs) / 1000));
      if (hudTimerEl) {
        hudTimerEl.textContent = `⏱ ${left}s`;
        hudTimerEl.className = left <= 10 ? 'urgent' : '';
      }
      if (virtualMs >= 60000) _timeAttackOver();
    }
  }
}, 100);

// ══════════════════════════════════════════════════
// CANVAS ANIMATIONS
// ══════════════════════════════════════════════════
let particles = [];   // death particles
let trails    = [];   // dash trail
let animFrame = null;

function animLoop() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBoardGridLines(ctx, canvas.width, N); // [1.9]
  const now = Date.now();

  // ── LASERS / SOLAR FLARES ON CANVAS — entirely skipped when boss is active ──
  // [1.11] bossActive guard: no clip regions, no shadows, no canvas state set at all
  if (lasers.length > 0 && !bossActive) {
    if (currentWorld === 2) { // [2.0-s2] Solar Flares: charge orb → wide beam release
      drawSolarFlares(now);
    } else {
      const laserCol     = LASER_COLORS[laserColorId] || LASER_COLORS.red; // [1.9]
      const fireLasers   = lasers.filter(l => l.state === 'fire');
      const chargeLasers = lasers.filter(l => l.state === 'charge');
      const pulse = .45 + .35*Math.sin(now*.009);

      // Charge — pulsing dark color
      if (chargeLasers.length > 0) {
        ctx.save();
        ctx.beginPath();
        for (const L of chargeLasers) {
          if (L.type==='row') ctx.rect(0, L.idx*cellSize, canvas.width, cellSize);
          else                ctx.rect(L.idx*cellSize, 0, cellSize, canvas.height);
        }
        ctx.clip();
        ctx.globalAlpha = .28 + .22*pulse;
        ctx.fillStyle = laserCol.charge; // [1.9]
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Fire — block-merged: adjacent beams = one band; intersections fill corners [2.0-s5a-r5]
      if (fireLasers.length > 0) {
        const lxFx = (LASER_COLORS[laserColorId] || {}).fx;
        const rowSet = new Set(), colSet = new Set();
        for (const L of fireLasers) {
          const idxs = laserIdxs(L);
          if (L.type === 'row') for (const i of idxs) rowSet.add(i);
          else                  for (const i of idxs) colSet.add(i);
        }
        const rowBlocks = _mergeIndexBlocks(rowSet), colBlocks = _mergeIndexBlocks(colSet);
        ctx.save();
        ctx.beginPath(); // unified clip = union of all block rects
        for (const b of rowBlocks) ctx.rect(0, b.lo * cellSize, canvas.width, (b.hi - b.lo + 1) * cellSize);
        for (const b of colBlocks) ctx.rect(b.lo * cellSize, 0, (b.hi - b.lo + 1) * cellSize, canvas.height);
        ctx.clip();
        // pass 1: gradients
        for (const b of rowBlocks) _drawLaserBlockFire(ctx, true,  b.lo, b.hi, canvas, cellSize, laserCol, null, now, 'grad');
        for (const b of colBlocks) _drawLaserBlockFire(ctx, false, b.lo, b.hi, canvas, cellSize, laserCol, null, now, 'grad');
        // pass 2: radial junction — bright center fading to corners, no visible beam sides [2.0-s5a-r6]
        for (const r of rowBlocks) for (const c of colBlocks) {
          const ix = c.lo * cellSize, iy = r.lo * cellSize;
          const iw = (c.hi - c.lo + 1) * cellSize, ih = (r.hi - r.lo + 1) * cellSize;
          const ccx = ix + iw / 2, ccy = iy + ih / 2;
          const rad = Math.max(iw, ih) * 0.75; // reaches past corners → edges vanish
          const g = ctx.createRadialGradient(ccx, ccy, 0, ccx, ccy, rad);
          g.addColorStop(0,   laserCol.fire);   // bright center
          g.addColorStop(0.6, laserCol.fire);   // bright out to ~60%
          g.addColorStop(1,   laserCol.charge); // softly darker toward corners
          ctx.fillStyle = g;
          ctx.fillRect(ix, iy, iw, ih);
        }
        // pass 3: cores (+ sparks/scanline per block) on top of all gradients
        for (const b of rowBlocks) _drawLaserBlockFire(ctx, true,  b.lo, b.hi, canvas, cellSize, laserCol, lxFx, now, 'core');
        for (const b of colBlocks) _drawLaserBlockFire(ctx, false, b.lo, b.hi, canvas, cellSize, laserCol, lxFx, now, 'core');
        // pass 4: pulse FX once over the whole clip (avoids per-block stacking)
        if (lxFx === 'pulse') {
          ctx.save();
          ctx.globalAlpha = 0.7 + 0.3 * Math.sin(now * 0.02);
          ctx.fillStyle = 'rgba(80,160,255,0.25)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = 1;
          ctx.restore();
        }
        ctx.restore();
      }
    }
  }

  // [2.0-s2] World 2 dash-range indicator — drawn ABOVE flares so it's always visible
  // [2.0-s3.1] uniform fill only (no per-cell border) so adjacent cells merge into a smooth diamond
  if (alive && currentWorld === 2 && !blackHoleAnimating) {
    ctx.save();
    ctx.fillStyle = 'rgba(150,90,235,0.32)';
    for (const c of _dashCells) ctx.fillRect(c[0]*cellSize, c[1]*cellSize, cellSize, cellSize);
    ctx.restore();
  }

  // cube always drawn above lasers (suppressed during teleport — drawBlackHole owns the player visual)
  if (alive && !blackHoleAnimating) _paintCube(); // [2.0-s2]

  // trail
  trails = trails.filter(t => now - t.born < 300);
  for (const t of trails) {
    const age = (now - t.born) / 300;
    ctx.globalAlpha = (1-age) * 0.6;
    ctx.fillStyle = skinColor();
    const s = cellSize * (1 - age * 0.5);
    const ox = t.x * cellSize + (cellSize-s)/2;
    const oy = t.y * cellSize + (cellSize-s)/2;
    ctx.beginPath();
    ctx.roundRect(ox, oy, s, s, 3);
    ctx.fill();
  }

  // particles
  particles = particles.filter(p => now - p.born < p.life);
  for (const p of particles) {
    const age = (now - p.born) / p.life;
    ctx.globalAlpha = (1-age) * 0.9;
    ctx.fillStyle = p.color;
    const s = p.size * (1-age*0.6);
    ctx.beginPath();
    ctx.roundRect(
      p.x + p.vx*(now-p.born)/1e3 - s/2,
      p.y + p.vy*(now-p.born)/1e3 + 60*(now-p.born)*(now-p.born)/1e6 - s/2,
      s, s, 2
    );
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  // [1.11] Boss — drawn above particles, below pause overlay
  if (bossActive) { w2Boss ? drawW2Boss(now) : drawBoss(bossTier, now); } // [1.11][2.0-s4b]

  // [2.0-s2] Asteroids (World 2) and Black Hole teleport
  if (currentWorld === 2 && asteroids.length > 0) drawAsteroids(now);
  if (blackHoleAnimating) drawBlackHole(now);

  // [1.12] GRIDLOCK scanlines overlay
  if (gridlockActive) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#000';
    for (let sy = 0; sy < canvas.height; sy += 4) ctx.fillRect(0, sy, canvas.width, 2);
    ctx.restore();
  }

  // [1.10.2] Pause overlay — drawn on top of everything
  if (fabPaused) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0cf';
    ctx.font = `bold ${Math.round(canvas.width/14)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('⏸ PAUSED', canvas.width/2, canvas.height/2);
    ctx.textAlign = 'left';
  }

  // animated skins — refresh every frame
  if (alive && ANIMATED_SKINS.has(skinId)) skinAnimT++;

  const shouldContinue = particles.length > 0 || trails.length > 0
    || (alive && ANIMATED_SKINS.has(skinId))
    || (lasers.length > 0 && !bossActive) // [1.11]
    || fabPaused          // [1.10.2] keep running to display pause overlay
    || bossActive         // [1.11] keep running for boss animations
    || bossRound          // [1.11] keep running during boss intro (before bossActive)
    || gridlockActive     // [1.12] keep running for scanlines animation
    || asteroids.length > 0 // [2.0-s2] keep running for asteroids
    || blackHoleAnimating;  // [2.0-s2] keep running for teleport animation
  if (shouldContinue) animFrame = requestAnimationFrame(animLoop);
  else { animFrame = null; }
}

function startAnim() {
  if (!animFrame) animFrame = requestAnimationFrame(animLoop);
}

function spawnTrail(fromX, fromY, toX, toY) {
  // points along dash path
  const steps = Math.max(Math.abs(toX-fromX), Math.abs(toY-fromY));
  for (let i=1; i<steps; i++) {
    const t = i/steps;
    trails.push({
      x: fromX + (toX-fromX)*t,
      y: fromY + (toY-fromY)*t,
      born: Date.now() - i*10
    });
  }
  startAnim();
}

function spawnDeath(x, y) {
  const cx = (x + 0.5) * cellSize, cy = (y + 0.5) * cellSize;
  const col = skinColor();
  for (let i=0; i<18; i++) {
    const angle = (Math.PI*2/18)*i + Math.random()*0.3;
    const spd = 60 + Math.random()*120;
    particles.push({
      x:cx, y:cy,
      vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd - 40,
      color: i%3===0 ? '#fff' : col,
      size: 4 + Math.random()*6,
      born: Date.now(), life: 600 + Math.random()*400
    });
  }
  startAnim();
}

function spawnBlockImpact(x, y) {
  const cx = (x+0.5)*cellSize, cy = (y+0.5)*cellSize;
  for (let i=0; i<8; i++) {
    const angle = Math.PI + Math.random()*Math.PI; // explodes upward
    const spd = 30+Math.random()*60;
    particles.push({
      x:cx, y:cy,
      vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd,
      color:'#aa77ff', size:3+Math.random()*4,
      born:Date.now(), life:300+Math.random()*200
    });
  }
  startAnim();
}

function spawnDashParticles(px, py) { // [1.9.3]
  const cx = (px + 0.5) * cellSize, cy = (py + 0.5) * cellSize;
  const col = (LASER_COLORS[laserColorId] || LASER_COLORS.red).fire;
  const count = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 80 + Math.random() * 100;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
      color: col,
      size: 3 + Math.random() * 4,
      born: Date.now(), life: 260 + Math.random() * 80
    });
  }
  startAnim();
}

// ══════════════════════════════════════════════════
// [2.0-s2] ASTEROIDS (World 2 moving obstacles)
// ══════════════════════════════════════════════════
const ASTEROID_DIRS  = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const ASTEROID_SPEED = (N + 3) / 1500; // cells per ms — crosses the grid in ~1.5s

function _spawnAsteroid() {
  if (asteroids.filter(a => Date.now() >= a.warnUntil).length >= MAX_ASTEROIDS) return;
  const [dirX, dirY] = ASTEROID_DIRS[Math.floor(Math.random()*ASTEROID_DIRS.length)];
  let sx, sy;
  if (dirX !== 0 && dirY !== 0) { // [2.0-s3.1] diagonal: enter from a random point on one edge (not always corners)
    if (Math.random() < 0.5) { sx = Math.floor(Math.random()*N) + 0.5; sy = dirY > 0 ? -1.5 : N + 0.5; } // top/bottom edge
    else                     { sy = Math.floor(Math.random()*N) + 0.5; sx = dirX > 0 ? -1.5 : N + 0.5; } // left/right edge
  } else {
    if (dirX > 0) sx = -1.5; else if (dirX < 0) sx = N + 0.5; else sx = Math.floor(Math.random()*N) + 0.5;
    if (dirY > 0) sy = -1.5; else if (dirY < 0) sy = N + 0.5; else sy = Math.floor(Math.random()*N) + 0.5;
  }
  // [2.0-s3.1] warning cell = entry cell, clamped into the grid (matches randomized start)
  const ex = Math.max(0, Math.min(N-1, Math.floor(sx)));
  const ey = Math.max(0, Math.min(N-1, Math.floor(sy)));
  asteroids.push({ born: Date.now(), dirX, dirY, sx, sy, ex, ey, warnUntil: Date.now() + 400 });
  startAnim();
}

function scheduleAsteroid() { // self-rescheduling spawner; skips (but survives) boss/pause
  clearTimeout(asteroidTimer);
  const next = () => 2000 + Math.random()*1000;
  asteroidTimer = setTimeout(function tick() {
    if (!_asteroidsEnabled() || !alive) { asteroidTimer = null; return; } // [2.0-s3.1]
    if (!bossRound && !fabPaused) _spawnAsteroid();
    asteroidTimer = setTimeout(tick, next());
  }, next());
}

function _drawAstWarning(a, now) {
  const cx = (a.ex + 0.5) * cellSize, cy = (a.ey + 0.5) * cellSize;
  const blink = 0.4 + 0.6*Math.abs(Math.sin(now*0.012));
  ctx.save();
  ctx.globalAlpha = blink;
  ctx.fillStyle = '#ff2200';
  ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 8;
  ctx.translate(cx, cy);
  ctx.rotate(Math.atan2(a.dirY, a.dirX));
  const s = cellSize*0.42;
  ctx.beginPath();
  ctx.moveTo(s, 0); ctx.lineTo(-s*0.4, s*0.6); ctx.lineTo(-s*0.4, -s*0.6); ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function _drawAstRock(gx, gy, a, now) {
  const cx = (gx + 0.5) * cellSize, cy = (gy + 0.5) * cellSize;
  // fading trail behind
  for (let k = 1; k <= 4; k++) {
    const tx = (gx - a.dirX*k*0.6 + 0.5) * cellSize, ty = (gy - a.dirY*k*0.6 + 0.5) * cellSize;
    ctx.globalAlpha = 0.20 * (1 - k/5);
    ctx.fillStyle = '#ff4400';
    ctx.beginPath(); ctx.arc(tx, ty, cellSize*0.30*(1-k/6), 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 10;
  ctx.fillStyle = '#554433';
  const r = cellSize*0.38;
  const jag = [1,0.7,1,0.65,0.95,0.7,1,0.6];
  ctx.beginPath();
  for (let i=0;i<8;i++){ const ang=(i/8)*Math.PI*2; const rr=r*jag[i];
    const px=cx+Math.cos(ang)*rr, py=cy+Math.sin(ang)*rr;
    if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#332211'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

function drawAsteroids(now) {
  // despawn once fully off the far edge
  asteroids = asteroids.filter(a => {
    const t = now - a.warnUntil;
    const gx = a.sx + a.dirX*ASTEROID_SPEED*t, gy = a.sy + a.dirY*ASTEROID_SPEED*t;
    return !((a.dirX>0&&gx>N+1)||(a.dirX<0&&gx<-1)||(a.dirY>0&&gy>N+1)||(a.dirY<0&&gy<-1));
  });
  for (const a of asteroids) {
    if (now < a.warnUntil) { _drawAstWarning(a, now); continue; }
    const t = now - a.warnUntil;
    const gx = a.sx + a.dirX*ASTEROID_SPEED*t, gy = a.sy + a.dirY*ASTEROID_SPEED*t;
    _drawAstRock(gx, gy, a, now);
    const cx = Math.floor(gx), cy = Math.floor(gy);
    if (cx>=0&&cx<N&&cy>=0&&cy<N && cx===cube.x && cy===cube.y
        && !blackHoleAnimating && !(testerActive && tNoclip) && !customGame && !tutorialActive) { // [2.0-s3.2] immortal in sandbox [2.0-s4h]
      die('asteroid'); return;
    }
  }
}

// ══════════════════════════════════════════════════
// [2.0-s2] BLACK HOLE TELEPORT (World 2 long-range move)
// ══════════════════════════════════════════════════
function _resetBlackHole() {
  clearTimeout(_bhTimer); _bhTimer = null; _bhFiresAt = 0; _bhRemaining = 0;
  blackHoleAnimating = false; blackHole = null;
}

function updateBlackHoleHud() { // [2.0-s2] cooldown indicator, World 2 only
  if (!hudBlackhole) return;
  if (!_blackHoleEnabled()) { hudBlackhole.style.display = 'none'; return; } // [2.0-s3.1]
  hudBlackhole.style.display = '';
  if (testerActive && tInfBlackHole) { hudBlackhole.textContent = '⚫ ∞'; hudBlackhole.className = 'bh-ready'; return; } // [2.0-s4d]
  if (w2Boss && bossRound) { // [2.0-s4g] time-based countdown during W2 boss
    const msLeft = blackHoleReadyAt - Date.now();
    if (msLeft <= 0) { hudBlackhole.textContent = '⚫ Ready'; hudBlackhole.className = 'bh-ready'; }
    else { hudBlackhole.textContent = `⚫ ${Math.ceil(msLeft/1000)}s`; hudBlackhole.className = 'bh-cooldown'; }
  } else {
    if (blackHoleCooldown <= 0) { hudBlackhole.textContent = '⚫ Ready'; hudBlackhole.className = 'bh-ready'; }
    else { hudBlackhole.textContent = `⚫ ${blackHoleCooldown}r`; hudBlackhole.className = 'bh-cooldown'; }
  }
}

function _bhParticles(gx, gy, inward) {
  const cx = (gx+0.5)*cellSize, cy = (gy+0.5)*cellSize;
  for (let i=0;i<14;i++){
    const ang = Math.random()*Math.PI*2, spd = 60 + Math.random()*90;
    if (inward) {
      const dist = cellSize*0.9;
      particles.push({ x: cx+Math.cos(ang)*dist, y: cy+Math.sin(ang)*dist,
        vx: -Math.cos(ang)*spd, vy: -Math.sin(ang)*spd,
        color: 'hsla(275,80%,70%,1)', size: 2+Math.random()*3, born: Date.now(), life: 230+Math.random()*70 });
    } else {
      particles.push({ x: cx, y: cy, vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd,
        color: 'hsla(285,90%,75%,1)', size: 2+Math.random()*4, born: Date.now(), life: 300+Math.random()*120 });
    }
  }
  startAnim();
}

function startBlackHole(tx, ty) {
  blackHole = { born: Date.now(), origin: { x: cube.x, y: cube.y }, dest: { x: tx, y: ty } };
  blackHoleAnimating = true;
  _bhParticles(cube.x, cube.y, true);
  cube.x = tx; cube.y = ty; // logic moves now; visuals are owned by drawBlackHole
  playBlackHole();
  _bhFiresAt = Date.now() + 500;
  _bhTimer = setTimeout(_bhFinish, 500);
  setTimeout(() => { if (blackHoleAnimating) _bhParticles(tx, ty, false); }, 250);
  startAnim();
}

function _bhFinish() {
  _bhTimer = null; _bhFiresAt = 0;
  blackHoleAnimating = false; blackHole = null;
  if (!alive) return;
  if (w2Boss && bossRound) { // [2.0-s4g] time-based cooldown during W2 boss
    blackHoleReadyAt = (customGame || (testerActive && tInfBlackHole)) ? 0 : Date.now() + 10000;
  } else {
    blackHoleCooldown = (customGame || (testerActive && tInfBlackHole)) ? 0 : 3; // [2.0-s3.3][2.0-s4d]
  }
  if (w2Boss) _w2OnPlayerMoved(); // [2.0-s4e] teleporting onto a hit plate / crater registers like a dash landing
  render();
}

function _bhHoleR(t, a, b, c, e) { // radius envelope: 0 at a, full b..c, 0 at e
  const max = cellSize*0.78;
  if (t < a || t > e) return 0;
  if (t < b) return max * (t-a)/(b-a);
  if (t > c) return max * (1-(t-c)/(e-c));
  return max;
}

function _drawHole(cx, cy, r, now) {
  if (r <= 0) return;
  ctx.save();
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, '#000'); g.addColorStop(0.7, '#1a0030'); g.addColorStop(1, 'rgba(40,0,80,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'rgba(180,80,255,.7)'; ctx.lineWidth = 1.5;
  const rot = now*0.012;
  for (let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(cx, cy, r*0.7, rot+i*2.1, rot+i*2.1+1.2); ctx.stroke(); }
  ctx.restore();
}

function drawBlackHole(now) {
  if (!blackHole) return;
  const t = now - blackHole.born;
  const o = blackHole.origin, d = blackHole.dest;
  const ocx = (o.x+0.5)*cellSize, ocy = (o.y+0.5)*cellSize;
  const dcx = (d.x+0.5)*cellSize, dcy = (d.y+0.5)*cellSize;
  _drawHole(ocx, ocy, _bhHoleR(t, 0, 250, 450, 500), now);   // origin hole
  _drawHole(dcx, dcy, _bhHoleR(t, 250, 350, 450, 500), now); // destination hole
  // player: shrink at origin (100–250), grow at dest (350–450)
  let scale, px, py;
  if (t < 100)      { scale = 1;                 px = ocx; py = ocy; }
  else if (t < 250) { scale = 1 - (t-100)/150;   px = ocx; py = ocy; }
  else if (t < 350) { scale = 0;                 px = dcx; py = dcy; }
  else if (t < 450) { scale = (t-350)/100;       px = dcx; py = dcy; }
  else              { scale = 1;                 px = dcx; py = dcy; }
  if (scale > 0.01) {
    const sz = cellSize * scale;
    ctx.drawImage(getSkinCanvas(skinAnimT), px - sz/2, py - sz/2, sz, sz);
  }
}

// ══════════════════════════════════════════════════
// DASH
// ══════════════════════════════════════════════════
let _dashPressX = -1, _dashPressY = -1; // [2.0-s4] cell where the dash was first pressed (target locked on press)
function tryDash(x,y) {
  if (!alive) return;
  if (fabPaused) return; // [1.10.2] no input while FAB menu is open
  if (blackHoleAnimating) return; // [2.0-s2] input locked during teleport
  if (_w2Pulling) return; // [2.0-s4c] input locked while a gravity/black-hole pull is animating
  if (x===cube.x&&y===cube.y) return;

  const dx=x-cube.x, dy=y-cube.y, d=Math.abs(dx)+Math.abs(dy);

  // [2.0-s4f] SINGULARITY black-hole blocks — clicking within 5 cells of any active hole yanks you toward the closest one
  {
    const _now = Date.now();
    let _nearest = null, _nearDist = Infinity;
    for (const h of w2BhBlocks) {
      if (_now >= h.until) continue;
      const d = Math.abs(x - h.x) + Math.abs(y - h.y);
      if (d <= 5 && d < _nearDist) { _nearest = h; _nearDist = d; }
    }
    if (_nearest) {
      _bhParticles(_nearest.x, _nearest.y, true);
      playSound('dash');
      _w2PullPlayer(_nearest.x, _nearest.y, 3);
      render();
      return;
    }
  }

  // [2.0-s2] World 2: long-range click = Black Hole teleport (independent of dashesLeft)
  if (_blackHoleEnabled() && d > DASH_RANGE) { // [2.0-s3.1]
    if (w2Boss && bossRound) { // [2.0-s4g] time-based gate during W2 boss
      if (Date.now() < blackHoleReadyAt && !(testerActive && tInfBlackHole)) { flash('⚫ NOT READY'); return; }
    } else {
      if (blackHoleCooldown > 0 && !(testerActive && tInfBlackHole)) { flash('⚫ NOT READY'); return; } // [2.0-s4d]
    }
    const dest = `${x},${y}`;
    if (getBossCells().has(dest) || bossShockwaveCells.has(dest) || flareCellHas(x,y)) { flash('💥 Blocked!'); return; }
    startBlackHole(x, y);
    return;
  }

  if (dashesLeft<=0 && !(testerActive && tDashInf) && !bossRound && !customGame && !tutorialActive){flash('No dash available!');return;} // [1.9][1.11][2.0-s3.3][2.0-s4h]
  const prevX=cube.x, prevY=cube.y;

  if (d<=DASH_RANGE) { cube.x=x; cube.y=y; }
  else {
    const sx=Math.round(DASH_RANGE*Math.abs(dx)/d), sy=DASH_RANGE-sx;
    cube.x=Math.max(0,Math.min(N-1,cube.x+Math.sign(dx)*sx));
    cube.y=Math.max(0,Math.min(N-1,cube.y+Math.sign(dy)*sy));
  }

  // [1.11] Block dash into boss cells or active shockwave
  if (bossActive || bossShockwaveCells.size > 0) {
    const dest = `${cube.x},${cube.y}`;
    if (getBossCells().has(dest) || bossShockwaveCells.has(dest)) {
      cube.x = prevX; cube.y = prevY;
      flash('💥 Blocked!');
      render();
      return;
    }
  }

  spawnDashParticles(prevX, prevY); // [1.9.3]
  spawnTrail(prevX, prevY, cube.x, cube.y);
  playSound('dash');
  if (!bossRound && !customGame && !tutorialActive) dashesLeft--; // [1.11][2.0-s3.3][2.0-s4h] unlimited dashes during boss / sandbox / tutorial

  // near miss — check if laser fire is on adjacent cell
  for (const L of lasers) {
    if (L.state !== 'fire') continue;
    const onRow = L.type==='row' && Math.abs(cube.y - L.idx) === 1;
    const onCol = L.type==='col' && Math.abs(cube.x - L.idx) === 1;
    if (onRow || onCol) { playSound('near_miss'); break; }
  }

  checkDeathByLaser();
  if (w2Boss) _w2OnPlayerMoved(); // [2.0-s4b] plate-step + crater death after the move
  if (tutorialActive) _tutOnDash(); // [2.0-s4h] advance the scripted tutorial on the player's dash
  render();
}

// ══════════════════════════════════════════════════
// BLOCKS
// ══════════════════════════════════════════════════
function _genLasers(total) { // [2.0-s3.2] build a fresh laser set into `lasers` (extracted from startRound)
  lasers=[]; const uR=new Set(), uC=new Set();
  const rng = _dailyRng || Math.random; // [1.10]
  if (rng()<.5){lasers.push({type:'row',idx:cube.y,state:'charge'});uR.add(cube.y);} // [1.10]
  else         {lasers.push({type:'col',idx:cube.x,state:'charge'});uC.add(cube.x);}
  for (let i=1;i<total;i++) {
    if (i%2===0){let idx;do{idx=Math.floor(rng()*N);}while(uR.has(idx));uR.add(idx);lasers.push({type:'row',idx,state:'charge'});} // [1.10]
    else        {let idx;do{idx=Math.floor(rng()*N);}while(uC.has(idx));uC.add(idx);lasers.push({type:'col',idx,state:'charge'});}
  }
}

function generateBlocks(countOverride) { // [2.0-s3.2] optional count for the sandbox
  const rng = _dailyRng || Math.random; // [1.10]
  const count = countOverride ?? Math.min(1+Math.floor((round-1)/BLOCK_INTERVAL), MAX_BLOCKS);
  blocks = [];
  const occ = new Set([`${cube.x},${cube.y}`]);
  for (const L of lasers) {
    if (L.type==='row') for (let x=0;x<N;x++) occ.add(`${x},${L.idx}`);
    else                for (let y=0;y<N;y++) occ.add(`${L.idx},${y}`);
  }
  for (let i=0;i<count;i++) {
    let x,y,k,t=0;
    do { x=Math.floor(rng()*N); y=Math.floor(rng()*N); k=`${x},${y}`; t++; } // [1.10]
    while (occ.has(k)&&t<200);
    if (t<200){occ.add(k);blocks.push({x,y,state:'charge'});}
  }
}

// ══════════════════════════════════════════════════
// [2.0-s3.2] CUSTOM GAME SANDBOX — immortal, no rounds/coins/stats, live hazards
// ══════════════════════════════════════════════════
function _customStart() {
  clearTimeout(phaseTimer);
  flash('🧪 SANDBOX');
  if (_asteroidsEnabled() && !asteroidTimer) scheduleAsteroid();
  _customCycle();
}

function _customCycle() { // continuous charge→fire→clear loop; never awards or kills
  if (!alive || !customGame) return;
  clearTimeout(phaseTimer);
  lasers = []; blocks = [];
  if (customCfg.lasers) _genLasers(6); // fixed sandbox count
  if (customCfg.blocks) generateBlocks(4); // fixed sandbox count
  const sm = ((testerActive && tSlow) ? 4 : 1) / (testerActive ? Math.max(0.01, tSpeedMult) : 1);
  const charge = CHARGE_START * sm, firems = FIRE_MS * sm, gapms = GAP_MS * sm;
  if (currentWorld === 2) { _flareChargeStart = Date.now(); _flareChargeDur = charge; }
  render();
  if (customCfg.lasers) { currentWorld === 2 ? playSolarFlareCharge() : playSound('laser_charge'); } // [2.0-s3.3] hazard sound
  phaseTimer = _schedulePhase(() => {
    if (!alive || !customGame) return;
    for (const L of lasers) L.state = 'fire';
    if (currentWorld === 2) { _flareFireStart = Date.now(); _flareFireDur = firems; }
    for (const b of blocks) { b.state = 'land'; spawnBlockImpact(b.x, b.y); }
    render();
    if (customCfg.lasers) { currentWorld === 2 ? playSolarFlareRelease() : playSound('laser_fire'); } // [2.0-s3.3] hazard sound (no survival sounds)
    phaseTimer = _schedulePhase(() => {
      if (!alive || !customGame) return;
      lasers = []; blocks = []; render();
      phaseTimer = _schedulePhase(_customCycle, gapms);
    }, firems);
  }, charge);
}

function _customApplyToggles() { // live hazard apply when a toggle is flipped mid-sandbox
  if (!customGame || !alive) return;
  if (!customCfg.lasers) lasers = [];
  if (!customCfg.blocks) blocks = [];
  if (customCfg.asteroids) { if (!asteroidTimer) scheduleAsteroid(); }
  else { asteroids = []; clearTimeout(asteroidTimer); asteroidTimer = null; }
  updateBlackHoleHud();
  render();
}

// ══════════════════════════════════════════════════
// ROUNDS
// ══════════════════════════════════════════════════
function _schedulePhase(fn, ms) { // [1.10.2] tracks pending phase for FAB pause/resume
  _phaseFn = fn;
  _phaseFiresAt = Date.now() + ms;
  return setTimeout(fn, ms);
}

// ══════════════════════════════════════════════════
// [2.0-s3] ROUND RANDOMIZER — one-round modifiers
// ══════════════════════════════════════════════════
const ROUND_MODS = [
  { id:'double_coins', name:'DOUBLE COINS', hint:'×2 reward this round', category:'BUFF',      weight:3,
    onStart(){ roundCoinMult = 2; }, onEnd(){} },
  { id:'extra_dash',   name:'EXTRA DASH',   hint:'+2 dashes this round', category:'BUFF',      weight:3,
    onStart(){ dashesLeft += 2; },  onEnd(){} },
  { id:'combo_boost',  name:'COMBO BOOST',  hint:'combo builds faster',  category:'BUFF',      weight:2,
    onStart(){ comboStep = 2; },    onEnd(){} },
  { id:'fast_lasers',  name:'FAST OBSTACLES', hint:'+50% speed · ×2 reward', category:'CHALLENGE', weight:1,
    onStart(){ roundSpeedMult = 1.5; roundCoinMult = 2; }, onEnd(){} },
  { id:'grid_glitch',  name:'GRID GLITCH',  hint:'lightning bolt · ×1.5 reward', category:'COSMETIC', weight:2,
    onStart(){ roundCoinMult = 1.5; if (!boardTear) { _setBoardTear(); _boltStrike(); } document.getElementById('board-wrap')?.classList.add('board-tear'); }, // [2.0-s3.4] shake once on activation
    onEnd(){ _clearBoardTear(); } },
];

// [2.0-s3.4] Grid Glitch — jagged lightning bolt across the board at a random angle (cosmetic only).
// Two slabs share the jagged seam and offset in opposite, bolt-perpendicular directions (displaced
// halves); a bright SVG polyline traces the bolt. Shape is fixed for the modifier's whole duration.
function _setBoardTear() {
  const wrap = document.getElementById('board-wrap');
  if (!wrap) return;
  const vertical = Math.random() < 0.5;          // true: bolt runs top→bottom (splits L/R)
  const K = 6 + Math.floor(Math.random()*3);     // 6–8 jagged interior vertices
  const a0 = 25 + Math.random()*50;              // entry cross-coord (%)
  const a1 = 25 + Math.random()*50;              // exit  cross-coord (%) — random ends ⇒ never a clean 45°
  const jit = 11;                                // perpendicular jitter amplitude (%)
  const pts = [];                                // ordered edge→opposite-edge, {x,y} in 0–100
  for (let i = 0; i <= K+1; i++) {
    const t = i / (K+1);
    const main = t * 100;                                          // along the crossing axis
    let cross = a0 + (a1 - a0) * t;                                // linear base across the board
    if (i > 0 && i <= K) cross += (Math.random()*2 - 1) * jit;     // jitter interior vertices only
    cross = Math.max(4, Math.min(96, cross));
    pts.push(vertical ? { x:cross, y:main } : { x:main, y:cross });
  }
  const poly = arr => arr.map(p => `${p.x.toFixed(1)}% ${p.y.toFixed(1)}%`).join(', ');
  let aPts, bPts, ox, oy;
  if (vertical) {                                // halves = left / right; pull apart horizontally
    aPts = [{x:0,y:0},   ...pts, {x:0,y:100}];
    bPts = [{x:100,y:0}, ...pts, {x:100,y:100}];
    ox = '6.25%'; oy = '0%';                      // 1 cell width (100%/16) — clearly visible split
  } else {                                       // halves = top / bottom; pull apart vertically
    aPts = [{x:0,y:0},   ...pts, {x:100,y:0}];
    bPts = [{x:0,y:100}, ...pts, {x:100,y:100}];
    ox = '0%'; oy = '6.25%';                      // 1 cell height
  }
  wrap.style.setProperty('--tear-a', `polygon(${poly(aPts)})`);
  wrap.style.setProperty('--tear-b', `polygon(${poly(bPts)})`);
  wrap.style.setProperty('--tear-ox', ox);
  wrap.style.setProperty('--tear-oy', oy);
  const line = document.getElementById('bolt-line');             // bright seam traces the bolt
  if (line) line.setAttribute('points', pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
  boardTear = { vertical, points: pts };
}
let _boltStrikeTimer = null; // [2.0-s3.4]
function _boltStrike() { // [2.0-s3.4] one-shot screen shake — "lightning strikes the board"
  const wrap = document.getElementById('board-wrap');
  if (!wrap) return;
  wrap.classList.remove('bolt-strike'); void wrap.offsetWidth; // restart the animation
  wrap.classList.add('bolt-strike');
  clearTimeout(_boltStrikeTimer);
  _boltStrikeTimer = setTimeout(() => wrap.classList.remove('bolt-strike'), 480);
}
function _clearBoardTear() { // [2.0-s3.4]
  boardTear = null;
  const wrap = document.getElementById('board-wrap');
  if (wrap) {
    wrap.classList.remove('board-tear', 'bolt-strike');
    wrap.style.removeProperty('--tear-a'); wrap.style.removeProperty('--tear-b');
    wrap.style.removeProperty('--tear-ox'); wrap.style.removeProperty('--tear-oy');
  }
  const line = document.getElementById('bolt-line');
  if (line) line.setAttribute('points', '');
}

function _pickRoundMod() { // weighted random — favors BUFF/COSMETIC, CHALLENGE rare
  const total = ROUND_MODS.reduce((s,m)=>s+m.weight,0);
  let r = Math.random() * total;
  for (const m of ROUND_MODS) { if ((r -= m.weight) < 0) return m; }
  return ROUND_MODS[0];
}

function _tickRoundMod() { // [2.0-s3.1] per-round factor reset + multi-round duration handling
  roundCoinMult = 1; roundSpeedMult = 1; comboStep = 1; // reset per-round factors
  if (activeMod) {
    _modRoundsLeft--;
    if (_modRoundsLeft <= 0) { activeMod.onEnd(); activeMod = null; _roundsSinceMod = 0; } // cooldown counts from end
    else activeMod.onStart(); // re-apply effect for this round
  } else _roundsSinceMod++;
}

function _activateRoundMod(mod) { // [2.0-s3.1] shared by auto-roll and tester trigger
  activeMod = mod;
  _modRoundsLeft = 2 + Math.floor(Math.random()*2); // 2 or 3 rounds
  mod.onStart();
  showModBanner(mod, _modRoundsLeft);
}

function _clearActiveMod() { // [2.0-s3.1] force-end any active modifier (boss/GRIDLOCK onset)
  if (activeMod) { activeMod.onEnd(); activeMod = null; _roundsSinceMod = 0; }
  _modRoundsLeft = 0; roundCoinMult = 1; roundSpeedMult = 1; comboStep = 1;
}

function _resetRoundMods() { // [2.0-s3] full reset on game start / death
  if (activeMod) { activeMod.onEnd(); activeMod = null; }
  roundCoinMult = 1; roundSpeedMult = 1; comboStep = 1; _roundsSinceMod = 99; _modRoundsLeft = 0; // [2.0-s3.1]
  _clearBoardTear(); // [2.0-s3.2]
}

function _maybeStartRoundMod() { // [2.0-s3] called from startRound after the boss intercept
  if (activeMod) return; // [2.0-s3.1] one at a time
  const eligible = gameMode === null && !bossRound && !gridlockActive
    && round > 3 && _roundsSinceMod >= 4 && Math.random() < 0.15; // [2.0-s3.1] cooldown 2→4
  if (!eligible) return;
  _activateRoundMod(_pickRoundMod());
}

let _modBannerTimer = null;
function showModBanner(mod, duration) { // [2.0-s3] brief center banner naming the modifier
  const el = document.getElementById('round-mod-banner');
  if (!el) return;
  el.innerHTML = `<div class="rmb-name">⚡ ${mod.name}! (${duration} round${duration>1?'s':''})</div><div class="rmb-hint">${mod.hint}</div>`; // [2.0-s3.1] show duration
  el.classList.remove('show'); void el.offsetWidth; // restart animation
  el.classList.add('show');
  const wrap = document.getElementById('board-wrap');
  if (wrap) { wrap.classList.add('mod-flash'); setTimeout(() => wrap.classList.remove('mod-flash'), 400); }
  clearTimeout(_modBannerTimer);
  _modBannerTimer = setTimeout(() => el.classList.remove('show'), 1200);
}

function triggerRoundMod(id) { // [2.0-s3.1] tester: manually activate a modifier (respects the same blocks)
  if (!alive) return;
  if (bossRound)         { showFabFeedback('⛔ Blocked during boss');      return; }
  if (gridlockActive)    { showFabFeedback('⛔ Blocked during GRIDLOCK');  return; }
  if (gameMode !== null) { showFabFeedback('⛔ Blocked in this mode');      return; }
  const mod = ROUND_MODS.find(m => m.id === id);
  if (!mod) return;
  if (activeMod) { activeMod.onEnd(); activeMod = null; } // replace any active modifier
  _activateRoundMod(mod);
}

// ══════════════════════════════════════════════════
// GRIDLOCK MODE // [1.12]
// ══════════════════════════════════════════════════

function _endGridlockMode(natural) { // [1.12]
  if (!gridlockActive) return;
  gridlockActive = false; gridlockRoundsLeft = 0;
  clearInterval(_glitchTimer); _glitchTimer = null;
  const wrap = document.getElementById('board-wrap');
  if (wrap) wrap.classList.remove('gridlock-glitch-fx');
  if (hudGridlock) hudGridlock.style.display = 'none';
  if (natural) { flash('⚡ GRIDLOCK END'); playGridlockEnd(); }
}

function showGridlockEntry() { // [1.12]
  flash('⚡ GRIDLOCK MODE!');
  const wrap = document.getElementById('board-wrap');
  if (wrap) {
    wrap.classList.add('gridlock-entry-flash');
    setTimeout(() => wrap.classList.remove('gridlock-entry-flash'), 250);
  }
}

function activateGridlockMode() { // [1.12]
  if (!alive || bossActive) return;
  _clearActiveMod(); // [2.0-s3.1] a round modifier can't bleed into GRIDLOCK
  gridlockActive = true; gridlockRoundsLeft = 5;
  showGridlockEntry();
  playGridlockStart();
  clearInterval(_glitchTimer);
  _glitchTimer = setInterval(() => {
    if (!gridlockActive) { clearInterval(_glitchTimer); _glitchTimer = null; return; }
    const wrap = document.getElementById('board-wrap');
    if (wrap) { wrap.classList.add('gridlock-glitch-fx'); setTimeout(() => wrap.classList.remove('gridlock-glitch-fx'), 130); }
  }, 500);
  if (hudGridlock) { hudGridlock.style.display = ''; hudGridlock.textContent = `⚡ GRIDLOCK x${gridlockRoundsLeft}`; }
  if (testerActive) renderFabMenu();
}

// ══════════════════════════════════════════════════
// BOSS SYSTEM // [1.11]
// ══════════════════════════════════════════════════

function _bossSize() { return w2Boss ? w2Boss.size : (BOSS_CONFIG[bossTier] ? BOSS_CONFIG[bossTier].size : 0); } // [2.0-s4b] W1 or W2 boss footprint

function getBossCells() { // [1.11]
  if (!bossActive) return new Set();
  const sz = _bossSize(); // [2.0-s4b]
  const s = new Set();
  for (let dy = 0; dy < sz; dy++)
    for (let dx = 0; dx < sz; dx++)
      s.add(`${bossX + dx},${bossY + dy}`); // [2.0-s4] live position
  return s;
}

function _cleanupBoss() { // [1.11]
  clearInterval(bossTimer);      bossTimer = null;
  clearTimeout(bossThrowTimer);  bossThrowTimer = null; // [2.0-s4] throw loop is now a self-rescheduling timeout
  clearTimeout(bossPressureTimer); bossPressureTimer = null; _bossPressureCount = 0; // [2.0-s4d] stop the pressure burst loop
  bossAttackTimers.forEach(h => { clearTimeout(h); clearInterval(h); });
  bossAttackTimers = [];
  bossRound = false;
  bossActive = false;
  bossShockwaveCells = new Set();
  blocks = blocks.filter(b => !b.bossThrow && !b.bossRain && !b.bossPressure);
  // [2.0-s4b] clear all World-2 boss state
  w2Boss = null; w2SpeedMult = 1; bossHitsLeft = 0; bossShieldUntil = 0;
  hitPlate = null; turret = null; w2BhBlocks = []; _w2PowerBusyUntil = 0; _w2Pulling = false; // [2.0-s4f]
  destroyedCells = new Set(); w2SpinState = null; w2SpinCells = new Set();
  w2Beam = null; w2GravityWarn = null; w2Star = null; w2StarShock = null; _blockAttackPauseUntil = 0; // [2.0-s4e]
}

function _bossPushPlayer() { // [2.0-s2] if a boss spawns on the player, shove them clear (no damage)
  const bcells = getBossCells();
  if (!bcells.has(`${cube.x},${cube.y}`)) return;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  for (let i=dirs.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [dirs[i],dirs[j]]=[dirs[j],dirs[i]]; }
  for (const [dx,dy] of dirs) { // try pushing 4 cells in a random valid direction
    const nx = cube.x + dx*4, ny = cube.y + dy*4;
    if (nx>=0&&nx<N&&ny>=0&&ny<N && !bcells.has(`${nx},${ny}`)) { cube.x=nx; cube.y=ny; _bossPushFlash(); return; }
  }
  for (let r=1;r<N;r++) { // fallback: nearest free non-boss cell
    for (let dy=-r;dy<=r;dy++) for (let dx=-r;dx<=r;dx++) {
      if (Math.abs(dx)+Math.abs(dy)!==r) continue;
      const nx=cube.x+dx, ny=cube.y+dy;
      if (nx>=0&&nx<N&&ny>=0&&ny<N && !bcells.has(`${nx},${ny}`)) { cube.x=nx; cube.y=ny; _bossPushFlash(); return; }
    }
  }
}
function _bossPushFlash() { // [2.0-s2]
  flash('💨 Pushed!');
  spawnDashParticles(cube.x, cube.y);
}

function startBossRound(tier) { // [1.11]
  if (gridlockActive) _endGridlockMode(false); // [1.12] boss overrides GRIDLOCK
  _clearActiveMod(); // [2.0-s3.1] a round modifier can't bleed into a boss round
  _cleanupBoss(); // reset any prior state
  bossRound    = true;
  bossActive   = false;
  bossTier     = tier;
  bossX        = BOSS_CONFIG[tier].gridX; // [2.0-s4] spawn at the configured position; may drift later
  bossY        = BOSS_CONFIG[tier].gridY; // [2.0-s4]
  bossTimeLeft = 20;
  lasers = []; blocks = [];
  asteroids = []; clearTimeout(asteroidTimer); asteroidTimer = null; // [2.0-s2] asteroids pause during boss
  if (hudTimerEl) { hudTimerEl.style.display = ''; hudTimerEl.textContent = '⏱ 20s'; hudTimerEl.className = ''; }
  flash('👾 BOSS INCOMING!');
  render(); startAnim();
  bossAttackTimers.push(setTimeout(() => {
    if (!alive || !bossRound) return;
    bossActive = true;
    _bossPushPlayer(); // [2.0-s2] shove player out of boss cells on spawn
    flash(`👾 ${BOSS_CONFIG[tier].name}`);
    render();
    // [2.0-s4] self-rescheduling throw loop with ±20% timing jitter
    _scheduleBossThrow();
    // [2.0-s4d] pressure burst: 5 blocks (1/s) on the player's cell, then a 5s pause, repeating
    _bossPressureCount = 0; bossPressureTimer = setTimeout(_bossPressureTick, 1000);
    // tier 2+ extras
    if (tier >= 2) _scheduleBossRain();
    if (tier >= 2) _scheduleBossShockwave();
    // countdown
    bossTimer = setInterval(() => {
      if (!alive || !bossRound) { clearInterval(bossTimer); return; }
      if (fabPaused) return;
      bossTimeLeft--;
      if (hudTimerEl) {
        hudTimerEl.textContent = `⏱ ${bossTimeLeft}s`;
        hudTimerEl.className = bossTimeLeft <= 5 ? 'urgent' : '';
      }
      if (bossTimeLeft <= 0) { clearInterval(bossTimer); bossVictory(); }
    }, 1000);
  }, 1500));
}

function _scheduleBossThrow() { // [2.0-s4] throw loop with ±20% timing jitter (replaces fixed 1s interval)
  clearTimeout(bossThrowTimer);
  bossThrowTimer = setTimeout(_bossTick, 1000 * (0.8 + Math.random() * 0.4));
}

let _blockAttackPauseUntil = 0; // [2.0-s4e] while now < this, ALL block attacks (pressure/throw/rain) are halted
function _blocksPaused() { return Date.now() < _blockAttackPauseUntil; } // [2.0-s4e]
let _bossPressureCount = 0; // [2.0-s4e] burst counter — 5 hits then a 6s pause
function _bossPressureTick() { // [2.0-s4e] pressure burst — one block on the player's cell, 5×(1/s) then 6s pause (W1 + W2)
  if (!alive || !bossRound) return; // loop stops (no reschedule)
  if (fabPaused) { bossPressureTimer = setTimeout(_bossPressureTick, 300); return; } // hold during pause
  blocks = blocks.filter(b => !b.bossPressure); // clear previous pressure block
  const b = { x: cube.x, y: cube.y, state: 'charge', bossPressure: true };
  blocks.push(b);
  render();
  bossAttackTimers.push(setTimeout(() => {
    if (!alive || !bossRound) return;
    b.state = 'land'; spawnBlockImpact(b.x, b.y);
    render(); checkDeathByBlock();
    bossAttackTimers.push(setTimeout(() => { // [2.0-s4e] clear the landed block so the pause reads as a real break
      blocks = blocks.filter(x => x !== b);
      if (alive && bossRound) render();
    }, 250));
  }, 600));
  _bossPressureCount++;
  let wait;
  if (_bossPressureCount >= 5) { // [2.0-s4e] 5 hits → 6s pause that halts ALL block attacks
    _bossPressureCount = 0; wait = 6000;
    _blockAttackPauseUntil = Date.now() + 6000;
    blocks = blocks.filter(b => !b.bossThrow && !b.bossRain); // wipe in-flight throw/rain telegraphs
  } else { wait = 1000; }
  bossPressureTimer = setTimeout(_bossPressureTick, wait);
}

function _bossTargetOrigin(sz) { // [2.0-s4] random landing origin within 5 cells (Manhattan) of the player
  let ddx, ddy;
  do { ddx = Math.floor(Math.random() * 11) - 5; ddy = Math.floor(Math.random() * 11) - 5; }
  while (Math.abs(ddx) + Math.abs(ddy) > 5);
  const tx = cube.x + ddx, ty = cube.y + ddy;
  return [ Math.max(0, Math.min(N - sz, tx - Math.floor(sz / 2))),
           Math.max(0, Math.min(N - sz, ty - Math.floor(sz / 2))) ];
}

function _fireBossAttack() { // [2.0-s4] one attack: random target, ~30% fake telegraph (charge ≠ land)
  if (!alive || !bossRound) return;
  const sz = _bossSize(); // [2.0-s4b] W1 or W2 footprint
  const [lox, loy] = _bossTargetOrigin(sz);              // where it actually lands
  let [tox, toy] = [lox, loy];                           // where it telegraphs
  if (Math.random() < 0.30) [tox, toy] = _bossTargetOrigin(sz); // fake-out: charge elsewhere
  const chargeBlocks = [];
  for (let dy = 0; dy < sz; dy++)
    for (let dx = 0; dx < sz; dx++)
      chargeBlocks.push({ x: tox + dx, y: toy + dy, state: 'charge', bossThrow: true });
  blocks.push(...chargeBlocks);
  const t = setTimeout(() => {
    if (!alive || !bossRound) return;
    blocks = blocks.filter(b => !chargeBlocks.includes(b)); // drop this attack's telegraph
    if (_blocksPaused()) { if (alive) render(); return; } // [2.0-s4e] pause started mid-charge → cancel the land
    for (let dy = 0; dy < sz; dy++)
      for (let dx = 0; dx < sz; dx++) {
        blocks.push({ x: lox + dx, y: loy + dy, state: 'land', bossThrow: true });
        spawnBlockImpact(lox + dx, loy + dy);
      }
    render(); checkDeathByBlock();
  }, 600);
  bossAttackTimers.push(t);
}

function _maybeMoveBoss() { // [2.0-s4] occasionally drift the boss 1–2 cells (positional only, size unchanged)
  if (Math.random() > 0.4) return;
  const sz = _bossSize(); // [2.0-s4b]
  const step = 1 + Math.floor(Math.random() * 2); // 1 or 2 cells
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  for (let i = dirs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [dirs[i], dirs[j]] = [dirs[j], dirs[i]]; }
  for (const [dx, dy] of dirs) {
    const nx = Math.max(0, Math.min(N - sz, bossX + dx * step));
    const ny = Math.max(0, Math.min(N - sz, bossY + dy * step));
    if (nx === bossX && ny === bossY) continue;
    bossX = nx; bossY = ny; break;
  }
  if (getBossCells().has(`${cube.x},${cube.y}`)) _bossPushPlayer(); // don't trap the player under the boss
}

function _bossTick() { // [1.11][2.0-s4] — jittered throw loop: drift + two simultaneous attacks
  if (!alive || !bossRound) return; // loop stops (no reschedule)
  if (fabPaused) { _scheduleBossThrow(); return; } // hold cadence while paused
  if (_blocksPaused()) { _scheduleBossThrow(); return; } // [2.0-s4e] no throws during the block-attack pause
  blocks = blocks.filter(b => !b.bossThrow); // clear previous throw warnings
  _maybeMoveBoss();
  _fireBossAttack();
  _fireBossAttack(); // two attacks at once
  render();
  _scheduleBossThrow();
}

function _scheduleBossRain() { // [1.11] — once per fight, random 4–16 s
  const delay = 4000 + Math.random() * 12000;
  bossAttackTimers.push(setTimeout(() => {
    if (!alive || !bossRound) return;
    flash('⚠ BLOCK RAIN!'); render();
    bossAttackTimers.push(setTimeout(_startBlockRain, 500));
  }, delay));
}

function _startBlockRain() { // [1.11]
  if (!alive || !bossRound) return;
  const end = Date.now() + 3000;
  const iv = setInterval(() => {
    if (!alive || !bossRound || Date.now() >= end) {
      clearInterval(iv);
      if (alive && bossRound) bossAttackTimers.push(setTimeout(() => {
        blocks = blocks.filter(b => !b.bossRain);
        if (alive) render();
      }, 500));
      return;
    }
    if (fabPaused) return;
    if (_blocksPaused()) return; // [2.0-s4e] no rain during the block-attack pause
    const bCells = getBossCells();
    const rainPositions = [], rainUsed = new Set();
    for (let _a = 0; _a < 40 && rainPositions.length < 4; _a++) { // [1.11] random anywhere on grid
      const x = Math.floor(Math.random() * N), y = Math.floor(Math.random() * N);
      const key = `${x},${y}`;
      if (!bCells.has(key) && !rainUsed.has(key)) { rainUsed.add(key); rainPositions.push({ x, y }); }
    }
    for (const pos of rainPositions) {
      if (bCells.has(`${pos.x},${pos.y}`)) continue;
      const b = { x: pos.x, y: pos.y, state: 'charge', bossRain: true };
      blocks.push(b);
      bossAttackTimers.push(setTimeout(() => {
        if (!alive || !bossRound) return;
        b.state = 'land'; spawnBlockImpact(b.x, b.y);
        render(); checkDeathByBlock();
      }, 400));
    }
    render();
  }, 350);
  bossAttackTimers.push(iv);
}

function _scheduleBossShockwave() { // [1.11] — once per fight, random 5–16 s
  const delay = 5000 + Math.random() * 11000;
  bossAttackTimers.push(setTimeout(() => {
    if (!alive || !bossRound) return;
    flash('⚠ SHOCKWAVE!'); render();
    bossAttackTimers.push(setTimeout(_triggerBossShockwave, 300));
  }, delay));
}

function _triggerBossShockwave() { // [1.11]
  if (!alive || !bossRound) return;
  const scx = Math.floor(Math.random() * N); // [1.11] random center anywhere on grid
  const scy = Math.floor(Math.random() * N);
  bossShockwaveCells = new Set();
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      if (Math.abs(x - scx) + Math.abs(y - scy) <= 3)
        bossShockwaveCells.add(`${x},${y}`);
  if (!(testerActive && tNoclip) && !tutorialActive && bossShockwaveCells.has(`${cube.x},${cube.y}`)) // [2.0-s4h]
    return die('block');
  render(); startAnim();
  bossAttackTimers.push(setTimeout(() => {
    bossShockwaveCells = new Set();
    if (alive && bossRound) render();
  }, 2000));
}

function bossVictory() { // [1.11]
  if (!alive || !bossRound) return;
  const cfg = BOSS_CONFIG[bossTier];
  const wasVoidKing = bossTier === 3; // [2.0-s1] capture before cleanup resets bossTier
  _cleanupBoss();
  if (currentWorld === 2) { crystals += cfg.reward; sessionCrystalsEarned += cfg.reward; } // [2.0-s1]
  else { coins += cfg.reward; sessionCoinsEarned += cfg.reward; }
  addCurrencyTotal(cfg.reward); // [2.0-s3] W1→coins stat, W2→crystals stat
  save();
  if (hudTimerEl) hudTimerEl.style.display = 'none';
  flash(`🏆 BOSS DEFEATED! +${cfg.reward} ${curIcon()}`); // [2.0-s1]
  render();
  // [2.0-s1] World-1 VOID KING tears the rift — only the first time, and only from Normal/Hard (gameMode null) [2.0-s2]
  if (wasVoidKing && currentWorld === 1 && gameMode === null && !world2Unlocked) {
    world2Unlocked = true; localStorage.setItem('cm_world2_unlocked', 'true');
    phaseTimer = _schedulePhase(showWorldChoice, 2000);
  } else {
    phaseTimer = _schedulePhase(startRound, 2000);
  }
}

// ══════════════════════════════════════════════════
// [2.0-s4b] WORLD 2 BOSSES — active combat (hit-plate → turret → beam)
// ══════════════════════════════════════════════════
function startW2Boss(idx, speedMult) { // [2.0-s4b]
  if (gridlockActive) _endGridlockMode(false);
  _clearActiveMod();
  _cleanupBoss();
  blackHoleReadyAt = 0; // [2.0-s4g] teleport ready immediately at boss start
  const cfg = W2_BOSS[idx];
  w2Boss = cfg; w2SpeedMult = speedMult;
  bossRound = true; bossActive = false;
  bossHitsLeft = cfg.hits; bossShieldUntil = 0;
  bossX = Math.floor((N - cfg.size) / 2);
  bossY = Math.floor((N - cfg.size) / 2);
  lasers = []; blocks = [];
  asteroids = []; clearTimeout(asteroidTimer); asteroidTimer = null;
  if (hudTimerEl) hudTimerEl.style.display = 'none'; // no countdown — W2 is hit-based
  flash('✦ COSMIC BOSS APPROACHES!');
  render(); startAnim();
  bossAttackTimers.push(setTimeout(() => {
    if (!alive || !bossRound) return;
    bossActive = true;
    _bossPushPlayer();
    flash(`✦ ${cfg.name}`);
    render();
    _w2SpawnHitPlate();
    _w2ScheduleAttacks(cfg);
    _bossPressureCount = 0; bossPressureTimer = setTimeout(_bossPressureTick, 1000); // [2.0-s4d] pressure burst in W2 too
  }, 1500));
}

function w2BossVictory() { // [2.0-s4b]
  if (!alive || !bossRound) return;
  const cfg = w2Boss;
  _cleanupBoss();
  crystals += cfg.reward; sessionCrystalsEarned += cfg.reward;
  addCurrencyTotal(cfg.reward);
  save();
  if (hudTimerEl) hudTimerEl.style.display = 'none';
  flash(`🏆 ${cfg.name} DEFEATED! +${cfg.reward} ✦`);
  render();
  phaseTimer = _schedulePhase(startRound, 2000); // resume the W2 run
}

function _w2SpawnHitPlate() { // [2.0-s4b] golden plate on a random safe cell (none while shielded)
  if (!alive || !bossRound || !w2Boss) return;
  if (Date.now() < bossShieldUntil) return;
  const bcells = getBossCells();
  for (let t = 0; t < 200; t++) {
    const x = Math.floor(Math.random() * N), y = Math.floor(Math.random() * N), key = `${x},${y}`;
    if (bcells.has(key) || destroyedCells.has(key) || flareCellHas(x, y)) continue;
    if (x === cube.x && y === cube.y) continue;
    hitPlate = { x, y }; render(); return;
  }
}

function _w2OnPlayerMoved() { // [2.0-s4b] react to the player's new cell
  if (!w2Boss || !bossActive) return;
  if (destroyedCells.has(`${cube.x},${cube.y}`) && !(testerActive && tNoclip) && !tutorialActive) { die('asteroid'); return; } // [2.0-s4h]
  if (hitPlate && cube.x === hitPlate.x && cube.y === hitPlate.y && Date.now() >= bossShieldUntil && !turret) {
    _w2SpawnTurret();
  }
}

function _w2SpawnTurret() { // [2.0-s4b] emitter on a free adjacent cell; fixed 800ms charge (NOT speed-scaled)
  const px = hitPlate.x, py = hitPlate.y;
  const bcells = getBossCells();
  const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  for (let i = dirs.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [dirs[i],dirs[j]]=[dirs[j],dirs[i]]; }
  let ex = px, ey = py;
  for (const [dx,dy] of dirs) {
    const nx = px+dx, ny = py+dy, k = `${nx},${ny}`;
    if (nx>=0&&nx<N&&ny>=0&&ny<N && !bcells.has(k) && !destroyedCells.has(k)) { ex = nx; ey = ny; break; }
  }
  turret = { px, py, ex, ey, firesAt: Date.now() + 800 };
  hitPlate = null;
  playSolarFlareCharge();
  render();
  bossAttackTimers.push(setTimeout(() => {
    if (!alive || !bossRound || !turret) return;
    // risky: standing on the charging plate or emitter when it fires = death
    if (!(testerActive && tNoclip) && !tutorialActive && // [2.0-s4h]
        ((cube.x === turret.px && cube.y === turret.py) || (cube.x === turret.ex && cube.y === turret.ey))) {
      turret = null; die('flare'); return;
    }
    playTurretFire(); // [2.0-s4e] focused beam hitting the boss (distinct from the flare sound)
    w2Beam = { ex: turret.ex, ey: turret.ey, until: Date.now() + 220 };
    turret = null;
    bossHitsLeft--;
    _bhParticles(bossX + _bossSize()/2 - 0.5, bossY + _bossSize()/2 - 0.5, false); // cosmic hit burst
    if (bossHitsLeft <= 0) { render(); startAnim(); w2BossVictory(); return; } // [2.0-s4e] no shield on the killing blow
    bossShieldUntil = Date.now() + (5000 + Math.random() * 5000); // 5–10s shield
    playBossShield(); // [2.0-s4e] barrier-up shimmer
    render(); startAnim();
    flash(`✦ HIT! ${bossHitsLeft} to go · 🛡 shield up`);
    bossAttackTimers.push(setTimeout(_w2SpawnHitPlate, bossShieldUntil - Date.now()));
  }, 800));
}

// [2.0-s4d] powerful-attack gate — spin/gravity/star/black-hole never overlap and stay ≥3s apart
function _w2PowerReady() { return Date.now() >= _w2PowerBusyUntil; }
function _w2PowerBusy(activeMs) { _w2PowerBusyUntil = Date.now() + activeMs + 3000; } // reserve attack window + 3s gap
function _w2ScheduleRepeating(fn, n, baseDelay, spread) { // schedule fn n times with staggered delays (gate serializes collisions)
  for (let i = 0; i < n; i++) bossAttackTimers.push(setTimeout(fn, baseDelay + i*spread + Math.random()*spread));
}

function _w2ScheduleAttacks(cfg) { // [2.0-s4b][2.0-s4d] arm attacks; SINGULARITY repeats each powerful attack 2–3×
  const A = cfg.attacks;
  const isSing = cfg.id === 'singularity';
  const cnt = () => 2 + (Math.random() < 0.5 ? 1 : 0); // 2 or 3
  if (A.includes('throw'))     _w2ScheduleThrow();
  if (A.includes('rain'))      _scheduleBossRain(); // reuse W1 block rain (once; not "powerful", un-gated)
  if (A.includes('spin'))      _w2ScheduleRepeating(_w2LaserSpin,      isSing ? cnt() : 1, 2500, 5000);
  if (A.includes('gravity'))   _w2ScheduleRepeating(_w2GravityPull,    isSing ? cnt() : 2, 4000, 6000);
  if (A.includes('star'))      _w2ScheduleRepeating(_w2FallingStar,    cnt(),              8000, 6000);
  if (A.includes('blackhole')) _w2ScheduleRepeating(_w2BlackHoleBlock, cnt(),              6000, 6000);
}

function _w2ScheduleThrow() { // [2.0-s4b] two random ≤5-cell block throws, slower than W1, ±20% jitter
  if (!alive || !bossRound || !w2Boss) return;
  const base = 1600 / w2SpeedMult;
  bossAttackTimers.push(setTimeout(() => {
    if (!alive || !bossRound || !w2Boss) return;
    if (!fabPaused && !_blocksPaused()) { blocks = blocks.filter(b => !b.bossThrow); _fireBossAttack(); _fireBossAttack(); render(); } // [2.0-s4e] no throws during the block-attack pause
    _w2ScheduleThrow();
  }, base * (0.8 + Math.random()*0.4)));
}

function _w2LaserSpin() { // [2.0-s4b][2.0-s4c][2.0-s4d] gated; ~0.8s charge telegraph, then rotating edge beams
  if (!alive || !bossRound || !w2Boss) return;
  if (!_w2PowerReady()) { bossAttackTimers.push(setTimeout(_w2LaserSpin, (_w2PowerBusyUntil - Date.now()) + 200 + Math.random()*400)); return; }
  const charge = 800, dur = 4500 / w2SpeedMult; // [2.0-s4c] ~40% slower → readable/dodgeable
  _w2PowerBusy(charge + dur);
  flash('✦ LASER SPIN CHARGING!');
  const t0 = Date.now();
  w2SpinState = { chargeUntil: t0 + charge, start: t0 + charge, dur }; // [2.0-s4d] charge phase before lethal+rotating
  startAnim();
}

function _w2GravityPull() { // [2.0-s4b][2.0-s4d] gated; warn, then yank the player 5–7 cells toward the boss (undashable)
  if (!alive || !bossRound || !w2Boss) return;
  if (!_w2PowerReady()) { bossAttackTimers.push(setTimeout(_w2GravityPull, (_w2PowerBusyUntil - Date.now()) + 200 + Math.random()*400)); return; }
  _w2PowerBusy(1000);
  const now = Date.now();
  const warn = 500 / w2SpeedMult;
  w2GravityWarn = { until: now + warn };
  flash('✦ GRAVITY PULL!');
  render(); startAnim();
  bossAttackTimers.push(setTimeout(() => {
    if (!alive || !bossRound || !w2Boss) return;
    w2GravityWarn = null;
    const sz = _bossSize();
    _w2PullPlayer(bossX + sz/2, bossY + sz/2, 5 + Math.floor(Math.random()*3)); // 5–7 cells
    render();
  }, warn));
}

function _w2PullPlayer(tx, ty, cells) { // [2.0-s4c] visibly slide the player toward (tx,ty) one cell per tick (undashable)
  _w2Pulling = true; // lock input during the pull
  let remaining = cells;
  const finish = () => {
    _w2Pulling = false;
    if (getBossCells().has(`${cube.x},${cube.y}`)) _bossPushPlayer();
    render();
    _w2OnPlayerMoved(); // crater death + plate-step at the resting cell
  };
  const step = () => {
    if (!alive || !bossRound) { _w2Pulling = false; return; }
    const dx = tx - cube.x, dy = ty - cube.y;
    if (remaining <= 0 || (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5)) { finish(); return; }
    let nx = cube.x, ny = cube.y;
    if (Math.abs(dx) >= Math.abs(dy)) nx += Math.sign(dx); else ny += Math.sign(dy);
    nx = Math.max(0, Math.min(N-1, nx)); ny = Math.max(0, Math.min(N-1, ny));
    if (getBossCells().has(`${nx},${ny}`) || (nx === cube.x && ny === cube.y)) { finish(); return; } // can't go further
    cube.x = nx; cube.y = ny; spawnDashParticles(cube.x, cube.y); remaining--;
    render();
    bossAttackTimers.push(setTimeout(step, 70));
  };
  step();
}

function _w2BlackHoleBlock() { // [2.0-s4f] gated; spawns 1–3 simultaneous black-hole blocks for 5s
  if (!alive || !bossRound || !w2Boss) return;
  if (!_w2PowerReady()) { bossAttackTimers.push(setTimeout(_w2BlackHoleBlock, (_w2PowerBusyUntil - Date.now()) + 200 + Math.random()*400)); return; }
  const now = Date.now(), bcells = getBossCells();
  const k = 1 + Math.floor(Math.random() * 3); // 1, 2 or 3
  const spawned = [], until = now + 5000;
  for (let i = 0; i < k; i++) {
    for (let t = 0; t < 200; t++) {
      const x = Math.floor(Math.random()*N), y = Math.floor(Math.random()*N), key = `${x},${y}`;
      if (bcells.has(key) || destroyedCells.has(key)) continue;
      if (Math.abs(x-cube.x)+Math.abs(y-cube.y) < 3) continue;
      if (spawned.some(h => h.x === x && h.y === y)) continue;
      spawned.push({ x, y, until }); break;
    }
  }
  if (!spawned.length) return;
  w2BhBlocks = spawned;
  _w2PowerBusy(5000);
  flash('✦ BLACK HOLE!');
  for (const h of w2BhBlocks) _bhParticles(h.x, h.y, true);
  render(); startAnim();
  bossAttackTimers.push(setTimeout(() => { w2BhBlocks = []; if (alive && bossRound) render(); }, 5000));
}

function _w2FallingStar() { // [2.0-s4b][2.0-s4d] gated; longer streak → irregular ~4×5 crater + flash + shockwave ring
  if (!alive || !bossRound || !w2Boss) return;
  if (!_w2PowerReady()) { bossAttackTimers.push(setTimeout(_w2FallingStar, (_w2PowerBusyUntil - Date.now()) + 200 + Math.random()*400)); return; }
  _w2PowerBusy(1000);
  const bcells = getBossCells();
  let ix = 8, iy = 8;
  for (let t = 0; t < 200; t++) {
    ix = 2 + Math.floor(Math.random()*(N-4)); iy = 2 + Math.floor(Math.random()*(N-4));
    if (!bcells.has(`${ix},${iy}`)) break;
  }
  flash('✦ FALLING STAR!');
  w2Star = { sx: ix - 9, sy: iy - 15, ex: ix, ey: iy, born: Date.now(), landAt: Date.now() + 1100 }; // [2.0-s4d] longer streak
  startAnim();
  bossAttackTimers.push(setTimeout(() => {
    if (!alive || !bossRound) return;
    w2Star = null;
    // [2.0-s4d] irregular ~4×5 crater: 5 wide × 4 tall, thinned corners + random holes + scattered outliers
    for (let dy = -2; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (Math.abs(dx) === 2 && Math.abs(dy) >= 1 && Math.random() < 0.7) continue; // thin corners
      if (Math.random() < 0.12) continue; // random holes
      const x = ix+dx, y = iy+dy;
      if (hitPlate && x === hitPlate.x && y === hitPlate.y) continue; // [2.0-s4e] never bury the active hit plate
      if (x>=0&&x<N&&y>=0&&y<N) destroyedCells.add(`${x},${y}`);
    }
    for (let k = 0; k < 2; k++) { // scattered outliers → irregular edge
      const ox = ix + Math.floor(Math.random()*5)-2, oy = iy + Math.floor(Math.random()*5)-2;
      if (hitPlate && ox === hitPlate.x && oy === hitPlate.y) continue; // [2.0-s4e]
      if (ox>=0&&ox<N&&oy>=0&&oy<N) destroyedCells.add(`${ox},${oy}`);
    }
    spawnBlockImpact(ix, iy);
    w2StarShock = { x: ix, y: iy, born: Date.now() }; // [2.0-s4d] expanding shockwave + flash
    render(); startAnim();
    if (destroyedCells.has(`${cube.x},${cube.y}`) && !(testerActive && tNoclip) && !tutorialActive) die('asteroid'); // [2.0-s4h]
  }, 1100));
}

function drawW2Boss(now) { // [2.0-s4b][2.0-s4c] unique per-boss body + bold shield + attack visuals
  if (!w2Boss) return;
  const sz = _bossSize();
  const px = bossX*cellSize, py = bossY*cellSize, w = sz*cellSize, h = sz*cellSize;
  const cx = px + w/2, cy = py + h/2;
  if      (w2Boss.id === 'pulsar')  _drawPulsarBody(now, px, py, w, h, cx, cy);
  else if (w2Boss.id === 'neutron') _drawNeutronBody(now, px, py, w, h, cx, cy);
  else                              _drawSingularityBody(now, px, py, w, h, cx, cy);
  if (Date.now() < bossShieldUntil) _drawW2Shield(now, px, py, w, h); // [2.0-s4c]
  _drawW2Spin(now); _drawW2Beam(now); _drawW2BhBlock(now); _drawW2Star(now); _drawW2StarShock(now); _drawW2GravityWarn(now);
}

function _drawPulsarBody(now, px, py, w, h, cx, cy) { // [2.0-s4c] cyan/white, fast pulse, radiating energy rings
  const fast = 0.5 + 0.5*Math.sin(now*0.012);
  ctx.save();
  for (let i = 0; i < 3; i++) { // expanding concentric rings
    const t = ((now / 1100) + i/3) % 1, r = w*0.5 + t*w*0.95, a = (1 - t) * 0.5;
    ctx.strokeStyle = `rgba(120,240,255,${a})`; ctx.lineWidth = 1.5 + 2*(1-t);
    ctx.shadowColor = `rgba(120,240,255,${a})`; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
  }
  const g = ctx.createRadialGradient(cx, cy, w*0.05, cx, cy, w*0.6);
  g.addColorStop(0, `rgba(235,255,255,${0.85+0.15*fast})`);
  g.addColorStop(0.5, 'rgba(80,220,255,0.95)');
  g.addColorStop(1, 'rgba(20,120,180,0.95)');
  ctx.shadowColor = `rgba(150,245,255,${0.7+0.3*fast})`; ctx.shadowBlur = 20 + 14*fast;
  ctx.fillStyle = g; ctx.fillRect(px+2, py+2, w-4, h-4);
  ctx.shadowBlur = 14; ctx.fillStyle = `rgba(255,255,255,${0.8+0.2*fast})`;
  ctx.beginPath(); ctx.arc(cx, cy, w*0.12*(0.8+0.4*fast), 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function _drawNeutronBody(now, px, py, w, h, cx, cy) { // [2.0-s4c] dark purple/grey, slow heavy pulse, edge distortion
  const slow = 0.5 + 0.5*Math.sin(now*0.003);
  ctx.save();
  const g = ctx.createRadialGradient(cx, cy, w*0.08, cx, cy, w*0.6);
  g.addColorStop(0, 'rgba(70,55,90,0.98)');
  g.addColorStop(0.6, 'rgba(40,30,55,0.98)');
  g.addColorStop(1, 'rgba(16,12,24,0.98)');
  ctx.shadowColor = `rgba(120,90,160,${0.5+0.3*slow})`; ctx.shadowBlur = 16 + 8*slow;
  ctx.fillStyle = g; ctx.fillRect(px+2, py+2, w-4, h-4);
  // jittered perimeter = gravitational distortion shimmer
  ctx.strokeStyle = `rgba(150,120,190,${0.5+0.3*slow})`; ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(110,80,150,0.7)'; ctx.shadowBlur = 8;
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const f = i / 12; const j = Math.sin(now*0.006 + i*1.7) * cellSize*0.13; let x, y;
    if      (f < 1) { x = px + f*w;         y = py + j; }
    else if (f < 2) { x = px + w + j;       y = py + (f-1)*h; }
    else if (f < 3) { x = px + w - (f-2)*w; y = py + h + j; }
    else            { x = px + j;           y = py + h - (f-3)*h; }
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath(); ctx.stroke();
  ctx.shadowBlur = 12; ctx.fillStyle = `rgba(160,140,200,${0.5+0.3*slow})`;
  ctx.beginPath(); ctx.arc(cx, cy, w*0.16, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function _drawSingularityBody(now, px, py, w, h, cx, cy) { // [2.0-s4c][2.0-s4d] defined 5×5 body + black core + violet glow + ring
  const pulse = 0.5 + 0.5*Math.sin(now*0.005), sz = _bossSize();
  ctx.save();
  // [2.0-s4d] defined body fill + bright border so the full footprint is clearly visible
  ctx.shadowColor = `rgba(150,60,255,${0.6+0.3*pulse})`; ctx.shadowBlur = 22 + 12*pulse;
  ctx.fillStyle = 'rgba(28,8,46,0.97)'; ctx.fillRect(px+2, py+2, w-4, h-4);
  ctx.shadowBlur = 12;
  ctx.strokeStyle = `rgba(185,115,255,${0.8+0.2*pulse})`; ctx.lineWidth = 3;
  ctx.strokeRect(px+2, py+2, w-4, h-4);
  // violet inner glow over the body
  const g = ctx.createRadialGradient(cx, cy, w*0.1, cx, cy, w*0.55);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.7, `rgba(120,40,210,${0.30+0.2*pulse})`);
  g.addColorStop(1, 'rgba(80,20,160,0)');
  ctx.shadowBlur = 0; ctx.fillStyle = g; ctx.fillRect(px+2, py+2, w-4, h-4);
  // black core
  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.beginPath(); ctx.arc(cx, cy, w*0.26, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = `rgba(160,90,255,${0.6+0.3*pulse})`; ctx.lineWidth = 2; ctx.stroke();
  // rotating accretion ring
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(now*0.0016);
  ctx.strokeStyle = `rgba(190,110,255,${0.7+0.3*pulse})`; ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(170,80,255,0.9)'; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.ellipse(0, 0, w*0.42, w*0.18, 0, 0, Math.PI*2); ctx.stroke();
  ctx.restore();
  ctx.restore();
  if (Math.random() < 0.12) _bhParticles(bossX + sz/2 - 0.5, bossY + sz/2 - 0.5, true); // particles sucked inward
}

function _drawW2Shield(now, px, py, w, h) { // [2.0-s4c] bold pulsing multi-layer purple barrier — impossible to miss
  const sp = 0.5 + 0.5*Math.sin(now*0.009);
  const grow = Math.abs(Math.sin(now*0.006)) * cellSize*0.2; // breathing expansion
  ctx.save();
  ctx.shadowColor = `rgba(170,90,255,${0.85+0.15*sp})`; ctx.shadowBlur = 26 + 14*sp;
  ctx.strokeStyle = `rgba(195,125,255,${0.85+0.15*sp})`; ctx.lineWidth = 6;
  ctx.strokeRect(px - 4 - grow, py - 4 - grow, w + 8 + grow*2, h + 8 + grow*2);
  ctx.shadowBlur = 14;
  ctx.strokeStyle = `rgba(235,205,255,${0.7+0.3*sp})`; ctx.lineWidth = 2.5;
  ctx.strokeRect(px - 1, py - 1, w + 2, h + 2);
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(150,80,255,${0.10 + 0.07*sp})`;
  ctx.fillRect(px - 3, py - 3, w + 6, h + 6);
  ctx.restore();
}

function _drawW2Spin(now) { // [2.0-s4b][2.0-s4d] charge telegraph → rotating beams from the boss EDGES (no center X)
  if (!w2SpinState || !w2Boss) return;
  const sz = _bossSize();
  const cx = (bossX + sz/2)*cellSize, cy = (bossY + sz/2)*cellSize;
  const R = sz*cellSize*0.62, maxLen = N*cellSize*1.5; // beams start just outside the boss → no crossing
  const charging = now < w2SpinState.chargeUntil;
  if (!charging && (now - w2SpinState.start) >= w2SpinState.dur) { w2SpinState = null; w2SpinCells = new Set(); return; }
  const baseAng = charging ? 0 : ((now - w2SpinState.start) / w2SpinState.dur) * Math.PI * 2; // fixed during charge
  const pulse = 0.4 + 0.35*Math.abs(Math.sin(now*0.02));
  w2SpinCells = new Set();
  ctx.save();
  ctx.shadowColor = 'rgba(180,80,255,0.9)'; ctx.shadowBlur = 14;
  for (let k = 0; k < 4; k++) {
    const ang = baseAng + k*Math.PI/2;
    ctx.strokeStyle = charging ? `rgba(255,210,80,${pulse*0.55})` : 'rgba(255,210,80,0.9)'; // semi-transparent while charging
    ctx.lineWidth = cellSize*(charging ? 0.4 : 0.5);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang)*R, cy + Math.sin(ang)*R);
    ctx.lineTo(cx + Math.cos(ang)*maxLen, cy + Math.sin(ang)*maxLen);
    ctx.stroke();
    if (!charging) { // lethal only after the charge phase
      for (let dd = R; dd < maxLen; dd += cellSize*0.4) {
        const gx = Math.floor((cx + Math.cos(ang)*dd)/cellSize), gy = Math.floor((cy + Math.sin(ang)*dd)/cellSize);
        if (gx < 0 || gx >= N || gy < 0 || gy >= N) break;
        w2SpinCells.add(`${gx},${gy}`);
      }
    }
  }
  ctx.restore();
  if (!charging && !(testerActive && tNoclip) && !tutorialActive && w2SpinCells.has(`${cube.x},${cube.y}`)) die('flare'); // [2.0-s4h]
  startAnim();
}

function _drawW2Beam(now) { // [2.0-s4b] brief turret→boss beam after a hit
  if (!w2Beam || !w2Boss) return;
  if (Date.now() > w2Beam.until) { w2Beam = null; return; }
  const sz = _bossSize();
  ctx.save();
  ctx.strokeStyle = 'rgba(255,230,120,0.95)'; ctx.lineWidth = cellSize*0.35;
  ctx.shadowColor = 'rgba(255,180,60,0.9)'; ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo((w2Beam.ex+0.5)*cellSize, (w2Beam.ey+0.5)*cellSize);
  ctx.lineTo((bossX+sz/2)*cellSize, (bossY+sz/2)*cellSize);
  ctx.stroke();
  ctx.restore();
  startAnim();
}

function _drawW2BhBlock(now) { // [2.0-s4f] swirling black-hole blocks (1–3 simultaneous)
  if (!w2BhBlocks.length) return;
  w2BhBlocks = w2BhBlocks.filter(h => now < h.until);
  const pulse = 0.5+0.5*Math.sin(now*0.01);
  for (const h of w2BhBlocks) {
    const cx = (h.x+0.5)*cellSize, cy = (h.y+0.5)*cellSize;
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, cellSize*0.55);
    g.addColorStop(0,'rgba(8,0,18,1)'); g.addColorStop(0.7,'rgba(120,40,200,0.85)'); g.addColorStop(1,'rgba(120,40,200,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, cellSize*0.55, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = `rgba(200,140,255,${0.6+0.4*pulse})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, cellSize*0.4, now*0.006, now*0.006 + Math.PI*1.5); ctx.stroke();
    ctx.restore();
  }
  if (w2BhBlocks.length) startAnim();
}

function _drawW2Star(now) { // [2.0-s4b] falling-star streak + impact target warning
  if (!w2Star) return;
  const span = w2Star.landAt - w2Star.born;
  const cl = Math.min(1, Math.max(0, (Date.now() - w2Star.born) / span));
  const gx = w2Star.sx + (w2Star.ex - w2Star.sx)*cl, gy = w2Star.sy + (w2Star.ey - w2Star.sy)*cl;
  const cx = (gx+0.5)*cellSize, cy = (gy+0.5)*cellSize;
  ctx.save();
  for (let k = 1; k <= 12; k++) { // [2.0-s4d] longer, brighter trail
    const tx = (gx - (w2Star.ex-w2Star.sx)*0.035*k + 0.5)*cellSize, ty = (gy - (w2Star.ey-w2Star.sy)*0.035*k + 0.5)*cellSize;
    ctx.globalAlpha = 0.30*(1 - k/13); ctx.fillStyle = 'rgba(255,210,120,1)';
    ctx.beginPath(); ctx.arc(tx, ty, cellSize*0.34*(1 - k/14), 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowColor = 'rgba(255,180,60,1)'; ctx.shadowBlur = 20; ctx.fillStyle = 'rgba(255,245,200,1)';
  ctx.beginPath(); ctx.arc(cx, cy, cellSize*0.36, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  const blink = 0.4 + 0.6*Math.abs(Math.sin(now*0.012));
  ctx.save(); ctx.globalAlpha = blink; ctx.strokeStyle = 'rgba(255,80,40,1)'; ctx.lineWidth = 2;
  ctx.strokeRect(w2Star.ex*cellSize+2, w2Star.ey*cellSize+2, cellSize-4, cellSize-4);
  ctx.restore();
  startAnim();
}

function _drawW2StarShock(now) { // [2.0-s4d] bright impact flash + expanding shockwave ring (~600ms)
  if (!w2StarShock) return;
  const age = Date.now() - w2StarShock.born;
  if (age > 600) { w2StarShock = null; return; }
  const t = age / 600; // 0→1
  const cx = (w2StarShock.x+0.5)*cellSize, cy = (w2StarShock.y+0.5)*cellSize;
  ctx.save();
  if (t < 0.2) { // bright white flash at the very start
    ctx.globalAlpha = (1 - t/0.2) * 0.9;
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.shadowColor = 'rgba(255,220,140,1)'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(cx, cy, cellSize*1.1, 0, Math.PI*2); ctx.fill();
  }
  // expanding ring
  ctx.globalAlpha = (1 - t) * 0.85;
  ctx.strokeStyle = 'rgba(255,190,90,1)'; ctx.lineWidth = cellSize*0.3*(1 - t) + 1;
  ctx.shadowColor = 'rgba(255,150,40,1)'; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(cx, cy, cellSize*(0.4 + t*4.5), 0, Math.PI*2); ctx.stroke();
  ctx.restore();
  startAnim();
}

function _drawW2GravityWarn(now) { // [2.0-s4c] bold pulsing arrows + player highlight during the pull telegraph
  if (!w2GravityWarn || !w2Boss) return;
  if (Date.now() > w2GravityWarn.until) { w2GravityWarn = null; return; }
  const sz = _bossSize();
  const pcx = (cube.x+0.5)*cellSize, pcy = (cube.y+0.5)*cellSize;
  const ang = Math.atan2((bossY+sz/2)*cellSize - pcy, (bossX+sz/2)*cellSize - pcx);
  const beat = 0.45 + 0.55*Math.abs(Math.sin(now*0.014));
  ctx.save();
  // pulsing highlight ring on the player's cell — "you are caught"
  ctx.globalAlpha = beat;
  ctx.strokeStyle = 'rgba(200,130,255,1)'; ctx.lineWidth = 3; ctx.shadowColor = 'rgba(160,80,255,1)'; ctx.shadowBlur = 14;
  ctx.strokeRect(cube.x*cellSize+2, cube.y*cellSize+2, cellSize-4, cellSize-4);
  // three chevrons marching from the player toward the boss
  ctx.lineWidth = 4; ctx.shadowBlur = 12;
  const march = ((now*0.004) % 1) * cellSize*0.6; // animate the chevrons sliding toward the boss
  for (let k = 0; k < 3; k++) {
    const d = cellSize*(0.9 + k*0.85) + march;
    const ax = pcx + Math.cos(ang)*d, ay = pcy + Math.sin(ang)*d;
    ctx.globalAlpha = beat * (1 - k*0.22);
    ctx.strokeStyle = 'rgba(210,150,255,1)';
    ctx.beginPath();
    ctx.moveTo(ax - Math.cos(ang-0.5)*cellSize*0.45, ay - Math.sin(ang-0.5)*cellSize*0.45);
    ctx.lineTo(ax, ay);
    ctx.lineTo(ax - Math.cos(ang+0.5)*cellSize*0.45, ay - Math.sin(ang+0.5)*cellSize*0.45);
    ctx.stroke();
  }
  ctx.restore();
  startAnim();
}

function showWorldChoice() { // [2.0-s1] game stays live; player picks Continue or Enter the Void
  showScreen('screen-world-choice');
}

// ══════════════════════════════════════════════════
// WORLD 2 — STAGE 1 FOUNDATION // [2.0-s1]
// ══════════════════════════════════════════════════
function applyWorldTheme() { // [2.0-s1] toggle cosmic skin (gameplay surfaces only)
  document.body.classList.toggle('world2', currentWorld === 2);
  applyBoardSkin();   // re-applies board bg (cosmic override lives inside it)
  updateMenuCoins();
}

const CUBEK2_LINES = [ // [2.0-s1]
  "Welcome, survivor. I am Cubek 2.0 — I've been waiting for someone strong enough to reach this place.",
  "This is the Void — a cosmic dimension beyond the neon grid. The rules here are different.",
  "You'll face Solar Flares and Asteroids instead of lasers. Master the Black Hole to teleport across the grid.",
  "Void Crystals are the currency here. Spend them wisely in the Void Shop. Good luck — you'll need it."
];
let cubek2Step = 0;
function showCubek2(after) { // [2.0-s1][2.0-s4d] first-time-only cosmic intro; `after` runs when it finishes
  _cubek2After = after || (() => startGame(false));
  showScreen('screen-cubek2');
  cubek2Step = 0;
  renderCubek2();
}
function renderCubek2() { // [2.0-s1]
  const txt = document.getElementById('cubek2-text');
  const btn = document.getElementById('cubek2-next');
  if (txt) txt.textContent = CUBEK2_LINES[cubek2Step];
  if (btn) btn.textContent = cubek2Step === CUBEK2_LINES.length - 1 ? '✦ ENTER' : 'NEXT →';
}
function cubek2Next() { // [2.0-s1]
  playSound('click');
  if (++cubek2Step >= CUBEK2_LINES.length) {
    localStorage.setItem('cm_cubek2_done', 'true'); // [2.0-s4d] shown exactly once
    const after = _cubek2After || (() => startGame(false));
    _cubek2After = null;
    after(); // [2.0-s4d] proceed per entry path (start a run, or return to the W2 menu)
  } else {
    renderCubek2();
  }
}

// [2.0-s2] Entry point for the menu NORMAL/HARD buttons: show Cubek 2.0 first if entering
// the Void for the first time, otherwise start the game directly.
function beginGame(hard) {
  if (currentWorld === 2 && localStorage.getItem('cm_cubek2_done') !== 'true') {
    showCubek2(() => startGame(hard)); return; // [2.0-s4d] fallback: resumed W2 session that never saw the intro
  }
  startGame(hard);
}

function triggerBossRound() { // [1.11] FAB helper — triggers boss for current round range
  if (!alive) return;
  clearTimeout(phaseTimer);
  if (currentWorld === 2) { // [2.0-s4b][2.0-s4e] trigger the matching W2 boss (every 20)
    const n = Math.max(1, Math.ceil(round / 20)), idx = (n - 1) % 3, cycle = Math.floor((n - 1) / 3);
    startW2Boss(idx, Math.min(1 + 0.1 * cycle, 2));
    return;
  }
  const tier = round < 40 ? 1 : round < 60 ? 2 : 3; // [2.0-s4e]
  startBossRound(tier);
}

function testerSwitchWorld() { // [2.0-s4c] reliable W2 entry for testing — unlock + switch + restart
  world2Unlocked = true; localStorage.setItem('cm_world2_unlocked', 'true'); // survive the load-guard
  currentWorld = currentWorld === 2 ? 1 : 2;
  localStorage.setItem('cm_current_world', String(currentWorld));
  localStorage.setItem('cm_cubek2_done', 'true'); // skip the cosmic intro when testing
  applyWorldTheme();
  showFabFeedback(currentWorld === 2 ? '🌌 World 2 (Void)' : '⚡ World 1 (Grid)');
  startGame(hardMode); // fresh run in the chosen world (round resets; reach 25 → PULSAR)
}

function drawBoss(tier, now) { // [1.11] uses global ctx directly
  const cfg = BOSS_CONFIG[tier];
  const px  = bossX * cellSize, py = bossY * cellSize; // [2.0-s4] live position
  const w   = cfg.size  * cellSize, h  = cfg.size  * cellSize;
  const cx2 = px + w / 2,          cy2 = py + h / 2;
  const pulse = 0.5 + 0.5 * Math.sin(now * 0.004);

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  if (tier === 1) { // ── SENTINEL — red/orange, angular ──
    const flicker = 0.5 + 0.5 * Math.sin(now * 0.013);
    ctx.shadowColor = `rgba(255,80,0,${0.8 + 0.2 * flicker})`;
    ctx.shadowBlur  = 20 + 12 * flicker;
    ctx.fillStyle   = `rgba(160,20,0,0.95)`;
    ctx.fillRect(px + 2, py + 2, w - 4, h - 4);
    ctx.strokeStyle = `rgba(255,${Math.floor(80 + 80 * flicker)},0,1)`;
    ctx.lineWidth   = 3;
    ctx.strokeRect(px + 2, py + 2, w - 4, h - 4);
    ctx.shadowBlur  = 8;
    ctx.strokeStyle = `rgba(255,160,40,${0.6 + 0.4 * pulse})`;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(cx2, py + 6);     ctx.lineTo(cx2, py + h - 6);
    ctx.moveTo(px + 6, cy2);     ctx.lineTo(px + w - 6, cy2);
    ctx.stroke();
    const cs = 8;
    ctx.strokeStyle = `rgba(255,100,0,${0.8 + 0.2 * pulse})`;
    ctx.lineWidth   = 2;
    [[px+2,py+2,1,1],[px+w-2,py+2,-1,1],[px+2,py+h-2,1,-1],[px+w-2,py+h-2,-1,-1]]
      .forEach(([bx,by,sx,sy]) => {
        ctx.beginPath();
        ctx.moveTo(bx + sx*cs, by); ctx.lineTo(bx, by); ctx.lineTo(bx, by + sy*cs);
        ctx.stroke();
      });

  } else if (tier === 2) { // ── PHANTOM — purple/cyan, spinning ──
    const rot = (now * 0.002) % (Math.PI * 2);
    ctx.shadowColor = `rgba(200,0,255,${0.6 + 0.4 * pulse})`;
    ctx.shadowBlur  = 22 + 10 * pulse;
    ctx.fillStyle   = `rgba(60,0,100,0.95)`;
    ctx.fillRect(px + 2, py + 2, w - 4, h - 4);
    // spinning outer rect
    ctx.save();
    ctx.translate(cx2, cy2);
    ctx.rotate(rot);
    ctx.shadowColor = `rgba(200,0,255,${0.7 + 0.3 * pulse})`;
    ctx.shadowBlur  = 16 + 8 * pulse;
    ctx.strokeStyle = `rgba(200,0,255,${0.8 + 0.2 * pulse})`;
    ctx.lineWidth   = 3;
    const s1 = w / 2 - 4;
    ctx.strokeRect(-s1, -s1, s1 * 2, s1 * 2);
    // inner diamond
    ctx.rotate(Math.PI / 4);
    ctx.shadowColor = `rgba(0,200,255,${0.5 + 0.5 * pulse})`;
    ctx.strokeStyle = `rgba(0,200,255,${0.7 + 0.3 * pulse})`;
    ctx.lineWidth   = 2;
    const s2 = w / 2 - 14;
    ctx.strokeRect(-s2, -s2, s2 * 2, s2 * 2);
    ctx.restore();
    // center dot (absolute coords)
    ctx.shadowColor = 'rgba(220,100,255,0.9)';
    ctx.shadowBlur  = 10;
    ctx.fillStyle   = `rgba(220,100,255,${0.8 + 0.2 * pulse})`;
    ctx.beginPath(); ctx.arc(cx2, cy2, 6, 0, Math.PI * 2); ctx.fill();

  } else { // ── VOID KING — black core, gold rings ──
    ctx.shadowColor = 'rgba(255,215,0,0.6)';
    ctx.shadowBlur  = 22;
    ctx.fillStyle   = 'rgba(0,0,0,0.97)';
    ctx.fillRect(px + 2, py + 2, w - 4, h - 4);
    const rings = [
      { inset:  3, col: '255,215,0',   alpha: 0.7 + 0.3*pulse,  lw: 3   },
      { inset: 12, col: '255,255,255', alpha: 0.4 + 0.2*pulse,  lw: 1.5 },
      { inset: 21, col: '255,215,0',   alpha: 0.6 + 0.3*pulse,  lw: 2   },
    ];
    for (const rd of rings) {
      const r = w / 2 - rd.inset;
      ctx.shadowColor = `rgba(${rd.col},${rd.alpha})`;
      ctx.shadowBlur  = 18;
      ctx.strokeStyle = `rgba(${rd.col},${rd.alpha})`;
      ctx.lineWidth   = rd.lw;
      ctx.strokeRect(cx2 - r, cy2 - r, r * 2, r * 2);
    }
    // spinning spokes
    ctx.save();
    ctx.translate(cx2, cy2);
    ctx.rotate((now * 0.0008) % (Math.PI * 2));
    ctx.shadowColor = 'rgba(255,215,0,0.7)';
    ctx.shadowBlur  = 8;
    ctx.strokeStyle = `rgba(255,215,0,${0.5 + 0.4*pulse})`;
    ctx.lineWidth   = 1.5;
    const spokeLen  = w / 2 - 24;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * spokeLen, Math.sin(a) * spokeLen);
      ctx.stroke();
    }
    ctx.restore();
    // center glow
    const cg = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, w * 0.14);
    cg.addColorStop(0, `rgba(255,215,0,${0.9 + 0.1*pulse})`);
    cg.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = cg;
    ctx.beginPath(); ctx.arc(cx2, cy2, w * 0.14, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
  ctx.shadowBlur = 0;
}

function startRound() {
  if (!alive) return;
  if (bossActive) return; // [1.11] stale timer guard — never spawn lasers during active boss
  _freezeVirtTime(); _appliedSpeedMult = tSpeedMult; // [1.10.2-fix] commit multiplier at round boundary
  clearTimeout(phaseTimer); round++; dashesLeft=2;
  _tickRoundMod(); // [2.0-s3.1] tick modifier duration + reset/re-apply per-round factors
  if (blackHoleCooldown > 0) blackHoleCooldown--; // [2.0-s2] BH cooldown ticks per round
  if (_asteroidsEnabled() && !asteroidTimer && !bossRound) scheduleAsteroid(); // [2.0-s2][2.0-s3.1] re-arm after boss

  // [1.12] GRIDLOCK MODE round tracking
  if (gridlockActive) {
    gridlockRoundsLeft--;
    if (gridlockRoundsLeft <= 0) _endGridlockMode(true);
    else if (hudGridlock) hudGridlock.textContent = `⚡ GRIDLOCK x${gridlockRoundsLeft}`;
  } else if (comboCount >= 20 && comboCount % 20 === 0 && !bossActive) {
    activateGridlockMode();
  }

  if (gameMode === null && currentWorld === 1 && BOSS_ROUNDS.includes(round)) { // [2.0-s4][2.0-s4e] W1 bosses at 20/40/60
    const tier = round === 20 ? 1 : round === 40 ? 2 : 3;
    startBossRound(tier);
    return;
  }
  if (gameMode === null && currentWorld === 2 && round % 20 === 0) { // [2.0-s4b][2.0-s4e] W2 bosses: 20/40/60 then every 20, cycling+faster
    const n = round / 20, idx = (n - 1) % 3, cycle = Math.floor((n - 1) / 3);
    startW2Boss(idx, Math.min(1 + 0.1 * cycle, 2)); // +10% attack speed per cycle, capped at 2×
    return;
  }

  _maybeStartRoundMod(); // [2.0-s3] possibly roll a one-round modifier (after boss intercept)

  lasers=[];
  if (_lasersEnabled()) _genLasers(Math.min(round+1+(gameMode==='timeattack'?2:0),MAX_LASERS)); // [1.10][2.0-s3.2]

  if (_blocksEnabled()) generateBlocks(); else blocks = []; // [2.0-s3.1] no blocks in W2 (or per Custom Game)
  const speedMult = ((testerActive && tSlow) ? 4 : (hardMode ? 0.625 : gameMode==='timeattack' ? 0.8 : 1)) / (testerActive ? Math.max(0.01, tSpeedMult) : 1) / roundSpeedMult; // [1.10][2.0-s3] roundSpeedMult>1 = faster obstacles
  const charge = CHARGE_START * speedMult;
  const firems = FIRE_MS * speedMult;
  const gapms  = GAP_MS  * speedMult;
  if (currentWorld === 2) { _flareChargeStart = Date.now(); _flareChargeDur = charge; } // [2.0-s2] solar flare charge anim
  render();
  flash(`Round ${round}${hardMode?' 🔥':''} — dodge!`); // [1.9]
  if (currentWorld === 2) playSolarFlareCharge(); else playSound('laser_charge'); // [2.0-s2]

  phaseTimer=_schedulePhase(()=>{ // [1.10.2]
    if (bossActive) return; // [1.11] stale timer guard — never fire lasers during boss
    if (!tFreeze) for (const L of lasers) L.state='fire';
    if (currentWorld === 2) { _flareFireStart = Date.now(); _flareFireDur = firems; } // [2.0-s2] solar flare release anim
    for (const b of blocks) { b.state='land'; spawnBlockImpact(b.x,b.y); }
    render(); flash('⚡ FIRE!'); // [1.9]
    if (currentWorld === 2) playSolarFlareRelease(); else playSound('laser_fire'); // [2.0-s2]
    checkDeathByLaser(); checkDeathByBlock();
    phaseTimer=_schedulePhase(()=>{ // [1.10.2]
      if (!alive || bossActive) return; // [1.11] stale timer guard; was: if (!alive) return
      const _baseEarned = testerActive ? 999 : (hardMode ? 3 : 1);
      const earned = Math.round(_baseEarned * (gridlockActive ? 2 : 1) * roundCoinMult); // [1.12][2.0-s3] gridlock ×2 + round modifier mult
      const roundLaserCount = lasers.length; // [1.9.2] capture before clear
      if (currentWorld === 2) { crystals += earned; if (!testerActive) sessionCrystalsEarned += earned; } // [2.0-s1]
      else { coins += earned; if (!testerActive) sessionCoinsEarned += earned; }
      save(); lasers=[]; blocks=[];
      if (!testerActive) {
        mTrackRoundSurvived(false);
        mTrackCoins(earned);
        mTrackTime(Math.round(CHARGE_START/1000) + 2); // ~duration of one round in seconds
        mTrackLaserDodged();
      }
      // [1.9.2] Extended stats — [2.0-s3] routed per world
      addStatLasers(roundLaserCount);
      addCurrencyTotal(earned); // W1 → cm_stat_coins_total, W2 → cm_world2_stat_crystals_total
      // [1.9.2] Combo
      comboCount += comboStep; // [2.0-s3] combo_boost modifier raises step
      if (comboCount > bestComboThisSession) bestComboThisSession = comboCount;
      recordBestCombo(comboCount); // [2.0-s3] per world
      if (comboCount >= 5 && comboCount % 5 === 0) {
        const _baseBonus = Math.floor(comboCount / 5);
        const bonus = _baseBonus * (gridlockActive ? 2 : 1); // [1.12] 2x in GRIDLOCK
        if (currentWorld === 2) { crystals += bonus; sessionCrystalsEarned += bonus; } // [2.0-s1]
        else { coins += bonus; sessionCoinsEarned += bonus; }
        addCurrencyTotal(bonus); // [2.0-s3] W1→coins stat, W2→crystals stat
        save();
        const comboLevel = comboCount >= 20 ? 3 : comboCount >= 10 ? 2 : 1; // [1.9.2]
        playCombo(comboLevel); // [1.9.2]
        showComboFlash(comboCount, bonus); // [1.9.2]
      }
      playSound('coin');
      render(); flash(`✓ Survived! +${earned} ${curIcon()}${gridlockActive?' ×2':''}`); // [1.9][1.12][2.0-s1]
      phaseTimer=_schedulePhase(startRound, gapms); // [1.10.2]
    }, firems);
  }, charge);
}

// [2.0-s2] Solar Flares are 2-cell-wide lasers in World 2. Covered row/col indices:
function laserIdxs(L) {
  if (currentWorld === 2) {
    const i2 = L.idx === N - 1 ? L.idx - 1 : L.idx + 1;
    return [L.idx, i2];
  }
  return [L.idx];
}
// [2.0-s2] true if cell (x,y) lies in any current flare/laser band (used by black-hole validation)
function flareCellHas(x, y) {
  for (const L of lasers) {
    const idxs = laserIdxs(L);
    if (L.type === 'row' && idxs.includes(y)) return true;
    if (L.type === 'col' && idxs.includes(x)) return true;
  }
  return false;
}

// [2.0-s5a-r5] Merge a Set of covered indices into contiguous {lo,hi} blocks (sorted).
function _mergeIndexBlocks(idxSet) {
  const sorted = [...idxSet].sort((a, b) => a - b);
  const blocks = [];
  for (const i of sorted) {
    const last = blocks[blocks.length - 1];
    if (last && i === last.hi + 1) last.hi = i;
    else blocks.push({ lo: i, hi: i });
  }
  return blocks;
}

// [2.0-s5a-r5] W1 fire-block renderer: one gradient across the whole block + center core + Void FX.
// isRow + lo..hi = merged block; pass = 'grad' | 'core'. Caller owns unified clip + save()/restore().
// pulse FX is applied ONCE by the caller (not here) to avoid per-block stacking.
function _drawLaserBlockFire(ctx, isRow, lo, hi, canvas, cs, laserCol, lxFx, now, pass) {
  const loPx = lo * cs, hiPx = (hi + 1) * cs, thick = hiPx - loPx;
  const bx = isRow ? 0 : loPx, by = isRow ? loPx : 0;
  const bw = isRow ? canvas.width : thick, bh = isRow ? thick : canvas.height;
  if (pass === 'grad') {
    // ONE cross-block gradient → adjacent rows/cols merge with no internal seam
    const g = isRow ? ctx.createLinearGradient(0, loPx, 0, hiPx)
                    : ctx.createLinearGradient(loPx, 0, hiPx, 0);
    g.addColorStop(0, laserCol.charge); g.addColorStop(0.5, laserCol.fire); g.addColorStop(1, laserCol.charge);
    ctx.fillStyle = g;
    ctx.fillRect(bx, by, bw, bh);
    return;
  }
  // pass === 'core': one core down the block center (source-over, after gradients + intersection fill)
  const mid = (loPx + hiPx) / 2;
  const cg = isRow ? ctx.createLinearGradient(0, mid - 1, 0, mid + 1)
                   : ctx.createLinearGradient(mid - 1, 0, mid + 1, 0);
  cg.addColorStop(0, 'rgba(255,255,255,0)'); cg.addColorStop(0.5, laserCol.fire); cg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = cg;
  if (isRow) ctx.fillRect(0, mid - 1, canvas.width, 2);
  else       ctx.fillRect(mid - 1, 0, 2, canvas.height);
  // Signature FX per block (Void only) — sparks/scanline here; pulse handled once by caller
  if (lxFx === 'sparks') {
    const bandLen = isRow ? canvas.width : canvas.height;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const pos = (now * 0.18 + i * (bandLen / 5)) % bandLen;
      const r   = 2 + Math.sin(now * 0.07 + i) * 1;
      ctx.beginPath();
      ctx.arc(isRow ? pos : mid, isRow ? mid : pos, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220,160,255,0.85)';
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  } else if (lxFx === 'scanline') {
    const bandLen = isRow ? canvas.width : canvas.height;
    const pos = (now * 0.22) % bandLen;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(120,220,255,0.55)';
    if (isRow) ctx.fillRect(pos - 3, by, 6, bh);
    else       ctx.fillRect(bx, pos - 3, bw, 6);
    ctx.globalCompositeOperation = 'source-over';
  }
}

// [2.0-s5a-r5] W2 solar-flare fire-block renderer: hot yellow-white sun-ray + color-tinted edges.
// isRow + lo..hi = merged block; pass = 'grad' | 'core'. No signature FX.
function _drawFlareBlockFire(ctx, isRow, lo, hi, canvas, cs, laserCol, now, pass) {
  const loPx = lo * cs, hiPx = (hi + 1) * cs, thick = hiPx - loPx;
  const bx = isRow ? 0 : loPx, by = isRow ? loPx : 0;
  const bw = isRow ? canvas.width : thick, bh = isRow ? thick : canvas.height;
  if (pass === 'grad') {
    // 5-stop sun gradient across the whole block: dark edge → laser fire → hot core → laser fire → dark edge
    const g = isRow ? ctx.createLinearGradient(0, loPx, 0, hiPx)
                    : ctx.createLinearGradient(loPx, 0, hiPx, 0);
    g.addColorStop(0, laserCol.charge); g.addColorStop(0.25, laserCol.fire);
    g.addColorStop(0.5, '#fff6b0'); g.addColorStop(0.75, laserCol.fire); g.addColorStop(1, laserCol.charge);
    ctx.fillStyle = g;
    ctx.fillRect(bx, by, bw, bh);
    return;
  }
  // pass === 'core': yellow-white solar ray down the block center + glow
  const mid = (loPx + hiPx) / 2, flicker = 0.85 + 0.15 * Math.sin(now * 0.02);
  ctx.save();
  ctx.globalAlpha = flicker; ctx.shadowColor = '#ffdd55'; ctx.shadowBlur = 10;
  ctx.fillStyle = 'rgba(255,250,200,0.9)';
  if (isRow) ctx.fillRect(0, mid - 1, canvas.width, 2);
  else       ctx.fillRect(mid - 1, 0, 2, canvas.height);
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  ctx.restore();
}

// [2.0-s2] SOLAR FLARES (World 2): warning = semi-transparent 2-wide band (like the World 1
// laser warning); beam = fully-opaque bright orange/yellow 2-wide band, clamped to the board.
function _flareBandRect(L) { // exactly 2 cells wide, clamped within board boundaries
  const idxs = laserIdxs(L);
  const i0 = Math.min(idxs[0], idxs[1]); // laserIdxs already clamps idx===N-1 → [N-2,N-1]
  if (L.type === 'row') ctx.rect(0, i0*cellSize, canvas.width, 2*cellSize);
  else                  ctx.rect(i0*cellSize, 0, 2*cellSize, canvas.height);
}
function drawSolarFlares(now) { // [2.0-s5a-r3] reads laserColorId; [2.0-s5a-r2] unified fire clip
  const laserCol   = LASER_COLORS[laserColorId] || LASER_COLORS.red; // [2.0-s5a-r3]
  const fireFlares   = lasers.filter(l => l.state === 'fire');
  const chargeFlares = lasers.filter(l => l.state === 'charge');
  const pulse = .45 + .35*Math.sin(now*.009);

  // Warning (charge) — muted, tinted to selected laser color [2.0-s5a-r3]
  if (chargeFlares.length > 0) {
    ctx.save();
    ctx.beginPath();
    for (const L of chargeFlares) _flareBandRect(L);
    ctx.clip();
    ctx.globalAlpha = .28 + .22*pulse;
    ctx.fillStyle = laserCol.charge; // [2.0-s5a-r3] was '#7a2a00'
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Beam (fire) — block-merged solar bands [2.0-s5a-r5]
  if (fireFlares.length > 0) {
    const rowSet = new Set(), colSet = new Set();
    for (const L of fireFlares) {
      const idxs = laserIdxs(L);
      if (L.type === 'row') for (const i of idxs) rowSet.add(i);
      else                  for (const i of idxs) colSet.add(i);
    }
    const rowBlocks = _mergeIndexBlocks(rowSet), colBlocks = _mergeIndexBlocks(colSet);
    ctx.save();
    ctx.beginPath(); // unified clip = union of all block rects
    for (const b of rowBlocks) ctx.rect(0, b.lo * cellSize, canvas.width, (b.hi - b.lo + 1) * cellSize);
    for (const b of colBlocks) ctx.rect(b.lo * cellSize, 0, (b.hi - b.lo + 1) * cellSize, canvas.height);
    ctx.clip();
    // pass 1: sun gradients
    for (const b of rowBlocks) _drawFlareBlockFire(ctx, true,  b.lo, b.hi, canvas, cellSize, laserCol, now, 'grad');
    for (const b of colBlocks) _drawFlareBlockFire(ctx, false, b.lo, b.hi, canvas, cellSize, laserCol, now, 'grad');
    // pass 2: radial solar junction — hot yellow-white center fading to corners [2.0-s5a-r6]
    for (const r of rowBlocks) for (const c of colBlocks) {
      const ix = c.lo * cellSize, iy = r.lo * cellSize;
      const iw = (c.hi - c.lo + 1) * cellSize, ih = (r.hi - r.lo + 1) * cellSize;
      const ccx = ix + iw / 2, ccy = iy + ih / 2;
      const rad = Math.max(iw, ih) * 0.75;
      const g = ctx.createRadialGradient(ccx, ccy, 0, ccx, ccy, rad);
      g.addColorStop(0,    '#fff6b0');      // hot yellow-white center
      g.addColorStop(0.55, laserCol.fire);  // laser color mid
      g.addColorStop(1,    laserCol.charge); // softly darker toward corners
      ctx.fillStyle = g;
      ctx.fillRect(ix, iy, iw, ih);
    }
    // pass 3: yellow-white solar cores on top
    for (const b of rowBlocks) _drawFlareBlockFire(ctx, true,  b.lo, b.hi, canvas, cellSize, laserCol, now, 'core');
    for (const b of colBlocks) _drawFlareBlockFire(ctx, false, b.lo, b.hi, canvas, cellSize, laserCol, now, 'core');
    ctx.restore();
  }
}

function checkDeathByLaser() {
  if (bossActive) return; // [1.11] stale timer guard
  if ((testerActive && tNoclip) || tutorialActive) return; // [2.0-s4h]
  if (blackHoleAnimating) return; // [2.0-s2] invincible mid-teleport
  for (const L of lasers) {
    if (L.state!=='fire') continue;
    const idxs = laserIdxs(L); // [2.0-s2] 2-wide in World 2
    if (L.type==='row'&&idxs.includes(cube.y)) return die('laser');
    if (L.type==='col'&&idxs.includes(cube.x)) return die('laser');
  }
}
function checkDeathByBlock() {
  if ((testerActive && tNoclip) || tutorialActive) return; // [2.0-s4h]
  for (const b of blocks)
    if (b.state==='land'&&b.x===cube.x&&b.y===cube.y) return die('block'); // [1.9]
}

function _resetTesterSettings() { // [1.10.2]
  tNoclip = false; tSlow = false; tFreeze = false; tDashInf = false; tInfBlackHole = false; // [2.0-s4d]
  setFps(false); tSpeedMult = 1.0; _appliedSpeedMult = 1.0; // [1.10.2-fix]
  _fabOpen = false;
  document.getElementById('tester-fab-menu')?.classList.add('fab-hidden');
  fabPaused = false;
  if (testerActive) renderFabMenu();
}

function _timeAttackOver() { // [1.10]
  if (!alive) return;
  alive = false; lastTime = (_virtMs() / 1000).toFixed(1); // [1.10.2-fix]
  clearTimeout(phaseTimer);
  _resetTesterSettings(); // [1.10.2]
  if (hudTimerEl) { hudTimerEl.textContent = '⏱ 0s'; hudTimerEl.className = 'urgent'; }
  const _newRecord = round > bestTimeAttack;
  if (_newRecord) { bestTimeAttack = round; localStorage.setItem('cm_best_timeattack', bestTimeAttack); }
  if (_newRecord) playRecord();
  if (currentWorld === 2) w2Games++; else gamesPlayed++; // [2.0-s3] per world
  save();
  const titleEl = document.getElementById('death-title');
  if (titleEl) titleEl.textContent = "TIME'S UP!";
  setTimeout(() => {
    deathStats.innerHTML =
      `⏱ Time Attack — 60 seconds<br>`+
      `${bestComboThisSession >= 5 ? '🔥 Best combo: <b>x'+bestComboThisSession+'</b><br>' : ''}`+
      `<br>Rounds: <b><span id="_dr">0</span></b> &nbsp;|&nbsp; `+
      `<span style="color:#ffd700">🪙 +<span id="_dc">0</span></span><br>`+
      `Best (Time Attack): <b>${bestTimeAttack} rounds</b>`;
    deathOverlay.classList.add('show');
    animateCounter('_dr', round, 520);
    animateCounter('_dc', sessionCoinsEarned, 520);
    document.getElementById('btn-retry').style.display = '';
  }, 400);
}

function die(reason) {
  if (customGame) return; // [2.0-s3.2] sandbox: player is immortal
  if (tutorialActive) return; // [2.0-s4h] tutorial: player is immortal (single robust funnel)
  if (bossRound) _cleanupBoss(); // [1.11]
  if (gridlockActive) _endGridlockMode(false); // [1.12]
  _resetRoundMods(); // [2.0-s3]
  asteroids = []; clearTimeout(asteroidTimer); asteroidTimer = null; _resetBlackHole(); // [2.0-s2]
  alive=false; lastTime=(_virtMs()/1000).toFixed(1); // [1.10.2-fix]
  clearTimeout(phaseTimer);
  _resetTesterSettings(); // [1.10.2]
  playSound('die');
  spawnDeath(cube.x, cube.y);
  cubeDrawPending = null; // hide cube from canvas
  // [1.10] Mode-specific record + lock
  if (gameMode === 'hardcore') {
    localStorage.setItem('cm_hardcore_date', _todayStr());
    if (round > bestHardcore) { bestHardcore = round; localStorage.setItem('cm_best_hardcore', bestHardcore); }
  }
  if (gameMode === 'daily') {
    localStorage.setItem('cm_daily_score', round);
    if (round > bestDaily) { bestDaily = round; localStorage.setItem('cm_best_daily', bestDaily); }
  }
  if (gameMode === 'timeattack') {
    if (round > bestTimeAttack) { bestTimeAttack = round; localStorage.setItem('cm_best_timeattack', bestTimeAttack); }
  }

  const _lastT = parseFloat(lastTime);
  // [1.9.2] Combo — capture session best, reset unless tester (session state, always)
  if (!testerActive && comboCount > bestComboThisSession) bestComboThisSession = comboCount;
  if (!testerActive) comboCount = 0;
  // [2.0-s3] records routed per world — [2.0-s3.1] skipped entirely for the Custom Game sandbox
  let _newRecord = false;
  let newUnlock = null;
  if (!customGame) {
    if (currentWorld === 2) { if (_lastT > w2BestTime) w2BestTime = _lastT; }
    else                    { if (_lastT > bestTime)   bestTime   = _lastT; }
    const _curBestRound = currentWorld === 2 ? w2BestRound : bestRound;
    _newRecord = round > _curBestRound; // [1.9.2] capture before update
    if (currentWorld === 2) { if (round > w2BestRound) w2BestRound = round; }
    else                    { if (round > bestRound)   bestRound   = round; }
    if (_newRecord) playRecord(); // [1.9.2]
    recordBestCombo(bestComboThisSession); // [2.0-s3] per world
    addTimePlayed(Math.round(_lastT)); // [2.0-s3]
    if (currentWorld === 2) w2Games++; else gamesPlayed++; // [2.0-s3]
    // unlock prestige skins for round records
    for (const s of SKINS.filter(s=>s.unlock)) {
      if (round >= s.unlock && !owned.includes(s.id)) { owned.push(s.id); newUnlock = s; }
    }
  }
  save();

  setTimeout(()=>{
    deathStats.innerHTML = // [1.9.2]
      `${reason==='block'?'🟪 Crushed by a block':reason==='asteroid'?'☄️ Smashed by an asteroid':currentWorld===2?'☀️ Burned by a Solar Flare':'💀 Hit by a laser'}<br>`+
      `${hardMode?'<span style="color:#ff6600">🔥 Hard Mode</span><br>':''}`+
      `${bestComboThisSession >= 5 ? '🔥 Best combo: <b>x'+bestComboThisSession+'</b><br>' : ''}`+ // [1.9.2]
      `<br>Time: <b>${lastTime}s</b> &nbsp;|&nbsp; Rounds: <b><span id="_dr">0</span></b><br>`+ // [1.9.3]
      `<span style="color:#ffd700">${curIcon()} ${currentWorld===2?'Crystals':'Coins'} earned: <b>+<span id="_dc">0</span></b></span><br>`+ // [1.9.3][2.0-s1]
      `Best time: <b>${currentWorld===2?w2BestTime:bestTime}s</b> &nbsp;|&nbsp; Best rounds: <b>${currentWorld===2?w2BestRound:bestRound}</b>`+ // [2.0-s3] per world
      (_newRecord ? `<br><span class="new-best">★ NEW BEST!</span>` : '')+ // [1.9.3]
      (gameMode==='timeattack' ? `<br>Best (Time Attack): <b>${bestTimeAttack} rounds</b>` : '')+ // [1.10]
      (gameMode==='hardcore'   ? `<br>Best (Hardcore): <b>${bestHardcore} rounds</b>` : '')+      // [1.10]
      (gameMode==='daily'      ? `<br>Best (Daily): <b>${bestDaily} rounds</b>` : '')+            // [1.10]
      (newUnlock ? `<br><br><span style="color:#ffd700;font-size:15px">🏆 UNLOCKED: ${newUnlock.name}!</span>` : '');
    deathOverlay.classList.add('show');
    animateCounter('_dr', round, 520);           // [1.9.3]
    animateCounter('_dc', currentWorld===2 ? sessionCrystalsEarned : sessionCoinsEarned, 520); // [1.9.3][2.0-s1]
    // [1.10] Hide retry for locked modes (hardcore/daily die = locked)
    const retryBtn = document.getElementById('btn-retry');
    if (gameMode === 'hardcore' || gameMode === 'daily') retryBtn.style.display = 'none';
    else retryBtn.style.display = '';
  }, 400);
}

// ══════════════════════════════════════════════════
// START / RESTART
// ══════════════════════════════════════════════════
const screenStats = document.getElementById('screen-stats');

// ══════════════════════════════════════════════════
// TRYB TESTERA
// ══════════════════════════════════════════════════
const screenPin    = document.getElementById('screen-pin');
let pinBuffer = '';

function updatePinDisplay() {
  const shown = pinBuffer.padEnd(9,'_').split('').map((c,i)=>i<pinBuffer.length?'●':'_').join(' '); // [1.9.2]
  document.getElementById('pin-display').textContent = shown;
}

async function submitPin() {
  const ok = await _vp(pinBuffer);
  if (ok) {
    testerUnlocked = true;
    showMenu(); enableTesterMode(); // [1.10.1]
  } else {
    document.getElementById('pin-error').textContent='INVALID CODE'; // [1.9]
    pinBuffer='';
    updatePinDisplay();
    setTimeout(()=>document.getElementById('pin-error').textContent='', 1500);
  }
}

function _updToggle(id, val) {
  const b = document.getElementById(id);
  if (!b) return;
  b.textContent = val ? 'ON' : 'OFF';
  b.className = 'tester-toggle' + (val ? ' on' : '');
}

function _tFeedback(id, msg) {
  const b = document.getElementById(id);
  if (!b) return;
  const orig = b.textContent;
  b.textContent = msg;
  setTimeout(()=> b.textContent = orig, 1500);
}

// ══════════════════════════════════════════════════
// BACKGROUND — ANIMATED PARTICLES
// ══════════════════════════════════════════════════
(function initBgParticles(){
  const cv = document.getElementById('bg-canvas');
  if (!cv) return;
  const ctx2 = cv.getContext('2d');
  let W, H, pts = [];
  function resize(){ W=cv.width=innerWidth; H=cv.height=innerHeight; }
  resize(); window.addEventListener('resize', resize);

  // Generate particles
  const N2 = Math.min(40, Math.floor(innerWidth*innerHeight/18000));
  for (let i=0;i<N2;i++) pts.push({
    x: Math.random()*innerWidth, y: Math.random()*innerHeight,
    vx:(Math.random()-.5)*.18, vy:(Math.random()-.5)*.18,
    r: .6+Math.random()*1.2, a: Math.random(),
    hue: Math.random()<.6 ? 190 : Math.random()<.5 ? 280 : 60
  });

  let bgFrame;
  function draw(){
    ctx2.clearRect(0,0,W,H);
    for(const p of pts){
      p.x += p.vx; p.y += p.vy;
      p.a += .008;
      if(p.x<0) p.x=W; if(p.x>W) p.x=0;
      if(p.y<0) p.y=H; if(p.y>H) p.y=0;
      const alpha = (.3+.25*Math.sin(p.a))*.7;
      ctx2.beginPath();
      ctx2.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx2.fillStyle = currentWorld === 2 ? `hsla(265,70%,85%,${alpha})` : `hsla(${p.hue},100%,70%,${alpha})`; // [2.0-s1] cosmic tint
      ctx2.fill();
    }
    bgFrame = requestAnimationFrame(draw);
  }
  draw();
})();

// ══════════════════════════════════════════════════
// MENU COINS COUNTER
// ══════════════════════════════════════════════════
const menuCoinsEl = document.getElementById('menu-coins');
let displayedCoins = -1;

function updateMenuCoins(animate=false){
  if (!menuCoinsEl) return;
  const _wal = curWallet(); // [2.0-s1]
  menuCoinsEl.textContent = `${curIcon()} ${_wal}`;
  if (animate && displayedCoins !== _wal) {
    menuCoinsEl.classList.remove('bump');
    requestAnimationFrame(()=> menuCoinsEl.classList.add('bump'));
    setTimeout(()=> menuCoinsEl.classList.remove('bump'), 350);
  }
  displayedCoins = _wal;
}

// Coin float effect
function spawnMenuCoinFloat(amount, x, y){
  const el = document.createElement('div');
  el.className = 'float-coin';
  el.textContent = `+${amount} 🪙`;
  el.style.cssText = `left:${x}px;top:${y}px;color:#ffd700;font-size:16px;font-weight:bold;font-family:monospace;`;
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 950);
}

// ── UI SOUNDS ──
function playUISound(type){ // [1.9.2] enhanced
  try {
    const ac=getAudio(), now=ac.currentTime;
    if(type==='click'){
      const o=ac.createOscillator(), g=ac.createGain();
      o.type='sine'; o.frequency.setValueAtTime(700,now); o.frequency.exponentialRampToValueAtTime(280,now+0.05);
      g.gain.setValueAtTime(0.07,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.065);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(now+0.065);
    } else if(type==='tab'){
      const o=ac.createOscillator(), g=ac.createGain();
      o.type='sine'; o.frequency.setValueAtTime(220,now);
      o.frequency.exponentialRampToValueAtTime(550,now+0.08);
      o.frequency.exponentialRampToValueAtTime(380,now+0.16);
      g.gain.setValueAtTime(0.06,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.19);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(now+0.19);
    } else if(type==='reward'){
      [[660,0],[990,0.1]].forEach(([freq,delay])=>{
        const o=ac.createOscillator(), g=ac.createGain();
        o.type='sine'; o.frequency.value=freq;
        g.gain.setValueAtTime(0.13,now+delay); g.gain.exponentialRampToValueAtTime(0.001,now+delay+0.28);
        o.connect(g); g.connect(ac.destination); o.start(now+delay); o.stop(now+delay+0.28);
      });
    }
  } catch(e){}
}

// Wire click sounds to menu buttons
document.querySelectorAll('.menu-btn,.pin-btn,.mission-claim-btn,.tester-toggle').forEach(b=>{
  b.addEventListener('click', ()=> playUISound('click'));
});

// ── FPS COUNTER ──
const hudFpsEl = document.getElementById('hud-fps');
function fpsLoop(ts) {
  fpsFrames++;
  if (ts - fpsLast >= 1000) {
    fpsCurrent = fpsFrames; fpsFrames = 0; fpsLast = ts;
    if (hudFpsEl) hudFpsEl.textContent = fpsCurrent + ' FPS';
  }
  if (tFps && alive) requestAnimationFrame(fpsLoop);
  else if (hudFpsEl) hudFpsEl.textContent = '';
}
function setFps(on) {
  tFps = on;
  if (hudFpsEl) hudFpsEl.style.display = on ? 'block' : 'none';
  if (on && alive) { fpsFrames=0; fpsLast=performance.now(); requestAnimationFrame(fpsLoop); }
}

// ── CENTRALIZED SCREEN MANAGEMENT ──
// Instead of manually showing/hiding each screen — one function
const SCREENS = ['screen-start','screen-stats','screen-pin','screen-missions','screen-modes','screen-world-choice','screen-cubek2','app']; // [1.10] [1.10.1] removed screen-tester [2.0-s1] world screens [2.0-s4h] removed screen-tutorial
function showScreen(id) { // [1.9.3] fade-in on target screen
  SCREENS.forEach(s => {
    const el = s==='app' ? appEl : document.getElementById(s);
    if (!el) return;
    if (s === id) {
      el.style.transition = 'opacity .15s ease';
      el.style.visibility = 'visible';
      el.style.pointerEvents = 'auto';
      el.style.opacity = '0';
      requestAnimationFrame(() => { el.style.opacity = '1'; });
    } else {
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
      el.style.opacity = '0';
    }
  });
}

function showModes() { // [1.10]
  showScreen('screen-modes');
  _renderModeCards();
  clearInterval(_modesCountdownInterval);
  _modesCountdownInterval = setInterval(_updateModeCountdowns, 1000);
}
function _renderModeCards() { // [1.10]
  ['timeattack','hardcore','daily'].forEach(id => {
    const card = document.getElementById('mode-card-' + id);
    const status = card.querySelector('.mode-card-status');
    const blocked = _isModeBlocked(id);
    card.classList.toggle('blocked', blocked);
    if (blocked) {
      status.textContent = `⏳ ${_fmtCountdown(_msUntilMidnight())}`;
      card.onclick = null;
    } else {
      status.textContent = '';
      card.onclick = () => startModeGame(id);
    }
  });
}
function _updateModeCountdowns() { // [1.10]
  ['hardcore','daily'].forEach(id => {
    if (!_isModeBlocked(id)) return;
    const card = document.getElementById('mode-card-' + id);
    const status = card.querySelector('.mode-card-status');
    if (status) status.textContent = `⏳ ${_fmtCountdown(_msUntilMidnight())}`;
  });
}
function startModeGame(mode) { // [1.10]
  clearInterval(_modesCountdownInterval);
  gameMode = mode;
  startGame(false);
}

function showMenu() {
  clearInterval(_modesCountdownInterval); // [1.10]
  gameMode = null; // [1.10]
  showScreen('screen-start');
  deathOverlay.classList.remove('show');
  clearTimeout(phaseTimer);
  alive = false;
  fabPaused = false; // [1.10.2]
  customGame = false; // [2.0-s3.1] leave the sandbox on returning to menu
  tutorialActive = false; // [2.0-s4h] defensive: never linger into the menu
  asteroids = []; clearTimeout(asteroidTimer); asteroidTimer = null; _resetBlackHole(); // [2.0-s2]
  _restoreTesterSnap(); // [1.10.1] undo tester's 999-coin rounds if snap exists
  // refresh bottom bar
  const barTester = document.getElementById('bar-tester');
  if (barTester) barTester.classList.toggle('active', testerUnlocked);
  // [2.0-s1] world-switch button — hidden until VOID KING defeated
  const wsBtn = document.getElementById('btn-world-switch');
  if (wsBtn) {
    wsBtn.style.display = world2Unlocked ? '' : 'none';
    wsBtn.textContent = currentWorld === 2 ? '⚡ RETURN TO GRID' : '✦ ENTER THE VOID';
  }
  applyWorldTheme(); // [2.0-s1] reflect current world's theme on the menu
  updateMenuCoins();
  playUISound('tab');
  if (missionState) {
    const wt = missionState.weekType;
    const barM = document.getElementById('bar-missions');
    if (barM) barM.className = `menu-bar-btn${wt==='luckiest'?' luckiest':wt==='lucky'?' lucky':''}`;
  }
}

function fmtStat(n) { // [1.10.2] compact number formatter
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}
let statsView = 1; // [2.0-s3] which world's stats are shown (1 or 2)
function showStats() {
  const tabs = document.getElementById('stats-tabs'); // [2.0-s3] hide W2 tab until unlocked (no spoilers)
  if (tabs) tabs.style.display = world2Unlocked ? '' : 'none';
  statsView = world2Unlocked ? currentWorld : 1; // default to current world once unlocked
  showScreen('screen-stats');
  renderStats();
}
function renderStats() { // [2.0-s3] fill the stat screen from the selected world's set
  const w2 = statsView === 2;
  const scr = document.getElementById('screen-stats');
  if (scr) scr.classList.toggle('stats-w2', w2);
  document.getElementById('stats-tab-w1').classList.toggle('active', !w2);
  document.getElementById('stats-tab-w2').classList.toggle('active',  w2);
  // wallet + dynamic labels
  document.getElementById('st-coins').textContent     = w2 ? `${crystals} ✦` : `${coins} 🪙`;
  document.getElementById('st-lasers-lbl').textContent      = w2 ? 'FLARES DODGED' : 'LASERS DODGED';
  document.getElementById('st-coins-total-lbl').textContent = w2 ? 'CRYSTALS EARNED' : 'COINS EARNED';
  // values
  document.getElementById('st-best-time').textContent  = `${w2 ? w2BestTime : bestTime}s`;
  document.getElementById('st-best-round').textContent = `${w2 ? w2BestRound : bestRound}`;
  document.getElementById('st-games').textContent      = `${w2 ? w2Games : gamesPlayed}`;
  document.getElementById('st-skins').textContent      = `${owned.length+boardsOwned.length+lasersOwned.length}/${SKINS.length+BOARD_SKIN_LIST.length+LASER_COLOR_LIST.length}`; // global cosmetics
  document.getElementById('st-lasers').textContent      = fmtStat(w2 ? w2StatLasers : statLasers);
  document.getElementById('st-time').textContent        = formatTimePlayed(w2 ? w2TimePlayed : statTimePlayed);
  document.getElementById('st-coins-total').textContent = fmtStat(w2 ? w2CrystalsTotal : statCoinsTotal);
  const _bc = w2 ? w2BestCombo : statBestCombo;
  document.getElementById('st-best-combo').textContent  = _bc > 0 ? `🔥 x${fmtStat(_bc)}` : '—';
}
function formatTimePlayed(s) { // [1.9.2]
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function showPin() {
  showScreen('screen-pin');
  pinBuffer='';
  updatePinDisplay();
  document.getElementById('pin-error').textContent='';
}

function enableTesterMode() { // [1.10.1]
  testerActive = true; // [1.10.2-fix] in-memory only, no localStorage
  showFab();
}
function showFab() { // [1.10.1]
  const el = document.getElementById('tester-fab');
  if (el) el.style.display = '';
}
function hideFab() { // [1.10.1]
  const el = document.getElementById('tester-fab');
  if (el) el.style.display = 'none';
}

function fabPauseGame() { // [1.10.2]
  if (!alive || fabPaused) return;
  fabPaused = true;
  _pauseStart = Date.now(); // [2.0-s2] freeze time-based asteroids/teleport
  if (blackHoleAnimating) { _bhRemaining = Math.max(0, _bhFiresAt - Date.now()); clearTimeout(_bhTimer); _bhTimer = null; } // [2.0-s2]
  _freezeVirtTime(); // [1.10.2-fix] freeze virtual time at pause moment so pause duration is excluded
  clearTimeout(phaseTimer);
  _phaseRemainingMs = Math.max(0, _phaseFiresAt - Date.now());
  const cf = document.getElementById('combo-flash'); // [1.10.2] pause combo flash timers
  if (cf) {
    clearTimeout(cf._t1); clearTimeout(cf._t2);
    cf._t1Remaining = (cf._t1FiresAt > 0) ? Math.max(0, cf._t1FiresAt - Date.now()) : 0;
    cf._t2Remaining = (cf._t2FiresAt > 0) ? Math.max(0, cf._t2FiresAt - Date.now()) : 0;
  }
  startAnim(); // keep loop running to draw pause overlay
}
function fabResumeGame() { // [1.10.2]
  if (!fabPaused) return;
  fabPaused = false;
  const _pd = Date.now() - _pauseStart; // [2.0-s2] pause duration
  for (const a of asteroids) { a.born += _pd; a.warnUntil += _pd; } // shift so they don't jump
  if (blackHoleAnimating && blackHole) { // [2.0-s2] resume frozen teleport
    blackHole.born += _pd;
    _bhFiresAt = Date.now() + _bhRemaining;
    _bhTimer = setTimeout(_bhFinish, _bhRemaining);
  }
  _virtBase = Date.now(); // [1.10.2-fix] exclude pause duration from virtual time
  if (blackHoleReadyAt > 0) blackHoleReadyAt += _pd; // [2.0-s4g] exclude pause from BH cooldown countdown
  if (alive && _phaseFn) {
    phaseTimer = setTimeout(_phaseFn, _phaseRemainingMs);
  }
  const cf = document.getElementById('combo-flash'); // [1.10.2] resume combo flash timers
  if (cf) {
    if (cf._t1Remaining > 0) cf._t1 = setTimeout(() => { cf.style.opacity = '0'; cf._t1FiresAt = 0; }, cf._t1Remaining);
    if (cf._t2Remaining > 0) cf._t2 = setTimeout(() => { cf.style.display = 'none'; cf._t2FiresAt = 0; }, cf._t2Remaining);
    cf._t1Remaining = 0; cf._t2Remaining = 0;
  }
}

let _fabOpen = false;         // [1.10.2] tracks FAB open state independently of DOM/speed
let _fabFeedbackTimer = null; // [1.10.2]
function showFabFeedback(msg) { // [1.10.2]
  const el = document.getElementById('fab-feedback');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(_fabFeedbackTimer);
  _fabFeedbackTimer = setTimeout(() => { el.style.display = 'none'; }, 1500);
}

// ── FAB MENU ──────────────────────────────────────────────────────────────────
function renderFabMenu() { // [1.10.1]
  const menu = document.getElementById('tester-fab-menu');
  if (!menu) return;
  let html = '';
  if (customGame) { // [2.0-s3.2] sandbox: only the live hazard toggles + exit
    html += `<div class="fab-section">🧪 Custom Game</div>`;
    html += fabToggle('Lasers / Flares', customCfg.lasers,    'fab-cg-lasers');
    html += fabToggle('Asteroids',       customCfg.asteroids, 'fab-cg-asteroids');
    html += fabToggle('Blocks',          customCfg.blocks,    'fab-cg-blocks');
    html += fabToggle('Black Hole',      customCfg.blackhole, 'fab-cg-blackhole');
    html += fabToggle('FPS counter',     tFps,                'fab-fps');
    html += `<button class="fab-action" onclick="showMenu()">← Exit sandbox</button>`;
    menu.innerHTML = html;
    attachFabToggles();
    return;
  }
  if (alive) {
    html += `<div class="fab-section">⚡ Game</div>`;
    html += fabToggle('Noclip', tNoclip, 'fab-noclip');
    html += fabToggle('Slow mode (25%)', tSlow, 'fab-slow');
    html += fabToggle('Freeze lasers', tFreeze, 'fab-freeze');
    html += fabToggle('Infinite dashes', tDashInf, 'fab-infdash');
    html += fabToggle('♾ Unlimited Black Holes', tInfBlackHole, 'fab-infbh'); // [2.0-s4d]
    html += fabToggle('FPS counter', tFps, 'fab-fps');
    html += `<div class="fab-section">🎮 Actions</div>`;
    html += `<button class="fab-action" onclick="triggerDeath()">💀 Trigger death</button>`;
    html += `<button class="fab-action" onclick="nextRound()">⏭ Next round</button>`;
    html += `<button class="fab-action" onclick="triggerBossRound()">👾 Trigger boss round</button>`; // [1.11]
    html += `<button class="fab-action" onclick="testerSwitchWorld()">🌌 Switch World (W1↔W2)</button>`; // [2.0-s4c]
    html += `<button class="fab-action" onclick="activateGridlockMode()">⚡ Trigger GRIDLOCK</button>`; // [1.12]
    html += `<div class="fab-input-row">
      <input class="fab-input" id="fab-round-input" type="number" min="1" max="999" value="1" style="width:60px">
      <button class="fab-action" onclick="skipToRound()">⏩ Skip to round</button>
    </div>`;
    html += `<div class="fab-input-row">
      <input class="fab-input" id="fab-combo-input" type="number" min="0" max="99" value="5" style="width:60px">
      <button class="fab-action" onclick="setComboFab()">🔥 Set combo</button>
    </div>`;
    html += `<div class="fab-input-row">
      <input class="fab-input" id="fab-coins-ingame-input" type="number" min="0" value="100" style="width:60px">
      <button class="fab-action" onclick="addCoinsFab()">🪙 Add coins</button>
    </div>`;
    html += `<div class="fab-section">⚡ Speed multiplier</div>`;
    html += `<div style="display:flex;align-items:center;gap:6px;">
      <input type="range" id="fab-speed-slider" min="0.01" max="10" step="0.01" value="${tSpeedMult}" style="flex:1;accent-color:#0cf;">
      <span id="fab-speed-label" style="color:#0cf;font-size:12px;min-width:38px;text-align:right">${tSpeedMult.toFixed(2)}x</span>
    </div>`;
    html += `<div class="fab-input-row">
      <input class="fab-input" id="fab-speed-input" type="number" min="0.01" max="10" step="0.01" value="${tSpeedMult}">
      <button class="fab-action" onclick="setSpeedFab()">SET</button>
    </div>`;
    html += `<div class="fab-section">🎲 Round Modifiers</div>`; // [2.0-s3.1]
    html += `<button class="fab-action" onclick="triggerRoundMod('double_coins')">🪙 Double Coins</button>`;
    html += `<button class="fab-action" onclick="triggerRoundMod('extra_dash')">⚡ Extra Dash</button>`;
    html += `<button class="fab-action" onclick="triggerRoundMod('combo_boost')">🔥 Combo Boost</button>`;
    html += `<button class="fab-action" onclick="triggerRoundMod('fast_lasers')">💨 Fast Obstacles</button>`;
    html += `<button class="fab-action" onclick="triggerRoundMod('grid_glitch')">📺 Grid Glitch</button>`;
  }
  if (!alive) { // [1.12] hide non-game sections during gameplay
    html += `<div class="fab-section">📋 Missions</div>`;
    html += `<button class="fab-action" onclick="setMissionWeek(0)">📅 Normal day</button>`;   // [2.0-s4]
    html += `<button class="fab-action" onclick="setMissionWeek(1)">⭐ Lucky day</button>`;     // [2.0-s4]
    html += `<button class="fab-action" onclick="setMissionWeek(2)">🌟 Luckiest day</button>`;  // [2.0-s4]
    html += `<button class="fab-action" onclick="completeMissions()">✅ Complete all</button>`;
    html += `<button class="fab-action" onclick="newRandomMissions()">🔀 New random</button>`;
    html += `<div class="fab-section">🎨 Skins</div>`;
    html += `<button class="fab-action" onclick="unlockPrestigeSkins()">🏆 Unlock prestige</button>`;
    html += `<button class="fab-action" onclick="unlockAllSkins()">🎁 Unlock all skins</button>`;
    html += `<button class="fab-action" onclick="resetAllSkins()">🗑 Reset all skins</button>`; // [1.10.2]
    html += `<button class="fab-action" onclick="cycleVoidSkins()">🌌 Cycle Void skins</button>`;   // [5a-debug]
    html += `<button class="fab-action" onclick="cycleVoidBoards()">🪐 Cycle Void boards</button>`; // [5a-debug]
    html += `<button class="fab-action" onclick="cycleVoidLasers()">☄ Cycle Void lasers</button>`;  // [5a-debug]
    html += `<div class="fab-section">💾 Data</div>`;
    html += `<div class="fab-input-row">
      <input class="fab-input" id="fab-coins-input" type="number" min="0" value="1000">
      <button class="fab-action" onclick="setCoinsFab()">SET coins</button>
    </div>`;
    html += `<div class="fab-section">🔄 Modes</div>`;
    html += `<button class="fab-action" onclick="resetDailyMode()">📅 Reset Daily</button>`;
    html += `<button class="fab-action" onclick="resetHardcoreMode()">💀 Reset Hardcore</button>`;
    html += `<div class="fab-section">🧪 Custom Game</div>`; // [2.0-s3.1] sandbox — empty board + chosen hazards
    html += fabToggle('Lasers / Flares', customCfg.lasers,   'fab-cg-lasers');
    html += fabToggle('Asteroids',       customCfg.asteroids,'fab-cg-asteroids');
    html += fabToggle('Blocks',          customCfg.blocks,   'fab-cg-blocks');
    html += fabToggle('Black Hole',      customCfg.blackhole,'fab-cg-blackhole');
    html += `<button class="fab-action" onclick="startCustomGame()">▶ Start Custom Game</button>`;
  } // [1.12] end !alive block
  menu.innerHTML = html;
  attachFabToggles();
}

function fabToggle(label, state, id) { // [1.10.1]
  return `<div class="fab-toggle">
    <span>${label}</span>
    <button class="fab-toggle-btn ${state?'on':''}" id="${id}">${state?'ON':'OFF'}</button>
  </div>`;
}

function attachFabToggles() { // [1.10.1]
  const toggles = {
    'fab-noclip':  () => { tNoclip  = !tNoclip;  },
    'fab-slow':    () => { tSlow    = !tSlow;    },
    'fab-freeze':  () => { tFreeze  = !tFreeze;  },
    'fab-infdash': () => { tDashInf = !tDashInf; },
    'fab-infbh':   () => { tInfBlackHole = !tInfBlackHole; updateBlackHoleHud(); }, // [2.0-s4d]
    'fab-fps':     () => { setFps(!tFps);        },
    'fab-cg-lasers':    () => { customCfg.lasers    = !customCfg.lasers;    _customApplyToggles(); }, // [2.0-s3.1][2.0-s3.2]
    'fab-cg-asteroids': () => { customCfg.asteroids = !customCfg.asteroids; _customApplyToggles(); }, // [2.0-s3.1][2.0-s3.2]
    'fab-cg-blocks':    () => { customCfg.blocks    = !customCfg.blocks;    _customApplyToggles(); }, // [2.0-s3.1][2.0-s3.2]
    'fab-cg-blackhole': () => { customCfg.blackhole = !customCfg.blackhole; _customApplyToggles(); }, // [2.0-s3.1][2.0-s3.2]
  };
  Object.entries(toggles).forEach(([id, fn]) => {
    const btn = document.getElementById(id);
    if (btn) btn.onclick = () => { fn(); renderFabMenu(); };
  });
  // [1.10.2] Speed slider sync
  const slider = document.getElementById('fab-speed-slider');
  const label  = document.getElementById('fab-speed-label');
  const input  = document.getElementById('fab-speed-input');
  if (slider) {
    slider.oninput = () => {
      tSpeedMult = parseFloat(slider.value);
      if (label) label.textContent = tSpeedMult.toFixed(2) + 'x';
      if (input) input.value = tSpeedMult.toFixed(2);
    };
  }
}

function triggerDeath() { if (alive) die('laser'); } // [1.10.1]
function nextRound() { // [1.10.1]
  if (alive) {
    const wasPaused = fabPaused;
    fabPaused = false; // temporarily lift so startRound() schedules normally
    if (bossRound) _cleanupBoss(); // [2.0-s3] a tester round-skip during a boss must not strand rain timers
    clearTimeout(phaseTimer); lasers=[]; blocks=[]; startRound();
    if (wasPaused) { // [1.10.2] re-apply pause after new round is set up
      clearTimeout(phaseTimer);
      _phaseRemainingMs = Math.max(0, _phaseFiresAt - Date.now());
      fabPaused = true;
      startAnim();
    }
  }
}
function skipToRound() { // [1.10.1]
  const val = parseInt(document.getElementById('fab-round-input')?.value) || 1;
  round = Math.max(1, val) - 1;
  nextRound();
  showFabFeedback('⏩ Skipped!'); // [1.10.2]
}
function setComboFab() { // [1.10.1]
  const val = parseInt(document.getElementById('fab-combo-input')?.value) || 0;
  comboCount = Math.max(0, val);
  renderFabMenu();
  showFabFeedback('🔥 Combo set!'); // [1.10.2]
}
function addCoinsFab() { // [1.10.1]
  const val = parseInt(document.getElementById('fab-coins-ingame-input')?.value) || 0;
  coins += val; save(); renderFabMenu();
  showFabFeedback('🪙 Coins added!'); // [1.10.2]
}
function setCoinsFab() { // [1.10.1]
  const val = parseInt(document.getElementById('fab-coins-input')?.value);
  if (!isNaN(val) && val >= 0) { coins = val; save(); updateMenuCoins(); showFabFeedback('🪙 Coins set!'); } // [1.10.2]
}
function setSpeedFab() { // [1.10.2]
  const val = parseFloat(document.getElementById('fab-speed-input')?.value);
  if (!isNaN(val)) {
    tSpeedMult = Math.max(0.01, Math.min(10, val));
    const slider = document.getElementById('fab-speed-slider');
    const label  = document.getElementById('fab-speed-label');
    if (slider) slider.value = tSpeedMult;
    if (label)  label.textContent = tSpeedMult.toFixed(2) + 'x';
    showFabFeedback(`⚡ Speed: ${tSpeedMult.toFixed(2)}x`);
  }
}
function setMissionWeek(type) { // [1.10.1]
  tSetWeek(['normal','lucky','luckiest'][type] || 'normal');
  showFabFeedback('📅 Week set!'); // [1.10.2]
}
function startCustomGame() { // [2.0-s3.1] tester sandbox: empty board + chosen hazards (no record impact)
  gameMode = null; hardMode = false;
  startGame(false, false, true);
  showFabFeedback('🧪 Custom game');
}
function completeMissions()   { tCompleteAllMissions(); showFabFeedback('✅ Missions completed!'); } // [1.10.1] [1.10.2]
function newRandomMissions()  { tResetMissions();        showFabFeedback('🔀 New missions!'); }      // [1.10.1] [1.10.2]
function unlockPrestigeSkins(){ tUnlockPrestige();       showFabFeedback('🏆 Prestige unlocked!'); } // [1.10.1] [1.10.2]
function unlockAllSkins()     { tUnlockAll();            showFabFeedback('🎁 All skins unlocked!'); }// [1.10.1] [1.10.2]
function resetDailyMode() { // [1.10.1]
  localStorage.removeItem('cm_daily_date');
  localStorage.removeItem('cm_daily_score');
  showFabFeedback('📅 Daily reset!'); // [1.10.2]
}
function resetHardcoreMode() { // [1.10.1]
  localStorage.removeItem('cm_hardcore_date');
  showFabFeedback('💀 Hardcore reset!'); // [1.10.2]
}
function resetAllSkins() { // [1.10.2]
  localStorage.removeItem('cm_owned');
  localStorage.removeItem('cm_skin');
  localStorage.removeItem('cm_boards_owned');
  localStorage.removeItem('cm_board');
  localStorage.removeItem('cm_lasers_owned');
  localStorage.removeItem('cm_laser');
  owned = ['default']; skinId = 'default'; // [1.10.2] sync in-memory
  boardsOwned = ['classic']; boardSkinId = 'classic';
  lasersOwned = ['red']; laserColorId = 'red';
  applyBoardSkin(); renderShop();
  showFabFeedback('🗑 Skins reset!');
}

// [5a-debug] Preview the new Void cosmetics (no save — 5b/5c add ownership). Equip in memory; if a game
// is running it re-renders live, otherwise the selection carries into the next started game.
const _VOID_SKINS_5A  = ['singularityheart','supernova','pulsarskin','cosmicdust','comet','aurora','meteor','stardust','orbit','lunar'];
const _VOID_BOARDS_5A = ['eventhorizon','starfield','nebula','deepspace','asteroidbelt'];
const _VOID_LASERS_5A = ['plasma','ion','cosmicblue'];
let _voidSkinIdx = 0, _voidBoardIdx = 0, _voidLaserIdx = 0;
function cycleVoidSkins() { // [5a-debug]
  skinId = _VOID_SKINS_5A[_voidSkinIdx++ % _VOID_SKINS_5A.length];
  invalidateSkinCache();
  if (alive) render();
  showFabFeedback('🌌 ' + skinId);
}
function cycleVoidBoards() { // [5a-debug]
  boardSkinId = _VOID_BOARDS_5A[_voidBoardIdx++ % _VOID_BOARDS_5A.length];
  applyBoardSkin();
  if (alive) render();
  showFabFeedback('🪐 ' + boardSkinId);
}
function cycleVoidLasers() { // [5a-debug]
  laserColorId = _VOID_LASERS_5A[_voidLaserIdx++ % _VOID_LASERS_5A.length];
  if (alive) render();
  showFabFeedback('☄ ' + laserColorId);
}
// ─────────────────────────────────────────────────────────────────────────────

function startGame(hard = false, fromTester = false, custom = false, tutorial = false) {
  hardMode = hard;
  customGame = custom; // [2.0-s3.1] only true via startCustomGame()
  tutorialActive = tutorial; // [2.0-s4h] set on every entry → real games always clear it
  // [1.10.1] testerActive is persistent — don't override; save snap if active
  if (testerActive) {
    _saveTesterSnap(); // [1.9.2] Bug #3: snapshot before tester-earned coins
    SKINS.forEach(s=>{ if(!owned.includes(s.id)) owned.push(s.id); });
    // no save() — tester unlocks stay in memory only
  }
  showScreen('app');
  deathOverlay.classList.remove('show');
  clearTimeout(phaseTimer);
  cube={x:8,y:8};
  round = 0; // [1.10.1] always 0; use Skip to round in FAB for custom start
  fabPaused = false; // [1.10.2]
  _cleanupBoss(); // [1.11] reset boss state on new game
  _endGridlockMode(false); gridlockActive=false; gridlockRoundsLeft=0; // [1.12]
  _resetRoundMods(); // [2.0-s3]
  clearInterval(_glitchTimer); _glitchTimer=null;
  if (hudGridlock) hudGridlock.style.display='none';
  alive=true; lasers=[]; blocks=[]; dashesLeft=2;
  particles=[]; trails=[]; invalidateSkinCache();
  asteroids=[]; clearTimeout(asteroidTimer); asteroidTimer=null; // [2.0-s2]
  blackHoleCooldown=0; blackHoleReadyAt=0; _resetBlackHole(); // [2.0-s2][2.0-s4g]
  if (_asteroidsEnabled() && !tutorialActive) scheduleAsteroid(); // [2.0-s2][2.0-s3.1][2.0-s4h] no asteroids in tutorial
  sessionCoinsEarned = 0;
  sessionCrystalsEarned = 0; // [2.0-s1]
  // [1.10] Mode-specific init
  if (gameMode === 'daily') {
    localStorage.setItem('cm_daily_date', _todayStr());
    _dailyRng = _seededRng(_dateSeed());
  } else {
    _dailyRng = null;
  }
  if (gameMode === 'timeattack') {
    timeAttackEndTime = Date.now() + 60000;
    if (hudTimerEl) { hudTimerEl.style.display = ''; hudTimerEl.textContent = '⏱ 60s'; }
  } else {
    if (hudTimerEl) hudTimerEl.style.display = 'none';
  }
  const titleEl = document.getElementById('death-title');
  if (titleEl) titleEl.textContent = 'GAME OVER';
  comboCount = 0; bestComboThisSession = 0; // [1.9.2]
  startTime=Date.now(); _virtAccum=0; _virtBase=startTime; _appliedSpeedMult=tSpeedMult; // [1.10.2-fix]
  buildBoard(); render();
  if (tutorialActive) _tutorialStart(); else if (customGame) _customStart(); else startRound(); // [2.0-s3.2][2.0-s4h] tutorial vs sandbox vs normal
  if (!tutorialActive) mTrackGameStart(); // [2.0-s4h] tutorial isn't a tracked game
  if (testerActive && tFps) { fpsFrames=0; fpsLast=performance.now(); requestAnimationFrame(fpsLoop); }
}

// ══════════════════════════════════════════════════
// SKLEP
// ══════════════════════════════════════════════════
let shopFromMenu = false;
function openShop(fromMenu=false){
  shopFromMenu = fromMenu;
  clearTimeout(phaseTimer);
  // ukryj wszystkie ekrany — sklep nakrywa wszystko przez z-index:60
  SCREENS.forEach(s=>{
    const el = s==='app' ? appEl : document.getElementById(s);
    if (el) { el.style.visibility='hidden'; el.style.pointerEvents='none'; }
  });
  shopEl.classList.add('open');
  playShopOpen(); // [1.9.2]
  renderShop();
}
function closeShop(){
  shopEl.classList.remove('open');
  if (shopFromMenu) showMenu();
  else if (alive) { showScreen('app'); startRound(); }
  else showMenu();
}
function renderShop(){ // [1.9] tab-aware
  shopBal.textContent=`🪙 ${coins}`;
  // sync tab buttons
  const tabCube = document.getElementById('shop-tab-cube');
  const tabBL   = document.getElementById('shop-tab-bl');
  if (tabCube) tabCube.classList.toggle('active', shopActiveTab==='cube');
  if (tabBL)   tabBL.classList.toggle('active', shopActiveTab==='bl');

  if (shopActiveTab === 'cube') {
    shopGrid.style.display = '';
    if (shopGridBL) shopGridBL.style.display = 'none';
    renderShopCubeTab();
  } else {
    shopGrid.style.display = 'none';
    if (shopGridBL) { shopGridBL.style.display = ''; renderShopBLTab(); }
  }
}

function renderShopCubeTab() { // [1.9] extracted from old renderShop
  shopGrid.innerHTML='';
  const cats = ['Patterns','Effects','Shapes','Prestige'];
  for (const cat of cats) {
    const header = document.createElement('div');
    header.style.cssText='grid-column:1/-1;font-size:11px;letter-spacing:2px;margin-top:8px;';
    header.style.color = cat==='Prestige' ? '#ffd700' : '#0cf';
    header.textContent = `— ${cat.toUpperCase()} —`;
    if (cat==='Prestige') {
      const sub = document.createElement('div');
      sub.style.cssText='grid-column:1/-1;font-size:9px;color:#664;margin-top:-4px;letter-spacing:1px;';
      sub.textContent = 'Unlock by beating round records — not purchasable'; // [1.9]
      shopGrid.appendChild(header);
      shopGrid.appendChild(sub);
    } else {
      shopGrid.appendChild(header);
    }

    for (const s of SKINS.filter(x=>x.cat===cat)) {
      const isOwned=owned.includes(s.id), isActive=skinId===s.id;
      const isPrestige=!!s.unlock;
      const isLocked=isPrestige && !isOwned;

      const card=document.createElement('div');
      card.className='skin-card'+(isActive?' active':isOwned?' owned':'');
      if (isLocked) card.style.opacity='.5';

      const cv=document.createElement('canvas');
      cv.width=cv.height=38; cv.className='skin-preview';
      if (!isLocked) {
        drawSkin(cv.getContext('2d'),s.id,0,0,38,skinAnimT);
        if (isActive) cv.style.boxShadow=`0 0 10px ${skinColor()}`;
      } else {
        const c2=cv.getContext('2d');
        c2.fillStyle='#0a0a18'; c2.fillRect(0,0,38,38);
        c2.fillStyle='#334'; c2.font='18px serif'; c2.textAlign='center';
        c2.fillText('🔒',19,26);
      }

      const nm=document.createElement('div'); nm.className='skin-name'; nm.textContent=s.name;

      const pr=document.createElement('div');
      pr.className='skin-price'+(isOwned||isActive?' owned':'');
      if (isActive)        pr.textContent='✓ Active'; // [1.9]
      else if (isOwned)    pr.textContent='Equip'; // [1.9]
      else if (isLocked)   pr.textContent=`${s.unlockDesc}`;
      else                 pr.textContent=`${s.price} 🪙`;

      if (isLocked) pr.style.cssText='font-size:9px;color:#664;text-align:center;line-height:1.3;';

      card.append(cv,nm,pr);
      if (!isLocked) card.addEventListener('click',()=>buySkin(s.id));
      shopGrid.appendChild(card);
    }
  }
}

function renderShopBLTab() { // [1.9] board skins + laser colors tab
  shopGridBL.innerHTML='';

  // [1.9.1] bug #8: No Grid toggle row (full-width, above board skins)
  const gridToggleRow = document.createElement('div');
  gridToggleRow.style.cssText = 'grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.03);border:1.5px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 14px;cursor:pointer;margin-bottom:4px;';
  const gridLabel = document.createElement('span');
  gridLabel.style.cssText = 'font-size:11px;letter-spacing:2px;color:#88aacc;';
  gridLabel.textContent = 'BOARD GRID LINES';
  const gridStatus = document.createElement('span');
  gridStatus.style.cssText = `font-size:11px;font-weight:bold;letter-spacing:1px;color:${showBoardGrid?'#0cf':'#446'};`;
  gridStatus.textContent = showBoardGrid ? '● ON' : '○ OFF';
  gridToggleRow.append(gridLabel, gridStatus);
  gridToggleRow.addEventListener('click', toggleNoGrid);
  shopGridBL.appendChild(gridToggleRow);

  // ── SECTION A: BOARD SKINS ──
  const bHeader = document.createElement('div');
  bHeader.className = 'shop-section-header';
  bHeader.textContent = '— BOARD SKINS —';
  shopGridBL.appendChild(bHeader);

  for (const def of BOARD_SKIN_LIST) {
    const isOwned   = boardsOwned.includes(def.id);
    const isActive  = boardSkinId === def.id;
    const isLocked  = !!def.unlock && !isOwned && bestRound < def.unlock; // [1.9.1] bug #5: owned always overrides locked

    const card = document.createElement('div');
    card.className = 'skin-card' + (isActive?' active':isOwned?' owned':'');
    if (isLocked) card.style.opacity = '.5';

    const cv = document.createElement('canvas');
    cv.width = cv.height = 38; cv.className = 'skin-preview';
    if (!isLocked) {
      drawBoardPreview(cv, def.id);
      if (isActive) cv.style.boxShadow = `0 0 10px ${BOARD_SKINS[def.id].grid}`;
    } else {
      const c2 = cv.getContext('2d');
      c2.fillStyle = '#0a0a18'; c2.fillRect(0,0,38,38);
      c2.fillStyle = '#334'; c2.font = '18px serif'; c2.textAlign = 'center';
      c2.fillText('🔒',19,26);
    }

    const nm = document.createElement('div'); nm.className = 'skin-name'; nm.textContent = def.name;
    const pr = document.createElement('div');
    pr.className = 'skin-price' + (isOwned||isActive?' owned':'');
    if (isActive)       pr.textContent = '✓ Active';
    else if (isOwned)   pr.textContent = 'Equip';
    else if (isLocked)  pr.textContent = def.unlockDesc;
    else if (def.price===0) pr.textContent = 'Free';
    else                pr.textContent = `${def.price} 🪙`;

    if (isLocked) pr.style.cssText = 'font-size:9px;color:#664;text-align:center;line-height:1.3;';
    if (def.unlock && isOwned) { // [1.9.1] bug #5: show unlock requirement even after unlocking
      const sub = document.createElement('div');
      sub.style.cssText = 'font-size:8px;color:#553;letter-spacing:1px;margin-top:2px;text-align:center;';
      sub.textContent = def.unlockDesc;
      card.append(cv,nm,pr,sub);
    } else {
      card.append(cv,nm,pr);
    }
    if (!isLocked) card.addEventListener('click', ()=>buyBoardSkin(def.id));
    shopGridBL.appendChild(card);
  }

  // ── SECTION B: LASER COLORS ──
  const lHeader = document.createElement('div');
  lHeader.className = 'shop-section-header';
  lHeader.textContent = '— LASER COLORS —';
  shopGridBL.appendChild(lHeader);

  for (const def of LASER_COLOR_LIST) {
    const isOwned  = lasersOwned.includes(def.id);
    const isActive = laserColorId === def.id;

    const card = document.createElement('div');
    card.className = 'skin-card' + (isActive?' active':isOwned?' owned':'');

    const cv = document.createElement('canvas');
    cv.width = cv.height = 38; cv.className = 'skin-preview';
    drawLaserPreview(cv, def.id);
    if (isActive) cv.style.boxShadow = `0 0 10px ${LASER_COLORS[def.id].fire}`;

    const nm = document.createElement('div'); nm.className = 'skin-name'; nm.textContent = def.name;
    const pr = document.createElement('div');
    pr.className = 'skin-price' + (isOwned||isActive?' owned':'');
    if (isActive)       pr.textContent = '✓ Active';
    else if (isOwned)   pr.textContent = 'Equip';
    else if (def.price===0) pr.textContent = 'Free';
    else                pr.textContent = `${def.price} 🪙`;

    card.append(cv,nm,pr);
    card.addEventListener('click', ()=>buyLaserColor(def.id));
    shopGridBL.appendChild(card);
  }
}
function buySkin(id){
  const s=SKINS.find(x=>x.id===id); if(!s||skinId===id) return;
  if (owned.includes(id)){skinId=id; invalidateSkinCache(); save(); playSkinSelect(); renderShop(); return;} // [1.9.2]
  if (coins<s.price){playError(); shopBal.textContent=`Not enough 🪙 (you have ${coins}, need ${s.price})`; return;} // [1.9.2]
  coins-=s.price; owned.push(id); skinId=id; invalidateSkinCache(); save(); playSkinSelect(); renderShop(); // [1.9.2]
  shopBal.classList.remove('purchase-flash'); void shopBal.offsetWidth; shopBal.classList.add('purchase-flash'); // [1.9.3]
}

function buyBoardSkin(id) { // [1.9]
  const def = BOARD_SKIN_LIST.find(b=>b.id===id);
  if (!def) return;
  if (boardsOwned.includes(id)) {
    boardSkinId = id; localStorage.setItem('cm_board', id);
    applyBoardSkin(); playSkinSelect(); renderShop(); return; // [1.9.2]
  }
  if (def.price > 0 && coins < def.price) {
    playError(); shopBal.textContent = `Not enough 🪙 (you have ${coins}, need ${def.price})`; return; // [1.9.2]
  }
  if (def.price > 0) { coins -= def.price; save(); }
  boardsOwned.push(id); localStorage.setItem('cm_boards_owned', JSON.stringify(boardsOwned));
  boardSkinId = id; localStorage.setItem('cm_board', id);
  applyBoardSkin(); playSkinSelect(); renderShop(); // [1.9.2]
  shopBal.classList.remove('purchase-flash'); void shopBal.offsetWidth; shopBal.classList.add('purchase-flash'); // [1.9.3]
}

function buyLaserColor(id) { // [1.9]
  const def = LASER_COLOR_LIST.find(c=>c.id===id);
  if (!def) return;
  if (lasersOwned.includes(id)) {
    laserColorId = id; localStorage.setItem('cm_laser', id);
    playSkinSelect(); renderShop(); return; // [1.9.2]
  }
  if (def.price > 0 && coins < def.price) {
    playError(); shopBal.textContent = `Not enough 🪙 (you have ${coins}, need ${def.price})`; return; // [1.9.2]
  }
  if (def.price > 0) { coins -= def.price; save(); }
  lasersOwned.push(id); localStorage.setItem('cm_lasers_owned', JSON.stringify(lasersOwned));
  laserColorId = id; localStorage.setItem('cm_laser', id);
  playSkinSelect(); renderShop(); // [1.9.2]
  shopBal.classList.remove('purchase-flash'); void shopBal.offsetWidth; shopBal.classList.add('purchase-flash'); // [1.9.3]
}

function toggleNoGrid() { // [1.9.1]
  showBoardGrid = !showBoardGrid;
  localStorage.setItem('cm_nogrid', showBoardGrid ? '0' : '1');
  renderShop();
}

// ══════════════════════════════════════════════════
// MISSION SYSTEM
// ══════════════════════════════════════════════════

const MISSION_POOL = [ // [1.9] all names translated
  { id:'lasers_100',   type:'lasers_dodged',   target:100,  name:'Dodge 100 lasers'                 },
  { id:'lasers_250',   type:'lasers_dodged',   target:250,  name:'Dodge 250 lasers'                 },
  { id:'coins_100',    type:'coins_earned',    target:100,  name:'Earn 100 coins'                   },
  { id:'coins_250',    type:'coins_earned',    target:250,  name:'Earn 250 coins'                   },
  { id:'coins_500',    type:'coins_earned',    target:500,  name:'Earn 500 coins'                   },
  { id:'rounds_20',    type:'rounds_played',   target:20,   name:'Play 20 rounds'                   },
  { id:'rounds_50',    type:'rounds_played',   target:50,   name:'Play 50 rounds'                   },
  { id:'time_10',      type:'time_survived',   target:600,  name:'Survive 10 minutes total'         },
  { id:'time_25',      type:'time_survived',   target:1500, name:'Survive 25 minutes total'         },
  { id:'nohit_15',     type:'rounds_no_hit',   target:15,   name:'Complete 15 rounds unhit'         },
  { id:'score_500',    type:'score_points',    target:500,  name:'Score 500 points'                 },
  { id:'score_1000',   type:'score_points',    target:1000, name:'Score 1000 points'                },
  { id:'play_10',      type:'time_survived',   target:600,  name:'Play for 10 minutes total'        }, // [2.0-s4] daily: was 'Play 7 days in a row'
];

// Mission state (loaded from localStorage)
let missionState = null;

// Current session tracking (resets on game start)
let sessionStats = { lasers_dodged:0, coins_earned:0, rounds_played:0,
                     time_survived:0, rounds_no_hit:0, score_points:0 };
let consecutiveRoundsNoHit = 0;  // consecutive rounds without a hit this session
let sessionCoinsStart = 0;       // coins at session start

function mLoad() {
  try {
    const raw = localStorage.getItem('cm_missions');
    if (raw) missionState = JSON.parse(raw);
  } catch(e) { missionState = null; }
  mCheckReset();
}

function mSave() {
  localStorage.setItem('cm_missions', JSON.stringify(missionState));
}

function mCheckReset() {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000; // [2.0-s4] daily reset (was 7-day WEEK)

  if (!missionState || now >= missionState.resetAt) {
    // Generate a new day's missions
    const roll = Math.random();
    let weekType = 'normal';
    if (roll < 0.01)       weekType = 'luckiest';
    else if (roll < 0.16)  weekType = 'lucky';   // 1% already used, so 15% of remaining ≈ 0.16

    // Pick 3 unique missions
    const pool = [...MISSION_POOL];
    const chosen = [];
    while (chosen.length < 3 && pool.length > 0) {
      const i = Math.floor(Math.random() * pool.length);
      chosen.push({ ...pool[i], progress:0, claimed:false });
      pool.splice(i, 1);
    }

    missionState = {
      weekType,
      resetAt: (missionState?.resetAt || now) + DAY,  // [2.0-s4] exactly +1 day from last reset
      missions: chosen,
      bonusClaimed: false,
    };
    // If first time / long gap, resetAt = now + DAY
    if (!missionState.resetAt || missionState.resetAt < now) {
      missionState.resetAt = now + DAY;
    }
    mSave();
  }

  // Aktualizuj streak dzienny
  mCheckDailyStreak();
}

function mCheckDailyStreak() {
  const today = new Date().toDateString();
  const last  = localStorage.getItem('cm_last_day');
  if (last !== today) {
    localStorage.setItem('cm_last_day', today);
    if (last) {
      // Check if yesterday
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const streak = parseInt(localStorage.getItem('cm_streak') || '0');
      localStorage.setItem('cm_streak', last === yesterday ? streak + 1 : 1);
    } else {
      localStorage.setItem('cm_streak', '1');
    }
  }
}

function mRewardBase() {
  if (missionState.weekType === 'luckiest') return 150;
  if (missionState.weekType === 'lucky')    return 100;
  return 50;
}

function mProgressAdd(type, amount) {
  if (!missionState) return;
  let changed = false;
  for (const m of missionState.missions) {
    if (m.type === type && !m.claimed) {
      const before = m.progress;
      m.progress = Math.min(m.target, m.progress + amount);
      if (m.progress !== before) changed = true;
    }
  }
  // [2.0-s4] streak_days mission removed (daily reset) — special-case dropped
  if (changed) mSave();
}

function mIsDone(m) {
  return m.progress >= m.target;
}

function mAllDone() {
  return missionState.missions.every(m => mIsDone(m));
}

function mClaimMission(idx) {
  const m = missionState.missions[idx];
  if (!m || m.claimed || !mIsDone(m)) return;
  m.claimed = true;
  const reward = mRewardBase();
  coins += reward; save(); updateMenuCoins(true);
  statCoinsTotal += reward; localStorage.setItem('cm_stat_coins_total', statCoinsTotal); // [1.9.2]
  mSave();
  renderMissions();
  playUISound('reward');
  // float efekt w centrum ekranu
  spawnMenuCoinFloat(reward, innerWidth/2-30, innerHeight/2-80);
}

function mClaimBonus() {
  if (!mAllDone() || missionState.bonusClaimed) return;
  missionState.bonusClaimed = true;
  const bonus = mRewardBase();
  coins += bonus; save(); updateMenuCoins(true);
  statCoinsTotal += bonus; localStorage.setItem('cm_stat_coins_total', statCoinsTotal); // [1.9.2]
  mSave();
  renderMissions();
  playUISound('reward');
  // 3 floaty
  for(let i=0;i<3;i++) setTimeout(()=> spawnMenuCoinFloat(bonus, innerWidth/2-30+i*20, innerHeight/2-60-i*20), i*120);
}

// Countdown timer
let missionsTimerInterval = null;

function mTimerStr() {
  const left = Math.max(0, missionState.resetAt - Date.now());
  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  const m2 = Math.floor((left % 3600000) / 60000);
  const s2 = Math.floor((left % 60000) / 1000);
  if (d > 0) return `Reset in ${d}d ${h}h ${m2}m`; // [1.9]
  return `Reset in ${h}h ${m2}m ${s2}s`; // [1.9]
}

function showMissions() {
  showScreen('screen-missions');
  mCheckReset();
  renderMissions();
  // countdown
  if (missionsTimerInterval) clearInterval(missionsTimerInterval);
  missionsTimerInterval = setInterval(()=>{
    if (missionState) {
      document.getElementById('missions-timer').textContent = mTimerStr();
      // check reset
      if (Date.now() >= missionState.resetAt) {
        mCheckReset(); renderMissions();
      }
    }
  }, 1000);
}

function hideMissions() {
  if (missionsTimerInterval) { clearInterval(missionsTimerInterval); missionsTimerInterval=null; }
  showMenu();
}

function renderMissions() {
  if (!missionState) return;
  const wt = missionState.weekType;

  // Badge and style
  const badge = document.getElementById('missions-week-badge');
  const barM  = document.getElementById('bar-missions');
  badge.className = wt === 'luckiest' ? 'luckiest' : wt === 'lucky' ? 'lucky' : '';
  if (barM) barM.className = `menu-bar-btn${wt==='luckiest'?' luckiest':wt==='lucky'?' lucky':''}`;
  if (wt==='luckiest')     badge.textContent = 'Luckiest Day 🌈'; // [2.0-s4] daily
  else if (wt==='lucky')   badge.textContent = 'Lucky Day ✨'; // [2.0-s4] daily
  else                     badge.textContent = 'Normal Day'; // [2.0-s4] daily

  document.getElementById('missions-timer').textContent = mTimerStr();

  // Missions
  const list = document.getElementById('missions-list');
  list.innerHTML = '';
  const base = mRewardBase();

  missionState.missions.forEach((m, idx) => {
    const done    = mIsDone(m);
    const pct     = Math.min(100, Math.round(m.progress / m.target * 100));
    const card    = document.createElement('div');
    card.className = `mission-card${m.claimed?' claimed':done?' done':''}`;

    card.innerHTML = `
      <div class="mission-top">
        <div class="mission-name">${m.name}</div>
        <div class="mission-reward">+${base} 🪙</div>
      </div>
      <div class="mission-progress-wrap">
        <div class="mission-progress-bar" style="width:${pct}%"></div>
      </div>
      <div class="mission-progress-text">
        <span>${m.progress} / ${m.target}</span>
        <span>${pct}%</span>
      </div>
      ${done && !m.claimed ? `<button class="mission-claim-btn" data-idx="${idx}">CLAIM ${base} 🪙</button>` : ''}
      ${m.claimed ? `<div style="text-align:center;font-size:11px;color:#446;margin-top:6px;">✓ Claimed</div>` : ''}
    `;
    list.appendChild(card);
  });

  // Bonus
  const allDone   = missionState.missions.every(m => mIsDone(m));
  const bonusCard = document.getElementById('missions-bonus-card');
  const bonusBtn  = document.getElementById('missions-bonus-btn');
  const bonusDesc = document.getElementById('missions-bonus-desc');

  bonusCard.className = `${missionState.bonusClaimed?'claimed':allDone?'ready':''}`;
  bonusDesc.textContent = missionState.bonusClaimed // [1.9]
    ? '✓ Bonus claimed'
    : allDone
    ? `All missions complete! Reward: +${base} 🪙`
    : `Complete all 3 missions to unlock bonus +${base} 🪙`;
  bonusBtn.disabled = !allDone || missionState.bonusClaimed;
  bonusBtn.textContent = missionState.bonusClaimed ? '✓ CLAIMED' : `CLAIM BONUS +${base} 🪙`; // [1.9]

  // Event listeners for claim buttons
  list.querySelectorAll('.mission-claim-btn').forEach(btn => {
    btn.addEventListener('click', ()=> mClaimMission(parseInt(btn.dataset.idx)));
  });
}

// Load missions on startup
mLoad();

// ── IN-GAME MISSION TRACKING ──
// Called from appropriate places in game

function mTrackGameStart() {
  sessionCoinsStart = coins;
  sessionStats = { lasers_dodged:0, coins_earned:0, rounds_played:0,
                   time_survived:0, rounds_no_hit:0, score_points:0 };
  consecutiveRoundsNoHit = 0;
  mCheckDailyStreak(); // [2.0-s4] streak counter still tracked; no streak mission remains
}

function mTrackRoundSurvived(hitThisRound) {
  sessionStats.rounds_played++;
  mProgressAdd('rounds_played', 1);
  mProgressAdd('score_points', 1);
  if (!hitThisRound) {
    consecutiveRoundsNoHit++;
    mProgressAdd('rounds_no_hit', 1);
  } else {
    consecutiveRoundsNoHit = 0;
  }
}

function mTrackLaserDodged() {
  mProgressAdd('lasers_dodged', 1);
}

function mTrackCoins(earned) {
  mProgressAdd('coins_earned', earned);
}

function mTrackTime(seconds) {
  mProgressAdd('time_survived', seconds);
}

// ── TESTER: MISSION FUNCTIONS ──
function tSetWeek(type) {
  if (!missionState) return;
  missionState.weekType = type;
  mSave();
  renderMissions();
  const barM = document.getElementById('bar-missions');
  if (barM) barM.className = `menu-bar-btn${type==='luckiest'?' luckiest':type==='lucky'?' lucky':''}`;
}

function tCompleteAllMissions() {
  if (!missionState) return;
  missionState.missions.forEach(m => { m.progress = m.target; });
  mSave();
  renderMissions();
}

function tResetMissions() {
  if (!missionState) return;
  const weekType = missionState.weekType;
  const pool = [...MISSION_POOL];
  const chosen = [];
  while (chosen.length < 3 && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    chosen.push({ ...pool[i], progress:0, claimed:false });
    pool.splice(i,1);
  }
  missionState.missions = chosen;
  missionState.bonusClaimed = false;
  mSave();
  renderMissions();
}

function tUnlockPrestige() {
  const prestigeIds = SKINS.filter(s=>s.unlock).map(s=>s.id);
  prestigeIds.forEach(id=>{ if(!owned.includes(id)) owned.push(id); });
  BOARD_SKIN_LIST.filter(b=>b.unlock).forEach(b=>{ if(!boardsOwned.includes(b.id)) boardsOwned.push(b.id); }); // [1.9]
  localStorage.setItem('cm_boards_owned', JSON.stringify(boardsOwned)); // [1.9]
  save();
}

function tUnlockAll() {
  SKINS.forEach(s=>{ if(!owned.includes(s.id)) owned.push(s.id); });
  BOARD_SKIN_LIST.forEach(b=>{ if(!boardsOwned.includes(b.id)) boardsOwned.push(b.id); }); // [1.9.1]
  LASER_COLOR_LIST.forEach(c=>{ if(!lasersOwned.includes(c.id)) lasersOwned.push(c.id); }); // [1.9.1]
  localStorage.setItem('cm_boards_owned', JSON.stringify(boardsOwned)); // [1.9.1]
  localStorage.setItem('cm_lasers_owned', JSON.stringify(lasersOwned)); // [1.9.1]
  save();
}

// ══════════════════════════════════════════════════
// [2.0-s4h] TUTORIAL — guided live run on the real engine (learn-by-doing)
// ══════════════════════════════════════════════════
const _tutCoachEl = document.getElementById('tut-coach');
const _tutSkipEl  = document.getElementById('tut-skip');

function _tutCoach(text) { // [2.0-s4h] one-line coachmark bubble
  if (_tutCoachEl) { _tutCoachEl.textContent = text; _tutCoachEl.style.display = 'block'; }
}
function _tutHideUI() { // [2.0-s4h] hide coachmark + skip
  if (_tutCoachEl) _tutCoachEl.style.display = 'none';
  if (_tutSkipEl)  _tutSkipEl.style.display  = 'none';
}

function _tutorialStart() { // [2.0-s4h] entry from startGame when tutorialActive — drives the scripted beats
  clearTimeout(phaseTimer);
  lasers = []; blocks = [];
  tutBeat = 0;
  _tutLaserRow = -1; _tutBlock = null; _tutAwaiting = null; // [2.0-s4h-r1]
  if (_tutSkipEl) _tutSkipEl.style.display = 'block';
  _tutBeat1();
}

function _tutBeat1() { // [2.0-s4h] BEAT 1 — dash within range (render() already glows the range)
  tutBeat = 0;
  lasers = []; blocks = [];
  _tutCoach('Tap a glowing cell to move');
  render();
}

function _tutOnDash() { // [2.0-s4h-r1] advance scripted beat on every player dash
  if (tutBeat === 0) {
    tutBeat = 1; _tutCoach('Nice!');
    phaseTimer = _schedulePhase(_tutBeat2, 600);
  } else if (tutBeat === 1 && _tutAwaiting === 'escape') {
    if (cube.y !== _tutLaserRow) { _tutAwaiting = null; _tutFireLaser(); }
    else _tutCoach('Away from the red line!');
  } else if (tutBeat === 2 && _tutAwaiting === 'dodge') {
    if (cube.x !== _tutBlock.x || cube.y !== _tutBlock.y) { _tutAwaiting = null; _tutLandBlock(); }
    else _tutCoach('Not there — tap somewhere else!');
  }
}

function _tutBeat2() { // [2.0-s4h-r1] BEAT 2 — spawn charging laser; fire only after player dashes off the row
  if (!alive || !tutorialActive) return;
  tutBeat = 1;
  _tutLaserRow = cube.y;
  lasers = [{ type:'row', idx:_tutLaserRow, state:'charge' }];
  blocks = [];
  _tutAwaiting = 'escape';
  _tutCoach('Dash off the red line!');
  if (currentWorld === 2) { _flareChargeStart = Date.now(); _flareChargeDur = CHARGE_START*2; playSolarFlareCharge(); }
  else playSound('laser_charge');
  render();
  // No _schedulePhase — fire is triggered by _tutOnDash when cube.y !== _tutLaserRow
}

function _tutFireLaser() { // [2.0-s4h-r1] player escaped the row — fire the laser then advance
  if (!alive || !tutorialActive) return;
  for (const L of lasers) L.state = 'fire';
  if (currentWorld === 2) { _flareFireStart = Date.now(); _flareFireDur = FIRE_MS; playSolarFlareRelease(); }
  else playSound('laser_fire');
  render();
  phaseTimer = _schedulePhase(() => {
    if (!alive || !tutorialActive) return;
    lasers = []; render();
    tutBeat = 2;
    phaseTimer = _schedulePhase(_tutBeat3, 500);
  }, FIRE_MS);
}

function _tutBeat3() { // [2.0-s4h-r1] BEAT 3 — spawn block on adjacent cell; land only after player dashes away
  if (!alive || !tutorialActive) return;
  tutBeat = 2; lasers = [];
  const bx = cube.x + 1 <= N - 1 ? cube.x + 1 : cube.x - 1;
  _tutBlock = { x: bx, y: cube.y };
  blocks = [{ x: _tutBlock.x, y: _tutBlock.y, state: 'charge' }];
  _tutAwaiting = 'dodge';
  _tutCoach("Tap away — don't land on purple!");
  render();
  // No _schedulePhase — land is triggered by _tutOnDash when cube !== _tutBlock
}

function _tutLandBlock() { // [2.0-s4h-r1] player cleared the block cell — land it then finish
  if (!alive || !tutorialActive) return;
  for (const b of blocks) { b.state = 'land'; spawnBlockImpact(b.x, b.y); }
  render();
  phaseTimer = _schedulePhase(() => {
    if (!alive || !tutorialActive) return;
    blocks = []; render();
    _tutFinish();
  }, 600);
}

function _tutFinish() { // [2.0-s4h] reward (preserved from old tutFinish) + cleanup → menu
  clearTimeout(phaseTimer);
  lasers = []; blocks = [];
  _tutLaserRow = -1; _tutBlock = null; _tutAwaiting = null; // [2.0-s4h-r1]
  tutorialActive = false;
  _tutCoach("You're ready!");
  localStorage.setItem('cm_tutorial_done','1');
  if (localStorage.getItem('cm_tutorial_rewarded') !== '1') { // [1.9.1] one-time reward
    coins += 100; save();
    statCoinsTotal += 100; localStorage.setItem('cm_stat_coins_total', statCoinsTotal); // [1.9.2]
    localStorage.setItem('cm_tutorial_rewarded','1');
    playSound('coin');
    setTimeout(() => { _tutHideUI(); showMenu(); }, 1800);
  } else {
    _tutHideUI(); showMenu();
  }
}

function _tutSkip() { // [2.0-s4h] corner skip → finish immediately, no reward
  clearTimeout(phaseTimer);
  lasers = []; blocks = [];
  _tutLaserRow = -1; _tutBlock = null; _tutAwaiting = null; // [2.0-s4h-r1]
  tutorialActive = false;
  localStorage.setItem('cm_tutorial_done','1');
  _tutHideUI();
  showMenu();
}

function startTutorial() { // [2.0-s4h] guided live run on the real engine
  gameMode = null;
  startGame(false, false, false, true); // tutorial=true → _tutorialStart() drives the scripted beats
  playUISound('tab');
}

// ── FLOATING TESTER PANEL ──
function _updateFloatBtns() {
  const set = (id, val, label) => {
    const b = document.getElementById(id);
    if (!b) return;
    b.textContent = label + (val ? ': ON' : ': OFF');
    b.classList.toggle('on', val);
  };
  set('tf-noclip',  tNoclip,  '💀 Noclip');
  set('tf-dashinf', tDashInf, '⚡ ∞ Dashes'); // [1.9]
  set('tf-slow',    tSlow,    '🐢 Slow');
  set('tf-freeze',  tFreeze,  '❄️ Freeze');
}

// [2.0-s4] Dash fires to the cell first pressed, ignoring cursor movement before release.
window.addEventListener('pointerup', () => {
  if (_dashPressX < 0) return;
  const px = _dashPressX, py = _dashPressY;
  _dashPressX = _dashPressY = -1;
  tryDash(px, py);
});
window.addEventListener('pointercancel', () => { _dashPressX = _dashPressY = -1; });

// ── WSZYSTKIE EVENTY MENU ──
document.getElementById('bar-missions').addEventListener('click',  showMissions);
document.getElementById('bar-shop').addEventListener('click',      ()=>{ showScreen('screen-start'); openShop(true); });
document.getElementById('bar-stats').addEventListener('click',     showStats);
document.getElementById('bar-tester').addEventListener('click',    showPin); // [1.10.1] always PIN
document.getElementById('bar-reset').addEventListener('click', ()=>{
  resetDialog.style.visibility='visible'; resetDialog.style.pointerEvents='auto';
});
document.getElementById('missions-close').addEventListener('click', hideMissions);
document.getElementById('missions-bonus-btn').addEventListener('click', mClaimBonus);
document.getElementById('btn-tutorial').addEventListener('click', startTutorial);
document.getElementById('btn-modes').addEventListener('click', showModes); // [1.10]
document.getElementById('btn-modes-back').addEventListener('click', () => { clearInterval(_modesCountdownInterval); showMenu(); }); // [1.10]
document.getElementById('btn-start').addEventListener('click',    ()=>beginGame(false)); // [2.0-s2]
document.getElementById('btn-hard').addEventListener('click',     ()=>beginGame(true));  // [2.0-s2]
// [2.0-s1] World system wiring
document.getElementById('btn-world-switch').addEventListener('click', () => {
  currentWorld = currentWorld === 2 ? 1 : 2;
  localStorage.setItem('cm_current_world', String(currentWorld));
  applyWorldTheme();
  // [2.0-s4d] first time entering the Void → play Cubek 2.0 right away, then return to the (now W2) menu
  if (currentWorld === 2 && localStorage.getItem('cm_cubek2_done') !== 'true') {
    showCubek2(() => showMenu());
    return;
  }
  showMenu(); // refresh button label + currency icon
});
document.getElementById('wc-world1').addEventListener('click', () => { // Continue in World 1
  playUISound('tab'); showScreen('app'); startRound(); // round 100 → 101, theme unchanged
});
document.getElementById('wc-world2').addEventListener('click', () => { // Enter the Void
  playUISound('tab');
  currentWorld = 2; localStorage.setItem('cm_current_world', '2');
  applyWorldTheme();
  if (localStorage.getItem('cm_cubek2_done') === 'true') startGame(false);
  else showCubek2(() => startGame(false)); // [2.0-s4d] entering the Void fresh is always Normal
});
document.getElementById('cubek2-next').addEventListener('click', cubek2Next);
document.getElementById('stats-close').addEventListener('click',    showMenu);
document.getElementById('stats-tab-w1').addEventListener('click', ()=>{ statsView=1; playUISound('tab'); renderStats(); }); // [2.0-s3]
document.getElementById('stats-tab-w2').addEventListener('click', ()=>{ statsView=2; playUISound('tab'); renderStats(); }); // [2.0-s3]
document.getElementById('btn-retry').addEventListener('click',      ()=>startGame(hardMode)); // [1.10.1]
document.getElementById('btn-to-menu').addEventListener('click',    showMenu);
document.getElementById('pin-back').addEventListener('click',       ()=>showMenu());
document.getElementById('pin-ok').addEventListener('click',         submitPin);
document.getElementById('pin-del').addEventListener('click',        ()=>{ pinBuffer=pinBuffer.slice(0,-1); updatePinDisplay(); });
document.querySelectorAll('.pin-btn[data-v]').forEach(b=>{
  b.addEventListener('click',()=>{ if(pinBuffer.length<9){ pinBuffer+=b.dataset.v; updatePinDisplay(); } }); // [1.9.2]
});
// [1.10.1] FAB open/close — state tracked via _fabOpen boolean, independent of tSpeedMult [1.10.2]
function _toggleFab() { // [1.10.2]
  const menu = document.getElementById('tester-fab-menu');
  if (!menu) return;
  _fabOpen = !_fabOpen;
  if (_fabOpen) {
    renderFabMenu();
    menu.classList.remove('fab-hidden');
    fabPauseGame();
  } else {
    menu.classList.add('fab-hidden');
    fabResumeGame();
  }
}
document.getElementById('tester-fab-btn').addEventListener('click', _toggleFab);
// [2.0-s4h] Tutorial — single corner skip button
document.getElementById('tut-skip').addEventListener('click', ()=>{ playSound('click'); _tutSkip(); });
const resetDialog = document.getElementById('reset-dialog');
document.getElementById('reset-cancel').addEventListener('click', ()=>{
  resetDialog.style.visibility='hidden';
  resetDialog.style.pointerEvents='none';
});
document.getElementById('reset-confirm').addEventListener('click', ()=>{
  localStorage.clear(); location.reload();
});
shopClose.addEventListener('click', closeShop);
// [1.9] Shop tab switching
document.getElementById('shop-tab-cube').addEventListener('click', ()=>{ shopActiveTab='cube'; renderShop(); });
document.getElementById('shop-tab-bl').addEventListener('click',   ()=>{ shopActiveTab='bl';   renderShop(); });
window.addEventListener('resize', ()=>{ if(alive&&appEl.style.visibility!=='hidden'){ invalidateSkinCache(); buildBoard(); render(); } });
// inicjalizacja
applyWorldTheme(); // [2.0-s1] reflect remembered world preference on load
if (!localStorage.getItem('cm_tutorial_done')) {
  startTutorial(); // [1.10.2] auto-start tutorial on first launch
} else {
  showMenu();
}
