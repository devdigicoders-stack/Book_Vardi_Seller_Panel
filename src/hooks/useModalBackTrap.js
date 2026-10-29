import { useEffect, useRef } from 'react';

/**
 * Universal hook to handle browser / mobile hardware Back button for modals and drawers.
 * Pushes a history entry when modal opens, and closes modal when Back is pressed
 * instead of exiting the application.
 */
export function useModalBackTrap(isOpen, onClose) {
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        // Clean up history state if closed via button / cancel rather than browser back
        if (typeof window !== 'undefined' && window.history.state && (window.history.state.modalBackTrap || window.history.state.sellerOrderModalOpen)) {
          try {
            window.history.back();
          } catch {}
        }
      }
      return;
    }

    // Modal just opened: Push a lightweight history entry
    isPushedRef.current = true;
    try {
      window.history.pushState({ modalBackTrap: true, sellerOrderModalOpen: true }, '', window.location.href);
    } catch {}

    const handlePopState = () => {
      if (isPushedRef.current) {
        // User pressed browser/hardware back button!
        // Browser has already popped this entry, so mark false so cleanup doesn't double-pop
        isPushedRef.current = false;
        if (typeof onCloseRef.current === 'function') {
          onCloseRef.current();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (isPushedRef.current) {
        isPushedRef.current = false;
        if (typeof window !== 'undefined' && window.history.state && (window.history.state.modalBackTrap || window.history.state.sellerOrderModalOpen)) {
          try {
            window.history.back();
          } catch {}
        }
      }
    };
  }, [isOpen]);
}

export default useModalBackTrap;
