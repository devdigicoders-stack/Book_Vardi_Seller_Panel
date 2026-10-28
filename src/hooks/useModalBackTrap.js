import { useEffect, useRef } from 'react';

/**
 * Universal hook to handle browser / mobile hardware Back button for modals and drawers in Seller Panel.
 * Pushes a history entry when modal opens, and closes modal when Back is pressed
 * instead of exiting the portal.
 */
export function useModalBackTrap(isOpen, onClose) {
  const isPushedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        // Clean up history state if closed via button / cancel rather than browser back
        if (typeof window !== 'undefined' && window.history.state && window.history.state.sellerModalOpen) {
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
      window.history.pushState({ sellerModalOpen: true }, '', window.location.href);
    } catch {}

    const handlePopState = (e) => {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        if (typeof onClose === 'function') {
          onClose();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);
}

export default useModalBackTrap;

