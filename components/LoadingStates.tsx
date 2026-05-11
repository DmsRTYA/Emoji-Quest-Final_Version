'use client';
import React from 'react';

export function BarLoader({ color='#00F5FF', label }: { color?:string; label?:string }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
      <div style={{display:'flex',alignItems:'flex-end',gap:5,height:32}}>
        {[0,1,2,3,4].map(i=>(
          <div key={i} style={{width:4,borderRadius:2,background:`linear-gradient(to top,${color}55,${color})`,animation:`barB 1s ease-in-out ${i*0.12}s infinite`,transformOrigin:'bottom'}} />
        ))}
      </div>
      {label&&<p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:'0.18em',textTransform:'uppercase',color:'#4A4A6A'}}>{label}</p>}
      <style>{`@keyframes barB{0%,100%{height:8px}50%{height:28px}}`}</style>
    </div>
  );
}

export function PulseRing({ size=80, color='#00F5FF', label }: { size?:number; color?:string; label?:string }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20}}>
      <div style={{position:'relative',width:size,height:size}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{position:'absolute',inset:`${i*(size/6)}px`,borderRadius:'50%',border:`1.5px solid ${color}`,opacity:0,animation:`pRing 1.8s ease-out ${i*0.4}s infinite`}} />
        ))}
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:size*0.22,height:size*0.22,borderRadius:'50%',background:color,boxShadow:`0 0 ${size*0.3}px ${color}88`}} />
      </div>
      {label&&<p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,letterSpacing:'0.2em',textTransform:'uppercase',color:'#8888AA',animation:'ftPulse 2s ease-in-out infinite'}}>{label}</p>}
      <style>{`@keyframes pRing{0%{transform:scale(0.6);opacity:0.8}100%{transform:scale(1);opacity:0}}@keyframes ftPulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
    </div>
  );
}

export function PageLoader({ label='Loading...' }: { label?:string }) {
  return (
    <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:32}}>
      <div style={{width:56,height:56,borderRadius:16,background:'linear-gradient(135deg,rgba(0,245,255,0.12),rgba(191,90,242,0.12))',border:'1px solid rgba(0,245,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 32px rgba(0,245,255,0.1)',animation:'logoG 2s ease-in-out infinite'}}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <polygon points="14,3 25,14 14,25 3,14" fill="none" stroke="#00F5FF" strokeWidth="1.5" opacity="0.9"/>
          <polygon points="14,7 21,14 14,21 7,14" fill="#00F5FF" opacity="0.25"/>
          <circle cx="14" cy="14" r="2.5" fill="#00F5FF"/>
        </svg>
      </div>
      <BarLoader color="#00F5FF" />
      <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:'0.25em',textTransform:'uppercase',color:'#4A4A6A'}}>{label}</p>
      <style>{`@keyframes logoG{0%,100%{box-shadow:0 0 32px rgba(0,245,255,0.1)}50%{box-shadow:0 0 48px rgba(0,245,255,0.25)}}`}</style>
    </div>
  );
}

export function InlineLoader({ size=18, color='#0A0A0F' }: { size?:number; color?:string }) {
  return <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,border:`2px solid ${color}22`,borderTopColor:color,animation:'spin 0.7s linear infinite'}} />;
}
