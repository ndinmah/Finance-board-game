import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';

export default function ChatBox() {
  const { chat, myPlayerId, players } = useGameStore();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(0);

  useEffect(() => {
    if (!open && chat.length > prevLenRef.current) setUnread(u => u + 1);
    prevLenRef.current = chat.length;
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, open]);

  const handleOpen = () => { setOpen(true); setUnread(0); };

  const handleSend = () => {
    if (!text.trim()) return;
    send('chat', { text: text.trim() });
    setText('');
  };

  return (
    <div className="absolute bottom-3 right-3 pointer-events-auto">
      {!open ? (
        <button className="bg-[rgba(13,27,62,0.85)] backdrop-blur-sm border-[1.5px] border-[rgba(74,144,217,0.3)] text-[#e8f0ff] text-[13px] font-semibold px-3.5 py-2 rounded-[10px] relative cursor-pointer transition-colors duration-150 hover:border-accent" onClick={handleOpen} id="btn-chat-open">
          💬 Chat {unread > 0 && <span className="absolute -top-1.5 -right-1.5 bg-[#e74c3c] text-white text-[10px] font-extrabold w-[18px] h-[18px] rounded-full flex items-center justify-center">{unread}</span>}
        </button>
      ) : (
        <div className="w-[280px] bg-[rgba(13,27,62,0.92)] backdrop-blur-md border-[1.5px] border-[rgba(74,144,217,0.25)] rounded-t-[16px] rounded-b-none flex flex-col shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center px-3.5 pt-3 pb-2.5 border-b border-[rgba(74,144,217,0.15)] font-bold text-[14px] text-[#e8f0ff]">
            <span>💬 Chat</span>
            <button id="btn-chat-close" className="bg-[rgba(255,255,255,0.08)] text-[#8faad4] text-[12px] px-2 py-1 rounded-md cursor-pointer border-none hover:bg-[rgba(255,255,255,0.15)]" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="h-[200px] overflow-y-auto p-2.5 flex flex-col gap-1.5 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[rgba(74,144,217,0.3)] [&::-webkit-scrollbar-thumb]:rounded-[3px]">
            {chat.map((msg, i) => {
              const isMine = msg.playerId === myPlayerId;
              return (
                <div key={i} className={`flex flex-col gap-0.5 ${isMine ? 'items-end' : ''}`}>
                  <span className="text-[11px] font-bold"
                    style={{ color: players.get(msg.playerId)?.color || '#aaa' }}>
                    {msg.playerName}
                  </span>
                  <span className={`rounded-lg px-2.5 py-1.5 text-[13px] max-w-[90%] break-words text-[#e8f0ff] ${isMine ? 'bg-[rgba(74,144,217,0.25)] border border-[rgba(74,144,217,0.3)]' : 'bg-[rgba(255,255,255,0.07)]'}`}>{msg.text}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div className="flex gap-1.5 p-2.5 border-t border-[rgba(74,144,217,0.15)]">
            <input
              id="chat-input"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Nhập tin nhắn..."
              maxLength={200}
              className="flex-1 text-[13px] px-2.5 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border-[1.5px] border-[rgba(74,144,217,0.25)] text-[#e8f0ff] outline-none focus:border-accent"
            />
            <button id="btn-chat-send" className="bg-accent text-white text-[15px] px-3 py-2 rounded-lg border-none cursor-pointer hover:bg-[#3b82f6]" onClick={handleSend}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}
