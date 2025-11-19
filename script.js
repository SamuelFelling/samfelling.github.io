// script.js — shared behaviors for the personal site

// Fill year placeholders
(function setYears(){
  const y = new Date().getFullYear();
  ['year','year-2','year-3','year-4','year-5','year-6'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.textContent = y;
  });
})();

// Simple nav highlight based on current file
(function navHighlight(){
  const links = document.querySelectorAll('.main-nav a');
  const path = window.location.pathname.split('/').pop();
  links.forEach(a=>{
    if(a.getAttribute('href')===path || (path==='') && a.getAttribute('href')==='index.html'){
      a.classList.add('active');
    }
  });
})();

// -- Game logic for game.html --
(function gameModule(){
  const playBtn = document.getElementById('play-btn');
  const clickBtn = document.getElementById('click-btn');
  const timeEl = document.getElementById('time');
  const scoreEl = document.getElementById('score');
  const message = document.getElementById('message');
  if(!playBtn) return; // not on game page

  let timeLeft = 30;
  let score = 0;
  let timer = null;

  function reset(){
    timeLeft = 30; score = 0; updateUI();
    message.textContent = '';
    clickBtn.disabled = true;
  }

  function updateUI(){
    timeEl.textContent = timeLeft;
    scoreEl.textContent = score;
  }

  playBtn.addEventListener('click', ()=>{
    reset();
    clickBtn.disabled = false;
    playBtn.disabled = true;
    timer = setInterval(()=>{
      timeLeft -= 1;
      updateUI();
      if(timeLeft <= 0){
        clearInterval(timer);
        clickBtn.disabled = true;
        playBtn.disabled = false;
        message.textContent = `Time's up! Your score: ${score}`;
      }
    }, 1000);
  });

  clickBtn.addEventListener('click', ()=>{
    // simple scoring: add 1 per click, bonus if fast
    score += 1;
    scoreEl.textContent = score;
    // small visual feedback
    clickBtn.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.08)' },
      { transform: 'scale(1)' }
    ], { duration: 120, easing: 'ease-out' });
  });

  // init
  reset();
})();

// End of script.js

