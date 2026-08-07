import { useEffect, useId, type ReactNode } from 'react';
import { useCodeRail } from '@site/src/contexts/CodeRail';

type CodeRailProps = {
  children: ReactNode;
};

/** MDX içinde kullanılır — çocuklarını ana metin akışına değil, TOC sütununun altına (sırayla) render eder. */
export default function CodeRail({ children }: CodeRailProps): null {
  const rail = useCodeRail();
  const id = useId();

  useEffect(() => {
    rail?.register(id, children);
    return () => rail?.unregister(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, children]);

  return null;
}
