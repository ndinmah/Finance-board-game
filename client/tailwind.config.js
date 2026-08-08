/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(32px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        bounceAlt: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        floatBounce: {
          'from': { opacity: '0', transform: 'translate(-50%, -42%) scale(0.9)' },
          'to': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        slideUpCenter: {
          'from': { opacity: '0', transform: 'translate(-50%, 20px)' },
          'to': { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        dieSpin: {
          '0%': { transform: 'rotate(0) scale(1.15)' },
          '100%': { transform: 'rotate(15deg) scale(1.1)' },
        },
        doubleGlow: {
          '0%': { filter: 'drop-shadow(0 0 2px transparent)' },
          '100%': { filter: 'drop-shadow(0 0 16px #f5c518)' },
        },
        btnPulse: {
          '0%, 100%': { boxShadow: '0 6px 20px rgba(245, 197, 24, 0.4)', transform: 'scale(1)' },
          '50%': { boxShadow: '0 8px 30px rgba(245, 197, 24, 0.7)', transform: 'scale(1.02)' },
        },
        fadeSlide: {
          'from': { opacity: '0', transform: 'translateX(8px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        cardModalSlide: {
          'from': { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          'to': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        winnerSlide: {
          'from': { opacity: '0', transform: 'scale(0.7)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        trophyBounce: {
          '0%, 100%': { transform: 'rotate(-8deg) scale(1)' },
          '50%': { transform: 'rotate(8deg) scale(1.12)' },
        },
        appSpin: {
          'to': { transform: 'rotate(1turn)' },
        },
        rotateHint: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '40%, 60%': { transform: 'rotate(90deg)' },
        },
        lobbyShellEnter: {
          'from': { opacity: '0', transform: 'translateY(1.2rem) scale(0.985)' },
          'to': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        gameStatusPulse: {
          '50%': { opacity: '0.48', transform: 'scale(0.78)' },
        },
        gameDieSpin: {
          'from': { transform: 'rotate(-8deg) scale(1.05)' },
          'to': { transform: 'rotate(10deg) scale(0.96)' },
        },
        gameDiceArrive: {
          'from': { opacity: '0', transform: 'translateY(0.8rem) scale(0.92)' },
        },
        gameEventEnter: {
          'from': { opacity: '0', transform: 'translateX(0.5rem)' },
        },
        gameMoneyChange: {
          '0%': { opacity: '0', transform: 'translate(-50%, 0.35rem) scale(0.82)' },
          '18%': { opacity: '1', transform: 'translate(-50%, -0.2rem) scale(1.08)' },
          '72%': { opacity: '1', transform: 'translate(-50%, -1.15rem) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(-50%, -1.8rem) scale(0.96)' },
        },
      },
      animation: {
        'slide-up': 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bounce-alt': 'bounceAlt 2s ease-in-out infinite',
        'float-bounce': 'floatBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'slide-up-center': 'slideUpCenter 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        'die-spin': 'dieSpin 0.06s linear infinite',
        'double-glow': 'doubleGlow 0.6s ease-in-out infinite alternate',
        'btn-pulse': 'btnPulse 2s infinite',
        'fade-slide': 'fadeSlide 0.3s ease',
        'card-modal-slide': 'cardModalSlide 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'winner-slide': 'winnerSlide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'trophy-bounce': 'trophyBounce 1s ease-in-out infinite',
        'app-spin': 'appSpin 850ms linear infinite',
        'rotate-hint': 'rotateHint 2s ease-in-out infinite',
        'lobby-shell-enter': 'lobbyShellEnter 360ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'game-status-pulse': 'gameStatusPulse 1.3s ease-in-out infinite',
        'game-die-spin': 'gameDieSpin 130ms ease-in-out infinite alternate',
        'game-dice-arrive': 'gameDiceArrive 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        'game-event-enter': 'gameEventEnter 240ms cubic-bezier(0.22, 1, 0.36, 1)',
        'game-money-change': 'gameMoneyChange 1.6s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      colors: {
        bg: '#0d1b3e',
        bg2: '#162040',
        surface: '#1e2d5a',
        surface2: '#253470',
        border: 'rgba(74,144,217,0.25)',
        accent: '#4a90d9',
        accent2: '#7ec8e3',
        gold: '#f5c518',
        green: '#2ecc71',
        red: '#e74c3c',
        text: '#e8f0ff',
        text2: '#8faad4',
      }
    },
  },
  plugins: [],
}
