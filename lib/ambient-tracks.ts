// ── Ambient Class Tracks ─────────────────────────────────────
// Generates unique ambient soundscapes per class type using Web Audio API.
// Each track loops seamlessly and fades in/out gently.
// No audio files needed — everything is synthesized on the fly.

let audioCtx: AudioContext | null = null
let activeNodes: AudioNode[] = []
let masterGain: GainNode | null = null
let isPlaying = false

function getCtx(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioCtx
}

// ── Utility: create a looping LFO ──────────────────────────
function createLFO(ctx: AudioContext, freq: number, min: number, max: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.value = (max - min) / 2
  osc.connect(gain)
  osc.start()
  activeNodes.push(osc)
  return { node: gain, offset: (max + min) / 2 }
}

// ── TRACK: Power Yoga 🔥 ──────────────────────────────────
// Deep powerful drone, rhythmic pulse, warm & grounding
function playPowerYoga(ctx: AudioContext, dest: AudioNode) {
  // Deep drone
  const drone = ctx.createOscillator()
  drone.type = 'sawtooth'
  drone.frequency.value = 55 // Low A
  const droneGain = ctx.createGain()
  droneGain.gain.value = 0.06
  const droneFilter = ctx.createBiquadFilter()
  droneFilter.type = 'lowpass'
  droneFilter.frequency.value = 200
  droneFilter.Q.value = 2
  drone.connect(droneFilter)
  droneFilter.connect(droneGain)
  droneGain.connect(dest)
  drone.start()

  // Warm pad
  const pad = ctx.createOscillator()
  pad.type = 'sine'
  pad.frequency.value = 110
  const pad2 = ctx.createOscillator()
  pad2.type = 'sine'
  pad2.frequency.value = 165 // Perfect 5th
  const padGain = ctx.createGain()
  padGain.gain.value = 0.04
  pad.connect(padGain)
  pad2.connect(padGain)
  padGain.connect(dest)
  pad.start()
  pad2.start()

  // Slow breath-like pulse via LFO
  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.15 // ~4 second cycle (breath rhythm)
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.025
  lfo.connect(lfoGain)
  lfoGain.connect(padGain.gain)
  lfo.start()

  // Sub bass hum
  const sub = ctx.createOscillator()
  sub.type = 'sine'
  sub.frequency.value = 55
  const subGain = ctx.createGain()
  subGain.gain.value = 0.05
  sub.connect(subGain)
  subGain.connect(dest)
  sub.start()

  activeNodes.push(drone, pad, pad2, lfo, sub)
}

// ── TRACK: Mat Pilates 💪 ─────────────────────────────────
// Clean focused tones, precise feel, mid-range clarity
function playMatPilates(ctx: AudioContext, dest: AudioNode) {
  // Clean mid-tone
  const tone1 = ctx.createOscillator()
  tone1.type = 'sine'
  tone1.frequency.value = 220 // A3
  const tone2 = ctx.createOscillator()
  tone2.type = 'sine'
  tone2.frequency.value = 330 // E4
  const tone3 = ctx.createOscillator()
  tone3.type = 'sine'
  tone3.frequency.value = 440 // A4 (octave)
  const toneGain = ctx.createGain()
  toneGain.gain.value = 0.03

  tone1.connect(toneGain)
  tone2.connect(toneGain)
  tone3.connect(toneGain)
  toneGain.connect(dest)
  tone1.start()
  tone2.start()
  tone3.start()

  // Slow shimmer
  const shimmer = ctx.createOscillator()
  shimmer.type = 'sine'
  shimmer.frequency.value = 0.08
  const shimmerGain = ctx.createGain()
  shimmerGain.gain.value = 0.015
  shimmer.connect(shimmerGain)
  shimmerGain.connect(toneGain.gain)
  shimmer.start()

  // Gentle high sparkle
  const sparkle = ctx.createOscillator()
  sparkle.type = 'sine'
  sparkle.frequency.value = 880
  const sparkleGain = ctx.createGain()
  sparkleGain.gain.value = 0.008
  const sparkleFilter = ctx.createBiquadFilter()
  sparkleFilter.type = 'bandpass'
  sparkleFilter.frequency.value = 900
  sparkleFilter.Q.value = 5
  sparkle.connect(sparkleFilter)
  sparkleFilter.connect(sparkleGain)
  sparkleGain.connect(dest)
  sparkle.start()

  activeNodes.push(tone1, tone2, tone3, shimmer, sparkle)
}

