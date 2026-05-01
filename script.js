
function choose(item){
  const dino = document.getElementById("dino");
  const effect = document.getElementById("effect");

  // jump
  dino.style.transform="translateY(-30px)";
  setTimeout(()=>{dino.style.transform="translateY(0)"},300);

  // effect
  effect.innerText="いいねぇ！";
  effect.style.display="block";

  setTimeout(()=>{
    effect.style.display="none";
  },800);
}
