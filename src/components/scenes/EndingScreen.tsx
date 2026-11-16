import { t as localize } from '../../i18n/translate';
import { Button } from '../ui/Button';
import { COLLAPSE_ENDINGS, ENDINGS } from '../../data/endings';
import { getMission } from '../../data/missions';
import { calculateEnding } from '../../engine/endingCalculator';
import { stationScore, type ResourceKey, type Resources } from '../../stores/useResourceStore';
import { useMissionStore, type DecisionRecord } from '../../stores/useMissionStore';
import './EndingScreen.css';

interface EndingScreenProps {
  playerName: string;
  resources: Resources;
  onReplay: () => void;
  onOpenCredits: () => void;
  /** Day "Try again" goes back to after a game over (null = no checkpoint). */
  retryDay: number | null;
  onRetry: () => void;
}

// TODO: replace with real asset — emoji icons on the ending screen.
const ENDING_ICONS: Record<string, string> = { good: '🎉', medium: '😮‍💨', bad: '💪', collapse: '🚨' };
const ENDING_STATS = [
  { key: 'food', icon: '🍎', label: 'Food' },
  { key: 'water', icon: '💧', label: 'Water' },
  { key: 'oxygen', icon: '🫁', label: 'Oxygen' },
  { key: 'radiation', icon: '☢️', label: 'Radiation' },
  { key: 'energy', icon: '⚡', label: 'Energy' },
] as const;

/** How much a decision hurt these bars (radiation going up counts as a loss). */
function harm(d: DecisionRecord, keys: readonly ResourceKey[]): number {
  let total = 0;
  for (const k of keys) {
    const v = d.changes?.[k] ?? 0;
    total += k === 'radiation' ? Math.max(0, v) : Math.max(0, -v);
  }
  return total;
}

/** The three decisions that cost the most of what ran out. */
function worstDecisions(decisions: DecisionRecord[], keys: readonly ResourceKey[]): string[] {
  return [...decisions]
    .filter((d) => harm(d, keys) > 0)
    .sort((a, b) => harm(b, keys) - harm(a, keys))
    .slice(0, 3)
    .flatMap((d) => {
      const m = getMission(d.missionId);
      const c = m?.choices.find((x) => x.id === d.choiceId);
      if (!m || !c) return [];
      const label = c.label.replace(/\{\w+\}/g, 'a crew member');
      return [`Day ${d.day}, ${m.title}: "${label}"${d.success ? '' : ' (it failed)'}`];
    });
}

export function EndingScreen({ playerName, resources, onReplay, onOpenCredits, retryDay, onRetry }: EndingScreenProps) {
  const collapse = useMissionStore((s) => s.collapse);
  const decisions = useMissionStore((s) => s.decisions);
  const endingType = calculateEnding(resources, collapse);
  const avg = Math.round(stationScore(resources));
  const lost = collapse ? COLLAPSE_ENDINGS[collapse.cause] : null;
  const ending = ENDINGS.find((e) => e.id === endingType);
  const title = lost ? lost.title : ending?.title ?? '';
  const description = (lost ? lost.description : ending?.description ?? '')
    .replace('{name}', playerName)
    .replace('{day}', String(collapse?.day ?? ''));
  const worst = lost ? worstDecisions(decisions, lost.related) : [];

  return (
    <main className={`ending-screen ${lost ? 'ending-screen--lost' : ''}`}>
      <div className="ending-container animate-fadeIn" data-read data-voice-story>
        <div className="ending-icon" aria-hidden="true">{localize(ENDING_ICONS[endingType])}</div>
        {localize(lost && <p className="ending-gameover">{localize("Game over")}</p>)}
        <h1 className="ending-title">{localize(title)}</h1>
        <p className="ending-desc">{localize(description)}</p>

        {localize(lost && (
          <section className="ending-lost">
            {localize(collapse && collapse.reasons.length > 0 && (
              <>
                <h2>{localize("What was hurting the station")}</h2>
                <ul>
                  {localize(collapse.reasons.map((r) => (
                    <li key={r}>{localize(r)}</li>
                  )))}
                </ul>
              </>
            ))}
            {localize(worst.length > 0 && (
              <>
                <h2>{localize("Decisions that cost the most")}</h2>
                <ul>
                  {localize(worst.map((w) => (
                    <li key={w}>{localize(w)}</li>
                  )))}
                </ul>
              </>
            ))}
            <p className="ending-tip">
              <strong>{localize("Next time:")}</strong> {localize(lost.tip)}
            </p>
          </section>
        ))}

        <div className="ending-stats">
          {localize(ENDING_STATS.map((stat) => (
            <div key={stat.key} className="ending-stat">
              <span className="ending-stat-icon" aria-hidden="true">{localize(stat.icon)}</span>
              <span className="ending-stat-label">{localize(stat.label)}</span>
              <span className="ending-stat-value">{localize(Math.round(resources[stat.key]))}%</span>
            </div>
          )))}
          {localize(!lost && (
            <div className="ending-stat overall">
              <span className="ending-stat-icon" aria-hidden="true">📊</span>
              <span className="ending-stat-label">{localize("Overall")}</span>
              <span className="ending-stat-value">{localize(avg)}%</span>
            </div>
          ))}
        </div>

        <div className="ending-nasa-box">
          {localize(lost ? (
            <p>{localize(lost.fact)}</p>
          ) : (
            <>
              <h3>{localize("🚀 You just lived what real astronauts face!")}</h3>
              <p>{localize(" Everything in this game was based on real events from NASA missions: Apollo 13, MIR, the International Space Station, and the CHAPEA Mars simulation. ")}</p>
            </>
          ))}
          <p className="ending-source">{localize(" Data sources: NASA DONKI, NASA ECLSS, NASA OSDR ")}</p>
          <button type="button" className="ending-credits" onClick={onOpenCredits}>{localize(" See credits & NASA sources ")}</button>
        </div>

        <div className="ending-actions">
          {localize(lost && retryDay !== null && (
            <Button variant="primary" size="lg" icon="⏪" onClick={onRetry}>{localize(" Try again from Day ")}{localize(retryDay)}
            </Button>
          ))}
          <Button variant={lost && retryDay !== null ? 'secondary' : 'primary'} size="lg" icon="🔄" onClick={onReplay}>
            {localize(endingType === 'good' ? 'Play Again' : lost ? 'Start a new mission' : 'Try a Different Strategy')}
          </Button>
        </div>
      </div>
    </main>
  );
}
