import { useState, type ReactNode } from 'react';
import AiFlowDiagram from '../AiFlowDiagram';
import AiChatMock from '../AiChatMock';
import { STEPS } from '../AiFlowDiagram/steps';
import styles from './styles.module.css';

const LAST_STEP_INDEX = STEPS.length - 1;

export default function AiFlowShowcase(): ReactNode {
  const [stepIndex, setStepIndex] = useState(0);
  const revealed = stepIndex === LAST_STEP_INDEX;

  return (
    <div className={styles.showcase}>
      <div className={styles.columnTitle}>Akış</div>
      <AiFlowDiagram onStepChange={setStepIndex} />

      <div className={`${styles.connector} ${revealed ? styles.connectorActive : ''}`}>
        <span className={styles.connectorArrow} aria-hidden="true">
          ↓
        </span>
        <span>{revealed ? 'Akış tamamlandı — sonuç aşağıda' : 'Akış tamamlanınca sonuç güncellenir'}</span>
      </div>

      <div className={styles.columnTitle}>Sonuç</div>
      <AiChatMock revealed={revealed} />
    </div>
  );
}
