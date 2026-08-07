import React, { type ReactNode } from 'react';
import OriginalDocItemTOCMobile from '@theme-original/DocItem/TOC/Mobile';
import type DocItemTOCMobileType from '@theme/DocItem/TOC/Mobile';
import type { WrapperProps } from '@docusaurus/types';
import { useCodeRail } from '@site/src/contexts/CodeRail';
import styles from './styles.module.css';

type Props = WrapperProps<typeof DocItemTOCMobileType>;

/** Mobilde de <CodeRail> içeriği kaybolmasın diye aynısı burada da render edilir — masaüstünde gizlenir. */
export default function DocItemTOCMobile(props: Props): ReactNode {
  const rail = useCodeRail();
  return (
    <>
      <OriginalDocItemTOCMobile {...props} />
      {rail && rail.items.length > 0 && (
        <div className={styles.railSlotMobile}>
          {rail.items.map(({ id, content }) => (
            <div key={id} style={{ margin: '1rem 0' }}>
              {content}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
