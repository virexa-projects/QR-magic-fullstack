"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { mockQRs, QRItem, QRDesign } from "@/lib/mockData";
import { Edit3, Pause, Play, Download, Search, Plus, Lock, BarChart3, Palette, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import QRDesignDialog from "@/components/dashboard/QRDesignDialog";
import DownloadPopover from "@/components/dashboard/DownloadPopover";

const typeColors: Record<string, string> = {
  url: "bg-primary-soft text-primary",
  whatsapp: "bg-success/10 text-success",
  wifi: "bg-warning/10 text-warning",
  vcard: "bg-accent text-accent-foreground",
};

function CodesInner() {
  const router = useRouter();
  const [items, setItems] = useState<QRItem[]>(mockQRs);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [editing, setEditing] = useState<QRItem | null>(null);
  const [editValue, setEditValue] = useState("");
  const [designing, setDesigning] = useState<QRItem | null>(null);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const filtered = useMemo(() => {
    let list = items.filter((q) =>
      (q.name.toLowerCase().includes(query.toLowerCase()) ||
        q.destination.toLowerCase().includes(query.toLowerCase())) &&
      (typeFilter === "all" || q.type === typeFilter)
    );
    if (sortBy === "scans") list = [...list].sort((a, b) => b.scans - a.scans);
    else if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [items, query, typeFilter, sortBy]);

  const toggleStatus = (id: string) => {
    setItems((prev) => prev.map((q) => q.id === id ? { ...q, status: q.status === "active" ? "paused" : "active" } : q));
    toast.success("Status updated");
  };

  const openEdit = (q: QRItem) => {
    if (!q.isDynamic) {
      toast.error("Static QRs can't be edited", { description: "Re-create as dynamic to enable editing." });
      return;
    }
    setEditing(q);
    setEditValue(q.destination);
  };

  const saveEdit = () => {
    if (!editing) return;
    setItems((prev) => prev.map((q) => q.id === editing.id ? { ...q, destination: editValue } : q));
    toast.success("Destination updated", { description: "Existing printed QRs now point to the new URL." });
    setEditing(null);
  };

  const saveDesign = (d: QRDesign) => {
    if (!designing) return;
    setItems((prev) => prev.map((q) => q.id === designing.id ? { ...q, design: d } : q));
    toast.success("Design saved");
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((q) => q.id !== id));
    toast.success("Deleted");
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">My QR Codes</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} of {items.length} codes</p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-blue self-start md:self-auto">
          <Link href="/dashboard/create"><Plus className="w-4 h-4 mr-1" /> Create QR Code</Link>
        </Button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or destination…" className="pl-9 h-10 bg-card" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[180px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="url">Website</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="wifi">Wi-Fi</SelectItem>
            <SelectItem value="vcard">vCard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-10 w-full sm:w-[180px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="scans">Most scanned</SelectItem>
            <SelectItem value="name">Name (A–Z)</SelectItem>
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
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">No QR codes match your filters.</td></tr>
              )}
              {filtered.map((q, i) => (
                <motion.tr
                  key={q.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => router.push(`/dashboard/codes/${q.id}`)}
                  className="border-t border-border/60 hover:bg-secondary/40 transition cursor-pointer group"
                >
                  {/* QR thumbnail */}
                  <td className="px-5 py-3" onClick={stop}>
                    <DownloadPopover
                      value={q.destination}
                      design={q.design}
                      filename={q.name}
                      trigger={
                        <button title="Click to download" className="block p-1.5 rounded-lg border border-border bg-white hover:border-primary/50 hover:shadow-sm transition">
                          <QRCodeCanvas value={q.destination} size={48} fgColor={q.design.fgColor} bgColor={q.design.bgColor} level="M" includeMargin={false} />
                        </button>
                      }
                    />
                  </td>

                  {/* Name + type */}
                  <td className="px-3 py-3">
                    <Badge className={`${typeColors[q.type]} border-0 font-semibold uppercase text-[9px] mb-1`}>{q.type}</Badge>
                    <div className="font-semibold text-foreground group-hover:text-primary transition text-sm">{q.name}</div>
                    <div className="text-[10px] text-muted-foreground">Created {q.createdAt}</div>
                  </td>

                  {/* Destination */}
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

                  {/* Scans */}
                  <td className="px-3 py-3 text-right">
                    <div className="font-bold font-heading text-sm">{q.scans.toLocaleString("en-IN")}</div>
                    {q.scansToday > 0 && (
                      <div className="text-[10px] text-success font-semibold">+{q.scansToday} today</div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3">
                    <button onClick={(e) => { stop(e); toggleStatus(q.id); }} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      q.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${q.status === "active" ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                      {q.status}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3" onClick={stop}>
                    <div className="flex items-center justify-end gap-1">
                      <DownloadPopover
                        value={q.destination}
                        design={q.design}
                        filename={q.name}
                        trigger={
                          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-border hover:border-primary/50 hover:text-primary">
                            <Download className="w-3.5 h-3.5" /> Download
                          </Button>
                        }
                      />
                      <IconBtn title="Edit destination" onClick={() => openEdit(q)}><Edit3 className="w-3.5 h-3.5" /></IconBtn>
                      <IconBtn title="Customize design" onClick={() => setDesigning(q)} accent><Palette className="w-3.5 h-3.5" /></IconBtn>
                      <IconBtn title="Analytics" onClick={() => router.push(`/dashboard/codes/${q.id}`)}><BarChart3 className="w-3.5 h-3.5" /></IconBtn>
                      <IconBtn title={q.status === "active" ? "Pause" : "Resume"} onClick={() => toggleStatus(q.id)}>
                        {q.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </IconBtn>
                      <IconBtn title="Delete" onClick={() => deleteItem(q.id)} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit destination dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit destination</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Editing the destination updates where the printed QR points — <span className="text-foreground font-semibold">no need to reprint</span>.
            </p>
            <Label className="text-xs">New destination</Label>
            <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="bg-card font-mono text-sm" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} className="bg-primary text-primary-foreground">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Design dialog */}
      {designing && (
        <QRDesignDialog
          open={!!designing}
          onOpenChange={(o) => !o && setDesigning(null)}
          initial={designing.design}
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
      className={`p-2 rounded-lg transition ${
        danger
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
