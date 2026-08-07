import React, { type ReactNode } from 'react';
import OriginalDocItemTOCDesktop from '@theme-original/DocItem/TOC/Desktop';
import type DocItemTOCDesktopType from '@theme/DocItem/TOC/Desktop';
import type { WrapperProps } from '@docusaurus/types';
import { useCodeRail } from '@site/src/contexts/CodeRail';
import styles from './styles.module.css';

type Props = WrapperProps<typeof DocItemTOCDesktopType>;

/** Başlık listesinin altına, MDX'teki <CodeRail> öğelerinin kaydettiği kodları sırayla render eder. */
export default function DocItemTOCDesktop(props: Props): ReactNode {
  const rail = useCodeRail();
  return (
    <>
      <OriginalDocItemTOCDesktop {...props} />
      {rail?.items.map(({ id, content }) => (
        <div className={styles.railSlot} key={id}>
          {content}
        </div>
      ))}
    </>
  );
}
