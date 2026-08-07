import type { ReactNode } from 'react';
import styles from './styles.module.css';

type ApiExampleProps = {
  method: 'GET' | 'POST';
  path: string;
  request?: unknown;
  requestHeaders?: Record<string, string>;
  response: unknown;
};

function colorizeLine(line: string): ReactNode {
  const parts = line.split(/("(?:[^"\\]|\\.)*"|\btrue\b|\bfalse\b|\bnull\b|\b-?\d+(?:\.\d+)?\b)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('"')) {
      const isKey = line.slice(line.indexOf(part) + part.length).trimStart().startsWith(':');
      return (
        <span key={i} className={isKey ? styles.key : styles.string}>
          {part}
        </span>
      );
    }
    if (/^(true|false|null)$/.test(part)) {
      return (
        <span key={i} className={styles.boolean}>
          {part}
        </span>
      );
    }
    if (/^-?\d+(\.\d+)?$/.test(part)) {
      return (
        <span key={i} className={styles.number}>
          {part}
        </span>
      );
    }
    return part;
  });
}

function CodeLines({ text }: { text: string }): ReactNode {
  const lines = text.split('\n');
  return (
    <div className={styles.codeLines}>
      {lines.map((line, i) => (
        <div className={styles.codeLine} key={i}>
          <span className={styles.lineNumber}>{i + 1}</span>
          <span className={styles.lineContent}>{colorizeLine(line)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ApiExample({ method, path, request, requestHeaders, response }: ApiExampleProps): ReactNode {
  return (
    <div className={styles.card}>
      <div className={styles.methodRow}>
        <span className={`${styles.method} ${method === 'GET' ? styles.methodGet : styles.methodPost}`}>
          {method}
        </span>
        <span className={styles.path}>{path}</span>
      </div>

      {(request || requestHeaders) && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>request</div>
          {requestHeaders && (
            <div className={styles.headers}>
              {Object.entries(requestHeaders).map(([k, v]) => (
                <div key={k}>
                  <span className={styles.key}>{k}</span>: <span className={styles.string}>{v}</span>
                </div>
              ))}
            </div>
          )}
          {request ? <CodeLines text={JSON.stringify(request, null, 2)} /> : null}
        </div>
      )}

      <div className={styles.divider} />

      <div className={styles.section}>
        <div className={styles.sectionLabel}>response</div>
        <CodeLines text={JSON.stringify(response, null, 2)} />
      </div>
    </div>
  );
}
