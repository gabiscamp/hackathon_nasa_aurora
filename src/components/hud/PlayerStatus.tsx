import { useGameStore } from '../../stores/useGameStore';
import { useResourceStore } from '../../stores/useResourceStore';
import { useCrewStore } from '../../stores/useCrewStore';
import { HudBar } from './HudBar';
import { CommanderPortrait, EnergyIcon, OxygenIcon, ShieldIcon } from './HudIcons';

/** Top-left HUD: commander portrait, day badge, resource bars and crew chips. */
export function PlayerStatus() {
  const playerName = useGameStore((s) => s.playerName);
  const day = useGameStore((s) => s.day);
  const energy = useResourceStore((s) => s.energy);
  const oxygen = useResourceStore((s) => s.oxygen);
  const shielding = useResourceStore((s) => s.shielding);
  const crew = useCrewStore((s) => s.crew);

  return (
    <div className="hud-status">
      <div className="hud-status__main">
        <div className="hud-portrait">
          <div className="hud-portrait__frame">
            <CommanderPortrait size={64} />
          </div>
          <span className="hud-portrait__badge">Day {day}</span>
        </div>

        <div className="hud-status__bars">
          <span className="hud-status__name">{playerName || 'Commander'}</span>
          <HudBar icon={<EnergyIcon />} label="Energy" value={energy} color="var(--hud-blue)" />
          <HudBar icon={<OxygenIcon />} label="Oxygen" value={oxygen} color="var(--hud-green)" />
          <HudBar icon={<ShieldIcon />} label="Shielding" value={shielding} color="var(--hud-purple)" />
        </div>
      </div>

      <ul className="hud-crew" aria-label="Crew">
        {Object.values(crew).map((member) => (
          <li key={member.id} className="hud-crew__chip" title={`${member.name} — ${member.roleLabel}`}>
            {/* TODO: replace with real asset — CHR-012..014 crew portraits */}
            <span className="hud-crew__avatar" style={{ ['--crew-color' as string]: member.color }}>
              {member.name.replace('Dr. ', '').charAt(0)}
            </span>
            <span className="hud-crew__info">
              <span className="hud-crew__name">{member.name.replace('Dr. ', '').split(' ')[0]}</span>
              <span className="hud-crew__mini" aria-label={`Health ${member.health}`}>
                <span style={{ width: `${member.health}%`, background: 'var(--hud-red)' }} />
              </span>
              <span className="hud-crew__mini" aria-label={`Morale ${member.morale}`}>
                <span style={{ width: `${member.morale}%`, background: 'var(--hud-amber)' }} />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
