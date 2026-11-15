import { useGameStore } from '../../stores/useGameStore';
import { useResourceStore } from '../../stores/useResourceStore';
import { useCrewStore } from '../../stores/useCrewStore';
import { getTeam } from '../../data/crews';
import { ASTRONAUT_PHOTOS } from '../../data/astronautPhotos';
import { HudBar } from './HudBar';
import { CommanderPortrait, EnergyIcon, OxygenIcon, ShieldIcon } from './HudIcons';

function FoodIcon() {
  return <span style={{ fontSize: 14 }}>🍽</span>;
}
function WaterIcon() {
  return <span style={{ fontSize: 14 }}>💧</span>;
}
function HealthIcon() {
  return <span style={{ fontSize: 14 }}>❤️</span>;
}
function SatisfactionIcon() {
  return <span style={{ fontSize: 14 }}>😊</span>;
}
function RadiationIcon() {
  return <span style={{ fontSize: 14 }}>☢️</span>;
}

export function PlayerStatus() {
  const playerName = useGameStore((s) => s.playerName);
  const day = useGameStore((s) => s.day);
  const food = useResourceStore((s) => s.food);
  const water = useResourceStore((s) => s.water);
  const energy = useResourceStore((s) => s.energy);
  const oxygen = useResourceStore((s) => s.oxygen);
  const health = useResourceStore((s) => s.health);
  const satisfaction = useResourceStore((s) => s.satisfaction);
  const radiation = useResourceStore((s) => s.radiation);
  const crew = useCrewStore((s) => s.crew);
  const crewId = useGameStore((s) => s.crewId);
  const commanderPhoto = crewId ? getTeam(crewId).commander.photo : undefined;
  // Older saves have no photo field: look it up from the name's astronaut id.
  const photoOf = (name: string, photo?: string) =>
    photo ?? Object.entries(ASTRONAUT_PHOTOS).find(([id]) => name.toLowerCase().includes(id))?.[1].src;

  return (
    <div className="hud-status">
      <div className="hud-status__main">
        <div className="hud-portrait">
          <div className="hud-portrait__frame">
            {commanderPhoto ? <img src={commanderPhoto} alt="" /> : <CommanderPortrait size={76} />}
          </div>
          <span className="hud-portrait__badge">Day {day}/90</span>
        </div>

        <div className="hud-status__bars">
          <span className="hud-status__name">{playerName || 'Commander'}</span>
          <HudBar icon={<FoodIcon />} label="Food" value={food} color="#e67e22" />
          <HudBar icon={<WaterIcon />} label="Water" value={water} color="#3498db" />
          <HudBar icon={<EnergyIcon />} label="Energy" value={energy} color="var(--hud-blue)" />
          <HudBar icon={<OxygenIcon />} label="Oxygen" value={oxygen} color="var(--hud-green)" />
          <HudBar icon={<HealthIcon />} label="Health" value={health} color="#e74c3c" />
          <HudBar icon={<SatisfactionIcon />} label="Satisfaction" value={satisfaction} color="#f1c40f" />
          <HudBar icon={<RadiationIcon />} label="Radiation" value={radiation} color="#9b59b6" />
        </div>
      </div>

      <ul className="hud-crew" aria-label="Crew">
        {Object.values(crew).map((member) => (
          <li key={member.id} className="hud-crew__chip" title={`${member.name} — ${member.roleLabel}`}>
            <span className="hud-crew__avatar" style={{ ['--crew-color' as string]: member.color }}>
              {photoOf(member.name, member.photo) ? (
                <img src={photoOf(member.name, member.photo)} alt="" />
              ) : (
                member.name.charAt(0)
              )}
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
