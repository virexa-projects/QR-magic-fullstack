"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { Edit3, Pause, Play, Download, Search, Plus, Lock, BarChart3, Palette, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import QRDesignDialog from "@/components/dashboard/QRDesignDialog";
import DownloadPopover from "@/components/dashboard/DownloadPopover";
import { fetchQrCodes, updateQr, deleteQr, QrCode, QrDesign, QrType, QrStatus } from "@/store/slices/qrSlice";

const typeColors: Record<string, string> = {
  url: "bg-primary-soft text-primary",
  text: "bg-secondary text-foreground",
  whatsapp: "bg-success/10 text-success",
  wifi: "bg-warning/10 text-warning",
  vcard: "bg-accent text-accent-foreground",
  email: "bg-primary-soft text-primary",
  phone: "bg-success/10 text-success",
  sms: "bg-warning/10 text-warning",
  location: "bg-accent text-accent-foreground",
};

const defaultDesign: QrDesign = {
  fgColor: "#000000",
  bgColor: "#FFFFFF",
  dotStyle: "square",
  frame: "none",
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// --- Type-aware destination <-> friendly-fields conversion ----------------
// Mirrors the same encoding logic used in the Create flow (getQRValue),
// but in reverse: given a QrCode, produce the plain values a person
// actually wants to see and edit ("9944943242" not "tel:9944943242").
// content is the preferred source (already structured per type); we only
// fall back to parsing the destination string for older docs saved
// before content existed.
function getEditableFields(q: QrCode): Record<string, string> {
  if (q.content && Object.keys(q.content).length > 0) {
    // content stores primitives per type already — stringify anything
    // that isn't (e.g. vcard's phones/emails/socials arrays) so it's
    // safe to bind to a plain text input if needed.
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(q.content)) {
      out[k] = typeof v === "string" ? v : JSON.stringify(v);
    }
    return out;
  }

  // Fallback: parse the raw destination string for legacy docs with no content
  const d = q.destination;
  switch (q.type) {
    case "url":
      return { url: d };
    case "text":
      return { text: d };
    case "phone":
      return { phone: d.replace(/^tel:/, "") };
    case "whatsapp": {
      const m = d.match(/^https:\/\/wa\.me\/(\d+)(?:\?text=(.*))?$/);
      return { phone: m?.[1] ?? "", message: m?.[2] ? decodeURIComponent(m[2]) : "" };
    }
    case "sms": {
      const m = d.match(/^sms:([^?]*)\??(?:body=(.*))?$/);
      return { phone: m?.[1] ?? "", message: m?.[2] ? decodeURIComponent(m[2]) : "" };
    }
    case "email": {
      const m = d.match(/^mailto:([^?]*)\??(?:subject=([^&]*))?&?(?:body=(.*))?$/);
      return {
        email: m?.[1] ?? "",
        subject: m?.[2] ? decodeURIComponent(m[2]) : "",
        body: m?.[3] ? decodeURIComponent(m[3]) : "",
      };
    }
    case "wifi": {
      const m = d.match(/^WIFI:T:([^;]*);S:([^;]*);P:([^;]*);;$/);
      return { encryption: m?.[1] ?? "WPA", ssid: m?.[2] ?? "", password: m?.[3] ?? "" };
    }
    case "location": {
      const m = d.match(/^geo:([^,]*),(.*)$/);
      return { latitude: m?.[1] ?? "", longitude: m?.[2] ?? "" };
    }
    default:
      return {};
  }
}

