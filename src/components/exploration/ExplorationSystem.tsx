import { useEffect, useMemo, useRef, useState } from 'react';
import { EXPLORATION_REPORTS, RISK_LABELS, type ExplorationOption } from '../../data/exploration';
import { EVENTS, gameEvents } from '../../game/events';
import { useExplorationStore } from '../../stores/useExplorationStore';
import { useResourceStore } from '../../stores/useResourceStore';
import { RobotPortrait } from './RobotPortrait';
import './ExplorationSystem.css';

function formatRemaining(milliseconds: number): string {
  const gameHours = Math.max(0, Math.ceil(milliseconds / 1000));
  const days = Math.floor(gameHours / 24);
  const hours = gameHours % 24;
  return days > 0 ? `${days}d ${String(hours).padStart(2, '0')}h` : `${String(hours).padStart(2, '0')}h`;
}

function MissionDetails({ mission }: { mission: ExplorationOption }) {
  return (
    <>
      <span className={`exploration-risk exploration-risk--${mission.risk}`}>{RISK_LABELS[mission.risk]}</span>
      <h3>{mission.title}</h3>
      <p>{mission.description}</p>
      <dl className="exploration-stats">
        <div><dt>Duração</dt><dd>{mission.durationHours}h</dd></div>
        <div><dt>Sucesso</dt><dd>{Math.round(mission.successChance * 100)}%</dd></div>
        <div><dt>Custo</dt><dd>{mission.cost.energy} energia · {mission.cost.water} água</dd></div>
        <div><dt>Retorno</dt><dd>até {mission.reward.minerals} minérios</dd></div>
      </dl>
    </>
  );
}

