export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  
  // Track state
  private currentMode: 'MENU' | 'RACE' | 'NONE' = 'NONE';
  private activeNodes: AudioNode[] = [];
  private activeIntervals: number[] = [];

  // Engine specific
  private engineOsc: OscillatorNode | null = null;
  private engineMod: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  private static instance: AudioManager;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  init() {
    if (this.ctx) {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return;
    }
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3; // Master volume
    this.masterGain.connect(this.ctx.destination);
  }

  private stopAll() {
    // Stop all oscillators and nodes
    this.activeNodes.forEach(n => {
        try { 
            n.disconnect(); 
            (n as any).stop?.(); 
        } catch(e) {}
    });
    this.activeNodes = [];

    // Clear all sequencers
    this.activeIntervals.forEach(i => clearInterval(i));
    this.activeIntervals = [];

    // Stop Engine specifically
    this.stopEngine();
    
    this.currentMode = 'NONE';
  }

  setMute(mute: boolean) {
      this.isMuted = mute;
      if (this.masterGain && this.ctx) {
          this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.3, this.ctx.currentTime, 0.1);
      }
  }

  // --- THEMES ---

  playMenuTheme() {
    if (this.currentMode === 'MENU') return;
    this.init();
    this.stopAll();
    this.currentMode = 'MENU';

    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // 1. Dark Drone (Sawtooths)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const droneGain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.value = 45; // F1 (Deep)
    osc2.type = 'sawtooth';
    osc2.frequency.value = 45.2; // Detuned slightly

    filter.type = 'lowpass';
    filter.frequency.value = 150;
    
    // Slow LFO for filter sweep
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05; // Very slow
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 50; 

    droneGain.gain.value = 0.6;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    lfo.start(t);

    this.activeNodes.push(osc1, osc2, filter, droneGain, lfo, lfoGain);

    // 2. High Ethereal Beeps (Random)
    const beepInterval = window.setInterval(() => {
        if (Math.random() > 0.3) return;
        this.playMenuBlip();
    }, 2000);
    this.activeIntervals.push(beepInterval);
  }

  private playMenuBlip() {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t); // High A
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.1);
      
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.5);
  }

  playRaceTheme() {
    if (this.currentMode === 'RACE') return;
    this.init();
    this.stopAll();
    this.currentMode = 'RACE';

    // Start the engine sound automatically when race starts
    this.startEngine();

    if (!this.ctx || !this.masterGain) return;

    // Sequencer
    const bpm = 125;
    const sixteenthNoteTime = (60 / bpm) / 4;
    let step = 0;

    // Bass Sequence (F# Minor driving)
    // 0 = Rest
    const bassNotes = [
        55, 55, 0, 55,  // F1
        58, 0, 55, 0,   // G#1, F1
        65, 0, 62, 0,   // D2, C#2
        55, 55, 67, 55  // F1, F1, D#2, F1
    ]; 

    // Lead Melody (Cyberpunk-ish)
    // High octaves
    const leadNotes = [
        0, 0, 0, 0,
        0, 0, 0, 0,
        440, 0, 0, 0,   // A4
        554, 0, 0, 0,   // C#5
        0, 0, 0, 0,
        0, 0, 0, 0,
        523, 0, 0, 0,   // C5
        493, 0, 0, 0    // B4
    ];

    const sequencer = window.setInterval(() => {
        if (!this.ctx) return;
        const t = this.ctx.currentTime + 0.05; // Lookahead slightly

        // KICK (Four on the floor)
        if (step % 4 === 0) {
            this.playKick(t);
        }

        // SNARE (Backbeat)
        if (step % 8 === 4) {
             this.playSnare(t);
        }

        // HIHAT (Driving 16ths)
        // Accent on off-beats
        this.playHiHat(t, step % 4 === 2);

        // BASS
        const bassNote = bassNotes[step % 16];
        if (bassNote > 0) {
            this.playBass(t, bassNote);
        }

        // LEAD (Slower loop, every 32 steps)
        const leadNote = leadNotes[step % 32];
        if (leadNote > 0 && Math.random() > 0.2) { // minimal variations
            this.playLead(t, leadNote);
        }

        step = (step + 1) % 32;
    }, sixteenthNoteTime * 1000);

    this.activeIntervals.push(sequencer);
  }

  // --- ENGINE SOUND ---

  startEngine() {
      if (!this.ctx || !this.masterGain || this.engineOsc) return;

      const t = this.ctx.currentTime;
      
      this.engineOsc = this.ctx.createOscillator();
      this.engineMod = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineFilter = this.ctx.createBiquadFilter();

      // Main Engine Tone
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 60; // Idle rumble

      // Modulator (Roughness)
      this.engineMod.type = 'sine';
      this.engineMod.frequency.value = 20; 
      const modGain = this.ctx.createGain();
      modGain.gain.value = 10;
      
      // Filter
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 200;

      // Connections
      this.engineMod.connect(modGain);
      modGain.connect(this.engineOsc.frequency);
      
      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineGain.gain.value = 0.15; // Subtle background

      this.engineOsc.start(t);
      this.engineMod.start(t);
  }

  updateEngine(speedRatio: number) {
      if (!this.ctx || !this.engineOsc || !this.engineFilter) return;
      
      const t = this.ctx.currentTime;
      
      // Pitch goes from 60Hz to ~180Hz
      const targetFreq = 60 + (speedRatio * 120);
      this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.1);
      
      // Filter opens up as you go faster (brighter sound)
      const targetFilter = 200 + (speedRatio * 600);
      this.engineFilter.frequency.setTargetAtTime(targetFilter, t, 0.1);

      // Modulator speeds up
      if (this.engineMod) {
          this.engineMod.frequency.setTargetAtTime(20 + (speedRatio * 30), t, 0.1);
      }
  }

  stopEngine() {
      if (this.engineOsc) {
          try { this.engineOsc.stop(); this.engineOsc.disconnect(); } catch {}
          this.engineOsc = null;
      }
      if (this.engineMod) {
          try { this.engineMod.stop(); this.engineMod.disconnect(); } catch {}
          this.engineMod = null;
      }
      this.engineGain = null;
      this.engineFilter = null;
  }

  // --- SFX ---

  playPass() {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      // Doppler-like swoosh
      const t = this.ctx.currentTime;
      const noise = this.createNoiseBuffer();
      const src = this.ctx.createBufferSource();
      src.buffer = noise;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 1;
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.3); // High to low pitch

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
      gain.gain.linearRampToValueAtTime(0, t + 0.3);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      src.start(t);
      src.stop(t + 0.4);
  }

  // --- INSTRUMENTS ---

  private playKick(t: number) {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
      
      gain.gain.setValueAtTime(0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.5);
  }

  private playSnare(t: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const noise = this.createNoiseBuffer();
    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = noise;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    
    noiseSrc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noiseSrc.start(t);
    noiseSrc.stop(t + 0.2);
  }

  private playHiHat(t: number, accent: boolean) {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      const noise = this.createNoiseBuffer();
      const noiseSrc = this.ctx.createBufferSource();
      noiseSrc.buffer = noise;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 5000;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(accent ? 0.15 : 0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

      noiseSrc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noiseSrc.start(t);
      noiseSrc.stop(t + 0.1);
  }

  private playBass(t: number, freq: number) {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(0, t);
      filter.frequency.linearRampToValueAtTime(600, t + 0.02); // Attack
      filter.frequency.exponentialRampToValueAtTime(100, t + 0.2); // Decay

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
  }

  private playLead(t: number, freq: number) {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      // Soft envelope
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.3);
  }

  playCrash() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const noise = this.createNoiseBuffer();
    const src = this.ctx.createBufferSource();
    src.buffer = noise;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 1.0);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    src.start(t);
    src.stop(t + 2);
  }

  // --- UI SOUNDS ---

  playUiHover() {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      this.init(); // Ensure context is ready
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, t);
      
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.1);
  }

  playUiClick() {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
      
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
  }

  // Helper
  private createNoiseBuffer(): AudioBuffer {
      const bufferSize = this.ctx!.sampleRate * 2; 
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }
      return buffer;
  }
}