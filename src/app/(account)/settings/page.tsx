import { Suspense } from "react";
import { FiKey, FiUser } from "react-icons/fi";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { getVerifiedAccountUser } from "@/services/others/accountAccessService";
import { ROUTES } from "@/config/routes";
import ChangePasswordForm from "@/components/authComponents/ChangePasswordForm";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";
import { DataSettings, DeleteAccountSettings, PlanSettings, SessionSettings, SettingsCard } from "@/components/commonComponents/SettingsSections";

// Signed-in only, so there is no signed-out shell to validate as an instant navigation (see the account layout).
export const instant = false;

async function SettingsContent() {
  await requireRouteAccess(ROUTES.settings);
  const user = await getVerifiedAccountUser();
  const since = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-MY", { month: "long", year: "numeric" }) : null;

  return <main className="mx-auto min-h-screen max-w-3xl space-y-5 px-4 py-6 sm:px-8 sm:py-10">
    <h1 className="libre-font pb-2 text-2xl text-(--positive-tertiary) sm:text-3xl">Settings</h1>
    <SettingsCard title="Account" icon={<FiUser aria-hidden="true" />}>
      <p className="break-all text-base font-medium text-(--positive-tertiary)">{user?.email ?? "Unknown"}</p>
      {since && <p className="mt-0.5 text-sm text-foreground/60">Member since {since}</p>}
    </SettingsCard>
    <PlanSettings />
    <SettingsCard title="Password" icon={<FiKey aria-hidden="true" />}><ChangePasswordForm /></SettingsCard>
    <SessionSettings />
    <DataSettings />
    <DeleteAccountSettings />
  </main>;
}

export default function SettingsPage() {
  return <Suspense fallback={<LoadingScreen label="Loading your settings…" />}><SettingsContent /></Suspense>;
}
