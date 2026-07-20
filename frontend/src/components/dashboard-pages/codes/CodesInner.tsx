// components/dashboard-pages/codes/CodesInner.tsx
"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { updateQr } from "@/store/slices/qrSlice";

import CodesHeader from "./components/CodesHeader";
import Toolbar from "./components/Toolbar";
import StatsCards from "./components/StatsCards";
import CodeList from "./components/CodeList";
import CodesGrid from "./components/CodesGrid";
import Pagination from "./components/Pagination";
import BulkActionBar from "./components/BulkActionBar";
import DeleteDialog from "./components/DeleteDialog";

import { useCodes } from "./hooks/useCodes";
import { useCodeActions } from "./hooks/useCodeActions";
import { useDeleteQr } from "./hooks/useDeleteQr";
import { useSelection } from "./hooks/useSelection";

import type { QrCode, ViewMode } from "./codes.types";
import { defaultDesign } from "./codes.constants";

// Dialogs that only matter once a user opens them — code-split so the
// initial table/grid render doesn't pay for qr-code-styling, html-to-image,
// jsPDF, etc. up front.
const QRDesignDialog = dynamic(() => import("@/components/dashboard/QRDesignDialog"), { ssr: false });
const EditQrDialog = dynamic(() => import("./lazy/EditQrDialog"), { ssr: false });
const PreviewDialog = dynamic(() => import("./lazy/PreviewDialog"), { ssr: false });
const AnalyticsDialog = dynamic(() => import("./lazy/AnalyticsDialog"), { ssr: false });
const ShareDialog = dynamic(() => import("./lazy/ShareDialog"), { ssr: false });

export default function CodesInner() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, pagination, loading, actionLoading, filters, paging, refetch } = useCodes();
  console.log("items",items)
  const actions = useCodeActions();

  const [view, setView] = useState<ViewMode>("list");
  const [previewing, setPreviewing] = useState<QrCode | null>(null);
  const [analyzing, setAnalyzing] = useState<QrCode | null>(null);
  const [sharing, setSharing] = useState<QrCode | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const currentPageIds = useMemo(() => items.map((q) => q._id), [items]);
  const selection = useSelection(currentPageIds);

  const del = useDeleteQr({
    currentPage: paging.page,
    itemsOnPage: items.length,
    onPageEmptied: () => paging.setPage(paging.page - 1),
    onDone: () => selection.clear(),
  });

  const bulkSetStatus = async (status: "active" | "paused") => {
    if (selection.count === 0) return;
    setBulkBusy(true);
    await Promise.allSettled(selection.selectedIds.map((id) => dispatch(updateQr({ id, data: { status } })).unwrap()));
    setBulkBusy(false);
    selection.clear();
    refetch();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <CodesHeader loading={loading} total={pagination.total} page={pagination.page} totalPages={paging.totalPages} />

      <StatsCards total={pagination.total} items={items} />

      <Toolbar
        query={filters.query}
        onQueryChange={filters.setQuery}
        typeFilter={filters.typeFilter}
        onTypeChange={filters.setTypeFilter}
        statusFilter={filters.statusFilter}
        onStatusChange={filters.setStatusFilter}
        sortBy={filters.sortBy}
        onSortChange={filters.setSortBy}
        pageSize={paging.pageSize}
        onPageSizeChange={paging.setPageSize}
        view={view}
        onViewChange={setView}
      />

      <BulkActionBar
        count={selection.count}
        onClear={selection.clear}
        onPause={() => bulkSetStatus("paused")}
        onResume={() => bulkSetStatus("active")}
        onDelete={() => del.requestBulkDelete(selection.selectedIds)}
        busy={bulkBusy || del.actionLoading}
      />

      <div className="bg-card rounded-2xl border border-border/60 shadow-card overflow-hidden">
        {view === "list" ? (
          <CodeList
            items={items}
            loading={loading}
            actionLoading={actionLoading}
            isSelected={selection.isSelected}
            onToggleSelect={selection.toggle}
            allOnPageSelected={selection.allOnPageSelected}
            onToggleAllOnPage={selection.toggleAllOnPage}
            onPreview={setPreviewing}
            onEdit={actions.openEdit}
            onDesign={actions.openDesign}
            onToggleStatus={actions.toggleStatus}
            onDelete={del.requestDelete}
            onAnalytics={setAnalyzing}
            onShare={setSharing}
          />
        ) : (
          <CodesGrid
            items={items}
            loading={loading}
            actionLoading={actionLoading}
            isSelected={selection.isSelected}
            onToggleSelect={selection.toggle}
            onPreview={setPreviewing}
            onEdit={actions.openEdit}
            onDesign={actions.openDesign}
            onToggleStatus={actions.toggleStatus}
            onDelete={del.requestDelete}
            onAnalytics={setAnalyzing}
            onShare={setSharing}
          />
        )}

        <Pagination
          page={paging.page}
          pageSize={paging.pageSize}
          total={pagination.total}
          pageNumbers={paging.pageNumbers}
          canPrev={paging.canPrev}
          canNext={paging.canNext}
          onFirst={paging.goFirst}
          onPrev={paging.goPrev}
          onNext={paging.goNext}
          onLast={paging.goLast}
          onPage={paging.setPage}
        />
      </div>

      <EditQrDialog
        editing={actions.editing}
        fields={actions.editFields}
        actionLoading={actions.actionLoading}
        onFieldChange={actions.setEditField}
        onClose={actions.closeEdit}
        onSave={actions.saveEdit}
      />

      {actions.designing && (
        <QRDesignDialog
          open={!!actions.designing}
          onOpenChange={(o: boolean) => !o && actions.closeDesign()}
          initial={actions.designing.design ?? defaultDesign}
          qrValue={actions.designing.destination}
          qrName={actions.designing.name}
          onSave={actions.saveDesign}
        />
      )}

      <PreviewDialog qr={previewing} onClose={() => setPreviewing(null)} />
      <AnalyticsDialog qr={analyzing} onClose={() => setAnalyzing(null)} />
      <ShareDialog qr={sharing} onClose={() => setSharing(null)} />

      <DeleteDialog target={del.target} deleting={del.deleting} onCancel={del.cancel} onConfirm={del.confirm} />
    </div>
  );
}
