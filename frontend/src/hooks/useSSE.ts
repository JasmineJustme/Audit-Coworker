import { useEffect, useMemo, useRef } from 'react';
import { sseManager } from '@/api/sse';

export function useSSE() {
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!connectedRef.current) {
      sseManager.connect();
      connectedRef.current = true;
    }
    return () => {
      // Don't disconnect on unmount - SSE is global
    };
  }, []);

  return useMemo(
    () => ({
      on: sseManager.on.bind(sseManager),
      off: sseManager.off.bind(sseManager),
    }),
    []
  );
}
