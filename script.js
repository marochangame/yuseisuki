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

  const reactions = ["いいねぇー！", "それー！", "そっちすきー！", "やったぁ！", "うんうん！"];

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
  let lastIndex = 0;
  let audioCtx = null;
  let jpVoice = null;

  function setupVoice() {
    if (!("speechSynthesis" in window)) return;
    const voices = speechSynthesis.getVoices();
    jpVoice =
      voices.find(v => v.lang === "ja-JP" && /Kyoko|Otoya|Japanese|日本/i.test(v.name)) ||
      voices.find(v => v.lang === "ja-JP") ||
      voices.find(v => v.lang && v.lang.startsWith("ja")) ||
      null;
  }

  if ("speechSynthesis" in window) {
    setupVoice();
    speechSynthesis.onvoiceschanged = setupVoice;
  }

  function ensureAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    setupVoice();
  }

  function speak(text, rate = 1.02, pitch = 1.28, volume = 1) {
    ensureAudio();

    if (!("speechSynthesis" in window)) {
      playFallbackMelody();
      return;
    }

    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ja-JP";
      u.rate = rate;
      u.pitch = pitch;
      u.volume = volume;
      if (jpVoice) u.voice = jpVoice;
      speechSynthesis.speak(u);
    } catch (e) {
      playFallbackMelody();
    }
  }

  function beep(freq, duration, delay = 0, volume = 0.10, type = "triangle") {
    if (!audioCtx) return;
    const t = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  function playFallbackMelody() {
    beep(523, .10, 0.00, .12);
    beep(659, .10, 0.12, .12);
    beep(784, .14, 0.24, .12);
  }

  function playStartSound() {
    speak("はじめるよー！", 1.05, 1.35, 1);
    beep(784, .07, 0.00, .07);
    beep(1046, .10, 0.13, .06);
  }

  function playQuestionSound() {
    const a = currentPair[0].name;
    const b = currentPair[1].name;
    speak(`ユーセーくんは、${a}と${b}、どっちがすき？`, 1.02, 1.25, 1);
  }

  function playChoiceSound(chosenName) {
    beep(880, .07, 0.00, .11);
    beep(1175, .09, 0.09, .10);
    beep(1568, .14, 0.21, .07);
    const line = reactions[Math.floor(Math.random() * reactions.length)];
    setTimeout(() => speak(`${chosenName}、${line}`, 1.08, 1.33, 1), 180);
    return line;
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
    setTimeout(playQuestionSound, 260);
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

    const line = playChoiceSound(chosen.name);
    reactionText.textContent = line.replace("ー！", "！");
    makeBurst();
    reaction.classList.add("show");
    dinoWrap.classList.add("celebrate");

    setTimeout(() => button.classList.remove("pressed"), 170);
    setTimeout(() => {
      reaction.classList.remove("show");
      dinoWrap.classList.remove("celebrate");
    }, 980);
    setTimeout(() => {
      busy = false;
      pickPair();
    }, 1450);
  }

  startBtn.addEventListener("click", () => {
    ensureAudio();
    playStartSound();
    startScreen.classList.add("hide");
    gameScreen.setAttribute("aria-hidden", "false");
    setTimeout(playQuestionSound, 900);
  });

  leftChoice.addEventListener("click", () => handleChoice(0));
  rightChoice.addEventListener("click", () => handleChoice(1));

  soundBtn.addEventListener("click", () => {
    ensureAudio();
    playQuestionSound();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }

  renderPair();
})();