export function ExplorationSystem() {
  const status = useExplorationStore((state) => state.status);
  const options = useExplorationStore((state) => state.options);
  const active = useExplorationStore((state) => state.active);
  const unlockedIds = useExplorationStore((state) => state.unlockedReportIds);
  const minerals = useExplorationStore((state) => state.minerals);
  const lastOutcome = useExplorationStore((state) => state.lastOutcome);
  const celebrationPending = useExplorationStore((state) => state.celebrationPending);
  const openMissionMenu = useExplorationStore((state) => state.openMissionMenu);
  const clearOptions = useExplorationStore((state) => state.clearOptions);
  const startExploration = useExplorationStore((state) => state.startExploration);
  const resolveExploration = useExplorationStore((state) => state.resolveExploration);
  const clearOutcome = useExplorationStore((state) => state.clearOutcome);
  const dismissCelebration = useExplorationStore((state) => state.dismissCelebration);
  const water = useResourceStore((state) => state.water);
  const energy = useResourceStore((state) => state.energy);
  const applyDelta = useResourceStore((state) => state.applyDelta);
  const [now, setNow] = useState(active?.startedAt ?? 0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const worldPausedByExploration = useRef(false);

  const menuOpen = status === 'aboard' && options.length > 0;

  useEffect(() => {
    const onRobotInteract = () => {
      if (useExplorationStore.getState().status !== 'aboard') return;
      openMissionMenu();
      if (!worldPausedByExploration.current) {
        worldPausedByExploration.current = true;
        gameEvents.emit(EVENTS.MENU_OPENED);
      }
    };
    gameEvents.on(EVENTS.ROBOT_INTERACT, onRobotInteract);
    return () => { gameEvents.off(EVENTS.ROBOT_INTERACT, onRobotInteract); };
  }, [openMissionMenu]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'r' || event.repeat) return;
      if (useExplorationStore.getState().status !== 'aboard') return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      gameEvents.emit(EVENTS.ROBOT_INTERACT);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!active) return;
    const update = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      const outcome = resolveExploration(currentTime);
      if (!outcome?.succeeded) return;
      applyDelta({
        water: outcome.mission.reward.water,
        energy: outcome.mission.reward.energy,
      });
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [active, applyDelta, resolveExploration]);

  useEffect(() => {
    if (lastOutcome && !worldPausedByExploration.current) {
      worldPausedByExploration.current = true;
      gameEvents.emit(EVENTS.MENU_OPENED);
    }
  }, [lastOutcome]);

  const unlockedReports = useMemo(
    () => EXPLORATION_REPORTS.filter((report) => unlockedIds.includes(report.id)),
    [unlockedIds],
  );

  const closeMenu = () => {
    clearOptions();
    if (worldPausedByExploration.current) {
      worldPausedByExploration.current = false;
      gameEvents.emit(EVENTS.MENU_CLOSED);
    }
  };

  const launch = (mission: ExplorationOption) => {
    if (water < mission.cost.water || energy < mission.cost.energy) return;
    setDetailsOpen(false);
    applyDelta({ water: -mission.cost.water, energy: -mission.cost.energy });
    startExploration(mission);
    if (worldPausedByExploration.current) {
      worldPausedByExploration.current = false;
      gameEvents.emit(EVENTS.MENU_CLOSED);
    }
  };

  const openDetails = () => {
    setDetailsOpen(true);
    if (!worldPausedByExploration.current) {
      worldPausedByExploration.current = true;
      gameEvents.emit(EVENTS.MENU_OPENED);
    }
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    if (worldPausedByExploration.current) {
      worldPausedByExploration.current = false;
      gameEvents.emit(EVENTS.MENU_CLOSED);
    }
  };

  const closeOutcome = () => {
    setDetailsOpen(false);
    clearOutcome();
    if (worldPausedByExploration.current) {
      worldPausedByExploration.current = false;
      gameEvents.emit(EVENTS.MENU_CLOSED);
    }
  };

  const receiveMedal = () => {
    setDetailsOpen(false);
    dismissCelebration();
    clearOutcome();
    if (worldPausedByExploration.current) {
      worldPausedByExploration.current = false;
      gameEvents.emit(EVENTS.MENU_CLOSED);
    }
  };

  return (
    <>
      {status === 'aboard' && (
        <button
          className="robot-dock-button"
          type="button"
          onClick={() => gameEvents.emit(EVENTS.ROBOT_INTERACT)}
          aria-label="Abrir missões do robô AUR-1"
        >
          <span className="robot-dock-button__dot" aria-hidden="true" />
          <span><strong>AUR-1</strong><small>Missões do robô</small></span>
          <kbd>R</kbd>
        </button>
      )}

      {active && (
        <button className="robot-widget" type="button" onClick={openDetails} aria-label="Abrir detalhes da exploração">
          <RobotPortrait size={64} />
          <span>
            <strong>Explorando Marte</strong>
            <small>{formatRemaining(active.endsAt - now)} para retornar</small>
          </span>
          <b>{unlockedIds.length}/10</b>
        </button>
      )}

      {menuOpen && (
        <div className="exploration-layer" role="dialog" aria-modal="true" aria-labelledby="exploration-title">
          <section className="exploration-menu">
            <header>
              <div><span className="exploration-eyebrow">Unidade AUR-1</span><h2 id="exploration-title">Missões de exploração</h2></div>
              <button className="exploration-close" type="button" onClick={closeMenu} aria-label="Fechar">×</button>
            </header>
            <div className="exploration-balance">Água {Math.round(water)} · Energia {Math.round(energy)} · Minérios {minerals} · Relatórios {unlockedIds.length}/10</div>
            <div className="exploration-options">
              {options.map((mission) => {
                const affordable = water >= mission.cost.water && energy >= mission.cost.energy;
                return (
                  <article className={`exploration-option exploration-option--${mission.risk}`} key={mission.id}>
                    <span className="exploration-number">OPÇÃO {mission.optionNumber}</span>
                    <MissionDetails mission={mission} />
                    <button type="button" disabled={!affordable} onClick={() => launch(mission)}>
                      {affordable ? 'Enviar robô' : 'Recursos insuficientes'}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {detailsOpen && active && (
        <div className="exploration-layer" role="dialog" aria-modal="true" aria-labelledby="active-title">
          <section className="exploration-summary">
            <RobotPortrait size={96} />
            <div><span className="exploration-eyebrow">MISSÃO EM ANDAMENTO</span><h2 id="active-title">{active.mission.title}</h2></div>
            <MissionDetails mission={active.mission} />
            <p className="exploration-countdown">Retorno em {formatRemaining(active.endsAt - now)}</p>
            <button type="button" onClick={closeDetails}>Voltar ao jogo</button>
          </section>
        </div>
      )}

      {lastOutcome && !celebrationPending && (
        <div className="exploration-layer" role="dialog" aria-modal="true" aria-labelledby="reward-title">
          <section className={`exploration-reward ${lastOutcome.succeeded ? 'is-success' : 'is-failure'}`}>
            <span className="exploration-eyebrow">ROBÔ DE VOLTA À NAVE</span>
            <h2 id="reward-title">{lastOutcome.succeeded ? 'Exploração concluída!' : 'Missão sem coleta'}</h2>
            {lastOutcome.report ? (
              <div className="report-card">
                <span>NOVO RELATÓRIO · {unlockedIds.length}/10</span>
                <h3>{lastOutcome.report.title}</h3>
                <p>{lastOutcome.report.narrative}</p>
              </div>
            ) : (
              <p>O terreno impediu a coleta. A telemetria foi preservada e a proteção contra azar aumentou.</p>
            )}
            {lastOutcome.succeeded && <p className="exploration-gains">+{lastOutcome.mission.reward.minerals} minérios · +{lastOutcome.mission.reward.water} água · +{lastOutcome.mission.reward.energy} energia</p>}
            {lastOutcome.wasGuaranteed && <small>Sucesso garantido pela proteção de telemetria.</small>}
            <button type="button" onClick={closeOutcome}>Continuar</button>
          </section>
        </div>
      )}

      {celebrationPending && (
        <div className="exploration-layer medal-layer" role="dialog" aria-modal="true" aria-labelledby="medal-title">
          <section className="medal-celebration">
            <div className="medal-rays" />
            <div className="medal-icon" aria-hidden="true">★</div>
            <span className="exploration-eyebrow">COLEÇÃO COMPLETA · {unlockedReports.length}/10</span>
            <h2 id="medal-title">Medalha de Explorador</h2>
            <p>Você reuniu os dez registros de Marte. A tripulação agora possui um atlas científico completo da região.</p>
            <button type="button" onClick={receiveMedal}>Receber medalha</button>
          </section>
        </div>
      )}
    </>
  );
}
