// ═══════════════════════════════════════════════
// GRIDLOCK — Game Logic // [1.9.1]
// ═══════════════════════════════════════════════

// ══════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════
const N = 16, DASH_RANGE = 5, MAX_LASERS = 12;
const CHARGE_START = 1100, CHARGE_MIN = 500, CHARGE_STEP = 50;
const FIRE_MS = 700, GAP_MS = 850;
const BLOCK_INTERVAL = 3, MAX_BLOCKS = 12;

// [1.11] Boss system
const BOSS_ROUNDS  = [25, 50, 100];
const BOSS_CONFIG  = {
  1: { name: 'SENTINEL',   gridX: 7, gridY: 7, size: 2, reward:  50 },
  2: { name: 'PHANTOM',    gridX: 6, gridY: 6, size: 3, reward: 100 },
  3: { name: 'VOID KING',  gridX: 6, gridY: 6, size: 4, reward: 200 },
};

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
const hudTimerEl   = document.getElementById('hud-timer'); // [1.10]

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
  prestige_gold: { bg: '#0a0800', grid: '#ffd700', glow: true, prestige: true }
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
  gold:   { fire: '#ddaa00', charge: '#664400' }
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
// [1.10] Game mode state and records
let gameMode = null;
// [1.11] Boss state
let bossRound        = false;
let bossActive       = false;
let bossTier         = 0;
let bossTimeLeft     = 20;
let bossTimer        = null;
let bossThrowTimer   = null;
let bossAttackTimers = [];
let bossShockwaveCells = new Set();
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
    'cm_stat_lasers','cm_stat_time','cm_stat_coins_total','cm_stat_best_combo'];
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
  _testerSnap=null;
}

// [1.9] Apply board skin background to game and tutorial boards
function applyBoardSkin() {
  const skin = BOARD_SKINS[boardSkinId] || BOARD_SKINS.classic;
  boardEl.style.background = skin.bg;
  boardEl.style.setProperty('--board-bg', skin.bg);
  const tutBoardEl = document.getElementById('tut-board');
  if (tutBoardEl) {
    tutBoardEl.style.background = skin.bg;
    tutBoardEl.style.setProperty('--board-bg', skin.bg);
  }
}

