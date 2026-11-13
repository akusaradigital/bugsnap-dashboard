"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
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
  const { t } = useT();
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
      if (!res.ok) throw new Error(json.error || t("admin.aiLoadFailed"));

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
      showToast((err as Error)?.message || t("admin.aiLoadFailed"), "error");
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
          showToast(t("admin.aiKeyLoadFailed"), "error");
        }
      } catch (err: unknown) {
        showToast((err as Error)?.message || t("admin.aiKeyLoadFailed"), "error");
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
      showToast(t("admin.aiModelRequired"), "error");
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
        showToast(json.error || t("admin.aiPingFail"), "error");
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message || t("admin.aiPingFail");
      setPingResult({ ok: false, error: msg });
      showToast(msg, "error");
    } finally {
      setPinging(false);
    }
  }

  async function handleTestPolish() {
    if (!endpointUrl.trim() || !model.trim()) {
      showToast(t("admin.aiFillFirst"), "error");
      return;
    }
    if (!sampleDraft.trim()) {
      showToast(t("admin.aiPlaygroundEmpty"), "error");
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
        showToast(json.error || t("admin.aiPolishFailed"), "error");
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message || t("admin.aiPolishFailed");
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
      showToast(t("admin.aiModelRequired"), "error");
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
      if (!res.ok) throw new Error(json.error || t("admin.aiSaveFailed"));

      showToast(t("admin.aiSaved"), "success");
      if (json.config?.hasKey) {
        setHasStoredKey(true);
        setIsChangingKey(false);
        setShowPassword(false);
        setApiKey(json.config.apiKeyMasked || "••••••••");
      }
      setPingResult(null);
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("admin.aiSaveFailed"), "error");
    } finally {
      setSaving(false);
    }
  }

  function handleCopyPolish() {
    if (polishResult?.polishedText) {
      navigator.clipboard.writeText(polishResult.polishedText);
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 2000);
      showToast(t("admin.aiCopied"), "info");
    }
  }

  const currentPreset = PROVIDER_PRESETS.find((p) => p.id === provider);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 shadow-xs space-y-5">
      {/* Header with Brand Accent & Live Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t("admin.aiConfigTitle")}</span>
            {loading && <span className="text-[11px] text-slate-400 font-normal">{t("common.loading")}</span>}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">{t("admin.aiConfigDesc")}</p>
        </div>

        {/* Model summary & on/off switch */}
        <div className="flex items-center gap-4 self-start sm:self-auto flex-wrap">
          <span className="text-xs text-slate-600 dark:text-zinc-400" title={model}>
            {currentPreset?.name || provider}
            {model ? ` · ${model}` : ""}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              {enabled ? t("admin.aiEnabled") : t("admin.aiDisabled")}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label={t("admin.aiToggleLabel")}
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                enabled ? "bg-[#2563EB]" : "bg-slate-300 dark:bg-zinc-700"
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
            {t("aiCard.providerPreset")}
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
                      ? "bg-[#2563EB] text-white shadow-xs"
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
              <span>{t("aiCard.endpointLabel")}</span>
              <span className="text-[10px] text-slate-400">{t("aiCard.endpointHint")}</span>
            </label>
            <input
              type="url"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder={t("aiCard.endpointPlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-colors"
            />
          </div>

          {/* API Key / Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <span>{t("admin.aiApiKeyLabel")}</span>
              {hasStoredKey && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">{t("admin.aiKeyStored")}</span>
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
                    {isChangingKey ? t("common.cancel") : t("admin.aiChangeKey")}
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
                placeholder={hasStoredKey && !isChangingKey ? t("admin.aiKeyPlaceholderStored") : "sk-..."}
                disabled={hasStoredKey && !isChangingKey}
                className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={handleTogglePassword}
                disabled={revealingKey}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer disabled:opacity-50 z-10"
                title={showPassword ? t("admin.hideApiKey") : t("admin.showApiKey")}
                aria-label={showPassword ? t("admin.hideApiKey") : t("admin.showApiKey")}
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
              <span>{t("admin.aiModelLabel")}</span>
              {currentPreset?.suggestedModels && currentPreset.suggestedModels.length > 0 && (
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-[200px]">
                  {t("admin.aiModelExample")} {currentPreset.suggestedModels[0]}
                </span>
              )}
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={t("admin.aiModelPlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-colors"
            />
          </div>
        </div>

        {/* Ping Live Feedback Banner */}
        {pingResult && (
          <p
            className={`text-xs ${
              pingResult.ok ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {pingResult.ok
              ? `${t("admin.aiPingOk")}${pingResult.latencyMs !== undefined ? ` · ${pingResult.latencyMs} ms` : ""}`
              : `${t("admin.aiPingFail")}: ${pingResult.error ?? ""}`}
          </p>
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
              <span>{playgroundOpen ? t("admin.aiPlaygroundClose") : t("admin.aiPlaygroundOpen")}</span>
            </button>
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
                  <span>{t("admin.aiPinging")}</span>
                </>
              ) : (
                <span>{t("admin.aiPing")}</span>
              )}
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || pinging || testingPolish}
              className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>{t("common.saving")}</span>
                </>
              ) : (
                <span>{t("admin.aiSave")}</span>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Playground Drawer */}
        {playgroundOpen && (
          <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/50 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {t("admin.aiPlaygroundTitle")}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {t("admin.aiPlaygroundDesc")}
                </p>
              </div>

              {/* Sample inputs as plain text links */}
              <div className="flex items-center gap-3 flex-wrap text-[11px]">
                <span className="text-slate-500 dark:text-zinc-400">{t("admin.aiSamplesLabel")}</span>
                {SAMPLE_NOTES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSampleDraft(sample)}
                    className="font-semibold text-slate-700 hover:text-[#2563EB] dark:text-zinc-300 dark:hover:text-[#3B82F6] cursor-pointer"
                    title={sample}
                  >
                    {idx + 1}
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
                placeholder={t("admin.aiPlaygroundPlaceholder")}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-colors"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">{t("admin.aiPlaygroundHint")}</span>
                <button
                  type="button"
                  onClick={handleTestPolish}
                  disabled={testingPolish || !sampleDraft.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {testingPolish ? t("admin.aiPolishing") : t("admin.aiPolishRun")}
                </button>
              </div>
            </div>

            {/* Output Result Box */}
            {polishResult && (
              <div
                className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                  polishResult.ok
                    ? "bg-white dark:bg-zinc-900 border-[#2563EB]/40 text-slate-900 dark:text-zinc-100 shadow-xs"
                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-[11px] ${polishResult.ok ? "text-slate-700 dark:text-zinc-300" : "text-rose-600 dark:text-rose-400"}`}>
                    {polishResult.ok ? t("admin.aiPolishResult") : t("admin.aiPolishFailed")}
                  </span>
                  {polishResult.latencyMs !== undefined && (
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">{polishResult.latencyMs} ms</span>
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
                        className="text-[11px] font-semibold text-[#2563EB] dark:text-[#3B82F6] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Icon icon={copiedResult ? "lucide:check" : "lucide:copy"} className="w-3 h-3" />
                        <span>{copiedResult ? t("admin.aiCopiedShort") : t("admin.aiCopy")}</span>
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
