// Simple inclined plane visualization & calculator
(function(){
  const ctx = document.getElementById('canvas').getContext('2d');
  const massEl = document.getElementById('mass');
  const angleEl = document.getElementById('angle');
  const angleVal = document.getElementById('angleVal');
  const muEl = document.getElementById('mu');
  const gEl = document.getElementById('g');
  const showVectorsEl = document.getElementById('showVectors');
  const showFrictionEl = document.getElementById('showFriction');
  const randomBtn = document.getElementById('randomize');
  const vecScaleEl = document.getElementById('vecScale');

  const weightOut = document.getElementById('weight');
  const normalOut = document.getElementById('normal');
  const parallelOut = document.getElementById('parallel');
  const frictionMaxOut = document.getElementById('frictionMax');
  const frictionUsedOut = document.getElementById('frictionUsed');
  const netOut = document.getElementById('net');
  const accOut = document.getElementById('acc');

  function toRad(deg){return deg*Math.PI/180}
  function round(x, n=3){return (Math.round(x*(10**n))/(10**n)).toFixed(n)}

  // clamp a vector (dx,dy) to a maximum pixel length and ensure finiteness
  function clampVector(dx, dy, maxLen){
    if(!isFinite(dx) || !isFinite(dy)) return {dx:0, dy:0};
    const len = Math.hypot(dx, dy) || 0;
    if(len === 0) return {dx:0, dy:0};
    if(maxLen <= 0) return {dx, dy};
    if(len > maxLen){
      const s = maxLen / len;
      return {dx: dx * s, dy: dy * s};
    }
    return {dx, dy};
  }

  function compute(){
    const m = parseFloat(massEl.value) || 0;
    const theta = parseFloat(angleEl.value) || 0; // degrees
    const mu = parseFloat(muEl.value) || 0;
    const g = parseFloat(gEl.value) || 9.81;

    const W = m*g; // weight
    const normal = W*Math.cos(toRad(theta));
    const parallel = W*Math.sin(toRad(theta));
    const f_max = mu*normal;

    // Determine friction used: if parallel <= f_max, block static equilibrium (no motion), friction = parallel (up to f_max)
    let frictionUsed = 0;
    let sliding = false;
    if(Math.abs(parallel) <= f_max + 1e-9){
      frictionUsed = parallel; // static: friction balances parallel, net = 0
      sliding = false;
    } else {
      // kinetic sliding down the plane: friction opposes motion and equals f_max for this simple model
      frictionUsed = f_max;
      sliding = true;
    }

    // net force down the plane (positive = downwards along plane)
    let net = parallel - frictionUsed;
    // If not sliding, net should be ~0 (no acceleration)
    if(!sliding) net = 0;
    const acc = m>0? net/m : 0;

    return {m,theta,mu,g,W,normal,parallel,f_max,frictionUsed,sliding,net,acc};
  }

  function render(){
    const data = compute();
    // update outputs
    weightOut.textContent = round(data.W,3);
    normalOut.textContent = round(data.normal,3);
    parallelOut.textContent = round(data.parallel,3);
    frictionMaxOut.textContent = round(data.f_max,3);
    frictionUsedOut.textContent = round(data.frictionUsed,3);
    netOut.textContent = round(data.net,3);
    accOut.textContent = round(data.acc,4);

    // draw incline and block and vectors
    
    const canvas = ctx.canvas;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const pad = 60;
    const w = canvas.width - pad*2;
    const h = canvas.height - pad*2;

    // base line and incline geometry
    const theta = toRad(data.theta);
    // choose triangle size
    const triBase = Math.min(w, h*1.6);
    const x0 = pad + 80;
    const y0 = pad + h - 40;
    const x1 = x0 + triBase;
    const y1 = y0;
    const x2 = x0 + triBase*Math.cos(theta);
    const y2 = y0 - triBase*Math.sin(theta);

    // draw base
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#444';
    ctx.beginPath(); ctx.moveTo(x0-30,y0); ctx.lineTo(x1+10,y1); ctx.stroke();

    // draw ramp
    ctx.strokeStyle = '#1f77b4';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x2,y2); ctx.stroke();

    // draw block position at some offset on plane
    
    const blockPosRatio = 0.35; // 0..1 along incline
    const bx = x0 + (x2-x0)*blockPosRatio;
    const by = y0 + (y2-y0)*blockPosRatio;
    const blockSize = 28;
    // draw block as rotated rectangle aligned with plane
    
    ctx.save();
    ctx.translate(bx,by);
    ctx.rotate(-theta);
    ctx.fillStyle = '#ffb74d';
    ctx.strokeStyle = '#b36b00';
    ctx.lineWidth = 2;
    ctx.fillRect(-blockSize/2, -blockSize/2, blockSize, blockSize);
    ctx.strokeRect(-blockSize/2, -blockSize/2, blockSize, blockSize);
    ctx.restore();

    if(showVectorsEl.checked){
      // scale for vectors display (visual only) — user-controlled via slider
      const scale = parseFloat(vecScaleEl.value) || 12;
      const maxVecLen = Math.max(80, Math.min(canvas.width, canvas.height) * 0.6); // pixels
      // world coords for weight tail = block center
      const tailX = bx;
      const tailY = by;

      // define unit vectors (canvas coords: +x right, +y down)
      // unit up along plane (from bottom toward top): u_up = (cosθ, -sinθ)
      const u_up_x = Math.cos(theta);
      const u_up_y = -Math.sin(theta);
      // unit down along plane (top toward bottom)
      const u_down_x = -u_up_x;
      const u_down_y = -u_up_y;
      // outward normal (pointing away from plane surface, up-left for positive θ)
      const n_unit_x = -Math.sin(theta);
      const n_unit_y = -Math.cos(theta);

      // Weight (vertical down)
      const wdx = 0;
      const wdy = data.W;
      const wCl = clampVector(wdx*scale, wdy*scale, maxVecLen);
      drawArrow(tailX, tailY, tailX + wCl.dx, tailY + wCl.dy, '#d62728', 3, 'W = '+round(data.W,2));

      // Normal: points along n_unit, magnitude = data.normal
      const nx = n_unit_x * data.normal * scale;
      const ny = n_unit_y * data.normal * scale;
      const nCl = clampVector(nx, ny, maxVecLen);
      drawArrow(tailX, tailY, tailX + nCl.dx, tailY + nCl.dy, '#2ca02c', 3, 'N = '+round(data.normal,2));

      // Parallel component: points down the plane (u_down), magnitude = data.parallel
      const px = u_down_x * data.parallel * scale;
      const py = u_down_y * data.parallel * scale;
      const pCl = clampVector(px, py, maxVecLen);
      drawArrow(tailX, tailY, tailX + pCl.dx, tailY + pCl.dy, '#9467bd', 3, 'W‖ = '+round(data.parallel,2));

      // Friction: acts up the plane (opposes motion). Use u_up direction with magnitude frictionUsed
      if(showFrictionEl.checked){
        const fx = u_up_x * data.frictionUsed * scale;
        const fy = u_up_y * data.frictionUsed * scale;
        const fCl = clampVector(fx, fy, maxVecLen);
        drawArrow(tailX, tailY, tailX + fCl.dx, tailY + fCl.dy, '#8c564b', 3, 'f = '+round(data.frictionUsed,2));
      }

      // Net force along plane: positive data.net means down the plane (u_down direction)
      if(Math.abs(data.net) > 1e-9){
        const nx2 = u_down_x * data.net * scale;
        const ny2 = u_down_y * data.net * scale;
        const netCl = clampVector(nx2, ny2, maxVecLen);
        drawArrow(tailX - 12*u_up_x, tailY - 12*u_up_y, tailX - 12*u_up_x + netCl.dx, tailY - 12*u_up_y + netCl.dy, '#e377c2', 5, 'F_net = '+round(data.net,2));
      }

      // Projections: dashed lines from weight tail to component tips to show decomposition
      ctx.save();
      ctx.setLineDash([6,4]); ctx.lineWidth = 1; ctx.strokeStyle = '#666';
      const projPx = tailX + pCl.dx;
      const projPy = tailY + pCl.dy;
      ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(projPx, projPy); ctx.stroke();
      const projNx = tailX + nCl.dx;
      const projNy = tailY + nCl.dy;
      ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(projNx, projNy); ctx.stroke();
      ctx.restore();
    }

    // draw angle arc & text
    
    ctx.beginPath(); ctx.strokeStyle='#333'; ctx.lineWidth=1.5; ctx.moveTo(x0+30,y0); ctx.lineTo(x0+30+30*Math.cos(theta), y0-30*Math.sin(theta)); ctx.stroke();
    ctx.fillStyle = '#222'; ctx.font='14px sans-serif'; ctx.fillText(data.theta.toFixed(1)+'°', x0+36+12*Math.cos(theta), y0-18 - 12*Math.sin(theta));
  }

  function drawArrow(x1,y1,x2,y2,color,width,label){
    ctx.beginPath(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    // arrow head
    const angle = Math.atan2(y2-y1,x2-x1);
    const headlen = Math.max(8, Math.min(18, width*3));
    ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-headlen*Math.cos(angle-Math.PI/6), y2-headlen*Math.sin(angle-Math.PI/6));
    ctx.lineTo(x2-headlen*Math.cos(angle+Math.PI/6), y2-headlen*Math.sin(angle+Math.PI/6));
    ctx.closePath(); ctx.fill();
    if(label){
      ctx.font = '13px sans-serif'; ctx.fillStyle = '#222';
      const mx = (x1+x2)/2; const my = (y1+y2)/2;
      const offx = -8*Math.sin(angle); const offy = 8*Math.cos(angle);
      ctx.fillText(label, mx + offx + 6, my + offy + 4);
    }
  }

  // wire up events
  
  function updateAndRender(){
    angleVal.textContent = angleEl.value + '°';
    render();
  }
  angleEl.addEventListener('input', updateAndRender);
  massEl.addEventListener('input', updateAndRender);
  if(vecScaleEl) vecScaleEl.addEventListener('input', updateAndRender);
  muEl.addEventListener('input', updateAndRender);
  gEl.addEventListener('input', updateAndRender);
  showVectorsEl.addEventListener('change', updateAndRender);
  showFrictionEl.addEventListener('change', updateAndRender);
  randomBtn.addEventListener('click', ()=>{
    massEl.value = (Math.random()*4+0.2).toFixed(2);
    angleEl.value = Math.floor(Math.random()*60+1);
    muEl.value = (Math.random()*0.6).toFixed(2);
    updateAndRender();
  });

  // initial render
  updateAndRender();
})();
