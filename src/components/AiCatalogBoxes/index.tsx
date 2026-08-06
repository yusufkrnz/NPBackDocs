import type { ReactNode } from 'react';
import CodeBlock from '@theme/CodeBlock';
import styles from './styles.module.css';

type CatalogBox = {
  kind: 'Tool' | 'Component';
  name: string;
  description: string;
  language: string;
  code: string;
};

const BOXES: CatalogBox[] = [
  {
    kind: 'Tool',
    name: 'get_overdue_customers',
    description:
      'CRM (müşteri) ve ERP (tahsilat) verisini birleştirip ödemesi geciken müşterileri getirir — LLM sadece bu imzayı görür, gövdeyi görmez.',
    language: 'python',
    code: `async def get_overdue_customers(min_days_overdue: int = 30):
    return await receivables_service.list_overdue_customers(min_days_overdue)`,
  },
  {
    kind: 'Component',
    name: 'DataTable',
    description: 'Satır/sütun verisini tablo olarak gösteren, önceden yazılmış sabit component.',
    language: 'tsx',
    code: `type DataTableProps = {
  columns: string[];
  rows: Record<string, string | number>[];
};`,
  },
];

export default function AiCatalogBoxes(): ReactNode {
  return (
    <div className={styles.grid}>
      {BOXES.map((box) => (
        <div className={styles.box} key={box.name}>
          <div className={styles.boxHeader}>
            <span className={styles.boxKind}>{box.kind}</span>
            <span className={styles.boxName}>{box.name}</span>
          </div>
          <p className={styles.boxDescription}>{box.description}</p>
          <div className={styles.boxCode}>
            <CodeBlock language={box.language}>{box.code}</CodeBlock>
          </div>
        </div>
      ))}
    </div>
  );
}
