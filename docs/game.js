/* Asteroids | Diego Troiani — HTML5 Canvas, sem dependências externas.
   Controles: ←/→ ou A/D = girar; ↑/W = acelerar; espaço = atirar; P = pausar.
   Em toque: use os botões abaixo do canvas. */
(() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const C = { blue: '#65BFEA', yellow: '#E6C55A', white: '#EDF2F7', muted:'#567C96' };
  const dom = Object.fromEntries(['score','best','wave','lives','overlay','overlay-kicker','overlay-title','overlay-desc','start','pause'].map(k=>[k,document.getElementById(k)]));
  const keys = new Set();
  let state = 'ready', ship, rocks=[], bullets=[], particles=[], wave=1, score=0, lives=3, invulnerable=0, shotCooldown=0, last=0, startNextWave=0, best=0;
  try {best = Math.max(0,Number(localStorage.getItem('diego-asteroids-best')||0));} catch (_) {}
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const format=n=>String(Math.floor(n)).padStart(6,'0');
  const wrap=obj=>{if(obj.x < -obj.r)obj.x=W+obj.r; if(obj.x>W+obj.r)obj.x=-obj.r;if(obj.y < -obj.r)obj.y=H+obj.r;if(obj.y>H+obj.r)obj.y=-obj.r;};
  function hud(){dom.score.textContent=format(score);dom.best.textContent=format(best);dom.wave.textContent=String(wave).padStart(2,'0');dom.lives.textContent=Array(Math.max(0,lives)).fill('♥').join(' ')||'—';}
  function shipReset(){ship={x:W/2,y:H/2,vx:0,vy:0,a:-Math.PI/2,r:13}; invulnerable=2.5;}
  function asteroid(x,y,r){return{x,y,r,vx:rnd(-1.25,1.25)*(58/r+0.4),vy:rnd(-1.25,1.25)*(58/r+0.4),rot:rnd(0,6.283),rotSpeed:rnd(-1,1),shape:Array.from({length:10},()=>rnd(.74,1.16))};}
  function initialRocks(n){rocks=[];for(let i=0;i<n;i++){let x,y;do{x=rnd(35,W-35);y=rnd(35,H-35);}while(Math.hypot(x-W/2,y-H/2)<195);rocks.push(asteroid(x,y,rnd(35,52)));}}
  function newGame(){score=0; lives=3; wave=1; bullets=[];particles=[];shotCooldown=0;startNextWave=0;shipReset();initialRocks(4);state='running';dom.overlay.classList.add('hidden');dom.pause.disabled=false;dom.pause.textContent='⏸ PAUSAR';hud();last=performance.now();}
  function overlay(kicker,title,desc,action){dom['overlay-kicker'].textContent=kicker;dom['overlay-title'].textContent=title;dom['overlay-desc'].textContent=desc;dom.start.textContent=action;dom.overlay.classList.remove('hidden');}
  function pause(){if(state==='running'){state='paused';dom.pause.textContent='▶ RETOMAR';overlay('GAME PAUSED','Jogo pausado','Retome quando estiver pronto.','▶ CONTINUAR');}else if(state==='paused'){state='running';dom.pause.textContent='⏸ PAUSAR';dom.overlay.classList.add('hidden');last=performance.now();}}
  function endGame(){state='gameover';dom.pause.disabled=true;overlay('GAME OVER','Fim de jogo',`Pontuação: ${format(score)} · Recorde: ${format(best)}`,'↻ JOGAR NOVAMENTE');}
  function shoot(){if(shotCooldown>0||state!=='running')return;shotCooldown=.16;const dx=Math.cos(ship.a),dy=Math.sin(ship.a);bullets.push({x:ship.x+dx*17,y:ship.y+dy*17,vx:dx*540+ship.vx*.15,vy:dy*540+ship.vy*.15,r:3,life:.95});}
  function explode(x,y,color,n=11){for(let i=0;i<n;i++){let a=rnd(0,Math.PI*2),sp=rnd(35,190);particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rnd(.25,.75),max:.75,color});}}
  function hitRock(rock){score += rock.r > 31?20:rock.r>18?50:100;const i=rocks.indexOf(rock);if(i!==-1)rocks.splice(i,1);explode(rock.x,rock.y,C.blue,10);if(rock.r>18){const rr=rock.r*.61;rocks.push(asteroid(rock.x-rr*.4,rock.y-rr*.3,rr),asteroid(rock.x+rr*.4,rock.y+rr*.3,rr));}if(score>best){best=score;try{localStorage.setItem('diego-asteroids-best',String(best));}catch(_){}}hud();}
  function advanceWave(){wave++;bullets=[];shipReset();initialRocks(Math.min(4+wave,11));hud();}
  function update(dt){
    if(state!=='running')return;
    invulnerable=Math.max(0,invulnerable-dt);shotCooldown=Math.max(0,shotCooldown-dt);
    if(keys.has('ArrowLeft')||keys.has('KeyA'))ship.a-=4*dt;
    if(keys.has('ArrowRight')||keys.has('KeyD'))ship.a+=4*dt;
    if(keys.has('ArrowUp')||keys.has('KeyW')){ship.vx+=Math.cos(ship.a)*240*dt;ship.vy+=Math.sin(ship.a)*240*dt;if(Math.random()<.4)particles.push({x:ship.x-Math.cos(ship.a)*17,y:ship.y-Math.sin(ship.a)*17,vx:-Math.cos(ship.a)*rnd(70,155),vy:-Math.sin(ship.a)*rnd(70,155),life:.22,max:.22,color:C.yellow});}
    if(keys.has('Space'))shoot();
    ship.vx*=Math.pow(.985,dt*60);ship.vy*=Math.pow(.985,dt*60);
    const speed=Math.hypot(ship.vx,ship.vy);if(speed>360){ship.vx=ship.vx/speed*360;ship.vy=ship.vy/speed*360;}
    ship.x+=ship.vx*dt;ship.y+=ship.vy*dt;wrap(ship);
    for(const rock of rocks){rock.x+=rock.vx*dt*60;rock.y+=rock.vy*dt*60;rock.rot+=rock.rotSpeed*dt;wrap(rock);}
    for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;wrap(b);}
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}
    particles=particles.filter(p=>p.life>0);bullets=bullets.filter(b=>b.life>0);
    // Collisions with bullets. Copy preserves valid iteration when asteroids split.
    for(const b of [...bullets]){for(const rock of [...rocks]){if(Math.hypot(b.x-rock.x,b.y-rock.y)<rock.r+b.r){bullets.splice(bullets.indexOf(b),1);hitRock(rock);break;}}}
    if(invulnerable<=0){for(const rock of rocks){if(Math.hypot(ship.x-rock.x,ship.y-rock.y)<rock.r+ship.r*.72){explode(ship.x,ship.y,C.yellow,24);lives--;hud();if(lives<=0)endGame();else shipReset();break;}}}
    if(rocks.length===0&&state==='running'){if(!startNextWave)startNextWave=.9;else{startNextWave-=dt;if(startNextWave<=0){startNextWave=0;advanceWave();}}}else startNextWave=0;
  }
  function line(points,color,width=2){ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0C1925';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#213E50';for(let x=18;x<W;x+=38)for(let y=18;y<H;y+=38){ctx.globalAlpha=.35;ctx.fillRect(x,y,1,1);}ctx.globalAlpha=1;
    for(const rock of rocks){const pts=rock.shape.map((f,i)=>{const a=i/rock.shape.length*Math.PI*2+rock.rot;return[rock.x+Math.cos(a)*rock.r*f,rock.y+Math.sin(a)*rock.r*f];});line(pts,C.blue,2.2);}
    for(const b of bullets){ctx.fillStyle=C.yellow;ctx.beginPath();ctx.arc(b.x,b.y,3,0,Math.PI*2);ctx.fill();}
    for(const p of particles){ctx.globalAlpha=Math.max(0,Math.min(1,p.life/p.max));ctx.fillStyle=p.color;ctx.fillRect(p.x-2,p.y-2,4,4);}ctx.globalAlpha=1;
    if(ship&&(state==='running'||state==='paused')&&(invulnerable<=0||Math.floor(invulnerable*9)%2===0)){
      const c=Math.cos(ship.a),s=Math.sin(ship.a);const point=(ax,ay)=>[ship.x+ax*c-ay*s,ship.y+ax*s+ay*c];
      line([point(21,0),point(-15,13),point(-7,0),point(-15,-13)],C.yellow,3);
    }
    if(startNextWave>0){ctx.textAlign='center';ctx.font='bold 25px Arial';ctx.fillStyle=C.yellow;ctx.fillText('SETOR LIMPO',W/2,H/2-60);ctx.textAlign='start';}
  }
  function frame(t){let dt=Math.min(.045,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(frame);}
  const codes=new Set(['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW','KeyP']);
  addEventListener('keydown',e=>{if(!codes.has(e.code))return;if(e.target instanceof HTMLElement&&['INPUT','TEXTAREA'].includes(e.target.tagName))return;e.preventDefault();if(e.code==='KeyP'){if(!e.repeat)pause();return;}keys.add(e.code);if(e.code==='Space'&&state==='ready')newGame();});
  addEventListener('keyup',e=>keys.delete(e.code));
  addEventListener('blur',()=>{keys.clear();if(state==='running')pause();});
  document.querySelectorAll('[data-key]').forEach(btn=>{
    const key=btn.dataset.key;
    btn.addEventListener('pointerdown',e=>{e.preventDefault();if(state==='ready')newGame();keys.add(key);btn.setPointerCapture?.(e.pointerId);});
    for(const ev of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(ev,()=>keys.delete(key));
  });
  dom.start.addEventListener('click',()=>{if(state==='paused')pause();else newGame();});dom.pause.addEventListener('click',pause);
  hud();requestAnimationFrame(t=>{last=t;frame(t);});
})();
