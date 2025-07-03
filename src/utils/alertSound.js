export function playAlertSound() {
  const audio = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12cfc9d240.mp3');
  audio.volume = 0.5;
  audio.play();
}
