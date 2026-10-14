"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { getAdminHeaders } from "@/lib/admin-cache";
import { Icon } from "@/lib/iconify";

interface ProviderPreset {
  id: string;
  name: string;
  endpointUrl: string;
  defaultModel: string;
  suggestedModels: string[];
}

const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "akusara",
    name: "Akusara Router",
    endpointUrl: "https://router.akusaraproject.my.id/v1/chat/completions",
    defaultModel: "free",
    suggestedModels: ["free", "qwen-2.5-72b", "llama-3.3-70b", "deepseek-v3"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    endpointUrl: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "qwen/qwen-2.5-72b-instruct",
    suggestedModels: [
      "qwen/qwen-2.5-72b-instruct",
      "meta-llama/llama-3.3-70b-instruct",
      "google/gemma-2-27b-it",
      "anthropic/claude-3.5-haiku",
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    endpointUrl: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o-mini",
    suggestedModels: ["gpt-4o-mini", "gpt-4o"],
  },
  {
    id: "groq",
    name: "Groq",
    endpointUrl: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.3-70b-versatile",
    suggestedModels: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
  },
  {
    id: "custom",
    name: "Custom OpenAI-Compatible",
    endpointUrl: "https://",
    defaultModel: "",
    suggestedModels: [],
  },
];

interface PingResult {
  ok: boolean;
  latencyMs?: number;
  model?: string;
  sampleReply?: string;
  error?: string;
}

interface PolishTestResult {
  ok: boolean;
  latencyMs?: number;
  model?: string;
  polishedText?: string;
  error?: string;
}

const SAMPLE_NOTES = [
  "tombol checkout ga bisa diklik pas pake kupon diskon",
  "gambar thumbnail broken dan pecah saat ganti resolusi ke mobile",
  "login google loading terus gak ada respon error",
];

