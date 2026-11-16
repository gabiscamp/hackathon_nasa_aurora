import { t as localize } from '../../i18n/translate';
import { useState, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { RESOURCE_KEYS, SHOWN_RESOURCES, useResourceStore, type ResourceKey, type Resources } from '../../stores/useResourceStore';
import { useMissionStore, type DecisionRecord } from '../../stores/useMissionStore';
import { useGameStore } from '../../stores/useGameStore';
import { getMission } from '../../data/missions';
import { CrewStatusList } from '../panels/CrewStatusList';
import { Button } from '../ui/Button';
import { EnergyIcon, FoodIcon, OxygenIcon, RadiationIcon, WaterIcon } from '../hud/HudIcons';
import './DaySummary.css';

type Changes = Partial<Record<ResourceKey, number>>;

/** The bars the player sees (health and morale stay in the background: SHOWN_RESOURCES). */
const RESOURCE_INFO: Partial<Record<ResourceKey, { name: string; icon: ReactNode; color: string }>> = {
  food: { name: 'Food', icon: <FoodIcon size={20} />, color: '#fb923c' },
  water: { name: 'Water', icon: <WaterIcon size={20} />, color: '#4dc9f6' },
  oxygen: { name: 'Oxygen', icon: <OxygenIcon size={20} />, color: '#2ecc71' },
  radiation: { name: 'Radiation', icon: <RadiationIcon size={20} />, color: '#facc15' },
  energy: { name: 'Energy', icon: <EnergyIcon size={20} />, color: '#9b6cf2' },
};

/** Radiation is the only one where going UP is bad. */
const isGood = (key: ResourceKey, diff: number) => (key === 'radiation' ? diff < 0 : diff > 0);

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Whole numbers stay whole; small changes like 0.5 keep one decimal. */
function signed(n: number): string {
  const r = round1(Math.abs(n));
  return `${n > 0 ? '+' : '−'}${Number.isInteger(r) ? r : r.toFixed(1)}`;
}

function ChangeChips({ changes }: { changes: Changes }) {
  const shown = SHOWN_RESOURCES.filter((k) => round1(changes[k] ?? 0) !== 0);
  if (shown.length === 0) return <span className="day-chip day-chip--none">{localize("No resources changed")}</span>;
  return (
    <>
      {localize(shown.map((k) => {
        const info = RESOURCE_INFO[k];
        const diff = changes[k] ?? 0;
        return (
          <span key={k} className={`day-chip ${isGood(k, diff) ? 'day-chip--good' : 'day-chip--bad'}`}>
            <span className="day-chip__icon" style={{ color: info?.color }}>{localize(info?.icon)}</span>
            {localize(info?.name)} <strong>{localize(signed(diff))}</strong>
          </span>
        );
      }))}
    </>
  );
}

interface Entry {
  key: string;
  kind: 'mission' | 'other';
  label: string;
  title: string;
  detail?: string;
  changes: Changes;
}

function decisionEntry(d: DecisionRecord, i: number): Entry {
  const m = getMission(d.missionId);
  const choice = m?.choices.find((c) => c.id === d.choiceId)?.label.replace(/\{\w+\}/g, 'a crew member');
  return {
    key: `${d.missionId}-${i}`,
    kind: 'mission',
    label: 'Mission',
    title: m?.title ?? 'Mission',
    detail: choice ? `Your choice: ${choice}${d.success ? '' : ' (it did not work)'}` : undefined,
    changes: d.changes ?? {},
  };
}

/**
 * End-of-day report, kept simple for kids: each mission of today with what it took or gave,
 * then each bar now and what today changed. Compared with the start of the day (after the
 * morning's daily use). Gains/losses carry a sign and an arrow, never color alone.
 */
export function DaySummary({ onNext }: { onNext: () => void }) {
  const now = useResourceStore(
    useShallow((s) => ({
      food: s.food, water: s.water, energy: s.energy, oxygen: s.oxygen,
      health: s.health, satisfaction: s.satisfaction, radiation: s.radiation,
    })),
  );
  const decisions = useMissionStore((s) => s.decisions);
  const conditions = useMissionStore((s) => s.conditions);
  const dayStart = useMissionStore((s) => s.dayStart);
  const day = useGameStore((s) => s.day);
  const [fallback] = useState<Resources>(now);
  const start = dayStart ?? fallback;

  const entries = decisions.filter((d) => d.day === day).map(decisionEntry);

  // Whatever the missions don't explain (a problem left for tomorrow, a side effect…),
  // so the cards always add up to the table.
  const other: Changes = {};
  for (const k of RESOURCE_KEYS) {
    const fromMissions = entries.reduce((sum, e) => sum + (e.changes[k] ?? 0), 0);
    const rest = round1(now[k] - start[k] - fromMissions);
    if (rest !== 0) other[k] = rest;
  }
  if (SHOWN_RESOURCES.some((k) => other[k] !== undefined)) {
    entries.push({
      key: 'other',
      kind: 'other',
      label: 'Also today',
      title: 'Other changes',
      detail: 'Problems left for tomorrow and other small things on the station.',
      changes: other,
    });
  }

  return (
    <div className="panel day-summary" role="dialog" aria-modal="true" aria-labelledby="day-summary-title" data-read data-voice-story>
      <h2 id="day-summary-title" className="day-summary__title">{localize("Day ")}{localize(day)}{localize(" Complete")}</h2>

      <section className="day-summary__section">
        <h3 className="day-summary__heading">{localize("What happened")}</h3>
        {localize(entries.length === 0 ? (
          <p className="day-summary__empty">{localize("Nothing changed the resources today.")}</p>
        ) : (
          <ol className="day-summary__entries">
            {localize(entries.map((e) => (
              <li key={e.key} className={`day-entry day-entry--${e.kind}`}>
                <span className="day-entry__kind">{localize(e.label)}</span>
                <span className="day-entry__title">{localize(e.title)}</span>
                {localize(e.detail && <span className="day-entry__detail">{localize(e.detail)}</span>)}
                <span className="day-entry__chips">
                  <ChangeChips changes={e.changes} />
                </span>
              </li>
            )))}
          </ol>
        ))}
      </section>

      <section className="day-summary__section">
        <h3 className="day-summary__heading">{localize("Station resources")}</h3>
        <table className="day-table">
          <thead>
            <tr>
              <th scope="col">{localize("Resource")}</th>
              <th scope="col">{localize("Now")}</th>
              <th scope="col">{localize("Today")}</th>
            </tr>
          </thead>
          <tbody>
            {localize(SHOWN_RESOURCES.map((k) => {
              const info = RESOURCE_INFO[k];
              const diff = round1(now[k] - start[k]);
              const tone = diff === 0 ? 'same' : isGood(k, diff) ? 'good' : 'bad';
              return (
                <tr key={k} className={`day-table__row day-table__row--${tone}`}>
                  <th scope="row">
                    <span className="day-table__icon" style={{ color: info?.color }}>{localize(info?.icon)}</span>
                    {localize(info?.name)}
                  </th>
                  <td className="day-table__now">{localize(Math.round(now[k]))}</td>
                  <td className="day-table__diff">
                    {localize(diff === 0 ? 'no change' : <>{localize(diff > 0 ? '▲' : '▼')} {localize(signed(diff))}</>)}
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </section>

      {localize(conditions.length > 0 && (
        <section className="day-summary__section">
          <h3 className="day-summary__heading">{localize("Problems still going on")}</h3>
          <ul className="day-summary__problems">
            {localize(conditions.map((c) => (
              <li key={c.id}>
                {localize(c.label)}
                {localize(c.untilDay !== undefined ? ` (until Day ${c.untilDay})` : '')}
              </li>
            )))}
          </ul>
        </section>
      ))}

      <section className="day-summary__section">
        <CrewStatusList day={day + 1} title={localize("Your crew tomorrow")} />
      </section>

      <Button variant="primary" onClick={onNext} autoFocus>{localize(" Next Day ")}</Button>
    </div>
  );
}
