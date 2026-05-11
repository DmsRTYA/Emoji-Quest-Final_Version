'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Clock, Zap, CheckCircle, XCircle, Star, SkipForward, Volume2, VolumeX, TrendingUp } from 'lucide-react';
import type { User } from '@/app/page';
import { useGameAudio } from '@/hooks/useGameAudio';
import { BarLoader } from '@/components/LoadingStates';

interface Props { mode:'casual'|'rank'; user:User; onBack:()=>void; onGameEnd:(score:number)=>void; }

const CFG = {
  casual: { time:30, label:'CASUAL', mult:1, color:'#00F5FF', btnBg:'rgba(0,245,255,0.08)', btnBorder:'rgba(0,245,255,0.3)', btnColor:'#00F5FF' },
  rank:   { time:20, label:'RANKED', mult:2, color:'#FFD60A', btnBg:'linear-gradient(135deg,#FFD60A,#FF9F0A)', btnBorder:'none', btnColor:'#0A0A0F' },
};

interface Q { id:number; emojis:string[]; answer:string; hints:string[]; category:string; difficulty:string; points:number; }

export default function GameScreen({ mode, user, onBack, onGameEnd }: Props) {
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx,       setIdx]       = useState(0);
  const [answer,    setAnswer]    = useState('');
  const [timeLeft,  setTimeLeft]  = useState(CFG[mode].time);
  const [score,     setScore]     = useState(0);
  const [streak,    setStreak]    = useState(0);
  const [inputState,setInputState]= useState<'idle'|'correct'|'wrong'>('idle');
  const [phase,     setPhase]     = useState<'loading'|'countdown'|'playing'|'result'>('loading');
  const [countdown, setCountdown] = useState(3);
  const [results,   setResults]   = useState<Array<{correct:boolean;points:number;answer:string}>>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint,  setShowHint]  = useState(false);
  const [scorePopups,setScorePopups]=useState<Array<{id:number;value:number}>>([]);
  const [muted,     setMuted]     = useState(false);
  const [lpGained,  setLpGained]  = useState(0);
  const inputRef  = useRef<HTMLInputElement>(null);
  const timerRef  = useRef<NodeJS.Timeout|null>(null);
  const scoreRef  = useRef(0);
  const cfg = CFG[mode];
  const { isMuted, toggleMute, playCorrect, playWrong, playTimerDanger, playStreak, playCountdown, playHint, playBGM, stopBGM } = useGameAudio();

  useEffect(()=>{
    fetch(`/api/game/questions?mode=${mode}`).then(r=>r.json()).then(d=>{ setQuestions(d.questions||[]); setPhase('countdown'); });
  },[mode]);

  useEffect(() => {
    if (phase === 'countdown' || phase === 'playing') {
      playBGM();
    } else {
      stopBGM();
    }
  }, [phase, playBGM, stopBGM]);

  useEffect(() => {
    return () => stopBGM();
  }, [stopBGM]);

  // Countdown
  useEffect(()=>{
    if(phase!=='countdown') return;
    if(countdown<=0){ setPhase('playing'); return; }
    playCountdown(countdown);
    const t=setTimeout(()=>setCountdown(c=>c-1),1000);
    return()=>clearTimeout(t);
  },[phase,countdown,playCountdown]);

  // Timer
  useEffect(()=>{
    if(phase!=='playing') return;
    setTimeLeft(cfg.time);
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=6&&t>1) playTimerDanger();
        if(t<=1){ handleTimeout(); return 0; }
        return t-1;
      });
    },1000);
    return()=>{ if(timerRef.current) clearInterval(timerRef.current); };
  },[idx,phase,cfg.time,playTimerDanger]);

  useEffect(()=>{ if(phase==='playing') inputRef.current?.focus(); },[idx,phase]);

  const addPopup=(pts:number)=>{
    const id=Date.now();
    setScorePopups(p=>[...p,{id,value:pts}]);
    setTimeout(()=>setScorePopups(p=>p.filter(x=>x.id!==id)),1100);
  };

  const endGame=useCallback(async()=>{
    setPhase('result');
    const tk=localStorage.getItem('token'); if(!tk) return;
    const correct=results.filter(r=>r.correct).length;
    try{
      const res=await fetch('/api/game/save',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tk}`},body:JSON.stringify({mode,score:scoreRef.current,correct,total:questions.length})});
      const data=await res.json();
      if(data.lpGained) setLpGained(data.lpGained);
    }catch{}
  },[mode,results,questions.length]);

  const nextQ=useCallback(()=>{
    setInputState('idle'); setAnswer(''); setShowHint(false);
    setIdx(i=>{ if(i+1>=questions.length){ endGame(); return i; } return i+1; });
  },[questions.length, endGame]);

  const handleTimeout=useCallback(()=>{
    if(timerRef.current) clearInterval(timerRef.current);
    const q=questions[idx]; if(!q) return;
    playWrong();
    setInputState('wrong'); setStreak(0);
    // No answer = 0 points (no penalty for timeout)
    setResults(p=>[...p,{correct:false,points:0,answer:q.answer}]);
    setTimeout(nextQ,1400);
  },[idx,questions,nextQ,playWrong]);

  const submitAnswer=()=>{
    const q=questions[idx]; if(!q||inputState!=='idle') return;
    if(timerRef.current) clearInterval(timerRef.current);
    const correct=q.answer.toLowerCase().trim();
    const ua=answer.toLowerCase().trim();
    const isCorrect=correct===ua||correct.split(' ').some(w=>w.length>3&&ua.includes(w));
    if(isCorrect){
      // New score scaling system
      let basePoints = 500; // Slow correct answer
      if(timeLeft > cfg.time * 0.75) basePoints = 1000; // Very fast (>75% time left)
      else if(timeLeft > cfg.time * 0.5) basePoints = 750; // Medium speed (>50% time left)
      
      const pts = Math.round(basePoints * cfg.mult);
      setScore(s=>{ const ns=s+pts; scoreRef.current=ns; return ns; });
      setStreak(s=>s+1);
      playCorrect(); if(streak+1>=3) playStreak(streak+1);
      addPopup(pts);
      setInputState('correct');
      setResults(p=>[...p,{correct:true,points:pts,answer:q.answer}]);
      setTimeout(nextQ,950);
    } else {
      const pts = -250; // Wrong answer penalty
      setScore(s=>{ const ns=Math.max(0,s+pts); scoreRef.current=ns; return ns; });
      playWrong();
      setInputState('wrong'); setStreak(0);
      addPopup(pts);
      setResults(p=>[...p,{correct:false,points:pts,answer:q.answer}]);
      setTimeout(nextQ,1400);
    }
  };

  // LOADING
  if(phase==='loading') return (
    <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:28}}>
      <div style={{width:52,height:52,borderRadius:14,background:'linear-gradient(135deg,rgba(0,245,255,0.1),rgba(191,90,242,0.1))',border:`1px solid ${cfg.color}33`,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none"><polygon points="14,3 25,14 14,25 3,14" fill="none" stroke={cfg.color} strokeWidth="1.5"/><circle cx="14" cy="14" r="3" fill={cfg.color}/></svg>
      </div>
      <BarLoader color={cfg.color} label="Preparing questions" />
    </div>
  );

  // COUNTDOWN
  if(phase==='countdown') return (
    <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div key={countdown} className="anim-countdown" style={{textAlign:'center'}}>
        <div style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,lineHeight:0.9,background:`linear-gradient(135deg,${cfg.color},${mode==='rank'?'#FF9F0A':'#0099FF'})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',fontSize:countdown>0?'160px':'90px'}}>
          {countdown||'GO!'}
        </div>
      </div>
    </div>
  );

  // RESULT
  if(phase==='result'){
    const correct=results.filter(r=>r.correct).length;
    const acc=Math.round((correct/Math.max(questions.length,1))*100);
    return (
      <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <div style={{maxWidth:480,width:'100%'}}>
          <div className="anim-bounce-in" style={{background:'rgba(18,18,28,0.98)',borderRadius:28,border:'1px solid rgba(255,255,255,0.07)',boxShadow:'0 40px 80px rgba(0,0,0,0.7)',overflow:'hidden'}}>
            <div style={{height:3,background:acc>=60?'linear-gradient(90deg,#30D158,#00F5FF)':'linear-gradient(90deg,#FF2D78,#BF5AF2)'}}/>
            <div style={{padding:'32px 28px',textAlign:'center'}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 14px',borderRadius:8,background:'rgba(255,214,10,0.1)',border:'1px solid rgba(255,214,10,0.2)',marginBottom:20}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,letterSpacing:'0.18em',color:'#FFD60A'}}>{cfg.label} — COMPLETED</span>
              </div>
              <h2 style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:36,background:acc>=60?'linear-gradient(135deg,#FFD60A,#FF9F0A)':'linear-gradient(135deg,#BF5AF2,#FF2D78)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',margin:0}}>
                {acc>=80?'Excellent!':acc>=60?'Good Job!':'Keep Going!'}
              </h2>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:68,background:'linear-gradient(135deg,#00F5FF,#0099FF)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',lineHeight:1,marginTop:16}}>{score.toLocaleString()}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'#4A4A6A',letterSpacing:'0.25em',marginTop:4,marginBottom:20}}>FINAL SCORE</div>
              {mode==='rank'&&lpGained>0&&(
                <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 18px',borderRadius:12,background:'rgba(48,209,88,0.1)',border:'1px solid rgba(48,209,88,0.25)',marginBottom:20}}>
                  <TrendingUp size={16} color="#30D158"/>
                  <span style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:16,color:'#30D158'}}>+{lpGained} LP</span>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'#4A4A6A',letterSpacing:'0.1em'}}>RANK POINTS EARNED</span>
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:20}}>
                {[
                  {v:correct,l:'CORRECT',c:'#30D158',bg:'rgba(48,209,88,0.08)',b:'rgba(48,209,88,0.2)'},
                  {v:questions.length-correct,l:'WRONG',c:'#FF2D78',bg:'rgba(255,45,120,0.08)',b:'rgba(255,45,120,0.2)'},
                  {v:`${acc}%`,l:'ACCURACY',c:'#BF5AF2',bg:'rgba(191,90,242,0.08)',b:'rgba(191,90,242,0.2)'},
                ].map((s,i)=>(
                  <div key={i} style={{background:s.bg,border:`1px solid ${s.b}`,borderRadius:14,padding:'12px 8px'}}>
                    <div style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:22,color:s.c}}>{s.v}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,color:'#4A4A6A',letterSpacing:'0.12em',marginTop:2}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{maxHeight:160,overflowY:'auto',display:'flex',flexDirection:'column',gap:6,marginBottom:20,textAlign:'left'}}>
                {results.map((r,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderRadius:12,background:r.correct?'rgba(48,209,88,0.07)':'rgba(255,45,120,0.07)',border:`1px solid ${r.correct?'rgba(48,209,88,0.2)':'rgba(255,45,120,0.2)'}`}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      {r.correct?<CheckCircle size={15} color="#30D158"/>:<XCircle size={15} color="#FF2D78"/>}
                      <span style={{fontFamily:"'Clash Display',sans-serif",fontSize:14,color:'#F0F0FF'}}>{r.answer}</span>
                    </div>
                    {r.correct&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:'#30D158'}}>+{r.points}</span>}
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={onBack} style={{flex:1,height:48,borderRadius:14,background:'rgba(0,245,255,0.08)',border:'1px solid rgba(0,245,255,0.25)',cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:15,color:'#00F5FF',transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,245,255,0.14)';}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(0,245,255,0.08)';}}>Back</button>
                <button onClick={()=>{ setIdx(0);setScore(0);scoreRef.current=0;setStreak(0);setResults([]);setLpGained(0);setCountdown(3);setPhase('loading');setHintsUsed(0);setShowHint(false);
                  fetch(`/api/game/questions?mode=${mode}`).then(r=>r.json()).then(d=>{setQuestions(d.questions||[]);setPhase('countdown');});
                }} style={{flex:1,height:48,borderRadius:14,background:'linear-gradient(135deg,#FFD60A,#FF9F0A)',border:'none',cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:15,color:'#0A0A0F',boxShadow:'0 4px 16px rgba(255,214,10,0.25)',transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(255,214,10,0.4)';}} onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 16px rgba(255,214,10,0.25)';}}>Play Again</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PLAYING
  const q=questions[idx]; if(!q) return null;
  const prog=(idx/questions.length)*100;
  const timerPct=(timeLeft/cfg.time)*100;
  const isDanger=timeLeft<=5;

  return (
    <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',flexDirection:'column'}}>
      {/* Score popups */}
      {scorePopups.map(p=>(
        <div key={p.id} className="score-pop" style={{color:'#30D158',fontSize:24,left:'50%',top:'28%',transform:'translateX(-50%)'}}>+{p.value}</div>
      ))}
      {/* Top bar */}
      <div style={{padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',color:'#8888AA',fontFamily:"'JetBrains Mono',monospace",fontSize:12,letterSpacing:'0.1em',transition:'color 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.color='#F0F0FF';}} onMouseLeave={e=>{e.currentTarget.style.color='#8888AA';}}>
          <ArrowLeft size={18}/> EXIT
        </button>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:'0.18em',padding:'4px 12px',borderRadius:6,background:`${cfg.color}18`,border:`1px solid ${cfg.color}33`,color:cfg.color}}>{cfg.label}</span>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {streak>=2&&(
            <div className="anim-streak" style={{display:'flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:8,background:'rgba(255,45,120,0.12)',border:'1px solid rgba(255,45,120,0.25)'}}>
              <Zap size={13} color="#FF2D78"/>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'#FF2D78',fontWeight:700}}>{streak}x</span>
            </div>
          )}
          <span style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:18,color:'#F0F0FF'}}>{score.toLocaleString()}</span>
          <button onClick={toggleMute} style={{background:'none',border:'none',cursor:'pointer',color:'#4A4A6A',display:'flex',transition:'color 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.color='#8888AA';}} onMouseLeave={e=>{e.currentTarget.style.color='#4A4A6A';}}>
            {isMuted?<VolumeX size={16}/>:<Volume2 size={16}/>}
          </button>
        </div>
      </div>
      {/* Progress */}
      <div style={{padding:'0 20px 4px'}}>
        <div className="prog-bar"><div className="prog-fill" style={{width:`${prog}%`}}/></div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:4,fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:'#4A4A6A'}}>
          <span>{idx+1} / {questions.length}</span><span>{Math.round(prog)}%</span>
        </div>
      </div>
      {/* Main */}
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'16px 20px 32px'}}>
        <div style={{width:'100%',maxWidth:520}}>
          {/* Timer */}
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:24}}>
            <Clock size={15} color={isDanger?'#FF2D78':'#4A4A6A'}/>
            <div style={{flex:1,background:'rgba(255,255,255,0.07)',borderRadius:3,height:10,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:3,transition:'width 1s linear',background:timerPct>50?'linear-gradient(90deg,#00F5FF,#30D158)':timerPct>25?'linear-gradient(90deg,#FFD60A,#FF9F0A)':'linear-gradient(90deg,#FF2D78,#BF5AF2)',width:`${timerPct}%`}}/>
            </div>
            <span style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:22,color:isDanger?'#FF2D78':'#F0F0FF',minWidth:28,textAlign:'right',fontVariantNumeric:'tabular-nums',...(isDanger?{animation:'tpulse 0.6s ease-in-out infinite'}:{})}}>{timeLeft}</span>
          </div>
          {/* Question card */}
          <div style={{background:'rgba(22,22,34,0.95)',border:`1px solid ${inputState==='correct'?'rgba(48,209,88,0.4)':inputState==='wrong'?'rgba(255,45,120,0.4)':'rgba(255,255,255,0.07)'}`,borderRadius:28,padding:'28px 24px',transition:'all 0.25s',boxShadow:inputState==='correct'?'0 0 0 3px rgba(48,209,88,0.15)':inputState==='wrong'?'0 0 0 3px rgba(255,45,120,0.15)':undefined}}>
            {/* Meta badges */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:24}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,letterSpacing:'0.15em',textTransform:'uppercase',padding:'3px 9px',borderRadius:5,background:'rgba(255,255,255,0.05)',color:'#4A4A6A'}}>{q.category}</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,letterSpacing:'0.15em',textTransform:'uppercase',padding:'3px 9px',borderRadius:5,...(q.difficulty==='easy'?{background:'rgba(48,209,88,0.08)',color:'#30D158',border:'1px solid rgba(48,209,88,0.2)'}:q.difficulty==='medium'?{background:'rgba(255,214,10,0.08)',color:'#FFD60A',border:'1px solid rgba(255,214,10,0.2)'}:{background:'rgba(255,45,120,0.08)',color:'#FF2D78',border:'1px solid rgba(255,45,120,0.2)'})}}>{q.difficulty.toUpperCase()}</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,letterSpacing:'0.15em',textTransform:'uppercase',padding:'3px 9px',borderRadius:5,background:`${cfg.color}18`,color:cfg.color,border:`1px solid ${cfg.color}33`}}>+{q.points*cfg.mult}</span>
            </div>
            {/* Emojis */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'clamp(16px,4vw,36px)',marginBottom:28,padding:'8px 0'}}>
              {q.emojis.map((em,i)=>(
                <span key={i} className="emoji-game" style={{animationDelay:`${i*0.35}s`}}>{em}</span>
              ))}
            </div>
            {/* Input */}
            <input ref={inputRef} type="text" value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submitAnswer()} placeholder="Type your answer..." disabled={inputState!=='idle'}
              className={`ans-input ${inputState}`} />
            {/* Feedback */}
            <div style={{minHeight:28,display:'flex',alignItems:'center',justifyContent:'center',marginTop:12}}>
              {inputState==='correct'&&(
                <div className="anim-fade-in" style={{display:'flex',alignItems:'center',gap:8,color:'#30D158',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:17}}>
                  <CheckCircle size={18}/> Correct!{streak>=2&&<span style={{color:'#FF2D78',marginLeft:4}}>🔥 {streak}× streak!</span>}
                </div>
              )}
              {inputState==='wrong'&&(
                <div className="anim-fade-in" style={{display:'flex',alignItems:'center',gap:8,color:'#FF2D78',fontFamily:"'Clash Display',sans-serif",fontSize:14}}>
                  <XCircle size={16}/> Answer: <strong style={{color:'#F0F0FF'}}>{q.answer}</strong>
                </div>
              )}
            </div>
            {/* Hint */}
            {showHint&&inputState==='idle'&&(
              <div className="anim-slide-up" style={{marginTop:12,padding:'10px 16px',borderRadius:12,background:'rgba(191,90,242,0.08)',border:'1px solid rgba(191,90,242,0.2)',color:'#BF5AF2',fontSize:13.5,textAlign:'center'}}>
                💡 {q.hints[0]}
              </div>
            )}
          </div>
          {/* Action buttons */}
          {inputState==='idle'&&(
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button onClick={()=>{playHint();setHintsUsed(h=>h+1);setShowHint(true);}} disabled={hintsUsed>=2}
                style={{padding:'0 16px',height:48,borderRadius:14,border:hintsUsed>=2?'1px solid rgba(100,100,120,0.4)':'1px solid rgba(191,90,242,0.3)',background:'none',cursor:hintsUsed>=2?'not-allowed':'pointer',color:hintsUsed>=2?'#4A4A6A':'#BF5AF2',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:6,transition:'all 0.2s',opacity:hintsUsed>=2?0.5:1}} onMouseEnter={e=>{if(hintsUsed<2)e.currentTarget.style.background='rgba(191,90,242,0.08)';}} onMouseLeave={e=>{e.currentTarget.style.background='none';}}>
                <Star size={15}/> Hint ({2-hintsUsed} remaining)
              </button>
              <button onClick={submitAnswer}
                style={{flex:1,height:48,borderRadius:14,background:cfg.btnBg,border:cfg.btnBorder,cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:15,color:cfg.btnColor,transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.opacity='0.9';}} onMouseLeave={e=>{e.currentTarget.style.opacity='1';}}>
                Submit Answer
              </button>
              <button onClick={()=>{ if(timerRef.current)clearInterval(timerRef.current); const q2=questions[idx]; setInputState('wrong');setStreak(0); if(q2)setResults(p=>[...p,{correct:false,points:0,answer:q2.answer}]); setTimeout(nextQ,800); }}
                title="Skip" style={{width:48,height:48,borderRadius:14,border:'1px solid rgba(42,42,62,0.9)',background:'none',cursor:'pointer',color:'#4A4A6A',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.color='#8888AA';e.currentTarget.style.borderColor='rgba(100,100,120,0.6)';}} onMouseLeave={e=>{e.currentTarget.style.color='#4A4A6A';e.currentTarget.style.borderColor='rgba(42,42,62,0.9)';}}>
                <SkipForward size={16}/>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
