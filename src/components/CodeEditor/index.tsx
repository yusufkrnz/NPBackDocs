import type { ReactNode } from 'react';
import clsx from 'clsx';
import styles from '../ApiExample/styles.module.css';

type Language = 'python' | 'typescript';

type CodeEditorProps = {
  filename: string;
  code: string;
  language?: Language;
  highlightLines?: number[];
};

const PY_KEYWORDS =
  '\\b(?:def|class|import|from|as|return|raise|try|except|finally|async|await|if|elif|else|for|while|with|pass|None|True|False|self|and|or|not|in|is|lambda)\\b';

const TS_KEYWORDS =
  '\\b(?:const|let|var|function|return|import|from|export|default|async|await|if|else|for|while|new|class|extends|interface|type|as|void|true|false|null|undefined|this|typeof|instanceof)\\b';

function buildTokenRegex(language: Language): RegExp {
  const keywords = language === 'typescript' ? TS_KEYWORDS : PY_KEYWORDS;
  return new RegExp(
    `(?<comment>//.*$|#.*$)|(?<string>'(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*"|\`(?:[^\`\\\\]|\\\\.)*\`)|(?<decorator>@\\w+)|(?<keyword>${keywords})|(?<number>\\b\\d+(?:\\.\\d+)?\\b)`,
    'gm',
  );
}

function colorizeLine(line: string, tokenRegex: RegExp): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of line.matchAll(tokenRegex)) {
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

function detectLanguage(filename: string): Language {
  return /\.(ts|tsx|js|jsx)$/.test(filename) ? 'typescript' : 'python';
}

export default function CodeEditor({ filename, code, language, highlightLines }: CodeEditorProps): ReactNode {
  const lang = language ?? detectLanguage(filename);
  const tokenRegex = buildTokenRegex(lang);
  const lines = code.replace(/^\n+|\n+$/g, '').split('\n');
  const highlighted = new Set(highlightLines ?? []);

  return (
    <div className={clsx(styles.card, lang === 'typescript' ? styles.cardTs : styles.cardPy)}>
      <div className={styles.filenameRow}>
        <span className={clsx(styles.langBadge, lang === 'typescript' ? styles.langBadgeTs : styles.langBadgePy)}>
          {lang === 'typescript' ? 'TS' : 'PY'}
        </span>
        {filename}
      </div>
      <div className={styles.section}>
        <div className={styles.codeLines}>
          {lines.map((line, i) => (
            <div className={clsx(styles.codeLine, highlighted.has(i + 1) && styles.codeLineError)} key={i}>
              <span className={styles.lineNumber}>{i + 1}</span>
              <span className={styles.lineContent}>{colorizeLine(line, tokenRegex)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
