import { useEffect, useState } from 'react';

export const MAX_INVENTORY_SLOTS = 5;

/** Bottom-center HUD: 5 hotbar slots, selectable with keys 1–5 or a click. */
export function InventoryBar() {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= MAX_INVENTORY_SLOTS) setSelected(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="hud-inventory" role="toolbar" aria-label="Inventory">
      {Array.from({ length: MAX_INVENTORY_SLOTS }, (_, i) => (
        <button
          key={i}
          type="button"
          className={`hud-slot ${i === selected ? 'hud-slot--active' : ''} hud-slot--empty`}
          onClick={() => setSelected(i)}
          title="Empty slot"
          aria-pressed={i === selected}
        >
          {/* Items will render here once the inventory store exists (UI-010..015) */}
          <span className="hud-slot__key">{i + 1}</span>
        </button>
      ))}
    </div>
  );
}
