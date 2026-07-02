// ── Singing Bowl Sound Generator ──────────────────────────────
// Uses Web Audio API to synthesize a singing bowl tone
// Fundamental ~432Hz + harmonics, long decay = yoga bowl feel

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioCtx
}

export function playSingingBowl(volume = 0.5) {
  if (typeof window === 'undefined') return
  try {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()

    const now = ctx.currentTime
    const duration = 3.5

    // Layer 3 harmonics for richness
    const harmonics = [
      { freq: 432, gain: 0.5 },   // fundamental
      { freq: 864, gain: 0.25 },  // 2nd harmonic
      { freq: 1296, gain: 0.12 }, // 3rd harmonic
    ]

    harmonics.forEach(({ freq, gain }) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      // Slight pitch drift up then settle (real bowl behavior)
      osc.frequency.linearRampToValueAtTime(freq * 1.002, now + 0.05)
      osc.frequency.linearRampToValueAtTime(freq, now + 0.3)

      gainNode.gain.setValueAtTime(0, now)
      // Fast attack (strike)
      gainNode.gain.linearRampToValueAtTime(gain * volume, now + 0.015)
      // Long exponential decay
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration)

      osc.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + duration)
    })

    // Add subtle noise burst on strike (mallet hit character)
    const bufferSize = ctx.sampleRate * 0.05
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1)

    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuffer

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.08 * volume, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 432
    noiseFilter.Q.value = 0.5

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    noise.start(now)

  } catch {
    // Silent fallback — audio blocked or not supported
  }
}

// Gentle single ting for UI feedback (shorter)
export function playTing(volume = 0.3) {
  if (typeof window === 'undefined') return
  try {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(864, now)
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.008)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2)
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 1.2)
  } catch { /* silent */ }
}
