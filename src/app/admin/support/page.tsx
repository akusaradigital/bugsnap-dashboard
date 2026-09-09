"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { getAdminHeaders, getAdminCache, setAdminCache } from "@/lib/admin-cache";

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
      if (!res.ok) throw new Error(json.error || "Gagal memuat tiket support.");

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
      if (!tickets.length) showToast((err as Error)?.message || "Gagal memuat tiket support", "error");
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
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui status");

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
      showToast((err as Error)?.message || "Gagal memperbarui status", "error");
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
      if (!res.ok) throw new Error(json.error || "Gagal mengirim balasan.");

      showToast(
        json.emailSent
          ? "Balasan berhasil dikirimkan via email!"
          : "Balasan tersimpan (Resend email unverified atau offline)",
        "success"
      );
      setReplyMessage("");
      loadTickets();
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Gagal mengirim balasan", "error");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>📥 Support & Bug Report Inbox</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
              Fitur 3
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Daftar feedback, keluhan, dan laporan bug pengguna masuk melalui contact widget CS.
          </p>
        </div>
        <button
          type="button"
          onClick={loadTickets}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors"
        >
          {loading ? "Menyegarkan..." : "Segarkan Inbox ⟳"}
        </button>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Tiket", value: stats.total, color: "text-slate-900 dark:text-white", border: "border-slate-200 dark:border-zinc-800" },
          { label: "Tiket Terbuka (Open)", value: stats.open, color: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-900/50" },
          { label: "Sedang Ditangani", value: stats.in_progress, color: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-900/50" },
          { label: "Selesai (Resolved)", value: stats.resolved, color: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-900/50" },
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 px-3 py-2 outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="open">Open (Terbuka)</option>
            <option value="in_progress">In Progress (Ditangani)</option>
            <option value="resolved">Resolved (Selesai)</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 px-3 py-2 outline-none"
          >
            <option value="all">Semua Kategori</option>
            <option value="bug">🐛 Laporan Bug</option>
            <option value="feature">💡 Request Fitur</option>
            <option value="other">💬 Pertanyaan Umum</option>
          </select>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Cari email, subjek, isi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
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
                    Memuat tiket support...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Belum ada tiket support yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="hover:bg-slate-50 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      {t.category === "bug" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                          🐛 BUG
                        </span>
                      )}
                      {t.category === "feature" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
                          💡 FITUR
                        </span>
                      )}
                      {t.category === "other" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                          💬 SUPPORT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {t.subject}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                        {t.message}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-zinc-200">{t.userEmail}</div>
                      {t.userPlan && (
                        <span className="text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                          {t.userPlan}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-zinc-400">
                      {new Date(t.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === "open"
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                            : t.status === "in_progress"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {t.status === "open" ? "Open" : t.status === "in_progress" ? "In Progress" : "Resolved"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(t);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                      >
                        Detail & Balas →
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
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg p-1 shrink-0"
              >
                ✕
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
                      className="text-indigo-600 dark:text-indigo-400 underline"
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
                        ? "border-indigo-600 bg-indigo-600 text-white"
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
                        className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-indigo-700 dark:text-indigo-300">{rep.sender}</span>
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
                  placeholder="Tuliskan respon resmi solusi atau klarifikasi bug ini..."
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 outline-none focus:border-indigo-500 resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-400">
                    Email balasan akan diteruskan langsung ke email pelapor melalui Resend.
                  </p>
                  <button
                    type="submit"
                    disabled={sendingReply || !replyMessage.trim()}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
                  >
                    {sendingReply ? "Mengirim via Email..." : "Kirim Balasan ✉"}
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
