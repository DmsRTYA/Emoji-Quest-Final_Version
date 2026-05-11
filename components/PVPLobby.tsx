'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Wifi, WifiOff, Crown, Shield, Zap, AlertTriangle, Key, Search, Clock, Trophy, Target, Lock, Globe, Plus, X, Eye, User as UserIcon, Trash2, CheckCircle, XCircle, Sparkles, Smile, HelpCircle, Lightbulb, Send, MessageCircle, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import type { User } from '@/app/page';
import dynamic from 'next/dynamic';
import data from '@emoji-mart/data';
const Picker = dynamic(() => import('@emoji-mart/react'), { ssr: false });
import Avatar from '@/components/Avatar';
import { PulseRing } from '@/components/LoadingStates';
import { useGameAudio } from '@/hooks/useGameAudio';

interface Props { user: User; onBack: () => void; setUser: (u: User) => void; }

export default function PVPLobby({ user, onBack }: Props) {
  const audio = useGameAudio();
  const [state, setState] = useState<'home'|'lobby'|'clue'|'transition'|'guess'|'result'|'bersiap'|'round_transition'>('home');
  const [wsConn, setWsConn] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const [globalRooms, setGlobalRooms] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [skillMsg, setSkillMsg] = useState('');
  
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ name: 'Room 1', isPrivate: false, maxTeams: 2, hostPlayMode: 'spectator' });
  const [isMobile, setIsMobile] = useState(false);
  
  const [joinCode, setJoinCode] = useState('');
  
  const [emojis, setEmojis] = useState('');
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [guessResult, setGuessResult] = useState<{correct:boolean,points:number,answer:string}|null>(null);
  const [stolenAlert, setStolenAlert] = useState<{fromTeam:number, amount:number}|null>(null);
  const [debuffAlert, setDebuffAlert] = useState<{skillId:string, fromTeam:number}|null>(null);
  const [swapConfirm, setSwapConfirm] = useState<{teammate:string,desiredRole:string}|null>(null);

  // --- Skipped some initial declarations for brevity in thought, but must replace fully ---
  const [incomingSwap, setIncomingSwap] = useState<{from:string,fromRole:string,toRole:string}|null>(null);
  const [swapPending, setSwapPending] = useState(false);
  const [swapAlert, setSwapAlert] = useState<{type:'success'|'error',message:string}|null>(null);
  const [clueSubmitted, setClueSubmitted] = useState(false);
  const [guessSubmitted, setGuessSubmitted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeSkillEffect, setActiveSkillEffect] = useState<{skillId: string, team: number, playerName: string} | null>(null);
  const [scorePopups, setScorePopups] = useState<Array<{id:number;value:number;x:number;y:number}>>([]);
  const [roundNum, setRoundNum] = useState(0);
  const [countdownNum, setCountdownNum] = useState<number|null>(null);
  
  // Alert cooldown states
  const [lastStolenAlertTime, setLastStolenAlertTime] = useState(0);
  const [lastDebuffAlertTime, setLastDebuffAlertTime] = useState(0);
  const [stolenAlertId, setStolenAlertId] = useState<string>('');
  const [debuffAlertId, setDebuffAlertId] = useState<string>('');
  
  // Chat states
  const [chatMessages, setChatMessages] = useState<Array<{playerId:number;playerName:string;message:string;team:number;timestamp:number}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const wsRef = useRef<WebSocket|null>(null);
  const timerRef = useRef<NodeJS.Timeout|null>(null);
  const guessResultRef = useRef<any>(null);
  const prevStateRef = useRef<string|null>(null);
  const prevQRef = useRef<number>(-1);
  const countdownIntervalRef = useRef<NodeJS.Timeout|null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const stolenAlertTimeoutRef = useRef<NodeJS.Timeout|null>(null);
  const debuffAlertTimeoutRef = useRef<NodeJS.Timeout|null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const tk = localStorage.getItem('token');
    try {
      const ws = new WebSocket(`${wsUrl}?token=${tk}`);
      wsRef.current = ws;
      ws.onopen = () => setWsConn(true);
      ws.onclose = () => setWsConn(false);
      ws.onerror = () => setWsConn(false);
      ws.onmessage = e => { try { handleWS(JSON.parse(e.data)); } catch {} };
    } catch { setWsConn(false); }
    return () => {
      wsRef.current?.close();
      audio.stopBGM();
      if(stolenAlertTimeoutRef.current) clearTimeout(stolenAlertTimeoutRef.current);
      if(debuffAlertTimeoutRef.current) clearTimeout(debuffAlertTimeoutRef.current);
    };
  }, []);
  
  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current && chatOpen) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, chatOpen]);
  
  useEffect(() => {
    if(state === 'clue') { 
      setEmojis(''); 
      setGuess(''); 
      setClueSubmitted(false);
      setGuessSubmitted(false);
      setShowEmojiPicker(false);
    }
    else if(state === 'guess') { 
      setGuessSubmitted(false);
      setShowEmojiPicker(false);
    }
    else if(state === 'round_transition') {
      if(countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      if(roundNum === 1) {
        setCountdownNum(3);
        let tick = 0;
        countdownIntervalRef.current = setInterval(() => {
          tick++;
          if(typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
          }
          setCountdownNum(prev => {
            if(prev === null || prev <= 1) {
              if(countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setCountdownNum(null);
      }
    }
    
    if (['bersiap', 'clue', 'guess', 'round_transition', 'transition'].includes(state)) {
      audio.playBGM();
    } else {
      audio.stopBGM();
    }
    
    return () => {
      if(countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [state, roundNum]);
 
  const send = (d: object) => { if (wsRef.current?.readyState === 1) wsRef.current.send(JSON.stringify(d)); };
  const sendChat = () => { 
    if(chatInput.trim()) { 
      send({type:'chat_message', message:chatInput}); 
      setChatInput(''); 
    } 
  };
  const kickPlayer = (playerId: number) => { send({ type: 'kick_player', playerId }); };

  const handleWS = (msg: any) => {
    if(msg.type === 'error') setErrorMsg(msg.message);
    if(msg.type === 'kicked') { setErrorMsg(msg.message); setState('home'); setRoom(null); send({type:'get_rooms'}); audio.stopBGM(); }
    if(msg.type === 'global_rooms') setGlobalRooms(msg.rooms);
    if(msg.type === 'clue_submitted') setClueSubmitted(true);
    if(msg.type === 'skill_used') {
      setActiveSkillEffect(msg);
      setTimeout(() => setActiveSkillEffect(null), 3000);
    }
    if(msg.type === 'stolen_alert') {
      const now = Date.now();
      if (now - lastStolenAlertTime > 1000) { // Minimum 1 second between alerts
        if(stolenAlertTimeoutRef.current) clearTimeout(stolenAlertTimeoutRef.current);
        setStolenAlert({fromTeam: msg.fromTeam, amount: msg.amount});
        setLastStolenAlertTime(now);
        setStolenAlertId(`stolen-${now}`);
        stolenAlertTimeoutRef.current = setTimeout(() => {
          setStolenAlert(null);
          stolenAlertTimeoutRef.current = null;
        }, 5000);
      }
    }
    if(msg.type === 'debuff_alert') {
      const now = Date.now();
      if (now - lastDebuffAlertTime > 1000) { // Minimum 1 second between alerts
        if(debuffAlertTimeoutRef.current) clearTimeout(debuffAlertTimeoutRef.current);
        setDebuffAlert({skillId: msg.skillId, fromTeam: msg.fromTeam});
        setLastDebuffAlertTime(now);
        setDebuffAlertId(`debuff-${now}`);
        debuffAlertTimeoutRef.current = setTimeout(() => {
          setDebuffAlert(null);
          debuffAlertTimeoutRef.current = null;
        }, 5000);
      }
    }
    if(msg.type === 'chat_message') {
      setChatMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.playerId === msg.playerId && lastMsg.message === msg.message && lastMsg.playerName === msg.playerName) return prev;
        return [...prev.slice(-49), msg];
      });
      if (!chatOpen && msg.playerId !== user.id) {
        setUnreadCount(prev => prev + 1);
      }
    }
    if(msg.type === 'guess_result') {
      guessResultRef.current = msg;
      setGuessResult({correct: msg.correct, points: msg.points, answer: msg.answer});
      if (msg.correct) audio.playCorrect();
      else audio.playWrong();
      setTimeout(() => {
        setGuessResult(null);
        guessResultRef.current = null;
      }, 3000);
    }
    if(msg.type === 'timer_tick') {
      setTimeLeft(msg.seconds);
      if (msg.seconds > 0 && msg.seconds <= 5 && prevStateRef.current === 'GUESS') {
        audio.playTimerDanger();
      }
    }
    if(msg.type === 'room_update') {
      const prevState = prevStateRef.current;
      const prevQ = prevQRef.current;
      prevStateRef.current = msg.room.state;
      prevQRef.current = msg.room.currentQ;

      setRoom(msg.room);
      setErrorMsg('');
      if(msg.room.state === 'LOBBY') {
        prevQRef.current = -1;
        setState('lobby');
      }
      if(msg.room.state === 'CLUE') {
        if(guessResultRef.current) {
          setTimeout(() => { 
            guessResultRef.current = null; 
            setGuessResult(null); 
            if(msg.room.currentQ > 0) {
              setRoundNum(msg.room.currentQ + 1);
              setTimeout(() => { setRoundNum(0); setState('clue'); }, 1200);
            } else {
              setState('clue');
            }
          }, 2500);
        } else if(prevState === 'LOBBY') {
          setState('bersiap');
          setTimeout(() => setState('clue'), 2000);
        } else if(prevState === 'TRANSITION' || msg.room.currentQ === prevQ || prevQ < 0) {
          setState('clue');
        } else {
          setState('clue');
        }
      }
      if(msg.room.state === 'TRANSITION') {
        setRoundNum(msg.room.currentQ + 1);
        setState('round_transition');
      }
      if(msg.room.state === 'GUESS') {
        setState('guess');
      }
      if(msg.room.state === 'RESULT') {
        if(guessResultRef.current) {
          setTimeout(() => { 
            guessResultRef.current = null; 
            setGuessResult(null); 
            setState('result'); 
          }, 2500);
        } else {
          setState('result');
        }
      }
    }
    if(msg.type === 'role_taken') {
      setSwapConfirm({teammate: msg.teammate.username, desiredRole: msg.desiredRole});
    }
    if(msg.type === 'role_swap_request') {
      setIncomingSwap({from: msg.from, fromRole: msg.fromRole, toRole: msg.toRole});
    }
    if(msg.type === 'swap_sent') {
      setSwapPending(true);
    }
    if(msg.type === 'swap_success') {
      setSwapPending(false); setSwapConfirm(null); setIncomingSwap(null);
      setSwapAlert({type:'success', message: msg.message});
      setTimeout(() => setSwapAlert(null), 3000);
    }
    if(msg.type === 'swap_rejected') {
      setSwapPending(false); setSwapConfirm(null);
      setSwapAlert({type:'error', message: msg.message});
      setTimeout(() => setSwapAlert(null), 3000);
    }
    if(msg.type === 'swap_cancelled') {
      setIncomingSwap(null);
      setSwapAlert({type:'success', message: msg.message});
      setTimeout(() => setSwapAlert(null), 3000);
    }
  };

  const startTimer = (seconds: number) => {
    if(timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if(t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const createRoom = () => { send({ type: 'create_room', ...createData }); setShowCreate(false); };
  const joinRoom = (id: string) => { if(id) send({ type: 'join_room', roomId: id }); };
  const changeTeam = (t: number) => send({ type: 'change_team', team: t });
  const changeRole = (r: string) => send({ type: 'change_role', role: r });
  const requestSwap = () => send({ type: 'request_swap' });
  const respondSwap = (accept: boolean) => send({ type: 'respond_swap', accept });
  const resetRole = () => send({ type: 'reset_role' });
  const startGame = () => {
    if (!room) return;
    const teamPlayers: Record<string, any[]> = {};
    room.players.forEach((p:any) => {
      if (!teamPlayers[p.team]) teamPlayers[p.team] = [];
      teamPlayers[p.team].push(p);
    });
    
    let validTeamsCount = 0;
    Object.keys(teamPlayers).forEach((t) => {
      const players = teamPlayers[t];
      if (players.length >= 2 && players.some(p => p.role === 'clue') && players.some(p => p.role === 'guess')) {
        validTeamsCount++;
      }
    });

    if (validTeamsCount < 2) {
      setErrorMsg("Minimal 2 tim (4 orang) dengan role lengkap diperlukan untuk memulai permainan.");
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }
    
    send({ type: 'start_game' });
  };
  const submitClue = () => {
    if (!emojis.trim() || clueSubmitted) return;
    send({ type: 'submit_clue', emojis });
    setClueSubmitted(true);
  };
  const submitGuess = () => {
    if (!guess.trim() || guessSubmitted) return;
    send({ type: 'submit_guess', guess, timeLeft });
    setGuessSubmitted(true);
  };
  const handleRoleChange = () => {
    if(!myPlayer || !room) return;
    const targetRole = myPlayer.role === 'clue' ? 'guess' : 'clue';
    const tm = room.players?.find((p:any) => p.team === myPlayer.team && p.id !== user.id && p.role === targetRole);
    if(tm) {
      setSwapConfirm({teammate: tm.username, desiredRole: targetRole});
    } else {
      changeRole(targetRole);
    }
  };
  const useSkill = (id: string) => send({ type: 'use_skill', skillId: id });
  const playAgain = () => send({ type: 'play_again' });
  const leaveRoom = () => { send({ type: 'leave_room' }); setState('home'); setRoom(null); send({type:'get_rooms'}); audio.stopBGM(); };
  const closeRoom = () => { send({ type: 'close_room' }); setState('home'); setRoom(null); audio.stopBGM(); };

  const addScorePopup = (points: number) => {
    const id = Date.now();
    const x = Math.random() * 200 - 100;
    const y = Math.random() * 100 - 50;
    setScorePopups(prev => [...prev, { id, value: points, x, y }]);
    setTimeout(() => {
      setScorePopups(prev => prev.filter(p => p.id !== id));
    }, 2000);
  };

  useEffect(() => {
    if (guessResult && guessResult.points !== 0) {
      addScorePopup(guessResult.points);
    }
  }, [guessResult]);

  const isHost = room?.hostId === user.id;
  const hostPlayingMode = room?.hostPlayMode === 'playing';
  const canHostJoin = isHost && hostPlayingMode;
  let myPlayer = room?.players?.find((p:any) => p.id === user.id);
  if (!myPlayer && canHostJoin && isHost) {
    myPlayer = { id: user.id, username: user.username, avatar_url: user.avatar_url, avatar_color: user.avatar_color, team: 1, role: null, ready: false };
  }

  /* HOME: ROOM LIST */
  if(state === 'home') return (
    <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',flexDirection:'column'}}>
      <nav style={{padding:'clamp(12px,4vw,16px) clamp(16px,5vw,24px)',display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',gap:12,borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
        <button onClick={onBack} style={{background:'none',border:'none',color:'#8888AA',display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(12px,3vw,14px)'}}><ArrowLeft size={18}/> KEMBALI</button>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <button onClick={audio.toggleMute} style={{background:'none',border:'none',cursor:'pointer',color:'#4A4A6A',display:'flex',transition:'color 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.color='#8888AA';}} onMouseLeave={e=>{e.currentTarget.style.color='#4A4A6A';}}>
            {audio.isMuted?<VolumeX size={16}/>:<Volume2 size={16}/>}
          </button>
          <div style={{display:'flex',alignItems:'center',gap:6,color:wsConn?'#30D158':'#FF2D78',fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(10px,2.5vw,12px)'}}>
            {wsConn?<Wifi size={14}/>:<WifiOff size={14}/>} {wsConn?'TERKONEKSI':'OFFLINE'}
          </div>
        </div>
      </nav>

      {showCreate && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:16}}>
          <div className="anim-bounce-in" style={{background:'rgba(26,26,38,0.95)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:24,padding:'clamp(20px,5vw,32px)',width:'min(400px,90%)'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:24}}>
              <h2 style={{fontFamily:"'Clash Display',sans-serif",color:'white',fontSize:'clamp(20px,5vw,24px)'}}>Buat Room</h2>
              <button onClick={()=>setShowCreate(false)} style={{background:'none',border:'none',color:'#8888AA',cursor:'pointer'}}><X/></button>
            </div>
            <div style={{marginBottom:'clamp(12px,2vw,16px)'}}>
              <label style={{color:'#8888AA',fontSize:'clamp(11px,3vw,12px)',fontFamily:"'JetBrains Mono',monospace"}}>NAMA ROOM</label>
              <input type="text" value={createData.name} onChange={e=>setCreateData({...createData,name:e.target.value})} style={{width:'100%',background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.1)',padding:'clamp(10px,2vw,12px) clamp(12px,3vw,16px)',borderRadius:12,color:'white',marginTop:'clamp(6px,1vw,8px)',fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(14px,3.5vw,16px)',outline:'none'}}/>
            </div>
            <div style={{marginBottom:'clamp(12px,2vw,16px)'}}>
              <label style={{color:'#8888AA',fontSize:'clamp(11px,3vw,12px)',fontFamily:"'JetBrains Mono',monospace"}}>TIPE ROOM</label>
              <div style={{display:'flex',gap:'clamp(8px,2vw,12px)',marginTop:'clamp(6px,1vw,8px)',flexWrap:'wrap'}}>
                <button onClick={()=>setCreateData({...createData,isPrivate:false})} style={{flex:1,padding:'12px',borderRadius:12,background:!createData.isPrivate?'rgba(0,245,255,0.1)':'rgba(0,0,0,0.5)',border:!createData.isPrivate?'1px solid rgba(0,245,255,0.4)':'1px solid rgba(255,255,255,0.1)',color:!createData.isPrivate?'#00F5FF':'#8888AA',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(12px,3vw,14px)'}}><Globe size={16}/> Publik</button>
                <button onClick={()=>setCreateData({...createData,isPrivate:true})} style={{flex:1,padding:'12px',borderRadius:12,background:createData.isPrivate?'rgba(255,45,120,0.1)':'rgba(0,0,0,0.5)',border:createData.isPrivate?'1px solid rgba(255,45,120,0.4)':'1px solid rgba(255,255,255,0.1)',color:createData.isPrivate?'#FF2D78':'#8888AA',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(12px,3vw,14px)'}}><Lock size={16}/> Private</button>
              </div>
            </div>
            <div style={{marginBottom:24}}>
              <label style={{color:'#8888AA',fontSize:'clamp(11px,3vw,12px)',fontFamily:"'JetBrains Mono',monospace"}}>JUMLAH TIM</label>
              <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
                {[2,3,4,5].map(n => (
                  <button key={n} onClick={()=>setCreateData({...createData,maxTeams:n})} style={{flex:1,minWidth:'50px',padding:'12px',borderRadius:12,background:createData.maxTeams===n?'rgba(255,214,10,0.1)':'rgba(0,0,0,0.5)',border:createData.maxTeams===n?'1px solid rgba(255,214,10,0.4)':'1px solid rgba(255,255,255,0.1)',color:createData.maxTeams===n?'#FFD60A':'#8888AA',cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(14px,4vw,16px)'}}>{n}</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:32}}>
              <label style={{color:'#8888AA',fontSize:'clamp(11px,3vw,12px)',fontFamily:"'JetBrains Mono',monospace"}}>MODE HOST</label>
              <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
                <button onClick={()=>setCreateData({...createData,hostPlayMode:'spectator'})} style={{flex:1,padding:'12px',borderRadius:12,background:createData.hostPlayMode==='spectator'?'rgba(191,90,242,0.1)':'rgba(0,0,0,0.5)',border:createData.hostPlayMode==='spectator'?'1px solid rgba(191,90,242,0.4)':'1px solid rgba(255,255,255,0.1)',color:createData.hostPlayMode==='spectator'?'#BF5AF2':'#8888AA',cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(11px,3vw,14px)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><Eye size={16}/> Spectator</button>
                <button onClick={()=>setCreateData({...createData,hostPlayMode:'playing'})} style={{flex:1,padding:'12px',borderRadius:12,background:createData.hostPlayMode==='playing'?'rgba(0,245,255,0.1)':'rgba(0,0,0,0.5)',border:createData.hostPlayMode==='playing'?'1px solid rgba(0,245,255,0.4)':'1px solid rgba(255,255,255,0.1)',color:createData.hostPlayMode==='playing'?'#00F5FF':'#8888AA',cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(11px,3vw,14px)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><UserIcon size={16}/> Ikut Main</button>
              </div>
            </div>
            <button onClick={createRoom} style={{width:'100%',padding:'clamp(12px,2.5vw,16px)',borderRadius:12,background:'linear-gradient(135deg,#BF5AF2,#FF2D78)',border:'none',color:'white',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(13px,3.5vw,16px)',cursor:'pointer',boxShadow:'0 8px 24px rgba(191,90,242,0.3)',height:'clamp(44px,8vw,56px)'}}>Buat Room Sekarang</button>
          </div>
        </div>
      )}

      <div style={{flex:1,maxWidth:1000,margin:'0 auto',width:'100%',padding:'clamp(24px,5vw,40px) clamp(16px,5vw,24px)'}}>
        <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'flex-end',marginBottom:32,gap:16}}>
          <div>
            <h1 style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(28px,7vw,40px)',background:'linear-gradient(135deg,#00F5FF,#BF5AF2)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:8}}>Lobby Party</h1>
            <p style={{color:'#8888AA',fontSize:'clamp(12px,3.5vw,14px)'}}>Gabung ke room publik atau buat room mabar sendiri.</p>
          </div>
          <button onClick={()=>setShowCreate(true)} style={{height:'clamp(40px,10vw,48px)',padding:'0 clamp(16px,4vw,24px)',borderRadius:14,background:'linear-gradient(135deg,#BF5AF2,#FF2D78)',border:'none',color:'white',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(13px,3.5vw,15px)',cursor:'pointer',display:'flex',alignItems:'center',gap:8,boxShadow:'0 8px 24px rgba(191,90,242,0.3)'}}><Plus size={18}/> Buat Room</button>
        </div>

        {errorMsg && <div className="anim-slide-down" style={{background:'rgba(255,45,120,0.1)',border:'1px solid rgba(255,45,120,0.3)',padding:'12px',borderRadius:12,color:'#FF2D78',marginBottom:24,fontSize:'clamp(12px,3vw,14px)'}}>{errorMsg}</div>}

        <div style={{display:'flex',flexWrap:'wrap',gap:16,marginBottom:32}}>
          <div style={{flex:1,minWidth:'200px',position:'relative'}}>
            <Key size={18} style={{position:'absolute',left:16,top:15,color:'#8888AA'}}/>
            <input type="text" placeholder="Masukkan Kode Room Private..." value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} style={{width:'100%',height:48,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,paddingLeft:44,color:'white',fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(14px,3.5vw,16px)',outline:'none'}} maxLength={8}/>
          </div>
          <button onClick={()=>joinRoom(joinCode)} style={{height:48,padding:'0 clamp(20px,5vw,32px)',borderRadius:14,background:'rgba(0,245,255,0.1)',border:'1px solid rgba(0,245,255,0.3)',color:'#00F5FF',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(13px,3.5vw,15px)',cursor:'pointer'}}>Gabung Private</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,280px),1fr))',gap:'clamp(16px,4vw,20px)'}}>
          {globalRooms.length === 0 ? (
            <div style={{gridColumn:'1/-1',padding:'clamp(30px,8vw,40px)',textAlign:'center',background:'rgba(255,255,255,0.02)',borderRadius:24,border:'1px dashed rgba(255,255,255,0.1)'}}>
              <Search size={40} color="#4A4A6A" style={{marginBottom:16}}/>
              <h3 style={{color:'white',fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(18px,5vw,20px)',marginBottom:8}}>Belum ada Room Publik</h3>
              <p style={{color:'#8888AA',fontSize:'clamp(12px,3.5vw,14px)'}}>Jadilah Host pertama dan buat room untuk bermain!</p>
            </div>
          ) : globalRooms.map(r => (
            <div key={r.id} style={{background:'rgba(26,26,38,0.6)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:20,padding:20,transition:'transform 0.2s'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-4px)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>
              <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,gap:8}}>
                <h3 style={{color:'white',fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(16px,4.5vw,18px)',margin:0}}>{r.name}</h3>
                <span style={{background:'rgba(0,245,255,0.1)',color:'#00F5FF',padding:'4px 8px',borderRadius:6,fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(10px,2.5vw,11px)'}}>PUB</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,color:'#8888AA',marginBottom:8,fontSize:'clamp(12px,3vw,14px)',flexWrap:'wrap'}}><Crown size={14} color="#FFD60A"/> Host: {r.hostName}</div>
              <div style={{display:'flex',alignItems:'center',gap:8,color:'#8888AA',marginBottom:20,fontSize:'clamp(12px,3vw,14px)',flexWrap:'wrap'}}><Users size={14}/> Player: {r.playerCount}/{r.maxPlayers}</div>
              <button onClick={()=>joinRoom(r.id)} style={{width:'100%',padding:'12px',borderRadius:12,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'white',cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(13px,3.5vw,14px)'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(0,245,255,0.1)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>Gabung Room</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* IN ROOM LOBBY - dengan Chat Toggle */
  if(state === 'lobby' && room) return (
    <div style={{minHeight:'100vh',background:'#0A0A0F',padding:'clamp(16px,4vw,24px)',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',marginBottom:32,gap:16}}>
        {isHost ? (
          <button onClick={closeRoom} style={{background:'none',border:'none',color:'#FF2D78',display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(12px,3vw,14px)'}}><ArrowLeft size={18}/> Tutup Room</button>
        ) : (
          <button onClick={leaveRoom} style={{background:'none',border:'none',color:'#FF2D78',display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(12px,3vw,14px)'}}><ArrowLeft size={18}/> Keluar Room</button>
        )}
        
        <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:16,justifyContent:'flex-end'}}>
          <div style={{textAlign:'right'}}>
            <div style={{color:'white',fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(16px,4.5vw,20px)',fontWeight:700}}>{room.name}</div>
            <div style={{color:'#8888AA',fontSize:'clamp(10px,2.5vw,12px)'}}>Host: {room.hostInfo.username}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <span style={{color:'#8888AA',fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(10px,2.5vw,12px)'}}>KODE ROOM:</span>
            <div style={{background:'rgba(255,255,255,0.1)',padding:'8px 16px',borderRadius:8,color:'white',fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(14px,4vw,20px)',letterSpacing:'4px',fontWeight:'bold',display:'flex',alignItems:'center',gap:8}}>
              {room.isPrivate && <Lock size={16} color="#FF2D78"/>} {room.id}
            </div>
          </div>
        </div>
      </div>
      
      {errorMsg && <div className="anim-slide-down" style={{background:'rgba(255,45,120,0.1)',border:'1px solid rgba(255,45,120,0.3)',padding:'12px',borderRadius:12,color:'#FF2D78',marginBottom:24,fontSize:'clamp(12px,3vw,14px)',textAlign:'center'}}>{errorMsg}</div>}

      <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fit,minmax(min(100%,260px),1fr))`,gap:'clamp(16px,4vw,24px)',maxWidth:1200,margin:'0 auto',width:'100%'}}>
        {Array.from({length:room.maxTeams}).map((_, idx) => {
          const t = idx + 1;
          const tp = room.players.filter((p:any) => p.team === t);
          const isMyTeam = myPlayer?.team === t;
          return (
            <div key={t} style={{background:isMyTeam?'rgba(0,245,255,0.05)':'rgba(26,26,38,0.5)',border:`1px solid ${isMyTeam?'rgba(0,245,255,0.3)':'rgba(255,255,255,0.05)'}`,borderRadius:24,padding:'clamp(16px,4vw,20px)'}}>
              <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',marginBottom:20,gap:12}}>
                <h3 style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,color:isMyTeam?'#00F5FF':'white',fontSize:'clamp(18px,5vw,20px)'}}>Tim {t}</h3>
                {(!isHost || canHostJoin) && !isMyTeam && tp.length < 2 && <button onClick={()=>changeTeam(t)} style={{background:'rgba(0,245,255,0.1)',border:'none',padding:'6px 12px',borderRadius:8,color:'#00F5FF',cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(11px,3vw,13px)'}}>Pindah Kesini</button>}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {[0,1].map(i => {
                  const p = tp[i];
                  if(p) return (
                    <div key={i} style={{background:'rgba(0,0,0,0.3)',padding:12,borderRadius:16,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',border:p.id===user.id?'1px solid rgba(0,245,255,0.4)':'none'}}>
                      <Avatar src={p.avatar_url} color={p.avatar_color} name={p.username} size="sm"/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{color:'white',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(13px,4vw,15px)',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                          {p.username}
                          {p.id === room.hostId && <Crown size={14} color="#FFD60A" />}
                        </div>
                        <div style={{color:'#8888AA',fontSize:'clamp(11px,3vw,12px)',marginTop:2}}>Role: <strong style={{color:p.role==='clue'?'#BF5AF2':'#30D158'}}>{p.role ? (p.role==='clue'?'Pemberi Clue':'Penebak') : 'Belum Pilih'}</strong></div>
                      </div>
                      {(!isHost || canHostJoin) && p.id === user.id && (
                        <div style={{display:'flex',gap:4}}>
                          <button onClick={handleRoleChange} style={{background:'rgba(255,255,255,0.1)',border:'none',padding:'6px',borderRadius:8,color:'white',cursor:'pointer'}} title={p.role?'Ganti Role':'Pilih Role'}><ArrowLeft size={14}/></button>
                          {p.role && <button onClick={resetRole} style={{background:'rgba(255,45,120,0.1)',border:'none',padding:'6px',borderRadius:8,color:'#FF2D78',cursor:'pointer'}} title="Reset Role"><X size={14}/></button>}
                        </div>
                      )}
                      {isHost && p.id !== user.id && (
                        <button onClick={() => kickPlayer(p.id)} style={{background:'rgba(255,45,120,0.1)',border:'none',padding:'6px',borderRadius:8,color:'#FF2D78',cursor:'pointer',marginLeft:4}} title="Keluarkan Player">
                          <X size={14}/>
                        </button>
                      )}
                    </div>
                  );
                  return (
                    <div key={i} style={{background:'rgba(255,255,255,0.02)',border:'1px dashed rgba(255,255,255,0.1)',padding:16,borderRadius:16,textAlign:'center',color:'#4A4A6A',fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(11px,3vw,12px)'}}>SLOT KOSONG</div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{marginTop:'auto',paddingTop:40,textAlign:'center'}}>
        {isHost ? (
          <button onClick={startGame} style={{height:'clamp(56px,8vw,64px)',padding:'0 clamp(32px,8vw,48px)',borderRadius:20,background:'linear-gradient(135deg,#30D158,#00F5FF)',border:'none',color:'#0A0A0F',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(16px,4vw,20px)',cursor:'pointer',boxShadow:'0 8px 32px rgba(48,209,88,0.3)'}}>Mulai Permainan</button>
        ) : (
          <div style={{color:'#8888AA',fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(14px,4vw,18px)'}}>Menunggu Host Memulai Game...</div>
        )}
      </div>

      {/* Incoming Swap Request Popup */}
      {incomingSwap && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#1A1A28',borderRadius:24,padding:'clamp(24px,5vw,32px)',maxWidth:420,width:'90%',border:'1px solid rgba(255,255,255,0.1)'}}>
            <h3 style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(18px,5vw,22px)',color:'white',marginBottom:16,textAlign:'center'}}>Permintaan Tukar Role</h3>
            <p style={{color:'#8888AA',marginBottom:20,textAlign:'center',fontSize:'clamp(12px,3vw,14px)'}}>
              <strong style={{color:'#00F5FF'}}>{incomingSwap.from}</strong> ingin bertukar role denganmu.
            </p>
            <div style={{background:'rgba(0,0,0,0.3)',borderRadius:16,padding:16,marginBottom:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <span style={{color:'#4A4A6A',fontSize:'clamp(11px,3vw,12px)',fontFamily:"'JetBrains Mono',monospace"}}>KAMU</span>
                <span style={{color:'white',fontWeight:600,fontSize:'clamp(12px,3vw,14px)'}}>{incomingSwap.toRole === 'clue' ? 'Pemberi Clue' : 'Penebak'}</span>
              </div>
              <div style={{textAlign:'center',color:'#8888AA',fontSize:20,marginBottom:12}}>⇄</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{color:'#4A4A6A',fontSize:'clamp(11px,3vw,12px)',fontFamily:"'JetBrains Mono',monospace"}}>{incomingSwap.from}</span>
                <span style={{color:'white',fontWeight:600,fontSize:'clamp(12px,3vw,14px)'}}>{incomingSwap.fromRole === 'clue' ? 'Pemberi Clue' : 'Penebak'}</span>
              </div>
              <div style={{borderTop:'1px dashed rgba(255,255,255,0.1)',margin:'16px 0',paddingTop:12,textAlign:'center'}}>
                <span style={{color:'#FFD60A',fontSize:'clamp(12px,3vw,13px)',fontFamily:"'JetBrains Mono',monospace"}}>Setelah ditukar:</span>
                <div style={{marginTop:8,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                  <span style={{color:'white',fontSize:'clamp(11px,3vw,13px)'}}>Kamu → {incomingSwap.fromRole === 'clue' ? 'Pemberi Clue' : 'Penebak'}</span>
                  <span style={{color:'white',fontSize:'clamp(11px,3vw,13px)'}}>{incomingSwap.from} → {incomingSwap.toRole === 'clue' ? 'Pemberi Clue' : 'Penebak'}</span>
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:12}}>
              <button onClick={()=>{respondSwap(false)}} style={{flex:1,padding:'12px',borderRadius:14,background:'rgba(255,45,120,0.1)',border:'1px solid rgba(255,45,120,0.3)',color:'#FF2D78',cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(12px,3vw,14px)'}}>Tolak</button>
              <button onClick={()=>{respondSwap(true)}} style={{flex:1,padding:'12px',borderRadius:14,background:'linear-gradient(135deg,#30D158,#00F5FF)',border:'none',color:'#0A0A0F',cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(12px,3vw,14px)'}}>Terima</button>
            </div>
          </div>
        </div>
      )}

      {/* Swap Pending Toast */}
      {swapPending && (
        <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:'rgba(0,245,255,0.1)',border:'1px solid rgba(0,245,255,0.3)',padding:'12px 24px',borderRadius:14,color:'#00F5FF',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(12px,3vw,14px)',zIndex:1000,whiteSpace:'nowrap'}}>
          Menunggu persetujuan tukar role...
        </div>
      )}

      {/* Swap Alert Toast */}
      {swapAlert && (
        <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:swapAlert.type==='success'?'rgba(48,209,88,0.1)':'rgba(255,45,120,0.1)',border:`1px solid ${swapAlert.type==='success'?'rgba(48,209,88,0.3)':'rgba(255,45,120,0.3)'}`,padding:'12px 24px',borderRadius:14,color:swapAlert.type==='success'?'#30D158':'#FF2D78',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(12px,3vw,14px)',zIndex:1000,whiteSpace:'nowrap'}}>
          {swapAlert.message}
        </div>
      )}

      {/* Chat - Toggle Button & Window */}
      <div style={{position:'fixed', bottom:20, right:20, zIndex:500}}>
        <AnimatePresence>
          {chatOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                position: 'absolute',
                bottom: 60,
                right: 0,
                width: 'min(320px, calc(100vw - 32px))',
                background: 'rgba(26,26,38,0.98)',
                border: '1px solid rgba(191,90,242,0.3)',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(191,90,242,0.1)'}}>
                <span style={{fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:14,color:'#BF5AF2'}}>Chat Room</span>
                <span style={{fontSize:12,color:'#4A4A6A'}}>{chatMessages.length} pesan</span>
              </div>
              <div 
                ref={chatContainerRef}
                style={{height:200,overflowY:'auto',padding:'8px',display:'flex',flexDirection:'column',gap:6}}
              >
                {chatMessages.length === 0 ? (
                  <div style={{textAlign:'center',color:'#4A4A6A',fontSize:12,padding:20}}>Belum ada chat</div>
                ) : (
                  chatMessages.map((m, i) => (
                    <div key={i} style={{fontSize:'clamp(11px,3vw,12px)',wordBreak:'break-word'}}>
                      <span style={{color:m.playerId === user.id ? '#00F5FF' : '#FFD60A',fontWeight:600}}>{m.playerName}:</span>
                      <span style={{color:'#CCCCCC',marginLeft:4}}>{m.message}</span>
                    </div>
                  ))
                )}
              </div>
              <div style={{padding:'8px',borderTop:'1px solid rgba(255,255,255,0.1)',display:'flex',gap:8}}>
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={e=>setChatInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&sendChat()}
                  placeholder="Ketik pesan..."
                  style={{flex:1,background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px 12px',color:'white',fontSize:'clamp(12px,3vw,13px)',outline:'none'}}
                />
                <button onClick={sendChat} disabled={!chatInput.trim()} style={{width:36,height:36,borderRadius:8,background:chatInput.trim()?'linear-gradient(135deg,#BF5AF2,#FF2D78)':'rgba(100,100,100,0.3)',border:'none',color:'white',cursor:chatInput.trim()?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Send size={16}/>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Toggle Chat Button */}
        <button
          onClick={() => {
            setChatOpen(!chatOpen);
            if (!chatOpen) setUnreadCount(0);
          }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            background: 'linear-gradient(135deg,#BF5AF2,#FF2D78)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(191,90,242,0.4)',
            position: 'relative',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageCircle size={22} color="white" />
          {unreadCount > 0 && !chatOpen && (
            <div style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#FF2D78',
              color: 'white',
              fontSize: 11,
              fontWeight: 'bold',
              minWidth: 20,
              height: 20,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 5px',
              boxShadow: '0 0 10px rgba(255,45,120,0.5)'
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </button>
      </div>
    </div>
  );

  /* IN GAME UI - LEADERBOARD */
  const RealtimeLeaderboard = () => {
    const sortedTeams = Array.from({length: room.maxTeams}).map((_, i) => ({ team: i+1, score: room.scores[i+1] || 0 })).sort((a,b) => b.score - a.score);
    return (
      <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8,width:'100%',maxWidth:600,justifyContent:'center',marginTop:12}}>
        {sortedTeams.map((t, idx) => (
          <div key={t.team} style={{display:'flex',alignItems:'center',gap:6,background:t.team===myPlayer?.team?'rgba(0,245,255,0.1)':'rgba(26,26,38,0.8)',border:`1px solid ${t.team===myPlayer?.team?'rgba(0,245,255,0.3)':'rgba(255,255,255,0.1)'}`,padding:'6px 12px',borderRadius:12,whiteSpace:'nowrap',minWidth:80,justifyContent:'center'}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:idx===0?'#FFD60A':'#8888AA'}}>#{idx+1}</span>
            <span style={{fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:13,color:'white'}}>T{t.team} <span style={{color:'#00F5FF',marginLeft:4}}>{t.score}</span></span>
          </div>
        ))}
      </div>
    );
  };

  /* IN GAME UI - HEADER Untuk kedua fase */
  const Header = () => (
    <div style={{padding:'clamp(12px,3vw,16px) clamp(16px,4vw,24px)',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
      <div style={{display:'flex',justifyContent:'space-between',width:'100%',maxWidth:600,alignItems:'center'}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:'#8888AA'}}>SOAL {room?.currentQ+1}/{room?.totalQ}</span>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <button onClick={audio.toggleMute} style={{background:'none',border:'none',cursor:'pointer',color:'#4A4A6A',display:'flex',transition:'color 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.color='#8888AA';}} onMouseLeave={e=>{e.currentTarget.style.color='#4A4A6A';}}>
            {audio.isMuted?<VolumeX size={18}/>:<Volume2 size={18}/>}
          </button>
          <div style={{display:'flex',alignItems:'center',gap:8,color:timeLeft<=5?'#FF2D78':'white',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(16px,4vw,20px)'}}><Clock size={16}/> {timeLeft}s</div>
        </div>
      </div>
      <RealtimeLeaderboard />
    </div>
  );

  /* GUESS RESULT POPUP */
  const GuessResultPopup = () => {
    if(!guessResult) return null;
    return (
      <AnimatePresence>
        <motion.div initial={{opacity:0,scale:0.8,y:50}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.8,y:50}} style={{position:'absolute',top:'40%',left:'50%',transform:'translate(-50%,-50%)',zIndex:100,background:guessResult.correct?'rgba(48,209,88,0.95)':'rgba(255,45,120,0.95)',padding:'24px 32px',borderRadius:24,boxShadow:'0 20px 40px rgba(0,0,0,0.5)',textAlign:'center',minWidth:250,backdropFilter:'blur(10px)',border:'1px solid rgba(255,255,255,0.2)'}}>
          {guessResult.correct ? <CheckCircle size={48} color="white" style={{marginBottom:12, display:'inline-block'}}/> : <XCircle size={48} color="white" style={{marginBottom:12, display:'inline-block'}}/>}
          <h2 style={{color:'white',fontFamily:"'Clash Display',sans-serif",fontSize:24,marginBottom:8}}>{guessResult.correct ? 'BENAR!' : 'SALAH!'}</h2>
          <div style={{color:'rgba(255,255,255,0.9)',fontSize:14,marginBottom:8}}>Jawaban: {guessResult.answer}</div>
          <div style={{color:'white',fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:'bold'}}>{guessResult.points > 0 ? `+${guessResult.points}` : guessResult.points} PTS</div>
        </motion.div>
      </AnimatePresence>
    );
  };

  /* STOLEN ALERT POPUP */
  const StolenAlertPopup = () => {
    if(!stolenAlert) return null;
    return (
      <AnimatePresence key={stolenAlertId}>
        <motion.div initial={{opacity:0,x:50}} animate={{opacity:1,x:0}} exit={{opacity:0,x:50}} transition={{duration:0.3}} style={{position:'absolute',top:20,right:20,zIndex:105,background:'rgba(255,45,120,0.9)',padding:'16px 20px',borderRadius:16,boxShadow:'0 10px 20px rgba(255,45,120,0.3)',display:'flex',alignItems:'center',gap:12,border:'1px solid rgba(255,255,255,0.2)'}}>
          <AlertCircle size={24} color="white" />
          <div>
            <div style={{color:'white',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:14}}>Poin Dicuri!</div>
            <div style={{color:'rgba(255,255,255,0.9)',fontSize:12}}>Tim {stolenAlert.fromTeam} mencuri {stolenAlert.amount} poin.</div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  /* DEBUFF ALERT POPUP */
  const DebuffAlertPopup = () => {
    if(!debuffAlert) return null;
    let debuffName = '';
    if(debuffAlert.skillId === 'emoji_chaos') debuffName = 'Emoji Chaos';
    if(debuffAlert.skillId === 'blur_vision') debuffName = 'Blur Vision';
    if(debuffAlert.skillId === 'fake_shake') debuffName = 'Fake Shake';

    return (
      <AnimatePresence key={debuffAlertId}>
        <motion.div initial={{opacity:0,y:-50}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-50}} transition={{duration:0.3}} style={{position:'absolute',top:20,left:'50%',transform:'translateX(-50%)',zIndex:105,background:'rgba(191,90,242,0.95)',padding:'16px 20px',borderRadius:16,boxShadow:'0 10px 30px rgba(191,90,242,0.4)',display:'flex',alignItems:'center',gap:12,border:'1px solid rgba(255,255,255,0.2)'}}>
          <AlertTriangle size={24} color="white" />
          <div>
            <div style={{color:'white',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:14}}>Tim Kamu Terkena Gangguan!</div>
            <div style={{color:'rgba(255,255,255,0.9)',fontSize:12}}>Tim {debuffAlert.fromTeam} mengirimkan {debuffName}.</div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  /* PLAYER IN GAME UI */
const ALL_SKILLS_DEF = {
  double_point: { id: 'double_point', label: '2x Poin', icon: <Zap size={16} />, color: 'var(--gold)', activeColor: 'rgba(255,214,10,0.2)', inactiveColor: 'rgba(255,214,10,0.08)', border: 'rgba(255,214,10,0.3)' },
  extra_time: { id: 'extra_time', label: '+10s Waktu', icon: <Clock size={16} />, color: '#00F5FF', activeColor: 'rgba(0,245,255,0.2)', inactiveColor: 'rgba(0,245,255,0.08)', border: 'rgba(0,245,255,0.3)' },
  shield: { id: 'shield', label: 'Shield', icon: <Shield size={16} />, color: '#30D158', activeColor: 'rgba(48,209,88,0.2)', inactiveColor: 'rgba(48,209,88,0.08)', border: 'rgba(48,209,88,0.3)' },
  emoji_chaos: { id: 'emoji_chaos', label: 'Emoji Chaos', icon: <Globe size={16} />, color: 'var(--purple)', activeColor: 'rgba(191,90,242,0.2)', inactiveColor: 'rgba(191,90,242,0.08)', border: 'rgba(191,90,242,0.3)' },
  blur_vision: { id: 'blur_vision', label: 'Blur Vision', icon: <Eye size={16} />, color: 'var(--purple)', activeColor: 'rgba(191,90,242,0.2)', inactiveColor: 'rgba(191,90,242,0.08)', border: 'rgba(191,90,242,0.3)' },
  fake_shake: { id: 'fake_shake', label: 'Fake Shake', icon: <AlertTriangle size={16} />, color: 'var(--purple)', activeColor: 'rgba(191,90,242,0.2)', inactiveColor: 'rgba(191,90,242,0.08)', border: 'rgba(191,90,242,0.3)' },
  risk_gamble: { id: 'risk_gamble', label: 'Risk Gamble', icon: <Plus size={16} />, color: 'var(--pink)', activeColor: 'rgba(255,45,120,0.2)', inactiveColor: 'rgba(255,45,120,0.08)', border: 'rgba(255,45,120,0.3)' },
  lucky_bonus: { id: 'lucky_bonus', label: 'Lucky Bonus', icon: <Plus size={16} />, color: 'var(--gold)', activeColor: 'rgba(255,214,10,0.2)', inactiveColor: 'rgba(255,214,10,0.08)', border: 'rgba(255,214,10,0.3)' },
  point_steal: { id: 'point_steal', label: 'Point Steal', icon: <Zap size={16} />, color: 'var(--pink)', activeColor: 'rgba(255,45,120,0.2)', inactiveColor: 'rgba(255,45,120,0.08)', border: 'rgba(255,45,120,0.3)' },
  ultimate: { id: 'ultimate', label: 'Ultimate', icon: <Target size={16} />, color: 'var(--pink)', activeColor: 'rgba(255,45,120,0.2)', inactiveColor: 'rgba(255,45,120,0.08)', border: 'rgba(255,45,120,0.3)' },
};

const Skills = () => {
    if (!myPlayer || myPlayer.role !== 'guess') return null;
    const isActive = room?.activeSkills?.[myPlayer.team];
    const usedSkills = room?.usedSkills?.[myPlayer.team] || {};
    const usedCount = Object.keys(usedSkills).length;
    const maxSkills = 3;
    const limitReached = usedCount >= maxSkills;
    const myTeamSkills = room?.teamSkills?.[myPlayer.team] || [];

    return (
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', padding: '12px 16px', flexWrap: 'wrap' }}>
        {limitReached && <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>Batas skill tercapai ({usedCount}/{maxSkills})</div>}
        {myTeamSkills.map((skillId: string) => {
          const s = ALL_SKILLS_DEF[skillId as keyof typeof ALL_SKILLS_DEF];
          if(!s) return null;
          const isUsed = usedSkills[s.id];
          const disabled = !!isActive || isUsed || limitReached;
          return (
            <motion.button key={s.id} whileHover={disabled ? {} : { y: -2 }} whileTap={disabled ? {} : { scale: 0.95 }}
              onClick={() => send({ type: 'use_skill', skillId: s.id })} disabled={disabled}
              style={{ padding: '10px 18px', borderRadius: 12, background: isUsed ? 'rgba(255,255,255,0.03)' : (isActive === s.id ? s.activeColor : s.inactiveColor), border: `1px solid ${isUsed ? 'rgba(255,255,255,0.1)' : (isActive === s.id ? s.color : s.border)}`, color: isUsed ? '#8888AA' : s.color, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Clash Display',sans-serif", fontWeight: 600, fontSize: 13, opacity: disabled ? 0.4 : 1, textDecoration: isUsed ? 'line-through' : 'none', boxShadow: isActive === s.id ? `0 0 15px ${s.color}40` : 'none', transition: 'all 0.3s ease' }}>
              {s.icon} {isUsed ? `${s.label} (Terpakai)` : s.label}
              {isActive === s.id && !isUsed && <span style={{ color: s.color, fontSize: 11 }}>✓</span>}
            </motion.button>
          );
        })}
        {skillMsg && <div style={{ width: '100%', textAlign: 'center', color: 'var(--gold)', fontSize: 14, fontFamily: "'Clash Display',sans-serif", fontWeight: 600 }}>{skillMsg}</div>}
      </div>
    );
  };

  /* CLUE PHASE - tanpa chat */
  if(state === 'clue' && room && myPlayer) {
    const isClueGiver = myPlayer.role === 'clue';
    const currentQuestion = room.activeQuestion;

    return (
      <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
        <Header/>
        <GuessResultPopup/>
        <StolenAlertPopup/>
        <DebuffAlertPopup/>
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:16,position:'relative'}}>
          <div style={{maxWidth:600,width:'100%',margin:'0 auto',textAlign:'center',boxSizing:'border-box',padding:'0 16px'}}>
            {isClueGiver ? (
              <>
                <h1 style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(28px,6vw,36px)',color:'#BF5AF2',marginBottom:8}}>Berikan Clue Emoji</h1>
                <p style={{color:'#8888AA',marginBottom:32,fontSize:'clamp(14px,3.5vw,16px)'}}>Berikan clue emoji untuk: <strong style={{color:'#FFD60A'}}>{currentQuestion?.answer}</strong></p>
                
                <div style={{background:'rgba(26,26,38,0.8)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'clamp(16px,4vw,24px)',marginBottom:'clamp(16px,4vw,24px)'}}>
<div style={{display:'flex',alignItems:'center',gap:'clamp(8px,2vw,12px)',marginBottom:'clamp(12px,3vw,16px)',flexDirection:isMobile?'column':'row',justifyContent:isMobile?'center':'flex-start'}}>
                    <input 
                      type="text" 
                      value={emojis} 
                      onChange={e=>setEmojis(e.target.value.replace(/[a-zA-Z0-9]/g, ''))}
                      placeholder="Ketik emoji atau klik tombol emoji..."
                      disabled={clueSubmitted}
                      style={{width:isMobile?'100%':'auto',flex:isMobile?undefined:1,minWidth:isMobile?undefined:'clamp(180px,60vw,400px)',background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.1)',padding:'clamp(12px,2.5vw,16px) clamp(12px,3vw,20px)',borderRadius:12,color:'white',fontSize:'clamp(14px,4vw,18px)',outline:'none',fontFamily:"'Clash Display',sans-serif",marginBottom:isMobile?'clamp(12px,3vw,16px)':0}}
                    />
                    <button 
                      onClick={()=>setShowEmojiPicker(!showEmojiPicker)}
                      disabled={clueSubmitted}
                      style={{width:isMobile?'clamp(60px,15vw,80px)':'clamp(44px,10vw,56px)',height:isMobile?'clamp(60px,15vw,80px)':'clamp(44px,10vw,56px)',borderRadius:isMobile?16:12,background:'rgba(191,90,242,0.1)',border:'1px solid rgba(191,90,242,0.3)',color:'#BF5AF2',cursor:clueSubmitted?'not-allowed':'pointer',fontSize:isMobile?'clamp(24px,6vw,32px)':'clamp(18px,4vw,24px)',display:'flex',alignItems:'center',justifyContent:'center',opacity:clueSubmitted?0.5:1,alignSelf:isMobile?'center':'auto',flexShrink:isMobile?undefined:0}}
                    >
                      <Smile size={isMobile?32:24}/>
                    </button>
                  </div>
                  
                  {showEmojiPicker && !clueSubmitted && (
                    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.7)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}} onClick={() => setShowEmojiPicker(false)}>
                      <div style={{position:'relative',width:'95%',maxWidth:360,borderRadius:16,overflow:'hidden'}} onClick={(e) => e.stopPropagation()}>
                        <Picker data={data} onEmojiSelect={(emoji:any) => { setEmojis(prev => prev + emoji.native); setShowEmojiPicker(false); }} theme="dark" />
                        <button onClick={() => setShowEmojiPicker(false)} style={{position:'absolute',top:8,right:8,background:'rgba(0,0,0,0.5)',border:'none',borderRadius:'50%',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'white'}}><X size={18}/></button>
                      </div>
                    </div>
                  )}

                  {clueSubmitted && (
                    <div style={{background:'rgba(48,209,88,0.1)',border:'1px solid rgba(48,209,88,0.5)',padding:'clamp(12px,2vw,16px) clamp(16px,3vw,20px)',borderRadius:12,color:'#30D158',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(14px,3.5vw,16px)',marginTop:'clamp(12px,3vw,16px)',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                      <Sparkles size={20}/> Clue emoji berhasil dikirim!
                    </div>
                  )}
                </div>

                <button onClick={submitClue} disabled={!emojis.trim() || clueSubmitted} style={{width:'100%',height:'clamp(44px,10vw,56px)',borderRadius:16,background:clueSubmitted?'rgba(139,65,186,0.3)':'linear-gradient(135deg,#BF5AF2,#FF2D78)',border:'1px solid ' + (clueSubmitted ? 'rgba(139,65,186,0.3)' : 'transparent'),color:clueSubmitted?'#9966CC':'white',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(14px,3.5vw,18px)',cursor:clueSubmitted?'not-allowed':'pointer',opacity:!emojis.trim()||clueSubmitted?0.6:1}}>
                  Kirim Clue
                </button>
              </>
            ) : (
              <>
                <h1 style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(28px,6vw,36px)',color:'#30D158',marginBottom:8}}>Menunggu Clue</h1>
                <p style={{color:'#8888AA',marginBottom:32,fontSize:'clamp(14px,3.5vw,16px)'}}>Pemberi clue sedang menyiapkan emoji...</p>
                <div style={{background:'rgba(26,26,38,0.8)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:40,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <PulseRing color="#30D158" />
                </div>
              </>
            )}
          </div>
        </div>
        <Skills/>
      </div>
    );
  }

  /* GUESS PHASE - tanpa chat */
  if(state === 'guess' && room && myPlayer) {
    const isGuesser = myPlayer.role === 'guess';
    const teamClue = room.clues?.[myPlayer.team] || '';

    return (
      <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
        <Header/>
        <GuessResultPopup/>
        <StolenAlertPopup/>
        <DebuffAlertPopup/>
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:16,position:'relative'}}>
          <div style={{maxWidth:600,width:'100%',margin:'0 auto',textAlign:'center',boxSizing:'border-box',padding:'0 16px'}}>
            {isGuesser ? (
              <>
                <h1 style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(28px,6vw,36px)',color:'#30D158',marginBottom:8}}>Tebak Jawabannya!</h1>
                <p style={{color:'#8888AA',marginBottom:32,fontSize:'clamp(14px,3.5vw,16px)'}}>Berdasarkan clue emoji dari tim kamu</p>
                
                {/* Clue Display */}
                {(() => {
                  let isPerusuh = false;
                  let isBlur = false;
                  let isShake = false;
                  Object.keys(room.activeSkills || {}).forEach(t => {
                    if (t !== myPlayer?.team?.toString()) {
                      if (room.activeSkills[t] === 'emoji_chaos') isPerusuh = true;
                      if (room.activeSkills[t] === 'blur_vision') isBlur = true;
                      if (room.activeSkills[t] === 'fake_shake') isShake = true;
                    }
                  });
                  const myShield = room.activeSkills?.[myPlayer?.team] === 'shield';
                  if (myShield) {
                    isPerusuh = false;
                    isBlur = false;
                    isShake = false;
                  }
                  
                  return (
                    <div style={{background:'rgba(26,26,38,0.8)',border:'1px solid rgba(191,90,242,0.3)',borderRadius:20,padding:'clamp(16px,4vw,32px)',marginBottom:'clamp(16px,4vw,24px)',position:'relative',overflow:'hidden'}}>
                      {myShield && <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,border:'2px solid #30D158',borderRadius:20,boxShadow:'inset 0 0 20px rgba(48,209,88,0.2)',pointerEvents:'none'}}></div>}
                      <div style={{color:'#BF5AF2',fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(10px,2.5vw,12px)',letterSpacing:'0.1em',marginBottom:'clamp(8px,2vw,12px)'}}>
                        CLUE EMOJI {myShield && <span style={{color:'#30D158',display:'inline-flex',alignItems:'center',gap:4,marginLeft:8}}><Shield size={14}/> Shield Aktif</span>}
                      </div>
                      <div style={{fontSize:'clamp(36px,12vw,48px)',marginBottom:'clamp(12px,3vw,16px)',minHeight:'clamp(50px,15vw,60px)',display:'flex',alignItems:'center',justifyContent:'center',animation: isPerusuh ? 'extreme-spin 0.25s linear infinite' : (isShake ? 'extreme-shake 0.15s ease-in-out infinite' : 'none'),filter: isBlur ? 'blur(12px)' : 'none',transition:'all 0.3s ease'}}>
                        {teamClue || <HelpCircle size={48} color='#4A4A6A'/>}
                      </div>
                      {!teamClue && <div style={{color:'#FF2D78',fontSize:'clamp(11px,3vw,14px)'}}>Tim kamu belum memberikan clue!</div>}
                    </div>
                  );
                })()}

                {/* Hint System */}
                <div style={{width:'100%',display:'flex',flexDirection:'column',gap:'clamp(8px,2vw,12px)',marginBottom:'clamp(16px,4vw,24px)'}}>
                  <button onClick={() => send({ type: 'use_hint' })} disabled={guessSubmitted || room.hintsRemaining?.[myPlayer.team] <= 0 || room.hintsForRound?.[myPlayer.team]} style={{background: room.hintsForRound?.[myPlayer.team] ? 'rgba(0,245,255,0.1)' : (room.hintsRemaining?.[myPlayer.team] > 0 ? 'rgba(255,214,10,0.1)' : 'rgba(255,255,255,0.05)'),border: `1px solid ${room.hintsForRound?.[myPlayer.team] ? 'rgba(0,245,255,0.3)' : (room.hintsRemaining?.[myPlayer.team] > 0 ? 'rgba(255,214,10,0.3)' : 'rgba(255,255,255,0.1)')}`,padding:'clamp(10px,2.5vw,12px) clamp(16px,3vw,20px)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',gap:'clamp(6px,1.5vw,8px)',color: room.hintsForRound?.[myPlayer.team] ? '#00F5FF' : (room.hintsRemaining?.[myPlayer.team] > 0 ? '#FFD60A' : '#8888AA'),cursor: (guessSubmitted || room.hintsRemaining?.[myPlayer.team] <= 0 || room.hintsForRound?.[myPlayer.team]) ? 'not-allowed' : 'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(11px,3vw,14px)',transition:'all 0.3s',height:'clamp(40px,8vw,48px)'}}>
                    <Lightbulb size={18}/> {room.hintsForRound?.[myPlayer.team] ? 'Hint Digunakan' : `Gunakan Hint Sistem (Sisa: ${room.hintsRemaining?.[myPlayer.team] || 0}/2)`}
                  </button>
                </div>

                {/* Answer Input */}
                <div style={{background:'rgba(26,26,38,0.8)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'clamp(16px,4vw,24px)',marginBottom:'clamp(16px,4vw,24px)'}}>
                  {room.noClueTeams?.includes(myPlayer.team) ? (
                    <div style={{textAlign:'center',padding:'clamp(12px,2vw,16px) clamp(8px,2vw,8px)'}}>
                      <div style={{color:'#FF2D78',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(13px,3.5vw,16px)',marginBottom:'clamp(4px,1vw,8px)'}}>Tim kamu belum memberikan clue!</div>
                      <div style={{color:'#8888AA',fontSize:'clamp(11px,3vw,14px)'}}>Kamu tidak bisa menebak karena tidak ada clue.</div>
                      <div style={{color:'#FFD60A',fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(10px,3vw,13px)',marginTop:'clamp(8px,2vw,12px)'}}>-200 POIN PENALTY</div>
                    </div>
                  ) : (
                    <>
                      <input type="text" value={guess} onChange={e=>setGuess(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submitGuess()} placeholder="Ketik jawabanmu..." disabled={guessSubmitted} style={{width:'100%',background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.1)',padding:'clamp(12px,2.5vw,16px) clamp(12px,3vw,20px)',borderRadius:12,color:'white',fontSize:'clamp(14px,4vw,18px)',outline:'none',fontFamily:"'Clash Display',sans-serif"}}/>
                      {guessSubmitted && <div style={{background:'rgba(48,209,88,0.1)',border:'1px solid rgba(48,209,88,0.5)',padding:'clamp(12px,2vw,16px) clamp(16px,3vw,20px)',borderRadius:12,color:'#30D158',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(13px,3.5vw,16px)',marginTop:'clamp(12px,3vw,16px)',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><CheckCircle size={20}/> Jawaban Terkirim!</div>}
                    </>
                  )}
                </div>

                <button onClick={submitGuess} disabled={!guess.trim() || guessSubmitted || room.noClueTeams?.includes(myPlayer.team)} style={{width:'100%',height:56,borderRadius:16,background:guessSubmitted || room.noClueTeams?.includes(myPlayer.team)?'rgba(20,100,60,0.4)':'linear-gradient(135deg,#30D158,#00F5FF)',border:'1px solid ' + (guessSubmitted || room.noClueTeams?.includes(myPlayer.team) ? 'rgba(20,100,60,0.4)' : 'transparent'),color:guessSubmitted || room.noClueTeams?.includes(myPlayer.team)?'#1a5f3f':'white',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(16px,4vw,18px)',cursor:(guessSubmitted || room.noClueTeams?.includes(myPlayer.team))?'not-allowed':'pointer',opacity:(!guess.trim() || guessSubmitted || room.noClueTeams?.includes(myPlayer.team))?0.5:1}}>
                  {room.noClueTeams?.includes(myPlayer.team) ? 'Tidak Bisa Menebak' : 'Kirim Jawaban'}
                </button>
              </>
            ) : (
              <>
                <h1 style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(28px,6vw,36px)',color:'#BF5AF2',marginBottom:8}}>Menunggu Jawaban</h1>
                <p style={{color:'#8888AA',marginBottom:32,fontSize:'clamp(14px,3.5vw,16px)'}}>Penebak sedang memikirkan jawaban...</p>
                <div style={{background:'rgba(26,26,38,0.8)',border:'1px solid rgba(191,90,242,0.3)',borderRadius:20,padding:'clamp(24px,5vw,32px)',marginBottom:24}}>
                  <div style={{color:'#BF5AF2',fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(11px,2.5vw,12px)',letterSpacing:'0.1em',marginBottom:12}}>CLUE YANG KAMU BERIKAN</div>
                  <div style={{fontSize:'clamp(40px,10vw,48px)',marginBottom:16,minHeight:60,display:'flex',alignItems:'center',justifyContent:'center'}}>{teamClue || <HelpCircle size={48} color='#4A4A6A'/>}</div>
                </div>
                <div style={{background:'rgba(26,26,38,0.8)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:40,display:'flex',alignItems:'center',justifyContent:'center'}}><PulseRing color="#BF5AF2"/></div>
              </>
            )}
          </div>
        </div>
        <Skills/>
      </div>
    );
  }

  /* HOST GAME VIEW */
  if(isHost && !canHostJoin && (state === 'clue' || state === 'guess' || state === 'round_transition')) return (
    <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',flexDirection:'column'}}>
      <Header/>
      <div style={{flex:1,padding:32,display:'flex',flexDirection:'column',alignItems:'center'}}>
        <div style={{background:'rgba(255,255,255,0.03)',padding:'24px 40px',borderRadius:24,border:'1px solid rgba(255,255,255,0.05)',textAlign:'center',marginBottom:40}}>
          <div style={{color:'#8888AA',fontFamily:"'JetBrains Mono',monospace",fontSize:12,letterSpacing:'0.1em',marginBottom:8}}>CLUE SISTEM: KATEGORI <strong style={{color:'#FFD60A'}}>{room?.activeQuestion?.category?.toUpperCase()}</strong></div>
          <div style={{color:'white',fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(32px,6vw,48px)',fontWeight:700}}>{room?.activeQuestion?.answer}</div>
        </div>
        
        <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fit,minmax(250px,1fr))`,gap:24,width:'100%',maxWidth:1200}}>
          {Array.from({length:room.maxTeams}).map((_, idx) => {
            const t = idx + 1;
            const clues = room.clues[t];
            return (
              <div key={t} style={{background:'rgba(26,26,38,0.5)',borderRadius:20,padding:20,border:'1px solid rgba(255,255,255,0.05)',textAlign:'center'}}>
                <h3 style={{color:'white',fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(16px,4vw,18px)',marginBottom:16}}>Tim {t}</h3>
                <div style={{height:80,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.3)',borderRadius:16,marginBottom:12,fontSize:'clamp(28px,5vw,32px)'}}>
                  {state === 'clue' ? (clues ? <div style={{display:'flex',alignItems:'center',gap:8}}><CheckCircle size={32} color='#30D158'/> Selesai</div> : <div style={{display:'flex',alignItems:'center',gap:8}}><Clock size={32}/> Menyusun...</div>) : (clues || <div style={{display:'flex',alignItems:'center',gap:8}}><XCircle size={32} color='#FF2D78'/> Kosong</div>)}
                </div>
                <div style={{color:'#8888AA',fontSize:'clamp(11px,3vw,12px)'}}>Status Penebak: {state === 'guess' ? 'Menebak...' : 'Menunggu'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* BERSIAP - Game Start Animation */
  if(state === 'bersiap') return (
    <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <AnimatePresence mode="wait">
        <motion.div 
          key="bersiap"
          initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          style={{textAlign:'center'}}
        >
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <h1 style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(48px,12vw,100px)',background:'linear-gradient(135deg,#FFD60A,#FF2D78)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:24}}>BERSIAP!</h1>
          </motion.div>
          <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(18px,4vw,24px)',color:'#8888AA'}}>Permainan akan segera dimulai...</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  /* ROUND TRANSITION - Show round number */
  if(state === 'round_transition') return (
    <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
      <AnimatePresence mode="wait">
        {countdownNum !== null ? (
          <motion.div 
            key={`countdown-${countdownNum}`}
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 1.5, opacity: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, duration: 0.5 }}
            style={{textAlign:'center'}}
          >
            <motion.div animate={{ scale: [1, 1.3, 1], textShadow: ["0 0 0px rgba(255,214,10,0)", "0 0 30px rgba(255,214,10,0.8)", "0 0 0px rgba(255,214,10,0)"] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0 }}>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(100px,20vw,200px)',background:'linear-gradient(135deg,#FFD60A,#FF2D78)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',lineHeight:1,filter:'drop-shadow(0 0 20px rgba(255,214,10,0.5))'}}>{countdownNum}</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(12px,3vw,16px)',color:'#8888AA',marginTop:20,letterSpacing:'0.2em'}}>{countdownNum === 1 ? 'GO!' : 'GET READY'}</motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key={`round-${roundNum}`}
            initial={{ scale: 0, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: -100 }}
            transition={{ type: "spring", stiffness: 250, damping: 18, duration: 0.6 }}
            style={{textAlign:'center'}}
          >
            <motion.div animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }} transition={{ duration: 0.5, repeat: 2, repeatDelay: 0.2 }}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(16px,4vw,20px)',color:'#00F5FF',marginBottom:16,letterSpacing:'0.3em'}}>ROUND</div>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(80px,15vw,180px)',background:'linear-gradient(135deg,#00F5FF,#BF5AF2)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',lineHeight:1,filter:'drop-shadow(0 0 30px rgba(0,245,255,0.3))'}}>{roundNum}</div>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.4 }} style={{fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(16px,4vw,20px)',color:'#8888AA',marginTop:24}}>Siapkan tebakanmu!</motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* RESULT */
  if(state === 'result') {
    let maxScore = -9999;
    let winnerTeam = 1;
    for(let i=1; i<=room.maxTeams; i++) {
      if(room?.scores[i] > maxScore) { maxScore = room.scores[i]; winnerTeam = i; }
    }
    const iWon = myPlayer?.team === winnerTeam;

    return (
      <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
        <div style={{maxWidth:900,width:'100%',background:'rgba(26,26,38,0.9)',borderRadius:32,border:`1px solid ${iWon?'rgba(48,209,88,0.4)':'rgba(255,255,255,0.1)'}`,padding:'clamp(24px,5vw,40px) clamp(16px,4vw,40px)',textAlign:'center',boxShadow:'0 40px 100px rgba(0,0,0,0.8)'}}>
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} style={{display:'flex', justifyContent:'center', marginBottom:24}}>
            <Trophy size={80} color={isHost||iWon?'#FFD60A':'#4A4A6A'} />
          </motion.div>
          <h1 style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(28px,6vw,48px)',background:(isHost||iWon)?'linear-gradient(135deg,#FFD60A,#30D158)':'linear-gradient(135deg,#BF5AF2,#FF2D78)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:40}}>
            {isHost ? `TIM ${winnerTeam} MENANG!` : (iWon ? 'TIM KAMU MENANG!' : `TIM ${winnerTeam} MENANG`)}
          </h1>
          
          <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fit,minmax(140px,1fr))`,gap:20,marginBottom:40}}>
            {Array.from({length:room.maxTeams}).map((_, idx) => {
              const t = idx + 1;
              return (
                <div key={t} style={{background:'rgba(0,0,0,0.4)',padding:'clamp(16px,4vw,24px)',borderRadius:20,border:`1px solid ${winnerTeam===t?'#FFD60A':'rgba(255,255,255,0.05)'}`}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",color:'#8888AA',fontSize:'clamp(10px,2.5vw,12px)',marginBottom:8}}>TIM {t}</div>
                  <div style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(24px,5vw,32px)',color:winnerTeam===t?'#FFD60A':'white'}}>{room?.scores[t]} PTS</div>
                </div>
              );
            })}
          </div>

          <div style={{display:'flex',gap:16,justifyContent:'center', flexWrap:'wrap'}}>
            {isHost ? (
              <>
                <button onClick={playAgain} style={{height:'clamp(48px,8vw,60px)',padding:'0 clamp(24px,5vw,40px)',borderRadius:16,background:'linear-gradient(135deg,#30D158,#00F5FF)',border:'none',color:'#0A0A0F',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(14px,4vw,18px)',cursor:'pointer',display:'flex',alignItems:'center',gap:8,boxShadow:'0 8px 24px rgba(48,209,88,0.3)'}}><Users size={20}/> Kembali ke Lobby</button>
                <button onClick={closeRoom} style={{height:'clamp(48px,8vw,60px)',padding:'0 clamp(24px,5vw,40px)',borderRadius:16,background:'rgba(255,45,120,0.1)',border:'1px solid rgba(255,45,120,0.4)',color:'#FF2D78',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(14px,4vw,18px)',cursor:'pointer',display:'flex',alignItems:'center',gap:8}} onMouseOver={e=>e.currentTarget.style.background='rgba(255,45,120,0.2)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,45,120,0.1)'}><Trash2 size={20}/> Tutup Room</button>
              </>
            ) : (
              <>
                <button disabled style={{height:'clamp(48px,8vw,60px)',padding:'0 clamp(24px,5vw,40px)',borderRadius:16,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#8888AA',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(14px,4vw,18px)',cursor:'not-allowed',display:'flex',alignItems:'center',gap:8,opacity:0.7}}><Clock size={20}/> Menunggu Host...</button>
                <button onClick={leaveRoom} style={{height:'clamp(48px,8vw,60px)',padding:'0 clamp(24px,5vw,40px)',borderRadius:16,background:'rgba(255,45,120,0.1)',border:'1px solid rgba(255,45,120,0.4)',color:'#FF2D78',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(14px,4vw,18px)',cursor:'pointer',display:'flex',alignItems:'center',gap:8}} onMouseOver={e=>e.currentTarget.style.background='rgba(255,45,120,0.2)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,45,120,0.1)'}><ArrowLeft size={20}/> Keluar Room</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}