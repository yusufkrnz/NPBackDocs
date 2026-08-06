import type { ReactNode } from 'react';
import styles from '../ApiExample/styles.module.css';

type CodeEditorProps = {
  filename: string;
  code: string;
};

const KEYWORDS =
  '\\b(?:def|class|import|from|as|return|raise|try|except|finally|async|await|if|elif|else|for|while|with|pass|None|True|False|self|and|or|not|in|is|lambda)\\b';

const TOKEN_REGEX = new RegExp(
  `(?<comment>#.*$)|(?<string>'(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*")|(?<decorator>@\\w+)|(?<keyword>${KEYWORDS})|(?<number>\\b\\d+(?:\\.\\d+)?\\b)`,
  'gm',
);

function colorizePythonLine(line: string): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of line.matchAll(TOKEN_REGEX)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(line.slice(lastIndex, index));
    }
    const groups = match.groups ?? {};
    const className =
      (groups.comment && styles.comment) ||
      (groups.string && styles.string) ||
      (groups.decorator && styles.decorator) ||
      (groups.keyword && styles.keyword) ||
      (groups.number && styles.number) ||
      undefined;
    nodes.push(
      <span key={key++} className={className}>
        {match[0]}
      </span>,
    );
    lastIndex = index + match[0].length;
  }
  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }
  return nodes;
}

export default function CodeEditor({ filename, code }: CodeEditorProps): ReactNode {
  const lines = code.replace(/^\n+|\n+$/g, '').split('\n');

  return (
    <div className={styles.card}>
      <div className={styles.filenameRow}>{filename}</div>
      <div className={styles.section}>
        <div className={styles.codeLines}>
          {lines.map((line, i) => (
            <div className={styles.codeLine} key={i}>
              <span className={styles.lineNumber}>{i + 1}</span>
              <span className={styles.lineContent}>{colorizePythonLine(line)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