// Reverse direction: friendly field values -> the raw destination string
// your QR scanner / phone actually needs to act on.
function buildDestination(type: QrType, fields: Record<string, string>): string {
  switch (type) {
    case "url":
      return fields.url || "https://example.com";
    case "text":
      return fields.text || "";
    case "phone":
      return `tel:${fields.phone || ""}`;
    case "whatsapp": {
      const phone = (fields.phone || "").replace(/\D/g, "");
      const msg = fields.message ? `?text=${encodeURIComponent(fields.message)}` : "";
      return `https://wa.me/${phone}${msg}`;
    }
    case "sms":
      return `sms:${fields.phone || ""}?body=${encodeURIComponent(fields.message || "")}`;
    case "email":
      return `mailto:${fields.email || ""}?subject=${encodeURIComponent(fields.subject || "")}&body=${encodeURIComponent(fields.body || "")}`;
    case "wifi":
      return `WIFI:T:${fields.encryption || "WPA"};S:${fields.ssid || ""};P:${fields.password || ""};;`;
    case "location":
      return `geo:${fields.latitude || "0"},${fields.longitude || "0"}`;
    case "vcard": {
      // vCard has too many nested fields (phones/emails/socials arrays) for
      // a quick inline edit — full editing happens via the Design/Create
      // flow. We still allow editing the top-level name/role/company here.
      const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${fields.fullName || ""}`, `TITLE:${fields.role || ""}`, `ORG:${fields.company || ""}`];
      try {
        const phones = fields.phones ? JSON.parse(fields.phones) : [];
        const emails = fields.emails ? JSON.parse(fields.emails) : [];
        const socials = fields.socials ? JSON.parse(fields.socials) : [];
        phones.forEach((p: any) => lines.push(`TEL;TYPE=${(p.label || "CELL").toUpperCase()}:${p.value}`));
        emails.forEach((e: any) => lines.push(`EMAIL;TYPE=${(e.label || "WORK").toUpperCase()}:${e.value}`));
        socials.forEach((s: any) => lines.push(`URL;TYPE=${(s.label || "URL").toUpperCase()}:${s.value}`));
      } catch {
        /* ignore malformed JSON, keep name/role/company only */
      }
      lines.push("END:VCARD");
      return lines.join("\n");
    }
    default:
      return fields.destination || "";
  }
}

// Friendly field metadata per type — label, placeholder, input type.
// Drives which inputs the edit dialog renders for a given QR type.
const FIELD_CONFIG: Record<QrType, { key: string; label: string; placeholder: string; type?: string; multiline?: boolean }[]> = {
  url: [{ key: "url", label: "Website URL", placeholder: "https://yourwebsite.com", type: "url" }],
  text: [{ key: "text", label: "Text content", placeholder: "Enter text…", multiline: true }],
  phone: [{ key: "phone", label: "Phone number", placeholder: "9944943242", type: "tel" }],
  whatsapp: [
    { key: "phone", label: "Phone (with country code)", placeholder: "919944943242", type: "tel" },
    { key: "message", label: "Pre-filled message", placeholder: "Hi! Found you via QR" },
  ],
  sms: [
    { key: "phone", label: "Phone number", placeholder: "9944943242", type: "tel" },
    { key: "message", label: "Message", placeholder: "Your message…" },
  ],
  email: [
    { key: "email", label: "Email address", placeholder: "hello@example.com", type: "email" },
    { key: "subject", label: "Subject", placeholder: "Subject" },
    { key: "body", label: "Message", placeholder: "Your message…", multiline: true },
  ],
  wifi: [
    { key: "ssid", label: "Network name (SSID)", placeholder: "MyWiFi" },
    { key: "password", label: "Password", placeholder: "••••••••", type: "password" },
  ],
  location: [
    { key: "latitude", label: "Latitude", placeholder: "28.6139" },
    { key: "longitude", label: "Longitude", placeholder: "77.2090" },
  ],
  vcard: [
    { key: "fullName", label: "Full name", placeholder: "Rahul Sharma" },
    { key: "role", label: "Job title / role", placeholder: "Marketing Manager" },
    { key: "company", label: "Company", placeholder: "Your Company" },
  ],
};

function CodesInner() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, pagination, loading, actionLoading } = useSelector((state: RootState) => state.qr);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "scans" | "name">("recent");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editing, setEditing] = useState<QrCode | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [designing, setDesigning] = useState<QrCode | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, typeFilter, statusFilter, sortBy, pageSize]);

  useEffect(() => {
    dispatch(
      fetchQrCodes({
        page,
        limit: pageSize,
        search: debouncedQuery || undefined,
        type: typeFilter !== "all" ? (typeFilter as QrType) : undefined,
        status: statusFilter !== "all" ? (statusFilter as QrStatus) : undefined,
        sort: sortBy,
      })
    );
  }, [dispatch, page, pageSize, debouncedQuery, typeFilter, statusFilter, sortBy]);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const toggleStatus = async (q: QrCode) => {
    const nextStatus = q.status === "active" ? "paused" : "active";
    try {
      await dispatch(updateQr({ id: q._id, data: { status: nextStatus } })).unwrap();
    } catch {
      // updateQr thunk already toasts the error
    }
  };

  const openEdit = (q: QrCode) => {
    if (!q.isDynamic) {
      toast.error("Static QRs can't be edited", { description: "Re-create as dynamic to enable editing." });
      return;
    }
    setEditing(q);
    setEditFields(getEditableFields(q));
  };

  const setEditField = (key: string, value: string) =>
    setEditFields((prev) => ({ ...prev, [key]: value }));

  const saveEdit = async () => {
    if (!editing) return;
    const newDestination = buildDestination(editing.type, editFields);
    try {
      await dispatch(
        updateQr({
          id: editing._id,
          data: { destination: newDestination, content: editFields },
        })
      ).unwrap();
      toast.success("Destination updated", { description: "Existing printed QRs now point to the new destination." });
      setEditing(null);
    } catch {
      // updateQr thunk already toasts the error
    }
  };

  const saveDesign = async (d: QrDesign) => {
    if (!designing) return;
    try {
      await dispatch(updateQr({ id: designing._id, data: { design: d } })).unwrap();
      setDesigning(null);
    } catch {
      // updateQr thunk already toasts the error
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await dispatch(deleteQr(id)).unwrap();
      if (items.length === 1 && page > 1) {
        setPage((p) => p - 1);
      }
    } catch {
      // deleteQr thunk already toasts the error
    }
  };

  const totalPages = Math.max(pagination.totalPages || 1, 1);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const pageNumbers = useMemo(() => {
    const nums: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    const realStart = Math.max(1, end - 4);
    for (let n = realStart; n <= end; n++) nums.push(n);
    return nums;
  }, [page, totalPages]);

  const editFieldConfig = editing ? FIELD_CONFIG[editing.type] ?? [] : [];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">My QR Codes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading
              ? "Loading…"
              : `${pagination.total} code${pagination.total === 1 ? "" : "s"} total — page ${pagination.page} of ${totalPages}`}
          </p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-blue self-start md:self-auto">
          <Link href="/dashboard/create"><Plus className="w-4 h-4 mr-1" /> Create QR Code</Link>
        </Button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name…" className="pl-9 h-10 bg-card" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[160px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="url">Website</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="wifi">Wi-Fi</SelectItem>
            <SelectItem value="vcard">vCard</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="location">Location</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[140px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "recent" | "scans" | "name")}>
          <SelectTrigger className="h-10 w-full sm:w-[160px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="scans">Most scanned</SelectItem>
            <SelectItem value="name">Name (A–Z)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
          <SelectTrigger className="h-10 w-full sm:w-[120px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-5 py-3">QR</th>
                <th className="text-left font-semibold px-3 py-3">Name & Type</th>
                <th className="text-left font-semibold px-3 py-3 hidden md:table-cell">Destination</th>
                <th className="text-right font-semibold px-3 py-3">Scans</th>
                <th className="text-left font-semibold px-3 py-3">Status</th>
                <th className="text-right font-semibold px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">No QR codes match your filters.</td></tr>
              )}
              {loading && items.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">Loading your QR codes…</td></tr>
              )}
              {items.map((q, i) => {
                const design = q.design ?? defaultDesign;
                return (
                  <motion.tr
                    key={q._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => router.push(`/dashboard/codes/${q._id}`)}
                    
                    className="border-t border-border/60 hover:bg-secondary/40 transition cursor-pointer group"
                  >
                    <td className="px-5 py-3" onClick={stop}>
                      <DownloadPopover
                        value={q.destination}
                        design={design}
                        filename={q.name}
                        trigger={
                          <button title="Click to download" className="block p-1.5 rounded-lg border border-border bg-white hover:border-primary/50 hover:shadow-sm transition">
                            <QRCodeCanvas value={q.destination} size={48} fgColor={design.fgColor} bgColor={design.bgColor} level="M" includeMargin={false} />
                          </button>
                        }
                      />
                    </td>

                    <td className="px-3 py-3">
                      <Badge className={`${typeColors[q.type] ?? "bg-secondary text-foreground"} border-0 font-semibold uppercase text-[9px] mb-1`}>{q.type}</Badge>
                      <div className="font-semibold text-foreground group-hover:text-primary transition text-sm">{q.name}</div>
                      <div className="text-[10px] text-muted-foreground">Created {new Date(q.createdAt).toLocaleDateString("en-IN")}</div>
                    </td>

                    <td className="px-3 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2 max-w-xs">
                        <span className="text-foreground truncate text-xs font-mono">{q.destination}</span>
                        {q.isDynamic ? (
                          <Badge variant="outline" className="text-[9px] border-primary/30 text-primary shrink-0">DYNAMIC</Badge>
                        ) : (
                          <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right">
                      <div className="font-bold font-heading text-sm">{q.scansTotal.toLocaleString("en-IN")}</div>
                      {q.scansToday > 0 && (
                        <div className="text-[10px] text-success font-semibold">+{q.scansToday} today</div>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <button
                        disabled={actionLoading}
                        onClick={(e) => { stop(e); toggleStatus(q); }}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 ${
                          q.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${q.status === "active" ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                        {q.status}
                      </button>
                    </td>

                    <td className="px-5 py-3" onClick={stop}>
                      <div className="flex items-center justify-end gap-1">
                        <DownloadPopover
                          value={q.destination}
                          design={design}
                          filename={q.name}
                          trigger={
                            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-border hover:border-primary/50 hover:text-primary">
                              <Download className="w-3.5 h-3.5" /> Download
                            </Button>
                          }
                        />
                        <IconBtn title="Edit destination" onClick={() => openEdit(q)}><Edit3 className="w-3.5 h-3.5" /></IconBtn>
                        <IconBtn title="Customize design" onClick={() => setDesigning(q)} accent><Palette className="w-3.5 h-3.5" /></IconBtn>
                        <IconBtn title="Analytics" onClick={() => router.push(`/dashboard/codes/${q._id}`)}><BarChart3 className="w-3.5 h-3.5" /></IconBtn>
                        <IconBtn title={q.status === "active" ? "Pause" : "Resume"} onClick={() => toggleStatus(q)}>
                          {q.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </IconBtn>
                        <IconBtn title="Delete" onClick={() => deleteItem(q._id)} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-5 py-3 border-t border-border/60 bg-secondary/30">
          <span className="text-xs text-muted-foreground">
            {pagination.total > 0
              ? `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`
              : "No results"}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={!canPrev} title="First page" className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button onClick={() => canPrev && setPage((p) => p - 1)} disabled={!canPrev} title="Previous page" className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {pageNumbers.map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                  n === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {n}
              </button>
            ))}
            <button onClick={() => canNext && setPage((p) => p + 1)} disabled={!canNext} title="Next page" className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={!canNext} title="Last page" className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit destination dialog — type-aware, friendly fields only */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit destination</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Editing updates where the printed QR points — <span className="text-foreground font-semibold">no need to reprint</span>.
            </p>

            {editFieldConfig.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">{f.label}</Label>
                {f.multiline ? (
                  <Textarea
                    value={editFields[f.key] || ""}
                    onChange={(e) => setEditField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="bg-card text-sm min-h-[90px]"
                  />
                ) : (
                  <Input
                    type={f.type || "text"}
                    value={editFields[f.key] || ""}
                    onChange={(e) => setEditField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="bg-card text-sm"
                  />
                )}
              </div>
            ))}

            {editing?.type === "vcard" && (
              <p className="text-[11px] text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                Phone numbers, emails, and social links aren't editable here — use{" "}
                <span className="font-semibold text-foreground">Customize design</span> or recreate the vCard to change those.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={actionLoading} className="bg-primary text-primary-foreground">
              {actionLoading ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Design dialog */}
      {designing && (
        <QRDesignDialog
          open={!!designing}
          onOpenChange={(o) => !o && setDesigning(null)}
          initial={designing.design ?? defaultDesign}
          qrValue={designing.destination}
          qrName={designing.name}
          onSave={saveDesign}
        />
      )}
    </div>
  );
}

function IconBtn({ children, onClick, title, accent, danger }: { children: React.ReactNode; onClick: () => void; title: string; accent?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition ${danger
          ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          : accent
            ? "text-muted-foreground hover:bg-primary-soft hover:text-primary"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        }`}
    >
      {children}
    </button>
  );
}

export default function CodesContent() {
  return <CodesInner />;
}