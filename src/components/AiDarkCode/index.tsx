import type { ReactNode } from 'react';
import { renderJson } from '../AiJsonRenderPanel/renderJson';
import styles from '../AiJsonRenderPanel/styles.module.css';

type AiDarkCodeProps = {
  label: string;
  value: unknown;
};

export default function AiDarkCode({ label, value }: AiDarkCodeProps): ReactNode {
  return (
    <div className={styles.panel} style={{ gridTemplateColumns: '1fr' }}>
      <div className={styles.side}>
        <span className={styles.tab}>{label}</span>
        <div className={styles.code}>{renderJson(value)}</div>
      </div>
    </div>
  );
}
