export default function MoneyIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="1.4em" height="1.4em" viewBox="0 0 32 32" style={{ display: 'inline-block', verticalAlign: 'text-bottom', filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.25))' }}>
      
      {/* Bottom Stack (Rotated Left) */}
      <g transform="translate(16, 18) rotate(-15) translate(-16, -18)">
        {/* Thickness (Side) */}
        <rect x="4" y="15" width="26" height="12" rx="1.5" fill="#33691e" />
        {/* Top face */}
        <rect x="4" y="12" width="26" height="12" rx="1.5" fill="#7cb342" />
        {/* Inner border */}
        <rect x="5.5" y="13.5" width="23" height="9" rx="1" fill="#558b2f" />
        {/* Dollar sign circle */}
        <circle cx="17" cy="18" r="3" fill="#8bc34a" />
        <text x="17" y="20.2" fontSize="6" fill="#1b5e20" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">$</text>
      </g>
      
      {/* Top Stack (Rotated Right) */}
      <g transform="translate(16, 14) rotate(10) translate(-16, -14)">
        {/* Thickness (Side) */}
        <rect x="2" y="12" width="28" height="14" rx="2" fill="#2e7d32" />
        {/* Top face */}
        <rect x="2" y="9" width="28" height="14" rx="2" fill="#8bc34a" />
        {/* Inner border */}
        <rect x="4" y="11" width="24" height="10" rx="1" fill="#689f38" />
        {/* Dollar sign circle */}
        <circle cx="21" cy="16" r="3.5" fill="#aed581" />
        <text x="21" y="18.5" fontSize="7" fill="#1b5e20" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">$</text>
        
        {/* Band Side (Thickness) */}
        <rect x="8" y="23" width="6" height="3" fill="#f57f17" />
        {/* Band Top */}
        <rect x="8" y="9" width="6" height="14" fill="#fbc02d" />
        <line x1="8" y1="16" x2="14" y2="16" stroke="#f57f17" strokeWidth="0.5" />
      </g>
    </svg>
  );
}
