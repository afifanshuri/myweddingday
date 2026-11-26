"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { FiAlertTriangle, FiArrowRight, FiDownload, FiKey, FiLogOut, FiMonitor, FiStar, FiUser } from "react-icons/fi";
import MainButton from "./MainButton";
import { useAccountAccess } from "./AccountAccessProvider";
import { authInputClass } from "@/components/authComponents/AuthCard";
import { APIDeleteAuthSession, APIEndAllAuthSessions } from "@/services/api/auth";
import { APIDeleteAccount } from "@/services/api/plan";
import { clearLocalPlan, flushPlan } from "@/store/planSync";
import { ROUTES, paymentRoute } from "@/config/routes";
import { PLANS } from "@/config/plans";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/config/auth";
import ChangePasswordForm from "@/components/authComponents/ChangePasswordForm";
import { useT } from "@/i18n";

const longDate = (value: string, locale: string) => new Date(value).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });

export function SettingsCard({ title, icon, children, tone = "plain" }: { title: string; icon: ReactNode; children: ReactNode; tone?: "plain" | "danger" }) {
  return <section aria-label={title}>
    <h2 className={`mb-5 flex items-center gap-2 border-b border-(--secondary) pb-4 text-lg font-semibold ${tone === "danger" ? "text-red-700" : "text-(--positive-tertiary)"}`}>{icon}{title}</h2>
    {children}
  </section>;
}

export function SettingsTitle() {
  const t = useT();
  return <h1 className="libre-font pb-2 text-2xl text-(--positive-tertiary) sm:text-3xl">{t.settings.title}</h1>;
}

/** The signed-in email, and when the account was made. */
export function AccountSettings({ email, createdAt }: { email: string | null; createdAt: string | null }) {
  const t = useT();
  const since = createdAt ? new Date(createdAt).toLocaleDateString(t.intl, { month: "long", year: "numeric" }) : null;
  return <SettingsCard title={t.settings.account} icon={<FiUser aria-hidden="true" />}>
    <p className="break-all text-base font-medium text-(--positive-tertiary)">{email ?? t.settings.unknown}</p>
    {since && <p className="mt-0.5 text-sm text-foreground/60">{t.settings.memberSince(since)}</p>}
  </SettingsCard>;
}

export function PasswordSettings() {
  const t = useT();
  return <SettingsCard title={t.settings.password} icon={<FiKey aria-hidden="true" />}><ChangePasswordForm /></SettingsCard>;
}

/** The account's plan. Plus is a one-time pass for a set period (no automatic renewal), so there's nothing to cancel. */
export function PlanSettings() {
  const { access, checking } = useAccountAccess();
  const t = useT();
  if (checking) return <SettingsCard title={t.settings.plan} icon={<FiStar aria-hidden="true" />}><p className="text-sm text-foreground/50">{t.settings.checking}</p></SettingsCard>;
  const admin = access.role === "admin";
  return <SettingsCard title={t.settings.plan} icon={<FiStar aria-hidden="true" />}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-base font-medium text-(--positive-tertiary)">{admin ? t.settings.admin : access.isPaid ? t.settings.plus : t.settings.free}</p>
        <p className="mt-0.5 text-sm text-foreground/60">
          {admin ? t.settings.adminText
            : access.isPaid ? t.settings.plusText(access.paidUntil ? longDate(access.paidUntil, t.intl) : null)
            : t.settings.freeText}
        </p>
      </div>
      {!admin && <Link href={paymentRoute(ROUTES.settings)} className="main-button main-button--primary main-button--size-small inline-flex items-center gap-2">
        {access.isPaid ? t.settings.extend : t.settings.getPlusPrice(PLANS.plus.priceMYR)} <FiArrowRight aria-hidden="true" />
      </Link>}
    </div>
  </SettingsCard>;
}

