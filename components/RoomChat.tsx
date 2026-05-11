'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { getSocket } from '@/lib/socket';

interface ChatMsg {
  id: number; userId: number; username: string; message: string; time: number;
}

interface Props {
  roomId: string;
  userId: number;
  username: string;
  onClose?: () => void;
}

export default function RoomChat({ roomId, userId, username, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState<{ userId: number; username: string } | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleChat = (msg: ChatMsg) => setMessages(prev => [...prev.slice(-49), msg]);
    const handleTyping = (data: { userId: number; username: string; isTyping: boolean }) => {
      if (data.userId === userId) return;
      if (data.isTyping) setTyping({ userId: data.userId, username: data.username });
      else setTyping(null);
    };

    socket.on('chat_message', handleChat);
    socket.on('typing', handleTyping);

    // Load existing messages from room state if available
    socket.on('room_update', (data: any) => {
      const r = data.room || data;
      if (r.chatHistory) setMessages(r.chatHistory);
    });

    return () => {
      socket.off('chat_message', handleChat);
      socket.off('typing', handleTyping);
      socket.off('room_update');
    };
  }, [roomId, userId]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim().slice(0, 200);
    if (!text) return;
    const socket = getSocket();
    socket.emit('send_chat', { message: text });
    setInput('');
    setTyping(null);
  };

  const handleInput = (val: string) => {
    setInput(val);
    const socket = getSocket();
    socket.emit('typing', { isTyping: val.length > 0 });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('typing', { isTyping: false }), 2000);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>💬 Chat Room</span>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <X size={16} />
          </button>
        )}
      </div>

      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: "'General Sans',sans-serif", fontSize: 13, padding: '24px 0' }}>
            Belum ada pesan. Ajak teman-teman ngobrol!
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 600, fontSize: 12, color: msg.userId === userId ? 'var(--cyan)' : 'var(--gold)' }}>
                  {msg.userId === userId ? 'Kamu' : msg.username}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'var(--text-muted)' }}>
                  {new Date(msg.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontFamily: "'General Sans',sans-serif", fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.4 }}>{msg.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontFamily: "'General Sans',sans-serif", fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {typing.username} sedang mengetik...
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--divider)', display: 'flex', gap: 8 }}>
        <input type="text" value={input} onChange={e => handleInput(e.target.value)} placeholder="Ketik pesan..."
          onKeyDown={e => e.key === 'Enter' && sendMessage()} maxLength={200}
          className="inp" style={{ flex: 1, height: 40, padding: '0 14px', borderRadius: 10 }} />
        <motion.button whileTap={{ scale: 0.9 }} onClick={sendMessage} disabled={!input.trim()}
          style={{ width: 40, height: 40, borderRadius: 10, background: input.trim() ? 'linear-gradient(135deg,var(--cyan),var(--purple))' : 'var(--hover-bg)', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: input.trim() ? 1 : 0.4 }}>
          <Send size={16} color={input.trim() ? 'white' : 'var(--text-muted)'} />
        </motion.button>
      </div>
    </div>
  );
}
