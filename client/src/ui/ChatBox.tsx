import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';
import './ChatBox.css';

export default function ChatBox() {
  const { chat, myPlayerId, players } = useGameStore();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [lastReadIndex, setLastReadIndex] = useState(chat.length);
  const bottomRef = useRef<HTMLDivElement>(null);

  if (open && lastReadIndex < chat.length) {
    setLastReadIndex(chat.length);
  }
  
  const unread = Math.max(0, chat.length - lastReadIndex);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, open]);

  const handleOpen = () => { setOpen(true); setLastReadIndex(chat.length); };

  const handleSend = () => {
    if (!text.trim()) return;
    send('chat', { text: text.trim() });
    setText('');
  };

  return (
    <div className={`chat-widget ${open ? 'open' : ''}`}>
      {!open ? (
        <button className="chat-toggle" onClick={handleOpen} id="btn-chat-open">
          💬 Chat {unread > 0 && <span className="unread-badge">{unread}</span>}
        </button>
      ) : (
        <div className="chat-panel">
          <div className="chat-header">
            <span>💬 Chat</span>
            <button id="btn-chat-close" className="chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chat-messages">
            {chat.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.playerId === myPlayerId ? 'mine' : 'theirs'}`}>
                <span className="msg-author"
                  style={{ color: players.get(msg.playerId)?.color || '#aaa' }}>
                  {msg.playerName}
                </span>
                <span className="msg-text">{msg.text}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input">
            <input
              id="chat-input"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Nhập tin nhắn..."
              maxLength={200}
            />
            <button id="btn-chat-send" onClick={handleSend}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}
