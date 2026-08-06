import type { ReactNode } from 'react';
import styles from './styles.module.css';

/** Bilinen, sabit bir JS değerini (string JSON parse etmeden) renkli JSX olarak basar. */
export function renderJson(value: unknown, indent = 0): ReactNode {
  const pad = '  '.repeat(indent + 1);
  const padClose = '  '.repeat(indent);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return (
      <>
        {'[\n'}
        {value.map((item, i) => (
          <span key={i}>
            {pad}
            {renderJson(item, indent + 1)}
            {i < value.length - 1 ? ',' : ''}
            {'\n'}
          </span>
        ))}
        {padClose}
        {']'}
      </>
    );
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <>
        {'{\n'}
        {entries.map(([key, val], i) => (
          <span key={key}>
            {pad}
            <span className={styles.key}>"{key}"</span>
            {': '}
            {renderJson(val, indent + 1)}
            {i < entries.length - 1 ? ',' : ''}
            {'\n'}
          </span>
        ))}
        {padClose}
        {'}'}
      </>
    );
  }

  if (typeof value === 'string') {
    return <span className={styles.string}>"{value}"</span>;
  }

  return String(value);
}
