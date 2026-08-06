import { useEffect, useState, type ReactNode } from 'react';
import { PARTICIPANTS, STEPS } from './steps';
import styles from './styles.module.css';

const AUTOPLAY_INTERVAL_MS = 2600;
const COLUMN_WIDTH_PERCENT = 100 / PARTICIPANTS.length;

function columnCenterPercent(index: number): number {
  return (index + 0.5) * COLUMN_WIDTH_PERCENT;
}

type AiFlowDiagramProps = {
  onStepChange?: (stepIndex: number) => void;
};

export default function AiFlowDiagram({ onStepChange }: AiFlowDiagramProps = {}): ReactNode {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [pos, setPos] = useState(STEPS[0].from);
  const [transitioning, setTransitioning] = useState(false);

  const step = STEPS[stepIndex];
  const isSelfStep = step.from === step.to;

  // Snap to the step's start position instantly, then animate to its end
  // position on the next frame — otherwise React batches both updates and
  // the pulse never visibly leaves the "from" box.
  useEffect(() => {
    setTransitioning(false);
    setPos(step.from);
    onStepChange?.(stepIndex);
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setTransitioning(true);
        setPos(step.to);
      });
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStepIndex((i) => (i + 1) % STEPS.length);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [playing]);

  const goTo = (index: number) => {
    setPlaying(false);
    setStepIndex((index + STEPS.length) % STEPS.length);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.trackScroll}>
        <div className={styles.track}>
          {PARTICIPANTS.map((name, i) => (
            <div
              key={name}
              className={`${styles.participant} ${
                i === step.from || i === step.to ? styles.participantActive : ''
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        <div className={styles.track}>
          <div className={styles.rail} style={{ gridColumn: '1 / -1' }}>
            <span
              className={styles.pulseLabel}
              style={{ left: `${columnCenterPercent(pos)}%` }}
            >
              {step.label}
            </span>
            <span
              className={`${styles.pulse} ${
                isSelfStep ? styles.pulseSelf : transitioning ? styles.pulseMoving : ''
              }`}
              style={{ left: `${columnCenterPercent(pos)}%` }}
            />
          </div>
        </div>
      </div>

      <div className={styles.caption} aria-live="polite">
        <div className={styles.captionStep}>
          Adım {stepIndex + 1} / {STEPS.length}
        </div>
        <div className={styles.captionLabel}>
          {PARTICIPANTS[step.from]} → {PARTICIPANTS[step.to]}: {step.label}
        </div>
        <div className={styles.captionDescription}>{step.description}</div>
      </div>

      <div className={styles.controls}>
        <button className={styles.button} onClick={() => goTo(stepIndex - 1)} aria-label="Önceki adım">
          ← Önceki
        </button>
        <button
          className={styles.button}
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Duraklat' : 'Oynat'}
        >
          {playing ? '⏸ Duraklat' : '▶ Oynat'}
        </button>
        <button className={styles.button} onClick={() => goTo(stepIndex + 1)} aria-label="Sonraki adım">
          Sonraki →
        </button>
        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === stepIndex ? styles.dotActive : ''}`}
              onClick={() => goTo(i)}
              aria-label={`${i + 1}. adıma git`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
