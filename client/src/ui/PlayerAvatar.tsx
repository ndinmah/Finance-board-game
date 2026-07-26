import { useState, type CSSProperties } from 'react';
import { getAccessiblePlayerInk } from './playerVisuals';
import './PlayerAvatar.css';

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
      className={`player-avatar ${className}`}
      style={{
        '--avatar-color': color,
        '--avatar-ink': getAccessiblePlayerInk(color),
      } as CSSProperties}
      aria-hidden="true"
    >
      <span className="player-avatar-fallback">{getInitials(seed)}</span>
      {!imageFailed ? (
        <img
          className={`player-avatar-image ${imageClassName}`}
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
