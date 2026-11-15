import { useMissionStore } from '../../stores/useMissionStore';
import { useResourceStore } from '../../stores/useResourceStore';
import { useCrewStore } from '../../stores/useCrewStore';
import { useGameStore } from '../../stores/useGameStore';
import { useNarrativeStore } from '../../stores/useNarrativeStore';
import { resolveChoice } from '../../engine/eventResolver';
import { applyConsequences } from '../../engine/resourceEngine';
import { Button } from '../ui/Button';
import { CREW_ROLES } from '../../data/crew';

export function CommandConsole() {
  const mission = useMissionStore((s) => s.currentMission);
  const completeMission = useMissionStore((s) => s.completeMission);
  const applyDelta = useResourceStore((s) => s.applyDelta);
  const updateCrew = useCrewStore((s) => s.updateCrew);
  const crew = useCrewStore((s) => s.crew);
  const nextPhase = useGameStore((s) => s.nextPhase);
  const pushDialogue = useNarrativeStore((s) => s.pushDialogue);

  if (!mission) return null;

  const handleChoice = (choiceId: string) => {
    const choice = mission.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    const result = resolveChoice(choice);

    applyConsequences({ applyDelta }, { updateCrew }, result.consequences);

    // Mission texts say {engineer}, {medic}, {scientist}: fill in the chosen crew's first names.
    let narrative = result.narrative;
    for (const role of CREW_ROLES) {
      const firstName = crew[role].name.split(' ')[0];
      narrative = narrative.replaceAll(`{${role}}`, firstName);
    }
    pushDialogue(narrative);
    completeMission(mission.id);
    nextPhase();
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)', margin: 0 }}>What do you do?</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {mission.choices.map((choice) => (
          <Button
            key={choice.id}
            variant="secondary"
            icon={choice.icon}
            onClick={() => handleChoice(choice.id)}
          >
            {choice.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