// ── TRACK: Gentle Yoga & Recovery 🧘 ──────────────────────
// Ethereal high pads, singing bowls, very calm & spacious
function playGentleYoga(ctx: AudioContext, dest: AudioNode) {
  // High ethereal pad
  const pad1 = ctx.createOscillator()
  pad1.type = 'sine'
  pad1.frequency.value = 396 // Solfeggio: liberation
  const pad2 = ctx.createOscillator()
  pad2.type = 'sine'
  pad2.frequency.value = 528 // Solfeggio: healing
  const pad3 = ctx.createOscillator()
  pad3.type = 'sine'
  pad3.frequency.value = 639 // Solfeggio: connection
  const padGain = ctx.createGain()
  padGain.gain.value = 0.025

  pad1.connect(padGain)
  pad2.connect(padGain)
  pad3.connect(padGain)
  padGain.connect(dest)
  pad1.start()
  pad2.start()
  pad3.start()

  // Very slow wave modulation — ocean of calm
  const wave = ctx.createOscillator()
  wave.type = 'sine'
  wave.frequency.value = 0.05 // 20-second cycle
  const waveGain = ctx.createGain()
  waveGain.gain.value = 0.012
  wave.connect(waveGain)
  waveGain.connect(padGain.gain)
  wave.start()

  // Subtle high overtone
  const overtone = ctx.createOscillator()
  overtone.type = 'sine'
  overtone.frequency.value = 1056
  const otGain = ctx.createGain()
  otGain.gain.value = 0.006
  overtone.connect(otGain)
  otGain.connect(dest)
  overtone.start()

  // Soft pitch drift for dreaminess
  const driftLfo = ctx.createOscillator()
  driftLfo.type = 'sine'
  driftLfo.frequency.value = 0.03
  const driftGain = ctx.createGain()
  driftGain.gain.value = 3
  driftLfo.connect(driftGain)
  driftGain.connect(pad2.frequency)
  driftLfo.start()

  activeNodes.push(pad1, pad2, pad3, wave, overtone, driftLfo)
}

// ── TRACK: Belly Rhythmic Dancing 💃 ──────────────────────
// Middle-eastern intervals, gentle rhythmic feel, warm
function playBellyDancing(ctx: AudioContext, dest: AudioNode) {
  // Oud-like drone on D (middle-eastern root)
  const drone = ctx.createOscillator()
  drone.type = 'sawtooth'
  drone.frequency.value = 147 // D3
  const droneFilter = ctx.createBiquadFilter()
  droneFilter.type = 'lowpass'
  droneFilter.frequency.value = 400
  droneFilter.Q.value = 3
  const droneGain = ctx.createGain()
  droneGain.gain.value = 0.04
  drone.connect(droneFilter)
  droneFilter.connect(droneGain)
  droneGain.connect(dest)
  drone.start()

  // Hijaz interval color (Eb above D = flat 2nd)
  const color1 = ctx.createOscillator()
  color1.type = 'sine'
  color1.frequency.value = 156 // Eb3
  const color2 = ctx.createOscillator()
  color2.type = 'sine'
  color2.frequency.value = 220 // A3 (5th)
  const colorGain = ctx.createGain()
  colorGain.gain.value = 0.02
  color1.connect(colorGain)
  color2.connect(colorGain)
  colorGain.connect(dest)
  color1.start()
  color2.start()

  // Rhythmic pulse — gentle tabla-like feel
  const pulseOsc = ctx.createOscillator()
  pulseOsc.type = 'sine'
  pulseOsc.frequency.value = 0.9 // slightly faster than breath
  const pulseGain = ctx.createGain()
  pulseGain.gain.value = 0.02
  pulseOsc.connect(pulseGain)
  pulseGain.connect(droneGain.gain)
  pulseOsc.start()

  // Slow filter sweep for warmth
  const sweepLfo = ctx.createOscillator()
  sweepLfo.type = 'sine'
  sweepLfo.frequency.value = 0.07
  const sweepGain = ctx.createGain()
  sweepGain.gain.value = 150
  sweepLfo.connect(sweepGain)
  sweepGain.connect(droneFilter.frequency)
  sweepLfo.start()

  activeNodes.push(drone, color1, color2, pulseOsc, sweepLfo)
}

