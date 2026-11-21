// All sound, synthesised with WebAudio: no audio files, no network. The context is
// created on the first user gesture (browsers block audio before one) and every sound is
// a short envelope over one or two oscillators.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context === null) {
      try {
        const AC = window.AudioContext ?? window.webkitAudioContext;
        context = AC ? new AC() : null;
      } catch {
        context = null;
      }
    }
    if (context && context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  /** Call from any user gesture so later sounds are allowed to play. */
  function unlock() {
    ensure();
  }

  function tone(freq, at, dur, type, vol) {
    const ctx = ensure();
    if (ctx === null || muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + at);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + at);
    osc.stop(ctx.currentTime + at + dur + 0.05);
  }

  return {
    unlock,
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    /** Two-note chime on a found difference. */
    find() {
      tone(659.25, 0, 0.16, 'sine', 0.22);
      tone(880, 0.09, 0.28, 'sine', 0.22);
    },
    /** Low buzz on a wrong click. */
    wrong() {
      tone(140, 0, 0.18, 'sawtooth', 0.1);
      tone(110, 0.08, 0.2, 'sawtooth', 0.08);
    },
    /** Soft blip when a hint is spent. */
    hint() {
      tone(1046.5, 0, 0.12, 'sine', 0.14);
    },
    /** Rising arpeggio when a level is cleared. */
    win() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.3, 'triangle', 0.2));
    },
    /** Short tick in the last ten seconds. */
    tick() {
      tone(1200, 0, 0.05, 'square', 0.05);
    },
    /** Click on a button. */
    click() {
      tone(440, 0, 0.06, 'sine', 0.1);
    },
  };
}
