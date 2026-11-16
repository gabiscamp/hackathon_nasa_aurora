import { useEffect, useRef } from 'react';
import './GameMenus.css';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Asks before an action that leaves the current screen (Nielsen: error prevention).
 * Focus starts on the safe choice; Esc cancels, Enter confirms.
 */
export function ConfirmDialog({ title, message, confirmLabel, cancelLabel = 'Stay here', onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onCancel();
      }
    };
    // Capture phase so the screen behind does not also react to Esc.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onCancel]);

  return (
    <div
      className="gm-backdrop gm-backdrop--top"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="gm-confirm-title"
      aria-describedby="gm-confirm-text"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="gm-card gm-card--warn">
        <h2 id="gm-confirm-title" className="gm-title">{title}</h2>
        <p id="gm-confirm-text" className="gm-text">{message}</p>
        <div className="gm-actions">
          <button ref={cancelRef} type="button" className="gm-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="gm-btn gm-btn--primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
