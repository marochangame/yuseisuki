
let audioCtx;
function initAudio(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  }
}

function tone(freq, time){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.2, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+time);
  o.start();
  o.stop(audioCtx.currentTime+time);
}

// アニメ風決定音
function playDecision(){
  tone(800,0.1);
  setTimeout(()=>tone(1200,0.15),120);
}

// スタート問いかけ音
function playQuestion(){
  tone(500,0.12);
  setTimeout(()=>tone(600,0.12),150);
  setTimeout(()=>tone(700,0.15),300);
}

function choose(){
  initAudio();
  playDecision();

  const dino = document.getElementById("dino");
  const effect = document.getElementById("effect");

  dino.style.transform="translateY(-30px)";
  setTimeout(()=>dino.style.transform="translateY(0)",300);

  effect.style.display="block";
  setTimeout(()=>effect.style.display="none",800);
}

// 初回タップで音解放＋質問
document.body.addEventListener("pointerdown",()=>{
  initAudio();
  playQuestion();
},{once:true});

document.getElementById("leftBtn").onclick=choose;
document.getElementById("rightBtn").onclick=choose;
