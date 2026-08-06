import type { ReactNode } from 'react';
import CodeBlock from '@theme/CodeBlock';
import styles from './styles.module.css';

const LLM_OUTPUT_JSON = `{
  "component": "DataTable",
  "columns": ["Sipariş No", "Tarih", "Tutar"]
}`;

const RENDER_EVENT_JSON = `{
  "component": "DataTable",
  "props": {
    "columns": ["Sipariş No", "Tarih", "Tutar"],
    "rows": [
      { "Sipariş No": "#4821", "Tarih": "2026-08-01", "Tutar": "₺1.240" },
      { "Sipariş No": "#4799", "Tarih": "2026-07-28", "Tutar": "₺320" },
      { "Sipariş No": "#4765", "Tarih": "2026-07-19", "Tutar": "₺890" }
    ]
  }
}`;

const ROWS = [
  { order: '#4821', date: '2026-08-01', amount: '₺1.240' },
  { order: '#4799', date: '2026-07-28', amount: '₺320' },
  { order: '#4765', date: '2026-07-19', amount: '₺890' },
];

type AiChatMockProps = {
  /** Kontrollü mod: dışarıdan verilirse kendi zamanlayıcısı yerine bunu kullanır. */
  revealed?: boolean;
};

export default function AiChatMock({ revealed }: AiChatMockProps = {}): ReactNode {
  const phase: 'thinking' | 'rendered' = revealed ? 'rendered' : 'thinking';

  return (
    <>
      <div className={styles.chat}>
        <div className={`${styles.bubbleRow} ${styles.bubbleRowEnd}`}>
          <div className={`${styles.bubble} ${styles.bubbleUser}`}>Son 5 siparişimi göster</div>
        </div>

        <div className={styles.bubbleRow}>
          <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
            {phase === 'thinking' ? (
              <span className={styles.thinking} aria-label="LLM yanıt hazırlıyor">
                <span className={styles.thinkingDot} />
                <span className={styles.thinkingDot} />
                <span className={styles.thinkingDot} />
              </span>
            ) : (
              <>
                <table className={styles.renderedTable}>
                  <thead>
                    <tr>
                      <th>Sipariş No</th>
                      <th>Tarih</th>
                      <th>Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((row) => (
                      <tr key={row.order}>
                        <td>{row.order}</td>
                        <td>{row.date}</td>
                        <td>{row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={styles.caption}>
                  ↑ Bu tablo LLM'in yazdığı HTML değil — component registry'nin{' '}
                  <code>DataTable</code>'ı gerçek props'la render etmesi.
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.jsonGrid}>
        <div>
          <p className={styles.jsonCaption}>
            <strong>LLM'in ürettiği JSON</strong> — sadece component ve kolon isimleri, satır verisi yok:
          </p>
          <CodeBlock language="json" title="LLM çıktısı (tool_use: render_ui)">
            {LLM_OUTPUT_JSON}
          </CodeBlock>
        </div>
        <div>
          <p className={styles.jsonCaption}>
            <strong>Backend'in client'a gönderdiği nihai JSON</strong> — gerçek <code>rows</code>, LLM'in
            kararından <em>sonra</em>, LLM'in hiç görmediği DB sonucundan eklendi:
          </p>
          <CodeBlock language="json" title="render event (Backend → Chat UI)">
            {RENDER_EVENT_JSON}
          </CodeBlock>
        </div>
      </div>
    </>
  );
}
