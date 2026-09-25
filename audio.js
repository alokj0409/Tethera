(() => {
  "use strict";

  const PENTATONIC_FREQUENCIES = Object.freeze([
    261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33,
  ]);

  let context = null;
  let masterGain = null;

  function getContext() {
    if (context) {
      return context;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    context = new AudioContextClass();
    masterGain = context.createGain();
    masterGain.gain.value = 0.58;
    masterGain.connect(context.destination);
    return context;
  }

  function unlock() {
    const audioContext = getContext();
    if (audioContext?.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
  }

  function schedule(callback) {
    const audioContext = getContext();
    if (!audioContext || !masterGain) {
      return;
    }

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
    callback(audioContext, masterGain, audioContext.currentTime + 0.004);
  }

  function createNoiseBuffer(audioContext, duration, decay = 5) {
    const sampleCount = Math.ceil(audioContext.sampleRate * duration);
    const buffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < sampleCount; index += 1) {
      const life = index / sampleCount;
      data[index] = (Math.random() * 2 - 1) * Math.exp(-life * decay);
    }
    return buffer;
  }

  function playSnap() {
    schedule((audioContext, output, startTime) => {
      const noise = audioContext.createBufferSource();
      noise.buffer = createNoiseBuffer(audioContext, 0.045, 7);

      const filter = audioContext.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(1200, startTime);

      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0.16, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.045);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(output);
      noise.start(startTime);
      noise.stop(startTime + 0.05);
    });
  }

  function playChime(noteIndex = 0) {
    schedule((audioContext, output, startTime) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const normalizedIndex =
        ((Math.trunc(noteIndex) % PENTATONIC_FREQUENCIES.length) +
          PENTATONIC_FREQUENCIES.length) %
        PENTATONIC_FREQUENCIES.length;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        PENTATONIC_FREQUENCIES[normalizedIndex],
        startTime,
      );
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

      oscillator.connect(gain);
      gain.connect(output);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.36);
    });
  }

  function playShatter() {
    schedule((audioContext, output, startTime) => {
      const noise = audioContext.createBufferSource();
      noise.buffer = createNoiseBuffer(audioContext, 0.13, 4.5);

      const filter = audioContext.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(2400, startTime);
      filter.Q.setValueAtTime(1.8, startTime);

      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.13);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(output);
      noise.start(startTime);
      noise.stop(startTime + 0.14);
    });
  }

  function playFail() {
    schedule((audioContext, output, startTime) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(164.81, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(73.42, startTime + 0.48);
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.5);

      oscillator.connect(gain);
      gain.connect(output);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.52);
    });
  }

  window.TetheraAudio = Object.freeze({
    unlock,
    playSnap,
    playChime,
    playShatter,
    playFail,
  });
})();
