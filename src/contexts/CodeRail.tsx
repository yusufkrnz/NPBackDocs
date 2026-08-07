import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type CodeRailContextValue = {
  items: Array<{ id: string; content: ReactNode }>;
  register: (id: string, content: ReactNode) => void;
  unregister: (id: string) => void;
};

const CodeRailContext = createContext<CodeRailContextValue | null>(null);

export function CodeRailProvider({ children }: { children: ReactNode }) {
  const [order, setOrder] = useState<string[]>([]);
  const [contentMap, setContentMap] = useState<Record<string, ReactNode>>({});

  const register = useCallback((id: string, content: ReactNode) => {
    setContentMap((prev) => ({ ...prev, [id]: content }));
    setOrder((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const unregister = useCallback((id: string) => {
    setContentMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setOrder((prev) => prev.filter((existing) => existing !== id));
  }, []);

  const items = useMemo(() => order.map((id) => ({ id, content: contentMap[id] })), [order, contentMap]);

  const value = useMemo(() => ({ items, register, unregister }), [items, register, unregister]);

  return <CodeRailContext.Provider value={value}>{children}</CodeRailContext.Provider>;
}

export function useCodeRail(): CodeRailContextValue | null {
  return useContext(CodeRailContext);
}