export function AdminAiConfigCard() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [testingPolish, setTestingPolish] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [revealingKey, setRevealingKey] = useState(false);
  const [isChangingKey, setIsChangingKey] = useState(false);

  const [provider, setProvider] = useState("akusara");
  const [endpointUrl, setEndpointUrl] = useState("https://router.akusaraproject.my.id/v1/chat/completions");
  const [apiKey, setApiKey] = useState("");
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [model, setModel] = useState("free");
  const [enabled, setEnabled] = useState(true);

  // Live diagnostic results
  const [pingResult, setPingResult] = useState<PingResult | null>(null);

  // Playground state
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [sampleDraft, setSampleDraft] = useState(SAMPLE_NOTES[0]);
  const [polishResult, setPolishResult] = useState<PolishTestResult | null>(null);
  const [copiedResult, setCopiedResult] = useState(false);

  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/ai-config", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat konfigurasi AI");

      if (json.config) {
        setProvider(json.config.provider || "akusara");
        setEndpointUrl(json.config.endpointUrl || "https://router.akusaraproject.my.id/v1/chat/completions");
        setModel(json.config.model || "free");
        setEnabled(json.config.enabled !== false);
        setHasStoredKey(json.config.hasKey);
        if (json.config.hasKey) {
          setApiKey(json.config.apiKeyMasked || "••••••••");
        }
      }
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Gagal memuat konfigurasi AI", "error");
    } finally {
      setLoading(false);
    }
  }

  function handlePresetChange(presetId: string) {
    setProvider(presetId);
    const preset = PROVIDER_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setEndpointUrl(preset.endpointUrl);
      if (preset.defaultModel) {
        setModel(preset.defaultModel);
      }
    }
    setPingResult(null);
    setPolishResult(null);
    setShowPassword(false);
  }

  async function handleTogglePassword() {
    if (showPassword) {
      setShowPassword(false);
      return;
    }

    // If key contains masked bullets and is stored in DB, fetch the unmasked key from backend
    if (apiKey.includes("••••") && hasStoredKey) {
      setRevealingKey(true);
      try {
        const headers = await getAdminHeaders();
        const res = await fetch("/api/admin/ai-config", {
          method: "POST",
          headers,
          body: JSON.stringify({ action: "reveal_key" }),
        });
        const json = await res.json();
        if (json.ok && json.apiKey) {
          setApiKey(json.apiKey);
          setShowPassword(true);
        } else {
          showToast("Gagal memuat API Key tersimpan", "error");
        }
      } catch (err: unknown) {
        showToast((err as Error)?.message || "Gagal memuat API Key", "error");
      } finally {
        setRevealingKey(false);
      }
      return;
    }

    setShowPassword(true);
  }

  async function handlePing() {
    if (!endpointUrl.trim()) {
      showToast("URL Endpoint tidak boleh kosong", "error");
      return;
    }
    if (!model.trim()) {
      showToast("Nama model tidak boleh kosong", "error");
      return;
    }

    setPinging(true);
    setPingResult(null);

    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/ai-config", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "ping",
          config: {
            provider,
            endpointUrl: endpointUrl.trim(),
            apiKey: apiKey.trim(),
            model: model.trim(),
          },
        }),
      });

      const json = await res.json();
      setPingResult(json);

      if (json.ok) {
        showToast(`Terhubung! Latensi: ${json.latencyMs}ms (${json.model})`, "success");
      } else {
        showToast(json.error || "Ping gagal terhubung", "error");
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Ping gagal terhubung";
      setPingResult({ ok: false, error: msg });
      showToast(msg, "error");
    } finally {
      setPinging(false);
    }
  }

  async function handleTestPolish() {
    if (!endpointUrl.trim() || !model.trim()) {
      showToast("Lengkapi Endpoint dan Model terlebih dahulu", "error");
      return;
    }
    if (!sampleDraft.trim()) {
      showToast("Ketik catatan uji coba terlebih dahulu", "error");
      return;
    }

    setTestingPolish(true);
    setPolishResult(null);

    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/ai-config", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "test_polish",
          config: {
            provider,
            endpointUrl: endpointUrl.trim(),
            apiKey: apiKey.trim(),
            model: model.trim(),
          },
          sampleText: sampleDraft.trim(),
        }),
      });

      const json = await res.json();
      setPolishResult(json);

      if (json.ok) {
        showToast(`AI Polish sukses! (${json.latencyMs}ms)`, "success");
      } else {
        showToast(json.error || "Gagal menguji AI Polish", "error");
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Gagal menguji AI Polish";
      setPolishResult({ ok: false, error: msg });
      showToast(msg, "error");
    } finally {
      setTestingPolish(false);
    }
  }

  async function handleSave() {
    if (!endpointUrl.trim()) {
      showToast("URL Endpoint wajib diisi", "error");
      return;
    }
    if (!model.trim()) {
      showToast("Nama model wajib diisi", "error");
      return;
    }

    setSaving(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/ai-config", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "save",
          config: {
            provider,
            endpointUrl: endpointUrl.trim(),
            apiKey: apiKey.trim(),
            model: model.trim(),
            enabled,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan konfigurasi AI");

      showToast("Konfigurasi AI berhasil disimpan", "success");
      if (json.config?.hasKey) {
        setHasStoredKey(true);
        setIsChangingKey(false);
        setShowPassword(false);
        setApiKey(json.config.apiKeyMasked || "••••••••");
      }
      setPingResult(null);
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Gagal menyimpan konfigurasi AI", "error");
    } finally {
      setSaving(false);
    }
  }

  function handleCopyPolish() {
    if (polishResult?.polishedText) {
      navigator.clipboard.writeText(polishResult.polishedText);
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 2000);
      showToast("Hasil Polish berhasil disalin", "info");
    }
  }

  const currentPreset = PROVIDER_PRESETS.find((p) => p.id === provider);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 shadow-xs space-y-5">
      {/* Header with Brand Accent & Live Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-[#89BD49]/15 text-[#6B9A35] dark:text-[#A8D666]">
              <Icon icon="lucide:sparkles" className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>AI Polish &amp; Model Provider Settings</span>
              {loading && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-normal">
                  <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  <span>Memuat...</span>
                </span>
              )}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-[#89BD49]/10 text-[#6B9A35] dark:text-[#A8D666] border border-[#89BD49]/20">
              Extension ✨ AI Polish
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Konfigurasi model AI untuk fitur ✨ AI Polish di extension Chrome. Ubah model &amp; endpoint kapan saja tanpa perlu redeploy.
          </p>
        </div>

        {/* Live Model Indicator & Status Toggle */}
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
            <span
              className={`w-2 h-2 rounded-full ${
                enabled
                  ? pingResult?.ok
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-[#89BD49]"
                  : "bg-slate-400"
              }`}
            />
            <span className="font-semibold">{currentPreset?.name || provider}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 dark:text-zinc-400 truncate max-w-[130px]" title={model}>
              {model || "no-model"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              {enabled ? "Aktif" : "Nonaktif"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label="Toggle status aktif model AI"
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                enabled ? "bg-[#89BD49]" : "bg-slate-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Provider Preset Selector Pills */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            Provider Preset
          </label>
          <div className="flex flex-wrap gap-2">
            {PROVIDER_PRESETS.map((p) => {
              const isSelected = provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetChange(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#89BD49] text-white shadow-xs"
                      : "bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Fields: Grid of 2 cols */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Endpoint URL */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
              <span>API Endpoint URL</span>
              <span className="text-[10px] text-slate-400">OpenAI-compatible /v1/chat/completions</span>
            </label>
            <input
              type="url"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#89BD49]/30 focus:border-[#89BD49] transition-colors"
            />
          </div>

          {/* API Key / Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <span>API Key / Password</span>
              {hasStoredKey && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Icon icon="lucide:check-circle-2" className="w-3 h-3" />
                    <span>Tersimpan di DB</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isChangingKey) {
                        setIsChangingKey(false);
                        setShowPassword(false);
                        setApiKey("••••••••");
                      } else {
                        setIsChangingKey(true);
                        setShowPassword(true);
                        setApiKey("");
                      }
                    }}
                    className="text-[10px] font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
                  >
                    {isChangingKey ? "Batal" : "Ganti Key"}
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  if (!isChangingKey && hasStoredKey) setIsChangingKey(true);
                }}
                placeholder={hasStoredKey && !isChangingKey ? "•••••••• (Klik 'Ganti Key' untuk mengubah)" : "sk-..."}
                disabled={hasStoredKey && !isChangingKey}
                className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#89BD49]/30 focus:border-[#89BD49] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={handleTogglePassword}
                disabled={revealingKey}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer disabled:opacity-50 z-10"
                title={showPassword ? "Sembunyikan" : "Tampilkan"}
              >
                {revealingKey ? (
                  <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <Icon icon={showPassword ? "lucide:eye-off" : "lucide:eye"} className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Model Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Model Identifier</span>
              {currentPreset?.suggestedModels && currentPreset.suggestedModels.length > 0 && (
                <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                  Contoh: {currentPreset.suggestedModels[0]}
                </span>
              )}
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o-mini, qwen/qwen-2.5-72b-instruct, etc."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#89BD49]/30 focus:border-[#89BD49] transition-colors"
            />
          </div>
        </div>

        {/* Ping Live Feedback Banner */}
        {pingResult && (
          <div
            className={`p-3.5 rounded-lg border text-xs transition-all ${
              pingResult.ok
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0">
                <Icon
                  icon={pingResult.ok ? "lucide:check-circle-2" : "lucide:alert-triangle"}
                  className="w-4 h-4"
                />
              </span>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="font-bold flex items-center justify-between flex-wrap gap-2">
                  <span>{pingResult.ok ? "Ping Berhasil Terhubung!" : "Ping Gagal / Error"}</span>
                  {pingResult.latencyMs !== undefined && (
                    <span className="font-mono text-[10px] font-semibold opacity-80 px-2 py-0.5 rounded bg-white/70 dark:bg-black/30">
                      ⚡ Latensi: {pingResult.latencyMs}ms
                    </span>
                  )}
                </div>
                {pingResult.ok ? (
                  <div className="text-[11px] opacity-90 space-y-1">
                    <div>
                      Model <strong className="font-mono">{pingResult.model}</strong> merespons dengan normal.
                    </div>
                    {pingResult.sampleReply && (
                      <div className="font-mono text-[10px] bg-white/70 dark:bg-black/25 p-2 rounded truncate border border-emerald-200 dark:border-emerald-800/40">
                        Response: {pingResult.sampleReply}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] font-mono break-all opacity-90">
                    {pingResult.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons: Playground Toggle, Ping, & Save */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPlaygroundOpen(!playgroundOpen)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                playgroundOpen
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
                  : "bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700"
              }`}
            >
              <Icon icon="lucide:flask-conical" className="w-3.5 h-3.5" />
              <span>{playgroundOpen ? "Tutup Playground" : "🧪 Playground Test Polish"}</span>
              <Icon
                icon={playgroundOpen ? "lucide:chevron-up" : "lucide:chevron-down"}
                className="w-3 h-3 text-slate-400"
              />
            </button>
            <span className="hidden md:inline text-[11px] text-slate-400">
              Disimpan di tabel <code className="font-mono">app_settings</code>
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {/* Ping / Test Button */}
            <button
              type="button"
              onClick={handlePing}
              disabled={pinging || saving || testingPolish}
              className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {pinging ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                  <span>Pinging Model...</span>
                </>
              ) : (
                <>
                  <Icon icon="lucide:zap" className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ping &amp; Test Connection</span>
                </>
              )}
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || pinging || testingPolish}
              className="px-4 py-2 rounded-lg bg-[#89BD49] hover:bg-[#7ba941] text-slate-900 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Icon icon="lucide:save" className="w-3.5 h-3.5" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Playground Drawer */}
        {playgroundOpen && (
          <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/50 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Icon icon="lucide:sparkles" className="w-3.5 h-3.5 text-[#89BD49]" />
                  <span>Playground: Uji Coba Respon Polish Langsung</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Uji instruksi sistem dan ketepatan bahasa model terhadap catatan bug kasar secara real-time.
                </p>
              </div>

              {/* Sample Quick Preset Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-semibold">Contoh:</span>
                {SAMPLE_NOTES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSampleDraft(sample)}
                    className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:border-[#89BD49] transition-colors cursor-pointer truncate max-w-[150px]"
                    title={sample}
                  >
                    Contoh {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Note Area */}
            <div className="space-y-1.5">
              <textarea
                rows={2}
                value={sampleDraft}
                onChange={(e) => setSampleDraft(e.target.value)}
                placeholder="Ketik catatan kasar bug di sini (misal: tombol ga bisa diklik pas mobile)..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#89BD49]/30 focus:border-[#89BD49] transition-colors"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Model akan otomatis mendeteksi bahasa input dan menyusun ringkasan profesional.
                </span>
                <button
                  type="button"
                  onClick={handleTestPolish}
                  disabled={testingPolish || !sampleDraft.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-[#89BD49] hover:bg-[#7aa841] text-slate-900 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {testingPolish ? (
                    <>
                      <span className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span>Memproses Polish...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:play" className="w-3 h-3" />
                      <span>Uji Polish</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Output Result Box */}
            {polishResult && (
              <div
                className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                  polishResult.ok
                    ? "bg-white dark:bg-zinc-900 border-[#89BD49]/40 text-slate-900 dark:text-zinc-100 shadow-xs"
                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    <Icon
                      icon={polishResult.ok ? "lucide:check" : "lucide:alert-triangle"}
                      className={`w-3.5 h-3.5 ${polishResult.ok ? "text-[#89BD49]" : "text-rose-500"}`}
                    />
                    <span>{polishResult.ok ? "Hasil AI Polish:" : "Gagal Memproses"}</span>
                  </div>
                  {polishResult.latencyMs !== undefined && (
                    <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                      ⚡ {polishResult.latencyMs}ms
                    </span>
                  )}
                </div>

                {polishResult.ok ? (
                  <div className="space-y-2">
                    <p className="text-xs leading-relaxed text-slate-800 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 font-medium">
                      {polishResult.polishedText}
                    </p>
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={handleCopyPolish}
                        className="text-[11px] font-semibold text-[#6B9A35] dark:text-[#A8D666] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Icon icon={copiedResult ? "lucide:check" : "lucide:copy"} className="w-3 h-3" />
                        <span>{copiedResult ? "Tersalin!" : "Salin Hasil"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] font-mono break-all">{polishResult.error}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
