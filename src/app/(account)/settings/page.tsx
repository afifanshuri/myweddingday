import { Suspense } from "react";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { getVerifiedAccountUser } from "@/services/others/accountAccessService";
import { ROUTES } from "@/config/routes";
import AccountStatus from "@/components/commonComponents/AccountStatus";
import ChangePasswordForm from "@/components/authComponents/ChangePasswordForm";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";

async function SettingsContent() {
  await requireRouteAccess(ROUTES.settings);
  const user = await getVerifiedAccountUser();

  return <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
    <header className="border-b border-(--tertiary) pb-6">
      <p className="text-xs uppercase tracking-widest text-(--positive-tertiary)">myweddingday</p>
      <h1 className="libre-font mt-3 text-3xl text-(--positive-tertiary) sm:text-4xl">Settings</h1>
    </header>
    <section aria-labelledby="settings-account" className="mt-8 rounded-xl border border-(--tertiary) bg-white p-6">
      <h2 id="settings-account" className="text-base font-semibold text-(--positive-tertiary)">Account</h2>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-foreground/60">Email</dt><dd className="break-all">{user?.email ?? "Unknown"}</dd>
        <dt className="text-foreground/60">Plan</dt><dd><AccountStatus /></dd>
      </dl>
    </section>
    <section aria-labelledby="settings-password" className="mt-6 rounded-xl border border-(--tertiary) bg-white p-6">
      <h2 id="settings-password" className="text-base font-semibold text-(--positive-tertiary)">Change password</h2>
      <ChangePasswordForm />
    </section>
  </main>;
}

export default function SettingsPage() {
  return <Suspense fallback={<LoadingScreen label="Loading your settings…" />}><SettingsContent /></Suspense>;
}