/** Sign out here, or on every device (for a lost phone or a shared computer). */
export function SessionSettings() {
  const [busy, setBusy] = useState<"here" | "everywhere" | null>(null);
  const [error, setError] = useState(false);
  const t = useT();
  async function signOut(scope: "here" | "everywhere") {
    if (busy) return;
    setBusy(scope);
    setError(false);
    try {
      await flushPlan().catch(() => undefined);
      const { error } = scope === "everywhere" ? await APIEndAllAuthSessions() : await APIDeleteAuthSession();
      if (error) throw error;
      clearLocalPlan();
      window.location.replace(ROUTES.home);
    } catch {
      setError(true);
      setBusy(null);
    }
  }
  return <SettingsCard title={t.settings.sessions} icon={<FiMonitor aria-hidden="true" />}>
    <div className="flex flex-wrap gap-3">
      <MainButton variant="secondary" size="small" disabled={!!busy} onClick={() => signOut("here")}>
        <FiLogOut aria-hidden="true" /> {busy === "here" ? t.settings.signingOut : t.settings.signOut}
      </MainButton>
      <MainButton variant="secondary" size="small" disabled={!!busy} onClick={() => signOut("everywhere")}>
        <FiMonitor aria-hidden="true" /> {busy === "everywhere" ? t.settings.signingOut : t.settings.signOutEverywhere}
      </MainButton>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{t.settings.signOutFailed}</p>}
  </SettingsCard>;
}

/** A copy of everything kept for the account, as a JSON file. */
export function DataSettings() {
  const t = useT();
  return <SettingsCard title={t.settings.data} icon={<FiDownload aria-hidden="true" />}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-foreground/60">{t.settings.dataText}</p>
      <a href="/api/account/export" download className="main-button main-button--secondary main-button--size-small inline-flex items-center gap-2">
        <FiDownload aria-hidden="true" /> {t.settings.download}
      </a>
    </div>
  </SettingsCard>;
}

/** Permanently deletes the account and everything saved with it, after the password and a typed confirmation. */
export function DeleteAccountSettings() {
  const { access } = useAccountAccess();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = useT();
  const admin = access.role === "admin";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await APIDeleteAccount(String(form.get("password") ?? ""), String(form.get("confirmation") ?? "").trim());
      clearLocalPlan();
      await APIDeleteAuthSession().catch(() => undefined);
      window.location.replace(ROUTES.home);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.settings.deleteFailed);
      setBusy(false);
    }
  }

  return <SettingsCard title={t.settings.deleteAccount} icon={<FiAlertTriangle aria-hidden="true" />} tone="danger">
    {admin ? <p className="text-sm text-foreground/60">{t.settings.adminDelete}</p>
      : !open ? <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-foreground/60">{t.settings.deleteText}</p>
        <MainButton variant="danger" size="small" onClick={() => setOpen(true)}>{t.settings.deleteAccount}</MainButton>
      </div>
      : <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/70">
          <li>{t.settings.deleteWhat}</li>
          {access.isPaid && <li>{t.settings.deletePlus}</li>}
          <li>{t.settings.deleteFinal}</li>
        </ul>
        <label className="block text-sm text-stone-700">
          {t.settings.deletePassword}
          <input type="password" name="password" autoComplete="current-password" required disabled={busy} className={authInputClass} />
        </label>
        <label className="block text-sm text-stone-700">
          {t.settings.typeToConfirmBefore}<span className="font-semibold">{DELETE_ACCOUNT_CONFIRMATION}</span>{t.settings.typeToConfirmAfter}
          <input name="confirmation" autoComplete="off" required pattern={DELETE_ACCOUNT_CONFIRMATION} disabled={busy} className={authInputClass} />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{t.errors[error] ?? error}</p>}
        <div className="flex flex-wrap gap-3">
          <MainButton type="submit" variant="danger" size="small" disabled={busy}>{busy ? t.settings.deleting : t.settings.deletePermanently}</MainButton>
          <MainButton variant="ghost" size="small" disabled={busy} onClick={() => { setOpen(false); setError(""); }}>{t.common.cancel}</MainButton>
        </div>
      </form>}
  </SettingsCard>;
}
