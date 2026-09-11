import { useState, type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type StepType =
  | 'list_rows'
  | 'search_rows'
  | 'create_row'
  | 'update_row'
  | 'delete_row'
  | 'send_email'
  | 'condition'
  | 'compute';

type PipelineStep = { id: string; type: StepType; params: Record<string, unknown> };

type LogEntry = { id: number; icon: string; text: string; tone: 'info' | 'ok' | 'warn' | 'db' };

const STEP_META: Record<StepType, { icon: string; label: string }> = {
  list_rows: { icon: '📋', label: 'Listele' },
  search_rows: { icon: '🔎', label: 'Ara' },
  create_row: { icon: '➕', label: 'Satır Ekle' },
  update_row: { icon: '✏️', label: 'Satır Güncelle' },
  delete_row: { icon: '🗑️', label: 'Satır Sil' },
  send_email: { icon: '📧', label: 'Mail Gönder' },
  condition: { icon: '🔀', label: 'Koşul' },
  compute: { icon: '🧮', label: 'Hesapla' },
};

const DEFAULT_PARAMS: Record<StepType, Record<string, unknown>> = {
  list_rows: { table_id: 'tasks', filters: [] },
  search_rows: { table_id: 'musteriler', query_text: '{{input}}', fields: ['ad', 'email'] },
  create_row: { table_id: 'audit_log', row_data: { aksiyon: 'islem' } },
  update_row: { table_id: 'tasks', patch: { durum: 'tamam' } },
  delete_row: { table_id: 'tasks', row_id: 't1' },
  send_email: { to_field: 'musteri_email', template: 'bilgilendirme' },
  condition: { field: 'stok', op: 'lt', value: 10 },
  compute: { op: 'SUM', field: 'tutar' },
};

type Preset = { id: string; label: string; trigger: string; steps: Array<{ type: StepType; params: Record<string, unknown> }> };

const PRESETS: Preset[] = [
  {
    id: 'onayla',
    label: '🧾 Sipariş Onayla',
    trigger: 'Dashboard: Satış Panosu — "Onayla" butonu',
    steps: [
      { type: 'update_row', params: { table_id: 'siparisler', patch: { durum: 'onaylandi' } } },
      { type: 'send_email', params: { to_field: 'musteri_email', template: 'siparis_onay' } },
      { type: 'create_row', params: { table_id: 'audit_log', row_data: { aksiyon: 'onay' } } },
    ],
  },
  {
    id: 'stok',
    label: '📦 Stok Uyarısı',
    trigger: 'Dashboard: Envanter Panosu — stok alanı güncellenince',
    steps: [
      { type: 'condition', params: { field: 'stok', op: 'lt', value: 10 } },
      { type: 'send_email', params: { to_field: 'depo_sorumlusu_email', template: 'stok_azaldi' } },
    ],
  },
  {
    id: 'arama',
    label: '🔎 Müşteri Arama',
    trigger: 'Dashboard: CRM Panosu — arama kutusu',
    steps: [{ type: 'search_rows', params: { table_id: 'musteriler', query_text: '{{input}}', fields: ['ad', 'email'] } }],
  },
  {
    id: 'rapor',
    label: '📊 Haftalık Ciro Kartı',
    trigger: 'Dashboard: Yönetici Panosu — sayfa açılışı',
    steps: [
      { type: 'list_rows', params: { table_id: 'siparisler', filters: [{ field: 'tarih', op: 'gte', value: '-7g' }] } },
      { type: 'compute', params: { op: 'SUM', field: 'tutar' } },
    ],
  },
];

let seq = 0;
let logSeq = 0;

function newId() {
  seq += 1;
  return `s${seq}`;
}

function paramSummary(type: StepType, params: Record<string, unknown>): string {
  switch (type) {
    case 'update_row':
      return `${params.table_id} · patch=${JSON.stringify(params.patch)}`;
    case 'create_row':
      return `${params.table_id} · ${JSON.stringify(params.row_data)}`;
    case 'delete_row':
      return `${params.table_id} · row_id=${params.row_id}`;
    case 'list_rows':
      return `${params.table_id}`;
    case 'search_rows':
      return `${params.table_id} · "${params.query_text}"`;
    case 'send_email':
      return `template=${params.template} → ${params.to_field}`;
    case 'condition':
      return `${params.field} ${params.op} ${params.value}`;
    case 'compute':
      return `${params.op}(${params.field})`;
    default:
      return '';
  }
}

function stepLog(type: StepType, params: Record<string, unknown>): Array<Omit<LogEntry, 'id'>> {
  switch (type) {
    case 'list_rows':
    case 'search_rows':
      return [{ icon: '🔍', text: `Mongo sorgusu: dashboard_table_rows (table_id=${params.table_id})`, tone: 'db' }];
    case 'create_row':
      return [{ icon: '➕', text: `Mongo: yeni satır oluşturuldu (${params.table_id})`, tone: 'db' }];
    case 'update_row':
      return [{ icon: '✏️', text: `Mongo: data güncellendi, previous saklandı (${params.table_id})`, tone: 'db' }];
    case 'delete_row':
      return [{ icon: '🗑️', text: `Mongo: is_deleted=true (soft-delete, ${params.table_id})`, tone: 'db' }];
    case 'send_email':
      return [
        { icon: '📤', text: `tenant_outbox_events'e yazıldı (template=${params.template})`, tone: 'info' },
        { icon: '🔁', text: `Poller arkadan retry'li gönderecek — senkron beklenmiyor`, tone: 'ok' },
      ];
    case 'condition':
      return [{ icon: '🔀', text: `Koşul: ${params.field} ${params.op} ${params.value} → ✅ devam`, tone: 'warn' }];
    case 'compute':
      return [{ icon: '🧮', text: `${params.op}(${params.field}) hesaplandı`, tone: 'db' }];
    default:
      return [];
  }
}

export default function EventPipelineBuilder(): ReactNode {
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [triggerLabel, setTriggerLabel] = useState('Dashboard: kendi senaryon — bir tetikleyici seç ya da adım ekle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);

  function addStep(type: StepType) {
    setSteps((prev) => [...prev, { id: newId(), type, params: DEFAULT_PARAMS[type] }]);
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    setSteps((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function loadPreset(preset: Preset) {
    setSteps(preset.steps.map((s) => ({ id: newId(), type: s.type, params: s.params })));
    setTriggerLabel(preset.trigger);
    setLogs([]);
  }

  function clearAll() {
    setSteps([]);
    setLogs([]);
    setTriggerLabel('Dashboard: kendi senaryon — bir tetikleyici seç ya da adım ekle');
  }

  async function run() {
    if (steps.length === 0 || running) return;
    setRunning(true);
    setLogs([{ id: logSeq++, icon: '🖱️', text: `postMessage → event tetiklendi (${steps.length} adımlık pipeline)`, tone: 'info' }]);
    await new Promise((r) => setTimeout(r, 250));
    for (const step of steps) {
      const entries = stepLog(step.type, step.params);
      setLogs((prev) => [...prev, ...entries.map((e) => ({ ...e, id: logSeq++ }))]);
      await new Promise((r) => setTimeout(r, 350));
    }
    setLogs((prev) => [...prev, { id: logSeq++, icon: '✅', text: 'event_result → DOM güncellendi', tone: 'ok' }]);
    setRunning(false);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.presetRow}>
        {PRESETS.map((p) => (
          <button key={p.id} type="button" className={styles.presetBtn} onClick={() => loadPreset(p)}>
            {p.label}
          </button>
        ))}
        <button type="button" className={clsx(styles.presetBtn, styles.presetClear)} onClick={clearAll}>
          🧹 Temizle
        </button>
      </div>

      <div className={styles.triggerLine}>
        <span className={styles.triggerIcon}>⚡</span> {triggerLabel}
      </div>

      <div className={styles.layout}>
        <div className={styles.palette}>
          <div className={styles.paletteTitle}>Step paleti — tıkla, pipeline'a eklensin</div>
          <div className={styles.paletteGrid}>
            {(Object.keys(STEP_META) as StepType[]).map((type) => (
              <button key={type} type="button" className={styles.paletteBtn} onClick={() => addStep(type)}>
                <span>{STEP_META[type].icon}</span> {STEP_META[type].label}
              </button>
            ))}
          </div>

          <div className={styles.paletteTitle} style={{ marginTop: '1rem' }}>
            Pipeline ({steps.length} adım)
          </div>
          {steps.length === 0 && <div className={styles.emptyPipeline}>henüz adım yok — yukarıdan ekle ya da bir preset seç</div>}
          <div className={styles.pipelineList}>
            {steps.map((s, i) => (
              <div key={s.id} className={styles.pipelineItem}>
                <span className={styles.pipelineIndex}>{i + 1}</span>
                <span className={styles.pipelineIcon}>{STEP_META[s.type].icon}</span>
                <div className={styles.pipelineBody}>
                  <div className={styles.pipelineType}>{STEP_META[s.type].label}</div>
                  <div className={styles.pipelineParams}>{paramSummary(s.type, s.params)}</div>
                </div>
                <div className={styles.pipelineActions}>
                  <button type="button" onClick={() => move(s.id, -1)} disabled={i === 0} title="yukarı taşı">
                    ↑
                  </button>
                  <button type="button" onClick={() => move(s.id, 1)} disabled={i === steps.length - 1} title="aşağı taşı">
                    ↓
                  </button>
                  <button type="button" onClick={() => removeStep(s.id)} title="kaldır" className={styles.removeBtn}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className={styles.runBtn} onClick={run} disabled={steps.length === 0 || running}>
            {running ? '⏳ Çalışıyor...' : '▶️ Pipeline\'ı Çalıştır'}
          </button>
        </div>

        <div className={styles.side}>
          <div className={styles.jsonPanel}>
            <div className={styles.panelTitle}>📄 Üretilen event JSON</div>
            <pre className={styles.json}>
{`{
  "trigger": "${triggerLabel.split(' — ')[1] ?? triggerLabel}",
  "steps": [
${steps.map((s) => `    { "type": "${s.type}", "params": ${JSON.stringify(s.params)} }`).join(',\n')}
  ]
}`}
            </pre>
          </div>
          <div className={styles.logPanel}>
            <div className={styles.panelTitle}>⚡ Servis akışı (simülasyon)</div>
            {logs.length === 0 && <div className={styles.emptyPipeline}>çalıştırınca akış burada görünür</div>}
            <div className={styles.logList}>
              {logs.map((l) => (
                <div key={l.id} className={clsx(styles.logEntry, styles[`tone_${l.tone}`])}>
                  <span>{l.icon}</span>
                  <span className={styles.logText}>{l.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
