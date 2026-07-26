import {
  useEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import './ModalShell.css';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const openModalStack: HTMLElement[] = [];
let bodyOverflowBeforeFirstModal = '';

interface ModalShellProps {
  children: ReactNode;
  ariaLabel: string;
  onClose?: () => void;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  style?: CSSProperties;
  zIndex?: number;
}

interface ModalCloseButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter(element => element.getClientRects().length > 0 && element.getAttribute('aria-hidden') !== 'true');
}

export function ModalCloseButton({
  onClick,
  ariaLabel = 'Đóng hộp thoại',
  className = '',
}: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      className={`modal-close-button ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span aria-hidden="true">✕</span>
    </button>
  );
}

export default function ModalShell({
  children,
  ariaLabel,
  onClose,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
  style,
  zIndex,
}: ModalShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const pointerStartedOnBackdrop = useRef(false);

  useEffect(() => {
    const shell = shellRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!shell) return;

    if (openModalStack.length === 0) {
      bodyOverflowBeforeFirstModal = document.body.style.overflow;
    }
    openModalStack.push(shell);
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => shell.focus());

    return () => {
      window.cancelAnimationFrame(focusFrame);
      const shellIndex = openModalStack.lastIndexOf(shell);
      if (shellIndex >= 0) openModalStack.splice(shellIndex, 1);

      const topModal = openModalStack.at(-1);
      if (topModal) {
        if (previousFocus?.isConnected && topModal.contains(previousFocus)) previousFocus.focus();
        else topModal.focus();
        return;
      }

      document.body.style.overflow = bodyOverflowBeforeFirstModal;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      if (onClose && closeOnEscape) {
        event.preventDefault();
        onClose();
      }
      return;
    }
    if (event.key !== 'Tab') return;

    const shell = shellRef.current;
    if (!shell) return;
    const focusable = getFocusableElements(shell);
    if (focusable.length === 0) {
      event.preventDefault();
      shell.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !shell.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || active === shell)) {
      event.preventDefault();
      first.focus();
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStartedOnBackdrop.current = event.target === event.currentTarget;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const endedOnBackdrop = event.target === event.currentTarget;
    if (pointerStartedOnBackdrop.current && endedOnBackdrop && onClose && closeOnBackdrop) {
      onClose();
    }
    pointerStartedOnBackdrop.current = false;
  };

  return (
    <div
      ref={shellRef}
      className={`modal-shell ${className}`}
      style={{ ...style, zIndex: zIndex ?? style?.zIndex }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      tabIndex={-1}
      data-modal-backdrop=""
      data-backdrop-dismissible={Boolean(onClose && closeOnBackdrop)}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStartedOnBackdrop.current = false;
      }}
    >
      {children}
    </div>
  );
}
