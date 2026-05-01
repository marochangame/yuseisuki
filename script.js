(() => {
  "use strict";

  const pairs = [
    [{ name: "おにぎり", emoji: "🍙" }, { name: "パン", emoji: "🍞" }],
    [{ name: "くるま", emoji: "🚗" }, { name: "でんしゃ", emoji: "🚃" }],
    [{ name: "ぺんぎん", emoji: "🐧" }, { name: "いるか", emoji: "🐬" }],
    [{ name: "りんご", emoji: "🍎" }, { name: "バナナ", emoji: "🍌" }],
    [{ name: "アイス", emoji: "🍦" }, { name: "ドーナツ", emoji: "🍩" }]
  ];

  const leftChoice = document.getElementById("leftChoice");
  const rightChoice = document.getElementById("rightChoice");
  const leftEmoji = document.getElementById("leftEmoji");
  const rightEmoji = document.getElementById("rightEmoji");
  const leftLabel = document.getElementById("leftLabel");
  const rightLabel = document.getElementById("rightLabel");
  const statusText = document.getElementById("statusText");
  const speakBtn = document.getElementById("speakBtn");
  const reaction = document.getElementById("reaction");

  let pairIndex = 0;
  let currentPair = pairs[pairIndex];
  let busy = false;

  function speakQuestion() {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const text = `ユーセーくんは、${currentPair[0].name}と${currentPair[1].name}、どっちがすき？`;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ja-JP";
    utter.rate = 0.98;
    utter.pitch = 1.12;
    speechSynthesis.speak(utter);
  }

  function renderPair() {
    leftEmoji.textContent = currentPair[0].emoji;
    rightEmoji.textContent = currentPair[1].emoji;
    leftLabel.textContent = currentPair[0].name;
    rightLabel.textContent = currentPair[1].name;
    statusText.textContent = `${currentPair[0].name} / ${currentPair[1].name}`;
  }

  function nextPair() {
    pairIndex = (pairIndex + 1) % pairs.length;
    currentPair = pairs[pairIndex];
    renderPair();
  }

  function choose(button, itemName) {
    if (busy) return;
    busy = true;
    button.classList.add("selected");
    reaction.textContent = `${itemName}、いいねぇ！`;
    reaction.classList.add("show");

    setTimeout(() => button.classList.remove("selected"), 180);
    setTimeout(() => reaction.classList.remove("show"), 850);
    setTimeout(() => {
      busy = false;
      nextPair();
      speakQuestion();
    }, 1050);
  }

  leftChoice.addEventListener("click", () => choose(leftChoice, currentPair[0].name));
  rightChoice.addEventListener("click", () => choose(rightChoice, currentPair[1].name));
  speakBtn.addEventListener("click", speakQuestion);

  renderPair();
})();
