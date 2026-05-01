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

  function speak(text, options = {}) {
    ensureAudio();

    const {
      rate = 1.0,
      pitch = 1.18,
      volume = 1,
      onend = null,
      cancel = true
    } = options;

    if (!("speechSynthesis" in window)) {
      if (onend) setTimeout(onend, 700);
      return;
    }

    try {
      if (cancel) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ja-JP";
      u.rate = rate;
      u.pitch = pitch;
      u.volume = volume;
      if (jpVoice) u.voice = jpVoice;

      let ended = false;
      u.onend = () => {
        ended = true;
        if (onend) onend();
      };
      u.onerror = () => {
        if (!ended && onend) setTimeout(onend, 250);
      };

      speechSynthesis.speak(u);

      // iOSでonendが返らない時の保険。短文用。
      if (onend) {
        const fallbackMs = Math.max(900, text.length * 140);
        setTimeout(() => {
          if (!ended) {
            ended = true;
            onend();
          }
        }, fallbackMs);
      }
    } catch (e) {
      if (onend) setTimeout(onend, 650);
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

  function playStartThenShowGame() {
    ensureAudio();

    // v7：開始案内を長めにして、最後まで待ってから画面を切り替える。
    const startText = "画面をタッチしてねー。はじまるよー。";

    let switched = false;
    const switchToGame = () => {
      if (switched) return;
      switched = true;
      startScreen.classList.add("hide");
      gameScreen.setAttribute("aria-hidden", "false");
      setTimeout(playQuestionSound, 450);
    };

    speak(startText, {
      rate: 0.88,
      pitch: 1.10,
      volume: 1,
      cancel: true,
      onend: switchToGame
    });

    // iOSでonendが早く返る/遅れる時のため、最低2.6秒は画面を維持する保険。
    setTimeout(switchToGame, 2600);

    // 声を邪魔しない小さな開始効果音。
    beep(784, .06, 0.04, .025);
    beep(1046, .08, 0.28, .022);
  }

  function playQuestionSound() {
    const a = currentPair[0].name;
    const b = currentPair[1].name;
    speak(`ユーセーくんは、${a}と${b}、どっちがすき？`, {
      rate: 0.98,
      pitch: 1.14,
      volume: 1,
      cancel: true
    });
  }

  function playChoiceSound(chosenName) {
    // 効果音
    beep(880, .07, 0.00, .08);
    beep(1175, .09, 0.09, .075);
    beep(1568, .14, 0.21, .055);

    const line = reactions[Math.floor(Math.random() * reactions.length)];

    // 効果音の後に声。ここは短く。
    setTimeout(() => {
      speak(`${chosenName}、${line}`, {
        rate: 1.03,
        pitch: 1.18,
        volume: 1,
        cancel: true
      });
    }, 190);

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
    setTimeout(playQuestionSound, 360);
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
    }, 1700);
  }

  startBtn.addEventListener("click", playStartThenShowGame);

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
