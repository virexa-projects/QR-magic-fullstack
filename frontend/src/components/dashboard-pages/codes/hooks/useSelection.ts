// components/dashboard-pages/codes/hooks/useSelection.ts
import { useEffect, useMemo, useState } from "react";

export function useSelection(currentPageIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Drop any selected ids that scrolled off the current page's dataset
  // (e.g. after a search, filter, or page change) so stale selections
  // don't silently apply bulk actions to items no longer visible.
  useEffect(() => {
    setSelected((prev) => {
      const idSet = new Set(currentPageIds);
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (idSet.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [currentPageIds]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allOnPageSelected = useMemo(
    () => currentPageIds.length > 0 && currentPageIds.every((id) => selected.has(id)),
    [currentPageIds, selected]
  );

  const toggleAllOnPage = () =>
    setSelected((prev) => {
      if (allOnPageSelected) {
        const next = new Set(prev);
        currentPageIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      currentPageIds.forEach((id) => next.add(id));
      return next;
    });

  const clear = () => setSelected(new Set());

  return {
    selected,
    selectedIds: Array.from(selected),
    count: selected.size,
    isSelected: (id: string) => selected.has(id),
    toggle,
    allOnPageSelected,
    toggleAllOnPage,
    clear,
  };
}