// ── TRACK: Aqua Aerobics 🌊 ──────────────────────────────
// Water-like flowing tones, bubbly modulation, refreshing
function playAquaAerobics(ctx: AudioContext, dest: AudioNode) {
  // Flowing water pad
  const flow1 = ctx.createOscillator()
  flow1.type = 'sine'
  flow1.frequency.value = 261 // C4
  const flow2 = ctx.createOscillator()
  flow2.type = 'sine'
  flow2.frequency.value = 392 // G4
  const flow3 = ctx.createOscillator()
  flow3.type = 'triangle'
  flow3.frequency.value = 523 // C5
  const flowGain = ctx.createGain()
  flowGain.gain.value = 0.025
  flow1.connect(flowGain)
  flow2.connect(flowGain)
  flow3.connect(flowGain)
  flowGain.connect(dest)
  flow1.start()
  flow2.start()
  flow3.start()

  // Bubbly modulation on pitch
  const bubble1 = ctx.createOscillator()
  bubble1.type = 'sine'
  bubble1.frequency.value = 0.4
  const bubbleGain1 = ctx.createGain()
  bubbleGain1.gain.value = 8
  bubble1.connect(bubbleGain1)
  bubbleGain1.connect(flow1.frequency)
  bubble1.start()

  const bubble2 = ctx.createOscillator()
  bubble2.type = 'sine'
  bubble2.frequency.value = 0.25
  const bubbleGain2 = ctx.createGain()
  bubbleGain2.gain.value = 6
  bubble2.connect(bubbleGain2)
  bubbleGain2.connect(flow3.frequency)
  bubble2.start()

  // Wave-like volume swell
  const wave = ctx.createOscillator()
  wave.type = 'sine'
  wave.frequency.value = 0.1 // 10-second wave
  const waveGain = ctx.createGain()
  waveGain.gain.value = 0.012
  wave.connect(waveGain)
  waveGain.connect(flowGain.gain)
  wave.start()

  // Gentle noise — water texture
  const bufferSize = ctx.sampleRate * 2
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const noiseData = noiseBuffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) noiseData[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuffer
  noise.loop = true
  const noiseGain = ctx.createGain()
  noiseGain.gain.value = 0.008
  const noiseFilter = ctx.createBiquadFilter()
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.value = 1200
  noiseFilter.Q.value = 0.3
  noise.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(dest)
  noise.start()

  activeNodes.push(flow1, flow2, flow3, bubble1, bubble2, wave, noise)
}

// ── Public API ────────────────────────────────────────────────

const TRACK_MAP: Record<string, (ctx: AudioContext, dest: AudioNode) => void> = {
  'Power Yoga':             playPowerYoga,
  'Mat Pilates':            playMatPilates,
  'Gentle Yoga & Recovery': playGentleYoga,
  'Belly Rhythmic Dancing': playBellyDancing,
  'Aqua Aerobics':          playAquaAerobics,
}

/** Start the ambient track for a given class type. Fades in over 2 seconds. */
export function startAmbientTrack(className: string, volume = 0.5) {
  if (typeof window === 'undefined') return
  if (isPlaying) stopAmbientTrack()

  try {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()

    // Master gain for fade-in / fade-out
    masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0, ctx.currentTime)
    masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2)
    masterGain.connect(ctx.destination)

    // Pick the right track — fallback to Gentle Yoga
    const playFn = TRACK_MAP[className] || playGentleYoga
    playFn(ctx, masterGain)

    isPlaying = true
  } catch {
    // Audio not supported or blocked
  }
}

/** Stop the ambient track with a gentle 1.5s fade-out. */
export function stopAmbientTrack() {
  if (!isPlaying || !audioCtx || !masterGain) return

  try {
    const ctx = audioCtx
    const now = ctx.currentTime

    // Fade out
    masterGain.gain.cancelScheduledValues(now)
    masterGain.gain.setValueAtTime(masterGain.gain.value, now)
    masterGain.gain.linearRampToValueAtTime(0, now + 1.5)

    // Stop all nodes after fade
    setTimeout(() => {
      activeNodes.forEach(n => {
        try { (n as OscillatorNode).stop?.() } catch {}
        try { (n as AudioBufferSourceNode).stop?.() } catch {}
      })
      activeNodes = []
      masterGain = null
      isPlaying = false
    }, 1600)
  } catch {
    activeNodes = []
    masterGain = null
    isPlaying = false
  }
}

/** Check if ambient is currently playing */
export function isAmbientPlaying() {
  return isPlaying
}
