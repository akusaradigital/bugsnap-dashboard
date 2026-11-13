"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { getAdminHeaders, getAdminCache, setAdminCache } from "@/lib/admin-cache";
import { Icon } from "@/lib/iconify";
import { useT } from "@/components/I18nProvider";
import { Dropdown } from "@/components/Dropdown";

interface SupportTicket {
  id: string;
  category: "bug" | "feature" | "other";
  subject: string;
  message: string;
  userEmail: string;
  userPlan?: string;
  pageUrl?: string;
  userAgent?: string;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
  emailSent?: boolean;
  replies?: Array<{
    id: string;
    sender: string;
    message: string;
    created_at: string;
  }>;
}

export default function AdminSupportPage() {
  const { showToast } = useToast();
  const { t } = useT();
  const cached = getAdminCache<{ tickets: SupportTicket[]; stats: { total: number; open: number; in_progress: number; resolved: number } }>("admin_support_data");
  const [loading, setLoading] = useState(!cached);
  const [tickets, setTickets] = useState<SupportTicket[]>(cached?.tickets || []);
  const [stats, setStats] = useState(cached?.stats || { total: 0, open: 0, in_progress: 0, resolved: 0 });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Reply form
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTickets() {
    if (!tickets.length) setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/support", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("adminMisc.errTickets"));

      const newTickets = json.tickets || [];
      const newStats = json.stats || { total: 0, open: 0, in_progress: 0, resolved: 0 };
      setTickets(newTickets);
      setStats(newStats);
      setAdminCache("admin_support_data", { tickets: newTickets, stats: newStats });

      // If selected ticket is currently opened in modal, update its state
      if (selectedTicket) {
        const refreshed = newTickets.find((t: SupportTicket) => t.id === selectedTicket.id);
        if (refreshed) setSelectedTicket(refreshed);
      }
    } catch (err: unknown) {
      if (!tickets.length) showToast((err as Error)?.message || t("adminMisc.errTicketsToast"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(ticketId: string, newStatus: "open" | "in_progress" | "resolved") {
    setUpdatingStatus(ticketId);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ ticketId, status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("adminMisc.errStatus"));

      setTickets((prev) => {
        const next = prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t));
        setAdminCache("admin_support_data", { tickets: next, stats });
        return next;
      });
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      showToast(`Status tiket berhasil diubah ke ${newStatus}`, "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("adminMisc.errStatus"), "error");
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          replyMessage: replyMessage.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("adminMisc.errReply"));

      showToast(
        json.emailSent
          ? "Balasan berhasil dikirimkan via email!"
          : "Balasan tersimpan (Resend email unverified atau offline)",
        "success"
      );
      setReplyMessage("");
      loadTickets();
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("adminMisc.errReplyToast"), "error");
    } finally {
      setSendingReply(false);
    }
  }

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEmail = (t.userEmail || "").toLowerCase().includes(q);
      const matchSubject = (t.subject || "").toLowerCase().includes(q);
      const matchMsg = (t.message || "").toLowerCase().includes(q);
      if (!matchEmail && !matchSubject && !matchMsg) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex items-center gap-2"><Icon icon="lucide:inbox" className="w-4 h-4 shrink-0 text-sky-500" /> Support & Bug Report Inbox</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t("adminCopy.supportDesc")}
          </p>
        </div>
        <button
          type="button"
          onClick={loadTickets}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors inline-flex items-center gap-1.5"
        >
          {loading ? t("admin.refreshing") : (
            <>
              <Icon icon="lucide:refresh-cw" className="w-3.5 h-3.5 shrink-0" />
              <span>{t("admin.supportInbox")}</span>
            </>
          )}
        </button>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t("admin.totalSupportTickets"), value: stats.total, color: "text-slate-900 dark:text-white", border: "border-slate-200 dark:border-zinc-800" },
          { label: t("admin.openTicketsLabel"), value: stats.open, color: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-900/50" },
          { label: t("admin.ticketsInProgress"), value: stats.in_progress, color: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-900/50" },
          { label: t("admin.resolvedSupportTickets"), value: stats.resolved, color: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-900/50" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border ${s.border} bg-white dark:bg-zinc-900 p-3.5 shadow-sm`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">{s.label}</span>
            <p className={`text-2xl font-black ${s.color} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Dropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: "all", label: t("admin.allStatuses") },
              { value: "open", label: t("adminMisc.statusOpen") },
              { value: "in_progress", label: t("adminMisc.statusInProgress") },
              { value: "resolved", label: t("adminMisc.statusResolved") },
            ]}
            variant="field-white"
            className="min-w-[140px]"
          />

          <Dropdown
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val)}
            options={[
              { value: "all", label: t("adminMisc.allCategories") },
              { value: "bug", label: t("adminMisc.catBug") },
              { value: "feature", label: t("adminMisc.catFeature") },
              { value: "other", label: t("adminMisc.catOther") },
            ]}
            variant="field-white"
            className="min-w-[140px]"
          />
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder={t("adminCopy.supportSearchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
          />
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Subjek / Masalah</th>
                <th className="py-3 px-4">Pengirim</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {t("adminCopy.supportLoading")}
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {t("adminCopy.supportEmpty")}
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="hover:bg-slate-50 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      {ticket.category === "bug" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                          <Icon icon="lucide:bug" className="w-3 h-3 shrink-0" />
                          <span>BUG</span>
                        </span>
                      )}
                      {ticket.category === "feature" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/20 text-[#2563EB] dark:text-[#3B82F6] border border-blue-200 dark:border-blue-900/40">
                          <Icon icon="lucide:lightbulb" className="w-3 h-3 shrink-0" />
                          <span>FITUR</span>
                        </span>
                      )}
                      {ticket.category === "other" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                          <Icon icon="lucide:message-square" className="w-3 h-3 shrink-0" />
                          <span>SUPPORT</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {ticket.subject}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                        {ticket.message}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-zinc-200">{ticket.userEmail}</div>
                      {ticket.userPlan && (
                        <span className="text-[9px] uppercase font-bold text-[#2563EB] dark:text-[#3B82F6]">
                          {ticket.userPlan}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-zinc-400">
                      {new Date(ticket.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          ticket.status === "open"
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                            : ticket.status === "in_progress"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {ticket.status === "open" ? "Open" : ticket.status === "in_progress" ? "In Progress" : "Resolved"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(ticket);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                      >
                        {t("adminCopy.supportDetailReply")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-bold text-slate-900 dark:text-white shrink-0">
                  Tiket #{selectedTicket.id.slice(-6)}
                </span>
                <span className="text-xs text-slate-400 shrink-0">•</span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 truncate font-mono">
                  {selectedTicket.userEmail}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 shrink-0"
                aria-label={t("adminMisc.close")}
              >
                <Icon icon="lucide:x" className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedTicket.subject}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Dilaporkan pada {new Date(selectedTicket.created_at).toLocaleString("id-ID")}
                </p>
              </div>

              {/* Message Box */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {selectedTicket.message}
              </div>

              {/* Diagnostics context */}
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-zinc-800/70 text-[11px] space-y-1 text-slate-600 dark:text-zinc-300">
                {selectedTicket.pageUrl && (
                  <div>
                    <strong>URL Sumber:</strong>{" "}
                    <a
                      href={selectedTicket.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#3B82F6] dark:hover:text-[#60A5FA] underline"
                    >
                      {selectedTicket.pageUrl}
                    </a>
                  </div>
                )}
                {selectedTicket.userAgent && (
                  <div className="truncate">
                    <strong>Browser:</strong> {selectedTicket.userAgent}
                  </div>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 mr-2">Ubah Status:</span>
                {(["open", "in_progress", "resolved"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={updatingStatus === selectedTicket.id || selectedTicket.status === st}
                    onClick={() => handleStatusChange(selectedTicket.id, st)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                      selectedTicket.status === st
                        ? "border-[#2563EB] bg-[#2563EB] text-white"
                        : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {st === "open" ? "Open" : st === "in_progress" ? "In Progress" : "Resolved"}
                  </button>
                ))}
              </div>

              {/* Thread History */}
              {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Riwayat Balasan ({selectedTicket.replies.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedTicket.replies.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#2563EB] dark:text-[#3B82F6]">{rep.sender}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(rep.created_at).toLocaleString("id-ID")}
                          </span>
                        </div>
                        <p className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{rep.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Composer Form */}
              <form onSubmit={handleSendReply} className="space-y-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Kirim Tanggapan ke {selectedTicket.userEmail}:
                </label>
                <textarea
                  rows={3}
                  required
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={t("adminCopy.supportReplyPlaceholder")}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-400">
                    {t("adminCopy.supportReplyNote")}
                  </p>
                  <button
                    type="submit"
                    disabled={sendingReply || !replyMessage.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs shadow-[#2563EB]/25 disabled:opacity-50 transition-colors"
                  >
                    {sendingReply ? (
                      "Mengirim via Email..."
                    ) : (
                      <>
                        <span>Kirim Balasan</span>
                        <Icon icon="lucide:send" className="w-3 h-3 shrink-0 brightness-0 invert" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
