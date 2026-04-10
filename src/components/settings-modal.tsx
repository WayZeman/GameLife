"use client";

import { Loader2, LogOut, Settings, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SettingsProfile = {
  name: string;
  age: number;
  category: string;
  interests: string;
  mainGoal: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  profile: SettingsProfile;
};

export function SettingsModal({ open, onClose, profile }: Props) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(String(profile.age));
  const [category, setCategory] = useState(profile.category);
  const [interests, setInterests] = useState(profile.interests);
  const [mainGoal, setMainGoal] = useState(profile.mainGoal);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const prevOpen = useRef(open);

  useEffect(() => {
    if (open && !prevOpen.current) {
      setSavedFlash(false);
    }
    prevOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setName(profile.name);
    setAge(String(profile.age));
    setCategory(profile.category);
    setInterests(profile.interests);
    setMainGoal(profile.mainGoal);
    setError(null);
  }, [open, profile]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: name.trim(),
          age: Number(age),
          category: category.trim(),
          interests: interests.trim(),
          mainGoal: mainGoal.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Не вдалося зберегти");
      setSavedFlash(true);
      router.refresh();
      window.setTimeout(() => setSavedFlash(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка збереження");
    } finally {
      setSaving(false);
    }
  }, [name, age, category, interests, mainGoal, router]);

  async function handleLogout() {
    setLoggingOut(true);
    setError(null);
    try {
      await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
      onClose();
      router.push("/");
      router.refresh();
    } catch {
      setError("Не вдалося вийти. Спробуй ще раз.");
    } finally {
      setLoggingOut(false);
    }
  }

  if (!open) return null;

  const inputClass =
    "w-full rounded-2xl border border-black/[0.08] bg-white/80 px-4 py-3 text-base text-[rgb(var(--fg))] " +
    "placeholder:text-black/35 focus:border-[rgb(var(--accent))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/25 " +
    "dark:border-white/10 dark:bg-black/20 dark:placeholder:text-white/35 sm:text-[15px]";

  return (
    <div
      className="fixed inset-0 z-[95] flex flex-col items-stretch justify-end p-0 sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Закрити"
      />
      <div
        className={cn(
          "glass-modal relative z-10 flex h-[100dvh] max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden animate-fade-in sm:h-auto sm:max-h-[min(92vh,880px)]",
          "rounded-none sm:rounded-2xl"
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-black/[0.06] px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] dark:border-white/10 sm:px-5 sm:pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgb(var(--accent))]/15">
              <Settings className="h-5 w-5 text-[rgb(var(--accent))]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-lg font-semibold tracking-tight">
                Налаштування
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[rgb(var(--muted))] transition hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Закрити"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="settings-name" className="mb-2 block text-sm font-medium">
                Ім&apos;я / нік
              </label>
              <input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="nickname"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="settings-age" className="mb-2 block text-sm font-medium">
                Вік
              </label>
              <input
                id="settings-age"
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="settings-category" className="mb-2 block text-sm font-medium">
                Чим займаєшся / категорія
              </label>
              <input
                id="settings-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                maxLength={120}
                placeholder="Наприклад: навчаюсь у виші, працюю в IT, служба…"
                autoComplete="organization-title"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-[rgb(var(--muted))]">
                Напиши своїми словами — не обов’язково з готового списку.
              </p>
            </div>
            <div>
              <label htmlFor="settings-interests" className="mb-2 block text-sm font-medium">
                Інтереси
              </label>
              <textarea
                id="settings-interests"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                rows={3}
                className={cn(inputClass, "resize-none")}
              />
            </div>
            <div>
              <label htmlFor="settings-goal" className="mb-2 block text-sm font-medium">
                Головна ціль
              </label>
              <textarea
                id="settings-goal"
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value)}
                rows={3}
                className={cn(inputClass, "resize-none")}
              />
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          {savedFlash ? (
            <p className="mt-4 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Збережено
            </p>
          ) : null}

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="mt-6 w-full rounded-2xl bg-[rgb(var(--accent))] py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:opacity-95 disabled:opacity-50 sm:text-[15px]"
          >
            {saving ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Збереження…
              </span>
            ) : (
              "Зберегти зміни"
            )}
          </button>
        </div>

        <div className="shrink-0 border-t border-black/[0.06] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-white/10 sm:px-5 sm:pb-4">
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
            className={cn(
              "flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/[0.06] py-3 text-base font-semibold text-red-700 transition hover:bg-red-500/10 dark:text-red-300",
              "disabled:opacity-50"
            )}
          >
            {loggingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" strokeWidth={1.75} />
            )}
            Вийти з акаунту
          </button>
        </div>
      </div>
    </div>
  );
}
