import { t as localize } from '../../i18n/translate';
import { useNarrativeStore } from '../../stores/useNarrativeStore';
import { TypeWriter } from '../ui/TypeWriter';
import { Button } from '../ui/Button';

export function DialogueBox() {
  const currentDialogue = useNarrativeStore((s) => s.currentDialogue);
  const advance = useNarrativeStore((s) => s.advance);

  if (!currentDialogue) return null;

  return (
    <div
      className="panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-control-speaker"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
        borderTop: '2px solid var(--accent-blue)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
        <span style={{ fontSize: '2rem' }}>📡</span>
        <div style={{ flex: 1 }}>
          <div id="mission-control-speaker" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 'var(--space-xs)' }}>{localize(" Mission Control ")}</div>
          <TypeWriter text={localize(currentDialogue)} speed={25} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={advance}>{localize(" Continue ")}</Button>
      </div>
    </div>
  );
}
