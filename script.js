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
  const questionTails = ["どっちがすき？", "どっちえらぶ？", "どっちかな？"];

  const $ = (id) => document.getElementById(id);
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
  let lastIndex = -1;
  let unlocked = false;

  function pickPair() {
    let i = Math.floor(Math.random() * pairs.length);
    if (pairs.length > 1 && i === lastIndex) i = (i + 1) % pairs.length;
    lastIndex = i;
    currentPair = pairs[i];
    renderPair();
  }

  function renderPair() {
    leftEmoji.textContent = currentPair[0].emoji;
    rightEmoji.textContent = currentPair[1].emoji;
    leftLabel.textContent = currentPair[0].name;
    rightLabel.textContent = currentPair[1].name;
    adultPair.textContent = `${currentPair[0].name} / ${currentPair[1].name}`;
    setTimeout(() => askQuestion(), 220);
  }

  function ensureAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    unlocked = true;
  }

  function blip(freq, duration = 0.08, type = "sine", volume = 0.08, delay = 0) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // 借り音声：本物の録音ではなく、幼児向けの声っぽいリズム音。
  // Safariホーム画面でも動きやすいようにWeb Audioだけで鳴らす。
  function speakRhythm(kind, itemName = "") {
    ensureAudio();
    if (kind === "question") {
      // "A と B、どっちがすき？" のリズム
      const notes = [440, 494, 523, 440, 494, 523, 587, 554, 523, 587, 660];
      notes.forEach((n, i) => blip(n, i > 8 ? 0.13 : 0.075, "triangle", 0.075, i * 0.085));
    } else {
      // reaction / repeat
      const notes = [660, 784, 880, 784];
      notes.forEach((n, i) => blip(n, 0.10, "triangle", 0.09, i * 0.075));
    }
  }

  function askQuestion() {
    if (!unlocked) return;
    speakRhythm("question");
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
    const chosen = currentPair[side];
    const button = side === 0 ? leftChoice : rightChoice;
    button.classList.add("pressed");

    reactionText.textContent = reactions[Math.floor(Math.random() * reactions.length)];
    makeBurst();
    reaction.classList.add("show");
    dinoWrap.classList.add("celebrate");
    speakRhythm("reaction", chosen.name);

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

  leftChoice.addEventListener("click", () => handleChoice(0));
  rightChoice.addEventListener("click", () => handleChoice(1));

  soundBtn.addEventListener("click", () => {
    ensureAudio();
    askQuestion();
    soundBtn.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }],
      { duration: 220, easing: "ease-out" }
    );
  });

  document.addEventListener("touchstart", () => {
    if (!unlocked) ensureAudio();
  }, { once: true });

  // iOSの初回音声制限対策：初回タップで解放後、現在の問題音を鳴らす。
  document.addEventListener("pointerdown", () => {
    if (!unlocked) {
      ensureAudio();
      setTimeout(() => askQuestion(), 120);
    }
  }, { once: true });

  // Register service worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }

  renderPair();
})();
