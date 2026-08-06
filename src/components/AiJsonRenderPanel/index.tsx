import type { ReactNode } from 'react';
import styles from './styles.module.css';

type AiJsonRenderPanelProps = {
  jsonLabel: string;
  renderLabel: string;
  code: ReactNode;
  children: ReactNode;
};

export default function AiJsonRenderPanel({
  jsonLabel,
  renderLabel,
  code,
  children,
}: AiJsonRenderPanelProps): ReactNode {
  return (
    <div className={styles.panel}>
      <div className={`${styles.side} ${styles.sideLeft}`}>
        <span className={styles.tab}>{jsonLabel}</span>
        <div className={styles.code}>{code}</div>
      </div>
      <div className={styles.side}>
        <span className={styles.tab}>{renderLabel}</span>
        <div className={styles.renderArea}>
          <div className={styles.card}>{children}</div>
        </div>
      </div>
    </div>
  );
}
