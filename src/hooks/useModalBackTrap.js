import { useEffect, useRef } from 'react';

/**
 * Universal hook to handle browser / mobile hardware Back button for modals and drawers.
 * Pushes a history entry when modal opens, and closes modal when Back is pressed
 * instead of exiting the application.
 *
 * StrictMode-safe: Uses deferred history.back() and unique trapKey so React 18
 * development mode double-effect cycles never trigger premature popstate and close the modal.
 */
export function useModalBackTrap(isOpen, onClose) {
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const backTimeoutRef = useRef(null);
  onCloseRef.current = onClose;

  useEffect(() => {
    // 1. Cancel any pending deferred history.back() from StrictMode simulated unmount
    if (backTimeoutRef.current) {
      clearTimeout(backTimeoutRef.current);
      backTimeoutRef.current = null;
    }

    if (!isOpen) {
      if (isPushedRef.current) {
        const pushedKey = isPushedRef.current;
        isPushedRef.current = false;
        if (typeof window !== 'undefined' && window.history.state && (window.history.state.trapKey === pushedKey || window.history.state.modalBackTrap)) {
          try {
            window.history.back();
          } catch {}
        }
      }
      return;
    }

    // 2. If already pushed and still active (e.g. StrictMode remount in same cycle), reuse existing trapKey
    let currentTrapKey = typeof isPushedRef.current === 'string' ? isPushedRef.current : null;
    if (!currentTrapKey) {
      currentTrapKey = 'trap_' + Math.random().toString(36).slice(2, 9);
      isPushedRef.current = currentTrapKey;
      try {
        window.history.pushState(
          { modalBackTrap: true, sellerOrderModalOpen: true, trapKey: currentTrapKey },
          '',
          window.location.href
        );
      } catch {}
    }

    const handlePopState = () => {
      if (isPushedRef.current) {
        // Browser has already popped this entry
        isPushedRef.current = false;
        if (typeof onCloseRef.current === 'function') {
          onCloseRef.current();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      const pushedKey = isPushedRef.current;
      if (pushedKey) {
        // Defer history.back() so React StrictMode (dev) immediate remount can cancel it
        backTimeoutRef.current = setTimeout(() => {
          isPushedRef.current = false;
          if (typeof window !== 'undefined' && window.history.state && (window.history.state.trapKey === pushedKey || window.history.state.modalBackTrap)) {
            try {
              window.history.back();
            } catch {}
          }
        }, 80);
      }
    };
  }, [isOpen]);
}

export default useModalBackTrap;