// ----------------- Dodge Game Module -----------------
/*
  Simple Dodge Game
  - Player is a blue square at the bottom
  - Use left/right arrows to move
  - Red squares fall from the top
  - Time survived is the score
  - Start and Reset buttons control the game
  Beginner-friendly, commented code.
*/
(function dodgeGame(){
  const startBtn = document.getElementById('dodge-start');
  const resetBtn = document.getElementById('dodge-reset');
  const scoreEl = document.getElementById('dodge-score');
  const area = document.getElementById('dodge-area');
  if(!startBtn || !resetBtn || !scoreEl || !area) return; // not on dodge game page

  // Create canvas inside the game area
  const canvas = document.createElement('canvas');
  canvas.id = 'dodge-canvas';
  area.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Game state
  let running = false;
  let lastTime = 0;
  let startTime = 0;
  let elapsed = 0; // seconds

  // Player properties
  const player = {
    width: 34,
    height: 34,
    x: 0, // will be set in reset
    y: 0,
    speed: 340 // pixels per second (slightly reduced for more challenge)
  };

  // Enemies array
  let enemies = [];
  let spawnTimer = 0;
  let spawnInterval = 1.0; // seconds between spawns (will decrease to increase difficulty)

  // Controls
  const keys = { left:false, right:false };

  // Responsive canvas setup
  function resizeCanvas(){
    const rect = area.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    // update player y based on canvas height
    player.y = (rect.height - player.height - 8);
  }

  window.addEventListener('resize', resizeCanvas);

  // Utility: AABB collision detection
  function collides(a, b){
    return !(a.x + a.width < b.x || a.x > b.x + b.width || a.y + a.height < b.y || a.y > b.y + b.height);
  }

  // Spawn a new enemy at random x
  function spawnEnemy(){
    const areaRect = area.getBoundingClientRect();
    // enemy width 28-58 (slightly larger on average)
    const w = 28 + Math.random()*30;
    const x = Math.random() * (areaRect.width - w);
    // increase base speed and variability so enemies fall faster
    const baseSpeed = 160; // px/s base (was 120)
    const speed = baseSpeed + Math.random()*200 + (elapsed * 10); // increase over time more aggressively
    enemies.push({ x, y: -w, width: w, height: w, speed });
  }

  // Reset game state
  function reset(){
    running = false;
    enemies = [];
    spawnTimer = 0;
    spawnInterval = 1.0;
    elapsed = 0;
    lastTime = 0;
    startTime = 0;
    // position player in the middle bottom
    const rect = area.getBoundingClientRect();
    player.x = Math.max(8, (rect.width - player.width) / 2);
    player.y = (rect.height - player.height - 8);
    draw();
    updateScore();
  }

  // Update displayed score
  function updateScore(){
    scoreEl.textContent = elapsed.toFixed(2);
  }

  // Draw all game objects
  function draw(){
    const rect = area.getBoundingClientRect();
    ctx.clearRect(0,0,rect.width,rect.height);
    // background (optional subtle)
    // draw player (blue)
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // draw enemies (red)
    ctx.fillStyle = '#ef4444';
    enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));
  }

  // Main game loop
  function loop(ts){
    if(!running) return;
    if(!lastTime) lastTime = ts;
    const dt = (ts - lastTime) / 1000; // delta seconds
    lastTime = ts;
    elapsed = (ts - startTime) / 1000;

    // handle input: move player
    const rect = area.getBoundingClientRect();
    if(keys.left) player.x -= player.speed * dt;
    if(keys.right) player.x += player.speed * dt;
    // clamp to area
    player.x = Math.max(4, Math.min(rect.width - player.width - 4, player.x));

    // spawn enemies
    spawnTimer += dt;
    // gradually decrease spawn interval to increase difficulty (faster and a lower floor)
    spawnInterval = Math.max(0.25, 0.8 - (elapsed / 25));
    if(spawnTimer >= spawnInterval){
      spawnTimer = 0;
      spawnEnemy();
    }

    // update enemies
    for(let i = enemies.length - 1; i >= 0; i--){
      const e = enemies[i];
      e.y += e.speed * dt;
      // remove if off-screen
      if(e.y > rect.height + 50){ enemies.splice(i,1); continue; }
      // check collision with player
      if(collides({ x: player.x, y: player.y, width: player.width, height: player.height }, e)){
        endGame();
        return;
      }
    }

    // draw everything
    draw();
    updateScore();

    // next frame
    requestAnimationFrame(loop);
  }

  // Start the game
  function startGame(){
    if(running) return;
    running = true;
    enemies = [];
    spawnTimer = 0;
    lastTime = 0;
    startTime = performance.now();
    // ensure player positioned
    const rect = area.getBoundingClientRect();
    player.x = Math.max(8, (rect.width - player.width) / 2);
    player.y = (rect.height - player.height - 8);
    // focus so keyboard works on some browsers
    area.focus();
    requestAnimationFrame(loop);
  }

  // End game on collision
  function endGame(){
    running = false;
    // small flash effect
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over — Time: ' + elapsed.toFixed(2) + 's', canvas.width/ (window.devicePixelRatio||1) /2, (canvas.height/(window.devicePixelRatio||1))/2);
  }

  // Keyboard events
  window.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowLeft' || e.key === 'Left') keys.left = true;
    if(e.key === 'ArrowRight' || e.key === 'Right') keys.right = true;
  });
  window.addEventListener('keyup', (e)=>{
    if(e.key === 'ArrowLeft' || e.key === 'Left') keys.left = false;
    if(e.key === 'ArrowRight' || e.key === 'Right') keys.right = false;
  });

  // Button handlers
  startBtn.addEventListener('click', ()=>{
    reset();
    startGame();
  });
  resetBtn.addEventListener('click', ()=>{
    reset();
  });

  // initial setup
  resizeCanvas();
  reset();

})();

// End Dodge Game Module

// ----------------- UMD Discover Video Handler -----------------
/*
  This code ensures the UMD marketing video on `discover.html` does not autoplay.
  It wires a centered overlay button that toggles play/pause and hides itself
  while native controls are used or when the video is playing.
*/
(function discoverVideo(){
  const video = document.getElementById('umd-video');
  const btn = document.getElementById('umd-video-btn');
  if(!video || !btn) return;

  // Clicking the overlay button toggles play/pause
  btn.addEventListener('click', ()=>{
    if(video.paused){
      video.play();
    } else {
      video.pause();
    }
  });

  // Clicking the video toggles play/pause as well (useful for large touch targets)
  video.addEventListener('click', ()=>{
    if(video.paused){ video.play(); } else { video.pause(); }
  });

  // Update overlay visibility based on playback state
  function updateButton(){
    if(video.paused){
      btn.classList.remove('hidden');
      btn.textContent = '▶';
    } else {
      btn.classList.add('hidden');
    }
  }

  // When native controls are used (e.g., user clicks play there), keep overlay in sync
  video.addEventListener('play', updateButton);
  video.addEventListener('pause', updateButton);
  video.addEventListener('ended', updateButton);

  // Prevent autoplay: ensure video is paused on load
  video.pause();
  updateButton();
})();

// End UMD Discover Video Handler
