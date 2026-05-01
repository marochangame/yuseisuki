(() => {
  "use strict";

  const pairs = [
    [{name:"りんご", emoji:"🍎"}, {name:"バナナ", emoji:"🍌"}],
    [{name:"いちご", emoji:"🍓"}, {name:"みかん", emoji:"🍊"}],
    [{name:"ぶどう", emoji:"🍇"}, {name:"メロン", emoji:"🍈"}],
    [{name:"アイス", emoji:"🍦"}, {name:"ドーナツ", emoji:"🍩"}],
    [{name:"ケーキ", emoji:"🍰"}, {name:"プリン", emoji:"🍮"}],
    [{name:"おにぎり", emoji:"🍙"}, {name:"パン", emoji:"🍞"}],
    [{name:"いぬ", emoji:"🐶"}, {name:"ねこ", emoji:"🐱"}],
    [{name:"うさぎ", emoji:"🐰"}, {name:"ぱんだ", emoji:"🐼"}],
    [{name:"ぞう", emoji:"🐘"}, {name:"きりん", emoji:"🦒"}],
    [{name:"ぺんぎん", emoji:"🐧"}, {name:"いるか", emoji:"🐬"}],
    [{name:"くるま", emoji:"🚗"}, {name:"でんしゃ", emoji:"🚃"}],
    [{name:"バス", emoji:"🚌"}, {name:"ひこうき", emoji:"✈️"}],
    [{name:"ロケット", emoji:"🚀"}, {name:"ふね", emoji:"⛵"}],
    [{name:"ボール", emoji:"⚽"}, {name:"ふうせん", emoji:"🎈"}],
    [{name:"たいこ", emoji:"🥁"}, {name:"ラッパ", emoji:"🎺"}],
    [{name:"おひさま", emoji:"☀️"}, {name:"おつきさま", emoji:"🌙"}],
    [{name:"にじ", emoji:"🌈"}, {name:"ほし", emoji:"⭐"}],
    [{name:"くつ", emoji:"👟"}, {name:"ぼうし", emoji:"🧢"}],
    [{name:"えほん", emoji:"📖"}, {name:"つみき", emoji:"🧱"}],
    [{name:"きょうりゅう", emoji:"🦖"}, {name:"たまご", emoji:"🥚"}]
  ];

  const reactions = ["いいねぇ！", "それー！", "そっちすき！", "やったぁ！", "うんうん！"];

  const $ = (id) => document.getElementById(id);
  const startScreen = $("startScreen");
  const gameScreen = $("gameScreen");
  const startBtn = $("startBtn");
  const leftChoice = $("leftChoice");
  const rightChoice = $("rightChoice");
  const leftEmoji = $("leftEmoji");
  const rightEmoji = $("rightEmoji");
  const leftLabel = $("leftLabel");
  const rightLabel = $("rightLabel");
  const adultPair = $("adultPair");
  const reaction = $("reaction");
  const reactionText = $("reactionText");
  const burst = $("burst");
  const dinoWrap = $("dinoWrap");
  const soundBtn = $("soundBtn");

  let currentPair = pairs[0];
  let busy = false;
  let audioCtx = null;
  let lastIndex = 0;

  function ensureAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function beep(freq, duration, delay = 0, volume = 0.18, type = "triangle") {
    if (!audioCtx) return;
    const t = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  // 「はじめるよー」っぽい、明るい上昇リズム
  function playStartSound() {
    ensureAudio();
    beep(523, .11, 0.00, .18);
    beep(659, .11, 0.13, .18);
    beep(784, .16, 0.26, .20);
    beep(1046, .20, 0.44, .16);
  }

  // 「AとB、どっちがすき？」の短い問いかけリズム
  function playQuestionSound() {
    ensureAudio();
    const notes = [440,494,523,0,440,494,523,0,587,554,523,587,660];
    let delay = 0;
    notes.forEach(n => {
      if (n === 0) { delay += .07; return; }
      beep(n, .075, delay, .11);
      delay += .085;
    });
  }

  // 子供向けアニメ風：ピコン→キラッ
  function playChoiceSound() {
    ensureAudio();
    beep(740, .08, 0.00, .20, "triangle");
    beep(988, .10, 0.09, .20, "triangle");
    beep(1318, .16, 0.22, .16, "sine");
    beep(1568, .18, 0.32, .12, "sine");
  }

  function renderPair() {
    leftEmoji.textContent = currentPair[0].emoji;
    rightEmoji.textContent = currentPair[1].emoji;
    leftLabel.textContent = currentPair[0].name;
    rightLabel.textContent = currentPair[1].name;
    adultPair.textContent = `${currentPair[0].name} / ${currentPair[1].name}`;
  }

  function pickPair() {
    let i = Math.floor(Math.random() * pairs.length);
    if (pairs.length > 1 && i === lastIndex) i = (i + 1) % pairs.length;
    lastIndex = i;
    currentPair = pairs[i];
    renderPair();
    setTimeout(playQuestionSound, 180);
  }

  function makeBurst() {
    burst.innerHTML = "";
    const colors = ["#ffd75a", "#ff9baa", "#7ee6ff", "#98ef8c", "#ffffff"];
    for (let i = 0; i < 22; i++) {
      const s = document.createElement("span");
      const angle = (Math.PI * 2 * i) / 22;
      const dist = 90 + Math.random() * 170;
      s.style.setProperty("--x", `${Math.cos(angle) * dist}px`);
      s.style.setProperty("--y", `${Math.sin(angle) * dist}px`);
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = `${Math.random() * 0.08}s`;
      burst.appendChild(s);
    }
  }

  function handleChoice(side) {
    if (busy) return;
    ensureAudio();
    busy = true;
    playChoiceSound();

    const button = side === 0 ? leftChoice : rightChoice;
    button.classList.add("pressed");

    reactionText.textContent = reactions[Math.floor(Math.random() * reactions.length)];
    makeBurst();
    reaction.classList.add("show");
    dinoWrap.classList.add("celebrate");

    setTimeout(() => button.classList.remove("pressed"), 170);
    setTimeout(() => {
      reaction.classList.remove("show");
      dinoWrap.classList.remove("celebrate");
    }, 820);
    setTimeout(() => {
      busy = false;
      pickPair();
    }, 980);
  }

  startBtn.addEventListener("click", () => {
    ensureAudio();
    playStartSound();
    startScreen.classList.add("hide");
    gameScreen.setAttribute("aria-hidden", "false");
    setTimeout(playQuestionSound, 700);
  });

  leftChoice.addEventListener("click", () => handleChoice(0));
  rightChoice.addEventListener("click", () => handleChoice(1));
  soundBtn.addEventListener("click", playQuestionSound);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }

  renderPair();
})();
