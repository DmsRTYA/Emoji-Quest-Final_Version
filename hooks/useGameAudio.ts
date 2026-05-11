'use client';
import { useCallback, useRef, useState, useEffect } from 'react';

// Variabel global agar audio BGM tidak bertumpuk/terduplikasi setiap kali komponen re-render
let globalBGM: HTMLAudioElement | null = null;
let globalMuted: boolean = false;

export function useGameAudio() {
  const ctxRef = useRef<AudioContext|null>(null);
  const [isMuted, setIsMuted] = useState(globalMuted);

  useEffect(() => {
    const handleMuteChange = () => setIsMuted(globalMuted);
    window.addEventListener('bgm_mute_toggle', handleMuteChange);
    return () => window.removeEventListener('bgm_mute_toggle', handleMuteChange);
  }, []);

  const toggleMute = useCallback(() => {
    globalMuted = !globalMuted;
    if (globalBGM) {
      globalBGM.muted = globalMuted;
    }
    window.dispatchEvent(new Event('bgm_mute_toggle'));
  }, []);

  const ctx = () => {
    if (!ctxRef.current || ctxRef.current.state === 'closed')
      ctxRef.current = new (window.AudioContext||(window as any).webkitAudioContext)();
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  };

  const tone = useCallback((freq:number,dur:number,type:OscillatorType='sine',vol=0.25,t=0,ac?: AudioContext)=>{
    if (globalMuted) return; // Jangan putar SFX jika di-mute
    const c = ac || ctx();
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime+t);
    g.gain.setValueAtTime(vol, c.currentTime+t);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime+t+dur);
    o.start(c.currentTime+t); o.stop(c.currentTime+t+dur);
  },[]);

  const playBGM = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (!globalBGM) {
        globalBGM = new Audio('/audio/bgm.mp3');
        globalBGM.loop = true;  // Memastikan musik berulang kali berputar
        globalBGM.volume = 0.15; // Set volume 15%
        globalBGM.muted = globalMuted;
      }
      // Hanya mainkan jika saat ini sedang pause (mencegah tabrakan pemanggilan)
      if (globalBGM.paused) {
        globalBGM.play().catch(e => console.log('Auto-play prevented or BGM not found', e));
      }
    }
  }, []);

  const stopBGM = useCallback(() => {
    if (globalBGM) {
      globalBGM.pause();
      globalBGM.currentTime = 0;
    }
  }, []);

  const playCorrect    = useCallback(()=>{ const c=ctx(); [523,659,784,1047].forEach((f,i)=>tone(f,0.18,'sine',0.25,i*0.1,c)); tone(2093,0.3,'sine',0.1,0.3,c); },[tone]);
  const playWrong      = useCallback(()=>{ const c=ctx(); tone(300,0.08,'sawtooth',0.2,0,c); tone(220,0.1,'sawtooth',0.2,0.09,c); tone(160,0.2,'square',0.15,0.18,c); },[tone]);
  const playTimerDanger= useCallback(()=>{ const c=ctx(); tone(1200,0.07,'square',0.12,0,c); tone(900,0.07,'square',0.1,0.1,c); },[tone]);
  const playWin        = useCallback(()=>{ const c=ctx(); [[523,0.1],[523,0.1],[523,0.1],[659,0.3],[523,0.1],[659,0.15],[784,0.5]].reduce((t,[f,d])=>{ tone(f as number,d as number,'sine',0.3,t,c); return t+(d as number)+0.02; },0); [130,164,196,261].forEach((f,i)=>tone(f,0.15,'triangle',0.15,i*0.15,c)); },[tone]);
  const playLose       = useCallback(()=>{ const c=ctx(); [440,392,349,294].forEach((f,i)=>tone(f,0.25,'sine',0.2,i*0.2,c)); },[tone]);
  const playStreak     = useCallback((n:number)=>{ const c=ctx(),b=400+n*60; tone(b,0.1,'sine',0.3,0,c); tone(b*1.25,0.1,'sine',0.3,0.08,c); tone(b*1.5,0.15,'sine',0.3,0.16,c); },[tone]);
  const playCountdown  = useCallback((n:number)=>{ const c=ctx(); if(n===0){tone(880,0.08,'sine',0.3,0,c);tone(1100,0.15,'sine',0.3,0.09,c);}else tone(660,0.12,'sine',0.25,0,c); },[tone]);
  const playHint       = useCallback(()=>{ const c=ctx(); tone(880,0.08,'sine',0.15,0,c); tone(1100,0.1,'sine',0.12,0.1,c); },[tone]);
  const playMatchFound = useCallback(()=>{ const c=ctx(); [440,550,660,880].forEach((f,i)=>tone(f,0.15,'triangle',0.25,i*0.12,c)); },[tone]);
  const playClick      = useCallback(()=>tone(600,0.05,'sine',0.1),[tone]);

  return { isMuted, toggleMute, playCorrect, playWrong, playTimerDanger, playWin, playLose, playStreak, playCountdown, playHint, playMatchFound, playClick, playBGM, stopBGM };
}
