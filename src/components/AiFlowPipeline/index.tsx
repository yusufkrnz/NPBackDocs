import type { ReactNode } from 'react';
import AiDarkCode from '../AiDarkCode';
import AiJsonRenderPanel from '../AiJsonRenderPanel';
import { renderJson } from '../AiJsonRenderPanel/renderJson';
import styles from './styles.module.css';

const CATALOG_SENT = {
  tools: [{ name: 'get_overdue_customers', input_schema: '...' }],
  components: [{ name: 'DataTable', input_schema: '...' }],
};

const TOOL_USE = {
  type: 'tool_use',
  name: 'get_overdue_customers',
  input: { min_days_overdue: 30 },
};

const TOOL_RESULT_SHAPE = {
  row_count: 3,
  columns: [
    { name: 'Müşteri', type: 'string' },
    { name: 'Gecikme (gün)', type: 'integer' },
    { name: 'Risk Tutarı', type: 'currency' },
  ],
};

const ROWS = [
  { Müşteri: 'Akgün Ticaret', 'Gecikme (gün)': 46, 'Risk Tutarı': '₺28.400' },
  { Müşteri: 'Deniz Yapı A.Ş.', 'Gecikme (gün)': 38, 'Risk Tutarı': '₺61.200' },
  { Müşteri: 'Pınar Lojistik', 'Gecikme (gün)': 31, 'Risk Tutarı': '₺12.750' },
];

const RENDER_EVENT = {
  component: 'DataTable',
  props: {
    columns: ['Müşteri', 'Gecikme (gün)', 'Risk Tutarı'],
    rows: ROWS,
  },
};

export default function AiFlowPipeline(): ReactNode {
  return (
    <div className={styles.pipeline}>
      <div className={styles.sources}>
        <div className={styles.sourceBox}>
          <div className={styles.sourceKind}>Tool Catalog</div>
          <div className={styles.sourceName}>get_overdue_customers</div>
        </div>
        <div className={styles.sourceBox}>
          <div className={styles.sourceKind}>UI Catalog</div>
          <div className={styles.sourceName}>DataTable</div>
        </div>
      </div>

      <div className={styles.item}>
        <span className={`${styles.dot} ${styles.dotNode}`} />
        <div className={styles.node}>
          <div className={styles.nodeTitle}>Backend</div>
          <div className={styles.nodeDesc}>İki katalogdan LLM'e gönderilecek mesajı hazırlar.</div>
        </div>
      </div>

      <div className={styles.item}>
        <span className={styles.dot} />
        <div className={styles.exchangeLabel}>Giden — Backend → LLM</div>
        <AiDarkCode label="katalog (isim + şema)" value={CATALOG_SENT} />
      </div>

      <div className={styles.item}>
        <span className={`${styles.dot} ${styles.dotNode}`} />
        <div className={styles.node}>
          <div className={styles.nodeTitle}>LLM</div>
          <div className={styles.nodeDesc}>Hangi veriye ihtiyacı olduğuna karar verir.</div>
        </div>
      </div>

      <div className={styles.item}>
        <span className={styles.dot} />
        <div className={styles.exchangeLabel}>Gelen — LLM → Backend</div>
        <AiDarkCode label="tool_use" value={TOOL_USE} />
      </div>

      <div className={styles.item}>
        <span className={`${styles.dot} ${styles.dotNode}`} />
        <div className={styles.node}>
          <div className={styles.nodeTitle}>Backend</div>
          <div className={styles.nodeDesc}>
            Whitelist + gerçek sorgu (CRM + ERP verisi birleşik, <code>tenant_id</code> JWT'den). Gerçek veri burada
            kalır, LLM'e gitmez.
          </div>
        </div>
      </div>

      <div className={styles.item}>
        <span className={styles.dot} />
        <div className={styles.exchangeLabel}>Giden — Backend → LLM (2. tur)</div>
        <AiDarkCode label="tool_result (sadece şekil)" value={TOOL_RESULT_SHAPE} />
      </div>

      <div className={styles.item}>
        <span className={`${styles.dot} ${styles.dotNode}`} />
        <div className={styles.node}>
          <div className={styles.nodeTitle}>LLM</div>
          <div className={styles.nodeDesc}>Şekle bakarak component + kolon seçer — satır verisini hiç görmedi.</div>
        </div>
      </div>

      <div className={styles.item}>
        <span className={`${styles.dot} ${styles.dotResult}`} />
        <div className={styles.exchangeLabel}>Son prompt sonrası: gelen JSON → ekrandaki görüntü</div>
        <div className={styles.nodeDesc} style={{ marginBottom: '0.5rem' }}>
          Soldaki JSON, LLM'in kararı ile backend'in eklediği gerçek verinin birleşimi. Sağda bunun ekranda ürettiği
          gerçek görüntü var.
        </div>
        <AiJsonRenderPanel jsonLabel="render event" renderLabel="live render" code={renderJson(RENDER_EVENT)}>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingRight: '1rem' }}>Müşteri</th>
                <th style={{ textAlign: 'left', paddingRight: '1rem' }}>Gecikme (gün)</th>
                <th style={{ textAlign: 'left' }}>Risk Tutarı</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row['Müşteri']}>
                  <td style={{ paddingRight: '1rem' }}>{row['Müşteri']}</td>
                  <td style={{ paddingRight: '1rem' }}>{row['Gecikme (gün)']}</td>
                  <td>{row['Risk Tutarı']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AiJsonRenderPanel>
      </div>
    </div>
  );
}
