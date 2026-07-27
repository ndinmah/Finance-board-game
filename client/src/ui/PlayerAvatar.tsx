import { useState, type CSSProperties } from 'react';
import { getAccessiblePlayerInk } from './playerVisuals';

const AVATAR_BACKGROUNDS = 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf';

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return `${words[0][0]}${words.length > 1 ? words.at(-1)?.[0] ?? '' : ''}`.toLocaleUpperCase('vi-VN');
}

interface PlayerAvatarProps {
  name: string;
  color?: string;
  className?: string;
  imageClassName?: string;
  loading?: 'eager' | 'lazy';
}

export default function PlayerAvatar({
  name,
  color = '#4bd5ff',
  className = '',
  imageClassName = '',
  loading = 'lazy',
}: PlayerAvatarProps) {
  const seed = name.trim() || 'guest';
  const src = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${AVATAR_BACKGROUNDS}`;
  const [failedSrc, setFailedSrc] = useState('');
  const imageFailed = failedSrc === src;

  return (
    <span
      className={`player-avatar [--avatar-color:var(--color-brand-primary)] [--avatar-ink:#071a23] [position:relative] [display:grid] [overflow:hidden] [place-items:center] [background:radial-gradient(circle_at_30%_22%,_rgba(255,_255,_255,_0.42),_transparent_36%),_var(--avatar-color)] [color:var(--avatar-ink)] ${className}`}
      style={{
        '--avatar-color': color,
        '--avatar-ink': getAccessiblePlayerInk(color),
      } as CSSProperties}
      aria-hidden="true"
    >
      <span className="player-avatar-fallback [position:absolute] [inset:0] [display:grid] [place-items:center] [font-family:'Nunito',_sans-serif] [font-size:0.95em] [font-weight:950] [letter-spacing:0.02em] [text-transform:uppercase]">{getInitials(seed)}</span>
      {!imageFailed ? (
        <img
          className={`player-avatar-image [position:absolute] [inset:0] [width:100%] [height:100%] [display:block] [object-fit:cover] ${imageClassName}`}
          src={src}
          alt=""
          loading={loading}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
        />
      ) : null}
    </span>
  );
}