// [1.9] Draw grid lines on a canvas (used in animLoop and tutRender)
function drawBoardGridLines(ctx2, canvasSize, n) {
  if (boardSkinId === 'classic' || !showBoardGrid) return; // [1.9.1] bug #8: no-grid toggle
  const skin = BOARD_SKINS[boardSkinId] || BOARD_SKINS.classic;
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

// [1.9] Draw 38×38 laser color preview (dark bg + colored line with glow)
function drawLaserPreview(cv, colorId2) {
  const ctx2 = cv.getContext('2d');
  const col = LASER_COLORS[colorId2] || LASER_COLORS.red;
  ctx2.fillStyle = '#060616';
  ctx2.fillRect(0, 0, 38, 38);
  ctx2.save();
  ctx2.shadowColor = col.fire; ctx2.shadowBlur = 8;
  ctx2.strokeStyle = col.fire; ctx2.lineWidth = 2;
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
      c.addEventListener('click', () => tryDash(x,y));
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
    sun:'#ffdd00', blackhole:'#aa44ff', galaxy:'#aaddff'
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
  // range — build set of cells occupied by lasers
  const laserCells = new Set();
  for (const L of lasers) {
    if (L.type==='row') for (let x=0;x<N;x++) laserCells.add(`${x},${L.idx}`);
    else                for (let y=0;y<N;y++) laserCells.add(`${L.idx},${y}`);
  }
  const bossCells = getBossCells(); // [1.11]
  if (alive) for (let y=0;y<N;y++) for (let x=0;x<N;x++) {
    const key = `${x},${y}`;
    if (dist(x,y,cube.x,cube.y)<=DASH_RANGE && !(x===cube.x&&y===cube.y)
        && !laserCells.has(key) && !bossCells.has(key) && !bossShockwaveCells.has(key)) // [1.11]
      cells[y][x].classList.add('dashable');
  }
  // blocks (on cells — small, no border issue)
  for (const b of blocks) cells[b.y][b.x].classList.add(b.state==='land'?'block':'block-charge');
  // [1.11] Shockwave cells
  for (const key of bossShockwaveCells) {
    const [sx, sy] = key.split(',').map(Number);
    if (cells[sy]?.[sx]) cells[sy][sx].classList.add('boss-shockwave');
  }
  // lasers — NOT on cells, drawn on canvas in animLoop
  // cube — draw on canvas
  drawCubeOnCanvas(cube.x, cube.y, skinAnimT);
  startAnim(); // starts animLoop which draws cube + lasers

  hudCoins.textContent = `🪙 ${coins}`;
  if (coins !== _prevHudCoins) { // [1.9.3]
    _prevHudCoins = coins;
    hudCoins.classList.remove('hud-bump'); void hudCoins.offsetWidth;
    hudCoins.classList.add('hud-bump');
  }
  hudInfo.textContent  = (bossRound && bossActive) // [1.11]
    ? `👾 ${BOSS_CONFIG[bossTier].name} · +${BOSS_CONFIG[bossTier].reward} 🪙`
    : `${testerActive ? '⚙ TEST · ' : ''}Round ${round} · ${aliveTime()}s`; // [1.9]
  if (round !== _prevHudRound) { // [1.9.3]
    _prevHudRound = round;
    hudInfo.classList.remove('hud-bump'); void hudInfo.offsetWidth;
    hudInfo.classList.add('hud-bump');
  }
  hudDash.textContent  = `⚡ ${testerActive && tDashInf ? '∞' : dashesLeft}`;
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
const ANIMATED_SKINS = new Set(['default','stripes','grid','rainbow','glitch','aura','magma','void','neontrail','robot','wave','ball','ufo','sun','blackhole','galaxy']);

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
  el.textContent = `🔥 Combo x${combo}! +${bonus} bonus 🪙`;
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
    hudInfo.textContent = (bossRound && bossActive) // [1.11]
      ? `👾 ${BOSS_CONFIG[bossTier].name} · +${BOSS_CONFIG[bossTier].reward} 🪙`
      : `${testerActive?'⚙ TEST · ':''}Round ${round} · ${aliveTime()}s`; // [1.9]
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

  // ── LASERS ON CANVAS — entirely skipped when boss is active ──
  // [1.11] bossActive guard: no clip regions, no shadows, no canvas state set at all
  if (lasers.length > 0 && !bossActive) {
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

    // Fire — solid bright color + subtle glow
    if (fireLasers.length > 0) {
      ctx.save();
      ctx.beginPath();
      for (const L of fireLasers) {
        if (L.type==='row') ctx.rect(0, L.idx*cellSize, canvas.width, cellSize);
        else                ctx.rect(L.idx*cellSize, 0, cellSize, canvas.height);
      }
      ctx.clip();
      // solid base
      ctx.fillStyle = laserCol.fire; // [1.9]
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // subtle glow highlight
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,90,0,.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }
  }

  // cube always drawn above lasers
  if (alive) _paintCube();

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
  if (bossActive) drawBoss(bossTier, now); // [1.11]

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
    || bossRound;         // [1.11] keep running during boss intro (before bossActive)
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
// DASH
// ══════════════════════════════════════════════════
function tryDash(x,y) {
  if (!alive) return;
  if (fabPaused) return; // [1.10.2] no input while FAB menu is open
  if (dashesLeft<=0 && !(testerActive && tDashInf) && !bossRound){flash('No dash available!');return;} // [1.9][1.11]
  if (x===cube.x&&y===cube.y) return;

  const dx=x-cube.x, dy=y-cube.y, d=Math.abs(dx)+Math.abs(dy);
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
  if (!bossRound) dashesLeft--; // [1.11] unlimited dashes during boss

  // near miss — check if laser fire is on adjacent cell
  for (const L of lasers) {
    if (L.state !== 'fire') continue;
    const onRow = L.type==='row' && Math.abs(cube.y - L.idx) === 1;
    const onCol = L.type==='col' && Math.abs(cube.x - L.idx) === 1;
    if (onRow || onCol) { playSound('near_miss'); break; }
  }

  checkDeathByLaser();
  render();
}

// ══════════════════════════════════════════════════
// BLOCKS
// ══════════════════════════════════════════════════
function generateBlocks() {
  const rng = _dailyRng || Math.random; // [1.10]
  const count = Math.min(1+Math.floor((round-1)/BLOCK_INTERVAL), MAX_BLOCKS);
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
// ROUNDS
// ══════════════════════════════════════════════════
function _schedulePhase(fn, ms) { // [1.10.2] tracks pending phase for FAB pause/resume
  _phaseFn = fn;
  _phaseFiresAt = Date.now() + ms;
  return setTimeout(fn, ms);
}

// ══════════════════════════════════════════════════
// BOSS SYSTEM // [1.11]
// ══════════════════════════════════════════════════

function getBossCells() { // [1.11]
  if (!bossActive) return new Set();
  const cfg = BOSS_CONFIG[bossTier];
  const s = new Set();
  for (let dy = 0; dy < cfg.size; dy++)
    for (let dx = 0; dx < cfg.size; dx++)
      s.add(`${cfg.gridX + dx},${cfg.gridY + dy}`);
  return s;
}

function _cleanupBoss() { // [1.11]
  clearInterval(bossTimer);      bossTimer = null;
  clearInterval(bossThrowTimer); bossThrowTimer = null;
  bossAttackTimers.forEach(h => { clearTimeout(h); clearInterval(h); });
  bossAttackTimers = [];
  bossRound = false;
  bossActive = false;
  bossShockwaveCells = new Set();
  blocks = blocks.filter(b => !b.bossThrow && !b.bossRain);
}

function startBossRound(tier) { // [1.11]
  _cleanupBoss(); // reset any prior state
  bossRound    = true;
  bossActive   = false;
  bossTier     = tier;
  bossTimeLeft = 20;
  lasers = []; blocks = [];
  if (hudTimerEl) { hudTimerEl.style.display = ''; hudTimerEl.textContent = '⏱ 20s'; hudTimerEl.className = ''; }
  flash('👾 BOSS INCOMING!');
  render(); startAnim();
  bossAttackTimers.push(setTimeout(() => {
    if (!alive || !bossRound) return;
    bossActive = true;
    flash(`👾 ${BOSS_CONFIG[tier].name}`);
    render();
    // block throw every 1s
    bossThrowTimer = setInterval(_bossTick, 1000);
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

function _bossTick() { // [1.11] — 1s throw interval
  if (!alive || !bossRound) { clearInterval(bossThrowTimer); return; }
  if (fabPaused) return;
  const cfg = BOSS_CONFIG[bossTier];
  const sz  = cfg.size;
  const ox  = Math.max(0, Math.min(N - sz, cube.x - Math.floor(sz / 2)));
  const oy  = Math.max(0, Math.min(N - sz, cube.y - Math.floor(sz / 2)));
  blocks = blocks.filter(b => !b.bossThrow); // clear previous throw warning
  const throwBlocks = [];
  for (let dy = 0; dy < sz; dy++)
    for (let dx = 0; dx < sz; dx++)
      throwBlocks.push({ x: ox + dx, y: oy + dy, state: 'charge', bossThrow: true });
  blocks.push(...throwBlocks);
  render();
  const t = setTimeout(() => {
    if (!alive || !bossRound) return;
    throwBlocks.forEach(b => { b.state = 'land'; spawnBlockImpact(b.x, b.y); });
    render(); checkDeathByBlock();
  }, 600);
  bossAttackTimers.push(t);
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
  if (!(testerActive && tNoclip) && bossShockwaveCells.has(`${cube.x},${cube.y}`))
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
  _cleanupBoss();
  coins += cfg.reward; sessionCoinsEarned += cfg.reward;
  statCoinsTotal += cfg.reward;
  localStorage.setItem('cm_stat_coins_total', statCoinsTotal);
  save();
  if (hudTimerEl) hudTimerEl.style.display = 'none';
  flash(`🏆 BOSS DEFEATED! +${cfg.reward} 🪙`);
  render();
  phaseTimer = _schedulePhase(startRound, 2000);
}

function triggerBossRound() { // [1.11] FAB helper — triggers boss for current round range
  if (!alive) return;
  clearTimeout(phaseTimer);
  const tier = round < 50 ? 1 : round < 100 ? 2 : 3;
  startBossRound(tier);
}

function drawBoss(tier, now) { // [1.11] uses global ctx directly
  const cfg = BOSS_CONFIG[tier];
  const px  = cfg.gridX * cellSize, py = cfg.gridY * cellSize;
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

  if (BOSS_ROUNDS.includes(round)) { // [1.11] intercept boss rounds
    const tier = round === 25 ? 1 : round === 50 ? 2 : 3;
    startBossRound(tier);
    return;
  }

  const total=Math.min(round+1+(gameMode==='timeattack'?2:0),MAX_LASERS); // [1.10]
  const rng = _dailyRng || Math.random; // [1.10]
  lasers=[]; const uR=new Set(), uC=new Set();
  if (rng()<.5){lasers.push({type:'row',idx:cube.y,state:'charge'});uR.add(cube.y);} // [1.10]
  else         {lasers.push({type:'col',idx:cube.x,state:'charge'});uC.add(cube.x);}
  for (let i=1;i<total;i++) {
    if (i%2===0){let idx;do{idx=Math.floor(rng()*N);}while(uR.has(idx));uR.add(idx);lasers.push({type:'row',idx,state:'charge'});} // [1.10]
    else        {let idx;do{idx=Math.floor(rng()*N);}while(uC.has(idx));uC.add(idx);lasers.push({type:'col',idx,state:'charge'});}
  }

  generateBlocks();
  const speedMult = ((testerActive && tSlow) ? 4 : (hardMode ? 0.625 : gameMode==='timeattack' ? 0.8 : 1)) / (testerActive ? Math.max(0.01, tSpeedMult) : 1); // [1.10] [1.10.1] [1.10.2] divide so higher tSpeedMult = faster
  const charge = CHARGE_START * speedMult;
  const firems = FIRE_MS * speedMult;
  const gapms  = GAP_MS  * speedMult;
  render();
  flash(`Round ${round}${hardMode?' 🔥':''} — dodge!`); // [1.9]
  playSound('laser_charge');

  phaseTimer=_schedulePhase(()=>{ // [1.10.2]
    if (bossActive) return; // [1.11] stale timer guard — never fire lasers during boss
    if (!tFreeze) for (const L of lasers) L.state='fire';
    for (const b of blocks) { b.state='land'; spawnBlockImpact(b.x,b.y); }
    render(); flash('⚡ FIRE!'); // [1.9]
    playSound('laser_fire');
    checkDeathByLaser(); checkDeathByBlock();
    phaseTimer=_schedulePhase(()=>{ // [1.10.2]
      if (!alive || bossActive) return; // [1.11] stale timer guard; was: if (!alive) return
      const earned = testerActive ? 999 : (hardMode ? 3 : 1);
      const roundLaserCount = lasers.length; // [1.9.2] capture before clear
      coins += earned; save(); lasers=[]; blocks=[];
      if (!testerActive) sessionCoinsEarned += earned;
      if (!testerActive) {
        mTrackRoundSurvived(false);
        mTrackCoins(earned);
        mTrackTime(Math.round(CHARGE_START/1000) + 2); // ~duration of one round in seconds
        mTrackLaserDodged();
      }
      // [1.9.2] Extended stats
      statLasers += roundLaserCount;
      localStorage.setItem('cm_stat_lasers', statLasers);
      statCoinsTotal += earned;
      localStorage.setItem('cm_stat_coins_total', statCoinsTotal);
      // [1.9.2] Combo
      comboCount++;
      if (comboCount > bestComboThisSession) bestComboThisSession = comboCount;
      if (comboCount > statBestCombo) { statBestCombo = comboCount; localStorage.setItem('cm_stat_best_combo', statBestCombo); }
      if (comboCount >= 5 && comboCount % 5 === 0) {
        const bonus = Math.floor(comboCount / 5);
        coins += bonus; statCoinsTotal += bonus;
        sessionCoinsEarned += bonus; // [1.9.2] Bug #1: include in death screen total
        localStorage.setItem('cm_stat_coins_total', statCoinsTotal);
        save();
        const comboLevel = comboCount >= 20 ? 3 : comboCount >= 10 ? 2 : 1; // [1.9.2]
        playCombo(comboLevel); // [1.9.2]
        showComboFlash(comboCount, bonus); // [1.9.2]
      }
      playSound('coin');
      render(); flash(`✓ Survived! +${earned} 🪙`); // [1.9]
      phaseTimer=_schedulePhase(startRound, gapms); // [1.10.2]
    }, firems);
  }, charge);
}

function checkDeathByLaser() {
  if (bossActive) return; // [1.11] stale timer guard
  if (testerActive && tNoclip) return;
  for (const L of lasers) {
    if (L.state!=='fire') continue;
    if (L.type==='row'&&cube.y===L.idx) return die('laser');
    if (L.type==='col'&&cube.x===L.idx) return die('laser');
  }
}
function checkDeathByBlock() {
  if (testerActive && tNoclip) return;
  for (const b of blocks)
    if (b.state==='land'&&b.x===cube.x&&b.y===cube.y) return die('block'); // [1.9]
}

function _resetTesterSettings() { // [1.10.2]
  tNoclip = false; tSlow = false; tFreeze = false; tDashInf = false;
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
  gamesPlayed++; save();
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
  if (bossRound) _cleanupBoss(); // [1.11]
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

  if (parseFloat(lastTime)>bestTime){bestTime=parseFloat(lastTime);}
  const _newRecord = round > bestRound; // [1.9.2] capture before update
  if (round>bestRound){bestRound=round;}
  if (_newRecord) playRecord(); // [1.9.2]
  // [1.9.2] Combo — capture session best, reset unless tester
  if (!testerActive && comboCount > bestComboThisSession) bestComboThisSession = comboCount;
  if (!testerActive) comboCount = 0;
  if (bestComboThisSession > statBestCombo) {
    statBestCombo = bestComboThisSession;
    localStorage.setItem('cm_stat_best_combo', statBestCombo);
  }
  // [1.9.2] Time played stat
  statTimePlayed += Math.round(parseFloat(lastTime));
  localStorage.setItem('cm_stat_time', statTimePlayed);
  gamesPlayed++;
  // unlock prestige skins for round records
  const prestigeSkins = SKINS.filter(s=>s.unlock);
  let newUnlock = null;
  for (const s of prestigeSkins) {
    if (round >= s.unlock && !owned.includes(s.id)) {
      owned.push(s.id);
      newUnlock = s;
    }
  }
  save();

  setTimeout(()=>{
    deathStats.innerHTML = // [1.9.2]
      `${reason==='block'?'🟪 Crushed by a block':'💀 Hit by a laser'}<br>`+
      `${hardMode?'<span style="color:#ff6600">🔥 Hard Mode</span><br>':''}`+
      `${bestComboThisSession >= 5 ? '🔥 Best combo: <b>x'+bestComboThisSession+'</b><br>' : ''}`+ // [1.9.2]
      `<br>Time: <b>${lastTime}s</b> &nbsp;|&nbsp; Rounds: <b><span id="_dr">0</span></b><br>`+ // [1.9.3]
      `<span style="color:#ffd700">🪙 Coins earned: <b>+<span id="_dc">0</span></b></span><br>`+ // [1.9.3]
      `Best time: <b>${bestTime}s</b> &nbsp;|&nbsp; Best rounds: <b>${bestRound}</b>`+
      (_newRecord ? `<br><span class="new-best">★ NEW BEST!</span>` : '')+ // [1.9.3]
      (gameMode==='timeattack' ? `<br>Best (Time Attack): <b>${bestTimeAttack} rounds</b>` : '')+ // [1.10]
      (gameMode==='hardcore'   ? `<br>Best (Hardcore): <b>${bestHardcore} rounds</b>` : '')+      // [1.10]
      (gameMode==='daily'      ? `<br>Best (Daily): <b>${bestDaily} rounds</b>` : '')+            // [1.10]
      (newUnlock ? `<br><br><span style="color:#ffd700;font-size:15px">🏆 UNLOCKED: ${newUnlock.name}!</span>` : '');
    deathOverlay.classList.add('show');
    animateCounter('_dr', round, 520);           // [1.9.3]
    animateCounter('_dc', sessionCoinsEarned, 520); // [1.9.3]
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
      ctx2.fillStyle=`hsla(${p.hue},100%,70%,${alpha})`;
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
  menuCoinsEl.textContent = `🪙 ${coins}`;
  if (animate && displayedCoins !== coins) {
    menuCoinsEl.classList.remove('bump');
    requestAnimationFrame(()=> menuCoinsEl.classList.add('bump'));
    setTimeout(()=> menuCoinsEl.classList.remove('bump'), 350);
  }
  displayedCoins = coins;
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
const SCREENS = ['screen-start','screen-stats','screen-pin','screen-missions','screen-tutorial','screen-modes','app']; // [1.10] [1.10.1] removed screen-tester
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
  _restoreTesterSnap(); // [1.10.1] undo tester's 999-coin rounds if snap exists
  // refresh bottom bar
  const barTester = document.getElementById('bar-tester');
  if (barTester) barTester.classList.toggle('active', testerUnlocked);
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
function showStats() {
  showScreen('screen-stats');
  document.getElementById('st-coins').textContent      = `${coins} 🪙`;
  document.getElementById('st-best-time').textContent  = `${bestTime}s`;
  document.getElementById('st-best-round').textContent = `${bestRound}`;
  document.getElementById('st-games').textContent      = `${gamesPlayed}`;
  document.getElementById('st-skins').textContent      = `${owned.length+boardsOwned.length+lasersOwned.length}/${SKINS.length+BOARD_SKIN_LIST.length+LASER_COLOR_LIST.length}`; // [1.10.2]
  // [1.9.2] Extended statistics
  document.getElementById('st-lasers').textContent      = fmtStat(statLasers); // [1.10.2]
  document.getElementById('st-time').textContent        = formatTimePlayed(statTimePlayed);
  document.getElementById('st-coins-total').textContent = fmtStat(statCoinsTotal); // [1.10.2]
  document.getElementById('st-best-combo').textContent  = statBestCombo > 0 ? `🔥 x${fmtStat(statBestCombo)}` : '—'; // [1.10.2]
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
  _virtBase = Date.now(); // [1.10.2-fix] exclude pause duration from virtual time
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
  if (alive) {
    html += `<div class="fab-section">⚡ Game</div>`;
    html += fabToggle('Noclip', tNoclip, 'fab-noclip');
    html += fabToggle('Slow mode (25%)', tSlow, 'fab-slow');
    html += fabToggle('Freeze lasers', tFreeze, 'fab-freeze');
    html += fabToggle('Infinite dashes', tDashInf, 'fab-infdash');
    html += fabToggle('FPS counter', tFps, 'fab-fps');
    html += `<div class="fab-section">🎮 Actions</div>`;
    html += `<button class="fab-action" onclick="triggerDeath()">💀 Trigger death</button>`;
    html += `<button class="fab-action" onclick="nextRound()">⏭ Next round</button>`;
    html += `<button class="fab-action" onclick="triggerBossRound()">👾 Trigger boss round</button>`; // [1.11]
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
  }
  html += `<div class="fab-section">📋 Missions</div>`;
  html += `<button class="fab-action" onclick="setMissionWeek(0)">📅 Normal week</button>`;
  html += `<button class="fab-action" onclick="setMissionWeek(1)">⭐ Lucky week</button>`;
  html += `<button class="fab-action" onclick="setMissionWeek(2)">🌟 Luckiest week</button>`;
  html += `<button class="fab-action" onclick="completeMissions()">✅ Complete all</button>`;
  html += `<button class="fab-action" onclick="newRandomMissions()">🔀 New random</button>`;
  html += `<div class="fab-section">🎨 Skins</div>`;
  html += `<button class="fab-action" onclick="unlockPrestigeSkins()">🏆 Unlock prestige</button>`;
  html += `<button class="fab-action" onclick="unlockAllSkins()">🎁 Unlock all skins</button>`;
  html += `<button class="fab-action" onclick="resetAllSkins()">🗑 Reset all skins</button>`; // [1.10.2]
  html += `<div class="fab-section">💾 Data</div>`;
  html += `<div class="fab-input-row">
    <input class="fab-input" id="fab-coins-input" type="number" min="0" value="1000">
    <button class="fab-action" onclick="setCoinsFab()">SET coins</button>
  </div>`;
  html += `<div class="fab-section">🔄 Modes</div>`;
  html += `<button class="fab-action" onclick="resetDailyMode()">📅 Reset Daily</button>`;
  html += `<button class="fab-action" onclick="resetHardcoreMode()">💀 Reset Hardcore</button>`;
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
    'fab-fps':     () => { setFps(!tFps);        },
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
// ─────────────────────────────────────────────────────────────────────────────

function startGame(hard = false, fromTester = false) {
  hardMode = hard;
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
  alive=true; lasers=[]; blocks=[]; dashesLeft=2;
  particles=[]; trails=[]; invalidateSkinCache();
  sessionCoinsEarned = 0;
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
  buildBoard(); render(); startRound();
  mTrackGameStart();
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
  { id:'streak_7',     type:'streak_days',     target:7,    name:'Play 7 days in a row'             },
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
  const WEEK = 7 * 24 * 60 * 60 * 1000;

  if (!missionState || now >= missionState.resetAt) {
    // Generate new week
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
      resetAt: (missionState?.resetAt || now) + WEEK,  // exactly +7 days from last reset
      missions: chosen,
      bonusClaimed: false,
    };
    // If first time, resetAt = now + WEEK
    if (!missionState.resetAt || missionState.resetAt < now) {
      missionState.resetAt = now + WEEK;
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
  // streak_days — specjalny
  if (type === 'streak_days') {
    const streak = parseInt(localStorage.getItem('cm_streak') || '0');
    for (const m of missionState.missions) {
      if (m.type === 'streak_days' && !m.claimed) {
        m.progress = Math.min(m.target, streak);
        changed = true;
      }
    }
  }
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
  if (wt==='luckiest')     badge.textContent = 'Luckiest Week 🌈'; // [1.9]
  else if (wt==='lucky')   badge.textContent = 'Lucky Week ✨'; // [1.9]
  else                     badge.textContent = 'Normal Week'; // [1.9]

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
  mCheckDailyStreak();
  mProgressAdd('streak_days', 0); // refresh streak progress
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
// TUTORIAL
// ══════════════════════════════════════════════════
const TUT_N = 16;
let tutCells = [], tutCube = {x:8,y:8}, tutCellSize = 0;
let tutLasers = [], tutBlocks = [], tutPhaseTimer = null;
let tutStep = 0, tutWaitingForAction = false;
let tutDashCount = 0, tutFarDashDone = false, tutEscapedLaser = false;
const tutBoard  = document.getElementById('tut-board');
const tutCanvas = document.getElementById('tut-canvas');
const tutCtx    = tutCanvas ? tutCanvas.getContext('2d') : null;

const TUT_STEPS = [ // [1.9] all text translated to English
  {
    id:'welcome',
    face:'😊',
    text:'Hi! I\'m <strong>Cubek</strong> — your teacher.<br>I\'ll teach you how to play <strong>Gridlock</strong>. It will only take a moment!', // [1.9.1]
    hint:'',
    next:'Let\'s go!',
    action:null
  },
  {
    id:'dash_intro',
    face:'😊',
    text:'See that <strong>cyan cube</strong>? That\'s you!<br>To move, <strong>click any cell</strong> on the board.',
    hint:'👆 Click any cell to move',
    next:null,
    action:'wait_dash'
  },
  {
    id:'dash_range',
    face:'😄',
    text:'Great! That move is called a <strong>Dash</strong>.<br>You can dash up to <strong>5 cells</strong>.<br>Highlighted cells = your range.',
    hint:'👆 Try dashing in different directions',
    next:'Got it!',
    action:null
  },
  {
    id:'dash_far',
    face:'😊',
    text:'What if you click <strong>beyond your range</strong>?<br>No problem — the cube will travel <strong>5 cells in that direction</strong>!',
    hint:'👆 Click a cell BEYOND your range (past the highlights)',
    next:null,
    action:'wait_far_dash'
  },
  {
    id:'laser_charge',
    face:'😐',
    text:'These are lasers! ⚡ They fire across entire <strong>rows</strong> and <strong>columns</strong>.<br><span class="tut-warn">Dim red</span> = charging. <span class="tut-warn">Bright red</span> = firing. Stay out of their path!', // [1.9.1] bug #4
    hint:'⚡ Watch both lasers — rows AND columns!', // [1.9.1] bug #4
    next:null,
    action:'show_laser_charge'
  },
  {
    id:'laser_escape',
    face:'😰',
    text:'A laser is <strong>on your cell</strong>!<br><span class="tut-warn">You must escape</span> before it fires!<br>Dash to a safe spot.',
    hint:'🏃 Escape the laser line!',
    next:null,
    action:'wait_laser_escape'
  },
  {
    id:'laser_fired',
    face:'😅',
    text:'The laser <span class="tut-warn">fired</span>!<br>Red cells = instant death.<br>Luckily you\'re in tutorial mode — <span class="tut-good">you can\'t die</span>!',
    hint:'',
    next:'Understood!',
    action:null
  },
  {
    id:'blocks',
    face:'😊',
    text:'There are also <strong style="color:#aa88ff">falling blocks</strong>.<br>Dim purple = a block is about to land.<br><span class="tut-warn">Don\'t stand under a block</span> when it lands!',
    hint:'🟪 Watch the block and avoid it',
    next:null,
    action:'show_block'
  },
  {
    id:'coins',
    face:'😄',
    text:'For every <span class="tut-good">survived round</span> you earn <strong style="color:#ffd700">+1 🪙 Coin</strong>.<br>Spend coins in the <strong>Shop</strong> on new cube looks!',
    hint:'',
    next:'Awesome!',
    action:null
  },
  {
    id:'hard_mode',
    face:'😏',
    text:'For the brave: <span class="tut-warn">🔥 Hard Mode</span>.<br>Lasers 2× faster, but you earn <strong style="color:#ffd700">3× more coins</strong>!<br>Master normal mode first.',
    hint:'',
    next:'I\'m ready!',
    action:null
  }
];

function tutBuildBoard() {
  const vw = document.documentElement.clientWidth;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  // reserve space: top (Cubek ~70px) + bottom actions ~130px
  const size = Math.min(vw - 16, vh - 240, 380);
  tutCellSize = size / TUT_N;

  const wrap = document.getElementById('tut-board-wrap');
  wrap.style.cssText = `position:relative;flex:0 0 auto;touch-action:none;
    margin-top:72px;width:${size}px;`;

  tutBoard.style.width = tutBoard.style.height = size + 'px';
  tutBoard.style.display = 'grid';
  tutBoard.style.gridTemplate = `repeat(${TUT_N},1fr)/repeat(${TUT_N},1fr)`;
  tutBoard.style.background = '#08081a';
  applyBoardSkin(); // [1.9] override with selected board skin
  tutBoard.style.border = '1.5px solid #1a2a4a';
  tutBoard.style.borderRadius = '6px';
  tutBoard.style.overflow = 'hidden';

  tutCanvas.width = tutCanvas.height = size;
  tutCanvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;border-radius:6px;';

  tutBoard.innerHTML = ''; tutCells = [];
  for (let y=0;y<TUT_N;y++){
    const row=[];
    for(let x=0;x<TUT_N;x++){
      const c=document.createElement('div');
      c.className='cell';
      c.addEventListener('click',()=>tutHandleClick(x,y));
      tutBoard.appendChild(c); row.push(c);
    }
    tutCells.push(row);
  }
}

function tutDrawLasers() { // [1.9.1] bug #7: canvas-based laser rendering (no CSS border glow)
  if (!tutCtx || tutLasers.length === 0) return;
  const laserCol = LASER_COLORS[laserColorId] || LASER_COLORS.red;
  const fireLasers   = tutLasers.filter(l => l.state === 'fire');
  const chargeLasers = tutLasers.filter(l => l.state === 'charge');
  const pulse = .45 + .35 * Math.sin(Date.now() * .009);
  if (chargeLasers.length > 0) {
    tutCtx.save();
    tutCtx.beginPath();
    for (const L of chargeLasers) {
      if (L.type==='row') tutCtx.rect(0, L.idx*tutCellSize, tutCanvas.width, tutCellSize);
      else                tutCtx.rect(L.idx*tutCellSize, 0, tutCellSize, tutCanvas.height);
    }
    tutCtx.clip();
    tutCtx.globalAlpha = .28 + .22*pulse;
    tutCtx.fillStyle = laserCol.charge;
    tutCtx.fillRect(0, 0, tutCanvas.width, tutCanvas.height);
    tutCtx.globalAlpha = 1;
    tutCtx.restore();
  }
  if (fireLasers.length > 0) {
    tutCtx.save();
    tutCtx.beginPath();
    for (const L of fireLasers) {
      if (L.type==='row') tutCtx.rect(0, L.idx*tutCellSize, tutCanvas.width, tutCellSize);
      else                tutCtx.rect(L.idx*tutCellSize, 0, tutCellSize, tutCanvas.height);
    }
    tutCtx.clip();
    tutCtx.fillStyle = laserCol.fire;
    tutCtx.fillRect(0, 0, tutCanvas.width, tutCanvas.height);
    tutCtx.globalCompositeOperation = 'lighter';
    tutCtx.fillStyle = 'rgba(255,90,0,.18)';
    tutCtx.fillRect(0, 0, tutCanvas.width, tutCanvas.height);
    tutCtx.globalCompositeOperation = 'source-over';
    tutCtx.restore();
  }
}

function tutRender() {
  if (!tutCells.length) return;
  for(let y=0;y<TUT_N;y++) for(let x=0;x<TUT_N;x++) tutCells[y][x].className='cell';
  // dash range highlight
  for(let y=0;y<TUT_N;y++) for(let x=0;x<TUT_N;x++)
    if(Math.abs(x-tutCube.x)+Math.abs(y-tutCube.y)<=5 && !(x===tutCube.x&&y===tutCube.y))
      tutCells[y][x].classList.add('dashable');
  // blocks (CSS classes — no border glow issue with blocks)
  for(const b of tutBlocks) tutCells[b.y][b.x].classList.add(b.state==='land'?'block':'block-charge');
  // [1.9.1] bug #7: lasers drawn on canvas (not CSS classes) — see tutDrawLasers()
  // cube (canvas)
  if(tutCtx){
    tutCtx.clearRect(0,0,tutCanvas.width,tutCanvas.height);
    drawBoardGridLines(tutCtx, tutCanvas.width, TUT_N); // [1.9]
    tutDrawLasers(); // [1.9.1] bug #7: canvas-based laser rendering
    const px=tutCube.x*tutCellSize, py=tutCube.y*tutCellSize, sz=tutCellSize;
    drawSkin(tutCtx, skinId, px, py, sz, skinAnimT);
    tutCtx.save();
    tutCtx.shadowColor=skinColor(); tutCtx.shadowBlur=8;
    tutCtx.strokeStyle=skinColor()+'66'; tutCtx.lineWidth=1.5;
    tutCtx.beginPath(); tutCtx.roundRect(px+1,py+1,sz-2,sz-2,3); tutCtx.stroke();
    tutCtx.restore();
  }
}

function tutHandleClick(x, y) {
  if (!tutWaitingForAction) return;
  const step = TUT_STEPS[tutStep];

  if (step.action === 'wait_dash') {
    // Wykonaj dash
    const dx=x-tutCube.x, dy=y-tutCube.y, d=Math.abs(dx)+Math.abs(dy);
    if (d===0) return;
    if (d<=5){ tutCube.x=x; tutCube.y=y; }
    else {
      const sx=Math.round(5*Math.abs(dx)/d), sy=5-sx;
      tutCube.x=Math.max(0,Math.min(15,tutCube.x+Math.sign(dx)*sx));
      tutCube.y=Math.max(0,Math.min(15,tutCube.y+Math.sign(dy)*sy));
    }
    playSound('dash'); // [1.9.1] bug #1
    tutRender(); tutDashCount++;
    tutNextStep();
  }
  else if (step.action === 'wait_far_dash') {
    const d=Math.abs(x-tutCube.x)+Math.abs(y-tutCube.y);
    if (d<=5){ setTutHint('Click FURTHER than 5 cells from the cube!'); return; } // [1.9]
    const dx=x-tutCube.x,dy=y-tutCube.y;
    const sx=Math.round(5*Math.abs(dx)/d),sy=5-sx;
    tutCube.x=Math.max(0,Math.min(15,tutCube.x+Math.sign(dx)*sx));
    tutCube.y=Math.max(0,Math.min(15,tutCube.y+Math.sign(dy)*sy));
    playSound('dash'); // [1.9.1] bug #1
    tutFarDashDone=true; tutRender(); tutNextStep();
  }
  else if (step.action === 'wait_laser_escape') {
    // Check if player is escaping laser line
    const dx=x-tutCube.x, dy=y-tutCube.y, d=Math.abs(dx)+Math.abs(dy);
    if (d===0) return;
    if (d<=5){ tutCube.x=x; tutCube.y=y; }
    else {
      const sx=Math.round(5*Math.abs(dx)/d),sy=5-sx;
      tutCube.x=Math.max(0,Math.min(15,tutCube.x+Math.sign(dx)*sx));
      tutCube.y=Math.max(0,Math.min(15,tutCube.y+Math.sign(dy)*sy));
    }
    tutRender();
    // Check if player escaped the laser
    let safeFromLaser=true;
    for(const L of tutLasers){
      if(L.type==='row'&&tutCube.y===L.idx){safeFromLaser=false;break;}
      if(L.type==='col'&&tutCube.x===L.idx){safeFromLaser=false;break;}
    }
    if(!safeFromLaser){
      setTutHint('You are still on the laser! Escape further!'); // [1.9]
      return;
    }
    playSound('dash'); // [1.9.1] bug #1
    tutEscapedLaser=true;
    tutWaitingForAction=false;
    tutPhaseTimer=setTimeout(()=>{
      for(const L of tutLasers) L.state='fire';
      playSound('laser_fire'); // [1.9.1] bug #1
      tutRender();
      tutPhaseTimer=setTimeout(()=>{
        tutNextStep();
      },800);
    },600);
  }
}

function setTutHint(t){ const el=document.getElementById('tut-hint'); if(el) el.textContent=t; }
function setTutText(html){ const el=document.getElementById('tut-text'); if(el) el.innerHTML=html; }
function setTutFace(f){ const el=document.getElementById('tut-teacher-face'); if(el) el.textContent=f; }

function tutShowStep(idx) {
  if (idx >= TUT_STEPS.length){ tutFinish(); return; }
  const bubble = document.getElementById('tut-bubble');

  // fade out dymka
  bubble.classList.add('fade-out');

  setTimeout(()=>{
    tutStep = idx;
    const step = TUT_STEPS[idx];
    const total = TUT_STEPS.length;

    // Update content
    document.getElementById('tut-progress-fill').style.width = ((idx/total)*100)+'%';
    document.getElementById('tut-step-num').textContent = `STEP ${idx+1} / ${total}`; // [1.9]
    setTutFace(step.face);
    setTutText(step.text);
    setTutHint(step.hint || '');

    // Button — always "NEXT →", hidden when step is interactive
    const btnNext = document.getElementById('tut-btn-next');
    const isInteractive = step.action === 'wait_dash' || step.action === 'wait_far_dash'
                       || step.action === 'wait_laser_escape';
    btnNext.style.display = isInteractive ? 'none' : 'block';
    btnNext.textContent = idx === TUT_STEPS.length - 1 ? '🎮 LET\'S PLAY!' : 'NEXT →'; // [1.9]

    tutWaitingForAction = false;
    clearTimeout(tutPhaseTimer);

    // Special step actions
    if (isInteractive) {
      tutWaitingForAction = true;
      if (step.action === 'wait_laser_escape') {
        tutLasers = [{ type:'row', idx:tutCube.y, state:'charge' }];
        playSound('laser_charge'); // [1.9.1]
      }
    }
    else if (step.action === 'show_laser_charge') {
      tutLasers = [
        { type:'row', idx:tutCube.y, state:'charge' },
        { type:'col', idx:Math.floor(Math.random()*16), state:'charge' }
      ];
      playSound('laser_charge'); // [1.9.1]
      // After 2s show the NEXT button
      tutPhaseTimer = setTimeout(()=>{
        btnNext.style.display = 'block';
      }, 2000);
    }
    else if (step.action === 'show_block') {
      const bx = (tutCube.x + 4) % TUT_N;
      let by = (tutCube.y + 4) % TUT_N;
      if (by < 3) by = TUT_N - 4; // [1.9.2] Bug #2: keep block below bubble (top rows covered on small screens)
      tutBlocks = [{ x:bx, y:by, state:'charge' }];
      btnNext.style.display = 'none';
      tutPhaseTimer = setTimeout(()=>{ // [1.9.1] increased from 1200ms to 2500ms (bug #2)
        tutBlocks[0].state='land'; tutRender();
        setTimeout(()=>{
          tutBlocks=[]; tutRender();
          btnNext.style.display = 'block';
        }, 1200); // [1.9.1] increased from 800ms to 1200ms (bug #2)
      }, 2500);
    }
    else {
      tutLasers = [];
    }

    tutRender();

    // fade in
    bubble.classList.remove('fade-out');
    bubble.classList.add('fade-in');
    setTimeout(()=> bubble.classList.remove('fade-in'), 200);
  }, 180);
}

function tutNextStep() {
  tutWaitingForAction = false;
  clearTimeout(tutPhaseTimer);
  tutLasers=[]; tutRender();
  tutShowStep(tutStep + 1);
}

function tutFinish() {
  document.getElementById('tut-progress-fill').style.width='100%';
  localStorage.setItem('cm_tutorial_done','1');
  clearTimeout(tutPhaseTimer);
  tutLasers=[]; tutBlocks=[];
  if (localStorage.getItem('cm_tutorial_rewarded') !== '1') { // [1.9.1] one-time reward
    coins += 100; save();
    statCoinsTotal += 100; localStorage.setItem('cm_stat_coins_total', statCoinsTotal); // [1.9.2]
    localStorage.setItem('cm_tutorial_rewarded','1');
    playSound('coin');
    setTutHint('Tutorial complete! +100 🪙');
    setTimeout(showMenu, 1800);
  } else {
    showMenu();
  }
}

function startTutorial() {
  showScreen('screen-tutorial');
  tutCube = {x:8,y:8};
  tutLasers=[]; tutBlocks=[];
  tutDashCount=0; tutFarDashDone=false; tutEscapedLaser=false;
  tutBuildBoard();
  tutShowStep(0);
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
document.getElementById('btn-start').addEventListener('click',    ()=>startGame(false));
document.getElementById('btn-hard').addEventListener('click',     ()=>startGame(true));
document.getElementById('stats-close').addEventListener('click',    showMenu);
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
// Tutorial
document.getElementById('tut-btn-next').addEventListener('click', ()=>{ playSound('click'); tutNextStep(); }); // [1.9.1] bug #1
document.getElementById('tut-btn-skip').addEventListener('click', ()=>{
  document.getElementById('tut-skip-confirm').classList.add('show');
});
document.getElementById('tut-skip-yes').addEventListener('click', ()=>{
  document.getElementById('tut-skip-confirm').classList.remove('show');
  localStorage.setItem('cm_tutorial_done','1');
  clearTimeout(tutPhaseTimer);
  showMenu();
});
document.getElementById('tut-skip-no').addEventListener('click', ()=>{
  document.getElementById('tut-skip-confirm').classList.remove('show');
});
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
if (!localStorage.getItem('cm_tutorial_done')) {
  startTutorial(); // [1.10.2] auto-start tutorial on first launch
} else {
  showMenu();
}
