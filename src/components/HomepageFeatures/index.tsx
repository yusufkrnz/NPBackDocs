import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
  to: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Rehberler',
    to: '/guides',
    description: 'Kod yazma standartları, mimari kararlar ve nasıl-yapılır rehberleri.',
  },
  {
    title: 'Servisler',
    to: '/services',
    description: 'Her servisin sorumluluğu, bağımlılıkları, sahip olduğu veri ve endpoint tablosu.',
  },
  {
    title: 'Kullanım Senaryoları',
    to: '/use-cases',
    description: 'Uçtan uca senaryolar, sequence diagram ile hangi servisin hangi endpoint\'i çağırdığı.',
  },
  {
    title: 'AI Katmanı',
    to: '/ai',
    description: 'LLM\'in guardrailed generative UI ile ekrana dinamik UI bastırma mimarisi.',
  },
  {
    title: 'AWS',
    to: '/aws',
    description: 'Kullandığımız AWS servisleri — Bedrock ve ileride eklenecek diğerleri.',
  },
];

function Feature({title, description, to}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">
          <Link to={to}>{title}</Link>
        </Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
