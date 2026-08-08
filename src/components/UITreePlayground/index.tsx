import { useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { renderJson } from '../AiJsonRenderPanel/renderJson';
import panelStyles from '../AiJsonRenderPanel/styles.module.css';
import styles from './styles.module.css';

type UINodeDef = {
  type: string;
  props?: Record<string, unknown>;
  children?: UINodeDef[];
};

export type PlaygroundCase = {
  id: string;
  label: string;
  description: string;
  tree: UINodeDef;
  state: Record<string, unknown>;
};

function resolveStateRefs(value: unknown, state: Record<string, unknown>): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value) && '$state' in (value as Record<string, unknown>)) {
    const path = (value as { $state: string }).$state.replace(/^\//, '');
    return path.split('.').reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
      return undefined;
    }, state);
  }
  if (Array.isArray(value)) return value.map((v) => resolveStateRefs(v, state));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = resolveStateRefs(v, state);
    return out;
  }
  return value;
}

function MockStatCard({ label, value }: { label?: string; value?: unknown }): ReactNode {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{String(value ?? '')}</div>
    </div>
  );
}

function MockDataTable({ columns, rows }: { columns?: string[]; rows?: Record<string, unknown>[] }): ReactNode {
  const cols = columns ?? [];
  const data = rows ?? [];
  return (
    <div className={styles.tableCard}>
      <table className={styles.table}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c}>{String(row[c] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MockLineChart({ title, points }: { title?: string; points?: number[] }): ReactNode {
  const data = points && points.length > 0 ? points : [0];
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 220;
  const h = 64;
  const step = w / (data.length - 1 || 1);
  const d = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${h - ((p - min) / range) * h}`)
    .join(' ');
  return (
    <div className={styles.chartCard}>
      <div className={styles.chartTitle}>{title}</div>
      <svg viewBox={`0 0 ${w} ${h}`} className={styles.sparkline} preserveAspectRatio="none">
        <path d={d} fill="none" stroke="#2563eb" strokeWidth={2} />
      </svg>
    </div>
  );
}

const REGISTRY: Record<string, (props: Record<string, unknown>, children: ReactNode) => ReactNode> = {
  Row: (_props, children) => <div className={styles.row}>{children}</div>,
  Grid: (_props, children) => <div className={styles.grid}>{children}</div>,
  Column: (_props, children) => <div className={styles.column}>{children}</div>,
  StatCard: (props) => <MockStatCard label={props.label as string} value={props.value} />,
  DataTable: (props) => (
    <MockDataTable columns={props.columns as string[]} rows={props.rows as Record<string, unknown>[]} />
  ),
  LineChart: (props) => <MockLineChart title={props.title as string} points={props.points as number[]} />,
};

function renderNode(node: UINodeDef, state: Record<string, unknown>, key?: string | number): ReactNode {
  const factory = REGISTRY[node.type];
  if (!factory) {
    return (
      <div key={key} className={styles.unknownNode}>
        Bilinmeyen component: {node.type}
      </div>
    );
  }
  const resolvedProps = resolveStateRefs(node.props ?? {}, state) as Record<string, unknown>;
  const children = node.children?.map((child, i) => (
    <span key={i}>{renderNode(child, state, i)}</span>
  ));
  return <div key={key}>{factory(resolvedProps, children)}</div>;
}

type UITreePlaygroundProps = {
  cases: PlaygroundCase[];
};

export default function UITreePlayground({ cases }: UITreePlaygroundProps): ReactNode {
  const [activeId, setActiveId] = useState(cases[0]?.id);
  const active = cases.find((c) => c.id === activeId) ?? cases[0];
  if (!active) return null;

  return (
    <div className={styles.playground}>
      <div className={styles.tabs}>
        {cases.map((c) => (
          <button
            key={c.id}
            type="button"
            className={clsx(styles.tab, c.id === active.id && styles.tabActive)}
            onClick={() => setActiveId(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className={styles.caseDescription}>{active.description}</p>
      <div className={panelStyles.panel}>
        <div className={clsx(panelStyles.side, panelStyles.sideLeft)}>
          <span className={panelStyles.tab}>LLM'in ürettiği JSON</span>
          <div className={panelStyles.code}>{renderJson(active.tree)}</div>
        </div>
        <div className={panelStyles.side}>
          <span className={panelStyles.tab}>Canlı render</span>
          <div className={styles.renderSurface}>{renderNode(active.tree, active.state)}</div>
        </div>
      </div>
    </div>
  );
}
