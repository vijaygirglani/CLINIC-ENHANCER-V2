/**
 * The call chime — two soft notes, generated in the browser.
 *
 * No audio file to ship, so it still works with no internet and adds nothing
 * to the download. Shared by the desk and the waiting-room display.
 */

export function playChime(volume = 0.22): void {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [880, 1174.7]; // A5 → D6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.16;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.55);
    });
    setTimeout(() => { try { ctx.close(); } catch { /* already closed */ } }, 1200);
  } catch {
    /* audio blocked by the browser — the queue still works, just silently */
  }
}
