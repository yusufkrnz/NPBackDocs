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
  list_rows: { table_id: 'firsatlar', filters: [] },
  search_rows: { table_id: 'musteriler', query_text: '{{input}}', fields: ['ad', 'email'] },
  create_row: { table_id: 'audit_log', row_data: { aksiyon: 'islem' } },
  update_row: { table_id: 'firsatlar', patch: { asama: 'kazanildi' } },
  delete_row: { table_id: 'firsatlar', row_id: 'f1' },
  send_email: { to_field: 'musteri_email', template: 'bilgilendirme' },
  condition: { field: 'stok', op: 'lt', value: 10 },
  compute: { op: 'SUM', field: 'tutar' },
};

type Preset = { id: string; label: string; trigger: string; steps: Array<{ type: StepType; params: Record<string, unknown> }> };

const PRESETS: Preset[] = [
  {
    id: 'firsat',
    label: '💼 Fırsatı Kapat',
    trigger: 'CRM Panosu — Fırsatlar widget\'ında "Kapat" butonu',
    steps: [
      { type: 'update_row', params: { table_id: 'firsatlar', patch: { asama: 'kazanildi' } } },
      { type: 'send_email', params: { to_field: 'musteri_email', template: 'firsat_kazanildi' } },
      { type: 'create_row', params: { table_id: 'audit_log', row_data: { aksiyon: 'firsat_kapandi' } } },
    ],
  },
  {
    id: 'stok',
    label: '📦 Stok Kontrolü',
    trigger: 'ERP Panosu — Envanter widget\'ında "Kontrol Et" butonu',
    steps: [
      { type: 'condition', params: { field: 'stok', op: 'lt', value: 10 } },
      { type: 'send_email', params: { to_field: 'depo_sorumlusu_email', template: 'stok_azaldi' } },
    ],
  },
  {
    id: 'arama',
    label: '🔎 Müşteri Arama',
    trigger: 'CRM Panosu — Müşteri arama widget\'ı',
    steps: [{ type: 'search_rows', params: { table_id: 'musteriler', query_text: '{{input}}', fields: ['ad', 'email'] } }],
  },
  {
    id: 'rapor',
    label: '📊 Ciro Yenile',
    trigger: 'CRM Panosu — Aylık Ciro istatistik kartı',
    steps: [
      { type: 'list_rows', params: { table_id: 'firsatlar', filters: [{ field: 'asama', op: 'eq', value: 'kazanildi' }] } },
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

const CUSTOMERS = [
  { ad: 'Ayşe Yılmaz', email: 'ayse@akme.com' },
  { ad: 'Mehmet Demir', email: 'mehmet@vertex.com' },
  { ad: 'Elif Kaya', email: 'elif@novaholding.com' },
];

export default function EventPipelineBuilder(): ReactNode {
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [triggerLabel, setTriggerLabel] = useState("bir widget'in aksiyonuna tıkla, ya da alttan kendi pipeline'ını kur");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [ran, setRan] = useState(false);

  async function executeSteps(stepsToRun: PipelineStep[]) {
    if (stepsToRun.length === 0 || running) return;
    setRunning(true);
    setRan(false);
    setLogs([{ id: logSeq++, icon: '🖱️', text: `postMessage → event tetiklendi (${stepsToRun.length} adımlık pipeline)`, tone: 'info' }]);
    await new Promise((r) => setTimeout(r, 250));
    for (const step of stepsToRun) {
      const entries = stepLog(step.type, step.params);
      setLogs((prev) => [...prev, ...entries.map((e) => ({ ...e, id: logSeq++ }))]);
      await new Promise((r) => setTimeout(r, 320));
    }
    setLogs((prev) => [...prev, { id: logSeq++, icon: '✅', text: 'event_result → DOM güncellendi', tone: 'ok' }]);
    setRunning(false);
    setRan(true);
  }

  function triggerPreset(preset: Preset) {
    const newSteps = preset.steps.map((s) => ({ id: newId(), type: s.type, params: s.params }));
    setSteps(newSteps);
    setTriggerLabel(preset.trigger);
    setActivePreset(preset.id);
    void executeSteps(newSteps);
  }

  function loadPresetOnly(preset: Preset) {
    setSteps(preset.steps.map((s) => ({ id: newId(), type: s.type, params: s.params })));
    setTriggerLabel(preset.trigger);
    setActivePreset(preset.id);
    setLogs([]);
    setRan(false);
  }

  function runSearch() {
    const preset = PRESETS.find((p) => p.id === 'arama')!;
    const newSteps = [
      {
        id: newId(),
        type: 'search_rows' as StepType,
        params: { table_id: 'musteriler', query_text: searchInput || '(boş)', fields: ['ad', 'email'] },
      },
    ];
    setSteps(newSteps);
    setTriggerLabel(preset.trigger);
    setActivePreset('arama');
    void executeSteps(newSteps);
  }

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

  function clearAll() {
    setSteps([]);
    setLogs([]);
    setTriggerLabel("bir widget'in aksiyonuna tıkla, ya da alttan kendi pipeline'ını kur");
    setActivePreset(null);
    setRan(false);
  }

  function run() {
    void executeSteps(steps);
  }

  const filteredCustomers = CUSTOMERS.filter((c) => c.ad.toLowerCase().includes(searchInput.toLowerCase()));
  const showResult = ran && activePreset === 'arama';
  const showFirsatResult = ran && activePreset === 'firsat';
  const showStokResult = ran && activePreset === 'stok';
  const showRaporResult = ran && activePreset === 'rapor';

  return (
    <div className={styles.wrap}>
      <div className={styles.triggerLine}>
        <span className={styles.triggerIcon}>⚡</span> {triggerLabel}
      </div>

      <div className={styles.mockPreviewArea}>
        <div className={styles.mockPreviewLabel}>
          iframe içindeki CRM/ERP dashboard — LLM'in ürettiği tek bir HTML sayfası, birden fazla widget'ın birleşimi
        </div>

        <div className={styles.dashboardGrid}>
          <div className={styles.statRow}>
            <div className={styles.statMini}>
              <div className={styles.statMiniLabel}>Açık Fırsatlar</div>
              <div className={styles.statMiniValue}>3</div>
            </div>
            <div className={styles.statMini}>
              <div className={styles.statMiniLabel}>Bu Ay Kazanılan</div>
              <div className={styles.statMiniValue}>{showFirsatResult ? '7' : '6'}</div>
            </div>
            <div className={clsx(styles.statMini, styles.statMiniAction)}>
              <div className={styles.statMiniLabel}>Aylık Ciro</div>
              <div className={styles.statMiniValue}>{showRaporResult ? '18.450₺' : '17.890₺'}</div>
              <button
                type="button"
                className={styles.miniRefreshBtn}
                onClick={() => triggerPreset(PRESETS.find((p) => p.id === 'rapor')!)}
                disabled={running}
              >
                🔄
              </button>
            </div>
          </div>

          <div className={styles.twoCol}>
            <div className={styles.widgetCard}>
              <div className={styles.widgetTitle}>💼 Fırsatlar</div>
              <table className={styles.mockTable}>
                <thead>
                  <tr>
                    <th>Firma</th>
                    <th>Tutar</th>
                    <th>Aşama</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Akme A.Ş.</td>
                    <td>32.000₺</td>
                    <td>Görüşme</td>
                    <td />
                  </tr>
                  <tr>
                    <td>Vertex Ltd.</td>
                    <td>18.500₺</td>
                    <td>Teklif</td>
                    <td />
                  </tr>
                  <tr className={styles.mockHighlightRow}>
                    <td>Nova Holding</td>
                    <td>54.000₺</td>
                    <td>{showFirsatResult ? <b className={styles.mockOk}>kazanıldı ✅</b> : 'Kapanışa Hazır'}</td>
                    <td>
                      {!showFirsatResult && (
                        <button
                          type="button"
                          className={styles.mockSmallBtn}
                          onClick={() => triggerPreset(PRESETS.find((p) => p.id === 'firsat')!)}
                          disabled={running}
                        >
                          Kapat
                        </button>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.widgetCard}>
              <div className={styles.widgetTitle}>📦 Envanter</div>
              <table className={styles.mockTable}>
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>Stok</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Klavye</td>
                    <td>48</td>
                    <td />
                  </tr>
                  <tr className={styles.mockLowRow}>
                    <td>Mouse Pad</td>
                    <td>
                      4 <span className={styles.mockBadgeLow}>düşük</span>
                    </td>
                    <td>
                      {!showStokResult && (
                        <button
                          type="button"
                          className={styles.mockSmallBtn}
                          onClick={() => triggerPreset(PRESETS.find((p) => p.id === 'stok')!)}
                          disabled={running}
                        >
                          Kontrol Et
                        </button>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Kulaklık</td>
                    <td>22</td>
                    <td />
                  </tr>
                </tbody>
              </table>
              {showStokResult && <div className={styles.mockNotice}>⚠️ Mouse Pad eşiğin altında — depo sorumlusuna mail tetiklendi</div>}
            </div>
          </div>

          <div className={styles.widgetCard}>
            <div className={styles.widgetTitle}>🔎 Müşteri Ara</div>
            <div className={styles.searchRow}>
              <input
                className={styles.mockSearchInput}
                placeholder="isim ara..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              />
              <button type="button" className={styles.mockSmallBtn} onClick={runSearch} disabled={running}>
                Ara
              </button>
            </div>
            {showResult && (
              <ul className={styles.mockResultList}>
                {filteredCustomers.map((c) => (
                  <li key={c.email}>
                    {c.ad} <span className={styles.mockMuted}>· {c.email}</span>
                  </li>
                ))}
                {filteredCustomers.length === 0 && <li className={styles.mockMuted}>sonuç yok</li>}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className={styles.presetRow}>
        <span className={styles.presetRowLabel}>Hazır senaryoyu builder'a yükle (çalıştırmadan incele/düzenle):</span>
        {PRESETS.map((p) => (
          <button key={p.id} type="button" className={styles.presetBtn} onClick={() => loadPresetOnly(p)}>
            {p.label}
          </button>
        ))}
        <button type="button" className={clsx(styles.presetBtn, styles.presetClear)} onClick={clearAll}>
          🧹 Temizle
        </button>
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
          {steps.length === 0 && <div className={styles.emptyPipeline}>henüz adım yok — yukarıdan ekle ya da bir widget'ı tetikle</div>}
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
            {running ? '⏳ Çalışıyor...' : "▶️ Pipeline'ı Çalıştır"}
          </button>
        </div>

        <div className={styles.side}>
          <div className={styles.jsonPanel}>
            <div className={styles.panelTitle}>📄 Üretilen event JSON</div>
            <pre className={styles.json}>
{`{
  "trigger": "${triggerLabel}",
  "steps": [
${steps.map((s) => `    { "type": "${s.type}", "params": ${JSON.stringify(s.params)} }`).join(',\n')}
  ]
}`}
            </pre>
          </div>
          <div className={styles.logPanel}>
            <div className={styles.panelTitle}>⚡ Servis akışı (simülasyon)</div>
            {logs.length === 0 && <div className={styles.emptyPipeline}>bir widget'ı tetikleyince akış burada görünür</div>}
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
