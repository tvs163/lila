type HeardListener = () => void;

let bed: HTMLAudioElement | null = null;
let heard = false;
const listeners = new Set<HeardListener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function omHeard() {
  return heard;
}

export function subscribeOm(listener: HeardListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function mark(playing: boolean) {
  if (heard === playing) return;
  heard = playing;
  emit();
}

function ensure() {
  if (bed) return bed;
  const audio = new Audio("/sounds/universe.mp3");
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0.46;
  audio.addEventListener("playing", () => mark(true));
  audio.addEventListener("pause", () => mark(false));
  bed = audio;
  return audio;
}

export function primeOm() {
  const audio = ensure();
  void audio.play().then(
    () => mark(true),
    () => mark(false),
  );
}

export function setOmActive(on: boolean) {
  if (!bed) return;
  if (!on) {
    bed.pause();
    mark(false);
    return;
  }
  if (bed.paused) {
    void bed.play().then(
      () => mark(true),
      () => mark(false),
    );
  }
}
